"""Agent tests: LangGraph workflow with a scripted fake LLM + fake external tools,
running against the real Supabase project (memory, drafts, saves are real)."""
import json

import pytest

from backend.agent import nodes, service
from backend.agent.prompts import ANSWER_SYSTEM, UNDERSTAND_SYSTEM
from backend.services import ai, memory, trips
from backend.tools import itinerary

TODAY = "2026-11-21"


# ── fakes ───────────────────────────────────────────────────────────────────
class FakeLLM:
    """Returns scripted plans for 'understand' calls and a fixed text for answers."""

    def __init__(self, *plans, answer="Here's what I found.", error=None):
        self.plans, self.answer, self.error = list(plans), answer, error
        self.understand_prompts, self.answer_prompts = [], []

    def __call__(self, messages, **kw):
        if self.error:
            raise ai.AIError(self.error)
        system, prompt = messages[0]["content"], messages[-1]["content"]
        if system == UNDERSTAND_SYSTEM:
            self.understand_prompts.append(prompt)
            return json.dumps(self.plans.pop(0))
        assert system == ANSWER_SYSTEM
        self.answer_prompts.append(prompt)
        return self.answer


def plan(intent, tools, **trip):
    extra = {k: trip.pop(k) for k in ("instruction", "new_budget", "remember", "clarification") if k in trip}
    return {"intent": intent, "tools": tools, "trip": trip, **extra}


def _fake_ai_itinerary(n_days):
    act = lambda name, cat, cost: {"time": "10:00", "name": name, "location": "Area", "category": cat, "icon": "camera",
                                   "description": name, "duration_minutes": 60, "estimated_cost": cost, "tip": ""}
    return json.dumps({"cities": "Ubud · Seminyak",
                       "days": [{"day": i, "title": f"Day {i}", "activities": [act(f"Beach {i}", "beach", 0), act(f"Cafe {i}", "food", 900)]}
                                for i in range(1, n_days + 1)],
                       "cost_estimates": {"accommodation": 20000, "food": 9000, "activities": 6000, "local_transport": 3000, "misc": 2000}})


class Recorder:
    """Fake tools that record what the agent passed them."""

    def __init__(self, places_error=False):
        self.calls, self.places_error = [], places_error

    def search_places(self, destination, interests, limit=12):
        self.calls.append(("search_places", destination, list(interests)))
        if self.places_error:
            raise RuntimeError("boom")
        return {"status": "ok", "destination": {"name": destination, "lat": 1, "lon": 2, "country_code": "id"},
                "places": [{"name": "Tanah Lot Temple", "category": "Sight", "lat": 1, "lon": 2}]}

    def get_weather(self, destination, start, end, dest=None):
        self.calls.append(("get_weather", destination, start, end))
        return {"status": "unavailable", "days": [], "source": "Open-Meteo forecast",
                "message": "No forecast yet: these dates are more than 16 days away. Voya won't guess the weather."}

    def generate_itinerary(self, **kw):
        self.calls.append(("generate_itinerary", kw["destination"], kw["start_date"], kw["end_date"], kw["interests"], kw["pace"]))
        n = (int(kw["end_date"][-2:]) - int(kw["start_date"][-2:])) + 1
        return itinerary.generate_itinerary(**{k: v for k, v in kw.items() if k not in ("dest", "time_budget_s")},
                                            ai_call=lambda *a, **k: _fake_ai_itinerary(n), verify=False)

    def modify_itinerary(self, draft, instruction, new_budget=None, **kw):
        self.calls.append(("modify_itinerary", instruction, new_budget))
        if not instruction:
            return itinerary.modify_itinerary(draft, "", new_budget=new_budget, verify=False)
        new_day = {"day": 2, "title": "Slow day", "activities": [{"name": "Sanur Beach", "category": "beach", "estimated_cost": 0}]}
        return itinerary.modify_itinerary(draft, instruction, verify=False,
                                          ai_call=lambda *a, **k: json.dumps({"changed_days": [new_day], "summary": "Made day 2 slower."}))


def deps_for(llm, rec):
    return nodes.Deps(db=None, llm=llm, search_places=rec.search_places, get_weather=rec.get_weather,
                      generate_itinerary=rec.generate_itinerary, modify_itinerary=rec.modify_itinerary)


