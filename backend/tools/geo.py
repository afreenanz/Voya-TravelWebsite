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


# ── Autocomplete for the planner's destination / departure fields ───────────
# Photon (komoot, OpenStreetMap) ranks by importance, so "Bali" gives the
# Indonesian province and "Santorini" the Greek island. Free, no key, fair use →
# results are cached for a day and the browser debounces typing. Geoapify is the
# backup. Departure *airports* come from the curated list in the form (with IATA
# codes); airport autocomplete was too noisy (hotels, bus depots, car parks).
PHOTON_URL = "https://photon.komoot.io/api/"
AUTOCOMPLETE_URL = "https://api.geoapify.com/v1/geocode/autocomplete"
PHOTON_TYPES = ("country", "state", "county", "city", "district", "locality", "other")


def flag_emoji(country_code):
    cc = (country_code or "").lower()
    return "".join(chr(0x1F1E6 + ord(c) - 97) for c in cc) if len(cc) == 2 and cc.isalpha() else "📍"


def _item(name, state, country, cc, kind):
    detail = ", ".join(p for p in (state, country) if p and p != name)
    return {"name": name, "detail": detail, "country_code": (cc or "").lower(), "flag": flag_emoji(cc), "type": kind}


def _bias(near):
    """(lat, lon) rounded to ~10 km so cached results are shared by nearby users."""
    return (round(near[0], 1), round(near[1], 1)) if near else None


def _photon(text, near=None):
    params = {"q": text, "limit": 10, "lang": "en"}
    if near:
        params.update({"lat": near[0], "lon": near[1]})
    data = http_get_json(PHOTON_URL, params, timeout=6, cache_ttl=24 * 3600, service="Place search")
    out = []
    for f in data.get("features") or []:
        p = f.get("properties") or {}
        if p.get("type") not in PHOTON_TYPES or not p.get("name"):
            continue
        out.append(_item(p["name"], p.get("state") if p.get("type") != "state" else "", p.get("country") if p.get("type") != "country" else "",
                         p.get("countrycode"), "region" if p.get("type") in ("state", "county") else p.get("type")))
    return out


def _geoapify(text, near=None):
    if not common.GEOAPIFY_KEY:
        return []
    params = {"text": text, "format": "json", "limit": 10, "lang": "en", "apiKey": common.GEOAPIFY_KEY}
    if near:  # without a bias Geoapify ranks by the *server's* location (a US data centre)
        params["bias"] = f"proximity:{near[1]},{near[0]}"
    data = http_get_json(AUTOCOMPLETE_URL, params, cache_ttl=24 * 3600, service="Place search")
    out = []
    for r in data.get("results") or []:
        rtype = r.get("result_type") or ""
        if rtype in ("street", "postcode", "building", "amenity"):
            continue
        name = r.get(rtype) if rtype in ("country", "state") else (r.get("city") or r.get("name"))
        if name:
            out.append(_item(name, r.get("state") if rtype != "state" else "", r.get("country") if rtype != "country" else "",
                             r.get("country_code"), rtype))
    return out


def autocomplete(text, kind="destination", limit=6, near=None):
    """Any city, region or country worldwide.
    near: the visitor's approximate (lat, lon). Departures are ranked near the
    visitor ("Kochi" → Kerala for someone in India); destinations stay unbiased.
    → [{"name", "detail", "country_code", "flag", "type"}]. Raises ToolUnavailable if every source fails."""
    text = " ".join((text or "").split())[:80]
    if len(text) < 2:
        return []
    near = _bias(near) if kind == "departure" else None
    results, errors = [], []
    for source in (lambda: _photon(text, near), lambda: _geoapify(text, near)):
        try:
            results += source()
        except ToolUnavailable as e:
            errors.append(e)
        if len(results) >= limit + 2:
            break
    if not results and errors:
        raise ToolUnavailable(str(errors[0]))
    out, seen = [], set()
    for r in results:
        key = (r["name"].lower(), r["country_code"])
        if key not in seen:
            seen.add(key)
            out.append(r)
    return out[:limit]
