"""Graph nodes. Each node takes (state, config) and returns a partial state update.

External dependencies (DB client, LLM, tools, event emitter) come from
config["configurable"]["deps"] so tests can swap any of them for fakes.
"""
import json
import logging
import re
import time
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from typing import Callable, Optional

from ..services import ai, memory, trips
from ..tools import itinerary as itinerary_tool
from ..tools import places as places_tool
from ..tools import weather as weather_tool
from .prompts import ANSWER_SYSTEM, UNDERSTAND_SYSTEM, answer_prompt, understand_prompt
from .state import INTENTS, STEP_LABELS, TOOL_ORDER, TOOLS

log = logging.getLogger("voya")
MAX_DAYS = itinerary_tool.MAX_DAYS
TENTATIVE_START_DAYS = 30
SAVE_WORDS = re.compile(r"\b(save|book|keep|add (it )?to (my )?trips)\b", re.I)


@dataclass
class Deps:
    db: object
    llm: Callable = field(default=lambda *a, **k: ai.call_openrouter(*a, **k))
    search_places: Callable = field(default=lambda *a, **k: places_tool.search_places(*a, **k))
    get_weather: Callable = field(default=lambda *a, **k: weather_tool.get_weather(*a, **k))
    generate_itinerary: Callable = field(default=lambda *a, **k: itinerary_tool.generate_itinerary(*a, **k))
    modify_itinerary: Callable = field(default=lambda *a, **k: itinerary_tool.modify_itinerary(*a, **k))
    emit: Optional[Callable] = None

    def event(self, **ev):
        if self.emit:
            try:
                self.emit(ev)
            except Exception:  # a disconnected stream must never break the turn
                log.warning("agent event emit failed")


def _deps(config) -> Deps:
    return config["configurable"]["deps"]


def _remaining(state):
    return state["deadline"] - time.monotonic()


# ── 1. load_context ─────────────────────────────────────────────────────────
def load_context(state, config):
    d = _deps(config)
    ctx = memory.build_user_context(d.db, state["user_id"], state["email"])
    msgs = memory.get_messages(d.db, state["conversation_id"], limit=12)
    conv = memory.get_conversation(d.db, state["user_id"], state["conversation_id"]) or {}
    return {
        "context": ctx,
        "context_text": memory.context_to_prompt(ctx),
        "history": [{"role": m["role"], "content": m["content"]} for m in msgs],
        "draft": conv.get("draft_itinerary"),
        "steps": [], "results": {}, "notes": [], "draft_changed": False,
    }


# ── 2. understand (LLM call #1) ─────────────────────────────────────────────
def draft_summary(draft):
    if not draft:
        return ""
    days = "; ".join(f"Day {x['day']}: {x['title']}" for x in draft.get("days", [])[:14])
    b = draft.get("budget_summary") or {}
    return (f"{draft.get('destination')} {draft.get('start_date')} → {draft.get('end_date')}, "
            f"{draft.get('travelers')} traveller(s), budget {draft.get('budget') or 'n/a'}, "
            f"estimated total {b.get('total_formatted', 'n/a')}. {days}")


def _clean_date(v):
    try:
        return datetime.strptime(str(v), "%Y-%m-%d").date().isoformat()
    except (TypeError, ValueError):
        return ""


def _int_in(v, lo, hi):
    try:
        n = int(v)
    except (TypeError, ValueError):
        return None
    return n if lo <= n <= hi else None


def _text(v, n):
    return " ".join(v.split())[:n] if isinstance(v, str) else ""


def clean_remember(raw):
    """Keep only valid, allow-listed preferences (each key validated on its own)."""
    out = {}
    for key, value in (raw or {}).items() if isinstance(raw, dict) else []:
        try:
            out.update(memory.clean_preferences({key: value}))
        except memory.MemoryInputError:
            continue
    return out


