"""Unit tests for the OpenRouter call (no network: requests.post is faked)."""
import pytest

from backend.services import ai


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

    monkeypatch.setattr(ai, "OPENROUTER_KEY", "test-key")
    monkeypatch.setattr(ai.requests, "post", fake_post)
    return calls


def test_itinerary_calls_use_main_model_first_with_fallbacks(captured):
    ai.call_openrouter([{"role": "user", "content": "hi"}], max_tokens=10, timeout=5, json_mode=True)
    p = captured[0]
    assert p["model"] == ai.OPENROUTER_MODEL
    assert p["models"][0] == ai.OPENROUTER_MODEL and len(p["models"]) <= 3
    assert len(set(p["models"])) == len(p["models"])          # no duplicates
    assert p["reasoning"] == {"enabled": False}
    assert p["response_format"] == {"type": "json_object"}


def test_chat_calls_use_chat_model_first(captured):
    ai.call_openrouter([{"role": "user", "content": "hi"}], max_tokens=10, timeout=5,
                         model=ai.OPENROUTER_CHAT_MODEL)
    p = captured[0]
    assert p["models"][0] == ai.OPENROUTER_CHAT_MODEL
    assert ai.OPENROUTER_MODEL in p["models"]                # main model is a fallback for chat
    assert "response_format" not in p


@pytest.mark.parametrize("response, error", [
    (FakeResponse(status=429), "http 429"),
    (FakeResponse(content="   "), "empty response"),
])
def test_ai_errors_are_reported(monkeypatch, response, error):
    monkeypatch.setattr(ai, "OPENROUTER_KEY", "test-key")
    monkeypatch.setattr(ai.requests, "post", lambda *a, **k: response)
    with pytest.raises(ai.AIError, match=error):
        ai.call_openrouter([{"role": "user", "content": "hi"}], max_tokens=10, timeout=5)
