"""Tool A — Destination search: real attractions for a destination + interests.

Data: Geoapify Places API (OpenStreetMap). Results are ranked by notability
(has a Wikidata entry → has a website → has opening hours) because the API
itself returns places by proximity, not popularity.
"""
from . import common
from .common import ToolUnavailable, http_get_json
from .geo import SOURCE, resolve_destination

PLACES_URL = "https://api.geoapify.com/v2/places"

# Interest keyword → Geoapify categories. Unknown interests fall back to sights.
INTEREST_CATEGORIES = {
    "beach":     "beach",
    "cafe":      "catering.cafe",
    "coffee":    "catering.cafe",
    "food":      "catering.restaurant",
    "restaurant": "catering.restaurant",
    "dining":    "catering.restaurant",
    "nightlife": "catering.bar,adult.nightclub",
    "bar":       "catering.bar",
    "museum":    "entertainment.museum",
    "art":       "entertainment.museum,entertainment.culture",
    "culture":   "tourism.sights,entertainment.culture",
    "history":   "tourism.sights,heritage",
    "heritage":  "heritage,tourism.sights",
    "temple":    "religion.place_of_worship,tourism.sights",
    "religio":   "religion.place_of_worship",
    "nature":    "natural,national_park,leisure.park",
    "hiking":    "natural,national_park",
    "adventure": "sport,natural,national_park",
    "park":      "leisure.park,national_park",
    "shopping":  "commercial.shopping_mall,commercial.marketplace",
    "market":    "commercial.marketplace",
    "family":    "entertainment.theme_park,entertainment.zoo,entertainment.aquarium",
    "relax":     "beach,leisure.park,leisure.spa",
    "spa":       "leisure.spa",
}
DEFAULT_CATEGORIES = "tourism.sights,tourism.attraction"

CATEGORY_LABELS = [  # most specific first
    ("beach", "Beach"), ("catering.cafe", "Café"), ("catering.restaurant", "Restaurant"),
    ("catering.bar", "Bar"), ("adult.nightclub", "Nightlife"), ("entertainment.museum", "Museum"),
    ("religion", "Place of worship"), ("national_park", "National park"), ("natural", "Nature"),
    ("leisure.park", "Park"), ("leisure.spa", "Spa"), ("commercial", "Shopping"), ("heritage", "Heritage"),
    ("entertainment", "Entertainment"), ("sport", "Sport & adventure"), ("tourism", "Sight"),
]


def categories_for(interests):
    cats = []
    for interest in interests or []:
        low = str(interest).lower()
        for key, value in INTEREST_CATEGORIES.items():
            if key in low:
                cats.extend(value.split(","))
    cats.extend(DEFAULT_CATEGORIES.split(","))  # always include the main sights
    return ",".join(dict.fromkeys(cats))


def _label(categories):
    for prefix, label in CATEGORY_LABELS:
        if any(c == prefix or c.startswith(prefix + ".") for c in categories or []):
            return label
    return "Place"


def _english_name(p):
    """Prefer the OpenStreetMap English name when the local one isn't in Latin script."""
    raw = (p.get("datasource") or {}).get("raw") or {}
    name = str(p.get("name") or "").strip()
    return str(raw.get("name:en") or "").strip() if raw.get("name:en") and not _latin(name) else name


def _latin(text):
    letters = [c for c in text if c.isalpha()]
    return bool(letters) and sum(c.isascii() for c in letters) / len(letters) > 0.6


def _score(p, name):
    raw = (p.get("datasource") or {}).get("raw") or {}
    wiki = (p.get("wiki_and_media") or {}).get("wikidata") or raw.get("wikidata")
    return ((3 if wiki else 0) + (1 if p.get("website") or raw.get("website") else 0)
            + (1 if p.get("opening_hours") else 0) - (3 if not _latin(name) else 0))


# Cities: search a radius around the centre. Administrative "cities" can be huge
# (Tokyo Metropolis includes islands 100+ km away). Larger areas: whole boundary.
CITY_RADIUS_M = 15000


def _area_filter(dest):
    if dest.get("result_type") in ("city", "district", "suburb", "postcode") and dest.get("lat") is not None:
        return f"circle:{dest['lon']},{dest['lat']},{CITY_RADIUS_M}"
    return f"place:{dest['place_id']}"


def search_places(destination, interests=None, limit=15):
    """→ {"status": "ok"|"unavailable", "destination": {...}, "places": [...], "source": …}"""
    try:
        dest = resolve_destination(destination)
    except ToolUnavailable as e:
        return {"status": "unavailable", "message": str(e), "places": [], "source": SOURCE}
    params = {
        "categories": categories_for(interests),
        "filter": _area_filter(dest),
        "bias": f"proximity:{dest['lon']},{dest['lat']}",
        "conditions": "named",
        "lang": "en",
        "limit": 100,
        "apiKey": common.GEOAPIFY_KEY,
    }
    try:
        data = http_get_json(PLACES_URL, params, timeout=15, cache_ttl=6 * 3600, service="Place search")
    except ToolUnavailable as e:
        return {"status": "unavailable", "message": str(e), "destination": dest, "places": [], "source": SOURCE}

    seen, ranked = set(), []
    for f in data.get("features") or []:
        p = f.get("properties") or {}
        name = _english_name(p)
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        p = {**p, "name": name}
        ranked.append((_score(p, name), len(ranked), p))
    ranked.sort(key=lambda t: (-t[0], t[1]))  # stable: notable first, then API order

    places = [{
        "name": p["name"].strip(),
        "category": _label(p.get("categories")),
        "address": p.get("formatted") or "",
        "lat": p.get("lat"),
        "lon": p.get("lon"),
        "opening_hours": p.get("opening_hours") or None,  # only when OpenStreetMap has it
        "website": p.get("website") or None,
    } for _, _, p in ranked[:max(1, min(limit, 30))]]
    result = {"status": "ok" if places else "partial", "destination": dest, "places": places, "source": SOURCE}
    if not places:
        result["message"] = "No matching places were found in map data for these interests."
    if dest.get("result_type") == "country":
        result["hint"] = "This is a whole country; searching specific cities gives much better results."
    return result
