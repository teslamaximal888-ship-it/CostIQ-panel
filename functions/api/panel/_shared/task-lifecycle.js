export const TASK_STATUSES = Object.freeze([
  "created",
  "queued",
  "in_progress",
  "retry",
  "failed",
  "done",
  "ready_for_review",
  "question_requested",
  "revision_requested",
  "reworking",
  "accepted",
  "closed",
  "closed_by_timeout",
]);

export const REVIEW_STATUSES = new Set([
  "ready_for_review",
  "question_requested",
  "revision_requested",
  "reworking",
  "accepted",
  "closed",
  "closed_by_timeout",
]);

export const FINISHED_STATUSES = new Set([
  "done",
  "ready_for_review",
  "failed",
  "accepted",
  "closed",
  "closed_by_timeout",
]);

export const ACTIVE_STATUSES = new Set([
  "created",
  "queued",
  "in_progress",
  "retry",
  "question_requested",
  "revision_requested",
  "reworking",
]);

export const BRIDGE_DUE_STATUSES = new Set(["created", "question_requested", "revision_requested"]);

const TRANSITIONS = Object.freeze({
  created: new Set(["queued", "in_progress", "retry", "failed"]),
  queued: new Set(["in_progress", "retry", "failed"]),
  in_progress: new Set(["ready_for_review", "done", "retry", "failed"]),
  retry: new Set(["queued", "in_progress", "failed"]),
  failed: new Set(["retry"]),
  done: new Set(["ready_for_review", "question_requested", "revision_requested", "accepted", "closed", "closed_by_timeout"]),
  ready_for_review: new Set(["question_requested", "revision_requested", "accepted", "closed", "closed_by_timeout"]),
  question_requested: new Set(["in_progress", "ready_for_review", "retry", "failed"]),
  revision_requested: new Set(["reworking", "in_progress", "retry", "failed"]),
  reworking: new Set(["ready_for_review", "retry", "failed"]),
  accepted: new Set(["closed"]),
  closed: new Set([]),
  closed_by_timeout: new Set([]),
});

export function normalizeTaskStatus(value, fallback = "created") {
  const status = String(value || "").trim().toLowerCase();
  return TASK_STATUSES.includes(status) ? status : fallback;
}

export function allowedNextStatuses(status) {
  return [...(TRANSITIONS[normalizeTaskStatus(status)] || new Set())];
}

export function canTransitionTaskStatus(fromStatus, toStatus) {
  const from = normalizeTaskStatus(fromStatus);
  const to = normalizeTaskStatus(toStatus, "");
  if (!to) {
    return false;
  }
  if (from === to) {
    return true;
  }
  return Boolean(TRANSITIONS[from] && TRANSITIONS[from].has(to));
}

export function transitionTaskStatus(task, toStatus, now, meta = {}) {
  const from = normalizeTaskStatus(task && task.status);
  const to = normalizeTaskStatus(toStatus, "");
  if (!to) {
    return { ok: false, error: "invalid_status", from, to };
  }
  if (!canTransitionTaskStatus(from, to)) {
    return {
      ok: false,
      error: "invalid_status_transition",
      from,
      to,
      allowed: allowedNextStatuses(from),
    };
  }
  return {
    ok: true,
    from,
    to,
    event: makeLifecycleEvent("state_changed", now, {
      from,
      to,
      by: meta.by || "system",
      source: meta.source || "",
      note: meta.note || "",
    }),
  };
}

export function makeLifecycleEvent(type, now, details = {}) {
  return {
    type: String(type || "lifecycle_event").slice(0, 80),
    created_at: now,
    ...details,
  };
}

export function appendLifecycleEvent(task, event, limit = 80) {
  const current = task && task.lifecycle && typeof task.lifecycle === "object" && !Array.isArray(task.lifecycle)
    ? task.lifecycle
    : {};
  const events = Array.isArray(current.events) ? current.events : [];
  return {
    ...current,
    current_state: normalizeTaskStatus(task && task.status),
    allowed_next: allowedNextStatuses(task && task.status),
    events: event ? [...events, event].slice(-limit) : events.slice(-limit),
  };
}

export function initialTaskLifecycle(now) {
  return {
    current_state: "created",
    allowed_next: allowedNextStatuses("created"),
    events: [
      makeLifecycleEvent("task_created", now, {
        from: "",
        to: "created",
        by: "user",
        source: "web_intake",
      }),
    ],
  };
}

export function taskLifecycleSnapshot(task) {
  return appendLifecycleEvent(task, null);
}

export function isTaskActive(status) {
  return ACTIVE_STATUSES.has(normalizeTaskStatus(status, ""));
}

export function isTaskBridgeDue(status) {
  return BRIDGE_DUE_STATUSES.has(normalizeTaskStatus(status, ""));
}

export function isTaskFinished(status) {
  return FINISHED_STATUSES.has(normalizeTaskStatus(status, ""));
}
