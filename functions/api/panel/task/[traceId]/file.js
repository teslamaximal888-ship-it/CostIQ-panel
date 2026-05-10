function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "X-CostIQ-Admin",
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

function hasAdminAccess(request, env) {
  const url = new URL(request.url);
  const provided = cleanText(request.headers.get("X-CostIQ-Admin") || url.searchParams.get("admin_key") || "", 500);
  const allowed = [
    cleanText(env.COSTIQ_PANEL_ADMIN_TOKEN || "", 500),
    cleanText(env.COSTIQ_NOTIFY_CHAT_ID || "", 500),
  ].filter(Boolean);
  return Boolean(provided && allowed.includes(provided));
}

function contentDisposition(fileName) {
  const fallback = cleanText(fileName, 180).replace(/[\\/:*?"<>|#%{}^~[\]`]/g, "_") || "web-intake-file";
  return `attachment; filename="${fallback.replace(/"/g, "")}"`;
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env, params }) {
  if (!env.WEB_INTAKE || !env.WEB_ATTACHMENTS) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }
  if (!hasAdminAccess(request, env)) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const traceId = cleanTraceId(params.traceId);
  if (!traceId) {
    return jsonResponse({ ok: false, error: "trace_required" }, 400);
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

  const attachment = task.attachment || {};
  if (attachment.storage !== "r2" || !attachment.key) {
    return jsonResponse({ ok: false, error: "attachment_not_found" }, 404);
  }

  const object = await env.WEB_ATTACHMENTS.get(attachment.key);
  if (!object) {
    return jsonResponse({ ok: false, error: "attachment_missing" }, 404);
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Content-Type", headers.get("Content-Type") || attachment.type || "application/octet-stream");
  headers.set("Content-Disposition", headers.get("Content-Disposition") || contentDisposition(attachment.name || task.file_name));
  headers.set("Cache-Control", "private, max-age=0, no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  return new Response(object.body, { headers });
}
