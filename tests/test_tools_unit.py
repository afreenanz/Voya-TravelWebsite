"""Unit tests for the agent tools. No network: HTTP and the AI are faked."""
import copy
import json
from datetime import date

import pytest

from backend.services.ai import AIError
from backend.tools import budget, common, geo, itinerary, places, weather


# ── Budget calculator ───────────────────────────────────────────────────────
@pytest.mark.parametrize("text, amount, currency", [
    ("₹1,00,000", 100000, "INR"), ("$2,500", 2500, "USD"), ("60k", 60000, "INR"), ("1.5 lakh", 150000, "INR"),
    ("Rs 45000", 45000, "INR"), ("€1.200", 1200, "EUR"), ("2500 USD", 2500, "USD"), ("under ₹60,000", 60000, "INR"),
    ("A$3,000", 3000, "AUD"), (2500, 2500, "INR"),
])
def test_parse_amount(text, amount, currency):
    value, cur = budget.parse_amount(text)
    assert value == amount and cur == currency


@pytest.mark.parametrize("bad", ["-500", "abc", ""])
def test_parse_amount_rejects(bad):
    with pytest.raises(budget.BudgetError):
        budget.parse_amount(bad)


def test_format_amount():
    assert budget.format_amount(100000, "INR") == "₹1,00,000"
    assert budget.format_amount(12345678, "INR") == "₹1,23,45,678"
    assert budget.format_amount(2500, "USD") == "$2,500"
    assert budget.format_amount(-4200, "INR") == "-₹4,200"


def test_calculate_budget_is_exact_and_done_in_code():
    r = budget.calculate_budget({"flights": 18000, "accommodation": "₹20,000", "food": 9000, "activities": 8000.4,
                                 "local_transport": 3000, "misc": 2500}, total_budget="₹60,000", days=5, travelers=2)
    assert r["status"] == "ok"
    assert r["total"] == 60500 and r["budget"] == 60000
    assert r["remaining"] == -500 and r["over_budget"] is True and r["remaining_formatted"] == "-₹500"
    assert r["per_day"] == 12100 and r["per_person"] == 30250 and r["per_person_per_day"] == 6050
    assert sum(c["amount"] for c in r["categories"]) == r["total"]
    assert round(sum(c["share_pct"] for c in r["categories"])) == 100


def test_calculate_budget_without_user_budget():
    r = budget.calculate_budget({"food": 1000, "misc": 500}, days=3, travelers=1, currency="USD")
    assert r["total_formatted"] == "$1,500" and "remaining" not in r


@pytest.mark.parametrize("estimates, kwargs, msg", [
    ({}, {}, "No cost estimates"),
    ({"spaceship": 5}, {}, "Unknown cost category"),
    ({"food": "-100"}, {}, "negative"),
    ({"food": 100}, {"days": 0}, "at least 1"),
])
def test_calculate_budget_errors(estimates, kwargs, msg):
    r = budget.calculate_budget(estimates, **kwargs)
    assert r["status"] == "error" and msg in r["message"]


def test_cost_breakdown_matches_existing_ui_shape():
    r = budget.calculate_budget({"flights": 1000, "food": 500}, total_budget=2000)
    cb = budget.to_cost_breakdown(r, {"flights": "BLR → GOI"})
    assert cb == {"total": "₹1,500", "flights": {"amount": "₹1,000", "note": "BLR → GOI"}, "food": {"amount": "₹500", "note": ""}}


# ── Weather ─────────────────────────────────────────────────────────────────
TODAY = date(2026, 11, 21)
GOA = {"lat": 15.4, "lon": 74.0, "formatted": "Goa, India"}


def _forecast(dates):
    return {"daily": {"time": dates, "weather_code": [0, 61, 95][:len(dates)], "temperature_2m_max": [33.1, 31.0, 30.2][:len(dates)],
                      "temperature_2m_min": [22.0, 23.5, 24.1][:len(dates)], "precipitation_probability_max": [0, 70, 90][:len(dates)]}}


