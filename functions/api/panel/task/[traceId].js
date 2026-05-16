import { taskLifecycleSnapshot } from "../_shared/task-lifecycle.js";
import { taskCheckpointSnapshot } from "../_shared/task-checkpoints.js";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function cleanTraceId(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 80);
}

export async function onRequestOptions() {
  return jsonResponse({ ok: true });
}

export async function onRequestGet({ env, params }) {
  if (!env.WEB_INTAKE) {
    return jsonResponse({ ok: false, error: "storage_not_configured" }, 503);
  }

  const traceId = cleanTraceId(params.traceId);
  if (!traceId) {
    return jsonResponse({ ok: false, error: "trace_required" }, 400);
  }

  const raw = await env.WEB_INTAKE.get(`task:${traceId}`);
  if (!raw) {
    return jsonResponse({ ok: false, error: "task_not_found" }, 404);
  }

  let task;
  try {
    task = JSON.parse(raw);
  } catch (error) {
    return jsonResponse({ ok: false, error: "task_corrupted" }, 500);
  }

  const { attachment, telegram_user, telegram_auth_date, retry_after, processing_started_at, processing_finished_at, ...publicTask } = task;
  publicTask.lifecycle = taskLifecycleSnapshot(task);
  publicTask.checkpoint = taskCheckpointSnapshot(task);
  if (attachment) {
    publicTask.attachment_status = task.attachment_status || "stored";
  }
  if (publicTask.result_archive && publicTask.result_archive.id) {
    publicTask.result_files = [];
  } else if (Array.isArray(publicTask.result_files)) {
    publicTask.result_files = publicTask.result_files.map((file) => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      created_at: file.created_at,
      url: `/api/panel/task/${encodeURIComponent(traceId)}/result-file/${encodeURIComponent(file.id)}`,
    }));
  }
  if (publicTask.result_archive && publicTask.result_archive.id) {
    publicTask.result_archive = {
      id: publicTask.result_archive.id,
      name: publicTask.result_archive.name,
      type: publicTask.result_archive.type,
      size: publicTask.result_archive.size,
      created_at: publicTask.result_archive.created_at,
      url: `/api/panel/task/${encodeURIComponent(traceId)}/result-archive`,
    };
  }
  if (publicTask.error_text) {
    publicTask.error_text = String(publicTask.error_text).slice(0, 500);
  }
  return jsonResponse({ ok: true, task: publicTask });
}
