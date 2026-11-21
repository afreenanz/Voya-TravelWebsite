"""Graph state and the tool/step vocabulary shared with the frontend."""
from typing import Any, Optional, TypedDict

INTENTS = ("plan_trip", "modify_itinerary", "check_weather", "find_places", "budget",
           "save_trip", "update_preferences", "general")

TOOLS = ("remember_preferences", "search_places", "get_weather", "generate_itinerary",
         "modify_itinerary", "calculate_budget", "save_trip")
# Execution order when several tools run in one turn (dependencies flow downwards).
TOOL_ORDER = {name: i for i, name in enumerate(TOOLS)}

STEP_LABELS = {
    "understand":           "Understanding your request…",
    "remember_preferences": "Remembering your preferences…",
    "search_places":        "Searching destinations…",
    "get_weather":          "Checking weather…",
    "generate_itinerary":   "Building your itinerary…",
    "modify_itinerary":     "Updating your itinerary…",
    "calculate_budget":     "Calculating your budget…",
    "save_trip":            "Saving your trip…",
}


class AgentState(TypedDict, total=False):
    # inputs
    user_id: str
    email: str
    message: str
    conversation_id: str
    today: str                      # YYYY-MM-DD (injectable for tests)
    deadline: float                 # time.monotonic() budget for the whole turn
    # loaded context
    context: dict                   # build_user_context() result
    context_text: str
    history: list                   # recent [{role, content}]
    draft: Optional[dict]           # itinerary being planned in this conversation
    # understanding
    intent: str
    plan: dict                      # validated LLM plan (trip details, tools, …)
    tools: list
    clarification: str
    notes: list                     # assumptions to tell the user (e.g. tentative dates)
    # execution
    steps: list                     # [{tool, label, status, ms, detail}]
    results: dict                   # tool name → result
    draft_changed: bool
    # output
    reply: str
    suggestions: list
    pending_action: Optional[dict]
    error: str
    extra: Any