def test_weather_beyond_forecast_window_is_unavailable_without_calling_api(monkeypatch):
    monkeypatch.setattr(weather, "http_get_json", lambda *a, **k: pytest.fail("must not call the API"))
    r = weather.get_weather("Goa", "2027-01-10", "2027-01-12", dest=GOA, today=TODAY)
    assert r["status"] == "unavailable" and r["days"] == []
    assert "won't guess" in r["message"] and r["forecast_available_until"] == "2026-12-06"


def test_weather_in_window_returns_real_values_with_source(monkeypatch):
    monkeypatch.setattr(weather, "http_get_json", lambda *a, **k: _forecast(["2026-11-23", "2026-11-24", "2026-11-25"]))
    r = weather.get_weather("Goa", "2026-11-23", "2026-11-25", dest=GOA, today=TODAY)
    assert r["status"] == "ok" and r["source"] == "Open-Meteo forecast" and r["fetched_at"]
    assert [d["summary"] for d in r["days"]] == ["Clear sky", "Light rain", "Thunderstorm"]
    assert r["days"][1]["rain_chance_pct"] == 70
    assert "Light rain, 23.5–31.0°C" in weather.summarise(r)


def test_weather_partially_outside_window_is_partial(monkeypatch):
    calls = []
    monkeypatch.setattr(weather, "http_get_json", lambda url, params, **k: calls.append(params) or _forecast(["2026-12-05", "2026-12-06"]))
    r = weather.get_weather("Goa", "2026-12-05", "2026-12-09", dest=GOA, today=TODAY)
    assert r["status"] == "partial" and len(r["days"]) == 2 and "only" in r["message"]
    assert calls[0]["start_date"] == "2026-12-05" and calls[0]["end_date"] == "2026-12-06"


def test_weather_api_failure_is_reported_not_invented(monkeypatch):
    def boom(*a, **k):
        raise common.ToolUnavailable("Weather service did not respond in time")
    monkeypatch.setattr(weather, "http_get_json", boom)
    r = weather.get_weather("Goa", "2026-11-23", "2026-11-24", dest=GOA, today=TODAY)
    assert r["status"] == "unavailable" and r["days"] == [] and "did not respond" in r["message"]


@pytest.mark.parametrize("start, end", [("23-11-2026", "2026-11-24"), ("2026-11-25", "2026-11-24")])
def test_weather_bad_dates(start, end):
    assert weather.get_weather("Goa", start, end, dest=GOA, today=TODAY)["status"] == "error"


def test_weather_past_dates(monkeypatch):
    monkeypatch.setattr(weather, "http_get_json", lambda *a, **k: pytest.fail("must not call the API"))
    r = weather.get_weather("Goa", "2026-01-01", "2026-01-03", dest=GOA, today=TODAY)
    assert r["status"] == "unavailable" and "already over" in r["message"]


# ── Geo: destination + verification ─────────────────────────────────────────
@pytest.fixture
def geokey(monkeypatch):
    monkeypatch.setattr(common, "GEOAPIFY_KEY", "test-key")


def test_resolve_destination_prefers_areas_over_amenities(monkeypatch, geokey):
    monkeypatch.setattr(geo, "http_get_json", lambda *a, **k: {"results": [
        {"result_type": "amenity", "name": "Bali Island", "formatted": "Bali Island cafe"},
        {"result_type": "state", "state": "Bali", "country": "Indonesia", "country_code": "id", "lat": -8.4, "lon": 115.2,
         "place_id": "abc", "formatted": "Bali, Indonesia"}]})
    d = geo.resolve_destination("Bali")
    assert d["formatted"] == "Bali, Indonesia" and d["country_code"] == "id" and d["result_type"] == "state"


@pytest.mark.parametrize("result, verified", [
    ({"result_type": "amenity", "rank": {"match_type": "full_match", "confidence": 1}, "formatted": "Tanah Lot Temple, Bali",
      "lat": -8.6, "lon": 115.1}, True),
    ({"result_type": "city", "rank": {"match_type": "match_by_city_or_disrict", "confidence": 0.05}}, False),  # fell back to the town
    ({"result_type": "amenity", "rank": {"match_type": "full_match", "confidence": 0.3}}, False),             # low confidence
])
def test_verify_place(monkeypatch, geokey, result, verified):
    seen = {}
    monkeypatch.setattr(geo, "http_get_json", lambda url, params, **k: seen.update(params) or {"results": [result]})
    r = geo.verify_place("Tanah Lot Temple", {"name": "Bali", "country_code": "id", "lat": -8.4, "lon": 115.2})
    assert r["verified"] is verified
    assert seen["filter"] == "countrycode:id" and seen["bias"] == "proximity:115.2,-8.4"
    if verified:
        assert r["address"] and r["source"].startswith("Geoapify")


