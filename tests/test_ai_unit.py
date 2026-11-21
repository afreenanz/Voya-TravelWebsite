"""Unit tests for the OpenRouter call (no network: requests.post is faked)."""
import pytest

from backend import app as voya


class FakeResponse:
    def __init__(self, status=200, content="ok", model=None):
        self.status_code = status
        self._json = {"choices": [{"message": {"content": content}}], "model": model}
        self.text = str(self._json)

    def json(self):
        return self._json


@pytest.fixture
def captured(monkeypatch):
    calls = []

    def fake_post(url, headers=None, json=None, timeout=None):
        calls.append(json)
        return FakeResponse()

    monkeypatch.setattr(voya, "OPENROUTER_KEY", "test-key")
    monkeypatch.setattr(voya.requests, "post", fake_post)
    return calls


def test_itinerary_calls_use_main_model_first_with_fallbacks(captured):
    voya.call_openrouter([{"role": "user", "content": "hi"}], max_tokens=10, timeout=5, json_mode=True)
    p = captured[0]
    assert p["model"] == voya.OPENROUTER_MODEL
    assert p["models"][0] == voya.OPENROUTER_MODEL and len(p["models"]) <= 3
    assert len(set(p["models"])) == len(p["models"])          # no duplicates
    assert p["reasoning"] == {"enabled": False}
    assert p["response_format"] == {"type": "json_object"}


def test_chat_calls_use_chat_model_first(captured):
    voya.call_openrouter([{"role": "user", "content": "hi"}], max_tokens=10, timeout=5,
                         model=voya.OPENROUTER_CHAT_MODEL)
    p = captured[0]
    assert p["models"][0] == voya.OPENROUTER_CHAT_MODEL
    assert voya.OPENROUTER_MODEL in p["models"]                # main model is a fallback for chat
    assert "response_format" not in p


@pytest.mark.parametrize("response, error", [
    (FakeResponse(status=429), "http 429"),
    (FakeResponse(content="   "), "empty response"),
])
def test_ai_errors_are_reported(monkeypatch, response, error):
    monkeypatch.setattr(voya, "OPENROUTER_KEY", "test-key")
    monkeypatch.setattr(voya.requests, "post", lambda *a, **k: response)
    with pytest.raises(voya.AIError, match=error):
        voya.call_openrouter([{"role": "user", "content": "hi"}], max_tokens=10, timeout=5)


def test_validate_itinerary_enforces_day_count():
    day = {"title": "D", "activities": [{"time": "09:00", "name": "Beach"}]}
    data = {"days": [day] * 6, "cost_breakdown": {"total": "₹50,000"}}
    assert len(voya.validate_itinerary(data, "Goa", "₹50,000", "", num_days=5)["days"]) == 5   # extra trimmed
    with pytest.raises(ValueError, match="only 6 of 7 days"):
        voya.validate_itinerary(data, "Goa", "₹50,000", "", num_days=7)                       # missing → retry
