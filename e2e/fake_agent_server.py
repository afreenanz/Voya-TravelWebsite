"""Local Voya server for UI end-to-end tests: real DB, real Geoapify + Open-Meteo tools,
real save/confirm — only the LLM is replaced by a rule-based stand-in (no AI quota used).
usage (from the repo root): python e2e/fake_agent_server.py  → http://127.0.0.1:5002"""
import json
import os
import re
import sys
from datetime import date, timedelta

sys.path.insert(0, os.getcwd())
from backend import app as voya  # noqa: E402
from backend.agent import nodes, service  # noqa: E402
from backend.agent.prompts import UNDERSTAND_SYSTEM  # noqa: E402
from backend.tools import itinerary  # noqa: E402

GOA_SPOTS = ["Baga Beach", "Fort Aguada", "Chapora Fort", "Anjuna Flea Market", "Basilica of Bom Jesus", "Calangute Beach",
             "Dudhsagar Falls", "Palolem Beach", "Fontainhas", "Candolim Beach"]


def rule_llm(messages, **kw):
    system, prompt = messages[0]["content"], messages[-1]["content"]
    if system != UNDERSTAND_SYSTEM:
        return "Goa is warm and dry from November to February — great beach weather. (test answer)"
    msg = prompt.rsplit("NEW MESSAGE", 1)[1].split("TOOLS", 1)[0].strip().lower()
    has_draft = "CURRENT DRAFT ITINERARY IN THIS CONVERSATION\nNone yet." not in prompt
    soon = date.today() + timedelta(days=3)
    if "save" in msg:
        return json.dumps({"intent": "save_trip", "tools": ["save_trip"], "trip": {}})
    if has_draft and ("hectic" in msg or "relax" in msg):
        return json.dumps({"intent": "modify_itinerary", "tools": ["modify_itinerary"], "trip": {}, "instruction": msg})
    if "prefer" in msg or "i like" in msg:
        likes = [w for w in ("beaches", "cafes", "museums", "adventure") if w in msg]
        return json.dumps({"intent": "update_preferences", "tools": ["remember_preferences"], "trip": {},
                           "remember": {"interests": likes}})
    if "weather" in msg:
        return json.dumps({"intent": "check_weather", "tools": ["get_weather"],
                           "trip": {"destination": "Goa", "start_date": soon.isoformat(), "end_date": (soon + timedelta(days=2)).isoformat()}})
    m = re.search(r"(\d+)\s*days? in ([a-z ]+?)(?: from| for|$|,)", msg)
    if m:
        return json.dumps({"intent": "plan_trip", "tools": ["search_places", "get_weather", "generate_itinerary"],
                           "trip": {"destination": m.group(2).strip().title(), "start_date": soon.isoformat(),
                                    "duration_days": int(m.group(1)), "budget": "₹40,000", "travelers": 2}})
    return json.dumps({"intent": "general", "tools": [], "trip": {}})


def fake_itinerary_ai(messages, **kw):
    n = int(re.search(r"Exactly (\d+) day objects", messages[-1]["content"]).group(1))
    act = lambda name, cat, cost, t: {"time": t, "name": name, "location": "North Goa", "category": cat, "icon": "camera",
                                      "description": f"Visit {name}.", "duration_minutes": 90, "estimated_cost": cost, "tip": "Go early."}
    days = [{"day": i, "title": f"{GOA_SPOTS[(2 * i) % 10]} & {GOA_SPOTS[(2 * i + 1) % 10]}", "theme": "Beaches",
             "activities": [act(GOA_SPOTS[(2 * i) % 10], "beach", 0, "09:00"), act(GOA_SPOTS[(2 * i + 1) % 10], "culture", 500, "14:00")]}
            for i in range(1, n + 1)]
    return json.dumps({"cities": "North Goa · Panaji", "days": days,
                       "cost_estimates": {"accommodation": 15000, "food": 8000, "activities": 3000, "local_transport": 2500, "misc": 1500}})


def fake_modify_ai(messages, **kw):
    day = {"day": 2, "title": "Slow beach day", "theme": "Relax",
           "activities": [{"time": "10:00", "name": "Candolim Beach", "category": "beach", "estimated_cost": 0},
                          {"time": "16:00", "name": "Fontainhas", "category": "culture", "estimated_cost": 0}]}
    return json.dumps({"changed_days": [day], "summary": "Made day 2 a slow beach day."})


original = service.run_turn


def run_turn(*a, **k):
    deps = nodes.Deps(db=None, llm=rule_llm,
                      generate_itinerary=lambda **kw: itinerary.generate_itinerary(**kw, ai_call=fake_itinerary_ai),
                      modify_itinerary=lambda d, instr, **kw: itinerary.modify_itinerary(d, instr, ai_call=fake_modify_ai, **kw))
    return original(*a, **{**k, "deps": deps})


service.run_turn = run_turn
voya.app.run(host="127.0.0.1", port=5002, threaded=True)
