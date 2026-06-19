from flask import Flask, request, redirect, make_response, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from supabase import create_client
from werkzeug.security import generate_password_hash, check_password_hash
import requests
import mimetypes
import json
import os
from datetime import datetime

mimetypes.add_type('application/javascript', '.jsx')

BACKEND_DIR   = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT  = os.path.dirname(BACKEND_DIR)
FRONTEND_BASE = os.path.join(PROJECT_ROOT, "frontend", "ALL ZIP FILES")
DASHBOARD_DIR = os.path.join(FRONTEND_BASE, "voya-dashboard ", "project")

load_dotenv()

OPENROUTER_MODEL = "deepseek/deepseek-chat-v3-0324"

ALLOWED_ICONS = [
    "plane-landing", "plane-takeoff", "building-2", "map-pin", "utensils",
    "train-front", "bus", "car", "ship", "bike", "landmark", "shopping-bag",
    "waves", "sunrise", "sunset", "sun", "camera", "coffee", "music",
    "compass", "fish", "map", "ticket", "moon", "sparkles", "heart",
]


def _days_count(start_date: str, end_date: str) -> int:
    try:
        s = datetime.strptime(start_date, "%Y-%m-%d")
        e = datetime.strptime(end_date,   "%Y-%m-%d")
        return max(1, (e - s).days)
    except Exception:
        return 5


def _build_prompt(destination, budget, travelers, travel_style, start_date, end_date, num_days, profile=None, from_city=""):
    p = profile or {}

    # Form's "from" field takes priority; fall back to profile home_airport
    home_airport     = from_city.strip() or p.get("home_airport", "").strip()
    profile_budget   = p.get("preferred_budget", "").strip()
    profile_style    = p.get("travel_style", "").strip()

    # profile values override form values when present
    effective_style  = profile_style or travel_style

    # Build personalization block only when profile data exists
    profile_section = ""
    if home_airport or profile_budget or profile_style:
        profile_section = f"""
TRAVELER PROFILE (personalise itinerary around these preferences)
- Home airport:      {home_airport or "Not specified — use nearest major hub"}
- Preferred budget:  {profile_budget or "Not specified"}
- Travel style:      {effective_style}

PERSONALISATION RULES
- All flights must depart from and return to {home_airport or "the traveler's nearest hub"}.
- Match hotel tier to the preferred budget: budget → hostels/2-star, mid-range → 3-4 star, luxury → 5-star.
- Prioritise {effective_style} experiences in activity selection.
- Suggest restaurants matching the travel style and budget tier.
"""

    return f"""You are an expert travel planner. Create a detailed, realistic {num_days}-day itinerary.

TRIP DETAILS
- Destination:   {destination}
- Dates:         {start_date} to {end_date} ({num_days} days)
- Budget:        {budget} total for {travelers} traveler(s)
- Travel style:  {effective_style}
{profile_section}
STRICT RULES
1. Return ONLY the raw JSON object — no markdown fences, no explanation text whatsoever.
2. Include 4-6 activities per day spread across morning, afternoon, and evening.
3. Day 1 must start with arrival / check-in. Last day must end with checkout / departure.
4. Use REAL, named places: actual hotel names, restaurant names, landmark names.
5. Each "note" must contain: specific detail · estimated cost in same currency as budget · one practical tip. Separate segments with " · ".
6. "cities" field: 2-4 main areas/cities visited, separated by " · ".
7. Use ONLY these icon values (exact strings): {", ".join(ALLOWED_ICONS)}
8. Scale all costs so the total trip stays within the stated budget.
9. "time" must be HH:MM in 24h format.
10. cost_breakdown amounts must reflect realistic current market prices for the destination and season — not placeholders or rough estimates. Amounts must sum to the total.

OUTPUT — return exactly this JSON structure, nothing else:
{{
  "destination": "{destination}",
  "cities": "<City1> · <City2>",
  "budget": "{budget}",
  "travel_style": "{effective_style}",
  "days": [
    {{
      "day": 1,
      "title": "<descriptive title>",
      "theme": "<short theme>",
      "activities": [
        {{
          "time": "HH:MM",
          "icon": "<icon>",
          "name": "<specific place or activity>",
          "note": "<detail · cost · tip>"
        }}
      ]
    }}
  ],
  "cost_breakdown": {{
    "flights":         {{"amount": "<currency + amount>", "note": "Round trip {home_airport or 'origin'} → {destination} · airline · class"}},
    "accommodation":   {{"amount": "<currency + amount>", "note": "{num_days - 1} nights · hotel name · tier"}},
    "food":            {{"amount": "<currency + amount>", "note": "All meals, street food, dining"}},
    "activities":      {{"amount": "<currency + amount>", "note": "Entry fees, tours, experiences"}},
    "local_transport": {{"amount": "<currency + amount>", "note": "Taxis, metro, buses"}},
    "misc":            {{"amount": "<currency + amount>", "note": "Shopping, tips, incidentals"}},
    "total":           "<currency + grand total>"
  }}
}}"""


