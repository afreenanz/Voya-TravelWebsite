# Voya Travel Website — Complete Study Guide
### Everything you need to ace an interview on this project

Live: https://voya-travel-website-eta.vercel.app

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [System Architecture](#4-system-architecture)
5. [Database Design](#5-database-design)
6. [Authentication System](#6-authentication-system)
7. [Backend — Every Route](#7-backend--every-route)
8. [AI Integration](#8-ai-integration)
9. [Frontend — Every Page & Component](#9-frontend--every-page--component)
10. [Data Flow — How Everything Connects](#10-data-flow--how-everything-connects)
11. [LocalStorage — Client-Side State](#11-localstorage--client-side-state)
12. [Security Practices](#12-security-practices)
13. [Deployment](#13-deployment)
14. [Interview Q&A](#14-interview-qa)
15. [Voya 2.0 — The AI Travel Agent](#15-voya-20--the-ai-travel-agent)

---

## 1. Project Overview

**Voya** is an AI-powered travel planning web app. Users can:
- Plan a trip by entering a destination, dates, budget, travelers and travel style
- Get an AI-generated day-by-day itinerary with real place names and an estimated cost breakdown
- Save trips to a wishlist, mark them as booked (upcoming), completed, or delete them
- Chat with an AI travel assistant
- Keep a profile (home airport, bio, photo) that personalises every new itinerary

**The core idea:** instead of Googling "things to do in Bali" across 10 tabs, Voya drafts a complete, personalised itinerary in one request (usually 15–40 seconds).

**What Voya does not do:** it doesn't sell flights or hotels. "Book it all" saves the plan as an *Upcoming* trip so the user can book each part themselves.

---

## 2. Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| **HTML + CSS** | Page structure and styling (designed in Figma, exported as HTML) |
| **React 18 (CDN, production build)** | UI components, no build step |
| **Babel Standalone** | Transpiles JSX in the browser |
| **Lucide Icons** | Icon library (CDN) |
| **`shared/voya.js`** | Tiny helper: session token, `Voya.api()` fetch wrapper, auth redirects |

> **Why React via CDN?** The UI came from Figma handoff exports. Serving the JSX directly and transpiling in the browser means zero build tooling. Trade-off: a slightly slower first load (the browser downloads Babel).

### Backend
| Tool | Purpose |
|---|---|
| **Python 3.12+ / Flask 3** | Serves the frontend files and the JSON API under `/api` |
| **PyJWT** | Signs and verifies the app's own session tokens (HS256) |
| **supabase-py** | Database + storage access (service-role key, server-side only) and Supabase Auth calls (OTP, Google) |
| **werkzeug.security** | Password hashing (`generate_password_hash` / `check_password_hash`, scrypt) |
| **requests** | Calls the OpenRouter API |
| **python-dotenv** | Loads `.env` locally |

### Database & Auth
| Tool | Purpose |
|---|---|
| **Supabase Postgres** | `users`, `trips`, `searches` tables |
| **Supabase Auth** | Email one-time codes and Google OAuth |
| **Supabase Storage** | Public `avatars` bucket for profile photos |

### AI
| Tool | Purpose |
|---|---|
| **OpenRouter** | One API for many models; model chosen by the `OPENROUTER_MODEL` env var |
| **NVIDIA Nemotron 3 Ultra (free)** (default) | Generates itineraries (JSON mode) and chat replies; OpenRouter falls back to a second free model when it is rate-limited |

### Hosting
| Tool | Purpose |
|---|---|
| **Vercel** | Runs the Flask app as one Python Vercel Function (Fluid Compute) |
| **GitHub** | `afreenanz/Voya-TravelWebsite`, pushes to `main` deploy to production |

---

## 3. Project Structure

```
Voya-TravelWebsite/
├── backend/
│   ├── app.py              ← The whole backend: page routes + /api routes
│   ├── requirements.txt    ← Pinned Python packages (local installs)
│   └── __init__.py
├── frontend/
│   ├── landing/index.html  ← Landing page (/)
│   ├── auth/
│   │   ├── index.html      ← Login + signup (/login)
│   │   └── callback.html   ← Google OAuth return page (/auth/callback)
│   ├── app/                ← The signed-in app (/app/...)
│   │   ├── index.html      ← Dashboard shell
│   │   ├── plan.html       ← Plan Trip + My Trips shell
│   │   ├── explore.html, profile.html
│   │   ├── dashboard/      ← Dashboard.jsx, components.jsx (shared UI + sidebar)
│   │   ├── plantrip/       ← App.jsx, PlanForm.jsx, ItineraryView.jsx, MyTripsView.jsx, Sidebar.jsx
│   │   ├── explore/ExploreApp.jsx
│   │   └── profile/ProfileApp.jsx
│   ├── shared/             ← colors_and_type.css, app.css (mobile), voya.js, logos
│   └── 404.html
├── supabase/schema.sql     ← Tables, indexes, RLS, grants, avatars bucket
├── pyproject.toml          ← Python deps for Vercel + entrypoint (backend.app:app)
├── vercel.json             ← framework: flask, maxDuration: 120s
├── .env.example            ← Every env var the app reads
└── README.md
```

---

## 4. System Architecture

```
            Browser
               │  same origin — no CORS needed
               ▼
┌──────────────────────────────────────┐
│  Vercel Function: Flask (app.py)     │
│  • serves /, /login, /app/*  (HTML,  │
│    JSX, CSS, images)                 │
│  • /api/*  JSON API                  │
└──────┬───────────────────┬───────────┘
       │ service-role key  │ API key
       ▼                   ▼
┌──────────────┐    ┌───────────────┐
│ Supabase     │    │ OpenRouter    │
│ Postgres     │    │ (free models) │
│ Auth/Storage │    └───────────────┘
└──────────────┘
```

**Key point:** one origin serves everything. Pages and API share the domain, so the frontend uses relative URLs like `fetch('/api/get-trips')`, and there's no CORS or hard-coded hostname anywhere.

---

## 5. Database Design

All tables have **Row Level Security enabled with no policies**, and the public `anon`/`authenticated` roles have no grants. Only the backend's **service-role** key can read or write. See `supabase/schema.sql`.

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `email` | text | **Unique**, stored lower-case |
| `name`, `full_name` | text | Display name |
| `password_hash` | text | Only for email + password accounts |
| `phone`, `home_airport`, `preferred_budget`, `travel_style`, `bio` | text | Profile, used to personalise prompts |
| `avatar_url` | text | Public URL in the `avatars` bucket (or Google photo) |
| `created_at` | timestamptz | `default now()` |

### `trips`
| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | Primary key |
| `user_email` | text | Owner (indexed) |
| `destination`, `cities`, `flag`, `budget`, `travel_style`, `gradient` | text | Display data |
| `days`, `travelers` | int | |
| `start_date`, `end_date` | text | `YYYY-MM-DD` |
| `status` | text | `planning` · `upcoming` · `completed` · `wishlist` |
| `itinerary_json` | jsonb | `{ "days": [...], "cost_breakdown": {...} }` (older rows: just the days array) |
| `created_at` | timestamptz | |

### `searches`
| Column | Type | Notes |
|---|---|---|
| `id` | bigint identity | |
| `user_email` | text | Indexed with `created_at` |
| `destination` | text | Inserted on every `/api/generate-trip` |
| `created_at` | timestamptz | Dashboard shows the latest 5 |

> **Why link by email instead of a user id?** Supabase Auth users (OTP/Google) and the custom `users` table are separate systems. Email is the shared identifier across all three login methods.

---

## 6. Authentication System

### The session token (all login methods end here)
After any successful login, Flask issues **its own JWT**:
```python
jwt.encode({"sub": email, "name": name, "iss": "voya", "iat": now, "exp": now + 7 days},
           APP_SECRET_KEY, algorithm="HS256")
```
- The frontend stores it in `localStorage` as `voya_token` and sends `Authorization: Bearer <token>` on every `/api` call (via `Voya.api()`).
- Every user-scoped route is wrapped in `@require_auth`, which verifies the signature, issuer and expiry and sets `g.email`. **The email is never read from the request body or query string.**
- Missing, expired or tampered token → `401`. The frontend then clears storage and redirects to `/login?next=<page>`.

### Method 1 — Email + password
- **Signup** `POST /api/signup {name, email, password}`: validates (email format, password ≥ 8 chars), rejects duplicates with `409`, hashes the password, inserts the user, returns `{token, user}`.
- **Login** `POST /api/login-password {email, password}`: checks the hash. A wrong email and a wrong password get the **same** message ("Incorrect email or password.").

### Method 2 — Email one-time code
1. `POST /api/check-email`: does an account exist?
2. `POST /api/send-otp`: Supabase emails a 6-digit code (the "Magic Link" email template must contain `{{ .Token }}`).
3. `POST /api/verify-otp {email, code}`: Supabase verifies the code. The user row is created if needed, and a Voya token is returned.

### Method 3 — Google OAuth (Supabase, implicit flow)
1. `/auth/google` redirects to `SUPABASE_URL/auth/v1/authorize?provider=google&redirect_to=<APP_BASE_URL>/auth/callback`.
2. Google sends the user back to `/auth/callback#access_token=…`.
3. `callback.html` POSTs that token to `/api/auth/oauth`. The server verifies it with `supabase.auth.get_user(token)`, upserts the user, and returns a Voya token.

> **Why implicit flow and not PKCE?** PKCE needs a code verifier stored between the redirect and the callback. On serverless, those two requests can hit different instances, so the verifier would be lost.

> **Gotcha we hit:** calling `verify_otp` on a *shared* supabase-py client swaps that client's auth header to the user's token, so later DB queries on the same warm instance would run as that user. Auth calls therefore use a fresh throwaway client (`auth_client()`), and only `db()` is shared.

### Redirect rules
- Logged-out user opens `/app/...` → `/login?next=/app/...`, and after login they land back where they were.
- Logged-in user opens `/login` → `/app`.
- `next` is only honoured if it starts with `/app` (no open redirect).

---

## 7. Backend — Every Route

### Pages (no auth on the server; the guard runs in the browser because the token lives in localStorage)
| Route | Serves |
|---|---|
| `GET /` | `frontend/landing/index.html` |
| `GET /login` | `frontend/auth/index.html` (`?mode=signup`, `?next=`) |
| `GET /app` | Dashboard |
| `GET /app/plan`, `/app/trips` | Plan Trip / My Trips (`?destination=` prefills, `?trip=<id>` opens one) |
| `GET /app/explore`, `/app/profile` | Explore, Profile |
| `GET /app/<file>`, `/shared/<file>`, `/landing/<file>` | JSX, CSS, images |
| `GET /auth/google`, `/auth/callback` | Google OAuth |
| anything else | `404.html` |

### Auth API (public, rate-limited per IP)
| Route | Body | Returns |
|---|---|---|
| `POST /api/check-email` | `{email}` | `{exists}` |
| `POST /api/signup` | `{name, email, password}` | `{token, user}` |
| `POST /api/login-password` | `{email, password}` | `{token, user}` |
| `POST /api/send-otp` | `{email}` | `{message}` |
| `POST /api/verify-otp` | `{email, code}` | `{token, user}` |
| `POST /api/auth/oauth` | `{access_token}` | `{token, user}` |

### User API (all `@require_auth`)
| Route | Notes |
|---|---|
| `GET /api/me` | `{user: {email, name}}` |
| `GET /api/profile` / `POST /api/profile` | Read / update profile fields (validated, length-capped) |
| `POST /api/upload-avatar` | multipart `avatar`; PNG/JPG/WEBP/GIF ≤ 2 MB; path is a hash of the email |
| `POST /api/save-trip` | `{trip}` → inserts for the token's user, returns the saved trip |
| `GET /api/get-trips` | The user's trips, newest first |
| `PATCH /api/update-trip-status/<id>` | `{status}`. Returns `404` if the trip isn't yours |
| `DELETE /api/delete-trip/<id>` | Returns `404` if the trip isn't yours |
| `GET /api/searches` / `DELETE /api/searches` | Last 5 searches / clear |
| `POST /api/generate-trip` | AI itinerary (see §8) |
| `POST /api/chat` | `{message, history}` → `{reply}` |

### Error handling
- Every `/api` response is JSON: `{success: true, ...}` or `{success: false, error: "<friendly message>"}`.
- Unknown `/api/*` → JSON `404`. Unexpected exceptions → logged server-side, JSON `500` with a generic message. Tracebacks are never sent to the browser.

---

## 8. AI Integration

### Trip generation (`POST /api/generate-trip`)
1. **Validate**: destination, budget and dates required; end ≥ start; max 14 days; 1–20 travelers.
2. **Rate limit**: 4 per minute per user.
3. **Record** the search in `searches`.
4. **Personalise**: read the user's `home_airport`, `preferred_budget`, `travel_style`.
5. **Prompt**: strict JSON-only instructions, the exact schema, an allowed icon list, real place names, costs scaled to the budget.
6. **Call OpenRouter** with `response_format: json_object`, `max_tokens: 8192`.
7. **Parse + validate the schema**: `days` must be a non-empty list, every day needs activities with names, and `cost_breakdown.total` must exist. Unknown icons become `map-pin`.
8. **Retry once** if the JSON is invalid or incomplete.

**Time budget:** each attempt times out at 55s, total AI time is capped at 100s, and the Vercel function's `maxDuration` is 120s. So the user always gets a friendly error instead of a platform timeout.

### Itinerary JSON
```json
{
  "destination": "Japan", "cities": "Tokyo · Kyoto", "budget": "₹1,00,000", "travel_style": "Cultural",
  "days": [{ "day": 1, "title": "Arrival in Tokyo", "theme": "First impressions",
             "activities": [{ "time": "14:00", "icon": "plane-landing", "name": "Arrive at Narita", "note": "… · ₹0 · tip" }] }],
  "cost_breakdown": { "flights": {"amount": "₹45,000", "note": "…"}, "accommodation": {...}, "food": {...},
                      "activities": {...}, "local_transport": {...}, "misc": {...}, "total": "₹1,00,000" }
}
```

### Chat (`POST /api/chat`)
System prompt ("You are Voya AI… 2–5 sentences"), plus the last 10 turns, plus the new message; `max_tokens: 400`, 30s timeout, 15 per minute per user. Errors are shown inside the chat panel.

### Model choice
`OPENROUTER_MODEL` (default `nvidia/nemotron-3-ultra-550b-a55b:free`) plus `OPENROUTER_FALLBACK_MODELS`, sent to OpenRouter as a `models` list so it switches automatically when the first model is busy. Switching models is an env-var change in Vercel; no code change needed.

---

## 9. Frontend — Every Page & Component

| Page | File | What it does |
|---|---|---|
| Landing | `landing/index.html` | Static HTML. Hero, features, how it works, destinations, pricing (free), CTAs to `/login` |
| Login / Signup | `auth/index.html` | Password login, email code, Google. Inline validation. Redirects to `next` |
| Dashboard | `app/index.html` + `dashboard/Dashboard.jsx` | Greeting with real name, trip stats, AI search, next upcoming trip (or "Plan a trip"), AI chat, recent searches, destination ideas |
| Plan Trip | `app/plan.html` + `plantrip/*.jsx` | `PlanForm` → `LoadingView` → `ItineraryView`. Save to wishlist, Share (copy text), Modify, Book it all |
| My Trips | `plantrip/MyTripsView.jsx` | Filter tabs, status dropdown, delete, open itinerary |
| Explore | `explore/ExploreApp.jsx` | Destination grid (name, flag, real landmarks). Click → planner prefilled |
| Profile | `profile/ProfileApp.jsx` | Edit profile, photo upload, stats/achievements/stamps/activity computed from real trips, sign out |

### Shared pieces (`dashboard/components.jsx`)
`C` (colour tokens), `Icon`, `VBtn`, `VCard`, `VChip`, `VAvatar` (initials), `VSectionHead`, **`VSidebar`** (one sidebar for every page, with logout), `VNotice` (inline errors), `useToast`, `fmtDate`.

### Mobile
`shared/app.css` only applies below 860px: the sidebar becomes an icon top bar and grids stack (`m-stack`, `m-wrap`, `m-pad` class names). Desktop is unchanged.

---

## 10. Data Flow — How Everything Connects

```
PlanForm ─► POST /api/generate-trip (Bearer token)
              ├─ insert into searches
              ├─ read profile (personalisation)
              └─ OpenRouter → validate JSON (retry once)
          ◄─ itinerary ─► ItineraryView
Save to wishlist ─► POST /api/save-trip (status=wishlist) → trip id
Book it all      ─► PATCH /api/update-trip-status/<id> (upcoming)   [already saved]
                 └► POST /api/save-trip (status=upcoming)          [not saved yet]
My Trips / Dashboard / Profile ─► GET /api/get-trips
```

---

## 11. LocalStorage — Client-Side State

| Key | Value | Trusted by the server? |
|---|---|---|
| `voya_token` | Signed session JWT (7 days) | Yes, but only after the signature is verified |
| `voya_user_name` | Display name for the UI | No (display only) |
| `voya_next` (sessionStorage) | Where to return after Google login | No (only `/app…` paths are accepted) |

---

## 12. Security Practices

- **Server-side identity**: the user's email comes only from the verified token, so trip ids from another user return `404`.
- **Passwords**: hashed with werkzeug (scrypt), minimum 8 characters. Same error for unknown email or wrong password.
- **Database**: RLS on with no policies, plus no grants for `anon`/`authenticated`. The publishable key can't read `users.password_hash`. The service-role key lives only in server env vars.
- **Secrets**: `.env` is git-ignored. `.env.example` lists the variables with placeholders.
- **Input validation**: lengths, formats, statuses and dates are checked; upload type and size are checked.
- **Rate limits**: auth 10/min per IP, generate 4/min, chat 15/min per user. These are in-memory per serverless instance (best-effort; a shared store like Redis would make them global).
- **Headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Cache-Control: no-store` on the API.
- **Safe redirects**: `next` is restricted to `/app…`.

**Known limitations**: the session token can't be revoked before it expires (7 days). There's no email verification for password signups.

---

## 13. Deployment

- `pyproject.toml` declares the dependencies and `[tool.vercel] entrypoint = "backend.app:app"`.
- `vercel.json` sets `"framework": "flask"` and `maxDuration: 120` for `backend/app.py`.
- Every file is bundled into the function, so Flask can serve `frontend/` directly.
- **Env vars** (Production + Preview): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `APP_SECRET_KEY`, plus `APP_BASE_URL` (Production only).
- **Supabase Auth → URL configuration**: Site URL = production URL, and Redirect URLs include `<prod>/auth/callback`.

---

## 14. Interview Q&A

**Q: What is Voya and what problem does it solve?**
A: An AI trip planner. You give it a destination, dates, budget and style, and it returns a day-by-day itinerary with real places and an estimated budget breakdown, in about 30 seconds instead of hours of research across many sites.

**Q: Walk me through the stack.**
A: Flask on Vercel serves both the frontend and a JSON API. Supabase provides Postgres, auth (email sign-in links) and file storage. OpenRouter routes AI calls to free models, with automatic fallback when one is rate-limited. The UI is React from a Figma export, loaded from a CDN with in-browser Babel, so there's no build step.

**Q: How does authentication work?**
A: Every login method (password, email code, Google) ends with the server issuing its own HS256 JWT with a 7-day expiry. The browser sends it as a Bearer token. A `@require_auth` decorator verifies it and puts the email in `g.email`. Endpoints never trust an email from the request.

**Q: The first version sent `user_email` from localStorage. What was wrong with that?**
A: Anyone could edit localStorage or the query string and read or delete another user's trips. Now identity comes only from a signed token, and every trip query filters by `id` **and** the token's email, so someone else's trip id returns 404. I wrote a test where user B tries to modify user A's trip.

**Q: Why do you need RLS if only the backend talks to the database?**
A: Defence in depth. The publishable key is public by design, and it was once committed to the repo. With RLS on, no policies and no grants for `anon`, that key can't read anything. The backend uses the service-role key, which stays server-side.

**Q: How do you make the AI return valid JSON?**
A: JSON mode (`response_format`), a strict prompt with the exact schema, stripping stray code fences, then server-side schema validation (days, activities, cost total). If the result is invalid it retries once within a fixed time budget, and the UI shows a friendly error if both attempts fail.

**Q: How do you handle long AI calls on serverless?**
A: Per-attempt timeouts (55s) inside a total budget (100s), below the function's `maxDuration` (120s). The client shows an animated loading view that eases toward 95% instead of a fake fixed timer.

**Q: Why implicit OAuth flow instead of PKCE?**
A: PKCE stores a code verifier between the redirect and the callback. On serverless, those can hit different instances. With the implicit flow, the callback page sends the access token to my API, which verifies it with Supabase before issuing a session.

**Q: What would you improve next?**
A: Token revocation (a server-side session table), email verification for password signups, a shared rate-limit store, real booking via partner APIs, and moving the frontend to a build step (Vite) for faster loads.

**Q: Why use email as the foreign key instead of user id?**
A: Supabase Auth users and the custom `users` table are separate systems, and email is the identifier shared across all three login methods. Emails are normalised to lower case and unique.

---

## 15. Voya 2.0 — The AI Travel Agent

### What changed
Voya went from "one prompt → one itinerary" to a **tool-using agent** with memory. The traveller chats on the dashboard; the agent decides which tools to run, shows each step live, returns a structured plan, edits it in conversation, and saves it only when asked.

### The graph (LangGraph, `backend/agent/`)
```
load_context → understand → decide ─┬─ (clarify / answer) ─────────┐
 (Supabase)   (LLM call 1)  (code   └─ execute_tools → respond ───┴→ persist
                            guardrails)
```
| Node | What it does | LLM? |
|---|---|---|
| `load_context` | Reads preferences, profile, last 5 trips, last 12 messages, and the draft itinerary from Supabase | No |
| `understand` | Returns JSON: intent, trip details, tools to run, preferences to remember, or a clarifying question | **Yes (1)** |
| `decide` | Guardrails: fills gaps from the draft and preferences, sets tentative dates (and says so), blocks saving unless asked, needs a draft before editing, checks dates and the 14-day limit, asks instead of guessing | No |
| `execute_tools` | Runs the tools in dependency order; each failure is recorded on its own step | Only itinerary generate/modify |
| `respond` | Template for plans (exact numbers, no extra call); one grounded LLM answer for open questions | Sometimes |
| `persist` | Saves both messages with tool metadata, plus the updated draft | No |

### Tools (`backend/tools/`)
| Tool | Source | Never invents… |
|---|---|---|
| Destination search | Geoapify Places (OpenStreetMap), ranked by notability | Places: they come from map data |
| Place verification | Geoapify geocoding filtered to the country and biased to the destination | Marks a place verified only on a full-name match |
| Weather | Open-Meteo forecast | Returns "unavailable" beyond the 16-day forecast window |
| Budget | Python `Decimal` | Totals, remaining, per day, per person: the LLM only estimates categories |
| Itinerary generate/modify | LLM + validator | Modify returns only changed days, and the rest are kept as they were |
| Save trip | Supabase | Success is reported only after reading the row back; same trip + dates updates instead of duplicating |

### Memory
- `user_preferences`: allowlisted keys only (destinations, interests, activities, accommodation, dietary, budget, pace). Anything else, like a passport number, is rejected.
- `conversations` + `conversation_messages`: history with `tool_metadata`, plus `draft_itinerary` for the plan being edited.
- Everything is reloaded from the database on every turn, so memory doesn't depend on the LLM's context window or on serverless instance memory.

### Frontend
- Dashboard "Voya AI" card (`app/dashboard/agent.jsx`) calls `POST /api/agent/stream` (Server-Sent Events). It shows each step live, then a reply, an itinerary preview, **Save to My Trips** and **Open full plan**. "Open full plan" shows the plan in the existing itinerary view. The card also has history and New chat.
- The dashboard search bar sends free text to the agent.
- Profile → "Travel preferences" lets you view, edit and delete what the agent remembers.

### More interview Q&A

**Q: Why plan-and-execute instead of a ReAct loop with native function calling?**
A: Each ReAct step is another LLM round-trip. On OpenRouter's free tier (50 requests/day per account), a 4-tool request would cost 5–6 calls. Here one call plans the tools and code runs them, so a full trip costs 2 calls. Deterministic guardrails also make the dangerous decisions (saving, dates, missing info) testable without an LLM.

**Q: How do you stop the AI from claiming it saved a trip when it didn't?**
A: The AI never writes the reply for a save. Saving only runs if the traveller asked in that message or pressed Confirm. The reply is built from the save tool's result, and that tool only returns success after reading the row back from the database. A test forces the save to fail and checks the reply says "Nothing was saved."

**Q: Why not use a LangGraph checkpointer for memory?**
A: Vercel functions are stateless and instances don't share memory. An in-memory checkpointer would lose state between requests, and a Postgres checkpointer would need a direct DB connection. The conversation, messages and draft are already in Supabase, so the graph rebuilds its state from there on every request.

**Q: How do you test an LLM agent without spending quota?**
A: The LLM, tools and DB are injected through a `Deps` object. Unit and integration tests (pytest) script the LLM's JSON and use the real Supabase project for persistence. The browser tests run a local server with real Geoapify/Open-Meteo/Supabase and a rule-based stand-in for the LLM. A separate evaluation (`eval/run_agent_eval.py`) runs 20 realistic requests against the real model and reports intent accuracy, tool-selection accuracy, parameter extraction and latency.

**Q: How is "verified" different from "estimated" in the UI?**
A: Each activity carries `verified: true` plus an address and coordinates only when map data matched it by full name. The preview shows "X of Y stops verified on the map · costs are estimates". Distances between stops are straight-line distances and labelled as approximate.

