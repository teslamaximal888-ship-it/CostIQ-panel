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

function parseEpoch(value) {
  if (!value) {
    return 0;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function processingDurationSeconds(task) {
  const started = parseEpoch(task.processing_started_at);
  const finished = parseEpoch(task.processing_finished_at);
  if (!started || !finished || finished <= started) {
    return 0;
  }
  return Math.round((finished - started) / 1000);
}

function emptyWindow() {
  return {
    total: 0,
    done: 0,
    failed: 0,
    retry: 0,
    warning: 0,
    avg_processing_seconds: 0,
    max_processing_seconds: 0,
  };
}

function topEntries(map, limit = 8) {
  return [...map.entries()]
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => (b.failed + b.retry + b.warning) - (a.failed + a.retry + a.warning) || b.total - a.total)
    .slice(0, limit);
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
      error_text: "task_corrupted",
      created_at: key.metadata && key.metadata.created_at ? key.metadata.created_at : "",
    };
  }
}

function addToWindow(bucket, task) {
  const status = String(task.status || "unknown").toLowerCase();
  const errorText = cleanText(task.error_text || task.result || "", 4000);
  const hasWarning = /\b(warn|warning|fail|failed|error|ошиб|сбой|предупреж)/i.test(errorText);
  bucket.total += 1;
  if (status === "done") {
    bucket.done += 1;
  }
  if (status === "failed" || status === "corrupted") {
    bucket.failed += 1;
  }
  if (status === "retry") {
    bucket.retry += 1;
  }
  if (hasWarning) {
    bucket.warning += 1;
  }
  const duration = processingDurationSeconds(task);
  if (duration) {
    bucket._duration_sum = (bucket._duration_sum || 0) + duration;
    bucket._duration_count = (bucket._duration_count || 0) + 1;
    bucket.max_processing_seconds = Math.max(bucket.max_processing_seconds, duration);
  }
}

function finalizeWindow(bucket) {
  if (bucket._duration_count) {
    bucket.avg_processing_seconds = Math.round(bucket._duration_sum / bucket._duration_count);
  }
  delete bucket._duration_sum;
  delete bucket._duration_count;
  return bucket;
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

  const now = Date.now();
  const dayAgo = now - 24 * 60 * 60 * 1000;
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const list = await env.WEB_INTAKE.list({ prefix: "task:", limit: 1000 });
  const tasks = (await Promise.all(list.keys.map((key) => readTask(env, key)))).filter(Boolean);
  const day = emptyWindow();
  const week = emptyWindow();
  const bySkill = new Map();
  const recentProblems = [];

  for (const task of tasks) {
    const updated = parseEpoch(task.updated_at || task.created_at);
    if (!updated) {
      continue;
    }
    if (updated >= dayAgo) {
      addToWindow(day, task);
    }
    if (updated >= weekAgo) {
      addToWindow(week, task);
      const skill = cleanText(task.skill_title || task.skill || "без навыка", 120);
      if (!bySkill.has(skill)) {
        bySkill.set(skill, { total: 0, failed: 0, retry: 0, warning: 0 });
      }
      const stats = bySkill.get(skill);
      const status = String(task.status || "unknown").toLowerCase();
      const problemText = cleanText(task.error_text || task.result || "", 4000);
      stats.total += 1;
      if (status === "failed" || status === "corrupted") {
        stats.failed += 1;
      }
      if (status === "retry") {
        stats.retry += 1;
      }
      if (/\b(warn|warning|fail|failed|error|ошиб|сбой|предупреж)/i.test(problemText)) {
        stats.warning += 1;
      }
      if (["failed", "retry", "corrupted"].includes(status) || task.error_text) {
        recentProblems.push({
          trace_id: task.trace_id,
          status,
          skill,
          updated_at: task.updated_at || task.created_at || "",
          error_text: cleanText(task.error_text || problemText, 240),
        });
      }
    }
  }

  recentProblems.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));

  return jsonResponse({
    ok: true,
    scanned: tasks.length,
    cursor: list.list_complete ? "" : list.cursor || "",
    windows: {
      day: finalizeWindow(day),
      week: finalizeWindow(week),
    },
    top_problem_skills: topEntries(bySkill),
    recent_problems: recentProblems.slice(0, 12),
  });
}
