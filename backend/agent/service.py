"""Entry points used by the Flask routes: run one agent turn, or confirm a pending save."""
import logging
import time
from datetime import datetime, timezone

from ..services import memory, trips
from .graph import build_graph
from .nodes import Deps

log = logging.getLogger("voya")
TURN_BUDGET_S = 110          # Vercel maxDuration is 120s
MAX_MESSAGE_LEN = 2000


class AgentInputError(ValueError):
    pass


class ConversationNotFound(LookupError):
    pass


def _payload(conversation_id, state):
    draft = state.get("draft")
    return {
        "conversation_id": conversation_id,
        "reply": state.get("reply") or "",
        "intent": state.get("intent") or "general",
        "steps": state.get("steps") or [],
        "itinerary": draft,
        "itinerary_changed": bool(state.get("draft_changed")),
        "pending_action": state.get("pending_action"),
        "suggestions": state.get("suggestions") or [],
        "notes": state.get("notes") or [],
    }


def run_turn(db, user_id, email, message, conversation_id=None, *, emit=None, today=None, deps=None):
    """Run one agent turn end-to-end and persist it. Returns the response payload."""
    message = " ".join((message or "").split())
    if not message:
        raise AgentInputError("Message is empty.")
    if len(message) > MAX_MESSAGE_LEN:
        raise AgentInputError(f"Message must be at most {MAX_MESSAGE_LEN} characters.")
    if conversation_id:
        conv = memory.get_conversation(db, user_id, conversation_id)
        if not conv:
            raise ConversationNotFound()
    else:
        conv = memory.create_conversation(db, user_id, message)
    if emit:
        emit({"type": "conversation", "conversation_id": conv["id"]})

    deps = deps or Deps(db=db)
    deps.db, deps.emit = db, emit
    state = {
        "user_id": user_id, "email": email, "message": message, "conversation_id": conv["id"],
        "today": today or datetime.now(timezone.utc).date().isoformat(),
        "deadline": time.monotonic() + TURN_BUDGET_S,
    }
    final = build_graph().invoke(state, config={"configurable": {"deps": deps}})
    return _payload(conv["id"], final)


def confirm_save(db, user_id, email, conversation_id):
    """The traveller pressed 'Save to My Trips': save the draft (no LLM involved)."""
    conv = memory.get_conversation(db, user_id, conversation_id)
    if not conv:
        raise ConversationNotFound()
    draft = conv.get("draft_itinerary")
    if not draft:
        raise AgentInputError("There's no itinerary in this conversation to save.")
    saved = trips.save_itinerary(db, email, draft)   # raises TripError → nothing claimed
    draft = {**draft, "saved_trip_id": saved["trip_id"]}
    memory.set_draft_itinerary(db, user_id, conversation_id, draft)
    reply = (f"Done! Your {draft.get('destination')} trip is saved in My Trips." if saved["status"] == "saved"
             else f"Updated your saved {draft.get('destination')} trip in My Trips.")
    step = {"tool": "save_trip", "label": "Saving your trip…", "status": "done",
            "detail": "Saved to My Trips" if saved["status"] == "saved" else "Updated in My Trips"}
    memory.add_message(db, conversation_id, "assistant", reply, {"intent": "save_trip", "steps": [step]})
    return {"conversation_id": conversation_id, "reply": reply, "steps": [step], "trip_id": saved["trip_id"],
            "outcome": saved["status"], "itinerary": draft, "pending_action": None}