def test_verify_place_never_raises(monkeypatch, geokey):
    def boom(*a, **k):
        raise common.ToolUnavailable("down")
    monkeypatch.setattr(geo, "http_get_json", boom)
    assert geo.verify_place("Anything", {"name": "Goa"}) == {"verified": False}


def test_geo_without_key_is_unavailable(monkeypatch):
    monkeypatch.setattr(common, "GEOAPIFY_KEY", "")
    with pytest.raises(common.ToolUnavailable, match="not configured"):
        geo.resolve_destination("Goa")


# ── Places ──────────────────────────────────────────────────────────────────
def _feature(name, wiki=False, website=None, hours=None, cats=("tourism.sights",), name_en=None):
    raw = {"name:en": name_en} if name_en else {}
    if wiki:
        raw["wikidata"] = "Q1"
    return {"properties": {"name": name, "categories": list(cats), "formatted": f"{name}, Goa", "lat": 15.5, "lon": 73.8,
                           "website": website, "opening_hours": hours, "datasource": {"raw": raw}}}


def test_places_ranks_notable_first_dedupes_and_translates(monkeypatch, geokey):
    monkeypatch.setattr(places, "resolve_destination", lambda name: {"place_id": "p1", "result_type": "state", "lat": 15.4,
                                                                      "lon": 74.0, "formatted": "Goa, India"})
    captured = {}
    monkeypatch.setattr(places, "http_get_json", lambda url, params, **k: captured.update(params) or {"features": [
        _feature("Random Shop"), _feature("Chapora Fort", wiki=True, hours="Mo-Su 09:00-17:00"),
        _feature("chapora fort"), _feature("Baga Beach", cats=("beach",), website="https://x"),
        _feature("赤城神社", name_en="Akagi Shrine"), _feature(12345), {"properties": {"name": None}}]})
    r = places.search_places("Goa", ["beaches", "cafes"])
    names = [p["name"] for p in r["places"]]
    assert r["status"] == "ok" and names[0] == "Chapora Fort"
    assert names.count("Chapora Fort") == 1 and "chapora fort" not in names
    assert "Akagi Shrine" in names and "12345" in names
    assert r["places"][0]["opening_hours"] == "Mo-Su 09:00-17:00"
    assert "beach" in captured["categories"] and "catering.cafe" in captured["categories"]
    assert captured["filter"] == "place:p1"


def test_places_uses_radius_for_cities_and_hints_for_countries(monkeypatch, geokey):
    seen = []
    monkeypatch.setattr(places, "http_get_json", lambda url, params, **k: seen.append(params) or {"features": [_feature("X")]})
    monkeypatch.setattr(places, "resolve_destination", lambda n: {"place_id": "c", "result_type": "city", "lat": 35.6, "lon": 139.7})
    places.search_places("Tokyo")
    assert seen[-1]["filter"] == "circle:139.7,35.6,15000"
    monkeypatch.setattr(places, "resolve_destination", lambda n: {"place_id": "j", "result_type": "country", "lat": 36, "lon": 138})
    assert "specific cities" in places.search_places("Japan")["hint"]


def test_places_api_failure_is_unavailable(monkeypatch, geokey):
    monkeypatch.setattr(places, "resolve_destination", lambda n: {"place_id": "p", "result_type": "state", "lat": 1, "lon": 2})

    def boom(*a, **k):
        raise common.ToolUnavailable("Place search returned an error (HTTP 500)")
    monkeypatch.setattr(places, "http_get_json", boom)
    r = places.search_places("Goa")
    assert r["status"] == "unavailable" and r["places"] == [] and "HTTP 500" in r["message"]


# ── Itinerary generation ────────────────────────────────────────────────────
def _activity(name, cat="sightseeing", cost=500, t="10:00"):
    return {"time": t, "name": name, "location": "North Goa", "category": cat, "icon": "camera",
            "description": f"Visit {name}.", "duration_minutes": 90, "estimated_cost": cost, "tip": "Go early."}


