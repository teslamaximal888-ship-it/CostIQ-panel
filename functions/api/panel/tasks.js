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

function isoAfter(now, seconds) {
  if (!seconds) {
    return "";
  }
  return new Date(now + seconds * 1000).toISOString();
}

function processingDurationSeconds(task) {
  const started = parseEpoch(task.processing_started_at);
  const finished = parseEpoch(task.processing_finished_at);
  if (!started || !finished || finished <= started) {
    return 0;
  }
  return Math.round((finished - started) / 1000);
}

function averageProcessingSeconds(tasks) {
  const durations = tasks
    .map(processingDurationSeconds)
    .filter((seconds) => seconds >= 30 && seconds <= 60 * 60);
  if (!durations.length) {
    return 5 * 60;
  }
  const average = Math.round(durations.reduce((sum, seconds) => sum + seconds, 0) / durations.length);
  return Math.min(Math.max(average, 60), 20 * 60);
}

function queueState(task, now, staleMs) {
  const status = String(task.status || "").toLowerCase();
  const updated = parseEpoch(task.updated_at || task.created_at);
  const retryAfter = parseEpoch(task.retry_after);
  const stale = Boolean(updated && now - updated > staleMs && ["created", "queued", "in_progress", "retry"].includes(status));
  const due = status === "retry" ? !retryAfter || retryAfter <= now : status === "created";
  return { status, stale, due, retryAfter };
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

function normalizeTask(task, fallbackTraceId = "") {
  if (!task || typeof task !== "object" || Array.isArray(task)) {
    return {
      trace_id: fallbackTraceId,
      status: "corrupted",
      error_text: "task_payload_not_object",
      created_at: "",
      updated_at: "",
    };
  }
  return task;
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
  let list;
  let rawTasks;
  try {
    list = await env.WEB_INTAKE.list({ prefix: "task:", limit: 100 });
    rawTasks = (await Promise.all(list.keys.map((key) => readTask(env, key))))
      .map((task, index) => normalizeTask(task, list.keys[index] && list.keys[index].name ? list.keys[index].name.replace(/^task:/, "") : ""))
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
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: "queue_read_failed", detail: cleanText(error && error.message, 240) }, 500);
  }
  const avgProcessingSeconds = averageProcessingSeconds(rawTasks);
  const dueOrder = rawTasks
    .filter((task) => task.queue_state && task.queue_state.due)
    .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
  const duePositionByTrace = new Map(dueOrder.map((task, index) => [task.trace_id, index + 1]));
  const allTasks = rawTasks
    .map((task) => {
      const status = String(task.status || "").toLowerCase();
      const retryAfter = parseEpoch(task.retry_after);
      const duePosition = duePositionByTrace.get(task.trace_id) || 0;
      let etaSeconds = 0;
      if (duePosition) {
        etaSeconds = Math.max(0, (duePosition - 1) * avgProcessingSeconds);
      } else if (status === "in_progress") {
        etaSeconds = 0;
      } else if (status === "retry" && retryAfter && retryAfter > now) {
        etaSeconds = Math.round((retryAfter - now) / 1000);
      }
      return {
        ...task,
        queue_state: {
          ...task.queue_state,
          queue_position: duePosition,
          eta_seconds: etaSeconds,
          eta_at: etaSeconds ? isoAfter(now, etaSeconds) : "",
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
    { total: 0, stale: 0, due: 0, by_status: {}, avg_processing_seconds: avgProcessingSeconds },
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
