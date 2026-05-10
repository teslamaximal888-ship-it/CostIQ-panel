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

function parseStatuses(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((item) => cleanText(item, 40).toLowerCase())
      .filter(Boolean),
  );
}

function parseMinutes(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, 1), 24 * 60);
}

function parseEpoch(value) {
  if (!value) {
    return 0;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function queueState(task, now, staleMs) {
  const status = String(task.status || "").toLowerCase();
  const updated = parseEpoch(task.updated_at || task.created_at);
  const retryAfter = parseEpoch(task.retry_after);
  const stale = Boolean(updated && now - updated > staleMs && ["created", "queued", "in_progress", "retry"].includes(status));
  const due = status === "retry" ? !retryAfter || retryAfter <= now : status === "created";
  return { status, stale, due };
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
  if (!(await hasAdminAccess(request, env))) {
    return jsonResponse({ ok: false, error: "unauthorized" }, 401);
  }

  const url = new URL(request.url);
  const limit = cleanLimit(url.searchParams.get("limit"));
  const statuses = parseStatuses(url.searchParams.get("status"));
  const staleOnly = url.searchParams.get("stale") === "1";
  const staleMinutes = parseMinutes(url.searchParams.get("stale_minutes"), 15);
  const now = Date.now();
  const staleMs = staleMinutes * 60 * 1000;
  const list = await env.WEB_INTAKE.list({ prefix: "task:", limit: 100 });
  const allTasks = (await Promise.all(list.keys.map((key) => readTask(env, key))))
    .filter(Boolean)
    .map((task) => {
      const state = queueState(task, now, staleMs);
      return {
        ...task,
        queue_state: {
          stale: state.stale,
          due: state.due,
        },
      };
    })
    .filter((task) => {
      const status = String(task.status || "").toLowerCase();
      if (statuses.size && !statuses.has(status)) {
        return false;
      }
      if (staleOnly && !task.queue_state.stale) {
        return false;
      }
      return true;
    })
    .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")));
  const summary = allTasks.reduce(
    (acc, task) => {
      const status = String(task.status || "unknown").toLowerCase();
      acc.total += 1;
      acc.by_status[status] = (acc.by_status[status] || 0) + 1;
      if (task.queue_state && task.queue_state.stale) {
        acc.stale += 1;
      }
      if (task.queue_state && task.queue_state.due) {
        acc.due += 1;
      }
      return acc;
    },
    { total: 0, stale: 0, due: 0, by_status: {} },
  );
  const tasks = allTasks
    .slice(0, limit);

  return jsonResponse({
    ok: true,
    tasks,
    count: tasks.length,
    summary,
    cursor: list.list_complete ? "" : list.cursor || "",
  });
}