def _plan(n_days, total="₹999,999"):
    return {
        "cities": "Panaji · Anjuna",
        "days": [{"day": i, "title": f"Day {i}", "theme": "Beaches",
                  "activities": [_activity("Check-in at Hotel", "accommodation", 0, "09:00"),
                                 _activity(f"Chapora Fort {i}", "culture", 0), _activity(f"Cafe {i}", "food", 800, "13:00")]}
                 for i in range(1, n_days + 1)],
        "cost_estimates": {"flights": 12000, "accommodation": 15000, "food": 8000, "activities": 3000,
                           "local_transport": 2000, "misc": 1000, "total": total},  # LLM "total" must be ignored
        "cost_notes": {"flights": "BLR → GOI economy"},
        "travel_considerations": ["Carry sunscreen."],
    }


def fake_ai(*replies):
    queue = list(replies)
    calls = []

    def call(messages, **kwargs):
        calls.append(messages[-1]["content"])
        r = queue.pop(0)
        if isinstance(r, Exception):
            raise r
        return r if isinstance(r, str) else json.dumps(r)
    call.calls = calls
    return call


GEN = dict(destination="Goa", start_date="2026-12-10", end_date="2026-12-12", travelers=2, budget="₹40,000",
           interests=["beaches"], pace="balanced", verify=False)


def test_generate_builds_validated_itinerary_with_code_computed_budget():
    ai = fake_ai(_plan(3))
    r = itinerary.generate_itinerary(**GEN, ai_call=ai, user_context="Travel interests: beaches, cafes",
                                     places=[{"name": "Chapora Fort", "category": "Sight", "opening_hours": "Mo-Su 09:00-17:00"}],
                                     weather={"status": "unavailable", "message": "No forecast yet", "days": [], "source": "Open-Meteo forecast"})
    assert r["status"] == "ok"
    it = r["itinerary"]
    assert len(it["days"]) == 3 and it["currency"] == "INR"
    assert it["budget_summary"]["total"] == 41000                      # 12k+15k+8k+3k+2k+1k, not the LLM's "total"
    assert it["budget_summary"]["remaining"] == -1000 and it["budget_summary"]["over_budget"] is True
    assert it["cost_breakdown"]["total"] == "₹41,000" and it["cost_breakdown"]["flights"]["note"] == "BLR → GOI economy"
    act = it["days"][0]["activities"][2]
    assert act["estimated_cost"] == 800 and act["note"] == "Visit Cafe 1. · ~₹800 (estimate) · Go early."
    assert it["weather"]["status"] == "unavailable"
    prompt = ai.calls[0]
    assert "Travel interests: beaches, cafes" in prompt and "Chapora Fort (Sight; hours Mo-Su 09:00-17:00)" in prompt
    assert "No forecast yet" in prompt and "Exactly 3 day objects" in prompt


def test_generate_trims_extra_days_and_retries_missing_days():
    assert len(itinerary.generate_itinerary(**GEN, ai_call=fake_ai(_plan(5)))["itinerary"]["days"]) == 3
    ai = fake_ai(_plan(2), _plan(3))
    assert itinerary.generate_itinerary(**GEN, ai_call=ai)["status"] == "ok" and len(ai.calls) == 2


def test_generate_retries_empty_answer_then_gives_up_honestly():
    ai = fake_ai(AIError("empty response"), "not json at all")
    r = itinerary.generate_itinerary(**GEN, ai_call=ai)
    assert r["status"] == "unavailable" and "unusable plan" in r["message"] and len(ai.calls) == 2


def test_generate_reports_daily_limit():
    r = itinerary.generate_itinerary(**GEN, ai_call=fake_ai(AIError("daily limit")))
    assert r["status"] == "unavailable" and "today's free usage limit" in r["message"]


