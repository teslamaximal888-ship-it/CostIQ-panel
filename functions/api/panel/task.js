const MAX_FILE_BYTES = 45 * 1024 * 1024;
const ATTACHMENT_TTL_SECONDS = 60 * 60 * 24 * 30;
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
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function cleanText(value, limit = 1200) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

function makeTraceId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const random = crypto.randomUUID().slice(0, 8);
  return `web-${stamp}-${random}`;
}

function safeFileName(value) {
  const base = cleanText(value, 220) || "web-intake-file";
  return base.replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "_").slice(0, 180) || "web-intake-file";
}

function field(formData, name, limit) {
  return cleanText(formData.get(name), limit);
}

function parseExtraFields(value) {
  if (!value) {
    return {};
  }
  try {
    const parsed = JSON.parse(String(value));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([name, item]) => {
          const label = cleanText(item && item.label, 80);
          const fieldValue = cleanText(item && item.value, 1400);
          if (!fieldValue) {
            return null;
          }
          return [
            cleanText(name, 80),
            {
              name: cleanText(item && item.name ? item.name : name, 80),
              label: label || cleanText(name, 80),
              value: fieldValue,
            },
          ];
        })
        .filter(Boolean),
    );
  } catch (error) {
    return {};
  }
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
    language_code: cleanText(user.language_code, 20),
  };
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
    user = publicTelegramUser(JSON.parse(params.get("user") || "{}"));
  } catch (error) {
    user = null;
  }
  if (!user) {
    return { ok: false, error: "user_missing" };
  }
  return {
    ok: true,
    user,
    auth_date: cleanText(params.get("auth_date"), 40),
    query_id: cleanText(params.get("query_id"), 160),
  };
}

function hasAnyTaskText(task) {
  return Boolean(
    task.object ||
      task.project ||
      task.query ||
      task.topic ||
      task.contract ||
      task.owner ||
      task.comment ||
      Object.values(task.extra_fields || {}).some((item) => item && item.value),
  );
}

function telegramCaption(task) {
  const extraLines = Object.values(task.extra_fields || {})
    .filter((item) => item && item.value)
    .map((item) => `• ${item.label || item.name}: ${item.value}`);

  return [
    "🟢 Web intake / новая задача",
    `• trace_id: ${task.trace_id}`,
    `• имя: ${task.name || "не указано"}`,
    `• навык: ${task.skill_title || task.skill || "не указан"}`,
    `• тип ввода: ${task.input_type || "не указан"}`,
    ...extraLines,
    `• срок: ${task.deadline || "не указан"}`,
    task.file_name ? `• файл: ${task.file_name}` : "• файл: не приложен",
    "",
    "Задача создана из публичной ссылки панели CostIQ.",
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1000);
}

async function notifyTelegram(env, task, file) {
  const token = env.TELEGRAM_BOT_TOKEN || env.COSTIQ_TELEGRAM_BOT_TOKEN;
  const chatId = env.COSTIQ_NOTIFY_CHAT_ID || "5059630577";
  if (!token || !chatId) {
    return { ok: false, skipped: "telegram_env_missing" };
  }

  const caption = telegramCaption(task);
  if (file && file.size) {
    const body = new FormData();
    body.set("chat_id", chatId);
    body.set("caption", caption);
    body.set("document", file, file.name || "web-intake-file");
    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body,
    });
    return { ok: response.ok, status: response.status };
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: caption }),
  });
  return { ok: response.ok, status: response.status };
}

