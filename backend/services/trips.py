"""Tool F — Save an agent-built itinerary to the signed-in user's trips.

Guarantees:
  * the trip is always stored under the verified user's email (never from input),
  * the same destination + dates is UPDATED instead of saved twice,
  * success is only reported after the row is read back from the database.
"""
import json
import re

DEFAULT_GRADIENT = "linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)"
VALID_STATUSES = {"planning", "upcoming", "completed", "wishlist"}
MAX_ITINERARY_BYTES = 200_000
_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class TripError(ValueError):
    pass


def _validate(itin, status):
    if status not in VALID_STATUSES:
        raise TripError("Invalid trip status.")
    if not isinstance(itin, dict):
        raise TripError("There's no itinerary to save.")
    days = itin.get("days")
    if not isinstance(days, list) or not days or not all(isinstance(d, dict) and d.get("activities") for d in days):
        raise TripError("This itinerary has no days to save.")
    dest = (itin.get("destination") or "").strip()
    if not dest or len(dest) > 120:
        raise TripError("The itinerary needs a destination.")
    for key in ("start_date", "end_date"):
        if not _DATE.match(str(itin.get(key) or "")):
            raise TripError("The itinerary needs valid start and end dates.")
    if len(json.dumps(itin)) > MAX_ITINERARY_BYTES:
        raise TripError("This itinerary is too large to save.")
    return dest


def save_itinerary(client, email, itin, status="planning"):
    """→ {"status": "saved"|"updated", "trip_id": "…"}. Raises TripError on invalid input
    or if the save can't be confirmed (the caller must NOT claim success then)."""
    dest = _validate(itin, status)
    summary = itin.get("budget_summary") or {}
    row = {
        "destination":    dest,
        "cities":         (itin.get("cities") or dest)[:200],
        "budget":         (itin.get("budget") or summary.get("total_formatted") or "")[:40],
        "days":           len(itin["days"]),
        "start_date":     itin["start_date"],
        "end_date":       itin["end_date"],
        "travelers":      int(itin.get("travelers") or 1),
        "travel_style":   ", ".join(itin.get("interests") or [])[:120] or (itin.get("pace") or ""),
        "itinerary_json": {
            "days": itin["days"],
            "cost_breakdown": itin.get("cost_breakdown"),
            "budget_summary": summary or None,
            "verification": itin.get("verification"),
            "travel_considerations": itin.get("travel_considerations") or [],
            "transport": itin.get("transport"),
            "source": "voya-agent",
        },
    }
    existing = (client.table("trips").select("id,destination")
                .eq("user_email", email).eq("start_date", row["start_date"]).eq("end_date", row["end_date"])
                .execute().data or [])
    match = next((r for r in existing if (r.get("destination") or "").strip().lower() == dest.lower()), None)
    if match:
        client.table("trips").update(row).eq("id", match["id"]).eq("user_email", email).execute()
        trip_id, outcome = match["id"], "updated"
    else:
        res = client.table("trips").insert({**row, "user_email": email, "status": status,
                                            "flag": "✈️", "gradient": DEFAULT_GRADIENT}).execute()
        if not res.data:
            raise TripError("The database didn't confirm the save.")
        trip_id, outcome = res.data[0]["id"], "saved"

    check = client.table("trips").select("id").eq("id", trip_id).eq("user_email", email).limit(1).execute()
    if not check.data:
        raise TripError("The trip couldn't be confirmed in your account.")
    return {"status": outcome, "trip_id": str(trip_id)}
