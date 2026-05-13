const TASK_TTL_SECONDS = 60 * 60 * 24 * 30;
const TASK_INDEX_KEY = "tasks:index";
const TASK_INDEX_LIMIT = 500;

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
    },
  });
}

function cleanTraceId(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
}

function cleanText(value, limit = 1000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, limit);
}

function cleanInteger(value, fallback = 1, min = 1, max = 99) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

async function hmacSha256(key, value) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value)));
}

function hex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyTelegramInitData(initData, env) {
  const token = env.TELEGRAM_BOT_TOKEN || env.COSTIQ_TELEGRAM_BOT_TOKEN || "";
  const raw = cleanText(initData, 5000);
  if (!raw) {
    return { ok: false, skipped: "empty" };
  }
  if (!token) {
    return { ok: false, error: "bot_token_missing" };
  }
  const params = new URLSearchParams(raw);
  const providedHash = params.get("hash") || "";
  if (!providedHash) {
    return { ok: false, error: "hash_missing" };
  }
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join("\n");
  const secret = await hmacSha256(new TextEncoder().encode("WebAppData"), token);
  const expectedHash = hex(await hmacSha256(secret, dataCheckString));
  if (expectedHash !== providedHash) {
    return { ok: false, error: "hash_mismatch" };
  }
  let user = null;
  try {
    user = JSON.parse(params.get("user") || "{}");
  } catch (error) {
    user = null;
  }
  const id = Number(user && user.id);
  return Number.isFinite(id) ? { ok: true, user: { id } } : { ok: false, error: "user_missing" };
}

async function canReview(request, env, task) {
  if (!task.telegram_user || !task.telegram_user.id) {
    return true;
  }
  const initData = request.headers.get("X-Telegram-Init-Data") || "";
  const auth = await verifyTelegramInitData(initData, env);
  return Boolean(auth.ok && Number(auth.user.id) === Number(task.telegram_user.id));
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

function publicTask(task) {
  const { attachment, telegram_user, telegram_auth_date, retry_after, processing_started_at, processing_finished_at, ...safeTask } = task;
  if (attachment) {
    safeTask.attachment_status = task.attachment_status || "stored";
  }
  if (Array.isArray(safeTask.result_files)) {
    safeTask.result_files = safeTask.result_files.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      created_at: file.created_at,
      url: `/api/panel/task/${encodeURIComponent(task.trace_id)}/result-file/${encodeURIComponent(file.id)}`,
    }));
  }
  if (safeTask.result_archive && safeTask.result_archive.id) {
    safeTask.result_archive = {
      id: safeTask.result_archive.id,
      name: safeTask.result_archive.name,
      type: safeTask.result_archive.type,
      size: safeTask.result_archive.size,
      created_at: safeTask.result_archive.created_at,
      url: `/api/panel/task/${encodeURIComponent(task.trace_id)}/result-archive`,
    };
  }
  return safeTask;
}

function nextState(action) {
  if (action === "accept_result") {
    return "accepted";
  }
  if (action === "ask_question") {
    return "question_requested";
  }
  if (action === "request_revision") {
    return "revision_requested";
  }
  return "";
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
    payload = await request.json();
  } catch (error) {
    return jsonResponse({ ok: false, error: "invalid_payload" }, 400);
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
  if (!(await canReview(request, env, task))) {
    return jsonResponse({ ok: false, error: "telegram_auth_required" }, 401);
  }

  const action = cleanText(payload.action, 40);
  const status = nextState(action);
  if (!status) {
    return jsonResponse({ ok: false, error: "invalid_action" }, 400);
  }
  const currentStatus = cleanText(task.status, 40).toLowerCase();
  if (!["done", "ready_for_review", "question_requested", "revision_requested"].includes(currentStatus)) {
    return jsonResponse({ ok: false, error: "review_not_available" }, 409);
  }
  const text = cleanText(payload.text, 2000);
  if ((action === "ask_question" || action === "request_revision") && !text) {
    return jsonResponse({ ok: false, error: "comment_required" }, 400);
  }

  const now = new Date().toISOString();
  const currentReview = task.review && typeof task.review === "object" && !Array.isArray(task.review) ? task.review : {};
  const version = cleanInteger(task.result_version || currentReview.current_version, 1, 1, 99);
  const event = {
    type: status,
    version,
    author: "user",
    text,
    created_at: now,
  };
  const events = [...(Array.isArray(currentReview.events) ? currentReview.events : []), event].slice(-50);
  const review = {
    state: status,
    current_version: version,
    accepted_at: status === "accepted" ? now : cleanText(currentReview.accepted_at, 80),
    closed_at: cleanText(currentReview.closed_at, 80),
    events,
  };
  const updatedTask = {
    ...task,
    status,
    review,
    review_action: action,
    review_comment: text,
    updated_at: now,
  };

  await env.WEB_INTAKE.put(`task:${traceId}`, JSON.stringify(updatedTask), {
    expirationTtl: TASK_TTL_SECONDS,
  });
  await upsertTaskIndex(env, updatedTask);

  return jsonResponse({ ok: true, task: publicTask(updatedTask) });
}
