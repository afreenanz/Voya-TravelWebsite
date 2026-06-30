# Voya Travel Website — Complete Study Guide
### Everything you need to ace an interview on this project

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [System Architecture](#4-system-architecture)
5. [Database Design](#5-database-design)
6. [Authentication System](#6-authentication-system)
7. [Backend — Every API Endpoint](#7-backend--every-api-endpoint)
8. [AI Integration](#8-ai-integration)
9. [Frontend — Every Page & Component](#9-frontend--every-page--component)
10. [Data Flow — How Everything Connects](#10-data-flow--how-everything-connects)
11. [LocalStorage — Client-Side State](#11-localstorage--client-side-state)
12. [Security Practices](#12-security-practices)
13. [What's Done vs What's Coming](#13-whats-done-vs-whats-coming)
14. [Interview Q&A](#14-interview-qa)

---

## 1. Project Overview

**Voya** is an AI-powered travel planning web application. It lets users:
- Plan trips by entering a destination, dates, budget, and travel style
- Get a fully AI-generated day-by-day itinerary with real place names and cost breakdowns
- Save trips to their profile and manage them (view, delete, update status)
- Chat with an AI travel assistant
- View and edit their profile

**The core idea:** instead of Googling "things to do in Bali" across 10 tabs, Voya generates a complete, personalised itinerary in one click using an AI model.

---

## 2. Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| **HTML + CSS** | Page structure and styling |
| **React 18** | UI components (loaded via CDN, not a build tool) |
| **Babel Standalone** | Transpiles JSX in the browser (no webpack/vite) |
| **Lucide Icons** | Icon library (CDN) |
| **LocalStorage** | Stores logged-in user's email and name client-side |

> **Why React via CDN?** The frontend was designed in Figma and exported as HTML handoff files. Using React via CDN means no build step is needed — the JSX files are served directly and transpiled in the browser. This makes the project simpler to run but slightly slower to load.

### Backend
| Tool | Purpose |
|---|---|
| **Python 3** | Language |
| **Flask** | Web framework — handles all API routes |
| **flask-cors** | Allows the frontend (different port/origin) to call the backend |
| **supabase-py** | Python SDK for Supabase database operations |
| **python-dotenv** | Loads secret keys from `.env` file |
| **werkzeug** | Password hashing (`generate_password_hash`, `check_password_hash`) |
| **requests** | Makes HTTP calls to the OpenRouter AI API |

### Database
| Tool | Purpose |
|---|---|
| **Supabase** | Managed PostgreSQL database (cloud-hosted) |
| **Supabase Auth** | Built-in Google OAuth + OTP email authentication |

### AI
| Tool | Purpose |
|---|---|
| **OpenRouter API** | Gateway that routes requests to AI models |
| **DeepSeek Chat v3** | The actual AI model that generates itineraries and chat replies |

### Version Control
| Tool | Purpose |
|---|---|
| **Git** | Local version control |
| **GitHub** | Remote repository (`afreenanz/Voya-TravelWebsite`) |

---

## 3. Project Structure

```
voya/                               ← Project root
├── .env                            ← Secret keys (NOT in git)
├── .gitignore                      ← Tells git what to ignore
├── backend/
│   ├── app.py                      ← Entire Flask backend (all API routes)
│   └── requirements.txt            ← Python packages to install
├── frontend/
│   └── ALL ZIP FILES/              ← Figma handoff exports
│       ├── voya-landing-page/
│       │   └── project/
│       │       └── Landing Page.html   ← Landing page (standalone HTML)
│       ├── voya-login-signup/
│       │   └── project/
│       │       └── Login.html          ← Login + signup page
│       └── voya-dashboard /            ← Note: has a trailing space (Figma export quirk)
│           └── project/
│               ├── Voya Dashboard.html ← Dashboard shell (loads all JSX)
│               ├── colors_and_type.css ← Design system: colors, fonts
│               ├── dashboard/
│               │   ├── Dashboard.jsx   ← Home screen of the dashboard
│               │   └── components.jsx  ← Shared UI components (VCard, VSectionHead, etc.)
│               └── plantrip/
│                   ├── App.jsx         ← Plan Trip page — coordinates views
│                   ├── PlanForm.jsx    ← Trip planning form
│                   ├── ItineraryView.jsx ← Shows generated itinerary
│                   ├── MyTripsView.jsx ← Shows saved trips
│                   ├── Sidebar.jsx     ← Left navigation sidebar
│                   └── data.js         ← Shared constants
├── static/
│   └── style.css                   ← Flask static file (minimal)
└── templates/
    └── index.html                  ← Flask template (minimal)
```

### Why this folder structure?

The frontend was designed in Figma. When Figma designs are exported as handoff ZIP files, each screen gets its own folder with its own HTML file and assets. That's why there are separate folders for the landing page, login, and dashboard instead of a single `src/` folder.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        USER                             │
└───────────────────────────┬─────────────────────────────┘
                            │ Browser
                ┌───────────▼────────────┐
                │   Frontend (HTML/JSX)  │
                │   React (CDN/Babel)    │
                │   localhost:5000/app   │
                └───────────┬────────────┘
                            │ HTTP fetch() calls
                ┌───────────▼────────────┐
                │   Flask Backend        │
                │   Python / app.py      │
                │   localhost:5000       │
                └──────┬──────────┬──────┘
                       │          │
          ┌────────────▼──┐  ┌───▼──────────────┐
          │  Supabase      │  │  OpenRouter API   │
          │  (PostgreSQL)  │  │  (DeepSeek AI)    │
          │  users table   │  │  Trip generation  │
          │  trips table   │  │  Chat replies     │
          └───────────────┘  └──────────────────┘
```

**Key point:** Flask serves both the API AND the frontend HTML files. When you visit `localhost:5000/app`, Flask serves `Voya Dashboard.html`. The JavaScript inside that page then makes `fetch()` calls back to `localhost:5000/chat`, `localhost:5000/generate-trip`, etc.

---

## 5. Database Design

Voya uses **Supabase (PostgreSQL)**. There are two main tables:

### `users` Table
| Column | Type | Description |
|---|---|---|
| `id` | UUID (auto) | Primary key |
| `name` | TEXT | Display name |
| `email` | TEXT | Email address (unique) |
| `password_hash` | TEXT | bcrypt hash (for email/password login) |
| `full_name` | TEXT | Profile full name |
| `phone` | TEXT | Phone number |
| `home_airport` | TEXT | Preferred departure airport |
| `preferred_budget` | TEXT | Budget preference (e.g. "mid-range") |
| `travel_style` | TEXT | Travel style (e.g. "adventure") |
| `bio` | TEXT | Profile bio |
| `avatar_url` | TEXT | Profile photo URL |

### `trips` Table
| Column | Type | Description |
|---|---|---|
| `id` | INT (auto) | Primary key |
| `user_email` | TEXT | Links trip to a user (foreign key pattern) |
| `destination` | TEXT | e.g. "Japan" |
| `cities` | TEXT | e.g. "Tokyo · Kyoto · Osaka" |
| `flag` | TEXT | Emoji flag e.g. "🇯🇵" |
| `budget` | TEXT | e.g. "₹1,00,000" |
| `days` | INT | Number of days |
| `start_date` | TEXT | e.g. "2025-08-10" |
| `end_date` | TEXT | e.g. "2025-08-20" |
| `travelers` | INT | Number of travelers |
| `travel_style` | TEXT | e.g. "cultural" |
| `status` | TEXT | One of: `planning`, `upcoming`, `completed`, `wishlist` |
| `gradient` | TEXT | CSS gradient string for the card thumbnail |
| `itinerary_json` | JSONB | Full AI-generated itinerary (array of day objects) |

> **Important:** `user_email` is used instead of a foreign key to the `users` table because Supabase's Auth users and our custom `users` table are separate systems. Using email as the link is simpler and works for this scale.

---

## 6. Authentication System

Voya supports **three ways to log in**:

### Method 1 — Google OAuth (via Supabase Auth)
**Flow:**
1. User clicks "Continue with Google"
2. Frontend calls `/auth/google` on the backend
3. Backend asks Supabase for a Google OAuth URL
4. User is redirected to Google's login screen
5. Google redirects back to `/auth/callback`
6. The callback page extracts the `access_token` from the URL hash
7. Token is saved to `localStorage` as `voya_access_token`
8. User is redirected to `/app`

```
User → /auth/google → Supabase OAuth URL → Google Login
→ /auth/callback → extract token → localStorage → /app
```

### Method 2 — OTP Email (Magic Link)
**Flow:**
1. User enters email, clicks "Send OTP"
2. Frontend calls `POST /send-otp` with `{ email }`
3. Backend calls `supabase.auth.sign_in_with_otp({ email })`
4. Supabase sends a 6-digit OTP to the user's email
5. User enters OTP, frontend calls `POST /verify-otp` with `{ email, code }`
6. Backend calls `supabase.auth.verify_otp(...)` and returns `success: true`
7. Frontend stores `voya_user_email` in localStorage and redirects to `/app`

### Method 3 — Email + Password
**Flow:**
1. **Signup:** `POST /signup` with `{ name, email, password }`
   - Backend checks if email already exists
   - Hashes password using `werkzeug.security.generate_password_hash`
   - Inserts user into Supabase `users` table
2. **Login:** `POST /login-password` with `{ email, password }`
   - Fetches user from Supabase by email
   - Compares input password against stored hash using `check_password_hash`
   - Returns `{ success: true, user: { name, email } }` on match

> **Why no JWT tokens for email/password?** For simplicity, this app stores the user's email in localStorage and sends it with every request. A production app would use JWT tokens for stateless auth.

---

## 7. Backend — Every API Endpoint

The entire backend lives in `backend/app.py`. Here is every route:

---

### `GET /`
**Purpose:** Health check  
**Returns:** `{ message: "Voya Backend Running" }`

---

### `POST /chat`
**Purpose:** AI travel assistant chat  
**Request:** `{ message: "...", history: [{ role, content }] }`  
**What it does:**
- Builds a message array with system prompt + last 10 turns of history + new message
- Sends to OpenRouter (DeepSeek model)
- Returns the AI reply

**Returns:** `{ success: true, reply: "..." }`

---

### `GET /auth/google`
**Purpose:** Start Google OAuth flow  
**What it does:** Gets OAuth URL from Supabase, redirects user to Google  

---

### `GET /auth/callback`
**Purpose:** Handles Google OAuth redirect  
**What it does:** Serves a small HTML page that extracts the token from the URL hash and saves it to localStorage, then redirects to `/app`

---

### `GET /app` and `GET /app/<filename>`
**Purpose:** Serve the React dashboard  
**What it does:** Flask serves the static HTML/JSX/CSS files from the `voya-dashboard` folder

---

### `POST /send-otp`
**Request:** `{ email }`  
**What it does:** Calls Supabase to send a magic link / OTP email  
**Returns:** `{ success: true, message: "OTP sent" }`

---

### `POST /verify-otp`
**Request:** `{ email, code }`  
**What it does:** Verifies the OTP against Supabase Auth  
**Returns:** `{ success: true }` or `{ success: false, error: "..." }`

---

### `GET /profile?email=<email>`
**Purpose:** Fetch a user's profile  
**Returns:** `{ success: true, profile: { full_name, email, phone, home_airport, preferred_budget, travel_style, bio, avatar_url } }`

---

### `POST /profile`
**Purpose:** Update a user's profile  
**Request:** `{ email, full_name?, phone?, home_airport?, preferred_budget?, travel_style?, bio? }`  
**What it does:** Updates only the provided fields in the `users` table  
**Returns:** `{ success: true }`

---

### `POST /check-email`
**Request:** `{ email }`  
**Purpose:** Check if an account exists with this email (used on login page to show login vs signup)  
**Returns:** `{ exists: true/false }`

---

### `POST /signup`
**Request:** `{ name, email, password }`  
**What it does:**
- Checks if email already exists
- Hashes the password with bcrypt (via werkzeug)
- Inserts new user into Supabase `users` table

**Returns:** `{ success: true }` or `{ success: false, error: "..." }`

---

### `POST /login-password`
**Request:** `{ email, password }`  
**What it does:**
- Fetches user by email from Supabase
- Uses `check_password_hash` to verify password
- Returns user info on success

**Returns:** `{ success: true, user: { name, email } }` or `{ success: false, error: "..." }`

---

### `POST /save-trip`
**Request:** `{ user_email: "...", trip: { destination, cities, flag, budget, days, startDate, endDate, travelers, travelStyle, status, gradient, itinerary } }`  
**What it does:** Inserts a new trip row into Supabase `trips` table, scoped to `user_email`  
**Returns:** `{ success: true }`

---

### `GET /get-trips?user_email=<email>`
**Purpose:** Fetch all trips for a specific user  
**What it does:** Queries `trips` table filtered by `user_email`, ordered newest first  
**Returns:** `{ success: true, trips: [...] }`

---

### `PATCH /update-trip-status/<id>`
**Request:** `{ user_email: "...", status: "planning"|"upcoming"|"completed"|"wishlist" }`  
**What it does:** Updates the status of one trip, but ONLY if it belongs to `user_email` (security check)  
**Returns:** `{ success: true }`

---

### `DELETE /delete-trip/<id>?user_email=<email>`
**What it does:** Deletes one trip, ONLY if it belongs to `user_email` (security check)  
**Returns:** `{ success: true }`

---

### `POST /generate-trip`
**Request:** `{ destination, budget, travel_style, travelers, start_date, end_date, email, from_city }`  
**What it does:**
1. Fetches user's profile from Supabase (for personalisation)
2. Builds a detailed AI prompt (see Section 8)
3. Sends to OpenRouter API
4. Parses the JSON response
5. Returns the full itinerary object

**Returns:** `{ success: true, itinerary: { destination, cities, budget, travel_style, days: [...], cost_breakdown: {...} } }`

---

## 8. AI Integration

### How Trip Generation Works

**Step 1 — Build the prompt** (`_build_prompt` function)

The prompt includes:
- Destination, dates, number of days, budget, travel style, number of travelers
- User's home airport, preferred budget, travel style (from their profile)
- Strict instructions to return ONLY JSON (no markdown)
- The exact JSON schema the AI must return
- List of allowed icon names (so the frontend can render icons correctly)
- Rules like: Day 1 must start with arrival, last day ends with departure, use REAL place names, scale costs to budget

**Step 2 — Call OpenRouter**

```python
requests.post(
    "https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {OPENROUTER_API_KEY}"},
    json={
        "model": "deepseek/deepseek-chat-v3-0324",
        "messages": [...],
        "response_format": {"type": "json_object"},
        "temperature": 0.8,
        "max_tokens": 8192,
    }
)
```

**Step 3 — Parse & clean the response**

- Strip any accidental markdown fences (` ```json `)
- Parse as JSON
- Fill in any missing fields with defaults

**Step 4 — Return to frontend**

The frontend receives the itinerary and renders it in `ItineraryView.jsx`.

### The Itinerary JSON Structure

```json
{
  "destination": "Japan",
  "cities": "Tokyo · Kyoto · Osaka",
  "budget": "₹1,00,000",
  "travel_style": "cultural",
  "days": [
    {
      "day": 1,
      "title": "Arrival in Tokyo",
      "theme": "First impressions",
      "activities": [
        {
          "time": "14:00",
          "icon": "plane-landing",
          "name": "Arrive at Narita International Airport",
          "note": "Terminal 2 arrival · ₹0 · collect JR Pass at airport counter"
        }
      ]
    }
  ],
  "cost_breakdown": {
    "flights": { "amount": "₹45,000", "note": "Delhi → Tokyo round trip · Air India · Economy" },
    "accommodation": { "amount": "₹28,000", "note": "9 nights · APA Hotel Shinjuku · 3-star" },
    "food": { "amount": "₹12,000", "note": "All meals, street food, dining" },
    "activities": { "amount": "₹8,000", "note": "Entry fees, tours, experiences" },
    "local_transport": { "amount": "₹5,000", "note": "JR Pass, metro, buses" },
    "misc": { "amount": "₹2,000", "note": "Shopping, tips, incidentals" },
    "total": "₹1,00,000"
  }
}
```

### How AI Chat Works

- System prompt tells the AI: "You are Voya AI, a travel companion. Keep replies 2–5 sentences."
- Last 10 conversation turns are sent as history (so the AI remembers context)
- Uses `temperature: 0.8` (slightly creative) and `max_tokens: 400` (short replies)
- Model: DeepSeek Chat v3 (via OpenRouter)

---

## 9. Frontend — Every Page & Component

### Page 1 — Landing Page (`Landing Page.html`)
- Standalone HTML file (no React)
- Explains what Voya does
- Has a CTA button that links to the Login page
- Animated logo video (`voya_logo_animate.mp4`)

---

### Page 2 — Login / Signup (`Login.html`)
- Standalone HTML file
- **Smart flow:** user enters email → backend checks if account exists
  - If yes → shows password field (login mode)
  - If no → shows name + password fields (signup mode)
- Also has: OTP email button, Google OAuth button
- On success → saves `voya_user_email` and `voya_user_name` to localStorage → redirects to `/app`

---

### Page 3 — Dashboard (`Voya Dashboard.html` + `Dashboard.jsx`)

The dashboard is a single-page app. The sidebar controls which "page" you see:

**Sections rendered on the home tab:**
| Component | Description |
|---|---|
| `HeroSection` | Greeting ("Good morning, Afreen") + animated route SVG |
| `AISearch` | Search bar with rotating placeholder suggestions |
| `QuickActions` | 4 shortcut buttons (Plan Trip, My Trips, Explore, Chat) |
| `UpcomingTrips` | *Currently hardcoded* — will show real trips in Phase 2 |
| `AIAssistant` | Chat panel connected to `/chat` backend |
| `RecentSearches` | *Currently hardcoded* — will be persisted in Phase 2 |
| `PopularDestinations` | Static destination cards with artwork |
| `TravelInspiration` | Static inspiration cards |
| `SavedPlaces` | *Currently hardcoded* — will be a real bookmarks feature in Phase 3 |

**Navigation tabs:** Home, Plan Trip, My Trips, Explore, Profile

---

### Page 4 — Plan Trip (`plantrip/*.jsx`)

**Files involved:**

`App.jsx` — Coordinator. Manages which view to show:
- `PlanForm` → user fills in the form
- `LoadingView` → shown while AI generates (animated progress bar)
- `ItineraryView` → shows the generated itinerary

`PlanForm.jsx` — The trip planning form with:
- Destination autocomplete (100+ destinations with flags and hints)
- Departure city autocomplete (30+ airports with IATA codes)
- Date pickers (start + end date)
- Budget pills (₹30k, ₹50k, ₹75k, ₹1L, ₹1.5L+)
- Traveler count stepper
- Travel style multi-select (Adventure, Cultural, Relaxation, Food, Romantic, Family)

`ItineraryView.jsx` — Shows the AI result:
- Day-by-day timeline with icons, times, activity names, notes
- Cost breakdown table
- "Save to wishlist" button → calls `/save-trip` with `status: "wishlist"`
- "Book All" button → calls `/save-trip` with `status: "upcoming"`
- Booking modal with fake flight/hotel/activity sections

`MyTripsView.jsx` — Shows all saved trips:
- Filter tabs: All, Upcoming, Saved, Completed
- Stats strip (count per status)
- Trip cards with thumbnail, destination, dates, budget, travelers, travel style
- Status badge (clickable dropdown to change status)
- Trash icon to delete a trip
- Clicking a card opens `ItineraryView` with that saved trip's itinerary

---

### Page 5 — Profile (`profile/ProfileApp.jsx`)
- Loads user data from `/profile?email=<email>` on mount
- Shows: avatar, name, email, phone, home airport, preferred budget, travel style, bio
- Edit mode: form to update any field → calls `POST /profile`
- On save, updates `voya_user_name` in localStorage

---

### Page 6 — Explore (`explore/ExploreApp.jsx`)
- Shows travel packages (currently hardcoded static data)
- Filter by category: All, Beach, Cultural, Adventure, City
- Each package card: destination, duration, price, highlights, what's included, rating

---

### Shared Components (`dashboard/components.jsx`)
| Component | Purpose |
|---|---|
| `VCard` | White card with shadow and border radius |
| `VSectionHead` | Section heading with eyebrow text + action link |
| `Icon` | Wrapper around Lucide icons |
| `C` | Color constants object (navy, ocean, cream, amber, etc.) |

---

## 10. Data Flow — How Everything Connects

### Complete Trip Planning Flow

```
1. User fills PlanForm
   ↓
2. App.jsx calls handleGenerate()
   ↓
3. POST /generate-trip
   ├── Fetches user profile from Supabase (personalisation)
   └── Calls OpenRouter API (DeepSeek)
       ↓
4. AI returns JSON itinerary
   ↓
5. ItineraryView renders the itinerary
   ↓
6a. User clicks "Save" → POST /save-trip (status: "wishlist")
6b. User clicks "Book All" → POST /save-trip (status: "upcoming")
   ↓
7. Trip stored in Supabase trips table with user_email
   ↓
8. My Trips page → GET /get-trips?user_email=... → shows the trip
```

### Authentication Flow (Email/Password)

```
Login page:
1. User types email → POST /check-email
2. If exists → show password field
3. User types password → POST /login-password
4. Backend checks hash → returns { success: true, user }
5. Frontend saves email + name to localStorage
6. Redirect to /app
```

---

## 11. LocalStorage — Client-Side State

The app uses `localStorage` to persist the logged-in user across page loads (no server-side sessions).

| Key | Value | Set when |
|---|---|---|
| `voya_user_email` | e.g. `anzafreen@gmail.com` | After successful login |
| `voya_user_name` | e.g. `Afreen` | After login / profile save |
| `voya_access_token` | Supabase OAuth token | After Google OAuth callback |

Every API call that needs to be scoped to a user reads `localStorage.getItem('voya_user_email')` and sends it in the request.

---

## 12. Security Practices

### What's in place
- **Passwords are hashed** — never stored in plain text. Uses `werkzeug.security` (bcrypt under the hood)
- **User-scoped trip operations** — `save-trip`, `get-trips`, `delete-trip`, `update-trip-status` all require `user_email` AND verify it matches the record before modifying (prevents one user deleting another's trips)
- **`.env` for secrets** — API keys are never hardcoded; loaded from `.env` which is in `.gitignore`
- **`.env.save` removed** — credentials that were accidentally committed were purged from git history using `git filter-branch`
- **CORS configured** — Flask-CORS allows the frontend to call the backend

### What's not yet production-grade
- **No JWT tokens** — user email in localStorage can be tampered with by the user (though backend only returns that user's own data)
- **No HTTPS** — running on localhost; needs SSL for production
- **No rate limiting** — AI endpoints can be called unlimited times

---

## 13. What's Done vs What's Coming

### Phase 1 — Core Fixes (DONE)
- [x] User-scoped trips — each user only sees their own trips
- [x] Delete trip — backend + trash icon UI in My Trips
- [x] Update trip status — clickable status badge dropdown

### Phase 2 — Complete the Dashboard
- [ ] **Upcoming Trips (dynamic)** — pull real "upcoming" trip from Supabase instead of hardcoded Thailand
- [ ] **Recent Searches (saved)** — persist search history per user in Supabase

### Phase 3 — New Features
- [ ] **Saved Places / Bookmarks** — let users bookmark destinations
- [ ] **Profile photo upload** — Supabase Storage + avatar display
- [ ] **Explore packages from backend** — move hardcoded packages to Supabase table

### Phase 4 — Polish & Deploy
- [ ] **Notifications** — in-app notification panel
- [ ] **Replace localhost URLs** — config variable for API base URL
- [ ] **Deploy backend** — Railway / Render / Fly.io
- [ ] **Deploy frontend** — Netlify / Vercel

---

## 14. Interview Q&A

### General Project Questions

**Q: What is Voya and what problem does it solve?**
A: Voya is an AI-powered travel planning app that solves the problem of trip planning being scattered across multiple websites. Instead of spending hours on Google Flights, TripAdvisor, booking.com and travel blogs, Voya generates a complete personalised day-by-day itinerary with real place names, timings, estimated costs and a full budget breakdown — in about 30 seconds.

**Q: How long did this take to build?**
A: The project was built incrementally — the design was created in Figma first, exported as HTML handoff files, and then the backend was built in Python/Flask with Supabase as the database and OpenRouter for AI.

**Q: Walk me through the tech stack and why you chose each tool.**
A: Flask for the backend because Python makes it easy to work with AI APIs and data processing. Supabase because it gives you a production-grade PostgreSQL database with built-in OAuth (Google login) out of the box — no need to build auth from scratch. OpenRouter because it lets you swap AI models without changing code. React via CDN because the frontend came from a Figma handoff and didn't need a full build pipeline.

---

### Backend / Python Questions

**Q: How does password hashing work in Voya?**
A: When a user signs up, their password is hashed using `generate_password_hash` from werkzeug, which uses bcrypt internally. The hash is stored in Supabase. On login, `check_password_hash(stored_hash, input_password)` is called — it never decrypts the hash, it re-hashes the input and compares. This means even if the database is leaked, passwords can't be recovered.

**Q: How do you prevent one user from deleting another user's trip?**
A: Every mutation endpoint (delete, update status, save) requires the `user_email` in the request AND the Supabase query includes `.eq("user_email", email)` as a condition. So even if someone sends a request with a different trip ID, it will only delete if that trip also belongs to their email.

**Q: How does CORS work and why is it needed?**
A: CORS (Cross-Origin Resource Sharing) is a browser security rule that blocks JavaScript from making requests to a different domain/port than the page it's on. In development, the frontend and backend both run on localhost:5000, so it's fine. But when deployed, the frontend might be on `voya.netlify.app` and the backend on `voya-api.railway.app` — different domains. `flask-cors` adds the right HTTP headers so the browser allows these cross-origin requests.

**Q: What happens if the AI returns malformed JSON?**
A: The `generate-trip` endpoint catches `json.JSONDecodeError` separately and returns a user-friendly error message. There's also pre-processing to strip any accidental markdown code fences (` ```json `) before parsing.

---

### Database Questions

**Q: Why use email as a foreign key instead of user ID?**
A: Supabase has two separate systems — the Auth system (which manages Google OAuth and OTP logins) and the custom `users` table we created for email/password logins. Their user IDs are in different systems. Using email as the common link is simpler and works reliably across both auth methods.

**Q: What is Supabase?**
A: Supabase is an open-source Firebase alternative. It provides a PostgreSQL database, auto-generated REST API, authentication (OAuth, OTP, magic links), storage (for files/images), and a web dashboard. You can use the Python SDK (`supabase-py`) to query it directly from the backend.

---

### Frontend Questions

**Q: Why use React via CDN instead of Create React App or Vite?**
A: The frontend originated from Figma handoff exports — already-structured HTML files. Adding a build tool would mean restructuring everything. Using Babel Standalone + React CDN means the JSX files can be served directly by Flask and transpiled in the browser with zero build step. The trade-off is slightly slower initial page load (browser downloads and compiles Babel).

**Q: How does the AI itinerary generation look from the user's perspective?**
A: The user fills in a form (destination, dates, budget, travel style, departure city), clicks "Generate itinerary". A loading screen appears with an animated progress bar and step descriptions ("Researching your destination", "Building your day plan", etc.). After 15–30 seconds, the full itinerary slides in — showing each day as a timeline with activity cards, icons, times, and notes. At the bottom is a cost breakdown table.

**Q: How do you handle the trip status system?**
A: Each trip has one of four statuses: `planning` (saved but not confirmed), `upcoming` (booked/confirmed), `completed` (trip is over), `wishlist` (saved to look at later). In My Trips, there are filter tabs for each. The status badge on each card is clickable — it opens a dropdown where the user can change the status. This calls `PATCH /update-trip-status/<id>` and updates the card in the UI instantly without a page reload.

---

### AI / API Questions

**Q: What is OpenRouter and why not use OpenAI directly?**
A: OpenRouter is an API gateway that gives you access to dozens of AI models (OpenAI, Anthropic, DeepSeek, Mistral, etc.) through one unified API. The advantage is flexibility — if DeepSeek becomes too expensive or slow, you can switch to a different model by changing one line (`OPENROUTER_MODEL`). It's also often cheaper than going directly to providers.

**Q: How do you make the AI return valid JSON every time?**
A: Three layers of enforcement:
1. The prompt says "Return ONLY the raw JSON object — no markdown fences, no explanation text whatsoever"
2. The API call includes `"response_format": {"type": "json_object"}` which forces the model into JSON mode
3. The backend strips any accidental markdown fences before parsing with `json.loads()`

**Q: How is the AI personalised for each user?**
A: When generating a trip, the backend fetches the user's profile from Supabase. If they have a `home_airport` set (e.g. "BLR — Bangalore"), the AI prompt includes a personalisation section: flights must depart from Bangalore. If they have a `preferred_budget` ("luxury"), hotels are matched to 5-star. If they have a `travel_style` ("adventure"), the prompt prioritises adventure activities. Profile values override form values.

---

### Git / Version Control Questions

**Q: You mentioned removing a secret from git history — how did you do that?**
A: The OpenRouter API key was accidentally committed in `backend/.env`. To remove it, we used `git filter-branch --force --index-filter "git rm --cached --ignore-unmatch backend/.env" -- --all`. This rewrites every commit in history to exclude that file. Then we force-pushed with `git push --force`. The key was also rotated as a precaution since it was exposed before the rewrite.

**Q: What's in your `.gitignore` and why?**
A: `.env` and `.env.save` (secret keys, never committed), `__pycache__` and `*.pyc` (Python compiled files, generated automatically), `node_modules/` (npm packages, downloaded on install), `.env.local` (local overrides).

---

*This guide covers the complete Voya codebase as of June 2026, including Phases 1 (completed), and 2–4 (roadmap).*
