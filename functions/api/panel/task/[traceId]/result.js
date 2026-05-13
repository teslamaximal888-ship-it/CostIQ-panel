function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-CostIQ-Admin",
    },
  });
}

function cleanTraceId(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
}

function cleanText(value, limit = 4000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, limit);
}

function cleanInteger(value, fallback = 0, min = 0, max = 99) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

const TASK_TTL_SECONDS = 60 * 60 * 24 * 30;
const TASK_INDEX_KEY = "tasks:index";
const TASK_INDEX_LIMIT = 500;
const REVIEW_STATUSES = new Set(["ready_for_review", "question_requested", "revision_requested", "reworking", "accepted", "closed", "closed_by_timeout"]);
const FINISHED_STATUSES = new Set(["done", "ready_for_review", "failed", "accepted", "closed", "closed_by_timeout"]);

async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

const BRIDGE_ADMIN_TOKEN_SHA256 = "4114f8b668ea37337c30b5b92f78a91d9739435330e71dbba6472188e9368126";

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hasAdminAccess(request, env, payload) {
  const provided = cleanText(request.headers.get("X-CostIQ-Admin") || payload.admin_key || "", 500);
  const allowed = cleanText(env.COSTIQ_PANEL_ADMIN_TOKEN || "", 500);
  if (provided && allowed && provided === allowed) {
    return true;
  }
  return Boolean(provided && (await sha256Hex(provided)) === BRIDGE_ADMIN_TOKEN_SHA256);
}

async function upsertTaskIndex(env, task) {
  let index = [];
  try {
    const raw = await env.WEB_INTAKE.get(TASK_INDEX_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    index = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    index = [];
  }
  const traceId = cleanText(task.trace_id, 100);
  if (!traceId) {
    return;
  }
  const entry = {
    trace_id: traceId,
    created_at: cleanText(task.created_at, 80),
    updated_at: cleanText(task.updated_at || task.created_at, 80),
  };
  const nextIndex = [entry, ...index.filter((item) => item && item.trace_id !== traceId)].slice(0, TASK_INDEX_LIMIT);
  await env.WEB_INTAKE.put(TASK_INDEX_KEY, JSON.stringify(nextIndex), {
    expirationTtl: TASK_TTL_SECONDS,
  });
}

function cleanStatus(value, fallback = "done") {
  return cleanText(value, 40).toLowerCase() || fallback;
}

function cleanStringArray(value, limit = 8) {
  if (Array.isArray(value)) {
    return value.map((item) => cleanText(item, 500)).filter(Boolean).slice(0, limit);
  }
  const text = cleanText(value, 2000);
  return text ? [text] : [];
}

function normalizeReview(task, status, now) {
  const current = task.review && typeof task.review === "object" && !Array.isArray(task.review) ? task.review : {};
  const version = cleanInteger(task.result_version || current.current_version, 1, 1, 99);
  const events = Array.isArray(current.events) ? current.events.slice(0, 50) : [];
  const review = {
    state: REVIEW_STATUSES.has(status) ? status : current.state || "",
    current_version: version,
    accepted_at: cleanText(current.accepted_at, 80),
    closed_at: cleanText(current.closed_at, 80),
    events,
  };
  if (status === "ready_for_review") {
    review.state = "ready_for_review";
  }
  if (status === "accepted") {
    review.state = "accepted";
    review.accepted_at = review.accepted_at || now;
  }
  if (status === "closed" || status === "closed_by_timeout") {
    review.state = status;
    review.closed_at = review.closed_at || now;
  }
  return review;
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }

  const traceId = cleanTraceId(params.traceId);
  if (!traceId) {
    return jsonResponse({ ok: false, error: "trace_required" }, 400);
  }

  let payload;
  try {
    payload = await parsePayload(request);
  } catch (error) {
    return jsonResponse({ ok: false, error: "invalid_payload" }, 400);
  }

  if (!(await hasAdminAccess(request, env, payload))) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const raw = await env.WEB_INTAKE.get(`task:${traceId}`);
  if (!raw) {
    return jsonResponse({ ok: false, error: "task_not_found" }, 404);
  }

  let task;
  try {
    task = JSON.parse(raw);
  } catch (error) {
    return jsonResponse({ ok: false, error: "task_corrupted" }, 500);
  }

  const status = cleanStatus(payload.status, "done");
  const allowedStatuses = new Set(["created", "queued", "in_progress", "retry", "failed", "done", ...REVIEW_STATUSES]);
  if (!allowedStatuses.has(status)) {
    return jsonResponse({ ok: false, error: "invalid_status" }, 400);
  }
  const resultProvided = payload.result !== undefined;
  const result = cleanText(payload.result, 4000);
  if (!result && !["created", "queued", "in_progress", "retry", "question_requested", "revision_requested", "reworking", "accepted", "closed", "closed_by_timeout"].includes(status)) {
    return jsonResponse({ ok: false, error: "result_required" }, 400);
  }
  const errorText = cleanText(payload.error_text, 1400);
  const retryAfter = cleanText(payload.retry_after, 80);
  const attempts = payload.attempts === undefined ? cleanInteger(task.attempts, 0, 0, 99) : cleanInteger(payload.attempts, 0, 0, 99);
  const maxAttempts = payload.max_attempts === undefined ? cleanInteger(task.max_attempts, 3, 1, 99) : cleanInteger(payload.max_attempts, 3, 1, 99);
  const resultVersion = payload.result_version === undefined ? cleanInteger(task.result_version, 1, 1, 99) : cleanInteger(payload.result_version, 1, 1, 99);
  const now = new Date().toISOString();

  const updatedTask = {
    ...task,
    status,
    result: resultProvided ? result : task.result || "",
    summary: cleanText(payload.summary, 1000) || task.summary || "",
    result_text: cleanText(payload.result_text, 4000) || task.result_text || "",
    warnings: payload.warnings === undefined ? (Array.isArray(task.warnings) ? task.warnings : []) : cleanStringArray(payload.warnings),
    review_hint: cleanText(payload.review_hint, 1000) || task.review_hint || "",
    result_version: resultVersion,
    review: normalizeReview({ ...task, result_version: resultVersion }, status, now),
    attempts,
    max_attempts: maxAttempts,
    retry_after: retryAfter,
    error_text: errorText,
    processing_started_at:
      payload.processing_started_at === undefined
        ? status === "in_progress"
          ? task.processing_started_at || now
          : task.processing_started_at || ""
        : cleanText(payload.processing_started_at, 80),
    processing_finished_at:
      payload.processing_finished_at === undefined
        ? FINISHED_STATUSES.has(status)
          ? now
          : task.processing_finished_at || ""
        : cleanText(payload.processing_finished_at, 80),
    updated_at: now,
  };

  await env.WEB_INTAKE.put(`task:${traceId}`, JSON.stringify(updatedTask), {
    expirationTtl: TASK_TTL_SECONDS,
  });
  await upsertTaskIndex(env, updatedTask);

  return jsonResponse({ ok: true, task: updatedTask });
}