async function storeTask(env, task) {
  if (!env.WEB_INTAKE) {
    return false;
  }
  await env.WEB_INTAKE.put(`task:${task.trace_id}`, JSON.stringify(task), {
    expirationTtl: TASK_TTL_SECONDS,
  });
  await upsertTaskIndex(env, task);
  return true;
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

async function storeAttachment(env, task, file) {
  if (!env.WEB_ATTACHMENTS || !file || !file.size) {
    return null;
  }
  const name = safeFileName(file.name);
  const key = `web-intake/${task.trace_id}/${crypto.randomUUID()}-${name}`;
  await env.WEB_ATTACHMENTS.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
      contentDisposition: `attachment; filename="${name.replace(/"/g, "")}"`,
    },
    customMetadata: {
      trace_id: task.trace_id,
      file_name: name,
      source: "costiq-panel",
    },
  });
  return {
    storage: "r2",
    key,
    name,
    size: file.size,
    type: file.type || "application/octet-stream",
    expires_at: new Date(Date.now() + ATTACHMENT_TTL_SECONDS * 1000).toISOString(),
  };
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestPost({ request, env }) {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return jsonResponse({ ok: false, error: "multipart_required" }, 400);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (error) {
    return jsonResponse({ ok: false, error: "invalid_form" }, 400);
  }

  const file = formData.get("file");
  const hasFile = file && typeof file === "object" && typeof file.size === "number" && file.size > 0;
  if (hasFile && file.size > MAX_FILE_BYTES) {
    return jsonResponse({ ok: false, error: "file_too_large" }, 413);
  }

  const telegramInitData = formData.get("telegram_init_data");
  const telegramAuth = telegramInitData ? await verifyTelegramInitData(telegramInitData, env) : { ok: false, skipped: "not_provided" };
  if (telegramInitData && !telegramAuth.ok) {
    return jsonResponse({ ok: false, error: "telegram_auth_invalid" }, 401);
  }

  const telegramUser = telegramAuth.ok ? telegramAuth.user : null;
  const telegramName = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(" ").trim() || telegramUser.username
    : "";
  const task = {
    trace_id: makeTraceId(),
    source: "web_intake",
    status: "created",
    attempts: 0,
    max_attempts: 3,
    retry_after: "",
    error_text: "",
    processing_started_at: "",
    processing_finished_at: "",
    name: field(formData, "name", 160) || telegramName,
    skill: field(formData, "skill", 80),
    skill_title: field(formData, "skill_title", 160),
    command: field(formData, "command", 80),
    input_type: field(formData, "input_type", 80),
    requires_file: field(formData, "requires_file", 10) === "1",
    object: field(formData, "object", 220),
    project: field(formData, "project", 220),
    query: field(formData, "query", 1400),
    topic: field(formData, "topic", 220),
    unit: field(formData, "unit", 80),
    section: field(formData, "section", 160),
    contractor: field(formData, "contractor", 220),
    contract: field(formData, "contract", 220),
    owner: field(formData, "owner", 220),
    tender: field(formData, "tender", 220),
    period: field(formData, "period", 160),
    parameters: field(formData, "parameters", 500),
    violation: field(formData, "violation", 220),
    comment: field(formData, "comment", 1400),
    deadline: field(formData, "deadline", 160),
    extra_fields: parseExtraFields(formData.get("extra_fields")),
    telegram_user: telegramUser,
    telegram_auth_date: telegramAuth.ok ? telegramAuth.auth_date : "",
    file_name: hasFile ? cleanText(file.name, 220) : "",
    file_size: hasFile ? file.size : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    result: "",
  };

  if (!task.name || !task.skill || !hasAnyTaskText(task)) {
    return jsonResponse({ ok: false, error: "required_fields_missing" }, 400);
  }
  if (task.requires_file && !hasFile) {
    return jsonResponse({ ok: false, error: "file_required" }, 400);
  }
  if (task.requires_file && hasFile && !env.WEB_ATTACHMENTS) {
    return jsonResponse(
      {
        ok: false,
        error: "attachment_storage_not_configured",
        detail: "R2 binding WEB_ATTACHMENTS is required for file-required web tasks",
      },
      503,
    );
  }

  let persisted = false;
  let attachment = null;
  let notification = { ok: false, skipped: "not_attempted" };
  try {
    attachment = hasFile ? await storeAttachment(env, task, file) : null;
    if (attachment) {
      task.attachment = attachment;
      task.attachment_status = "stored";
    } else if (hasFile) {
      task.attachment_status = "telegram_only";
    }
    persisted = await storeTask(env, task);
  } catch (error) {
    return jsonResponse({ ok: false, error: "storage_failed", detail: "task_or_attachment" }, 500);
  }

  try {
    notification = await notifyTelegram(env, task, hasFile ? file : null);
  } catch (error) {
    notification = { ok: false, error: "telegram_failed" };
  }

  if (!persisted && !notification.ok) {
    return jsonResponse(
      {
        ok: false,
        error: "intake_not_configured",
        task,
        persisted,
        notification,
      },
      503,
    );
  }

  return jsonResponse({
    ok: true,
    task,
    persisted,
    notification,
  });
}
