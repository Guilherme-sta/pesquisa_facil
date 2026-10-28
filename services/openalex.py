"""OpenAlex author metrics. Only explicitly reviewed OpenAlex IDs are queried."""
from __future__ import annotations

import json
import os
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
PROFILES_FILE = Path(os.getenv("CITATION_PROFILES_PATH", str(ROOT / "data" / "private" / "citation_profiles.json")))
SOURCE = "OpenAlex"
BASE_URL = "https://api.openalex.org/authors/"
_cache: dict[str, tuple[float, dict]] = {}
TTL_SECONDS = 24 * 60 * 60


def load_verified_profiles() -> dict[str, dict]:
    """Load curator-confirmed links keyed by local public faculty ID."""
    try:
        payload = json.loads(PROFILES_FILE.read_text(encoding="utf-8-sig"))
    except FileNotFoundError:
        return {}
    profiles = {}
    for item in payload.get("profiles", []):
        faculty_id = item.get("faculty_id")
        author_id = item.get("openalex_author_id")
        if (faculty_id and isinstance(author_id, str) and author_id.startswith("A")
                and author_id[1:].isdigit() and item.get("verified") is True
                and item.get("verified_at") and item.get("verification_method")):
            profiles[faculty_id] = item
    return profiles


def fetch_author(author_id: str) -> dict:
    cached = _cache.get(author_id)
    now = time.time()
    if cached and cached[0] > now:
        return cached[1]
    headers = {"User-Agent": "IFPI-Pesquisa-Facil/1.0"}
    params = {}
    if os.getenv("OPENALEX_MAILTO"):
        params["mailto"] = os.environ["OPENALEX_MAILTO"]
    response = requests.get(BASE_URL + author_id, params=params, headers=headers, timeout=12)
    response.raise_for_status()
    data = response.json()
    metrics = {
        "cited_by_count": int(data.get("cited_by_count") or 0),
        "works_count": int(data.get("works_count") or 0),
        "counts_by_year": data.get("counts_by_year") or [],
        "openalex_id": data.get("id"),
        "display_name": data.get("display_name"),
        "source_url": data.get("ids", {}).get("openalex") or data.get("id"),
        "retrieved_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }
    _cache[author_id] = (now + TTL_SECONDS, metrics)
    return metrics
