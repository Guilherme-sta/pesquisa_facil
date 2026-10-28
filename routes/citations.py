"""Public faculty citation dashboard endpoints."""
from datetime import datetime, timezone

import requests
from flask import Blueprint, jsonify, request

from services.faculty_data import load_faculty
from services.openalex import SOURCE, fetch_author, load_verified_profiles

citations_bp = Blueprint("citations", __name__, url_prefix="/api/citations")


@citations_bp.get("/faculty")
def faculty_citations():
    metadata, faculty = load_faculty()
    profiles = load_verified_profiles()
    search = request.args.get("q", "").strip().casefold()
    campus_filter = request.args.get("campus", "").strip()
    area_filter = request.args.get("area", "").strip()
    degree_filter = request.args.get("degree", "").strip()
    year_raw = request.args.get("year", "").strip()
    try:
        year_filter = int(year_raw) if year_raw else None
    except ValueError:
        return jsonify({"error": "Ano inválido."}), 400

    campuses = sorted({row["campus"] for row in faculty if row.get("campus")})
    areas = sorted({row["area"] for row in faculty if row.get("area")})
    degrees = sorted({row["degree"] for row in faculty if row.get("degree")})
    result = []
    errors = 0
    fetched_count = 0
    for person in faculty:
        if search and search not in person["name"].casefold():
            continue
        if campus_filter == "__unknown__" and person.get("campus"):
            continue
        if campus_filter and campus_filter != "__unknown__" and person.get("campus") != campus_filter:
            continue
        if area_filter and person.get("area") != area_filter:
            continue
        if degree_filter and person.get("degree") != degree_filter:
            continue

        profile = profiles.get(person["id"])
        citation_count = None
        counts_by_year = []
        source_url = None
        updated_at = None
        identity = "unlinked"
        if profile:
            identity = "verified"
            source_url = "https://openalex.org/" + profile["openalex_author_id"]
            if fetched_count >= 25:
                identity = "verified_pending_refresh"
            else:
                fetched_count += 1
                try:
                    metrics = fetch_author(profile["openalex_author_id"])
                    citation_count = metrics["cited_by_count"]
                    counts_by_year = metrics["counts_by_year"]
                    source_url = metrics["source_url"] or source_url
                    updated_at = metrics["retrieved_at"]
                except (requests.RequestException, ValueError, KeyError):
                    errors += 1
                    identity = "source_unavailable"

        shown_count = citation_count
        metric_type = "total"
        if year_filter is not None:
            metric_type = "year"
            by_year = {int(item["year"]): int(item.get("cited_by_count") or 0) for item in counts_by_year if item.get("year") is not None}
            shown_count = by_year.get(year_filter, 0) if citation_count is not None else None
        result.append({
            **person,
            "citation_count": shown_count,
            "total_citations": citation_count,
            "metric_type": metric_type,
            "identity_status": identity,
            "citation_source": SOURCE if profile else None,
            "profile_url": profile.get("lattes_url") if profile else None,
            "openalex_author_id": profile.get("openalex_author_id") if profile else None,
            "identity_verified_at": profile.get("verified_at") if profile else None,
            "source_url": source_url,
            "updated_at": updated_at,
        })

    known_values = [row["citation_count"] for row in result if isinstance(row["citation_count"], int)]
    return jsonify({
        "success": True,
        "total": len(result),
        "faculty_total": len(faculty),
        "linked_total": sum(1 for row in result if row["identity_status"] in ("verified", "verified_pending_refresh", "source_unavailable")),
        "citation_sum": sum(known_values) if known_values else None,
        "citation_mean": round(sum(known_values) / len(known_values), 2) if known_values else None,
        "source_errors": errors,
        "metric_type": "year" if year_filter is not None else "total",
        "year": year_filter,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "snapshot_date": metadata.get("snapshot_date"),
        "filters": {"campuses": campuses, "areas": areas, "degrees": degrees},
        "results": result,
    })
