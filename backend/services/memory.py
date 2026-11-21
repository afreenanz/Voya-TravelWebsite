"""Agent memory: persistent travel preferences + conversation history (Supabase).

Every function takes the Supabase client and the *verified* user's id from the
caller, and every query is filtered by that user id — a user can never read or
change another user's memory, even with a guessed conversation id.

Persistent vs temporary:
  * user_preferences  — long-lived tastes (interests, pace, diet …). Allow-listed
                         keys only, so the agent can't store arbitrary personal data.
  * conversations      — one thread with the agent; `draft_itinerary` holds the
                         trip currently being planned (dates, this trip's budget).
"""
import uuid
from datetime import datetime, timezone

# ── Preferences schema ──────────────────────────────────────────────────────
# list keys: short free-text items; text keys: one short value.
LIST_KEYS = {
    "destinations":  "Preferred destinations",
    "interests":     "Travel interests",
    "activities":    "Preferred activities",
    "accommodation": "Accommodation preferences",
    "dietary":       "Dietary preferences",
}
TEXT_KEYS = {
    "budget": "Budget preference",
    "pace":   "Travel pace",
}
PACE_VALUES = ("relaxed", "balanced", "packed")
MAX_ITEMS = 15
MAX_ITEM_LEN = 60
ALL_KEYS = tuple(LIST_KEYS) + tuple(TEXT_KEYS)


class MemoryInputError(ValueError):
    """Invalid preference / conversation input (message is safe to show users)."""


def _now():
    return datetime.now(timezone.utc).isoformat()


def _clean_list(key, value):
    if isinstance(value, str):
        value = [value]
    if not isinstance(value, list):
        raise MemoryInputError(f"{LIST_KEYS[key]} must be a list.")
    out, seen = [], set()
    for item in value:
        if not isinstance(item, str):
            raise MemoryInputError(f"{LIST_KEYS[key]} must be a list of text.")
        item = " ".join(item.split())
        if not item:
            continue
        if len(item) > MAX_ITEM_LEN:
            raise MemoryInputError(f"Each item in {LIST_KEYS[key]} must be at most {MAX_ITEM_LEN} characters.")
        if item.lower() not in seen:
            seen.add(item.lower())
            out.append(item)
    if len(out) > MAX_ITEMS:
        raise MemoryInputError(f"{LIST_KEYS[key]} can have at most {MAX_ITEMS} items.")
    return out


def _clean_text(key, value):
    if value is None:
        return ""
    if not isinstance(value, str):
        raise MemoryInputError(f"{TEXT_KEYS[key]} must be text.")
    value = " ".join(value.split())
    if len(value) > MAX_ITEM_LEN:
        raise MemoryInputError(f"{TEXT_KEYS[key]} must be at most {MAX_ITEM_LEN} characters.")
    if key == "pace" and value and value.lower() not in PACE_VALUES:
        raise MemoryInputError(f"Travel pace must be one of: {', '.join(PACE_VALUES)}.")
    return value.lower() if key == "pace" else value


def clean_preferences(raw):
    """Validate a preferences object. Unknown keys are rejected; empty values dropped."""
    if not isinstance(raw, dict):
        raise MemoryInputError("Preferences must be an object.")
    unknown = sorted(set(raw) - set(ALL_KEYS))
    if unknown:
        raise MemoryInputError(f"Unknown preference: {unknown[0]}.")
    out = {}
    for key, value in raw.items():
        cleaned = _clean_list(key, value) if key in LIST_KEYS else _clean_text(key, value)
        if cleaned:
            out[key] = cleaned
    return out


# ── Preferences storage ─────────────────────────────────────────────────────
def get_preferences(client, user_id):
    """Return (preferences dict, updated_at or None)."""
    res = (client.table("user_preferences").select("preferences,updated_at")
           .eq("user_id", user_id).limit(1).execute())
    if not res.data:
        return {}, None
    row = res.data[0]
    # Re-validate on read so a bad row can never reach the prompt or the UI.
    try:
        prefs = clean_preferences(row.get("preferences") or {})
    except MemoryInputError:
        prefs = {k: v for k, v in (row.get("preferences") or {}).items() if k in ALL_KEYS}
    return prefs, row.get("updated_at")


def save_preferences(client, user_id, prefs):
    """Replace the user's preferences with an already-cleaned dict."""
    row = {"user_id": user_id, "preferences": prefs, "updated_at": _now()}
    client.table("user_preferences").upsert(row, on_conflict="user_id").execute()
    return prefs


def merge_preferences(client, user_id, updates):
    """Add to the user's preferences (used when the agent learns something).
    Lists are unioned (existing order kept), text values are replaced."""
    updates = clean_preferences(updates)
    current, _ = get_preferences(client, user_id)
    merged = dict(current)
    for key, value in updates.items():
        if key in LIST_KEYS:
            merged[key] = _clean_list(key, (current.get(key) or []) + value)
        else:
            merged[key] = value
    return save_preferences(client, user_id, merged)


