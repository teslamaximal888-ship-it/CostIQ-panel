const MAX_FILE_BYTES = 45 * 1024 * 1024;

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

function field(formData, name, limit) {
  return cleanText(formData.get(name), limit);
}

function telegramCaption(task) {
  return [
    "🟢 Web intake / новая задача",
    `• trace_id: ${task.trace_id}`,
    `• имя: ${task.name || "не указано"}`,
    `• навык: ${task.skill_title || task.skill || "не указан"}`,
    `• объект: ${task.object || "не указан"}`,
    `• срок: ${task.deadline || "не указан"}`,
    task.comment ? `• комментарий: ${task.comment}` : "",
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
    expirationTtl: 60 * 60 * 24 * 30,
  });
  return true;
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

  const task = {
    trace_id: makeTraceId(),
    source: "web_intake",
    status: "created",
    name: field(formData, "name", 160),
    skill: field(formData, "skill", 80),
    skill_title: field(formData, "skill_title", 160),
    command: field(formData, "command", 80),
    object: field(formData, "object", 220),
    comment: field(formData, "comment", 1400),
    deadline: field(formData, "deadline", 160),
    file_name: hasFile ? cleanText(file.name, 220) : "",
    file_size: hasFile ? file.size : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    result: "",
  };

  if (!task.name || !task.skill || !task.object || !task.comment) {
    return jsonResponse({ ok: false, error: "required_fields_missing" }, 400);
  }

  let persisted = false;
  let notification = { ok: false, skipped: "not_attempted" };
  try {
    persisted = await storeTask(env, task);
  } catch (error) {
    return jsonResponse({ ok: false, error: "storage_failed" }, 500);
  }

  try {
    notification = await notifyTelegram(env, task, hasFile ? file : null);
  } catch (error) {
    notification = { ok: false, error: "telegram_failed" };
  }

  return jsonResponse({
    ok: true,
    task,
    persisted,
    notification,
  });
}
