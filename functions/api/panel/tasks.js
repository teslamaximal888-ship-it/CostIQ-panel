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
  return Math.min(Math.max(parsed, 1), 100);
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

async function readTask(env, key) {
  const raw = await env.WEB_INTAKE.get(key.name);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {
      trace_id: key.name.replace(/^task:/, ""),
      status: "corrupted",
      created_at: key.metadata && key.metadata.created_at ? key.metadata.created_at : "",
    };
  }
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }
  if (!hasAdminAccess(request, env)) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const limit = cleanLimit(url.searchParams.get("limit"));
  const list = await env.WEB_INTAKE.list({ prefix: "task:", limit: 100 });
  const tasks = (await Promise.all(list.keys.map((key) => readTask(env, key))))
    .filter(Boolean)
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .slice(0, limit);

  return jsonResponse({
    ok: true,
    tasks,
    count: tasks.length,
    cursor: list.list_complete ? "" : list.cursor || "",
  });
}