def turn(db, user, message, llm, rec, conversation_id=None, events=None):
    return service.run_turn(db, user["id"], user["email"], message, conversation_id, today=TODAY,
                            deps=deps_for(llm, rec), emit=(events.append if events is not None else None))


BALI = dict(destination="Bali", duration_days=5, budget="₹60,000", interests=["beaches", "cafes", "adventure"])


# ── the brief's example workflow ────────────────────────────────────────────
@pytest.mark.integration
def test_plan_trip_end_to_end_with_memory_and_confirmation(db, make_user):
    u, rec, events = make_user("Asha"), Recorder(), []
    llm = FakeLLM(plan("plan_trip", ["search_places", "get_weather", "generate_itinerary"], **BALI,
                       remember={"interests": ["beaches", "cafes"], "activities": ["adventure activities"]}))
    r = turn(db, u, "Plan a five-day trip to Bali under ₹60,000. I like beaches, cafes and adventure activities.", llm, rec, events=events)

    # tools: chosen by the LLM, ordered + completed by the guardrails
    assert [s["tool"] for s in r["steps"]] == ["understand", "remember_preferences", "search_places", "get_weather", "generate_itinerary"]
    assert all(s["status"] in ("done", "unavailable") for s in r["steps"])
    assert [e["tool"] for e in events if e.get("type") == "step" and e["status"] == "running"][:3] == \
        ["understand", "remember_preferences", "search_places"]                       # streamed live, in order
    # no dates given → tentative dates, clearly told to the user
    assert rec.calls[2][2:4] == ("2026-12-21", "2026-12-25")
    assert "tentative dates" in r["reply"] and "2 travellers" in r["reply"]
    # budget computed in code: 20k+9k+6k+3k+2k = ₹40,000 of ₹60,000
    assert "Estimated cost: ₹40,000 of your ₹60,000 budget (₹20,000 left)" in r["reply"]
    assert "No forecast yet" in r["reply"]                                             # weather never invented
    # human-in-the-loop: offered, NOT saved
    assert r["pending_action"] == {"type": "save_trip", "label": "Save to My Trips"}
    assert db.table("trips").select("id").eq("user_email", u["email"]).execute().data == []
    # persistence: preferences, messages, draft
    assert memory.get_preferences(db, u["id"])[0]["interests"] == ["beaches", "cafes"]
    msgs = memory.get_messages(db, r["conversation_id"])
    assert [m["role"] for m in msgs] == ["user", "assistant"] and msgs[1]["tool_metadata"]["intent"] == "plan_trip"
    assert memory.get_conversation(db, u["id"], r["conversation_id"])["draft_itinerary"]["destination"] == "Bali"
    # cost: exactly ONE LLM call for this turn (plus the itinerary call inside the tool)
    assert len(llm.understand_prompts) == 1 and llm.answer_prompts == []

    # confirm → saved for real; confirming again updates instead of duplicating
    c1 = service.confirm_save(db, u["id"], u["email"], r["conversation_id"])
    c2 = service.confirm_save(db, u["id"], u["email"], r["conversation_id"])
    assert c1["outcome"] == "saved" and c2["outcome"] == "updated" and c1["trip_id"] == c2["trip_id"]
    assert "saved in My Trips" in c1["reply"]
    assert len(db.table("trips").select("id").eq("user_email", u["email"]).execute().data) == 1


@pytest.mark.integration
def test_new_conversation_uses_remembered_preferences(db, make_user):
    u, rec = make_user(), Recorder()
    memory.save_preferences(db, u["id"], {"interests": ["beaches", "cafes"], "pace": "relaxed"})
    llm = FakeLLM(plan("plan_trip", ["generate_itinerary"], destination="Goa", start_date="2026-12-10", end_date="2026-12-12"))
    r = turn(db, u, "Plan another trip for me, Goa Dec 10-12", llm, rec)
    gen = next(c for c in rec.calls if c[0] == "generate_itinerary")
    assert gen[4] == ["beaches", "cafes"] and gen[5] == "relaxed"                   # from the DB, not the chat
    assert "Travel interests: beaches, cafes" in llm.understand_prompts[0]           # context retrieved from DB
    assert ("search_places", "Goa", ["beaches", "cafes"]) in rec.calls                # guardrail added grounding tools
    assert "tentative" not in r["reply"]