app = Flask(__name__)

CORS(
    app,
    resources={r"/*": {"origins": "*"}}
)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

@app.route("/")
def home():
    return {"message": "Voya Backend Running"}


# ── AI Chat ────────────────────────────────────────────────────

CHAT_SYSTEM_PROMPT = """You are Voya AI, a warm and knowledgeable travel companion built into the Voya trip-planning app. You help users:
- Discover destinations and the best times to visit
- Plan trips with budget tips and itinerary ideas
- Find hotels, restaurants, and local experiences
- Understand visa requirements, weather, and safety
- Compare destinations and suggest alternatives

Keep replies concise and conversational (2-5 sentences). Use emojis sparingly to stay friendly. If asked something unrelated to travel, gently redirect back to trip planning."""

@app.route("/chat", methods=["POST"])
def chat():
    data    = request.json
    message = data.get("message", "").strip()
    history = data.get("history", [])  # list of {role, content}

    if not message:
        return {"success": False, "error": "Message is required."}, 400

    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    # Include last 10 turns for context
    for turn in history[-10:]:
        if turn.get("role") in ("user", "assistant") and turn.get("content"):
            messages.append({"role": turn["role"], "content": turn["content"]})

    messages.append({"role": "user", "content": message})

    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type":  "application/json",
            },
            json={
                "model":       OPENROUTER_MODEL,
                "messages":    messages,
                "temperature": 0.8,
                "max_tokens":  400,
            },
            timeout=30,
        )
        res.raise_for_status()
        reply = res.json()["choices"][0]["message"]["content"].strip()
        return {"success": True, "reply": reply}

    except Exception as e:
        print(f"Chat error: {e}")
        return {"success": False, "error": "Failed to get a response."}, 500


# ── Google OAuth ───────────────────────────────────────────────

@app.route("/auth/google")
def auth_google():
    try:
        response = supabase.auth.sign_in_with_oauth({
            "provider": "google",
            "options": {
                "redirect_to": "http://127.0.0.1:5000/auth/callback"
            }
        })
        return redirect(response.url)
    except Exception as e:
        return {"error": str(e)}, 500


@app.route("/auth/callback")
def auth_callback():
    html = """<!DOCTYPE html>
<html>
<head>
  <title>Signing you in…</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#F1EFE8;
         display:flex;flex-direction:column;align-items:center;justify-content:center;
         height:100vh;gap:16px}
    .spinner{width:40px;height:40px;border:3px solid rgba(55,138,221,0.2);
             border-top-color:#378ADD;border-radius:50%;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    p{font-size:15px;color:#0C447C;font-weight:600}
  </style>
</head>
<body>
  <div class="spinner"></div>
  <p>Signing you in…</p>
  <script>
    var hash   = window.location.hash.substring(1);
    var params = new URLSearchParams(hash);
    var token  = params.get('access_token');
    if (token) { localStorage.setItem('voya_access_token', token); }
    setTimeout(function(){ window.location.replace('/app'); }, 400);
  </script>
</body>
</html>"""
    return make_response(html, 200, {'Content-Type': 'text/html'})


# ── Serve dashboard as web app ─────────────────────────────────

@app.route("/app")
@app.route("/app/")
def serve_app_index():
    return send_from_directory(DASHBOARD_DIR, "Voya Dashboard.html")


