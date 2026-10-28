"""Serve only sanitized group JSON records used by the public dashboard."""
import json
from pathlib import Path

from flask import Blueprint, abort, jsonify

public_data_bp = Blueprint("public_data", __name__, url_prefix="/api/public-data")
PUBLIC_DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "public"
ALLOWED_FILES = {
    "grupos_ang_final.json", "grupos_campo_maior_final.json", "grupos_central_final.json",
    "grupos_cocal_final.json", "grupos_corrente_maior_final.json", "grupos_dirceu_final.json",
    "grupos_floriano_final.json", "grupos_freitas_final.json", "grupos_oeiras_final.json",
    "grupos_parnaiba_final.json", "grupos_paulistana_final.json", "grupos_pedroII_final.json",
    "grupos_lideres.json",
}


@public_data_bp.get("/<path:filename>")
def public_json(filename):
    if filename not in ALLOWED_FILES:
        abort(404)
    file_path = PUBLIC_DATA_DIR / filename
    if not file_path.is_file():
        abort(404)
    try:
        return jsonify(json.loads(file_path.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError):
        abort(503)
