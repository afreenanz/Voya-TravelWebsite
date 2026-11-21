"""Tools D + E — Itinerary generation and modification.

The LLM writes the plan (places, order, timing, rough per-category cost
estimates). Everything that must be *correct* is done in code afterwards:
  * structure/day-count validation (retry once on bad output),
  * budget totals via the budget tool (the LLM's arithmetic is never used),
  * place verification against map data (verified vs. AI-suggested is explicit),
  * straight-line distances between consecutive verified stops (labelled approximate).
"""
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

from ..services.ai import AIError, call_openrouter, parse_json, user_message
from . import budget as budget_tool
from .common import ToolUnavailable, haversine_km
from .geo import resolve_destination, verify_place

log = logging.getLogger("voya")

ICONS = [
    "plane-landing", "plane-takeoff", "building-2", "map-pin", "utensils",
    "train-front", "bus", "car", "ship", "bike", "landmark", "shopping-bag",
    "waves", "sunrise", "sunset", "sun", "camera", "coffee", "music",
    "compass", "fish", "map", "ticket", "moon", "sparkles", "heart",
]
CATEGORIES = ("sightseeing", "culture", "food", "beach", "nature", "adventure", "shopping",
              "nightlife", "relaxation", "transport", "accommodation")
CATEGORY_ICON = {"sightseeing": "camera", "culture": "landmark", "food": "utensils", "beach": "waves",
                 "nature": "compass", "adventure": "compass", "shopping": "shopping-bag", "nightlife": "music",
                 "relaxation": "sun", "transport": "car", "accommodation": "building-2"}
PACE_ACTIVITIES = {"relaxed": "3-4", "balanced": "4-5", "packed": "5-6"}
# How the traveller gets to the destination. The cost always goes in the
# "flights" category key (kept for the existing UI); only its label changes.
TRANSPORT_MODES = {
    "any":    ("Getting there", "choose the most sensible mode for this route (flight, train, bus or car) and name it in cost_notes.flights"),
    "flight": ("Flights", "by flight, round trip, economy unless the budget clearly allows more"),
    "train":  ("Train tickets", "by train, round trip, a reserved class that suits the budget"),
    "bus":    ("Bus tickets", "by bus, round trip (overnight/AC sleeper where sensible)"),
    "car":    ("Fuel & tolls", "by car (self-drive or own car): fuel and tolls for the round trip"),
}
MAX_DAYS = 14
MAX_VERIFY_LOOKUPS = 40
SKIP_VERIFY_PREFIXES = ("check-in", "check in", "check-out", "check out", "checkout", "arrival", "arrive",
                        "departure", "depart", "breakfast at hotel", "free time", "rest", "flight", "transfer")
AI_ATTEMPT_TIMEOUT_S = 100


class ItineraryError(ValueError):
    """Unusable model output (triggers the retry)."""


# ── validation / normalisation ──────────────────────────────────────────────
def _s(value, max_len=300):
    return " ".join(value.split())[:max_len] if isinstance(value, str) else ""


def _num(value):
    try:
        n = float(str(value).replace(",", "")) if value not in (None, "") else None
    except ValueError:
        return None
    return int(round(n)) if n is not None and n >= 0 else None


def normalise_activity(a, currency):
    if not isinstance(a, dict) or not _s(a.get("name")):
        return None
    category = _s(a.get("category"), 30).lower()
    category = category if category in CATEGORIES else "sightseeing"
    icon = _s(a.get("icon"), 40)
    time_ = _s(a.get("time"), 5)
    cost = _num(a.get("estimated_cost"))
    out = {
        "time": time_ if len(time_) == 5 and time_[2] == ":" and time_.replace(":", "").isdigit() else "",
        "icon": icon if icon in ICONS else CATEGORY_ICON[category],
        "name": _s(a.get("name"), 200),
        "location": _s(a.get("location"), 150),
        "category": category,
        "description": _s(a.get("description"), 400),
        "duration_min": _num(a.get("duration_minutes")),
        "estimated_cost": cost,
        "tip": _s(a.get("tip"), 200),
    }
    # Legacy "note" so the existing itinerary UI renders new plans unchanged.
    parts = [out["description"]]
    if cost is not None:
        parts.append(f"~{budget_tool.format_amount(cost, currency)} (estimate)" if cost else "Free")
    parts.append(out["tip"])
    out["note"] = " · ".join(p for p in parts if p)
    return out


