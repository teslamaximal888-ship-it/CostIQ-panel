function cleanText(value, limit = 1000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, limit);
}

function cleanInteger(value, fallback = 0, min = 0, max = 999) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

function eventCategory(event) {
  const type = cleanText(event && event.type, 80);
  if (type === "checkpoint_saved") {
    return "checkpoint";
  }
  if (type === "resume_scheduled") {
    return "resume";
  }
  if (type === "state_changed" || type === "task_created") {
    return "lifecycle";
  }
  if (["ready_for_review", "question_requested", "revision_requested", "accepted", "closed", "closed_by_timeout"].includes(type)) {
    return "review";
  }
  if (type.includes("error") || type === "failed") {
    return "error";
  }
  return "system";
}

function normalizeEvent(event, fallbackCreatedAt = "", source = "lifecycle") {
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    return null;
  }
  const type = cleanText(event.type, 80) || "task_event";
  const createdAt = cleanText(event.created_at, 80) || fallbackCreatedAt;
  const message = cleanText(event.message || event.note || event.text, 1600);
  return {
    type,
    category: eventCategory({ ...event, type }),
    created_at: createdAt,
    actor: cleanText(event.by || event.author || "system", 80),
    source: cleanText(event.source || source, 100),
    from: cleanText(event.from, 80),
    to: cleanText(event.to, 80),
    checkpoint: cleanText(event.checkpoint, 80),
    version: cleanInteger(event.version, 0, 0, 99),
    message,
  };
}

export function taskEventLogSnapshot(task, limit = 80) {
  const lifecycle = task && task.lifecycle && typeof task.lifecycle === "object" && !Array.isArray(task.lifecycle)
    ? task.lifecycle
    : {};
  const review = task && task.review && typeof task.review === "object" && !Array.isArray(task.review)
    ? task.review
    : {};
  const lifecycleEvents = Array.isArray(lifecycle.events) ? lifecycle.events : [];
  const reviewEvents = Array.isArray(review.events) ? review.events : [];
  const events = [
    ...lifecycleEvents.map((event) => normalizeEvent(event, task && task.created_at, "lifecycle")),
    ...reviewEvents.map((event) => normalizeEvent(event, task && task.updated_at, "review")),
  ]
    .filter(Boolean)
    .sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));

  const lastEvents = events.slice(-limit);
  return {
    items: lastEvents,
    total: events.length,
    last_event_at: lastEvents.length ? cleanText(lastEvents[lastEvents.length - 1].created_at, 80) : "",
    last_error: cleanText(task && task.error_text, 1400),
  };
}
