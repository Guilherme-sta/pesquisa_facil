"""Read and normalize the public IFPI faculty snapshot exported from Metabase."""
from __future__ import annotations

import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parents[1] / "data" / "professores.json"


def load_faculty() -> tuple[dict, list[dict]]:
    payload = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    records = payload.get("records", [])
    clean = []
    for row in records:
        if not isinstance(row, dict) or not row.get("id") or not row.get("name"):
            continue
        clean.append({**row, "campus": row.get("campus_exercise") or row.get("campus_assignment") or None})
    return payload, clean
