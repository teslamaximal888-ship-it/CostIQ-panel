function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function cleanTraceId(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ env, params }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
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

  const { attachment, telegram_user, telegram_auth_date, ...publicTask } = task;
  if (attachment) {
    publicTask.attachment_status = task.attachment_status || "stored";
  }
  return jsonResponse({ ok: true, task: publicTask });
}