def normalise_day(d, number, currency):
    if not isinstance(d, dict):
        raise ItineraryError(f"day {number} is not an object")
    acts = [x for x in (normalise_activity(a, currency) for a in d.get("activities") or []) if x]
    if not acts:
        raise ItineraryError(f"day {number} has no valid activities")
    return {"day": number, "title": _s(d.get("title"), 120) or f"Day {number}",
            "theme": _s(d.get("theme"), 120), "activities": acts}


def _estimates(raw):
    if not isinstance(raw, dict):
        raise ItineraryError("cost_estimates missing")
    est = {k: _num(raw.get(k)) for k in budget_tool.CATEGORIES if _num(raw.get(k)) is not None}
    if not est:
        raise ItineraryError("cost_estimates has no numbers")
    return est


# ── enrichment: verification + distances ────────────────────────────────────
def _should_verify(act):
    low = act["name"].lower()
    return act["category"] != "transport" and not low.startswith(SKIP_VERIFY_PREFIXES)


def enrich_days(days, dest, known_places=None):
    """Attach verified map data + approximate distances. Mutates and returns days."""
    known = {p["name"].lower(): p for p in (known_places or []) if p.get("name")}
    todo = []
    for day in days:
        for act in day["activities"]:
            act["verified"] = False
            hit = known.get(act["name"].lower())
            if hit and hit.get("lat") is not None:
                act.update({"verified": True, "address": hit.get("address") or "", "lat": hit["lat"], "lon": hit["lon"],
                            "opening_hours": hit.get("opening_hours"), "source": "Geoapify (OpenStreetMap data)"})
            elif dest and _should_verify(act) and len(todo) < MAX_VERIFY_LOOKUPS:
                todo.append(act)
    if todo:
        with ThreadPoolExecutor(max_workers=8) as pool:
            for act, res in zip(todo, pool.map(lambda a: verify_place(a["name"], dest), todo)):
                act.update(res)
    for day in days:
        prev = None
        for act in day["activities"]:
            act.pop("distance_from_previous_km", None)
            if act.get("lat") is not None:
                if prev is not None:
                    act["distance_from_previous_km"] = haversine_km(prev["lat"], prev["lon"], act["lat"], act["lon"])
                prev = act
    return days


def _verification_stats(days):
    acts = [a for d in days for a in d["activities"]]
    return {"verified": sum(1 for a in acts if a.get("verified")), "total": len(acts),
            "note": "Verified places were matched in OpenStreetMap map data. Others are AI suggestions — check before you go."}


def _budget_for(itin, estimates):
    mode = itin.get("transport") if itin.get("transport") in TRANSPORT_MODES else "any"
    res = budget_tool.calculate_budget(estimates, total_budget=itin.get("budget") or None, days=len(itin["days"]),
                                       travelers=itin.get("travelers") or 1, currency=itin.get("currency") or "INR",
                                       labels={"flights": TRANSPORT_MODES[mode][0]})
    if res["status"] != "ok":
        raise ItineraryError(res["message"])
    itin["cost_estimates"] = estimates
    itin["budget_summary"] = res
    itin["cost_breakdown"] = budget_tool.to_cost_breakdown(res, itin.get("cost_notes"))


# ── prompts ─────────────────────────────────────────────────────────────────
OUTPUT_SCHEMA = """{
  "cities": "<2-4 main areas separated by ' · '>",
  "days": [
    {"day": 1, "title": "<title>", "theme": "<short theme>",
     "activities": [
       {"time": "HH:MM", "name": "<exact real place name>", "location": "<neighbourhood/area>",
        "category": "<one of: %(cats)s>", "icon": "<one of the allowed icons>",
        "description": "<one sentence>", "duration_minutes": <integer>,
        "estimated_cost": <integer for ALL travellers, in %(cur)s, 0 if free>, "tip": "<one practical tip>"}
     ]}
  ],
  "cost_estimates": {"flights": <int>, "accommodation": <int>, "food": <int>, "activities": <int>,
                     "local_transport": <int>, "misc": <int>},
  "cost_notes": {"flights": "<route/class>", "accommodation": "<nights · hotel · tier>", "food": "", "activities": "",
                 "local_transport": "", "misc": ""},
  "travel_considerations": ["<visa/season/transport/safety notes, max 4>"]
}"""


