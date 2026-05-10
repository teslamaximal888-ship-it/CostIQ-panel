function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "X-Telegram-Init-Data",
    },
  });
}

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
  return safeTask;
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }

  const auth = await verifyTelegramInitData(request.headers.get("X-Telegram-Init-Data") || "", env);
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
