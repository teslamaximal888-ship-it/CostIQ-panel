import { taskLifecycleSnapshot } from "../_shared/task-lifecycle.js";
import { taskCheckpointSnapshot } from "../_shared/task-checkpoints.js";
import { taskEventLogSnapshot } from "../_shared/task-events.js";
import { taskResumeSnapshot } from "../_shared/task-resume.js";

const BRIDGE_ADMIN_TOKEN_SHA256 = "4114f8b668ea37337c30b5b92f78a91d9739435330e71dbba6472188e9368126";
const REVIEW_ACCESS_TTL_SECONDS = 60 * 60 * 24 * 7;

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

function cleanText(value, limit = 1000) {
  return String(value || "").trim().slice(0, limit);
}

async function hmacSha256(key, value) {
  const cryptoKey = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(value)));
}

function hex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return hex(new Uint8Array(digest));
}

async function reviewAccessSecret(env) {
  const adminSecret = cleanText(env.COSTIQ_PANEL_ADMIN_TOKEN || "", 500);
  return adminSecret ? sha256Hex(adminSecret) : BRIDGE_ADMIN_TOKEN_SHA256;
}

async function createReviewAccessToken(task, env) {
  if (!task || !task.trace_id || !task.telegram_user || !task.telegram_user.id) {
    return "";
  }
  const exp = Math.floor(Date.now() / 1000) + REVIEW_ACCESS_TTL_SECONDS;
  const value = `${task.trace_id}.${task.created_at || ""}.${task.telegram_user.id}.${exp}`;
  const sig = hex(await hmacSha256(new TextEncoder().encode(await reviewAccessSecret(env)), value));
  return `${exp}.${sig}`;
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
  publicTask.events = taskEventLogSnapshot(task, 40);
  publicTask.resume = taskResumeSnapshot(task);
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
  publicTask.review_access_token = await createReviewAccessToken(task, env);
  return jsonResponse({ ok: true, task: publicTask });
}
