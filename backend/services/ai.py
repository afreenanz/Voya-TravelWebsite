"""OpenRouter client shared by the chat endpoint, the itinerary tools and the agent.

Free models are unreliable in different ways (rate limits, hangs, empty answers
from hidden reasoning), so every call:
  * sends up to 3 models — OpenRouter falls back automatically on errors,
  * disables hidden reasoning (faster, never eats the token budget),
  * raises AIError with a short machine-readable reason the caller can act on.
"""
import json
import logging
import os

import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))
log = logging.getLogger("voya")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_KEY = (os.getenv("OPENROUTER_API_KEY") or "").strip()
# Itineraries (long structured JSON) try OPENROUTER_MODEL first; short chat
# replies try the faster OPENROUTER_CHAT_MODEL first. Each falls back to the rest.
OPENROUTER_MODEL = (os.getenv("OPENROUTER_MODEL") or "nvidia/nemotron-3-ultra-550b-a55b:free").strip()
OPENROUTER_CHAT_MODEL = (os.getenv("OPENROUTER_CHAT_MODEL") or "nvidia/nemotron-3.5-super-vl:free").strip()
OPENROUTER_FALLBACK_MODELS = [m.strip() for m in (
    os.getenv("OPENROUTER_FALLBACK_MODELS") or "google/gemma-4-31b-it:free").split(",") if m.strip()]
AI_MODEL_POOL = list(dict.fromkeys([OPENROUTER_MODEL, OPENROUTER_CHAT_MODEL, *OPENROUTER_FALLBACK_MODELS]))
APP_BASE_URL = (os.getenv("APP_BASE_URL") or "").strip().rstrip("/")


class AIError(Exception):
    """reason is one of: not configured, timeout, network: …, http <code>, malformed response, empty response"""


def call_openrouter(messages, *, max_tokens, timeout, json_mode=False, temperature=0.8, model=None):
    if not OPENROUTER_KEY:
        log.error("Missing environment variable: OPENROUTER_API_KEY")
        raise AIError("not configured")
    primary = model or OPENROUTER_MODEL
    payload = {
        "model": primary,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        # Hidden reasoning can eat the whole token budget (empty answer) and doubles latency.
        "reasoning": {"enabled": False},
    }
    models = [primary, *[m for m in AI_MODEL_POOL if m != primary]][:3]
    if len(models) > 1:
        payload["models"] = models
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    try:
        res = requests.post(
            OPENROUTER_URL,
            headers={
                "Authorization": f"Bearer {OPENROUTER_KEY}",
                "Content-Type": "application/json",
                "X-Title": "Voya",
                **({"HTTP-Referer": APP_BASE_URL} if APP_BASE_URL else {}),
            },
            json=payload,
            timeout=timeout,
        )
    except requests.Timeout:
        raise AIError("timeout")
    except requests.RequestException as e:
        raise AIError(f"network: {e.__class__.__name__}")
    if res.status_code != 200:
        log.warning("OpenRouter HTTP %s: %s", res.status_code, res.text[:300])
        if res.status_code == 429 and "per-day" in res.text:
            raise AIError("daily limit")  # free tier: 50 requests/day per account
        raise AIError(f"http {res.status_code}")
    try:
        data = res.json()
        content = data["choices"][0]["message"]["content"]
    except (ValueError, KeyError, IndexError, TypeError):
        raise AIError("malformed response")
    if data.get("model") and data["model"] != primary:
        log.info("OpenRouter answered with fallback model %s", data["model"])
    if not content or not content.strip():
        raise AIError("empty response")
    return content.strip()


def user_message(err):
    """Friendly, honest text for an AIError."""
    reason = str(err)
    if reason == "daily limit":
        return "Voya AI has reached today's free usage limit. Please try again tomorrow."
    if reason == "timeout":
        return "Voya AI took too long to respond. Please try again."
    if reason == "not configured":
        return "Voya AI isn't configured on this server yet."
    return "Voya AI is busy right now. Please try again in a moment."


def parse_json(raw):
    """Extract the JSON object from a model reply (tolerates ``` fences / chatter)."""
    raw = (raw or "").strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[-1]
        raw = raw.rsplit("```", 1)[0]
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("no JSON object found")
    return json.loads(raw[start:end + 1])