def clean_plan(raw):
    """Validate the LLM's plan into a safe, typed structure. Unknown values are dropped."""
    raw = raw if isinstance(raw, dict) else {}
    trip = raw.get("trip") if isinstance(raw.get("trip"), dict) else {}
    pace = _text(trip.get("pace"), 20).lower()
    return {
        "intent": raw.get("intent") if raw.get("intent") in INTENTS else "general",
        "tools": [t for t in dict.fromkeys(raw.get("tools") or []) if t in TOOLS],
        "trip": {
            "destination": _text(trip.get("destination"), 120),
            "start_date": _clean_date(trip.get("start_date")),
            "end_date": _clean_date(trip.get("end_date")),
            "duration_days": _int_in(trip.get("duration_days"), 1, 60),
            "travelers": _int_in(trip.get("travelers"), 1, 20),
            "budget": _text(trip.get("budget"), 40),
            "interests": [_text(i, 60) for i in (trip.get("interests") or []) if _text(i, 60)][:10]
                         if isinstance(trip.get("interests"), list) else [],
            "pace": pace if pace in memory.PACE_VALUES else "",
            "from_city": _text(trip.get("from_city"), 120),
        },
        "instruction": _text(raw.get("instruction"), 500),
        "new_budget": _text(raw.get("new_budget"), 40),
        "remember": clean_remember(raw.get("remember")),
        "clarification": _text(raw.get("clarification"), 300),
    }


def understand(state, config):
    d = _deps(config)
    d.event(type="step", tool="understand", label=STEP_LABELS["understand"], status="running")
    t0 = time.monotonic()
    prompt = understand_prompt(state["message"], state["today"], state["context_text"], state["history"],
                               draft_summary(state.get("draft")))
    messages = [{"role": "system", "content": UNDERSTAND_SYSTEM}, {"role": "user", "content": prompt}]
    plan, error = None, ""
    for attempt in (1, 2):  # one retry on unreadable output
        try:
            raw = d.llm(messages, max_tokens=900, timeout=min(30, max(5, _remaining(state) - 60)),
                        json_mode=True, temperature=0.2, model=ai.OPENROUTER_CHAT_MODEL)
            plan = clean_plan(ai.parse_json(raw))
            break
        except ai.AIError as e:
            if str(e) not in ("empty response", "malformed response") or attempt == 2:
                error = ai.user_message(e)
                break
        except (ValueError, json.JSONDecodeError):
            if attempt == 2:
                error = "I couldn't understand that request. Could you rephrase it?"
    status = "error" if error else "done"
    d.event(type="step", tool="understand", label=STEP_LABELS["understand"], status=status)
    step = {"tool": "understand", "label": STEP_LABELS["understand"], "status": status,
            "ms": int((time.monotonic() - t0) * 1000)}
    if error:
        return {"error": error, "intent": "general", "tools": [], "plan": clean_plan({}), "steps": [step]}
    return {"plan": plan, "intent": plan["intent"], "steps": [step]}


