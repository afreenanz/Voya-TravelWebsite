"""Live smoke tests against the real Geoapify and Open-Meteo APIs (no AI calls).
Skipped by default; run with:  python -m pytest -m live"""
from datetime import date, timedelta

import pytest

from backend.tools import common, geo, places, weather

pytestmark = pytest.mark.live


@pytest.fixture(autouse=True)
def need_key():
    if not common.GEOAPIFY_KEY:
        pytest.skip("GEOAPIFY_API_KEY not set")


def test_live_destination_and_verification():
    bali = geo.resolve_destination("Bali")
    assert bali["country_code"] == "id" and bali["result_type"] == "state"
    assert geo.verify_place("Tanah Lot Temple", bali)["verified"] is True
    assert geo.verify_place("Made-up Cafe Zorblax", bali)["verified"] is False


def test_live_places_search():
    r = places.search_places("Goa", ["beaches", "history"], limit=10)
    assert r["status"] == "ok" and len(r["places"]) >= 5
    assert all(p["name"] and p["lat"] is not None for p in r["places"])


def test_live_weather_forecast_and_window():
    soon = date.today() + timedelta(days=2)
    r = weather.get_weather("Goa", soon.isoformat(), (soon + timedelta(days=1)).isoformat())
    assert r["status"] == "ok" and len(r["days"]) == 2 and r["days"][0]["temp_max_c"] is not None
    far = date.today() + timedelta(days=60)
    assert weather.get_weather("Goa", far.isoformat(), far.isoformat())["status"] == "unavailable"
