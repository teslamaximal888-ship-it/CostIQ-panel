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
const CONTENT_INDEX_KEY = "content:index";
const CONTENT_KEY_PREFIX = "content:item:";
const DONE_STATUSES = new Set(["done", "ready_for_review", "accepted", "closed", "closed_by_timeout"]);
const PANEL_UPDATE_TYPES = new Set(["panel_update", "panel_release", "database_update"]);
const PANEL_UPDATE_TAGS = new Set(["panel_update", "panel", "database_update", "snapshot_update", "tool_update"]);

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

async function readContentItem(env, id) {
  const raw = await env.WEB_INTAKE.get(`${CONTENT_KEY_PREFIX}${id}`);
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

async function contentItems(env, limit = 200) {
  const rawIndex = await env.WEB_INTAKE.get(CONTENT_INDEX_KEY);
  if (rawIndex) {
    try {
      const index = JSON.parse(rawIndex);
      if (Array.isArray(index) && index.length) {
        return (await Promise.all(
          index
            .map((item) => cleanText(item, 100))
            .filter(Boolean)
            .slice(0, limit)
            .map((id) => readContentItem(env, id))
        )).filter(Boolean);
      }
    } catch (error) {
      // Fall through to KV list for legacy data.
    }
  }
  const list = await env.WEB_INTAKE.list({ prefix: CONTENT_KEY_PREFIX, limit });
  const keys = Array.isArray(list.keys) ? list.keys : [];
  return (await Promise.all(
    keys.map((key) => readContentItem(env, String(key.name || "").replace(CONTENT_KEY_PREFIX, "")))
  )).filter(Boolean);
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

function publicContentUpdate(item) {
  return {
    title: cleanText(item.title || "Обновление панели", 120),
    action: cleanText(item.action || item.label || "обновление панели", 80),
    text: cleanText(item.body || item.text || "Изменение добавлено в журнал панели.", 220),
    meta: cleanText(item.updated_at || item.created_at, 80),
    status: cleanText(item.status || "published", 40).toLowerCase(),
  };
}

function isPublishedPanelUpdate(item) {
  const type = cleanText(item && item.type, 40).toLowerCase();
  const status = cleanText(item && item.status, 40).toLowerCase() || "published";
  if (status !== "published") {
    return false;
  }
  return PANEL_UPDATE_TYPES.has(type);
}

function taskTags(task) {
  const raw = [
    task && task.update_type,
    task && task.event_type,
    task && task.category,
    task && task.kind,
    ...(Array.isArray(task && task.tags) ? task.tags : []),
  ];
  return raw.map((tag) => cleanText(tag, 80).toLowerCase()).filter(Boolean);
}

function isPanelChangeTask(task) {
  if (!task || typeof task !== "object") {
    return false;
  }
  if (!DONE_STATUSES.has(cleanText(task.status, 40).toLowerCase())) {
    return false;
  }
  return taskTags(task).some((tag) => PANEL_UPDATE_TAGS.has(tag));
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
    const content = (await contentItems(env, 200))
      .filter(isPublishedPanelUpdate)
      .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")));
    if (content.length) {
      return jsonResponse({
        ok: true,
        items: content.slice(0, limit).map(publicContentUpdate),
        scanned: content.length,
        source: "panel_updates",
        updated_at: new Date().toISOString(),
      });
    }

    const keys = await taskKeys(env, 500);
    const tasks = (await Promise.all(keys.map((key) => readTask(env, key))))
      .filter(Boolean)
      .filter(isPanelChangeTask)
      .sort((a, b) => String(b.updated_at || b.created_at || "").localeCompare(String(a.updated_at || a.created_at || "")));
    return jsonResponse({
      ok: true,
      items: tasks.slice(0, limit).map(publicUpdate),
      scanned: keys.length,
      source: "tagged_tasks",
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    return jsonResponse({ ok: false, error: "latest_updates_failed", detail: cleanText(error && error.message, 240) }, 500);
  }
}
