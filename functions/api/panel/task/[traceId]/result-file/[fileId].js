function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "X-CostIQ-Admin, X-Telegram-Init-Data",
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

const BRIDGE_ADMIN_TOKEN_SHA256 = "4114f8b668ea37337c30b5b92f78a91d9739435330e71dbba6472188e9368126";

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hasAdminAccess(request, env) {
  const url = new URL(request.url);
  const provided = cleanText(request.headers.get("X-CostIQ-Admin") || url.searchParams.get("admin_key") || "", 500);
  const allowed = cleanText(env.COSTIQ_PANEL_ADMIN_TOKEN || "", 500);
  if (provided && allowed && provided === allowed) {
    return true;
  }
  return Boolean(provided && (await sha256Hex(provided)) === BRIDGE_ADMIN_TOKEN_SHA256);
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
  if (!raw || !token) {
    return null;
  }
  const params = new URLSearchParams(raw);
  const providedHash = params.get("hash") || "";
  if (!providedHash) {
    return null;
  }
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join("\n");
  const secret = await hmacSha256(new TextEncoder().encode("WebAppData"), token);
  const expectedHash = hex(await hmacSha256(secret, dataCheckString));
  if (expectedHash !== providedHash) {
    return null;
  }
  try {
    const user = JSON.parse(params.get("user") || "{}");
    const id = Number(user.id);
    return Number.isFinite(id) ? { id } : null;
  } catch (error) {
    return null;
  }
}

async function canDownload(request, env, task) {
  if (await hasAdminAccess(request, env)) {
    return true;
  }
  if (!task.telegram_user || !task.telegram_user.id) {
    return true;
  }
  const url = new URL(request.url);
  const auth = await verifyTelegramInitData(request.headers.get("X-Telegram-Init-Data") || url.searchParams.get("tg_init_data") || "", env);
  return Boolean(auth && Number(auth.id) === Number(task.telegram_user.id));
}

function contentDisposition(fileName) {
  const fallback = cleanText(fileName, 180).replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "_") || "result-file";
  return `attachment; filename="${fallback.replace(/"/g, "")}"`;
}

async function readTask(env, traceId) {
  const raw = await env.WEB_INTAKE.get(`task:${traceId}`);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw);
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env, params }) {
  const bucket = env.WEB_RESULTS || env.WEB_ATTACHMENTS;
  if (!env.WEB_INTAKE || !bucket) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }

  const traceId = cleanTraceId(params.traceId);
  const fileId = cleanText(params.fileId, 80).replace(/[^a-zA-Z0-9_-]/g, "");
  if (!traceId || !fileId) {
    return jsonResponse({ ok: false, error: "file_required" }, 400);
  }

  let task;
  try {
    task = await readTask(env, traceId);
  } catch (error) {
    return jsonResponse({ ok: false, error: "task_corrupted" }, 500);
  }
  if (!task) {
    return jsonResponse({ ok: false, error: "task_not_found" }, 404);
  }
  if (!(await canDownload(request, env, task))) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const file = (Array.isArray(task.result_files) ? task.result_files : []).find((item) => item && item.id === fileId);
  if (!file || !file.key) {
    return jsonResponse({ ok: false, error: "result_file_not_found" }, 404);
  }
  const object = await bucket.get(file.key);
  if (!object) {
    return jsonResponse({ ok: false, error: "result_file_missing" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", headers.get("Content-Type") || file.type || "application/octet-stream");
  headers.set("Content-Disposition", headers.get("Content-Disposition") || contentDisposition(file.name));
  headers.set("Cache-Control", "private, max-age=0, no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(object.body, { headers });
}
