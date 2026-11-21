"""Tool B — Weather: real daily forecasts from Open-Meteo (free, no key).

Forecasts only exist up to FORECAST_DAYS ahead. Dates outside that window are
reported as unavailable — this tool never estimates or invents weather.
"""
from datetime import datetime, timedelta, timezone

from .common import ToolUnavailable, http_get_json
from .geo import resolve_destination

FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
SOURCE = "Open-Meteo forecast"
FORECAST_DAYS = 16  # today + 15 days

# WMO weather interpretation codes → short description
WMO = {0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Fog",
       51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 56: "Freezing drizzle", 57: "Freezing drizzle",
       61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain",
       71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains", 80: "Rain showers",
       81: "Rain showers", 82: "Violent rain showers", 85: "Snow showers", 86: "Heavy snow showers",
       95: "Thunderstorm", 96: "Thunderstorm with hail", 99: "Thunderstorm with hail"}


def _parse(d):
    return datetime.strptime(d, "%Y-%m-%d").date()


def get_weather(destination, start_date, end_date, *, dest=None, today=None):
    """→ {"status": "ok"|"partial"|"unavailable"|"error", "days": [...], "source", "message"?}
    dest: an already-resolved destination (skips a geocoding call)."""
    try:
        start, end = _parse(start_date), _parse(end_date)
    except (TypeError, ValueError):
        return {"status": "error", "message": "Dates must be YYYY-MM-DD.", "days": [], "source": SOURCE}
    if end < start:
        return {"status": "error", "message": "End date is before start date.", "days": [], "source": SOURCE}

    today = today or datetime.now(timezone.utc).date()
    last = today + timedelta(days=FORECAST_DAYS - 1)
    lo, hi = max(start, today), min(end, last)
    window = {"forecast_available_until": last.isoformat()}
    if lo > hi:
        when = "already over" if end < today else f"more than {FORECAST_DAYS} days away"
        return {"status": "unavailable", "days": [], "source": SOURCE, **window,
                "message": (f"No forecast yet: these dates are {when}. Forecasts are available up to "
                            f"{last.isoformat()}. Voya won't guess the weather.")}

    try:
        dest = dest or resolve_destination(destination)
        data = http_get_json(FORECAST_URL, {
            "latitude": dest["lat"], "longitude": dest["lon"], "timezone": "auto",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
            "start_date": lo.isoformat(), "end_date": hi.isoformat(),
        }, cache_ttl=3 * 3600, service="Weather service")
    except ToolUnavailable as e:
        return {"status": "unavailable", "days": [], "source": SOURCE, "message": f"Weather is unavailable right now: {e}."}

    daily = data.get("daily") or {}
    days = []
    for i, d in enumerate(daily.get("time") or []):
        def val(key):
            arr = daily.get(key) or []
            return arr[i] if i < len(arr) else None
        code = val("weather_code")
        days.append({
            "date": d,
            "summary": WMO.get(code, "Unknown"),
            "temp_max_c": val("temperature_2m_max"),
            "temp_min_c": val("temperature_2m_min"),
            "rain_chance_pct": val("precipitation_probability_max"),
        })
    if not days:
        return {"status": "unavailable", "days": [], "source": SOURCE, "message": "The weather service returned no data."}

    covered = (lo, hi) == (start, end)
    result = {"status": "ok" if covered else "partial", "location": dest.get("formatted"), "days": days,
              "source": SOURCE, "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"), **window}
    if not covered:
        result["message"] = (f"Forecast covers {lo.isoformat()} to {hi.isoformat()} only; "
                             "the other trip dates are outside the forecast window.")
    return result


def summarise(weather):
    """One line per day for prompts/UI, or the honest 'unavailable' message."""
    if weather.get("status") not in ("ok", "partial"):
        return weather.get("message") or "Weather unavailable."
    lines = [f"{d['date']}: {d['summary']}, {d['temp_min_c']}–{d['temp_max_c']}°C, rain chance {d['rain_chance_pct']}%"
             for d in weather["days"]]
    if weather.get("message"):
        lines.append(weather["message"])
    return "\n".join(lines)


