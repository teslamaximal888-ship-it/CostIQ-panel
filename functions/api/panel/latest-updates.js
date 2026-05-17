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

function cleanLimit(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) {
    return 3;
  }
  return Math.min(Math.max(parsed, 1), 6);
}

const TASK_INDEX_KEY = "tasks:index";
const DONE_STATUSES = new Set(["done", "ready_for_review", "accepted", "closed", "closed_by_timeout"]);

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

function lastReviewEvent(task) {
  const events = task && task.review && Array.isArray(task.review.events) ? task.review.events : [];
  return events
    .filter((event) => event && event.created_at)
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))[0] || null;
}

function statusLabel(status) {
  const normalized = String(status || "").toLowerCase();
  const labels = {
    done: "результат готов",
    ready_for_review: "готово к проверке",
    accepted: "принято",
    closed: "закрыто",
    closed_by_timeout: "закрыто по сроку",
  };
  return labels[normalized] || "готово";
}

function eventLabel(eventType, status) {
  const normalized = String(eventType || "").toLowerCase();
  const labels = {
    question_answered: "ответ подготовлен",
    revision_completed: "доработка завершена",
    accepted: "результат принят",
    closed: "задача закрыта",
  };
  return labels[normalized] || statusLabel(status);
}

function publicUpdate(task) {
  const event = lastReviewEvent(task);
  const status = cleanText(task.status, 40).toLowerCase();
  const version = Number.parseInt(String(task.result_version || (task.review && task.review.current_version) || ""), 10);
  const title = cleanText(task.skill_title || task.skill || task.command || "Задача панели", 120);
  const action = eventLabel(event && event.type, status);
  const updatedAt = cleanText((event && event.created_at) || task.updated_at || task.created_at, 80);
  return {
    title,
    action,
    text: version > 1 ? `Актуальная версия результата: v${version}.` : "Результат обновлён в рабочей карточке.",
    meta: updatedAt,
    status,
  };
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ request, env }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }
  const url = new URL(request.url);
  const limit = cleanLimit(url.searchParams.get("limit"));
  try {
    const keys = await taskKeys(env, 500);
    const tasks = (await Promise.all(keys.map((key) => readTask(env, key))))
      .filter(Boolean)
      .filter((task) => DONE_STATUSES.has(cleanText(task.status, 40).toLowerCase()))
      .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")));
    return jsonResponse({
      ok: true,
      items: tasks.slice(0, limit).map(publicUpdate),
      scanned: keys.length,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: "latest_updates_failed", detail: cleanText(error && error.message, 240) }, 500);
  }
}
