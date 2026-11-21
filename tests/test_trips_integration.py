"""Integration tests for Tool F (save trip) against the real Supabase project."""
import pytest

from backend.services import trips

pytestmark = pytest.mark.integration


def _itin(**over):
    day = {"day": 1, "title": "Arrive", "activities": [{"time": "10:00", "name": "Baga Beach", "note": ""}]}
    base = {"destination": "Goa", "start_date": "2026-12-10", "end_date": "2026-12-12", "travelers": 2,
            "budget": "₹40,000", "interests": ["beaches", "cafes"], "days": [day, {**day, "day": 2}, {**day, "day": 3}],
            "cost_breakdown": {"total": "₹39,000"}, "budget_summary": {"total": 39000, "total_formatted": "₹39,000"}}
    return {**base, **over}


def test_save_confirms_and_shows_up_in_my_trips(client, db, make_user):
    u = make_user()
    r = trips.save_itinerary(db, u["email"], _itin())
    assert r["status"] == "saved" and r["trip_id"]
    listed = client.get("/api/get-trips", headers=u["headers"]).json["trips"]
    assert [t["id"] for t in listed] == [r["trip_id"]]
    t = listed[0]
    assert t["destination"] == "Goa" and t["days"] == 3 and t["status"] == "planning"
    assert t["costBreakdown"]["total"] == "₹39,000" and t["travelStyle"] == "beaches, cafes"


def test_saving_the_same_trip_twice_updates_instead_of_duplicating(client, db, make_user):
    u = make_user()
    first = trips.save_itinerary(db, u["email"], _itin())
    second = trips.save_itinerary(db, u["email"], _itin(destination="goa", budget="₹50,000"))
    assert second == {"status": "updated", "trip_id": first["trip_id"]}
    listed = client.get("/api/get-trips", headers=u["headers"]).json["trips"]
    assert len(listed) == 1 and listed[0]["budget"] == "₹50,000"
    third = trips.save_itinerary(db, u["email"], _itin(start_date="2027-01-05", end_date="2027-01-07"))
    assert third["status"] == "saved" and third["trip_id"] != first["trip_id"]


def test_same_trip_for_another_user_is_separate(db, make_user):
    a, b = make_user("A"), make_user("B")
    ra, rb = trips.save_itinerary(db, a["email"], _itin()), trips.save_itinerary(db, b["email"], _itin())
    assert ra["status"] == rb["status"] == "saved" and ra["trip_id"] != rb["trip_id"]


@pytest.mark.parametrize("itin, status, msg", [
    (None, "planning", "no itinerary"),
    ({"destination": "Goa", "days": []}, "planning", "no days"),
    ({"destination": "", "start_date": "2026-12-10", "end_date": "2026-12-12", "days": [{"activities": [1]}]}, "planning", "destination"),
    ({"destination": "Goa", "start_date": "10-12-2026", "end_date": "2026-12-12", "days": [{"activities": [1]}]}, "planning", "valid start"),
    ({"destination": "Goa", "start_date": "2026-12-10", "end_date": "2026-12-12", "days": [{"activities": [1]}]}, "booked", "Invalid trip status"),
])
def test_invalid_itineraries_are_rejected_and_nothing_is_saved(db, make_user, itin, status, msg):
    u = make_user()
    with pytest.raises(trips.TripError, match=msg):
        trips.save_itinerary(db, u["email"], itin, status=status)
    assert db.table("trips").select("id").eq("user_email", u["email"]).execute().data == []