def _plan_prompt(p, num_days, currency, places, weather_text, user_context):
    place_lines = "\n".join(f"- {x['name']} ({x['category']}{'; hours ' + x['opening_hours'] if x.get('opening_hours') else ''})"
                            for x in (places or [])[:20]) or "- (no verified places available — use well-known real places)"
    return f"""Plan a {num_days}-day trip. Return ONLY one JSON object, no markdown.

TRIP
- Destination: {p['destination']}
- Dates: {p['start_date']} to {p['end_date']} ({num_days} days)
- Travellers: {p['travelers']}
- Total budget: {p.get('budget') or 'not specified — keep it sensible mid-range'} (currency {currency})
- Departing from: {p.get('from_city') or "not specified (set cost_estimates.flights to 0)"}
- Getting there: {TRANSPORT_MODES[p.get('transport') or 'any'][1]}. Put this cost in cost_estimates.flights.
- Interests: {', '.join(p.get('interests') or []) or 'general sightseeing'}
- Pace: {p['pace']} → {PACE_ACTIVITIES[p['pace']]} activities per day

WHAT WE KNOW ABOUT THE TRAVELLER (from their saved preferences/history)
{user_context or 'Nothing saved yet.'}

VERIFIED PLACES FROM MAP DATA (prefer these when they fit; you may add other REAL places)
{place_lines}

WEATHER (real forecast or honest 'unavailable' — plan indoor options on rainy days; never invent weather)
{weather_text or 'Unavailable.'}

RULES
1. Exactly {num_days} day objects. Day 1 starts with arrival/check-in, the last day ends with departure.
2. Group nearby places on the same day; keep travel between stops realistic.
3. Use real, specific place names. Do NOT invent opening hours, exact prices or availability.
4. estimated_cost and cost_estimates are ESTIMATES in {currency} for all {p['travelers']} traveller(s); integers only.
5. Estimate REALISTIC current prices for this destination, season, travel mode and number of travellers.
   Do NOT bend the numbers to match the budget: pick cheaper options where sensible, but if a realistic trip
   costs more or less than the budget, keep the realistic numbers — Voya shows the difference to the traveller.
   Do NOT compute totals — Voya adds them up.
6. Allowed icons: {', '.join(ICONS)}

OUTPUT FORMAT
{OUTPUT_SCHEMA % {'cats': ', '.join(CATEGORIES), 'cur': currency}}"""


def _call_json(prompt, ai_call, deadline, check=None):
    """AI call → parsed dict, passed through check() (which may raise ItineraryError).
    Retries once on empty, unreadable or structurally invalid output within the deadline."""
    messages = [{"role": "system", "content": "You are Voya's expert travel planner. Return ONLY valid JSON."},
                {"role": "user", "content": prompt}]
    last = None
    for attempt in (1, 2):
        remaining = deadline - time.monotonic()
        if remaining < 15:
            break
        try:
            data = parse_json(ai_call(messages, max_tokens=8192, json_mode=True, timeout=min(AI_ATTEMPT_TIMEOUT_S, remaining)))
            if not isinstance(data, dict):
                raise ItineraryError("result is not an object")
            return check(data) if check else data
        except AIError as e:
            if str(e) not in ("empty response", "malformed response"):
                raise
            last = e
        except (ValueError, json.JSONDecodeError) as e:  # includes ItineraryError
            last = e
        log.warning("itinerary attempt %d unusable: %s", attempt, last)
    raise ItineraryError(f"the AI returned an unusable plan ({last})")