@app.route("/app/<path:filename>")
def serve_app_static(filename):
    return send_from_directory(DASHBOARD_DIR, filename)

@app.route("/send-otp", methods=["POST"])
def send_otp():

    data = request.json
    email = data["email"]

    supabase.auth.sign_in_with_otp({
        "email": email
    })

    return {
        "success": True,
        "message": "OTP sent"
    }

@app.route("/verify-otp", methods=["POST"])
def verify_otp():

    try:

        data = request.json

        email = data["email"]
        token = data["code"]

        result = supabase.auth.verify_otp({
            "email": email,
            "token": token,
            "type": "email"
        })

        return {
            "success": True
        }

    except Exception as e:

        print("VERIFY OTP ERROR:", e)

        return {
            "success": False,
            "error": str(e)
        }, 400

@app.route("/profile", methods=["GET"])
def get_profile():
    email = request.args.get("email", "").strip()
    if not email:
        return {"success": False, "error": "Email is required."}, 400
    try:
        result = supabase.table("users").select("*").eq("email", email).execute()
        if not result.data:
            return {"success": False, "error": "User not found."}, 404
        u = result.data[0]
        return {
            "success": True,
            "profile": {
                "full_name":        u.get("full_name") or u.get("name", ""),
                "email":            u.get("email", ""),
                "phone":            u.get("phone", ""),
                "home_airport":     u.get("home_airport", ""),
                "preferred_budget": u.get("preferred_budget", ""),
                "travel_style":     u.get("travel_style", ""),
                "bio":              u.get("bio", ""),
                "avatar_url":       u.get("avatar_url", ""),
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}, 500


@app.route("/profile", methods=["POST"])
def update_profile():
    data  = request.json
    email = data.get("email", "").strip()
    if not email:
        return {"success": False, "error": "Email is required."}, 400
    allowed = ["full_name", "phone", "home_airport", "preferred_budget", "travel_style", "bio"]
    updates = {k: data[k] for k in allowed if k in data}
    if not updates:
        return {"success": False, "error": "No fields to update."}, 400
    try:
        supabase.table("users").update(updates).eq("email", email).execute()
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}, 500


@app.route("/check-email", methods=["POST"])
def check_email():

    data = request.json
    email = data["email"]

    try:
        result = supabase.table("users").select("*").eq("email", email).execute()

        return {
            "exists": len(result.data) > 0
        }

    except Exception as e:
        return {
            "exists": False,
            "error": str(e)
        }
    
@app.route("/signup", methods=["POST"])
def signup():

    data = request.json

    name = data["name"]
    email = data["email"]
    password = data.get("password", "")

    if not password:
        return {"success": False, "error": "Password is required."}, 400

    try:

        existing = supabase.table("users").select("id").eq("email", email).execute()
        if existing.data:
            return {"success": False, "error": "An account with this email already exists."}, 400

        password_hash = generate_password_hash(password)

        supabase.table("users").insert({
            "name": name,
            "email": email,
            "password_hash": password_hash
        }).execute()

        return {"success": True}

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }, 400


@app.route("/login-password", methods=["POST"])
def login_password():

    data = request.json

    email = data.get("email", "")
    password = data.get("password", "")

    if not email or not password:
        return {"success": False, "error": "Email and password are required."}, 400

    try:

        result = supabase.table("users").select("*").eq("email", email).execute()

        if not result.data:
            return {"success": False, "error": "No account found with this email."}, 401

        user = result.data[0]
        stored_hash = user.get("password_hash")

        if not stored_hash:
            return {"success": False, "error": "This account uses email link sign-in. Use that option instead."}, 401

        if not check_password_hash(stored_hash, password):
            return {"success": False, "error": "Incorrect password."}, 401

        return {
            "success": True,
            "user": {"name": user.get("name"), "email": user.get("email")}
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }, 400
    
