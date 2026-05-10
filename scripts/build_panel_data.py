#!/usr/bin/env python3
"""Build static CostIQ panel data from local queue and trace files."""

from __future__ import annotations

import json
import re
import time
import argparse
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


WORKSPACE = Path("/home/ClawdCostIQ/workspace")
STATE_DIR = Path("/home/ClawdCostIQ/.codex/telegram_context")
PANEL_DIR = WORKSPACE / "costiq-panel"
TASK_QUEUE_FILE = WORKSPACE / "task_queue.json"
GUEST_TRACE_FILE = STATE_DIR / "guest_trace.jsonl"
BRIDGE_LOG_FILE = STATE_DIR / "bridge.log"
OUTPUT_FILE = PANEL_DIR / "panel-data.json"


VOLATILE_KEYS = {"generated_at"}


def iso_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def read_json(path: Path, default: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return default


def comparable_payload(payload: Any) -> Any:
    if isinstance(payload, dict):
        return {key: comparable_payload(value) for key, value in payload.items() if key not in VOLATILE_KEYS}
    if isinstance(payload, (list, tuple)):
        return [comparable_payload(item) for item in payload]
    return payload


def read_jsonl_tail(path: Path, limit: int = 1000) -> list[dict[str, Any]]:
    try:
        lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    except (FileNotFoundError, OSError):
        return []

    rows: list[dict[str, Any]] = []
    for line in lines[-limit:]:
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(item, dict):
            rows.append(item)
    return rows


def task_stats() -> dict[str, Any]:
    data = read_json(TASK_QUEUE_FILE, {"queue": []})
    queue = data.get("queue", []) if isinstance(data, dict) else []
    if not isinstance(queue, list):
        queue = []

    counts: dict[str, Any] = {"total": len(queue), "done": 0, "in_work": 0, "waiting": 0, "errors": 0}
    recent: list[dict[str, Any]] = []

    for item in queue:
        if not isinstance(item, dict):
            continue
        status = str(item.get("status") or "").lower()
        if status in {"done", "completed", "ready"}:
            counts["done"] += 1
        elif status in {"in_progress", "started", "running", "work"}:
            counts["in_work"] += 1
        elif status in {"error", "failed", "fail"} or item.get("error_msg"):
            counts["errors"] += 1
        else:
            counts["waiting"] += 1
        recent.append(
            {
                "id": item.get("id") or "",
                "skill": item.get("skill") or "",
                "status": item.get("status") or "",
                "user": item.get("user_name") or item.get("user_id") or "",
                "created_at": item.get("created_at") or "",
                "completed_at": item.get("completed_at") or "",
                "file_name": item.get("file_name") or "",
            }
        )

    recent.sort(key=lambda row: row.get("created_at") or row.get("completed_at") or "", reverse=True)
    counts["recent"] = recent[:6]
    return counts


def trace_stats() -> dict[str, Any]:
    rows = read_jsonl_tail(GUEST_TRACE_FILE, 1500)
    now = time.time()
    finishes = [row for row in rows if row.get("event") == "finish"]
    finishes_24h = [row for row in finishes if now - float(row.get("ts_epoch") or 0) <= 24 * 60 * 60]
    finishes_7d = [row for row in finishes if now - float(row.get("ts_epoch") or 0) <= 7 * 24 * 60 * 60]
    ok_statuses = {"success", "success_fast", "file_task_redirect", "sent"}
    errors = [row for row in finishes_7d if str(row.get("status") or "") not in ok_statuses]

    latencies: list[float] = []
    intents: dict[str, int] = {}
    statuses: dict[str, int] = {}
    for row in finishes_7d:
        intent = str(row.get("intent") or "unknown")
        status = str(row.get("status") or "unknown")
        intents[intent] = intents.get(intent, 0) + 1
        statuses[status] = statuses.get(status, 0) + 1
        try:
            latencies.append(float(row.get("latency_ms") or 0))
        except (TypeError, ValueError):
            pass

    avg_latency = round(sum(latencies) / len(latencies)) if latencies else 0
    last = finishes[-1] if finishes else {}
    return {
        "total_finishes": len(finishes),
        "finishes_24h": len(finishes_24h),
        "finishes_7d": len(finishes_7d),
        "errors_7d": len(errors),
        "avg_latency_ms": avg_latency,
        "top_intents": sorted(intents.items(), key=lambda item: (-item[1], item[0]))[:5],
        "top_statuses": sorted(statuses.items(), key=lambda item: (-item[1], item[0]))[:5],
        "last": {
            "ts": last.get("ts") or "",
            "intent": last.get("intent") or "",
            "status": last.get("status") or "",
            "latency_ms": last.get("latency_ms") or 0,
        },
    }


def bridge_stats() -> dict[str, Any]:
    try:
        lines = BRIDGE_LOG_FILE.read_text(encoding="utf-8", errors="replace").splitlines()
    except (FileNotFoundError, OSError):
        return {"incoming_today": 0, "webapp_today": 0, "last_event": ""}

    today = datetime.now().strftime("%Y-%m-%d")
    today_lines = [line for line in lines if line.startswith(today)]
    incoming = sum("Incoming update" in line for line in today_lines)
    webapp = sum("WebApp action" in line for line in today_lines)
    last_event = ""
    for line in reversed(lines):
        if "Incoming update" in line or "WebApp action" in line:
            last_event = re.sub(r"\s+", " ", line).strip()
            break
    return {"incoming_today": incoming, "webapp_today": webapp, "last_event": last_event[:180]}


def build_payload() -> dict[str, Any]:
    tasks = task_stats()
    trace = trace_stats()
    bridge = bridge_stats()
    return {
        "generated_at": iso_now(),
        "status": "контроль" if trace["errors_7d"] else "активен",
        "metrics": {
            "bot": "активен",
            "queue": f"{tasks['waiting']} в ожидании",
            "today": f"{bridge['incoming_today']} входящих",
            "errors": str(trace["errors_7d"]),
        },
        "tasks": tasks,
        "trace": trace,
        "bridge": bridge,
    }


def write_payload(payload: dict[str, Any], quiet: bool = False) -> bool:
    previous = read_json(OUTPUT_FILE, {})
    if comparable_payload(previous) == comparable_payload(payload):
        if not quiet:
            print("[INFO] snapshot data unchanged")
        return False

    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if not quiet:
        print(f"[INFO] wrote {OUTPUT_FILE}")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Build static CostIQ panel data snapshot.")
    parser.add_argument("--quiet", action="store_true", help="Print only errors.")
    args = parser.parse_args()

    payload = build_payload()
    write_payload(payload, quiet=args.quiet)


if __name__ == "__main__":
    main()