def delete_preference(client, user_id, key):
    if key not in ALL_KEYS:
        raise MemoryInputError(f"Unknown preference: {key}.")
    current, _ = get_preferences(client, user_id)
    current.pop(key, None)
    return save_preferences(client, user_id, current)


def clear_preferences(client, user_id):
    client.table("user_preferences").delete().eq("user_id", user_id).execute()


# ── Conversations ───────────────────────────────────────────────────────────
def _valid_uuid(value):
    try:
        return str(uuid.UUID(str(value)))
    except (ValueError, TypeError):
        return None


def _title_from(text):
    text = " ".join((text or "").split())
    return (text[:57] + "…") if len(text) > 60 else (text or "New conversation")


def create_conversation(client, user_id, first_message=""):
    res = client.table("conversations").insert(
        {"user_id": user_id, "title": _title_from(first_message)}).execute()
    return res.data[0]


def list_conversations(client, user_id, limit=30):
    res = (client.table("conversations").select("id,title,created_at,updated_at")
           .eq("user_id", user_id).order("updated_at", desc=True).limit(limit).execute())
    return res.data or []


def get_conversation(client, user_id, conversation_id):
    """The conversation row if it exists AND belongs to user_id, else None."""
    cid = _valid_uuid(conversation_id)
    if not cid:
        return None
    res = (client.table("conversations").select("*")
           .eq("id", cid).eq("user_id", user_id).limit(1).execute())
    return res.data[0] if res.data else None


def get_messages(client, conversation_id, limit=40):
    """The latest `limit` messages, oldest first. Caller must check ownership first."""
    res = (client.table("conversation_messages")
           .select("id,role,content,tool_metadata,created_at")
           .eq("conversation_id", conversation_id).order("id", desc=True).limit(limit).execute())
    return list(reversed(res.data or []))


def add_message(client, conversation_id, role, content, tool_metadata=None):
    if role not in ("user", "assistant"):
        raise MemoryInputError("Invalid message role.")
    content = (content or "").strip()
    if not content:
        raise MemoryInputError("Message is empty.")
    row = {"conversation_id": conversation_id, "role": role, "content": content[:8000]}
    if tool_metadata is not None:
        row["tool_metadata"] = tool_metadata
    res = client.table("conversation_messages").insert(row).execute()
    client.table("conversations").update({"updated_at": _now()}).eq("id", conversation_id).execute()
    return res.data[0]


def set_draft_itinerary(client, user_id, conversation_id, itinerary):
    client.table("conversations").update({"draft_itinerary": itinerary, "updated_at": _now()}) \
        .eq("id", conversation_id).eq("user_id", user_id).execute()


def delete_conversation(client, user_id, conversation_id):
    """Delete if owned by user_id. Returns True if something was deleted."""
    if not get_conversation(client, user_id, conversation_id):
        return False
    client.table("conversations").delete().eq("id", conversation_id).eq("user_id", user_id).execute()
    return True


# ── Context for the agent ───────────────────────────────────────────────────
def build_user_context(client, user_id, email):
    """Everything the agent should know about this user, read fresh from the DB."""
    prefs, _ = get_preferences(client, user_id)
    profile_res = (client.table("users").select("full_name,name,home_airport,preferred_budget,travel_style")
                   .eq("id", user_id).limit(1).execute())
    profile = profile_res.data[0] if profile_res.data else {}
    trips_res = (client.table("trips").select("destination,status,start_date,end_date,days")
                 .eq("user_email", email).order("created_at", desc=True).limit(5).execute())
    return {
        "name": profile.get("full_name") or profile.get("name") or "",
        "home_airport": profile.get("home_airport") or "",
        "profile_budget": profile.get("preferred_budget") or "",
        "profile_style": profile.get("travel_style") or "",
        "preferences": prefs,
        "recent_trips": trips_res.data or [],
    }


def context_to_prompt(ctx):
    """Compact plain-text summary of the user context for the system prompt."""
    lines = []
    if ctx.get("name"):
        lines.append(f"Traveller's name: {ctx['name']}")
    if ctx.get("home_airport"):
        lines.append(f"Home airport: {ctx['home_airport']}")
    if ctx.get("profile_budget"):
        lines.append(f"Usual budget (profile): {ctx['profile_budget']}")
    if ctx.get("profile_style"):
        lines.append(f"Travel style (profile): {ctx['profile_style']}")
    prefs = ctx.get("preferences") or {}
    for key, label in {**LIST_KEYS, **TEXT_KEYS}.items():
        value = prefs.get(key)
        if value:
            lines.append(f"{label}: {', '.join(value) if isinstance(value, list) else value}")
    trips = ctx.get("recent_trips") or []
    if trips:
        lines.append("Previous trips: " + "; ".join(
            f"{t.get('destination')} ({t.get('status')}, {t.get('start_date') or '?'})" for t in trips))
    return "\n".join(lines) if lines else "No saved preferences or previous trips yet."
