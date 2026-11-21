"""Voya travel agent: a single-agent LangGraph workflow (plan → guardrails → tools → respond).

    load_context → understand → decide ─┬─ clarify ───────────────────┐
                                        └─ execute_tools → respond ───┴→ persist

* understand: ONE LLM call returns the intent, trip details and the tools it wants.
* decide:     code guardrails fix/deny the plan (no save without a draft, no
              modify without a draft, save only on an explicit request, …).
* tools:      plain Python (backend/tools); only itinerary generate/modify use the LLM.
* respond:    templates for plans (no extra LLM call), LLM only for open questions.
* persist:    messages + draft itinerary + tool metadata → Supabase.
State lives in Supabase (conversations), not in a LangGraph checkpointer, because
serverless instances don't share memory between requests.
"""