# ── 3. decide: code guardrails over the LLM's tool plan ─────────────────────
def decide(state, config):
    if state.get("error"):
        return {"tools": []}
    plan = json.loads(json.dumps(state["plan"]))
    trip, draft = plan["trip"], state.get("draft")
    prefs = (state.get("context") or {}).get("preferences") or {}
    tools, notes = list(plan["tools"]), []
    today = date.fromisoformat(state["today"])

    def ask(question):
        return {"tools": [], "clarification": question, "plan": plan, "notes": notes}

    if plan["clarification"] and not tools:
        return ask(plan["clarification"])

    # Intent implies tools even if the model forgot to list them.
    implied = {"plan_trip": ["search_places", "get_weather", "generate_itinerary"],
               "modify_itinerary": ["modify_itinerary"], "save_trip": ["save_trip"],
               "check_weather": ["get_weather"], "find_places": ["search_places"],
               "budget": ["calculate_budget"] if draft else []}.get(plan["intent"], [])
    tools += [t for t in implied if t not in tools]
    if plan["remember"] and "remember_preferences" not in tools:
        tools.append("remember_preferences")
    if not plan["remember"]:
        tools = [t for t in tools if t != "remember_preferences"]

    # Fill gaps from the current draft (follow-ups like "what's the weather there?").
    if draft and not trip["destination"] and plan["intent"] != "plan_trip":
        trip["destination"] = draft.get("destination") or ""
        trip["start_date"] = trip["start_date"] or draft.get("start_date") or ""
        trip["end_date"] = trip["end_date"] or draft.get("end_date") or ""

    if "generate_itinerary" in tools:
        tools = [t for t in tools if t != "modify_itinerary"]   # a new plan replaces the draft
        if not trip["destination"]:
            return ask("Where would you like to go?")
        # Dates: explicit > start + duration > tentative (clearly flagged to the user).
        if trip["start_date"] and not trip["end_date"] and trip["duration_days"]:
            trip["end_date"] = (date.fromisoformat(trip["start_date"]) + timedelta(days=trip["duration_days"] - 1)).isoformat()
        if not trip["start_date"]:
            if not trip["duration_days"]:
                return ask(f"How many days would you like in {trip['destination']}, and roughly when?")
            start = today + timedelta(days=TENTATIVE_START_DAYS)
            trip["start_date"] = start.isoformat()
            trip["end_date"] = (start + timedelta(days=trip["duration_days"] - 1)).isoformat()
            notes.append(f"You didn't give dates, so I used tentative dates ({trip['start_date']} to {trip['end_date']}). "
                         "Tell me your real dates and I'll check the weather.")
        if not trip["end_date"]:
            return ask("When does the trip end (or how many days is it)?")
        start, end = date.fromisoformat(trip["start_date"]), date.fromisoformat(trip["end_date"])
        if end < start:
            return ask("The end date is before the start date. What are the right dates?")
        if start < today:
            return ask("Those dates are in the past. When would you like to travel?")
        if (end - start).days + 1 > MAX_DAYS:
            return ask(f"I can plan up to {MAX_DAYS} days at a time. Could you pick a shorter trip?")
        if not trip["travelers"]:
            trip["travelers"] = 2
            notes.append("I planned for 2 travellers. Tell me if that's different.")
        trip["interests"] = trip["interests"] or (prefs.get("interests") or []) + (prefs.get("activities") or [])
        trip["pace"] = trip["pace"] or prefs.get("pace") or "balanced"
        for t in ("search_places", "get_weather"):
            if t not in tools:
                tools.append(t)

    needs_draft = [t for t in tools if t in ("modify_itinerary", "calculate_budget", "save_trip")]
    if needs_draft and not draft and "generate_itinerary" not in tools:
        tools = [t for t in tools if t not in needs_draft]
        if not tools:
            return ask("There's no trip plan in this conversation yet. Where would you like to go?")
    # Saving is consequential: only when the traveller explicitly asked in THIS message.
    if "save_trip" in tools and not (plan["intent"] == "save_trip" or SAVE_WORDS.search(state["message"])):
        tools.remove("save_trip")
    if "modify_itinerary" in tools and not (plan["instruction"] or plan["new_budget"]):
        plan["instruction"] = state["message"]
    if "get_weather" in tools and not (trip["destination"] and trip["start_date"] and trip["end_date"]):
        tools.remove("get_weather")
        if plan["intent"] == "check_weather" and not tools:
            return ask("For which destination and dates should I check the weather?")
    if "search_places" in tools and not trip["destination"]:
        tools.remove("search_places")
        if plan["intent"] == "find_places" and not tools:
            return ask("Which destination should I search?")

    tools.sort(key=TOOL_ORDER.get)
    return {"tools": tools, "plan": plan, "notes": notes, "clarification": ""}


def route_after_decide(state):
    return "execute_tools" if state.get("tools") else "respond"


