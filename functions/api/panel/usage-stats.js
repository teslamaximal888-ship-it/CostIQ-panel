function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
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

const TASK_INDEX_KEY = "tasks:index";
const MOSCOW_OFFSET_MS = 3 * 60 * 60 * 1000;

function parseEpoch(value) {
  if (!value) {
    return 0;
  }
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function moscowDateKey(value) {
  const epoch = typeof value === "number" ? value : parseEpoch(value);
  if (!epoch) {
    return "";
  }
  return new Date(epoch + MOSCOW_OFFSET_MS).toISOString().slice(0, 10);
}

function taskSkillName(task) {
  return cleanText(task.skill_title || task.skill || task.command || "Без навыка", 120);
}

async function readTask(env, key) {
  const raw = await env.WEB_INTAKE.get(key.name);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    return null;
  }
}

async function taskKeys(env, limit = 500) {
  const rawIndex = await env.WEB_INTAKE.get(TASK_INDEX_KEY);
  if (rawIndex) {
    try {
      const index = JSON.parse(rawIndex);
      if (Array.isArray(index) && index.length) {
        return index
          .map((item) => cleanText(item && item.trace_id, 100))
          .filter(Boolean)
          .slice(0, limit)
          .map((traceId) => ({ name: `task:${traceId}` }));
      }
    } catch (error) {
      // Fall through to KV list for legacy data.
    }
  }
  const list = await env.WEB_INTAKE.list({ prefix: "task:", limit });
  return Array.isArray(list.keys) ? list.keys : [];
}

function topSkillEntries(tasks, dateKey) {
  const bySkill = new Map();
  for (const task of tasks) {
    if (moscowDateKey(task.created_at || task.updated_at) !== dateKey) {
      continue;
    }
    const name = taskSkillName(task);
    if (!name) {
      continue;
    }
    const current = bySkill.get(name) || { name, count: 0, done: 0, active: 0 };
    const status = String(task.status || "").toLowerCase();
    current.count += 1;
    if (["done", "ready_for_review", "accepted", "closed"].includes(status)) {
      current.done += 1;
    }
    if (["created", "queued", "in_progress", "retry", "question_requested", "revision_requested", "reworking"].includes(status)) {
      current.active += 1;
    }
    bySkill.set(name, current);
  }
  const total = [...bySkill.values()].reduce((sum, item) => sum + item.count, 0);
  const top = [...bySkill.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ru"))
    .slice(0, 3)
    .map((item, index) => ({
      rank: index + 1,
      name: item.name,
      count: item.count,
      done: item.done,
      active: item.active,
      percent: total ? Math.round((item.count / total) * 100) : 0,
    }));
  return { total, top };
}

function latestActiveDateKey(tasks, todayKey) {
  let latest = "";
  for (const task of tasks) {
    const dateKey = moscowDateKey(task.created_at || task.updated_at);
    if (!dateKey || dateKey > todayKey) {
      continue;
    }
    if (!latest || dateKey > latest) {
      latest = dateKey;
    }
  }
  return latest || todayKey;
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ env }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }
  const todayKey = moscowDateKey(Date.now());
  try {
    const keys = await taskKeys(env, 500);
    const tasks = (await Promise.all(keys.map((key) => readTask(env, key)))).filter(Boolean);
    let dateKey = todayKey;
    let { total, top } = topSkillEntries(tasks, dateKey);
    if (!total) {
      const fallbackDateKey = latestActiveDateKey(tasks, todayKey);
      if (fallbackDateKey !== todayKey) {
        dateKey = fallbackDateKey;
        ({ total, top } = topSkillEntries(tasks, dateKey));
      }
    }
    return jsonResponse({
      ok: true,
      date: dateKey,
      current_date: todayKey,
      period: dateKey === todayKey ? "today" : "latest_active_day",
      timezone: "Europe/Moscow",
      total,
      top,
      scanned: tasks.length,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: "usage_stats_failed", detail: cleanText(error && error.message, 240) }, 500);
  }
}
