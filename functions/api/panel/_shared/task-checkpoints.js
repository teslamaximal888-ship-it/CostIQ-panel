import { appendLifecycleEvent, makeLifecycleEvent } from "./task-lifecycle.js";

export const TASK_CHECKPOINTS = Object.freeze([
  "file_received",
  "file_parsed",
  "validated_input",
  "matched_rates",
  "calculated",
  "ai_review_started",
  "ai_review_done",
  "result_file_created",
  "result_uploaded",
  "ready_for_review",
]);

const CHECKPOINT_INDEX = new Map(TASK_CHECKPOINTS.map((checkpoint, index) => [checkpoint, index]));

const CHECKPOINT_TRANSITIONS = Object.freeze({
  "": new Set(["file_received", "validated_input"]),
  file_received: new Set(["file_parsed", "validated_input"]),
  file_parsed: new Set(["validated_input"]),
  validated_input: new Set(["matched_rates", "calculated", "ai_review_started"]),
  matched_rates: new Set(["calculated"]),
  calculated: new Set(["ai_review_started", "result_file_created"]),
  ai_review_started: new Set(["ai_review_done"]),
  ai_review_done: new Set(["result_file_created"]),
  result_file_created: new Set(["result_uploaded"]),
  result_uploaded: new Set(["ready_for_review"]),
  ready_for_review: new Set([]),
});

export function normalizeTaskCheckpoint(value, fallback = "") {
  const checkpoint = String(value || "").trim().toLowerCase();
  return TASK_CHECKPOINTS.includes(checkpoint) ? checkpoint : fallback;
}

export function allowedNextCheckpoints(current) {
  return [...(CHECKPOINT_TRANSITIONS[normalizeTaskCheckpoint(current)] || new Set())];
}

export function canSaveTaskCheckpoint(fromCheckpoint, toCheckpoint) {
  const from = normalizeTaskCheckpoint(fromCheckpoint);
  const to = normalizeTaskCheckpoint(toCheckpoint, "");
  if (!to) {
    return false;
  }
  if (from === to) {
    return true;
  }
  return Boolean(CHECKPOINT_TRANSITIONS[from] && CHECKPOINT_TRANSITIONS[from].has(to));
}

function cleanPayload(value, depth = 0) {
  if (depth > 3) {
    return null;
  }
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string") {
    return value.slice(0, 1000);
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => cleanPayload(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 40)
        .map(([key, item]) => [String(key).slice(0, 80), cleanPayload(item, depth + 1)]),
    );
  }
  return null;
}

export function saveTaskCheckpoint(task, checkpoint, now, meta = {}) {
  const current = task && task.checkpoint && typeof task.checkpoint === "object" && !Array.isArray(task.checkpoint)
    ? task.checkpoint
    : {};
  const from = normalizeTaskCheckpoint(current.current);
  const to = normalizeTaskCheckpoint(checkpoint, "");
  if (!to) {
    return { ok: false, error: "invalid_checkpoint", from, to };
  }
  if (!canSaveTaskCheckpoint(from, to)) {
    return {
      ok: false,
      error: "invalid_checkpoint_transition",
      from,
      to,
      allowed: allowedNextCheckpoints(from),
    };
  }

  const completed = Array.isArray(current.completed) ? current.completed.filter((item) => normalizeTaskCheckpoint(item, "")) : [];
  const completedSet = new Set(completed);
  completedSet.add(to);
  const completedOrdered = [...completedSet].sort((a, b) => CHECKPOINT_INDEX.get(a) - CHECKPOINT_INDEX.get(b));
  const message = String(meta.message || "").trim().slice(0, 1000);
  const payload = cleanPayload(meta.payload);
  const snapshot = {
    current: to,
    completed: completedOrdered,
    updated_at: now,
    by: String(meta.by || "bridge").slice(0, 60),
    source: String(meta.source || "").slice(0, 80),
    message,
    payload: payload && typeof payload === "object" ? payload : {},
    allowed_next: allowedNextCheckpoints(to),
  };
  const event = makeLifecycleEvent("checkpoint_saved", now, {
    checkpoint: to,
    from,
    by: snapshot.by,
    source: snapshot.source,
    message,
  });

  return {
    ok: true,
    from,
    to,
    checkpoint: snapshot,
    lifecycle: appendLifecycleEvent({ ...task, checkpoint: snapshot }, event),
    event,
  };
}

export function taskCheckpointSnapshot(task) {
  const current = task && task.checkpoint && typeof task.checkpoint === "object" && !Array.isArray(task.checkpoint)
    ? task.checkpoint
    : {};
  const checkpoint = normalizeTaskCheckpoint(current.current);
  return {
    current: checkpoint,
    completed: Array.isArray(current.completed) ? current.completed.filter((item) => normalizeTaskCheckpoint(item, "")) : [],
    updated_at: String(current.updated_at || ""),
    by: String(current.by || ""),
    source: String(current.source || ""),
    message: String(current.message || ""),
    payload: current.payload && typeof current.payload === "object" && !Array.isArray(current.payload) ? current.payload : {},
    allowed_next: allowedNextCheckpoints(checkpoint),
  };
}
