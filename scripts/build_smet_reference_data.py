#!/usr/bin/env python3
"""Build a compact public snapshot for the panel smet reference tool.

The Telegram bot searches the operational rates/KVR stores, not the older
unified_smet_db subset. Keep the panel snapshot aligned with that runtime path.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any
import re
from datetime import date


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = Path("/home/ClawdLangust/data")
KVR_DIR = Path("/home/ClawdLangust/.openclaw/workspace/kvr_analytics")
RATES_FILE = DATA_DIR / "rates_store.json"
GESN_FILE = DATA_DIR / "gesn_all_labor_v3.json"
KVR_DIRECTORY_FILE = KVR_DIR / "kvr_directory.json"
RATE_KVR_MAP_FILE = KVR_DIR / "rate_kvr_map.json"
MEDIAN_PRICES_FILE = KVR_DIR / "median_prices.json"
KVR_MATERIALS_FILE = KVR_DIR / "kvr_materials.json"
OUTPUT_FILE = ROOT / "data" / "smet-reference.json"
SECTION_OUTPUT_DIR = ROOT / "data" / "smet-reference"
SECTION_CHUNK_SIZE = 5000
SNAPSHOT_VERSION = "smet-reference-panel-v4-bot-sections-gesn-analytics"

BOT_SECTION_ORDER = [
    "Подготовка территории",
    "Временные ЗиС",
    "Земляные работы",
    "Водопонижение",
    "Сваи и шпунты",
    "Гидроизоляция",
    "Покрытие стилобата",
    "Монолитные конструкции",
    "ЖБИ",
    "СТК",
    "Каменная кладка",
    "Металлоконструкции",
    "Кровля",
    "Башенные краны",
    "Лифты",
    "Отопление",
    "ВК",
    "Вентиляция",
    "ЭОМ",
    "СС",
    "ИТП",
    "Кондиционирование",
    "Фасады",
    "Окна двери",
    "Отделка МОП",
    "Отделка квартир",
    "Наружные сети",
    "Благоустройство",
    "Материалы",
]

SECTION_ALIASES = {
    "водоснабжение и канализация": "ВК",
    "электромонтажные работы": "ЭОМ",
    "слаботочные системы": "СС",
    "индивидуальные тепловые пункты": "ИТП",
    "кладка": "Каменная кладка",
    "спк": "Окна двери",
    "окна и двери": "Окна двери",
    "мтр": "Материалы",
}
TECHNICAL_SECTIONS = {"л6", "л7"}


def clean_text(value: Any, limit: int = 420) -> str:
    text = " ".join(str(value or "").split())
    return text[:limit]


def num(value: Any) -> float:
    try:
        return round(float(value or 0), 2)
    except (TypeError, ValueError):
        return 0.0


def normalize_key(value: Any) -> str:
    return " ".join(str(value or "").lower().replace("ё", "е").split())


def canonical_section(value: Any) -> str:
    section = clean_text(value, 120)
    key = normalize_key(section)
    if not key or key in TECHNICAL_SECTIONS:
        return ""
    return SECTION_ALIASES.get(key, section)


def load_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def build_kvr_name_index(directory: Any) -> dict[str, str]:
    index: dict[str, str] = {}
    if not isinstance(directory, list):
        return index
    for row in directory:
        if not isinstance(row, dict):
            continue
        code = normalize_key(row.get("kvr_code") or row.get("code"))
        if code:
            index[code] = clean_text(row.get("desc") or row.get("name"), 260)
    return index


def build_median_index(medians: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    median_by_code: dict[str, list[dict[str, Any]]] = {}
    for row in medians:
        code = normalize_key(row.get("kvr_code"))
        if code:
            median_by_code.setdefault(code, []).append(row)

    result: dict[str, dict[str, Any]] = {}
    for code, rows in median_by_code.items():
        best = max(rows, key=lambda row: row.get("ot_count") or row.get("count") or 0)
        result[code] = {
            "min": num(best.get("min")),
            "median": num(best.get("median")),
            "max": num(best.get("max")),
            "ot_count": int(best.get("ot_count") or best.get("count") or 0),
        }
    return result


def build_kvr_index(rate_kvr_map: Any, medians: list[dict[str, Any]], kvr_names: dict[str, str]) -> dict[tuple[str, str], dict[str, Any]]:
    median_by_code = build_median_index(medians)
    index: dict[tuple[str, str], dict[str, Any]] = {}
    rows: list[dict[str, Any]] = []
    if isinstance(rate_kvr_map, dict):
        rows = [{"desc": desc, "kvr_code": code, "section": ""} for desc, code in rate_kvr_map.items()]
    elif isinstance(rate_kvr_map, list):
        rows = [row for row in rate_kvr_map if isinstance(row, dict)]

    for row in rows:
        desc = normalize_key(row.get("desc") or row.get("description"))
        if not desc:
            continue
        section = normalize_key(row.get("section"))
        code_text = str(row.get("kvr_code") or row.get("code") or "").strip()
        code_key = normalize_key(code_text)
        value = {
            "kvr_code": code_text,
            "kvr_name": kvr_names.get(code_key, ""),
            "kvr_median": median_by_code.get(code_key),
        }
        index.setdefault((desc, section), value)
        index.setdefault((desc, ""), value)
        norm = re.sub(r"\s+", " ", desc).strip()
        if len(norm) > 20:
            index.setdefault((f"__prefix40__{norm[:40]}", ""), value)
            norm2 = re.sub(r"(\d)\s*(мм|м|шт|кг|т|л)", r"\1\2", norm)
            index.setdefault((f"__unitnorm40__{norm2[:40]}", ""), value)
    return index


def build_material_price_index(rates: list[dict[str, Any]], medians: list[dict[str, Any]]) -> tuple[dict[str, dict[str, Any]], dict[str, dict[str, Any]]]:
    price_by_desc: dict[str, dict[str, Any]] = {}
    for row in rates:
        if not isinstance(row, dict):
            continue
        section = normalize_key(row.get("section"))
        if section not in {"материалы", "мтр", "л7"} and num(row.get("work")) > 0:
            continue
        desc = normalize_key(row.get("desc") or row.get("description"))
        if desc and desc not in price_by_desc:
            price_by_desc[desc] = {
                "total": num(row.get("total")),
                "material": num(row.get("mat") if "mat" in row else row.get("material")),
                "basis": clean_text(row.get("basis"), 140),
                "object": clean_text(row.get("object"), 120),
                "source": "БД",
            }

    price_by_code: dict[str, dict[str, Any]] = {}
    for row in medians:
        code = normalize_key(row.get("kvr_code"))
        if code and code not in price_by_code:
            price_by_code[code] = {
                "min": num(row.get("min")),
                "median": num(row.get("median")),
                "max": num(row.get("max")),
                "ot_count": int(row.get("ot_count") or row.get("count") or 0),
                "source": "КВР-медиана",
            }
    return price_by_desc, price_by_code


def build_linked_materials(
    kvr_materials: dict[str, Any],
    price_by_desc: dict[str, dict[str, Any]],
    price_by_code: dict[str, dict[str, Any]],
) -> dict[str, list[dict[str, Any]]]:
    linked: dict[str, list[dict[str, Any]]] = {}
    if not isinstance(kvr_materials, dict):
        return linked
    for work_code, entry in kvr_materials.items():
        if not isinstance(entry, dict):
            continue
        rows = []
        seen = set()
        for material in entry.get("materials", []) or []:
            if not isinstance(material, dict):
                continue
            desc = clean_text(material.get("desc"), 180)
            desc_key = normalize_key(desc)
            if not desc or desc_key in seen:
                continue
            if "сопутствующие" in desc_key or "прочие материалы" in desc_key:
                continue
            seen.add(desc_key)
            code = clean_text(material.get("kvr"), 80)
            price = price_by_code.get(normalize_key(code)) or price_by_desc.get(desc_key)
            rows.append({
                "code": code,
                "title": desc,
                "unit": clean_text(material.get("unit"), 40),
                "price": price,
            })
        if rows:
            linked[str(work_code).strip()] = rows[:12]
    return linked


def lookup_kvr_info(
    title: str,
    section: str,
    kvr_index: dict[tuple[str, str], dict[str, Any]],
) -> dict[str, Any]:
    """Mirror bot lookup: exact desc+section, desc-only, then normalized prefix fallbacks."""
    desc_key = normalize_key(title)
    section_key = normalize_key(section)
    if not desc_key:
        return {}

    info = kvr_index.get((desc_key, section_key)) or kvr_index.get((desc_key, ""))
    if info:
        return info

    if len(desc_key) <= 20:
        return {}

    norm = re.sub(r"\s+", " ", desc_key).strip()
    norm2 = re.sub(r"(\d)\s*(мм|м|шт|кг|т|л)", r"\1\2", norm)
    return (
        kvr_index.get((f"__prefix40__{norm[:40]}", ""))
        or kvr_index.get((f"__unitnorm40__{norm2[:40]}", ""))
        or {}
    )


def extract_material_name(desc: str) -> str:
    prefix = normalize_key(desc).split(":", 1)[0]
    if ":" not in desc:
        return ""
    if prefix.startswith(("прокладк", "протяжк", "протягивани", "затяжк", "подключени", "расключени")):
        material = clean_text(desc.split(":", 1)[1], 240)
        return material if len(material) > 10 else ""
    return ""


OT_RE = re.compile(r"ОТ\s*(\d+)", re.IGNORECASE)


def ot_number(item: dict[str, Any]) -> int:
    match = OT_RE.search(str(item.get("basis") or ""))
    if not match:
        return 0
    try:
        return int(match.group(1))
    except ValueError:
        return 0


def dedupe_latest_rates(rates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Mirror bot output behavior: keep the freshest OT per desc+section."""
    by_key: dict[tuple[str, str], dict[str, Any]] = {}
    for item in rates:
        if not isinstance(item, dict):
            continue
        desc = normalize_key(item.get("desc") or item.get("description"))
        if not desc:
            continue
        section = normalize_key(item.get("section"))
        key = (desc, section)
        current = by_key.get(key)
        if current is None or ot_number(item) >= ot_number(current):
            by_key[key] = item
    return list(by_key.values())


