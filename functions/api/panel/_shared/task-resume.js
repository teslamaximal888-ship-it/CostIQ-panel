import {
  appendLifecycleEvent,
  makeLifecycleEvent,
  normalizeTaskStatus,
  transitionTaskStatus,
} from "./task-lifecycle.js";
import { allowedNextCheckpoints, taskCheckpointSnapshot } from "./task-checkpoints.js";

const RESUMABLE_STATUSES = new Set(["failed", "retry"]);
const OPERATOR_RESUMABLE_STATUSES = new Set(["failed", "retry", "in_progress"]);

function cleanText(value, limit = 1000) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim()
    .slice(0, limit);
}

function cleanInteger(value, fallback = 0, min = 0, max = 99) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(Math.max(parsed, min), max);
}

function normalizeResumeMode(value) {
  const mode = cleanText(value, 40).toLowerCase();
  return ["resume", "retry", "manual_retry"].includes(mode) ? mode : "resume";
}

export function canResumeTask(task) {
  return RESUMABLE_STATUSES.has(normalizeTaskStatus(task && task.status, ""));
}

export function taskResumeSnapshot(task) {
  const current = task && task.resume && typeof task.resume === "object" && !Array.isArray(task.resume)
    ? task.resume
    : {};
  const checkpoint = taskCheckpointSnapshot(task);
  return {
    can_resume: canResumeTask(task),
    status: normalizeTaskStatus(task && task.status, ""),
    checkpoint: checkpoint.current,
    completed_checkpoints: checkpoint.completed,
    next_checkpoints: allowedNextCheckpoints(checkpoint.current),
    requested_at: cleanText(current.requested_at, 80),
    by: cleanText(current.by, 80),
    source: cleanText(current.source, 100),
    mode: normalizeResumeMode(current.mode),
    attempt: cleanInteger(current.attempt, 0, 0, 99),
    message: cleanText(current.message, 1000),
  };
}

export function scheduleTaskResume(task, now, meta = {}) {
  const fromStatus = normalizeTaskStatus(task && task.status, "");
  if (!OPERATOR_RESUMABLE_STATUSES.has(fromStatus)) {
    return {
      ok: false,
      error: "resume_not_available",
      status: fromStatus,
      resumable_statuses: [...OPERATOR_RESUMABLE_STATUSES],
    };
  }

  const transition = transitionTaskStatus(task, "retry", now, {
    by: meta.by || "admin",
    source: meta.source || "resume_api",
    note: meta.message || "",
  });
  if (!transition.ok) {
    return transition;
  }

  const checkpoint = taskCheckpointSnapshot(task);
  const currentResume = task && task.resume && typeof task.resume === "object" && !Array.isArray(task.resume)
    ? task.resume
    : {};
  const attempt = cleanInteger(currentResume.attempt, 0, 0, 99) + 1;
  const message = cleanText(meta.message, 1000) || "Повтор запланирован от последнего checkpoint";
  const resume = {
    requested_at: now,
    by: cleanText(meta.by, 80) || "admin",
    source: cleanText(meta.source, 100) || "resume_api",
    mode: normalizeResumeMode(meta.mode),
    from_status: fromStatus,
    checkpoint: checkpoint.current,
    completed_checkpoints: checkpoint.completed,
    next_checkpoints: allowedNextCheckpoints(checkpoint.current),
    attempt,
    message,
  };
  const resumeEvent = makeLifecycleEvent("resume_scheduled", now, {
    checkpoint: checkpoint.current,
    from: fromStatus,
    to: "retry",
    by: resume.by,
    source: resume.source,
    message,
  });
  let lifecycle = appendLifecycleEvent({ ...task, status: "retry" }, transition.event);
  lifecycle = appendLifecycleEvent({ ...task, status: "retry", lifecycle }, resumeEvent);

  return {
    ok: true,
    from: fromStatus,
    to: "retry",
    resume,
    lifecycle,
    event: resumeEvent,
  };
}
