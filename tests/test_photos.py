"""Destination photos: Wikidata banner → image fallback, svg skipped, failures → None.
Wikimedia is faked; `real_find_photo` is imported before conftest switches lookups off."""
import pytest

from backend import app as voya
from backend.tools import common, photos
from backend.tools.photos import find_photo as real_find_photo


def fake_wiki(qids, claims, fail=False):
    def get(url, params, **kw):
        if fail:
            raise common.ToolUnavailable("Photo search returned an error (HTTP 429)")
        if "wikipedia" in url:
            q = qids.get(params["titles"])
            return {"query": {"pages": {"1": {"pageprops": {"wikibase_item": q}} if q else {"1": {}}}}}
        snak = lambda v: {"mainsnak": {"datavalue": {"value": v}}}
        return {"claims": {pid: [snak(v) for v in vals] for pid, vals in claims.get(params["entity"], {}).items()}}
    return get


def test_prefers_the_wikivoyage_banner(monkeypatch):
    monkeypatch.setattr(photos, "http_get_json", fake_wiki({"Bali": "Q1"}, {"Q1": {"P948": ["Bali banner Rice terraces.jpg"], "P18": ["Bali panorama.jpg"]}}))
    p = real_find_photo("Bali")
    assert p["url"] == "https://commons.wikimedia.org/wiki/Special:FilePath/Bali_banner_Rice_terraces.jpg?width=1280"
    assert p["credit_url"].endswith("File:Bali_banner_Rice_terraces.jpg") and p["source"] == "Wikimedia Commons"


def test_skips_maps_and_tries_the_place_without_country(monkeypatch):
    monkeypatch.setattr(photos, "http_get_json", fake_wiki({"Kenya": "Q2"}, {"Q2": {"P948": [], "P18": ["Kenya - Location Map.svg", "Lion.jpg"]}}))
    assert real_find_photo("Kenya, Africa")["url"].endswith("/Lion.jpg?width=1280")


@pytest.mark.parametrize("place, qids, fail", [("Nowhere", {}, False), ("Bali", {"Bali": "Q1"}, True), ("", {}, False)])
def test_failures_return_none(monkeypatch, place, qids, fail):
    monkeypatch.setattr(photos, "http_get_json", fake_wiki(qids, {"Q1": {}}, fail=fail))
    assert real_find_photo(place) is None


def test_only_wikimedia_urls_are_accepted_from_clients():
    ok = {"url": "https://commons.wikimedia.org/wiki/Special:FilePath/X.jpg?width=1280", "credit_url": "https://evil.example/x"}
    assert voya.safe_photo(ok) == {"url": ok["url"], "credit_url": "", "source": "Wikimedia Commons"}
    assert voya.safe_photo({"url": "https://evil.example/tracker.png"}) is None
    assert voya.safe_photo("https://commons.wikimedia.org/x.jpg") is None
