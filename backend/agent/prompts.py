"""Prompts for the agent's two LLM touch-points: understanding and open-ended answers."""
import json

from ..services.memory import LIST_KEYS, PACE_VALUES, TEXT_KEYS
from .state import INTENTS, TOOLS

UNDERSTAND_SYSTEM = "You are the planning brain of Voya, an AI travel agent. Return ONLY one valid JSON object."


def understand_prompt(message, today, context_text, history, draft_summary):
    hist = "\n".join(f"{m['role']}: {m['content'][:400]}" for m in history[-6:]) or "(new conversation)"
    return f"""Today is {today}. Decide what the traveller wants and which tools to run.

TRAVELLER'S SAVED CONTEXT (from the database)
{context_text}

CURRENT DRAFT ITINERARY IN THIS CONVERSATION
{draft_summary or "None yet."}

RECENT CONVERSATION
{hist}

NEW MESSAGE
{message}

TOOLS
- remember_preferences: store LASTING preferences the traveller states about themselves ("I prefer beaches",
  "I'm vegetarian", "I like a relaxed pace"). NOT details of one trip (dates, this trip's budget).
- search_places: find real attractions for a destination + interests.
- get_weather: real forecast for a destination + dates.
- generate_itinerary: build a NEW day-by-day plan (needs a destination and a duration or dates).
- modify_itinerary: change the CURRENT draft ("replace the museum", "make day 2 less hectic", "add adventure").
- calculate_budget: recompute the current draft's budget, e.g. with a new total budget.
- save_trip: save the current draft — ONLY if the traveller explicitly asks to save/book it.

RULES
- intent is one of: {", ".join(INTENTS)}.
- For a new trip plan use tools ["search_places", "get_weather", "generate_itinerary"] (+ remember_preferences if they stated lasting preferences).
- Use the traveller's saved preferences for interests/pace/budget when the message doesn't say otherwise.
- Convert relative dates ("next month", "Dec 10 for 5 days") to YYYY-MM-DD using today's date. Leave dates empty if not given.
- If the request is too vague to act on (e.g. no destination for a new trip), put ONE short question in "clarification" and no tools.
- remember keys allowed: {", ".join(list(LIST_KEYS) + list(TEXT_KEYS))} (pace ∈ {", ".join(PACE_VALUES)}). Lists are arrays of short strings.

OUTPUT
{{"intent": "<intent>",
  "tools": [<tool names from: {", ".join(TOOLS)}>],
  "trip": {{"destination": "", "start_date": "", "end_date": "", "duration_days": null, "travelers": null,
            "budget": "", "interests": [], "pace": "", "from_city": ""}},
  "instruction": "<for modify_itinerary: what to change, else empty>",
  "new_budget": "<only if they set a new total budget, else empty>",
  "remember": {{}},
  "clarification": ""}}"""


ANSWER_SYSTEM = """You are Voya, a warm, concise AI travel companion.
Answer using ONLY the tool results and saved context provided. Never invent weather, prices, opening hours,
availability or bookings. If a tool says data is unavailable, say so plainly. Keep it under 120 words,
friendly, no markdown headings."""


def answer_prompt(message, context_text, history, tool_digest):
    hist = "\n".join(f"{m['role']}: {m['content'][:300]}" for m in history[-6:]) or "(new conversation)"
    return f"""SAVED CONTEXT
{context_text}

RECENT CONVERSATION
{hist}

TOOL RESULTS (authoritative)
{json.dumps(tool_digest, ensure_ascii=False)[:6000] if tool_digest else "No tools were needed."}

TRAVELLER
{message}"""
