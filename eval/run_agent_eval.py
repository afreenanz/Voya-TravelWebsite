"""Evaluate the Voya agent against eval/agent_cases.json with the REAL LLM.

Default ("plan" mode, 1 LLM call per case): runs understand + decide (the agent's
decision-making) and scores intent accuracy, tool selection, parameter extraction,
clarification behaviour and latency.

--full N additionally runs N complete planning turns (tools + itinerary, ~2 LLM
calls each) and scores task completion and constraint satisfaction (exact day
count, budget calculated, places verified).

OpenRouter's free tier allows 50 requests/day, so the default run (~20 calls)
fits in a day's quota. Usage:  python eval/run_agent_eval.py [--full 3] [--only id,id]
"""
import argparse
import json
import os
import statistics
import sys
import time
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from backend.agent import nodes  # noqa: E402
from backend.services import memory  # noqa: E402
from backend.tools import budget  # noqa: E402

TODAY = "2026-11-21"
SAMPLE_DRAFT = {"destination": "Bali", "start_date": "2026-12-10", "end_date": "2026-12-12", "travelers": 2,
                "budget": "₹60,000", "days": [{"day": 1, "title": "Arrival & Seminyak beaches"},
                                              {"day": 2, "title": "Ubud: Monkey Forest, Bali Museum, rice terraces"},
                                              {"day": 3, "title": "Uluwatu temple & departure"}],
                "budget_summary": {"total_formatted": "₹52,000"}}


class NoDB:
    pass


def decide_for(case):
    prefs = case.get("prefs") or {}
    ctx = {"preferences": prefs}
    state = {"message": case["message"], "today": TODAY, "deadline": time.monotonic() + 100,
             "context": ctx, "context_text": memory.context_to_prompt(ctx), "history": [],
             "draft": SAMPLE_DRAFT if case.get("draft") else None, "steps": []}
    deps = nodes.Deps(db=NoDB())
    config = {"configurable": {"deps": deps}}
    t0 = time.monotonic()
    state.update(nodes.understand(state, config))
    latency = time.monotonic() - t0
    state.update(nodes.decide(state, config))
    return state, latency


def score(case, state):
    exp, got_tools = case["expect"], state.get("tools") or []
    plan, checks = state.get("plan") or {}, {}
    trip = plan.get("trip") or {}
    if state.get("error"):
        return {"error": state["error"]}
    if "intent" in exp:
        checks["intent"] = plan.get("intent") == exp["intent"]
    if "clarify" in exp:
        checks["clarify"] = bool(state.get("clarification")) == exp["clarify"]
    if "tools" in exp:
        checks["tools"] = sorted(got_tools) == sorted(exp["tools"])
    if "tools_any" in exp:
        checks["tools"] = any(t in got_tools for t in exp["tools_any"])
    if "tools_exclude" in exp:
        checks["tools_exclude"] = not any(t in got_tools for t in exp["tools_exclude"])
    for key, want in (exp.get("trip") or {}).items():
        if key == "budget_amount":
            try:
                checks["budget"] = budget.parse_amount(trip.get("budget"))[0] == want
            except budget.BudgetError:
                checks["budget"] = False
        elif key == "destination":
            checks["destination"] = want in (trip.get("destination") or "").lower()
        else:
            checks[key] = trip.get(key) == want
    if "new_budget_amount" in exp:
        try:
            checks["new_budget"] = budget.parse_amount(plan.get("new_budget"))[0] == exp["new_budget_amount"]
        except budget.BudgetError:
            checks["new_budget"] = False
    return checks


def full_turns(n):
    """Complete planning turns with real tools; checks constraints on the result."""
    from backend.agent import nodes as N
    rows = []
    cases = [("Goa", "2026-12-10", "2026-12-12", "₹30,000"), ("Bali", "2026-12-14", "2026-12-18", "₹60,000"),
             ("Paris", "2027-01-05", "2027-01-08", "€1,500")][:n]
    for dest, s, e, b in cases:
        t0 = time.monotonic()
        state = {"message": f"Plan {dest} from {s} to {e}, budget {b}", "today": TODAY, "deadline": time.monotonic() + 110,
                 "context": {}, "context_text": "", "history": [], "draft": None, "steps": [], "user_id": "eval", "email": "eval@example.com"}
        cfg = {"configurable": {"deps": N.Deps(db=NoDB())}}
        for node in (N.understand, N.decide):
            state.update(node(state, cfg))
        if "remember_preferences" in (state.get("tools") or []):
            state["tools"].remove("remember_preferences")  # no DB in eval
        state.update(N.execute_tools(state, cfg))
        draft, secs = state.get("draft"), time.monotonic() - t0
        want_days = (date.fromisoformat(e) - date.fromisoformat(s)).days + 1
        ok = bool(draft)
        rows.append({
            "case": dest, "completed": ok, "seconds": round(secs, 1),
            "exact_days": ok and len(draft["days"]) == want_days,
            "budget_by_code": ok and draft.get("budget_summary", {}).get("total") == sum(
                c["amount"] for c in draft["budget_summary"]["categories"]),
            "within_budget": ok and not draft["budget_summary"].get("over_budget"),
            "verified_pct": round(100 * draft["verification"]["verified"] / max(1, draft["verification"]["total"])) if ok else 0,
            "steps": [(x["tool"], x["status"]) for x in state.get("steps", [])],
        })
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--full", type=int, default=0)
    ap.add_argument("--only", default="")
    args = ap.parse_args()
    cases = json.load(open(os.path.join(ROOT, "eval", "agent_cases.json")))
    if args.only:
        cases = [c for c in cases if c["id"] in args.only.split(",")]

    results, latencies = [], []
    for case in cases:
        state, latency = decide_for(case)
        checks = score(case, state)
        latencies.append(latency)
        passed = "error" not in checks and all(checks.values())
        results.append((case["id"], passed, checks))
        print(f"{'PASS' if passed else 'FAIL'}  {case['id']:18} {latency:5.1f}s  intent={state.get('intent')} "
              f"tools={state.get('tools')} {'' if passed else checks}", flush=True)
        if "error" in checks and "free usage limit" in checks["error"]:
            print("Stopping: free daily AI limit reached.")
            break

    by_check = {}
    for _, _, checks in results:
        for k, v in checks.items():
            if k != "error":
                by_check.setdefault(k, []).append(v)
    print("\n── Decision-making ─────────────────────────────")
    print(f"cases passed:      {sum(p for _, p, _ in results)}/{len(results)}")
    for k, vals in sorted(by_check.items()):
        print(f"{k + ' accuracy:':18} {sum(vals)}/{len(vals)} ({100 * sum(vals) / len(vals):.0f}%)")
    if latencies:
        print(f"understand latency: p50 {statistics.median(latencies):.1f}s · max {max(latencies):.1f}s")
    if args.full:
        print("\n── Full planning turns ─────────────────────────")
        for row in full_turns(args.full):
            print(json.dumps(row, ensure_ascii=False))


if __name__ == "__main__":
    main()