@pytest.mark.parametrize("override, msg", [
    ({"end_date": "2026-12-01"}, "on or after"), ({"end_date": "2027-01-30"}, "at most 14"),
    ({"pace": "sprint"}, "Pace"), ({"travelers": 0}, "Travellers"), ({"destination": " "}, "Destination"),
    ({"start_date": "10/12/2026"}, "YYYY-MM-DD"),
])
def test_generate_validates_inputs_without_calling_ai(override, msg):
    r = itinerary.generate_itinerary(**{**GEN, **override}, ai_call=fake_ai())
    assert r["status"] == "error" and msg in r["message"]


def test_enrich_marks_verified_places_and_distances(monkeypatch):
    lookups = []

    def fake_verify(name, dest):
        lookups.append(name)
        if name.startswith("Cafe"):
            return {"verified": True, "address": f"{name}, Goa", "lat": 15.60, "lon": 73.74, "source": "Geoapify (OpenStreetMap data)"}
        return {"verified": False}
    monkeypatch.setattr(itinerary, "verify_place", fake_verify)
    days = itinerary.generate_itinerary(**GEN, ai_call=fake_ai(_plan(3)))["itinerary"]["days"]
    itinerary.enrich_days(days, {"name": "Goa"}, known_places=[{"name": "Chapora Fort 1", "lat": 15.61, "lon": 73.74,
                                                                  "address": "Chapora", "opening_hours": "Mo-Su 09:00-17:00"}])
    d1 = days[0]["activities"]
    assert d1[0]["verified"] is False                                  # "Check-in at Hotel" is never looked up
    assert d1[1]["verified"] is True and d1[1]["opening_hours"] == "Mo-Su 09:00-17:00"   # matched search result, no lookup
    assert d1[2]["verified"] is True and d1[2]["distance_from_previous_km"] == 1.1      # straight-line km from the fort
    assert "Check-in at Hotel" not in lookups and "Chapora Fort 1" not in lookups


# ── Itinerary modification ──────────────────────────────────────────────────
@pytest.fixture
def base_itin():
    return itinerary.generate_itinerary(**GEN, ai_call=fake_ai(_plan(3)))["itinerary"]


def test_modify_changes_only_requested_day(base_itin):
    original = copy.deepcopy(base_itin)
    new_day2 = {"day": 2, "title": "Slow beach day", "theme": "Relax",
                "activities": [_activity("Ashwem Beach", "beach", 0, "10:00"), _activity("Artjuna Cafe", "food", 900, "13:00")]}
    est = {**_plan(3)["cost_estimates"], "activities": 1000}
    est.pop("total")
    ai = fake_ai({"changed_days": [new_day2], "cost_estimates": est, "summary": "Made day 2 relaxed."})
    r = itinerary.modify_itinerary(base_itin, "Make day two less hectic", ai_call=ai, verify=False)
    assert r["status"] == "ok" and r["changed_days"] == [2] and r["summary"] == "Made day 2 relaxed."
    it = r["itinerary"]
    assert it["days"][0] == original["days"][0] and it["days"][2] == original["days"][2]   # untouched days identical
    assert [a["name"] for a in it["days"][1]["activities"]] == ["Ashwem Beach", "Artjuna Cafe"]
    assert it["budget_summary"]["total"] == 39000                                           # recomputed in code
    assert base_itin == original                                                            # caller's copy not mutated
    assert "Make day two less hectic" in ai.calls[0] and "Day 2 — Day 2" in ai.calls[0]


def test_modify_rejects_out_of_range_days_after_one_retry(base_itin):
    bad = {"changed_days": [{"day": 9, "title": "x", "activities": [_activity("X")]}], "summary": "?"}
    ai = fake_ai(bad, bad)
    r = itinerary.modify_itinerary(base_itin, "add a day", ai_call=ai, verify=False)
    assert r["status"] == "unavailable" and "invalid day number 9" in r["message"] and len(ai.calls) == 2
    good = {"changed_days": [{"day": 3, "title": "Fixed", "activities": [_activity("Fort Aguada")]}], "summary": "ok"}
    r = itinerary.modify_itinerary(base_itin, "change day 3", ai_call=fake_ai(bad, good), verify=False)
    assert r["status"] == "ok" and r["changed_days"] == [3]


def test_modify_budget_only_needs_no_ai(base_itin):
    r = itinerary.modify_itinerary(base_itin, "", new_budget="₹50,000", ai_call=fake_ai(), verify=False)
    assert r["status"] == "ok" and r["changed_days"] == []
    assert r["itinerary"]["budget_summary"]["budget"] == 50000 and r["itinerary"]["budget_summary"]["remaining"] == 9000