@pytest.mark.integration
def test_modify_then_explicit_save_in_conversation(db, make_user):
    u, rec = make_user(), Recorder()
    llm = FakeLLM(plan("plan_trip", ["generate_itinerary"], destination="Bali", start_date="2026-12-10", end_date="2026-12-12"),
                  plan("modify_itinerary", ["modify_itinerary", "save_trip"], instruction="make day two less hectic"),
                  plan("save_trip", ["save_trip"]))
    r1 = turn(db, u, "3 days in Bali from Dec 10", llm, rec)
    r2 = turn(db, u, "Make day two less hectic", llm, rec, r1["conversation_id"])
    assert "Day 1: Day 1; Day 2: Day 2" in llm.understand_prompts[1]                  # draft given back to the model
    assert [s["tool"] for s in r2["steps"]] == ["understand", "modify_itinerary"]     # save dropped: not asked for
    assert r2["itinerary"]["days"][1]["title"] == "Slow day" and r2["itinerary"]["days"][0]["title"] == "Day 1"
    assert r2["reply"].startswith("Made day 2 slower.") and r2["pending_action"]
    assert db.table("trips").select("id").eq("user_email", u["email"]).execute().data == []

    r3 = turn(db, u, "Looks good, save it to my trips", llm, rec, r1["conversation_id"])
    rows = db.table("trips").select("id,itinerary_json").eq("user_email", u["email"]).execute().data
    assert len(rows) == 1 and rows[0]["itinerary_json"]["days"][1]["title"] == "Slow day"
    assert r3["reply"] == "Done! Your Bali trip is saved in My Trips." and r3["pending_action"] is None


@pytest.mark.integration
def test_failed_save_is_never_claimed(db, make_user, monkeypatch):
    u, rec = make_user(), Recorder()
    llm = FakeLLM(plan("plan_trip", ["generate_itinerary"], destination="Bali", start_date="2026-12-10", end_date="2026-12-11"),
                  plan("save_trip", ["save_trip"]))
    r1 = turn(db, u, "2 days in Bali", llm, rec)

    def broken(*a, **k):
        raise trips.TripError("The database didn't confirm the save.")
    monkeypatch.setattr(trips, "save_itinerary", broken)
    r2 = turn(db, u, "save it", llm, rec, r1["conversation_id"])
    assert r2["reply"].startswith("I couldn't save the trip") and "Nothing was saved" in r2["reply"]
    assert r2["steps"][-1]["status"] == "error"


@pytest.mark.integration
def test_tool_failure_does_not_break_the_turn(db, make_user):
    u, rec = make_user(), Recorder(places_error=True)
    llm = FakeLLM(plan("plan_trip", ["search_places", "generate_itinerary"], destination="Bali",
                       start_date="2026-12-10", end_date="2026-12-11"))
    r = turn(db, u, "2 days in Bali", llm, rec)
    status = {s["tool"]: s["status"] for s in r["steps"]}
    assert status["search_places"] == "error" and status["generate_itinerary"] == "done"
    assert r["itinerary"] and r["pending_action"]


@pytest.mark.integration
def test_open_question_uses_one_grounded_answer(db, make_user):
    u, rec = make_user(), Recorder()
    llm = FakeLLM(plan("check_weather", ["get_weather"], destination="Goa", start_date="2026-12-10", end_date="2026-12-12"),
                  answer="No forecast is available yet for those dates.")
    r = turn(db, u, "What's the weather in Goa Dec 10-12?", llm, rec)
    assert r["reply"] == "No forecast is available yet for those dates."
    assert "Voya won't guess the weather" in llm.answer_prompts[0]                    # answer grounded in the tool result
    assert r["pending_action"] is None and r["itinerary"] is None


