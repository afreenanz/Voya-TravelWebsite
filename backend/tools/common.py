"""Shared helpers for tools: HTTP with timeouts + a small TTL cache, geo maths."""
import logging
import math
import os
import threading
import time

import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env"))
log = logging.getLogger("voya")

GEOAPIFY_KEY = (os.getenv("GEOAPIFY_API_KEY") or "").strip()
DEFAULT_TIMEOUT_S = 10
# Some free APIs (e.g. Photon) reject the default python-requests User-Agent.
HEADERS = {"User-Agent": "travel-planner-app/1.0 (python-requests)"}


class ToolUnavailable(Exception):
    """An external API failed; message is safe to show (never contains keys)."""


_cache = {}
_cache_lock = threading.Lock()
_CACHE_MAX = 500


def http_get_json(url, params, *, timeout=DEFAULT_TIMEOUT_S, cache_ttl=0, service="external service"):
    """GET → parsed JSON. Raises ToolUnavailable on network/HTTP/JSON errors.
    Successful responses are cached for cache_ttl seconds (per warm instance) to
    save free-tier quota when the agent repeats a lookup."""
    key = (url, tuple(sorted((k, str(v)) for k, v in params.items())))
    now = time.monotonic()
    if cache_ttl:
        with _cache_lock:
            hit = _cache.get(key)
            if hit and hit[0] > now:
                return hit[1]
    try:
        res = requests.get(url, params=params, timeout=timeout, headers=HEADERS)
    except requests.Timeout:
        raise ToolUnavailable(f"{service} did not respond in time")
    except requests.RequestException as e:
        raise ToolUnavailable(f"{service} could not be reached ({e.__class__.__name__})")
    if res.status_code != 200:
        log.warning("%s HTTP %s: %s", service, res.status_code, res.text[:200])
        raise ToolUnavailable(f"{service} returned an error (HTTP {res.status_code})")
    try:
        data = res.json()
    except ValueError:
        raise ToolUnavailable(f"{service} returned an unreadable response")
    if cache_ttl:
        with _cache_lock:
            if len(_cache) >= _CACHE_MAX:
                _cache.clear()
            _cache[key] = (now + cache_ttl, data)
    return data


def haversine_km(lat1, lon1, lat2, lon2):
    """Straight-line distance in km (NOT travel distance — label it approximate)."""
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(a)), 1)
