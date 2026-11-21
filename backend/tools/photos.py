"""Real destination photos from Wikimedia (free, no key).

Destination → English Wikipedia article → its Wikidata item → the Wikivoyage
banner (P948, a wide travel photo), falling back to the main image (P18). Maps
and flags (.svg) are skipped. The browser loads the picture straight from
Wikimedia Commons via Special:FilePath at a fixed width.

Wikimedia throttles anonymous clients, so lookups are cached for a week and a
trip stores its photo once found. Any failure returns None: callers keep their
gradient instead of breaking.
"""
from urllib.parse import quote

from .common import ToolUnavailable, http_get_json

WIKI_API = "https://en.wikipedia.org/w/api.php"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"
WEEK = 7 * 24 * 3600


def file_url(filename, width=1280):
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(filename.replace(' ', '_'))}?width={width}"


def _qid(title):
    data = http_get_json(WIKI_API, {"action": "query", "format": "json", "titles": title, "redirects": 1,
                                    "prop": "pageprops", "ppprop": "wikibase_item"},
                         timeout=6, cache_ttl=WEEK, service="Photo search")
    page = next(iter((data.get("query") or {}).get("pages", {}).values()), {})
    return (page.get("pageprops") or {}).get("wikibase_item")


def _image_file(qid):
    data = http_get_json(WIKIDATA_API, {"action": "wbgetclaims", "format": "json", "entity": qid},
                         timeout=6, cache_ttl=WEEK, service="Photo search")
    claims = data.get("claims") or {}
    for pid in ("P948", "P18"):          # Wikivoyage banner first, then the main image
        for c in claims.get(pid, []):
            name = ((c.get("mainsnak") or {}).get("datavalue") or {}).get("value")
            if isinstance(name, str) and name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                return name
    return None


def find_photo(place):
    """'Santorini, Greece' → {"url", "credit_url", "source"} or None (never raises)."""
    place = " ".join((place or "").split())[:120]
    if not place:
        return None
    candidates = [place] + ([place.split(",")[0].strip()] if "," in place else [])
    for title in candidates:
        try:
            qid = _qid(title)
            name = _image_file(qid) if qid else None
        except ToolUnavailable:
            return None
        if name:
            return {"url": file_url(name), "credit_url": f"https://commons.wikimedia.org/wiki/File:{quote(name.replace(' ', '_'))}",
                    "source": "Wikimedia Commons"}
    return None
