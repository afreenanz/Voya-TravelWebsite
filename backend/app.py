"""Voya — Flask backend.

Serves the static frontend (landing, auth, app) and the JSON API under /api.
Auth: every user-scoped endpoint requires `Authorization: Bearer <session token>`
issued by this server (HS256, signed with APP_SECRET_KEY). The user's email is
taken from the verified token only — never from the request body or query.
"""
import hashlib
import json
import logging
import mimetypes
import os
import queue
import re
import threading
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from functools import wraps
from urllib.parse import urlencode

import jwt
from dotenv import load_dotenv
from flask import Flask, Response, g, jsonify, redirect, request, send_from_directory
from supabase import ClientOptions, create_client
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash

if __package__ in (None, ""):  # `python backend/app.py`: make `backend.*` importable
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.services import memory  # noqa: E402
from backend.services import trips as trips_service  # noqa: E402
from backend.services.trips import DEFAULT_GRADIENT  # noqa: E402
from backend.agent import service as agent_service  # noqa: E402
from backend.tools import geo as geo_tool  # noqa: E402
from backend.tools import itinerary as itinerary_tool  # noqa: E402
from backend.tools import places as places_tool  # noqa: E402
from backend.tools import weather as weather_tool  # noqa: E402
from backend.services.ai import AIError, OPENROUTER_CHAT_MODEL, call_openrouter, user_message  # noqa: E402

mimetypes.add_type("application/javascript", ".jsx")

# ── Paths & config ──────────────────────────────────────────────────────────
BACKEND_DIR  = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
LANDING_DIR  = os.path.join(FRONTEND_DIR, "landing")
AUTH_DIR     = os.path.join(FRONTEND_DIR, "auth")
APP_DIR      = os.path.join(FRONTEND_DIR, "app")
SHARED_DIR   = os.path.join(FRONTEND_DIR, "shared")

load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

SUPABASE_URL      = re.sub(r"/rest/v1/?$", "", (os.getenv("SUPABASE_URL") or "").strip().rstrip("/"))
SUPABASE_KEY      = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or "").strip()
APP_SECRET_KEY    = (os.getenv("APP_SECRET_KEY") or "").strip()
APP_BASE_URL      = (os.getenv("APP_BASE_URL") or "").strip().rstrip("/")

TOKEN_TTL         = timedelta(days=7)
TOKEN_ISSUER      = "voya"

# Vercel maxDuration for the function is 120s (vercel.json). Keep the whole
# AI budget below that so we always answer before the platform kills us.
# Free models can take 60-90s for a full itinerary, so one attempt may use most
# of the budget; the retry only runs if at least 15s remain.
AI_TOTAL_BUDGET_S = 110
CHAT_TIMEOUT_S    = 30
MAX_TRIP_DAYS     = 14

VALID_STATUSES = {"planning", "upcoming", "completed", "wishlist"}
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")
DATE_RE  = re.compile(r"^\d{4}-\d{2}-\d{2}$")

ALLOWED_AVATAR_TYPES = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif"}
MAX_AVATAR_BYTES = 2 * 1024 * 1024

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = 4 * 1024 * 1024  # Vercel caps request bodies at 4.5 MB
app.json.sort_keys = False
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("voya")


# ── Errors ──────────────────────────────────────────────────────────────────
class ApiError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def ok(**data):
    return jsonify({"success": True, **data})


def _is_api():
    return request.path.startswith("/api/") or request.path == "/api"


@app.errorhandler(ApiError)
def _handle_api_error(e):
    return jsonify({"success": False, "error": e.message}), e.status


@app.errorhandler(HTTPException)
def _handle_http(e):
    if _is_api():
        messages = {
            404: "Not found.",
            405: "Method not allowed.",
            413: "That upload is too large.",
            400: "Bad request.",
        }
        return jsonify({"success": False, "error": messages.get(e.code, e.name)}), e.code
    if e.code == 404:
        return send_from_directory(FRONTEND_DIR, "404.html"), 404
    return e


@app.errorhandler(Exception)
def _handle_unexpected(e):
    log.exception("Unhandled error on %s %s", request.method, request.path)
    if _is_api():
        return jsonify({"success": False, "error": "Something went wrong on our side. Please try again."}), 500
    return "Something went wrong. Please try again.", 500


@app.after_request
def _security_headers(resp):
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    if _is_api():
        resp.headers["Cache-Control"] = "no-store"
    elif resp.mimetype in ("text/html", "application/javascript", "text/css"):
        # Always revalidate so new deploys show up immediately (ETag keeps it cheap).
        resp.headers["Cache-Control"] = "no-cache"
    return resp