@pytest.mark.integration
@pytest.mark.parametrize("p, message, expected", [
    (plan("plan_trip", [], clarification="Where would you like to go?"), "Plan me a trip", "Where would you like to go?"),
    (plan("plan_trip", ["generate_itinerary"], destination="Bali"), "Bali please", "How many days would you like in Bali"),
    (plan("plan_trip", ["generate_itinerary"], destination="Bali", start_date="2026-01-01", end_date="2026-01-03"), "Bali in Jan", "in the past"),
    (plan("plan_trip", ["generate_itinerary"], destination="Bali", start_date="2026-12-01", end_date="2026-12-30"), "a month in Bali", "up to 14 days"),
    (plan("modify_itinerary", ["modify_itinerary"], instruction="swap museum"), "replace the museum", "no trip plan in this conversation"),
    (plan("save_trip", ["save_trip"]), "save my trip", "no trip plan in this conversation"),
])
def test_guardrails_ask_instead_of_guessing(db, make_user, p, message, expected):
    u, rec = make_user(), Recorder()
    r = turn(db, u, message, FakeLLM(p), rec)
    assert expected in r["reply"] and rec.calls == [] and r["pending_action"] is None
    assert [s["tool"] for s in r["steps"]] == ["understand"]


@pytest.mark.integration
def test_ai_daily_limit_is_reported_honestly(db, make_user):
    u, rec = make_user(), Recorder()
    r = turn(db, u, "Plan Bali", FakeLLM(error="daily limit"), rec)
    assert "today's free usage limit" in r["reply"] and rec.calls == []
    assert memory.get_messages(db, r["conversation_id"])[-1]["content"] == r["reply"]


@pytest.mark.integration
def test_conversations_are_private(db, make_user):
    a, b, rec = make_user("A"), make_user("B"), Recorder()
    r = turn(db, a, "Plan Bali", FakeLLM(plan("general", [])), rec)
    with pytest.raises(service.ConversationNotFound):
        turn(db, b, "hi", FakeLLM(plan("general", [])), rec, r["conversation_id"])
    with pytest.raises(service.ConversationNotFound):
        service.confirm_save(db, b["id"], b["email"], r["conversation_id"])


# ── API layer ───────────────────────────────────────────────────────────────
@pytest.fixture
def fake_agent(monkeypatch):
    """Route the real endpoints through the fake LLM/tools."""
    llm, rec = FakeLLM(plan("plan_trip", ["generate_itinerary"], destination="Bali", start_date="2026-12-10",
                            end_date="2026-12-11")), Recorder()
    original = service.run_turn
    monkeypatch.setattr(service, "run_turn", lambda *a, **k: original(*a, **{**k, "deps": deps_for(llm, rec), "today": TODAY}))
    return llm


@pytest.mark.parametrize("path", ["/api/agent/chat", "/api/agent/stream", "/api/agent/confirm"])
def test_agent_endpoints_require_login(client, path):
    assert client.post(path, json={"message": "hi", "conversation_id": "x", "action": "save_trip"}).status_code == 401


@pytest.mark.integration
def test_agent_chat_and_confirm_endpoints(client, make_user, fake_agent):
    u = make_user()
    assert client.post("/api/agent/chat", headers=u["headers"], json={"message": "  "}).status_code == 400
    r = client.post("/api/agent/chat", headers=u["headers"], json={"message": "2 days in Bali"})
    assert r.status_code == 200 and r.json["itinerary"]["destination"] == "Bali" and r.json["pending_action"]
    cid = r.json["conversation_id"]
    assert client.post("/api/agent/confirm", headers=u["headers"], json={"conversation_id": cid, "action": "delete_all"}).status_code == 400
    c = client.post("/api/agent/confirm", headers=u["headers"], json={"conversation_id": cid, "action": "save_trip"})
    assert c.status_code == 200 and c.json["outcome"] == "saved"
    assert len(client.get("/api/get-trips", headers=u["headers"]).json["trips"]) == 1
    other = make_user()
    assert client.post("/api/agent/chat", headers=other["headers"], json={"message": "hi", "conversation_id": cid}).status_code == 404


@pytest.mark.integration
def test_agent_stream_sends_steps_then_result(client, make_user, fake_agent):
    u = make_user()
    r = client.post("/api/agent/stream", headers=u["headers"], json={"message": "2 days in Bali"})
    assert r.status_code == 200 and r.mimetype == "text/event-stream"
    events = [json.loads(line[6:]) for line in r.get_data(as_text=True).splitlines() if line.startswith("data: ")]
    types = [e["type"] for e in events]
    assert types[0] == "conversation" and types[-1] == "result" and "step" in types
    assert events[-1]["itinerary"]["destination"] == "Bali"
