import {
  REVIEW_STATUSES,
  appendLifecycleEvent,
  isTaskFinished,
  normalizeTaskStatus,
  transitionTaskStatus,
} from "../../_shared/task-lifecycle.js";

const RESULT_TTL_SECONDS = 60 * 60 * 24 * 30;
const TASK_INDEX_KEY = "tasks:index";
const TASK_INDEX_LIMIT = 500;

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

function cleanText(value, limit = 500) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, limit);
}

const RESULT_TEXT_LIMIT = 50000;

function cleanInteger(value, fallback = 0, min = 0, max = 99) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

function safeFileName(value) {
  const base = cleanText(value, 220) || "result-file";
  return base.replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "_").slice(0, 180) || "result-file";
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
    expirationTtl: RESULT_TTL_SECONDS,
  });
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
  const review = {
    state: REVIEW_STATUSES.has(status) ? status : current.state || "",
    current_version: version,
    accepted_at: cleanText(current.accepted_at, 80),
    closed_at: cleanText(current.closed_at, 80),
    events: Array.isArray(current.events) ? current.events.slice(0, 50) : [],
  };
  if (status === "ready_for_review") {
    review.state = "ready_for_review";
  }
  return review;
}

async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return null;
  }
  return request.formData();
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestPost({ request, env, params }) {
  const bucket = env.WEB_RESULTS || env.WEB_ATTACHMENTS;
  if (!env.WEB_INTAKE || !bucket) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }

  const traceId = cleanTraceId(params.traceId);
  if (!traceId) {
    return jsonResponse({ ok: false, error: "trace_required" }, 400);
  }

  let formData;
  try {
    formData = await parsePayload(request);
  } catch (error) {
    return jsonResponse({ ok: false, error: "invalid_payload" }, 400);
  }
  if (!formData) {
    return jsonResponse({ ok: false, error: "multipart_required" }, 400);
  }

  const payload = Object.fromEntries(formData.entries());
  if (!(await hasAdminAccess(request, env, payload))) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const file = formData.get("file");
  if (!file || typeof file !== "object" || typeof file.size !== "number" || file.size <= 0) {
    return jsonResponse({ ok: false, error: "file_required" }, 400);
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

  const now = new Date().toISOString();
  const name = safeFileName(formData.get("name") || file.name);
  const fileId = cleanText(formData.get("file_id"), 80).replace(/[^a-zA-Z0-9_-]/g, "") || `file_${crypto.randomUUID().slice(0, 8)}`;
  const isArchive = ["1", "true", "yes"].includes(cleanText(formData.get("archive"), 10).toLowerCase());
  const key = `results/${traceId}/${fileId}-${name}`;
  await bucket.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
      contentDisposition: `attachment; filename="${name.replace(/"/g, "")}"`,
    },
    customMetadata: {
      trace_id: traceId,
      file_id: fileId,
      file_name: name,
      source: "costiq-panel-result",
    },
  });

  const fileMeta = {
    id: fileId,
    storage: env.WEB_RESULTS ? "r2:WEB_RESULTS" : "r2:WEB_ATTACHMENTS",
    key,
    name,
    type: file.type || "application/octet-stream",
    size: file.size,
    created_at: now,
    expires_at: new Date(Date.now() + RESULT_TTL_SECONDS * 1000).toISOString(),
  };
  const status = normalizeTaskStatus(cleanText(formData.get("status"), 40), "ready_for_review");
  const transition = transitionTaskStatus(task, status, now, {
    by: "bridge",
    source: "result_file_api",
  });
  if (!transition.ok) {
    return jsonResponse(transition, 409);
  }
  const result = cleanText(formData.get("result"), RESULT_TEXT_LIMIT);
  const attempts = formData.get("attempts") === null ? cleanInteger(task.attempts, 0, 0, 99) : cleanInteger(formData.get("attempts"), 0, 0, 99);
  const maxAttempts = formData.get("max_attempts") === null ? cleanInteger(task.max_attempts, 3, 1, 99) : cleanInteger(formData.get("max_attempts"), 3, 1, 99);
  const resultVersion = formData.get("result_version") === null ? cleanInteger(task.result_version, 1, 1, 99) : cleanInteger(formData.get("result_version"), 1, 1, 99);

  const updatedTask = {
    ...task,
    status,
    result: result || task.result || "",
    summary: cleanText(formData.get("summary"), 1000) || task.summary || "",
    result_text: cleanText(formData.get("result_text"), RESULT_TEXT_LIMIT) || task.result_text || "",
    warnings: formData.get("warnings") === null ? (Array.isArray(task.warnings) ? task.warnings : []) : cleanStringArray(formData.get("warnings")),
    review_hint: cleanText(formData.get("review_hint"), 1000) || task.review_hint || "",
    result_version: resultVersion,
    review: normalizeReview({ ...task, result_version: resultVersion }, status, now),
    lifecycle: appendLifecycleEvent({ ...task, status }, transition.event),
    attempts,
    max_attempts: maxAttempts,
    error_text: cleanText(formData.get("error_text"), 1400),
    processing_finished_at: isTaskFinished(status) ? now : task.processing_finished_at || "",
    updated_at: now,
  };
  if (isArchive) {
    updatedTask.result_archive = fileMeta;
  } else {
    updatedTask.result_files = [...(Array.isArray(task.result_files) ? task.result_files : []), fileMeta];
  }

  await env.WEB_INTAKE.put(`task:${traceId}`, JSON.stringify(updatedTask), {
    expirationTtl: RESULT_TTL_SECONDS,
  });
  await upsertTaskIndex(env, updatedTask);

  const publicMeta = {
    id: fileMeta.id,
    name: fileMeta.name,
    type: fileMeta.type,
    size: fileMeta.size,
    created_at: fileMeta.created_at,
  };
  return jsonResponse({ ok: true, file: publicMeta, archive: isArchive, task: updatedTask });
}