# ── Clients ─────────────────────────────────────────────────────────────────
_db_client = None
_db_lock = threading.Lock()


def _require_config(*pairs):
    missing = [name for name, value in pairs if not value]
    if missing:
        log.error("Missing environment variables: %s", ", ".join(missing))
        raise ApiError("The server is not configured yet. Please try again later.", 503)


def _new_client():
    _require_config(("SUPABASE_URL", SUPABASE_URL), ("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY))
    return create_client(
        SUPABASE_URL,
        SUPABASE_KEY,
        # Implicit flow: email links and Google return an access token in the URL
        # hash to /auth/callback. PKCE would need the code verifier to survive
        # between requests, which serverless instances don't guarantee.
        options=ClientOptions(persist_session=False, auto_refresh_token=False, flow_type="implicit"),
    )


def db():
    """Shared service-role client, used ONLY for table/storage queries.

    Never call auth methods that sign a user in (verify_otp, sign_in_*) on this
    client: supabase-py would swap its Authorization header to that user's
    token, and every later query on this warm instance would run as them.
    """
    global _db_client
    if _db_client is None:
        with _db_lock:
            if _db_client is None:
                _db_client = _new_client()
    return _db_client


def auth_client():
    """Throwaway client for Supabase Auth calls (OTP, token verification)."""
    return _new_client()


# ── Session tokens ──────────────────────────────────────────────────────────
def _secret():
    _require_config(("APP_SECRET_KEY", APP_SECRET_KEY))
    return APP_SECRET_KEY


def issue_token(email, name):
    now = datetime.now(timezone.utc)
    payload = {"sub": email, "name": name or "", "iss": TOKEN_ISSUER, "iat": now, "exp": now + TOKEN_TTL}
    return jwt.encode(payload, _secret(), algorithm="HS256")


def session_response(user):
    email = user["email"]
    name = user.get("full_name") or user.get("name") or email.split("@")[0]
    return ok(token=issue_token(email, name), user={"name": name, "email": email})


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            raise ApiError("Please log in to continue.", 401)
        token = header[7:].strip()
        try:
            payload = jwt.decode(
                token, _secret(), algorithms=["HS256"], issuer=TOKEN_ISSUER,
                options={"require": ["sub", "exp", "iat", "iss"]},
            )
        except jwt.ExpiredSignatureError:
            raise ApiError("Your session has expired. Please log in again.", 401)
        except jwt.InvalidTokenError:
            raise ApiError("Please log in to continue.", 401)
        g.email = payload["sub"].lower()
        return fn(*args, **kwargs)
    return wrapper


# ── Rate limiting ───────────────────────────────────────────────────────────
# In-memory sliding window per user. On Vercel each function instance has its
# own memory and instances are recycled, so this is a best-effort brake against
# accidental hammering, not a hard global quota. A global limit would need a
# shared store (e.g. a Supabase table or Redis).
_RATE = {"generate": (4, 60), "agent": (6, 60), "chat": (15, 60), "auth": (10, 60), "lookup": (60, 60)}
_rate_hits = defaultdict(deque)
_rate_lock = threading.Lock()


def rate_limit(bucket, key):
    limit, window = _RATE[bucket]
    now = time.monotonic()
    with _rate_lock:
        hits = _rate_hits[(bucket, key)]
        while hits and now - hits[0] > window:
            hits.popleft()
        if len(hits) >= limit:
            wait = int(window - (now - hits[0])) + 1
            raise ApiError(f"You're going a bit fast. Please wait {wait}s and try again.", 429)
        hits.append(now)


def _client_ip():
    fwd = request.headers.get("X-Forwarded-For", "")
    return fwd.split(",")[0].strip() if fwd else (request.remote_addr or "unknown")


# ── Input helpers ───────────────────────────────────────────────────────────
def body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("Request body must be JSON.", 400)
    return data


def text(data, key, *, required=False, max_len=200, label=None):
    value = data.get(key, "")
    if value is None:
        value = ""
    if not isinstance(value, (str, int, float)):
        raise ApiError(f"{label or key} is invalid.", 400)
    value = str(value).strip()
    if required and not value:
        raise ApiError(f"{label or key} is required.", 400)
    if len(value) > max_len:
        raise ApiError(f"{label or key} must be at most {max_len} characters.", 400)
    return value


def email_field(data):
    email = text(data, "email", required=True, max_len=254, label="Email").lower()
    if not EMAIL_RE.match(email):
        raise ApiError("Please enter a valid email address.", 400)
    return email


def int_field(data, key, *, default, lo, hi, label):
    raw = data.get(key, default)
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise ApiError(f"{label} must be a number.", 400)
    if not lo <= value <= hi:
        raise ApiError(f"{label} must be between {lo} and {hi}.", 400)
    return value


def record_search(email, destination):
    """Recent searches are nice-to-have: never block the request if this fails."""
    try:
        db().table("searches").insert({"user_email": email, "destination": destination[:120]}).execute()
    except Exception as e:
        log.warning("could not record search: %s", e)


def get_user(email, columns="*"):
    res = db().table("users").select(columns).eq("email", email).limit(1).execute()
    return res.data[0] if res.data else None


def ensure_user(email, name="", avatar_url=""):
    """Return the users row for email, creating it for OTP/Google sign-ins."""
    user = get_user(email)
    if user:
        if avatar_url and not user.get("avatar_url"):
            db().table("users").update({"avatar_url": avatar_url}).eq("email", email).execute()
            user["avatar_url"] = avatar_url
        return user
    row = {"email": email, "name": name or email.split("@")[0]}
    if name:
        row["full_name"] = name
    if avatar_url:
        row["avatar_url"] = avatar_url
    try:
        res = db().table("users").insert(row).execute()
        return res.data[0] if res.data else row
    except Exception:
        # Lost a race with a concurrent sign-in: the unique email constraint fired.
        user = get_user(email)
        if user:
            return user
        raise


# ── Static frontend ─────────────────────────────────────────────────────────
def page(directory, filename):
    return send_from_directory(directory, filename, max_age=0)


@app.get("/")
def landing():
    return page(LANDING_DIR, "index.html")


@app.get("/landing/<path:filename>")
def landing_static(filename):
    return send_from_directory(LANDING_DIR, filename)


@app.get("/shared/<path:filename>")
def shared_static(filename):
    return send_from_directory(SHARED_DIR, filename)


@app.get("/favicon.ico")
def favicon():
    return send_from_directory(os.path.join(SHARED_DIR, "assets"), "voya-logo-light.png")


@app.get("/login")
@app.get("/login/")
def login_page():
    return page(AUTH_DIR, "index.html")


APP_PAGES = {
    "": "index.html",
    "plan": "plan.html",
    "trips": "plan.html",
    "explore": "explore.html",
    "profile": "profile.html",
    "settings": "settings.html",
}


@app.get("/app")
@app.get("/app/")
def app_home():
    return page(APP_DIR, "index.html")


@app.get("/app/<path:subpath>")
def app_pages(subpath):
    key = subpath.strip("/")
    if key in APP_PAGES:
        return page(APP_DIR, APP_PAGES[key])
    if key.endswith(".html"):  # only the routed pages above are public entry points
        return send_from_directory(FRONTEND_DIR, "404.html"), 404
    return send_from_directory(APP_DIR, key)


# ── Google OAuth (Supabase, implicit flow) ──────────────────────────────────
def _base_url():
    return APP_BASE_URL or request.host_url.rstrip("/")


@app.get("/auth/google")
def auth_google():
    if not SUPABASE_URL:
        return redirect("/login?error=" + "Google sign-in is not configured.")
    # Implicit flow: Supabase returns the access token in the URL hash, which
    # the callback page posts to /api/auth/oauth. (PKCE would need the code
    # verifier stored server-side, which doesn't survive across serverless
    # instances.)
    params = urlencode({"provider": "google", "redirect_to": _base_url() + "/auth/callback"})
    return redirect(f"{SUPABASE_URL}/auth/v1/authorize?{params}")


@app.get("/auth/callback")
def auth_callback():
    return page(AUTH_DIR, "callback.html")


# ── API: auth ───────────────────────────────────────────────────────────────
@app.post("/api/check-email")
def api_check_email():
    data = body()
    email = email_field(data)
    rate_limit("auth", _client_ip())
    return ok(exists=get_user(email, "id") is not None)


@app.post("/api/signup")
def api_signup():
    data = body()
    name = text(data, "name", required=True, max_len=80, label="Name")
    email = email_field(data)
    password = data.get("password") or ""
    if not isinstance(password, str) or len(password) < 8:
        raise ApiError("Password must be at least 8 characters.", 400)
    if len(password) > 128:
        raise ApiError("Password must be at most 128 characters.", 400)
    rate_limit("auth", _client_ip())

    if get_user(email, "id"):
        raise ApiError("An account with this email already exists. Try logging in.", 409)
    res = db().table("users").insert({
        "name": name,
        "full_name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
    }).execute()
    user = res.data[0] if res.data else {"email": email, "name": name}
    return session_response(user)


@app.post("/api/login-password")
def api_login_password():
    data = body()
    email = email_field(data)
    password = data.get("password") or ""
    if not isinstance(password, str) or not password:
        raise ApiError("Password is required.", 400)
    rate_limit("auth", _client_ip())

    user = get_user(email)
    if not user:
        raise ApiError("Incorrect email or password.", 401)
    if not user.get("password_hash"):
        raise ApiError("This account uses an email code or Google to sign in. Use one of those options.", 401)
    if not check_password_hash(user["password_hash"], password):
        raise ApiError("Incorrect email or password.", 401)
    return session_response(user)


@app.post("/api/send-otp")
def api_send_otp():
    data = body()
    email = email_field(data)
    rate_limit("auth", _client_ip())
    try:
        auth_client().auth.sign_in_with_otp({
            "email": email,
            # The email contains a sign-in link (and a 6-digit code if the
            # Supabase template includes {{ .Token }}). The link lands on
            # /auth/callback, which exchanges it for a Voya session.
            "options": {"email_redirect_to": _base_url() + "/auth/callback"},
        })
    except Exception as e:
        log.warning("send-otp failed: %s", e)
        raise ApiError("We couldn't send a code right now. Please wait a minute and try again.", 502)
    return ok(message="Code sent.")


@app.post("/api/verify-otp")
def api_verify_otp():
    data = body()
    email = email_field(data)
    code = text(data, "code", required=True, max_len=10, label="Code")
    if not re.fullmatch(r"\d{6}", code):
        raise ApiError("Enter the 6-digit code from your email.", 400)
    rate_limit("auth", _client_ip())
    try:
        res = auth_client().auth.verify_otp({"email": email, "token": code, "type": "email"})
    except Exception as e:
        log.info("verify-otp rejected: %s", e)
        raise ApiError("Invalid or expired code. Please try again.", 401)
    if not res or not res.user or (res.user.email or "").lower() != email:
        raise ApiError("Invalid or expired code. Please try again.", 401)
    return session_response(ensure_user(email))


@app.post("/api/auth/oauth")
def api_auth_oauth():
    data = body()
    access_token = text(data, "access_token", required=True, max_len=4096, label="Access token")
    rate_limit("auth", _client_ip())
    try:
        res = auth_client().auth.get_user(access_token)
    except Exception as e:
        log.info("oauth token rejected: %s", e)
        raise ApiError("Sign-in failed. Please try again.", 401)
    sb_user = res.user if res else None
    email = (sb_user.email or "").lower() if sb_user else ""
    if not email:
        raise ApiError("Sign-in failed. Please try again.", 401)
    meta = sb_user.user_metadata or {}
    name = (meta.get("full_name") or meta.get("name") or "").strip()[:80]
    avatar = (meta.get("avatar_url") or meta.get("picture") or "").strip()[:500]
    return session_response(ensure_user(email, name, avatar))


@app.get("/api/me")
@require_auth
def api_me():
    user = get_user(g.email, "email,name,full_name")
    if not user:
        raise ApiError("Account not found. Please log in again.", 401)
    return ok(user={"email": user["email"], "name": user.get("full_name") or user.get("name") or ""})


# ── API: profile ────────────────────────────────────────────────────────────
PROFILE_FIELDS = {
    "full_name": 80, "phone": 30, "home_airport": 60,
    "preferred_budget": 40, "travel_style": 60, "bio": 500,
}


def _profile_out(u):
    return {
        "full_name":        u.get("full_name") or u.get("name") or "",
        "email":            u.get("email") or "",
        "phone":            u.get("phone") or "",
        "home_airport":     u.get("home_airport") or "",
        "preferred_budget": u.get("preferred_budget") or "",
        "travel_style":     u.get("travel_style") or "",
        "bio":              u.get("bio") or "",
        "avatar_url":       u.get("avatar_url") or "",
    }


@app.get("/api/profile")
@require_auth
def api_get_profile():
    user = get_user(g.email)
    if not user:
        raise ApiError("Account not found. Please log in again.", 401)
    return ok(profile=_profile_out(user))


@app.post("/api/profile")
@require_auth
def api_update_profile():
    data = body()
    updates = {k: text(data, k, max_len=n, label=k.replace("_", " ").capitalize())
               for k, n in PROFILE_FIELDS.items() if k in data}
    if "full_name" in updates and not updates["full_name"]:
        raise ApiError("Full name can't be empty.", 400)
    if updates.get("phone") and not re.fullmatch(r"[0-9+\-() ]{6,30}", updates["phone"]):
        raise ApiError("Please enter a valid phone number.", 400)
    if not updates:
        raise ApiError("Nothing to update.", 400)
    if "full_name" in updates:
        updates["name"] = updates["full_name"]
    res = db().table("users").update(updates).eq("email", g.email).execute()
    if not res.data:
        raise ApiError("Account not found. Please log in again.", 401)
    return ok(profile=_profile_out(res.data[0]))


@app.post("/api/upload-avatar")
@require_auth
def api_upload_avatar():
    file = request.files.get("avatar")
    if not file or not file.filename:
        raise ApiError("Please choose an image to upload.", 400)
    ext = ALLOWED_AVATAR_TYPES.get((file.mimetype or "").lower())
    if not ext:
        raise ApiError("Avatar must be a PNG, JPG, WEBP or GIF image.", 400)
    data = file.read(MAX_AVATAR_BYTES + 1)
    if len(data) > MAX_AVATAR_BYTES:
        raise ApiError("Avatar must be 2 MB or smaller.", 400)
    # Hash the email so it doesn't appear in the public URL.
    folder = hashlib.sha256(g.email.encode()).hexdigest()[:32]
    path = f"{folder}/avatar.{ext}"
    bucket = db().storage.from_("avatars")
    try:
        bucket.upload(path, data, {"content-type": file.mimetype, "upsert": "true"})
    except Exception as e:
        log.warning("avatar upload failed: %s", e)
        raise ApiError("Upload failed. Please try again.", 502)
    url = f"{bucket.get_public_url(path).rstrip('?')}?v={int(time.time())}"
    db().table("users").update({"avatar_url": url}).eq("email", g.email).execute()
    return ok(avatar_url=url)


# ── API: trips ──────────────────────────────────────────────────────────────


def _trip_out(row):
    stored = row.get("itinerary_json") or []
    # Older rows stored only the days array; newer rows store {days, cost_breakdown}.
    if isinstance(stored, dict):
        days, cost = stored.get("days") or [], stored.get("cost_breakdown")
        summary, transport = stored.get("budget_summary"), stored.get("transport")
    else:
        days, cost, summary, transport = stored, None, None, None
    return {
        "id":            str(row.get("id", "")),
        "destination":   row.get("destination") or "",
        "cities":        row.get("cities") or row.get("destination") or "",
        "flag":          row.get("flag") or "✈️",
        "budget":        str(row.get("budget") or ""),
        "days":          row.get("days") or len(days),
        "startDate":     row.get("start_date") or "",
        "endDate":       row.get("end_date") or "",
        "travelers":     row.get("travelers") or 1,
        "travelStyle":   row.get("travel_style") or "",
        "status":        row.get("status") or "planning",
        "gradient":      row.get("gradient") or DEFAULT_GRADIENT,
        "itinerary":     days,
        "costBreakdown": cost,
        "budgetSummary": summary,
        "transport":     transport or "",
        "createdAt":     row.get("created_at") or "",
    }


@app.post("/api/save-trip")
@require_auth
def api_save_trip():
    data = body()
    trip = data.get("trip")
    if not isinstance(trip, dict):
        raise ApiError("Trip details are missing.", 400)
    status = text(trip, "status", max_len=20) or "planning"
    if status not in VALID_STATUSES:
        raise ApiError("Invalid trip status.", 400)
    days = trip.get("itinerary") or []
    if not isinstance(days, list) or not days:
        raise ApiError("This trip has no itinerary to save.", 400)
    cost = trip.get("costBreakdown")
    if cost is not None and not isinstance(cost, dict):
        cost = None
    summary = trip.get("budgetSummary") if isinstance(trip.get("budgetSummary"), dict) else None
    transport = text(trip, "transport", max_len=10).lower()
    if transport not in itinerary_tool.TRANSPORT_MODES:
        transport = ""
    if len(json.dumps(days)) > 200_000:
        raise ApiError("This itinerary is too large to save.", 400)

    row = {
        "user_email":     g.email,
        "destination":    text(trip, "destination", required=True, max_len=120, label="Destination"),
        "cities":         text(trip, "cities", max_len=200),
        "flag":           text(trip, "flag", max_len=16) or "✈️",
        "budget":         text(trip, "budget", max_len=40),
        "days":           int_field(trip, "days", default=len(days), lo=1, hi=60, label="Days"),
        "start_date":     text(trip, "startDate", max_len=40) or None,   # column is a date in the live DB
        "end_date":       text(trip, "endDate", max_len=40) or None,
        "travelers":      int_field(trip, "travelers", default=1, lo=1, hi=20, label="Travelers"),
        "travel_style":   text(trip, "travelStyle", max_len=120),
        "status":         status,
        "gradient":       text(trip, "gradient", max_len=200) or DEFAULT_GRADIENT,
        "itinerary_json": {"days": days, "cost_breakdown": cost, "budget_summary": summary, "transport": transport or None},
    }
    res = db().table("trips").insert(row).execute()
    if not res.data:
        raise ApiError("Could not save the trip. Please try again.", 500)
    return ok(trip=_trip_out(res.data[0]))


@app.get("/api/get-trips")
@require_auth
def api_get_trips():
    res = db().table("trips").select("*").eq("user_email", g.email).order("id", desc=True).execute()
    return ok(trips=[_trip_out(r) for r in res.data or []])


@app.patch("/api/update-trip-status/<int:trip_id>")
@require_auth
def api_update_trip_status(trip_id):
    data = body()
    status = text(data, "status", required=True, max_len=20, label="Status")
    if status not in VALID_STATUSES:
        raise ApiError("Invalid trip status.", 400)
    res = (db().table("trips").update({"status": status})
           .eq("id", trip_id).eq("user_email", g.email).execute())
    if not res.data:
        raise ApiError("Trip not found.", 404)
    return ok(trip=_trip_out(res.data[0]))


@app.delete("/api/delete-trip/<int:trip_id>")
@require_auth
def api_delete_trip(trip_id):
    res = db().table("trips").delete().eq("id", trip_id).eq("user_email", g.email).execute()
    if not res.data:
        raise ApiError("Trip not found.", 404)
    return ok()


# ── API: recent searches ────────────────────────────────────────────────────
@app.get("/api/searches")
@require_auth
def api_get_searches():
    res = (db().table("searches").select("id,destination,created_at")
           .eq("user_email", g.email).order("created_at", desc=True).limit(5).execute())
    return ok(searches=res.data or [])


@app.delete("/api/searches")
@require_auth
def api_clear_searches():
    db().table("searches").delete().eq("user_email", g.email).execute()
    return ok()


# ── Agent memory: preferences + conversations (Voya 2.0) ────────────────────
def current_user_id():
    """users.id for the signed-in user (memory tables are keyed by id, not email)."""
    if "user_id" not in g:
        user = get_user(g.email, "id")
        if not user:
            raise ApiError("Please log in to continue.", 401)
        g.user_id = user["id"]
    return g.user_id


@app.get("/api/preferences")
@require_auth
def api_get_preferences():
    prefs, updated_at = memory.get_preferences(db(), current_user_id())
    return ok(preferences=prefs, updated_at=updated_at,
              fields={"lists": memory.LIST_KEYS, "text": memory.TEXT_KEYS, "pace_values": memory.PACE_VALUES})


@app.put("/api/preferences")
@require_auth
def api_put_preferences():
    data = body()
    try:
        prefs = memory.clean_preferences(data.get("preferences"))
    except memory.MemoryInputError as e:
        raise ApiError(str(e), 400)
    return ok(preferences=memory.save_preferences(db(), current_user_id(), prefs))


@app.delete("/api/preferences")
@require_auth
def api_clear_preferences():
    memory.clear_preferences(db(), current_user_id())
    return ok(preferences={})


@app.delete("/api/preferences/<key>")
@require_auth
def api_delete_preference(key):
    try:
        prefs = memory.delete_preference(db(), current_user_id(), key)
    except memory.MemoryInputError as e:
        raise ApiError(str(e), 400)
    return ok(preferences=prefs)


@app.get("/api/memory/context")
@require_auth
def api_memory_context():
    """What the agent knows about the user — shown to them for transparency."""
    ctx = memory.build_user_context(db(), current_user_id(), g.email)
    return ok(context=ctx, summary=memory.context_to_prompt(ctx))


@app.get("/api/conversations")
@require_auth
def api_list_conversations():
    return ok(conversations=memory.list_conversations(db(), current_user_id()))


@app.get("/api/conversations/<conversation_id>")
@require_auth
def api_get_conversation(conversation_id):
    conv = memory.get_conversation(db(), current_user_id(), conversation_id)
    if not conv:
        raise ApiError("Conversation not found.", 404)
    conv.pop("user_id", None)
    return ok(conversation=conv, messages=memory.get_messages(db(), conv["id"]))


@app.delete("/api/conversations/<conversation_id>")
@require_auth
def api_delete_conversation(conversation_id):
    if not memory.delete_conversation(db(), current_user_id(), conversation_id):
        raise ApiError("Conversation not found.", 404)
    return ok()


# ── AI travel agent (Voya 2.0) ──────────────────────────────────────────────
def _agent_input():
    data = body()
    message = text(data, "message", required=True, max_len=agent_service.MAX_MESSAGE_LEN, label="Message")
    conversation_id = text(data, "conversation_id", max_len=64) or None
    rate_limit("agent", g.email)
    return message, conversation_id


@app.post("/api/agent/chat")
@require_auth
def api_agent_chat():
    """One agent turn, returned as a single JSON response."""
    message, conversation_id = _agent_input()
    try:
        result = agent_service.run_turn(db(), current_user_id(), g.email, message, conversation_id)
    except agent_service.ConversationNotFound:
        raise ApiError("Conversation not found.", 404)
    except agent_service.AgentInputError as e:
        raise ApiError(str(e), 400)
    return ok(**result)


@app.post("/api/agent/stream")
@require_auth
def api_agent_stream():
    """Same as /api/agent/chat, streamed as Server-Sent Events:
    {type: conversation|step|result|error, …}. Steps arrive as each tool runs."""
    message, conversation_id = _agent_input()
    user_id, email = current_user_id(), g.email
    if conversation_id and not memory.get_conversation(db(), user_id, conversation_id):
        raise ApiError("Conversation not found.", 404)
    events = queue.Queue()

    def worker():
        try:
            result = agent_service.run_turn(db(), user_id, email, message, conversation_id, emit=events.put)
            events.put({"type": "result", **result})
        except agent_service.AgentInputError as e:
            events.put({"type": "error", "error": str(e)})
        except Exception:
            log.exception("agent stream failed")
            events.put({"type": "error", "error": "Something went wrong on our side. Please try again."})
        finally:
            events.put(None)

    threading.Thread(target=worker, daemon=True).start()

    def generate():
        while True:
            try:
                ev = events.get(timeout=10)
            except queue.Empty:
                yield ": keep-alive\n\n"       # keeps proxies from closing a quiet connection
                continue
            if ev is None:
                return
            yield f"data: {json.dumps(ev, ensure_ascii=False, default=str)}\n\n"

    return Response(generate(), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})


@app.post("/api/agent/confirm")
@require_auth
def api_agent_confirm():
    """Human-in-the-loop: the traveller confirmed saving the conversation's draft trip."""
    data = body()
    conversation_id = text(data, "conversation_id", required=True, max_len=64, label="Conversation")
    if text(data, "action", max_len=40) != "save_trip":
        raise ApiError("Unknown action.", 400)
    rate_limit("chat", g.email)
    try:
        result = agent_service.confirm_save(db(), current_user_id(), g.email, conversation_id)
    except agent_service.ConversationNotFound:
        raise ApiError("Conversation not found.", 404)
    except (agent_service.AgentInputError, trips_service.TripError) as e:
        raise ApiError(str(e), 400)
    return ok(**result)


# ── Place autocomplete (planner fields) ─────────────────────────────────────
def _visitor_location():
    """Approximate visitor location from Vercel's edge headers (None locally)."""
    try:
        return (float(request.headers["x-vercel-ip-latitude"]), float(request.headers["x-vercel-ip-longitude"]))
    except (KeyError, ValueError):
        return None


@app.get("/api/places/autocomplete")
@require_auth
def api_places_autocomplete():
    """Any place worldwide for the Destination / Departing-from fields.
    Proxied so the Geoapify key never reaches the browser."""
    q = (request.args.get("q") or "").strip()[:80]
    if len(q) < 2:
        return ok(results=[])
    rate_limit("lookup", g.email)
    try:
        kind = "departure" if request.args.get("kind") == "departure" else "destination"
        return ok(results=geo_tool.autocomplete(q, kind, near=_visitor_location()))
    except geo_tool.ToolUnavailable as e:
        raise ApiError(f"Place search is unavailable right now ({e}).", 503)


# ── Keep-alive (Vercel Cron) ────────────────────────────────────────────────
# Supabase pauses free projects after ~7 days without activity. A daily cron
# (vercel.json) makes one tiny query so the demo never goes to sleep.
@app.get("/api/cron/keepalive")
def api_keepalive():
    cron_secret = (os.getenv("CRON_SECRET") or "").strip()
    if cron_secret and request.headers.get("Authorization", "") != f"Bearer {cron_secret}":
        raise ApiError("Not found.", 404)
    rate_limit("auth", "keepalive:" + _client_ip())
    db().table("users").select("id").limit(1).execute()
    return ok(at=datetime.now(timezone.utc).isoformat())


# ── AI ──────────────────────────────────────────────────────────────────────
CHAT_SYSTEM_PROMPT = """You are Voya AI, a warm and knowledgeable travel companion built into the Voya trip-planning app. You help users:
- Discover destinations and the best times to visit
- Plan trips with budget tips and itinerary ideas
- Find hotels, restaurants, and local experiences
- Understand visa requirements, weather, and safety
- Compare destinations and suggest alternatives

Keep replies concise and conversational (2-5 sentences). Use emojis sparingly to stay friendly. If asked something unrelated to travel, gently redirect back to trip planning."""


@app.post("/api/chat")
@require_auth
def api_chat():
    data = body()
    message = text(data, "message", required=True, max_len=2000, label="Message")
    history = data.get("history") or []
    if not isinstance(history, list):
        history = []
    rate_limit("chat", g.email)

    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]
    for turn in history[-10:]:
        if (isinstance(turn, dict) and turn.get("role") in ("user", "assistant")
                and isinstance(turn.get("content"), str) and turn["content"].strip()):
            messages.append({"role": turn["role"], "content": turn["content"][:4000]})
    messages.append({"role": "user", "content": message})

    try:
        reply = call_openrouter(messages, max_tokens=400, timeout=CHAT_TIMEOUT_S, model=OPENROUTER_CHAT_MODEL)
    except AIError as e:
        log.warning("chat failed: %s", e)
        raise ApiError(user_message(e), 503 if str(e) == "daily limit" else 502)
    return ok(reply=reply)