def test_modify_needs_an_itinerary_and_an_instruction(base_itin):
    assert itinerary.modify_itinerary({}, "x", ai_call=fake_ai())["status"] == "error"
    assert itinerary.modify_itinerary(base_itin, "  ", ai_call=fake_ai())["status"] == "error"


# ── Travel mode ─────────────────────────────────────────────────────────────
@pytest.mark.parametrize("mode, label, phrase", [
    ("flight", "Flights", "by flight"), ("train", "Train tickets", "by train"),
    ("bus", "Bus tickets", "by bus"), ("car", "Fuel & tolls", "by car"), ("any", "Getting there", "most sensible mode"),
])
def test_travel_mode_shapes_prompt_and_cost_label(mode, label, phrase):
    ai = fake_ai(_plan(3))
    r = itinerary.generate_itinerary(**GEN, ai_call=ai, transport=mode)
    assert r["status"] == "ok" and r["itinerary"]["transport"] == mode
    assert phrase in ai.calls[0]
    flights = next(c for c in r["itinerary"]["budget_summary"]["categories"] if c["key"] == "flights")
    assert flights["label"] == label


def test_invalid_travel_mode_rejected():
    r = itinerary.generate_itinerary(**GEN, ai_call=fake_ai(), transport="teleport")
    assert r["status"] == "error" and "Travel mode" in r["message"]


def test_modify_keeps_travel_mode_label(base_itin):
    base_itin["transport"] = "bus"
    r = itinerary.modify_itinerary(base_itin, "", new_budget="₹50,000", ai_call=fake_ai(), verify=False)
    assert next(c for c in r["itinerary"]["budget_summary"]["categories"] if c["key"] == "flights")["label"] == "Bus tickets"


# ── Place autocomplete ──────────────────────────────────────────────────────
def test_autocomplete_destination_prefers_photon_and_dedupes(monkeypatch):
    item = lambda name, cc, kind="city", detail="": {"name": name, "detail": detail, "country_code": cc, "flag": geo.flag_emoji(cc), "type": kind}
    monkeypatch.setattr(geo, "_photon", lambda t: [item("Santorini", "gr", "other", "Aegean, Greece"), item("Santorini", "gr", "other")])
    monkeypatch.setattr(geo, "_geoapify", lambda t, airports_only=False: [item("Binangonan", "ph")])
    r = geo.autocomplete("santorini")
    assert [x["name"] for x in r] == ["Santorini", "Binangonan"] and r[0]["flag"] == "🇬🇷"


def test_autocomplete_departure_puts_airports_first(monkeypatch):
    airport = {"name": "Kempegowda International Airport", "detail": "Karnataka, India", "country_code": "in", "flag": "🇮🇳", "type": "airport"}
    city = {"name": "Bengaluru", "detail": "Karnataka, India", "country_code": "in", "flag": "🇮🇳", "type": "city"}
    monkeypatch.setattr(geo, "_photon", lambda t: [city])
    monkeypatch.setattr(geo, "_geoapify", lambda t, airports_only=False: [airport] if airports_only else [])
    assert [x["type"] for x in geo.autocomplete("blr airport", "departure")] == ["airport", "city"]


def test_autocomplete_survives_one_source_failing(monkeypatch):
    def down(*a, **k):
        raise common.ToolUnavailable("Place search did not respond in time")
    monkeypatch.setattr(geo, "_photon", down)
    monkeypatch.setattr(geo, "_geoapify", lambda t, airports_only=False: [] if airports_only else [
        {"name": "Goa", "detail": "India", "country_code": "in", "flag": "🇮🇳", "type": "state"}])
    assert [x["name"] for x in geo.autocomplete("goa")] == ["Goa"]
    monkeypatch.setattr(geo, "_geoapify", down)
    with pytest.raises(common.ToolUnavailable):
        geo.autocomplete("goa")
    assert geo.autocomplete("g") == []          # too short: no lookup at all


def test_flag_emoji():
    assert geo.flag_emoji("IN") == "🇮🇳" and geo.flag_emoji("") == "📍"