@app.route("/save-trip", methods=["POST"])
def save_trip():
    try:
        trip = request.json.get("trip", {})

        supabase.table("trips").insert({
            "destination":    trip.get("destination", ""),
            "cities":         trip.get("cities", ""),
            "flag":           trip.get("flag", "✈️"),
            "budget":         str(trip.get("budget", "")),
            "days":           int(trip.get("days", 0)),
            "start_date":     trip.get("startDate", ""),
            "end_date":       trip.get("endDate", ""),
            "travelers":      int(trip.get("travelers", 1)),
            "travel_style":   trip.get("travelStyle", ""),
            "status":         trip.get("status", "planning"),
            "gradient":       trip.get("gradient", ""),
            "itinerary_json": trip.get("itinerary", []),
        }).execute()

        return {"success": True}

    except Exception as e:
        print(f"Save trip error: {e}")
        return {"success": False, "error": str(e)}, 500


@app.route("/get-trips", methods=["GET"])
def get_trips():
    try:
        result = supabase.table("trips").select("*").order("id", desc=True).execute()

        trips = []
        for row in result.data:
            trips.append({
                "id":          str(row.get("id", "")),
                "destination": row.get("destination", ""),
                "cities":      row.get("cities") or row.get("destination", ""),
                "flag":        row.get("flag", "✈️"),
                "budget":      str(row.get("budget", "")),
                "days":        row.get("days", 0),
                "startDate":   row.get("start_date", ""),
                "endDate":     row.get("end_date", ""),
                "travelers":   row.get("travelers", 1),
                "travelStyle": row.get("travel_style", ""),
                "status":      row.get("status", "planning"),
                "gradient":    row.get("gradient") or "linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)",
                "itinerary":   row.get("itinerary_json") or [],
            })

        return {"success": True, "trips": trips}

    except Exception as e:
        print(f"Get trips error: {e}")
        return {"success": False, "error": str(e)}, 500

@app.route("/generate-trip", methods=["POST"])
def generate_trip():

    data         = request.json
    destination  = data.get("destination", "").strip()
    budget       = data.get("budget", "")
    travel_style = data.get("travel_style", "")
    travelers    = data.get("travelers", 2)
    start_date   = data.get("start_date", "")
    end_date     = data.get("end_date", "")
    email        = data.get("email", "").strip()
    from_city    = data.get("from_city", "").strip()

    if not destination:
        return {"success": False, "error": "Destination is required."}, 400

    # Fetch user profile for personalisation; silently fall back if unavailable
    profile = None
    if email:
        try:
            result = supabase.table("users").select(
                "home_airport, preferred_budget, travel_style"
            ).eq("email", email).execute()
            if result.data:
                profile = result.data[0]
        except Exception:
            pass  # Non-fatal — continue without personalisation

    num_days = _days_count(start_date, end_date)
    prompt   = _build_prompt(destination, budget, travelers, travel_style,
                             start_date, end_date, num_days, profile, from_city)

    try:
        res = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {os.getenv('OPENROUTER_API_KEY')}",
                "Content-Type":  "application/json",
            },
            json={
                "model": OPENROUTER_MODEL,
                "messages": [
                    {
                        "role":    "system",
                        "content": "You are an expert travel planner. Return ONLY valid JSON — no markdown, no explanation.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "response_format": {"type": "json_object"},
                "temperature":     0.8,
                "max_tokens":      8192,
            },
            timeout=60,
        )

        res.raise_for_status()

        raw_text = res.json()["choices"][0]["message"]["content"].strip()

        # Strip accidental markdown fences
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[-1]
            raw_text = raw_text.rsplit("```", 1)[0]

        itinerary = json.loads(raw_text)

        itinerary.setdefault("destination",    destination)
        itinerary.setdefault("budget",         budget)
        itinerary.setdefault("travel_style",   travel_style)
        itinerary.setdefault("cities",         destination)
        itinerary.setdefault("days",           [])
        itinerary.setdefault("cost_breakdown", None)

        return {"success": True, "itinerary": itinerary}

    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}\nRaw: {raw_text[:400]}")
        return {"success": False, "error": "AI returned malformed JSON. Please try again."}, 500

    except Exception as e:
        print(f"OpenRouter error: {e}")
        return {"success": False, "error": "Failed to generate itinerary. Please try again."}, 500

if __name__ == "__main__":
    app.run(debug=True)