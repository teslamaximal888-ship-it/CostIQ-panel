#!/usr/bin/env python3
"""Build public snapshots for interactive CostIQ Panel tools."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE_DATA = Path("/home/ClawdCostIQ/workspace/data")
BOT_DATA = Path("/home/ClawdLangust/.openclaw/workspace/eom_bot")
OUTPUT_FILE = ROOT / "data" / "panel-tools.json"


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def clean(value: Any, limit: int = 500) -> str:
    return " ".join(str(value or "").split())[:limit]


def num(value: Any) -> float | None:
    try:
        if value is None or value == "":
            return None
        return round(float(value), 2)
    except (TypeError, ValueError):
        return None


def upss_group_key(collection_id: int, code: str) -> str:
    parts = str(code or "").split("-")
    if collection_id == 10 and len(parts) >= 3 and parts[1] in {"0", "2"}:
        return "-".join(parts[:3])
    return "-".join(parts[:2])


def code_tuple(value: str) -> tuple[int, ...]:
    try:
        return tuple(int(part) for part in str(value).split("-") if part != "")
    except ValueError:
        return (999,)


def normalize_upss(ncs_source: dict[str, Any]) -> dict[str, Any]:
    source = load_json(BOT_DATA / "upss_data.json", {})
    collections = []
    items = []
    for collection in source.get("collections", []) or []:
        cid = int(collection.get("id") or 0)
        groups: dict[str, dict[str, Any]] = {}
        for item in collection.get("items", []) or []:
            code = clean(item.get("code"), 80)
            gid = upss_group_key(cid, code)
            group = groups.setdefault(gid, {"id": gid, "name": "", "items": []})
            title = clean(item.get("name"), 180)
            if not group["name"]:
                group["name"] = title[:70]
            record = {
                "id": f"upss-{code}",
                "code": code,
                "name": title,
                "unit": clean(item.get("unit"), 120),
                "cost": num(item.get("cost")),
                "collection_id": cid,
                "collection": clean(collection.get("name"), 160),
                "group": gid,
                "cost_groups": item.get("cost_groups", [])[:40],
                "work_types": item.get("work_types", [])[:60],
                "finishing": clean(item.get("finishing"), 900),
                "tep": item.get("tep") if isinstance(item.get("tep"), dict) else {},
            }
            group["items"].append(record["id"])
            items.append(record)
        groups_list = sorted(groups.values(), key=lambda row: code_tuple(row["id"]))
        collections.append({
            "id": cid,
            "name": clean(collection.get("name"), 160),
            "groups": groups_list,
            "coefficients": collection.get("coefficients", []),
        })
    return {
        "meta": source.get("meta", {}),
        "averaged": source.get("averaged", []),
        "collections": collections,
        "items": items,
        "count": len(items),
    }


def normalize_ncs() -> dict[str, Any]:
    source = load_json(WORKSPACE_DATA / "ncs_full.json", {})
    collections = []
    items = []
    for collection in source.get("collections", []) or []:
        coll_id = clean(collection.get("id"), 20)
        sections = []
        for section in collection.get("sections", []) or []:
            tables = []
            for table in section.get("tables", []) or []:
                table_items = []
                for item in table.get("items", []) or []:
                    code = clean(item.get("code"), 80)
                    record = {
                        "id": f"ncs-{code}",
                        "code": code,
                        "name": clean(item.get("name") or item.get("variant"), 240),
                        "unit": clean(item.get("unit") or table.get("unit"), 160),
                        "price": num(item.get("price")),
                        "power": num(item.get("power")),
                        "diameter_mm": num(item.get("diameter_mm")),
                        "depth_m": num(item.get("depth_m")),
                        "material": clean(item.get("material"), 120),
                        "collection_id": coll_id,
                        "collection": clean(collection.get("name"), 160),
                        "section_id": clean(section.get("id"), 80),
                        "section": clean(section.get("name"), 200),
                        "table_code": clean(table.get("code"), 80),
                        "table": clean(table.get("name"), 220),
                    }
                    table_items.append(record["id"])
                    items.append(record)
                tables.append({
                    "code": clean(table.get("code"), 80),
                    "name": clean(table.get("name"), 220),
                    "unit": clean(table.get("unit"), 160),
                    "items": table_items,
                })
            sections.append({
                "id": clean(section.get("id"), 80),
                "name": clean(section.get("name"), 200),
                "tables": tables,
            })
        collections.append({
            "id": coll_id,
            "name": clean(collection.get("name"), 160),
            "type": clean(collection.get("type"), 80),
            "sections": sections,
        })
    return {
        "meta": source.get("meta", {}),
        "collections": collections,
        "items": items,
        "count": len(items),
    }


def normalize_tep() -> dict[str, Any]:
    source = load_json(WORKSPACE_DATA / "tep_data.json", {})
    objects = []
    for project, rows in (source.get("projects", {}) or {}).items():
        for index, row in enumerate(rows or [], start=1):
            objects.append({
                "id": f"tep-{len(objects) + 1}",
                "project": clean(project, 220),
                "object": clean(row.get("object"), 160),
                "type": clean(row.get("type"), 80),
                "class": clean(row.get("class"), 80),
                "queue": clean(row.get("queue"), 80),
                "dates": row.get("dates") if isinstance(row.get("dates"), dict) else {},
                "areas_total": row.get("areas_total") if isinstance(row.get("areas_total"), dict) else {},
                "realty": row.get("realty") if isinstance(row.get("realty"), list) else [],
            })
    return {
        "meta": source.get("meta", {}),
        "projects": sorted((source.get("projects", {}) or {}).keys()),
        "objects": objects,
        "count": len(objects),
    }


def main() -> None:
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": "panel-tools-v1",
        "ncs": normalize_ncs(),
        "upss": normalize_upss({}),
        "tep": normalize_tep(),
        "benchmarks": load_json(WORKSPACE_DATA / "construction_benchmarks.json", {}),
        "finishing": load_json(WORKSPACE_DATA / "apartment_finishing.json", {}),
        "cost_changes": load_json(WORKSPACE_DATA / "cost_changes.json", {}),
    }
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(
        "[INFO] wrote",
        OUTPUT_FILE,
        f"ncs={payload['ncs']['count']}",
        f"upss={payload['upss']['count']}",
        f"tep={payload['tep']['count']}",
    )


if __name__ == "__main__":
    main()
