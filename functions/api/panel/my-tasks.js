function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "X-Telegram-Init-Data, X-CostIQ-Panel-Auth",
    },
  });
}

const BRIDGE_ADMIN_TOKEN_SHA256 = "4114f8b668ea37337c30b5b92f78a91d9739435330e71dbba6472188e9368126";

function cleanText(value, limit = 500) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, limit);
}

function cleanLimit(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) {
    return 20;
  }
  return Math.min(Math.max(parsed, 1), 50);
}

async function hmacSha256(key, value) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value)));
}

function hex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return hex(new Uint8Array(digest));
}

function base64UrlToBytes(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function timingSafeEqualHex(a, b) {
  const left = String(a || "").toLowerCase();
  const right = String(b || "").toLowerCase();
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

function publicTelegramUser(user) {
  if (!user || typeof user !== "object") {
    return null;
  }
  const id = Number(user.id);
  if (!Number.isFinite(id)) {
    return null;
  }
  return {
    id,
    first_name: cleanText(user.first_name, 120),
    last_name: cleanText(user.last_name, 120),
    username: cleanText(user.username, 120),
  };
}

async function verifyTelegramInitData(initData, env) {
  const token = env.TELEGRAM_BOT_TOKEN || env.COSTIQ_TELEGRAM_BOT_TOKEN || "";
  const raw = cleanText(initData, 5000);
  if (!raw) {
    return { ok: false, error: "init_data_required" };
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
    user = publicTelegramUser(JSON.parse(params.get("user") || "{}"));
  } catch (error) {
    user = null;
  }
  return user ? { ok: true, user } : { ok: false, error: "user_missing" };
}

async function verifyPanelAuth(panelAuth, env) {
  const raw = cleanText(panelAuth, 5000);
  if (!raw) {
    return { ok: false, error: "panel_auth_required" };
  }
  const [payload64, providedSig] = raw.split(".");
  if (!payload64 || !providedSig) {
    return { ok: false, error: "panel_auth_malformed" };
  }
  const adminSecret = cleanText(env.COSTIQ_PANEL_ADMIN_TOKEN || "", 500);
  const secretHex = adminSecret ? await sha256Hex(adminSecret) : BRIDGE_ADMIN_TOKEN_SHA256;
  const expectedSig = hex(await hmacSha256(new TextEncoder().encode(secretHex), payload64));
  if (!timingSafeEqualHex(expectedSig, providedSig)) {
    return { ok: false, error: "panel_auth_mismatch" };
  }
  let payload = null;
  try {
    payload = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload64)));
  } catch (error) {
    return { ok: false, error: "panel_auth_payload_invalid" };
  }
  const exp = Number(payload.exp || 0);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) {
    return { ok: false, error: "panel_auth_expired" };
  }
  const user = publicTelegramUser({
    id: payload.uid || payload.id,
    first_name: payload.first_name,
    last_name: payload.last_name,
    username: payload.username,
  });
  return user ? { ok: true, user } : { ok: false, error: "panel_auth_user_missing" };
}

async function readTask(env, key) {
  const raw = await env.WEB_INTAKE.get(key.name);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function publicTask(task) {
  const { attachment, telegram_user, telegram_auth_date, ...safeTask } = task;
  if (attachment) {
    safeTask.attachment_status = task.attachment_status || "stored";
  }
  if (safeTask.result_archive && safeTask.result_archive.id) {
    safeTask.result_files = [];
  } else if (Array.isArray(safeTask.result_files)) {
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

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }

  const initAuth = await verifyTelegramInitData(request.headers.get("X-Telegram-Init-Data") || "", env);
  const auth = initAuth.ok ? initAuth : await verifyPanelAuth(request.headers.get("X-CostIQ-Panel-Auth") || "", env);
  if (!auth.ok) {
    return jsonResponse({ ok: false, error: "telegram_auth_required" }, 401);
  }

  const url = new URL(request.url);
  const limit = cleanLimit(url.searchParams.get("limit"));
  const list = await env.WEB_INTAKE.list({ prefix: "task:", limit: 100 });
  const tasks = (await Promise.all(list.keys.map((key) => readTask(env, key))))
    .filter((task) => task && task.telegram_user && Number(task.telegram_user.id) === auth.user.id)
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, limit)
    .map(publicTask);

  return jsonResponse({ ok: true, tasks, count: tasks.length });
}