# ── 4. execute_tools ────────────────────────────────────────────────────────
def execute_tools(state, config):
    d = _deps(config)
    plan, trip = state["plan"], state["plan"]["trip"]
    draft = state.get("draft")
    results, steps, changed = {}, [], False
    dest_info, place_list, weather = None, None, None

    for tool in state["tools"]:
        label = STEP_LABELS[tool]
        d.event(type="step", tool=tool, label=label, status="running")
        t0, detail = time.monotonic(), ""
        try:
            if tool == "remember_preferences":
                saved = memory.merge_preferences(d.db, state["user_id"], plan["remember"])
                res = {"status": "ok", "remembered": plan["remember"], "preferences": saved}
                detail = "Saved " + ", ".join(memory.LIST_KEYS.get(k) or memory.TEXT_KEYS.get(k) for k in plan["remember"])
            elif tool == "search_places":
                res = d.search_places(trip["destination"], trip["interests"], limit=12)
                dest_info, place_list = res.get("destination"), res.get("places") or []
                detail = f"{len(place_list)} places found" if place_list else res.get("message", "")
            elif tool == "get_weather":
                res = d.get_weather(trip["destination"], trip["start_date"], trip["end_date"], dest=dest_info)
                weather = res
                detail = {"ok": "Forecast found", "partial": "Partial forecast"}.get(res["status"], "No forecast available")
            elif tool == "generate_itinerary":
                res = d.generate_itinerary(
                    destination=trip["destination"], start_date=trip["start_date"], end_date=trip["end_date"],
                    travelers=trip["travelers"], budget=trip["budget"] or None, interests=trip["interests"],
                    pace=trip["pace"], from_city=trip["from_city"], user_context=state["context_text"],
                    places=place_list, weather=weather, dest=dest_info,
                    time_budget_s=max(20, _remaining(state) - 12))
                if res["status"] == "ok":
                    draft, changed = res["itinerary"], True
                    v = draft.get("verification") or {}
                    detail = f"{len(draft['days'])} days · {v.get('verified', 0)}/{v.get('total', 0)} places verified"
            elif tool == "modify_itinerary":
                res = d.modify_itinerary(draft, plan["instruction"], new_budget=plan["new_budget"] or None,
                                         time_budget_s=max(20, _remaining(state) - 12))
                if res["status"] == "ok":
                    draft, changed = res["itinerary"], True
                    detail = ("Changed day " + ", ".join(map(str, res["changed_days"]))) if res["changed_days"] else res["summary"]
            elif tool == "calculate_budget":
                res = d.modify_itinerary(draft, "", new_budget=plan["new_budget"] or draft.get("budget") or None)
                if res["status"] == "ok":
                    draft, changed = res["itinerary"], True
                    res = {"status": "ok", "budget_summary": draft["budget_summary"]}
                    detail = f"Estimated total {draft['budget_summary']['total_formatted']}"
            elif tool == "save_trip":
                saved = trips.save_itinerary(d.db, state["email"], draft)
                draft = {**draft, "saved_trip_id": saved["trip_id"]}
                changed = True
                res = {"status": "ok", "outcome": saved["status"], "trip_id": saved["trip_id"]}
                detail = "Saved to My Trips" if saved["status"] == "saved" else "Updated in My Trips"
        except trips.TripError as e:
            res = {"status": "error", "message": str(e)}
        except Exception:  # a broken tool must not break the turn
            log.exception("agent tool %s failed", tool)
            res = {"status": "error", "message": "Something went wrong with this step."}
        status = "done" if res.get("status") in ("ok", "partial") else "error" if res.get("status") == "error" else "unavailable"
        if not detail and res.get("message"):
            detail = res["message"]
        results[tool] = res
        steps.append({"tool": tool, "label": label, "status": status, "detail": detail[:160],
                      "ms": int((time.monotonic() - t0) * 1000)})
        d.event(type="step", tool=tool, label=label, status=status, detail=detail[:160])

    return {"results": results, "steps": state.get("steps", []) + steps, "draft": draft, "draft_changed": changed}


# ── 5. respond ──────────────────────────────────────────────────────────────
def _plan_reply(draft, notes, verb="Here's"):
    b = draft.get("budget_summary") or {}
    s, e = draft.get("start_date"), draft.get("end_date")
    lines = [f"{verb} your {len(draft['days'])}-day {draft.get('destination')} plan ({s} to {e}) "
             f"for {draft.get('travelers')} traveller{'s' if (draft.get('travelers') or 1) > 1 else ''}."]
    if b:
        money = f"Estimated cost: {b['total_formatted']}"
        if b.get("budget_formatted"):
            money += (f", which is {b['remaining_formatted'].lstrip('-')} over your {b['budget_formatted']} budget"
                      if b.get("over_budget") else f" of your {b['budget_formatted']} budget ({b['remaining_formatted']} left)")
        lines.append(money + ".")
    w = draft.get("weather") or {}
    if w.get("status") in ("ok", "partial") and w.get("days"):
        first = w["days"][0]
        lines.append(f"Weather (Open-Meteo): {first['summary'].lower()}, {first['temp_min_c']}–{first['temp_max_c']}°C on {first['date']}.")
    elif w.get("message"):
        lines.append(w["message"])
    v = draft.get("verification") or {}
    if v.get("total"):
        lines.append(f"{v['verified']} of {v['total']} stops are verified on the map; the rest are AI suggestions.")
    lines += notes or []
    return " ".join(lines)


def _digest(results):
    """Compact, factual summary of tool results for the answer prompt."""
    out = {}
    for tool, r in results.items():
        if tool == "search_places":
            out[tool] = {"status": r.get("status"), "message": r.get("message"), "hint": r.get("hint"),
                         "places": [{k: p.get(k) for k in ("name", "category", "opening_hours")} for p in r.get("places", [])[:10]]}
        elif tool == "get_weather":
            out[tool] = {"status": r.get("status"), "source": r.get("source"), "summary": weather_tool.summarise(r)}
        else:
            out[tool] = {k: r.get(k) for k in ("status", "outcome", "message", "remembered", "trip_id") if r.get(k) is not None}
    return out


