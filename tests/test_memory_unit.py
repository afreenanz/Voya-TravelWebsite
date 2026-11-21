"""Unit tests for preference validation and context formatting (no network)."""
import pytest

from backend.services import memory as m


def test_clean_preferences_normalises_and_dedupes():
    out = m.clean_preferences({
        "interests": ["  Beaches ", "beaches", "Cafes", ""],
        "pace": "Relaxed",
        "budget": "  mid-range  ",
        "dietary": "vegetarian",          # single string is accepted as a 1-item list
        "activities": [],                 # empty values are dropped
    })
    assert out == {"interests": ["Beaches", "Cafes"], "pace": "relaxed",
                   "budget": "mid-range", "dietary": ["vegetarian"]}


@pytest.mark.parametrize("bad, message", [
    ({"passport_number": "X123"}, "Unknown preference"),       # not allow-listed → never stored
    ({"pace": "very fast"}, "Travel pace must be one of"),
    ({"interests": [1, 2]}, "must be a list of text"),
    ({"interests": ["x" * 61]}, "at most 60 characters"),
    ({"interests": [f"i{n}" for n in range(16)]}, "at most 15 items"),
    ({"budget": 5000}, "must be text"),
    ("not an object", "must be an object"),
])
def test_clean_preferences_rejects_invalid(bad, message):
    with pytest.raises(m.MemoryInputError, match=message):
        m.clean_preferences(bad)


def test_context_to_prompt_includes_preferences_and_trips():
    text = m.context_to_prompt({
        "name": "Asha", "home_airport": "BLR", "profile_budget": "", "profile_style": "Cultural",
        "preferences": {"interests": ["beaches", "cafes"], "pace": "relaxed"},
        "recent_trips": [{"destination": "Japan", "status": "upcoming", "start_date": "2026-12-17"}],
    })
    assert "Home airport: BLR" in text
    assert "Travel interests: beaches, cafes" in text
    assert "Travel pace: relaxed" in text
    assert "Japan (upcoming, 2026-12-17)" in text


def test_context_to_prompt_empty():
    assert m.context_to_prompt({}) == "No saved preferences or previous trips yet."


def test_conversation_title_is_trimmed():
    assert m._title_from("  Plan a   trip to Bali ") == "Plan a trip to Bali"
    assert len(m._title_from("x" * 200)) == 58 and m._title_from("x" * 200).endswith("…")
    assert m._title_from("") == "New conversation"
