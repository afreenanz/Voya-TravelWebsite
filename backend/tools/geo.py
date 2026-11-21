"""Destination resolution + place verification (Geoapify geocoding, OpenStreetMap data)."""
from . import common
from .common import ToolUnavailable, http_get_json

GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search"
SOURCE = "Geoapify (OpenStreetMap data)"
# Prefer real areas over same-named amenities ("Bali" → the province, not a café).
AREA_TYPES = ("country", "state", "county", "city", "district", "suburb", "postcode")
# A place counts as verified only if Geoapify matched the full name to a specific
# place — not just the town/city it fell back to.
VERIFIED_TYPES = ("amenity", "building", "street")


def _geocode(text, **extra):
    if not common.GEOAPIFY_KEY:
        raise ToolUnavailable("Place search is not configured")
    data = http_get_json(GEOCODE_URL, {"text": text, "format": "json", "lang": "en", "apiKey": common.GEOAPIFY_KEY, **extra},
                         cache_ttl=24 * 3600, service="Place search")
    return data.get("results") or []


def resolve_destination(name):
    """Destination text → {name, formatted, country, country_code, lat, lon, place_id, result_type}.
    Raises ToolUnavailable if the API fails or nothing matches."""
    name = " ".join((name or "").split())[:120]
    if not name:
        raise ToolUnavailable("No destination given")
    results = _geocode(name, limit=5)
    if not results:
        raise ToolUnavailable(f"Couldn't find a place called “{name}”")
    best = next((r for r in results if r.get("result_type") in AREA_TYPES), results[0])
    return {
        "name": best.get("city") or best.get("state") or best.get("country") or best.get("name") or name,
        "formatted": best.get("formatted") or name,
        "country": best.get("country") or "",
        "country_code": (best.get("country_code") or "").lower(),
        "lat": best.get("lat"),
        "lon": best.get("lon"),
        "place_id": best.get("place_id"),
        "result_type": best.get("result_type") or "",
        "timezone": (best.get("timezone") or {}).get("name") or "",
    }


def verify_place(place_name, dest):
    """Look up one named place inside the destination's country, biased to its centre.
    Returns {"verified": bool, ...}. Never raises: failures count as unverified."""
    place_name = " ".join((place_name or "").split())[:120]
    out = {"verified": False}
    if not place_name or not dest:
        return out
    extra = {"limit": 1}
    if dest.get("country_code"):
        extra["filter"] = f"countrycode:{dest['country_code']}"
    if dest.get("lat") is not None and dest.get("lon") is not None:
        extra["bias"] = f"proximity:{dest['lon']},{dest['lat']}"
    try:
        results = _geocode(f"{place_name}, {dest.get('name') or ''}".strip(", "), **extra)
    except ToolUnavailable:
        return out
    if not results:
        return out
    r = results[0]
    rank = r.get("rank") or {}
    if (r.get("result_type") in VERIFIED_TYPES and rank.get("match_type") == "full_match"
            and (rank.get("confidence") or 0) >= 0.5):
        out.update({
            "verified": True,
            "address": r.get("formatted") or "",
            "lat": r.get("lat"),
            "lon": r.get("lon"),
            "source": SOURCE,
        })
    return out