def _suggestions(state, draft):
    if state.get("clarification") or state.get("error"):
        return []
    if draft and state.get("draft_changed"):
        return ["Save to My Trips", "Make day 2 more relaxed", "Reduce the budget"]
    if state.get("intent") == "find_places":
        return [f"Plan 3 days in {state['plan']['trip']['destination']}"] if state["plan"]["trip"]["destination"] else []
    return ["Plan a 5-day beach trip", "What's the weather in Goa this week?"]


def respond(state, config):
    d = _deps(config)
    results, draft, notes = state.get("results") or {}, state.get("draft"), state.get("notes") or []
    pending = None

    if state.get("error"):
        reply = state["error"]
    elif state.get("clarification"):
        reply = state["clarification"]
    elif "save_trip" in results:
        r = results["save_trip"]
        # Only claim success when the save tool confirmed the row in the database.
        if r.get("status") == "ok" and r.get("trip_id"):
            where = draft.get("destination") if draft else "your"
            reply = (f"Done! Your {where} trip is saved in My Trips." if r.get("outcome") == "saved"
                     else f"Updated your saved {where} trip in My Trips.")
        else:
            reply = f"I couldn't save the trip: {r.get('message') or 'please try again'} Nothing was saved."
    elif "generate_itinerary" in results or "modify_itinerary" in results or "calculate_budget" in results:
        tool = next(t for t in ("generate_itinerary", "modify_itinerary", "calculate_budget") if t in results)
        r = results[tool]
        if r.get("status") == "ok" and draft:
            verb = {"generate_itinerary": "Here's", "modify_itinerary": "Updated:", "calculate_budget": "Updated budget for"}[tool]
            reply = _plan_reply(draft, notes, verb)
            if tool == "modify_itinerary" and r.get("summary"):
                reply = r["summary"] + " " + reply.replace("Updated: your", "Your", 1)
            if "remember_preferences" in results and results["remember_preferences"].get("status") == "ok":
                reply += " I've also saved your preferences for next time."
            reply += " Want me to save it to My Trips, or change anything?"
        else:
            reply = r.get("message") or "I couldn't finish that plan. Please try again."
    else:
        # Open questions (weather, places, preferences, general travel chat): one grounded LLM answer.
        prompt = answer_prompt(state["message"], state["context_text"], state.get("history") or [], _digest(results))
        try:
            reply = d.llm([{"role": "system", "content": ANSWER_SYSTEM}, {"role": "user", "content": prompt}],
                          max_tokens=450, timeout=min(30, max(5, _remaining(state) - 5)), temperature=0.6,
                          model=ai.OPENROUTER_CHAT_MODEL)
        except ai.AIError as e:
            fallback = [weather_tool.summarise(results["get_weather"])] if "get_weather" in results else []
            if "search_places" in results and results["search_places"].get("places"):
                fallback.append("Places I found: " + ", ".join(p["name"] for p in results["search_places"]["places"][:8]) + ".")
            if "remember_preferences" in results and results["remember_preferences"].get("status") == "ok":
                fallback.append("Got it, I've saved that preference.")
            reply = " ".join(fallback) or ai.user_message(e)
        if notes:
            reply += " " + " ".join(notes)

    if draft and state.get("draft_changed") and "save_trip" not in results:
        pending = {"type": "save_trip", "label": "Save to My Trips"}
    return {"reply": reply.strip(), "pending_action": pending, "suggestions": _suggestions(state, draft)}


# ── 6. persist ──────────────────────────────────────────────────────────────
def persist(state, config):
    d = _deps(config)
    cid = state["conversation_id"]
    memory.add_message(d.db, cid, "user", state["message"])
    meta = {"intent": state.get("intent"), "steps": state.get("steps") or [],
            "pending_action": state.get("pending_action"), "notes": state.get("notes") or []}
    memory.add_message(d.db, cid, "assistant", state.get("reply") or "…", meta)
    if state.get("draft_changed") and state.get("draft"):
        memory.set_draft_itinerary(d.db, state["user_id"], cid, state["draft"])
    return {}