def rate_record(
    item: dict[str, Any],
    index: int,
    kvr_index: dict[tuple[str, str], dict[str, Any]],
    linked_materials: dict[str, list[dict[str, Any]]],
) -> dict[str, Any]:
    title = clean_text(item.get("desc") or item.get("description"), 420)
    section = canonical_section(item.get("section"))
    kvr_info = lookup_kvr_info(title, section, kvr_index)
    kvr_code = clean_text(kvr_info.get("kvr_code") or item.get("kvr_code") or item.get("code"), 80)
    work = num(item.get("work"))
    material = num(item.get("mat") if "mat" in item else item.get("material"))
    total = num(item.get("total"))
    material_name = extract_material_name(title)
    return {
        "id": f"rate-{index}",
        "type": "rate",
        "rate_kind": "work" if work > 0 else "material",
        "title": title,
        "material_name": material_name,
        "code": kvr_code,
        "kvr_name": clean_text(kvr_info.get("kvr_name"), 260),
        "unit": clean_text(item.get("unit"), 40),
        "section": section,
        "total": total,
        "work": work,
        "material": material,
        "kvr_median": kvr_info.get("kvr_median"),
        "linked_materials": linked_materials.get(kvr_code, []) if kvr_code else [],
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
    rates_source = load_json(RATES_FILE, {})
    gesn_source = load_json(GESN_FILE, {})
    kvr_directory = load_json(KVR_DIRECTORY_FILE, [])
    rate_kvr_map = load_json(RATE_KVR_MAP_FILE, {})
    medians = load_json(MEDIAN_PRICES_FILE, [])
    kvr_materials = load_json(KVR_MATERIALS_FILE, {})

    source_rates = rates_source.get("rates", []) if isinstance(rates_source, dict) else []
    source_gesn = gesn_source.get("norms", []) if isinstance(gesn_source, dict) else []
    kvr_names = build_kvr_name_index(kvr_directory)
    kvr_index = build_kvr_index(rate_kvr_map, medians if isinstance(medians, list) else [], kvr_names)
    price_by_desc, price_by_code = build_material_price_index(source_rates, medians if isinstance(medians, list) else [])
    linked_materials = build_linked_materials(kvr_materials, price_by_desc, price_by_code)

    rates = [
        rate_record(item, index, kvr_index, linked_materials)
        for index, item in enumerate(source_rates, start=1)
        if isinstance(item, dict) and (item.get("desc") or item.get("description"))
    ]
    gesn = [gesn_record(item, index) for index, item in enumerate(source_gesn, start=1) if isinstance(item, dict)]
    sectioned_rates = [row for row in rates if row.get("section")]
    sections_with_data = {row["section"] for row in sectioned_rates}
    sections = [section for section in BOT_SECTION_ORDER if section in sections_with_data]
    sections.extend(sorted(sections_with_data - set(sections)))
    SECTION_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    section_files: dict[str, list[str]] = {}
    for old_file in SECTION_OUTPUT_DIR.glob("*.json"):
        old_file.unlink()
    for index, section in enumerate(sections, start=1):
        section_items = [row for row in rates if row.get("section") == section]
        urls = []
        chunks = [section_items[i:i + SECTION_CHUNK_SIZE] for i in range(0, len(section_items), SECTION_CHUNK_SIZE)] or [[]]
        for chunk_index, chunk in enumerate(chunks, start=1):
            filename = f"section-{index:03d}-{chunk_index:02d}.json"
            section_payload = {
                "version": SNAPSHOT_VERSION,
                "section": section,
                "count": len(section_items),
                "chunk": chunk_index,
                "chunks": len(chunks),
                "items": chunk,
            }
            (SECTION_OUTPUT_DIR / filename).write_text(
                json.dumps(section_payload, ensure_ascii=False, separators=(",", ":")),
                encoding="utf-8",
            )
            urls.append(f"/data/smet-reference/{filename}")
        section_files[section] = urls
    payload = {
        "version": SNAPSHOT_VERSION,
        "generated": date.today().isoformat(),
        "source": "Боевая база CostIQ: rates_store + КВР + материалы Л7 + ГЭСН",
        "stats": {
            "rates": len(source_rates),
            "searchable_rates": len(sectioned_rates),
            "unsectioned_rates": len(rates) - len(sectioned_rates),
            "work_rates": sum(1 for row in sectioned_rates if row.get("rate_kind") == "work"),
            "material_rates": sum(1 for row in sectioned_rates if row.get("rate_kind") == "material"),
            "gesn": len(gesn),
            "sections": len(sections),
            "kvr_links": len(rate_kvr_map) if isinstance(rate_kvr_map, dict) else len(rate_kvr_map or []),
            "work_material_links": len(linked_materials),
        },
        "search_contract": {
            "source": "Telegram bot /api/rates/search",
            "steps": ["section_filter", "substring", "word_match", "stem_match", "token_set_ratio_85", "latest_ot_dedupe", "work_material_balance"],
            "default_limit": 10,
        },
        "sections": sections,
        "section_files": section_files,
        "items": gesn,
    }
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"[INFO] wrote {OUTPUT_FILE} ({len(gesn)} GESN, {len(rates)} rates in {len(section_files)} section files)")


if __name__ == "__main__":
    main()