def _check_params(destination, start_date, end_date, travelers, pace):
    destination = _s(destination, 120)
    if not destination:
        raise ItineraryError("Destination is required.")
    try:
        s, e = datetime.strptime(start_date, "%Y-%m-%d"), datetime.strptime(end_date, "%Y-%m-%d")
    except (TypeError, ValueError):
        raise ItineraryError("Dates must be YYYY-MM-DD.")
    num_days = (e - s).days + 1
    if num_days < 1:
        raise ItineraryError("End date must be on or after the start date.")
    if num_days > MAX_DAYS:
        raise ItineraryError(f"Trips can be at most {MAX_DAYS} days.")
    if not isinstance(travelers, int) or not 1 <= travelers <= 20:
        raise ItineraryError("Travellers must be between 1 and 20.")
    pace = (pace or "balanced").lower()
    if pace not in PACE_ACTIVITIES:
        raise ItineraryError("Pace must be relaxed, balanced or packed.")
    return destination, num_days, pace


# ── Tool D: generate ────────────────────────────────────────────────────────
def generate_itinerary(*, destination, start_date, end_date, travelers=2, budget=None, interests=None,
                       pace="balanced", from_city="", user_context="", places=None, weather=None,
                       dest=None, ai_call=call_openrouter, verify=True, time_budget_s=105, transport="any"):
    """→ {"status": "ok", "itinerary": {...}} or {"status": "error"|"unavailable", "message"}"""
    deadline = time.monotonic() + time_budget_s
    try:
        destination, num_days, pace = _check_params(destination, start_date, end_date, travelers, pace)
        currency = budget_tool.parse_amount(budget)[1] if budget else "INR"
        transport = (transport or "any").lower()
        if transport not in TRANSPORT_MODES:
            raise ItineraryError("Travel mode must be one of: " + ", ".join(TRANSPORT_MODES) + ".")
    except (ItineraryError, budget_tool.BudgetError) as e:
        return {"status": "error", "message": str(e)}

    params = {"transport": transport, "destination": destination, "start_date": start_date, "end_date": end_date, "travelers": travelers,
              "budget": budget or "", "from_city": _s(from_city, 120), "interests": [_s(i, 60) for i in interests or []][:10],
              "pace": pace}
    weather_text = None
    if weather is not None:
        from .weather import summarise
        weather_text = summarise(weather)
    prompt = _plan_prompt(params, num_days, currency, places, weather_text, user_context)
    def check(raw):
        days_in = raw.get("days")
        if not isinstance(days_in, list) or len(days_in) < num_days:
            raise ItineraryError(f"only {len(days_in) if isinstance(days_in, list) else 0} of {num_days} days")
        days = [normalise_day(d, i, currency) for i, d in enumerate(days_in[:num_days], start=1)]
        return raw, days, _estimates(raw.get("cost_estimates"))

    try:
        raw, days, estimates = _call_json(prompt, ai_call, deadline, check)
        itin = {**params, "currency": currency, "days": days, "cities": _s(raw.get("cities"), 200) or destination,
                "cost_notes": {k: _s(v, 200) for k, v in (raw.get("cost_notes") or {}).items() if k in budget_tool.CATEGORIES},
                "travel_considerations": [_s(x, 200) for x in (raw.get("travel_considerations") or []) if _s(x)][:4]}
        _budget_for(itin, estimates)
    except ItineraryError as e:
        return {"status": "unavailable", "message": f"Couldn't build the itinerary: {e}. Please try again."}
    except AIError as e:
        return {"status": "unavailable", "message": user_message(e)}

    if verify:
        try:
            dest = dest or resolve_destination(destination)
        except ToolUnavailable:
            dest = None
        enrich_days(itin["days"], dest, (places or []))
    itin["verification"] = _verification_stats(itin["days"])
    if weather is not None:
        itin["weather"] = {"status": weather.get("status"), "source": weather.get("source"), "days": weather.get("days", []),
                           "message": weather.get("message")}
    itin["generated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return {"status": "ok", "itinerary": itin}


# ── Tool E: modify ──────────────────────────────────────────────────────────
def _compact(itin):
    lines = []
    for d in itin["days"]:
        lines.append(f"Day {d['day']} — {d['title']}")
        for a in d["activities"]:
            cost = "" if a.get("estimated_cost") is None else f", ~{a['estimated_cost']}"
            lines.append(f"  {a.get('time') or '--:--'} {a['name']} [{a.get('category')}] ({a.get('location') or ''}{cost})")
    return "\n".join(lines)


def modify_itinerary(itinerary, instruction, *, new_budget=None, dest=None, ai_call=call_openrouter,
                     verify=True, time_budget_s=105):
    """Change only what the instruction asks for; every other day is kept exactly as it was.
    → {"status": "ok", "itinerary", "changed_days": [n…], "summary"} or an error/unavailable status."""
    deadline = time.monotonic() + time_budget_s
    instruction = _s(instruction, 1000)
    if not isinstance(itinerary, dict) or not isinstance(itinerary.get("days"), list) or not itinerary["days"]:
        return {"status": "error", "message": "There's no itinerary to modify yet."}
    if not instruction and not new_budget:
        return {"status": "error", "message": "Tell me what to change."}
    itin = json.loads(json.dumps(itinerary))  # deep copy: never mutate the caller's draft
    if new_budget:
        try:
            amount, currency = budget_tool.parse_amount(new_budget, itin.get("currency") or "INR")
        except budget_tool.BudgetError as e:
            return {"status": "error", "message": str(e)}
        itin["budget"], itin["currency"] = budget_tool.format_amount(amount, currency), currency
    currency = itin.get("currency") or "INR"
    n = len(itin["days"])
    changed, summary = [], "Updated the budget."

    if instruction:
        prompt = f"""Modify this {n}-day {itin.get('destination')} itinerary. Return ONLY one JSON object.

CURRENT ITINERARY
{_compact(itin)}

CURRENT COST ESTIMATES ({currency}, all travellers): {json.dumps(itin.get('cost_estimates') or {})}
BUDGET: {itin.get('budget') or 'not specified'} · TRAVELLERS: {itin.get('travelers')} · PACE: {itin.get('pace')}

CHANGE REQUESTED BY THE TRAVELLER
{instruction}

RULES
1. Return ONLY the days that need to change, each as a COMPLETE day object (all its activities). Omit unchanged days.
2. Day numbers must be between 1 and {n}. Do not add or remove days.
3. Real, specific place names; never invent opening hours or exact prices.
4. Return cost_estimates for the WHOLE trip after the change (integers, {currency}). Don't compute totals.

OUTPUT FORMAT
{{"changed_days": [{{"day": <n>, "title": "...", "theme": "...", "activities": [<same activity format as below>]}}],
  "cost_estimates": {{"flights": <int>, "accommodation": <int>, "food": <int>, "activities": <int>, "local_transport": <int>, "misc": <int>}},
  "summary": "<one sentence describing what changed>"}}
Activity format: {{"time": "HH:MM", "name": "", "location": "", "category": "<{', '.join(CATEGORIES)}>", "icon": "<{', '.join(ICONS)}>",
"description": "", "duration_minutes": <int>, "estimated_cost": <int>, "tip": ""}}"""
        def check(raw):
            new_days = raw.get("changed_days")
            if not isinstance(new_days, list) or not new_days:
                raise ItineraryError("no changed days returned")
            replacements = {}
            for d in new_days:
                num = _num(d.get("day")) if isinstance(d, dict) else None
                if num is None or not 1 <= num <= n:
                    raise ItineraryError(f"invalid day number {d.get('day') if isinstance(d, dict) else d}")
                replacements[num] = normalise_day(d, num, currency)
            est = _estimates(raw.get("cost_estimates")) if raw.get("cost_estimates") else itin.get("cost_estimates")
            return replacements, est, _s(raw.get("summary"), 300) or "Updated your itinerary."

        try:
            replacements, estimates, summary = _call_json(prompt, ai_call, deadline, check)
        except ItineraryError as e:
            return {"status": "unavailable", "message": f"Couldn't apply that change: {e}. Please try rephrasing."}
        except AIError as e:
            return {"status": "unavailable", "message": user_message(e)}
        for num, day in replacements.items():
            itin["days"][num - 1] = day
        changed = sorted(replacements)
        if verify:
            try:
                dest = dest or resolve_destination(itin.get("destination"))
            except ToolUnavailable:
                dest = None
            enrich_days([itin["days"][i - 1] for i in changed], dest)
    else:
        estimates = itin.get("cost_estimates")

    try:
        _budget_for(itin, estimates or {})
    except ItineraryError as e:
        return {"status": "error", "message": str(e)}
    itin["verification"] = _verification_stats(itin["days"])
    return {"status": "ok", "itinerary": itin, "changed_days": changed, "summary": summary}
