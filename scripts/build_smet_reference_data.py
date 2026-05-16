#!/usr/bin/env python3
"""Build a compact public snapshot for the panel smet reference tool."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = Path("/home/ClawdLangust/data")
SOURCE_FILE = DATA_DIR / "unified_smet_db.json"
OUTPUT_FILE = ROOT / "data" / "smet-reference.json"


def clean_text(value: Any, limit: int = 420) -> str:
    text = " ".join(str(value or "").split())
    return text[:limit]


def num(value: Any) -> float:
    try:
        return round(float(value or 0), 2)
    except (TypeError, ValueError):
        return 0.0


def rate_record(item: dict[str, Any], index: int) -> dict[str, Any]:
    return {
        "id": f"rate-{index}",
        "type": "rate",
        "title": clean_text(item.get("desc"), 360),
        "code": clean_text(item.get("kvr_code") or item.get("code"), 80),
        "unit": clean_text(item.get("unit"), 40),
        "section": clean_text(item.get("section"), 120),
        "total": num(item.get("total")),
        "work": num(item.get("work")),
        "material": num(item.get("mat") if "mat" in item else item.get("material")),
        "basis": clean_text(item.get("basis") or item.get("source"), 180),
        "object": clean_text(item.get("object"), 140),
        "date": clean_text(item.get("date"), 40),
    }


def gesn_record(item: dict[str, Any], index: int) -> dict[str, Any]:
    materials = item.get("materials") if isinstance(item.get("materials"), list) else []
    machines = item.get("machines") if isinstance(item.get("machines"), list) else []
    material_names = [clean_text(row.get("name"), 80) for row in materials[:5] if isinstance(row, dict)]
    machine_names = [clean_text(row.get("name"), 80) for row in machines[:5] if isinstance(row, dict)]
    title = clean_text(" ".join([str(item.get("table_name") or ""), str(item.get("name") or "")]), 360)
    return {
        "id": f"gesn-{index}",
        "type": "gesn",
        "title": title,
        "code": clean_text(item.get("code"), 80),
        "unit": clean_text(item.get("unit"), 40),
        "section": clean_text(item.get("sbornik"), 80),
        "labor_hours": num(item.get("labor_hours")),
        "rank": clean_text(item.get("rank"), 40),
        "materials": material_names,
        "machines": machine_names,
        "basis": "ФСНБ-2020 / ГЭСН",
    }


def main() -> None:
    source = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))
    rates = [rate_record(item, index) for index, item in enumerate(source.get("rates", []), start=1)]
    gesn = [gesn_record(item, index) for index, item in enumerate(source.get("gesn", []), start=1)]
    sections = sorted({row["section"] for row in rates if row.get("section")})
    payload = {
        "version": "smet-reference-panel-v1",
        "generated": "2026-05-16",
        "source": source.get("description", "Единая база сметчика"),
        "stats": {
            "rates": len(rates),
            "gesn": len(gesn),
            "sections": len(sections),
        },
        "sections": sections,
        "items": rates + gesn,
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"[INFO] wrote {OUTPUT_FILE} ({len(payload['items'])} items)")


if __name__ == "__main__":
    main()
