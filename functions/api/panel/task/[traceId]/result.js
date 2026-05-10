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

async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }
  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}

function hasAdminAccess(request, env, payload) {
  const provided = cleanText(request.headers.get("X-CostIQ-Admin") || payload.admin_key || "", 500);
  const allowed = cleanText(env.COSTIQ_PANEL_ADMIN_TOKEN || "", 500);
  return Boolean(provided && allowed && provided === allowed);
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

  if (!hasAdminAccess(request, env, payload)) {
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

  const status = cleanText(payload.status, 40) || "done";
  const result = cleanText(payload.result, 4000);
  if (!result && !["queued", "in_progress"].includes(status)) {
    return jsonResponse({ ok: false, error: "result_required" }, 400);
  }

  const updatedTask = {
    ...task,
    status,
    result,
    updated_at: new Date().toISOString(),
  };

  await env.WEB_INTAKE.put(`task:${traceId}`, JSON.stringify(updatedTask), {
    expirationTtl: 60 * 60 * 24 * 30,
  });

  return jsonResponse({ ok: true, task: updatedTask });
}