@app.post("/api/generate-trip")
@require_auth
def api_generate_trip():
    """The Plan Trip form. Same engine as the agent: real places + forecast as
    grounding, the LLM drafts the plan and realistic cost estimates, and the
    budget is added up in code (so the total is NOT just the budget echoed back)."""
    data = body()
    destination  = text(data, "destination", required=True, max_len=120, label="Destination")
    budget       = text(data, "budget", required=True, max_len=40, label="Budget")
    travel_style = text(data, "travel_style", max_len=120, label="Travel style")
    from_city    = text(data, "from_city", max_len=120, label="Departure city")
    start_date   = text(data, "start_date", required=True, max_len=10, label="Start date")
    end_date     = text(data, "end_date", required=True, max_len=10, label="End date")
    travelers    = int_field(data, "travelers", default=2, lo=1, hi=20, label="Travelers")
    transport    = (text(data, "transport", max_len=10) or "any").lower()
    if transport not in itinerary_tool.TRANSPORT_MODES:
        raise ApiError("Please pick a valid way to travel.", 400)
    if not (DATE_RE.match(start_date) and DATE_RE.match(end_date)):
        raise ApiError("Please pick valid start and end dates.", 400)
    try:
        num_days = (datetime.strptime(end_date, "%Y-%m-%d") - datetime.strptime(start_date, "%Y-%m-%d")).days + 1
    except ValueError:
        raise ApiError("Please pick valid start and end dates.", 400)
    if num_days < 1:
        raise ApiError("End date must be on or after the start date.", 400)
    if num_days > MAX_TRIP_DAYS:
        raise ApiError(f"Trips can be at most {MAX_TRIP_DAYS} days. Pick a shorter date range.", 400)
    rate_limit("generate", g.email)
    deadline = time.monotonic() + AI_TOTAL_BUDGET_S
    record_search(g.email, destination)

    ctx = {}
    try:
        ctx = memory.build_user_context(db(), current_user_id(), g.email)
    except Exception as e:  # personalisation is nice-to-have; never block generation
        log.warning("context lookup failed: %s", e)
    interests = [s.strip() for s in travel_style.split(",") if s.strip()] or (ctx.get("preferences") or {}).get("interests") or []
    places = places_tool.search_places(destination, interests, limit=12)
    weather = weather_tool.get_weather(destination, start_date, end_date, dest=places.get("destination"))
    res = itinerary_tool.generate_itinerary(
        destination=destination, start_date=start_date, end_date=end_date, travelers=travelers, budget=budget,
        interests=interests, pace=((ctx.get("preferences") or {}).get("pace") or "balanced"),
        from_city=from_city or ctx.get("home_airport") or "", transport=transport,
        user_context=memory.context_to_prompt(ctx) if ctx else "", places=places.get("places") or [],
        weather=weather, dest=places.get("destination"), time_budget_s=max(20, deadline - time.monotonic() - 3))
    if res["status"] == "error":
        raise ApiError(res["message"], 400)
    if res["status"] != "ok":
        raise ApiError(res["message"], 503 if "free usage limit" in res["message"] else 502)
    itin = res["itinerary"]
    itin["travel_style"] = travel_style
    return ok(itinerary=itin)


@app.route("/api/<path:_unused>", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
def api_not_found(_unused):
    raise ApiError("Not found.", 404)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5001")), debug=os.getenv("FLASK_DEBUG") == "1")
