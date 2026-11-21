"""The Plan Trip form endpoint (/api/generate-trip): realistic costs summed in code,
travel mode, validation. External tools and the AI are faked; the DB is real."""
import json

import pytest

from backend import app as voya
from backend.tools import itinerary

pytestmark = pytest.mark.integration


def _ai_reply(n_days, estimates):
    act = {"time": "10:00", "name": "Baga Beach", "category": "beach", "estimated_cost": 0, "description": "Beach time."}
    return json.dumps({"cities": "North Goa", "days": [{"day": i, "title": f"Day {i}", "activities": [act]} for i in range(1, n_days + 1)],
                       "cost_estimates": estimates, "cost_notes": {"flights": "Bengaluru → Madgaon, 3AC"}})


@pytest.fixture
def fake_engine(monkeypatch):
    prompts = []
    estimates = {"flights": 9850, "accommodation": 21000, "food": 9000, "activities": 5000, "local_transport": 2000, "misc": 1000}
    real_generate = itinerary.generate_itinerary

    def fake_ai(messages, **kw):
        prompts.append(messages[-1]["content"])
        return _ai_reply(3, estimates)

    monkeypatch.setattr(voya.places_tool, "search_places", lambda *a, **k: {"status": "ok", "places": [], "destination": None})
    monkeypatch.setattr(voya.weather_tool, "get_weather", lambda *a, **k: {"status": "unavailable", "days": [], "message": "No forecast yet."})
    monkeypatch.setattr(voya.itinerary_tool, "generate_itinerary",
                        lambda **kw: real_generate(**{**kw, "ai_call": fake_ai, "verify": False}))
    return prompts


BODY = {"destination": "Goa", "budget": "₹50,000", "travel_style": "Relaxation, Food & Dining", "from_city": "Bengaluru",
        "start_date": "2026-12-10", "end_date": "2026-12-12", "travelers": 2, "transport": "train"}


def test_total_is_the_real_sum_not_the_budget(client, make_user, fake_engine):
    u = make_user()
    r = client.post("/api/generate-trip", headers=u["headers"], json=BODY)
    assert r.status_code == 200, r.json
    it = r.json["itinerary"]
    b = it["budget_summary"]
    assert b["total"] == 47850 and b["budget"] == 50000 and b["remaining"] == 2150 and b["over_budget"] is False
    assert it["cost_breakdown"]["total"] == "₹47,850"                       # not "₹50,000"
    assert b["categories"][0]["label"] == "Train tickets"                      # travel mode relabels the cost line
    assert it["transport"] == "train" and it["travel_style"] == "Relaxation, Food & Dining"
    prompt = fake_engine[0]
    assert "by train" in prompt and "Do NOT bend the numbers to match the budget" in prompt
    assert "Departing from: Bengaluru" in prompt


def test_search_is_recorded(client, db, make_user, fake_engine):
    u = make_user()
    client.post("/api/generate-trip", headers=u["headers"], json=BODY)
    assert [s["destination"] for s in client.get("/api/searches", headers=u["headers"]).json["searches"]] == ["Goa"]


@pytest.mark.parametrize("override, msg", [
    ({"transport": "rocket"}, "valid way to travel"),
    ({"end_date": "2026-12-01"}, "on or after"),
    ({"end_date": "2027-01-30"}, "at most 14"),
    ({"budget": ""}, "Budget is required"),
])
def test_invalid_requests_never_reach_the_ai(client, make_user, fake_engine, override, msg):
    u = make_user()
    r = client.post("/api/generate-trip", headers=u["headers"], json={**BODY, **override})
    assert r.status_code == 400 and msg in r.json["error"] and fake_engine == []


def test_autocomplete_endpoint(client, make_user, monkeypatch):
    assert client.get("/api/places/autocomplete?q=goa").status_code == 401
    u = make_user()
    monkeypatch.setattr(voya.geo_tool, "autocomplete", lambda q, kind, **k: [{"name": q.title(), "kind": kind}])
    assert client.get("/api/places/autocomplete?q=g", headers=u["headers"]).json["results"] == []
    r = client.get("/api/places/autocomplete?q=goa&kind=departure", headers=u["headers"]).json
    assert r["results"] == [{"name": "Goa", "kind": "departure"}]


def test_saved_trip_keeps_budget_summary_and_mode(client, make_user):
    u = make_user()
    trip = {"destination": "Goa", "days": 1, "itinerary": [{"day": 1, "activities": [{"name": "Baga Beach"}]}],
            "costBreakdown": {"total": "₹47,850"}, "budgetSummary": {"total": 47850, "remaining": 2150}, "transport": "train"}
    client.post("/api/save-trip", headers=u["headers"], json={"trip": trip})
    t = client.get("/api/get-trips", headers=u["headers"]).json["trips"][0]
    assert t["budgetSummary"]["remaining"] == 2150 and t["transport"] == "train"


def test_photo_endpoint_and_saved_photo(client, make_user, monkeypatch):
    assert client.get("/api/photo?place=Goa").status_code == 401
    u = make_user()
    photo = {"url": "https://commons.wikimedia.org/wiki/Special:FilePath/Goa_banner.png?width=1280", "credit_url": "", "source": "Wikimedia Commons"}
    monkeypatch.setattr(voya.photos_tool, "find_photo", lambda place: photo if place == "Goa" else None)
    assert client.get("/api/photo?place=Goa", headers=u["headers"]).json["photo"] == photo
    trip = {"destination": "Goa", "days": 1, "itinerary": [{"day": 1, "activities": [{"name": "Baga Beach"}]}],
            "photo": {"url": "https://evil.example/x.png"}}                  # rejected → server looks it up instead
    client.post("/api/save-trip", headers=u["headers"], json={"trip": trip})
    assert client.get("/api/get-trips", headers=u["headers"]).json["trips"][0]["photo"] == photo
