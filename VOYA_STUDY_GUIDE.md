# Voya — Interview Study Guide

Everything you need to explain, defend and go deep on this project in an interview.

- **Live:** https://voya-travel-website-eta.vercel.app
- **Code:** https://github.com/afreenanz/Voya-TravelWebsite

**How to use this guide:** learn sections 1 and 2 by heart (the pitch and the one-diagram explanation). Read sections 3–13 once so you know where everything lives. Before an interview, reread section 16 (the stories) and section 18 (the question bank). Section 19 has every number you might be asked for.

---

## Contents

1. [The pitch (30 seconds and 2 minutes)](#1-the-pitch)
2. [Architecture in one diagram](#2-architecture-in-one-diagram)
3. [Tech stack and why each piece](#3-tech-stack-and-why-each-piece)
4. [Code map: where everything lives](#4-code-map-where-everything-lives)
5. [Database](#5-database)
6. [Authentication](#6-authentication)
7. [API reference](#7-api-reference)
8. [The AI layer (OpenRouter client)](#8-the-ai-layer-openrouter-client)
9. [The classic planner (form → itinerary)](#9-the-classic-planner)
10. [The AI travel agent (LangGraph)](#10-the-ai-travel-agent-langgraph)
11. [The tools, one by one](#11-the-tools-one-by-one)
12. [Frontend](#12-frontend)
13. [Security](#13-security)
14. [Reliability, performance and the free tier](#14-reliability-performance-and-the-free-tier)
15. [Testing and evaluation](#15-testing-and-evaluation)
16. [Engineering stories (problems I hit and fixed)](#16-engineering-stories)
17. [Trade-offs, limitations and what I'd do next](#17-trade-offs-limitations-and-what-id-do-next)
18. [Interview question bank](#18-interview-question-bank)
19. [Numbers cheat sheet](#19-numbers-cheat-sheet)
20. [Glossary](#20-glossary)

---

## 1. The pitch

### 30 seconds
> Voya is an AI travel planner. You tell it something like "Plan a five-day trip to Bali under ₹60,000, I like beaches and cafes", and an AI agent decides which tools it needs: it searches real places from map data, checks the real weather forecast, writes a day-by-day itinerary, and calculates the budget in code. You can change the plan by chatting ("make day two less hectic"), and it only saves the trip when you confirm. It remembers your preferences for next time. It's built with Flask, Supabase and LangGraph, deployed on Vercel, and it runs entirely on free tiers.

### 2 minutes (add these points)
1. **Started as a simple app, then grew into an agent.** Version 1 was a form that sent one prompt and showed the itinerary. Version 2 added a LangGraph agent with tools, memory and human confirmation, without rewriting the app.
2. **The AI is not trusted with facts.** Places come from OpenStreetMap (via Geoapify), weather from Open-Meteo, and money is calculated in Python with `Decimal`. The AI only drafts the plan and estimates costs per category. The UI shows "4 of 6 stops verified on the map · costs are estimates".
3. **Safe by design.** The AI can't save anything on its own. Saving happens only when the user presses "Save to My Trips" or explicitly says "save it", and success is reported only after the database row is read back.
4. **Built for real constraints.** The free AI tier allows 50 requests a day, so the agent plans all tools in one AI call and runs them in code: a full trip costs 2 AI calls instead of 5–6. Free models fail often, so there's automatic fallback across 3 models.
5. **Tested properly.** 130 automated tests (unit + integration against the real database), browser tests on desktop and mobile, and an evaluation set of 20 realistic requests for the real model.

### If asked "what was the hardest part?"
Making free AI models reliable: they hang, get rate-limited, or return empty answers. See story 16.2 (empty answers from hidden reasoning) and 16.3 (daily limit).

---

## 2. Architecture in one diagram

```
                     Browser  (React 18 from CDN, no build step)
                        │  same origin: pages + /api, no CORS
                        ▼
        ┌──────────────────────────────────────────────┐
        │  Vercel Python Function: Flask (backend/app.py)│
        │  • serves HTML/JSX/CSS                        │
        │  • JSON API under /api (auth via signed JWT)   │
        │  • /api/agent/* → LangGraph agent (backend/agent)
        └──────┬──────────────┬──────────────┬─────────┘
               │ service key  │ API keys      │ API key
               ▼              ▼               ▼
        ┌────────────┐  ┌────────────┐  ┌──────────────┐
        │ Supabase   │  │ Geoapify   │  │ OpenRouter   │
        │ Postgres   │  │ (places,   │  │ (free LLMs,  │
        │ Auth       │  │ OSM data)  │  │ 3-model      │
        │ Storage    │  │ Open-Meteo │  │ fallback)    │
        └────────────┘  │ (weather)  │  └──────────────┘
                        └────────────┘
```

**Say this:** "One Flask app serves both the pages and the API from the same domain, so there's no CORS. Every user-specific endpoint reads the user from a signed token, never from the request. The database is Supabase Postgres, locked down so only the backend can touch it. AI goes through OpenRouter, and real-world data comes from Geoapify and Open-Meteo."

---

## 3. Tech stack and why each piece

| Layer | Choice | Why (what to say) |
|---|---|---|
| Frontend | **React 18 from a CDN + Babel Standalone**, Lucide icons | The UI came from a Figma export as JSX. Serving it directly means no build tooling. Trade-off: the first load downloads Babel (slower). Next step would be Vite. |
| API helper | `frontend/shared/voya.js` | One place for the session token, `Voya.api()` (fetch + error handling + 401 redirect) and `Voya.stream()` (reads Server-Sent Events). |
| Backend | **Python, Flask 3** | Simple, explicit, and it runs on Vercel as a single function. Serves pages and API together. |
| Sessions | **PyJWT (HS256)** | Every login method ends with the server issuing its own signed token, so the API has one way to identify users. |
| Database | **Supabase Postgres** | Managed Postgres with a REST API, Auth and Storage in one free project. |
| Auth providers | **Supabase Auth** | Sends the email sign-in links and verifies their tokens; Google OAuth support is in the code but not switched on yet. |
| Files | **Supabase Storage** | Public `avatars` bucket for profile photos. |
| LLM access | **OpenRouter** | One API for many models, with free models and built-in fallback (`models` list). Model names are env vars. |
| Agent framework | **LangGraph 1.2** | Explicit graph (nodes, edges, conditional routing) over a typed state. Easier to reason about and test than a free-form agent loop. |
| Places | **Geoapify** (OpenStreetMap data) | Free tier (3,000 credits/day), returns real places with coordinates and, when OSM has them, opening hours. |
| Weather | **Open-Meteo** | Free, no key, real forecasts for up to 16 days. |
| Hosting | **Vercel** (Python runtime, Fluid Compute) | Push to `main` → production deploy; pushes to other branches → preview deploys. |
| Tests | **pytest**, **Playwright** | Python unit + integration tests; real-browser end-to-end tests. |

---

## 4. Code map: where everything lives

```
backend/
  app.py               Flask app: page routes, every /api route, auth (JWT), rate limits, errors
  services/
    ai.py              OpenRouter client: model order + fallback, reasoning off, error → friendly message
    memory.py          Preferences (allowlist + validation), conversations, messages, build_user_context()
    trips.py           save_itinerary(): validate, de-duplicate, read back to confirm
  tools/               Plain-Python tools (no Flask): each returns {"status": ok|partial|unavailable|error, …}
    common.py          HTTP GET with timeouts + small TTL cache, haversine distance
    geo.py             resolve_destination(), verify_place()
    places.py          search_places()  (Tool A)
    weather.py         get_weather()    (Tool B)
    budget.py          parse_amount(), calculate_budget(), format_amount()  (Tool C)
    itinerary.py       generate_itinerary(), modify_itinerary(), enrich_days()  (Tools D + E)
  agent/               The LangGraph agent
    state.py           AgentState, list of intents/tools, step labels
    prompts.py         The two prompts: "understand" (plan) and "answer"
    nodes.py           The 6 nodes + guardrails + Deps (dependency injection)
    graph.py           Wires the nodes into a StateGraph
    service.py         run_turn(), confirm_save(): what the API routes call
frontend/
  landing/index.html   Landing page (/)
  auth/index.html      Login / signup (/login); auth/callback.html finishes email-link logins
  app/index.html       Dashboard shell → dashboard/Dashboard.jsx + dashboard/agent.jsx (AI agent card)
  app/plan.html        Plan Trip + My Trips → plantrip/App.jsx, PlanForm, ItineraryView, MyTripsView
  app/explore.html     Explore → explore/ExploreApp.jsx
  app/profile.html     Profile → profile/ProfileApp.jsx + profile/Preferences.jsx
  dashboard/components.jsx   Shared UI kit: colours (C), Icon, VBtn, VCard, VChip, VSidebar, VNotice, useToast
  shared/voya.js       Session + Voya.api() + Voya.stream()
  shared/app.css       Mobile-only layout (< 860px)
supabase/
  schema.sql           users, trips, searches + RLS + grants + avatars bucket (idempotent)
  migrations/001_agent_memory.sql   user_preferences, conversations, conversation_messages
tests/                 pytest: unit, integration (real Supabase), opt-in live API tests
e2e/                   Playwright: agent flow (desktop + mobile) and full-site smoke test
eval/                  20 realistic requests + runner for the real LLM
vercel.json            framework flask, maxDuration 120s, daily keep-alive cron
pyproject.toml         Dependencies Vercel installs + entrypoint backend.app:app + pytest config
```

---

## 5. Database

Supabase Postgres. Two files: `supabase/schema.sql` (version 1 tables) and `supabase/migrations/001_agent_memory.sql` (version 2 memory). Both are **idempotent** (`create … if not exists`, `on conflict`), so running them twice is safe.

### Tables

**`users`**: one row per account.
`id uuid PK`, `email` (unique, lower-case), `name`, `full_name`, `password_hash` (password accounts only), `phone`, `home_airport`, `preferred_budget`, `travel_style`, `bio`, `avatar_url`, `created_at`.

**`trips`**: saved itineraries.
`id bigint PK`, `user_email` (indexed), `destination`, `cities`, `flag`, `budget`, `days`, `start_date`, `end_date`, `travelers`, `travel_style`, `status` (`planning | upcoming | completed | wishlist`), `gradient`, `itinerary_json jsonb` (`{days, cost_breakdown, …}`), `created_at`.

**`searches`**: recent searches on the dashboard. `id`, `user_email`, `destination`, `created_at`.

**`user_preferences`** (v2): one row per user.
`user_id uuid PK → users.id ON DELETE CASCADE`, `preferences jsonb` (check: must be an object), `updated_at`.

**`conversations`** (v2): one chat thread with the agent.
`id uuid PK`, `user_id → users.id CASCADE`, `title`, `draft_itinerary jsonb` (the plan being worked on), `created_at`, `updated_at`. Index on `(user_id, updated_at desc)`.

**`conversation_messages`** (v2): `id bigint PK`, `conversation_id → conversations.id CASCADE`, `role` (check: `user | assistant`), `content`, `tool_metadata jsonb` (which tools ran and their status), `created_at`. Index on `(conversation_id, id)`.

### Security model
- **RLS is enabled on every table with no policies**, and `anon`/`authenticated` have all privileges revoked. The public (publishable) key can read nothing.
- Only the backend uses the **service-role key**, which stays in server env vars. The backend filters every query by the signed-in user.

### Why do old tables use `user_email` but new ones use `user_id`?
The original tables linked by email because email was the one identifier shared by all login methods. For the new tables I used **real foreign keys to `users.id` with `ON DELETE CASCADE`**: deleting a user automatically deletes their preferences and conversations, and the database enforces it (there's a test for that). I didn't migrate the old tables, to avoid risking working data; that's a sensible next step.

### Why JSONB for itineraries and preferences?
An itinerary is a nested document that is always read and written as a whole, never queried by individual activity. JSONB keeps it in one row. Preferences are a small, allowlisted object; the application validates the keys, so the flexible column doesn't let junk in.

---

## 6. Authentication

### One session format for every login method
After any successful login the server issues **its own JWT**:
```python
jwt.encode({"sub": email, "name": name, "iss": "voya", "iat": now, "exp": now + 7 days},
           APP_SECRET_KEY, algorithm="HS256")
```
- The browser stores it in `localStorage` (`voya_token`) and sends `Authorization: Bearer <token>`.
- `@require_auth` verifies the signature, issuer, expiry and required claims, then sets `g.email`. **The user is never taken from the request body or URL.**
- A bad or expired token gets `401`, and the frontend clears storage and sends the user to `/login?next=<page>`.
- Memory endpoints also need the user's database id: `current_user_id()` looks up `users.id` from `g.email` once per request.

### Login methods
1. **Email + password.** `POST /api/signup` validates (email format, password ≥ 8 characters), rejects duplicates with 409, and hashes with werkzeug (scrypt). `POST /api/login-password` gives the **same** error for an unknown email and a wrong password, so attackers can't find out which emails exist.
2. **Email sign-in link (passwordless).** `POST /api/send-otp` asks Supabase Auth to email a link that points to `/auth/callback`. That page reads the `access_token` from the URL fragment and posts it to `POST /api/auth/oauth`. The server verifies it with `supabase.auth.get_user(token)`, creates the user row if needed, and issues a Voya token. (`/api/verify-otp` also supports a 6-digit code if the email template includes one.)
3. **Google:** the same callback path is implemented (`/auth/google` → Supabase → `/auth/callback`), but the Google provider isn't switched on in Supabase yet. It's planned.

### Two details worth explaining
- **Why the implicit flow, not PKCE?** PKCE stores a secret "code verifier" between the redirect and the callback. On serverless those two requests can land on different instances, so the verifier would be lost. With the implicit flow, the token arrives in the URL fragment and the server verifies it directly with Supabase.
- **The shared-client bug (story 16.6):** Supabase Auth calls use a fresh throwaway client (`auth_client()`). Only the database client is shared.

### Redirect rules
- Logged out and opening `/app/...` → `/login?next=/app/...`, returning there after login.
- Logged in and opening `/login` → `/app`.
- `next` is only honoured if it starts with `/app`, so there's no open-redirect vulnerability.

---

## 7. API reference

Every `/api` response is JSON: `{"success": true, …}` or `{"success": false, "error": "<friendly message>"}`. Unknown `/api/*` routes return JSON 404. Unexpected errors are logged and return a generic 500; stack traces never reach the browser.

| Group | Route | Notes |
|---|---|---|
| Auth (public, 10/min per IP) | `POST /api/check-email`, `/api/signup`, `/api/login-password`, `/api/send-otp`, `/api/verify-otp`, `/api/auth/oauth` | All successful logins return `{token, user}` |
| Account | `GET /api/me`, `GET/POST /api/profile`, `POST /api/upload-avatar` | Avatar: PNG/JPG/WEBP/GIF ≤ 2 MB, stored under a hash of the email |
| Trips | `POST /api/save-trip`, `GET /api/get-trips`, `PATCH /api/update-trip-status/<id>`, `DELETE /api/delete-trip/<id>` | Someone else's trip id → 404 (not 403, so ids aren't confirmed to exist) |
| Searches | `GET/DELETE /api/searches` | Last 5 |
| Classic AI | `POST /api/generate-trip` (4/min), `POST /api/chat` (15/min) | The Plan Trip form uses generate-trip; `/api/chat` is no longer used by the UI |
| Memory (v2) | `GET/PUT/DELETE /api/preferences`, `DELETE /api/preferences/<key>`, `GET /api/memory/context` | Context = what the agent knows about you |
| Conversations (v2) | `GET /api/conversations`, `GET/DELETE /api/conversations/<id>` | Owner-only; invalid or foreign id → 404 |
| Agent (v2, 6/min) | `POST /api/agent/chat` (JSON), `POST /api/agent/stream` (SSE), `POST /api/agent/confirm` | Confirm takes `{conversation_id, action: "save_trip"}` |
| Places | `GET /api/places/autocomplete?q=&kind=destination\|departure` (60/min) | Worldwide suggestions for the planner; keeps the Geoapify key server-side |
| Ops | `GET /api/cron/keepalive` | Daily Vercel cron; optional `CRON_SECRET` |

Pages: `/`, `/login`, `/app`, `/app/plan`, `/app/trips`, `/app/explore`, `/app/profile`, `/app/settings`, `/auth/callback`, plus static files. Anything else gets the 404 page.

---

## 8. The AI layer (OpenRouter client)

File: `backend/services/ai.py`. Everything that talks to an LLM goes through `call_openrouter()`.

| Feature | How | Why |
|---|---|---|
| **Model per task** | Itineraries try `OPENROUTER_MODEL` (NVIDIA Nemotron 3 Ultra, free) first; chat and the agent's planning call try `OPENROUTER_CHAT_MODEL` (Nemotron 3.5 Super, free, about 1s) first | Long structured JSON needs a stronger model; short answers need speed |
| **Automatic fallback** | Every request sends a `models` list of up to 3 (plus Gemma 4 31B free as backup); OpenRouter moves to the next one on errors or rate limits | Free models get rate-limited independently of each other |
| **Reasoning off** | `"reasoning": {"enabled": false}` | Hidden "thinking" used the whole token budget and returned empty answers (story 16.2) |
| **JSON mode** | `response_format: json_object` when structure is needed, plus `parse_json()` that tolerates code fences and chatter | Defensive parsing |
| **Typed errors** | `AIError` with reasons: `timeout`, `http 429`, `daily limit`, `empty response`, `malformed response`, `not configured` | Callers decide: retry on empty/malformed, stop on daily limit |
| **Friendly messages** | `user_message(err)`, e.g. "Voya AI has reached today's free usage limit. Please try again tomorrow." | Honest, consistent text everywhere |

---

## 9. The classic planner

The **Plan a trip** form (`PlanForm` → `/api/generate-trip` → `ItineraryView`) now runs on **the same engine as the agent**:

1. Validate: destination, budget, dates (end ≥ start, ≤ 14 days), 1–20 travellers, travel mode (`any | flight | train | bus | car`).
2. Rate limit (4/min), record the search, load the user's context (profile, preferences, recent trips).
3. **Ground it:** search real places (Geoapify) and the forecast (Open-Meteo).
4. **Generate** with `tools/itinerary.generate_itinerary()`. The prompt asks for **realistic** prices for the destination, season, travel mode and group size, and explicitly says *don't bend the numbers to match the budget*.
5. **Budget in code:** the categories are added up with `Decimal`, so the total is the real sum (e.g. ₹47,850), and the UI shows "₹2,150 under your ₹50,000 budget" (or "over" in red). The travel mode relabels the first cost line ("Train tickets", "Bus tickets", "Fuel & tolls").

**Why this changed (good interview story):** the first version told the AI to "make the costs add up to the budget", so a ₹50,000 budget always came back as exactly ₹50,000, which isn't believable. Now the AI only estimates and code does the maths.

**Place search in the form:** destination and departure fields call `/api/places/autocomplete`. Destinations use **Photon** (komoot's OpenStreetMap search, ranked by importance, so "Bali" → the Indonesian province and "Santorini" → Greece); departures are ranked near the visitor using Vercel's `x-vercel-ip-latitude/longitude` headers ("Salem" → Tamil Nadu for someone in India; Geoapify would otherwise rank by the US server's location), while airports come from the curated list with IATA codes. Results are cached for a day and the browser waits 250ms after typing (debounce) to respect the free services' fair use.

## 10. The AI travel agent (LangGraph)

### What it is
A **single-agent, plan-and-execute workflow** built as a LangGraph `StateGraph`:

```
START → load_context → understand → decide ─┬─ (no tools) ──────────────┐
                                           └─ execute_tools → respond ─┴→ persist → END
```
(`respond` handles both branches; `decide → respond` covers clarifying questions, errors and plain answers.)

| Node | Does | Uses the LLM? |
|---|---|---|
| `load_context` | Reads from Supabase: preferences, profile, last 5 trips, last 12 messages, the conversation's draft itinerary | No |
| `understand` | **One** LLM call returns JSON: `intent`, `tools`, `trip` details, `instruction`, `new_budget`, `remember`, `clarification`. Then `clean_plan()` validates every field (unknown tools and intents dropped, dates checked, numbers bounded) | **Yes** |
| `decide` | **Guardrails in code** (list below). Fixes or denies the plan, or turns it into a clarifying question | No |
| `execute_tools` | Runs the tools in a fixed dependency order: remember → places → weather → generate → modify → budget → save. Each tool's failure is caught and recorded on its own step | Only generate/modify |
| `respond` | Plans get a **template** reply with exact numbers (no LLM call). Open questions get **one** grounded LLM answer built only from tool results. If that fails, a template fallback is used | Sometimes |
| `persist` | Saves the user message, the assistant message (with `tool_metadata`: intent, steps, pending action, notes), and the updated draft | No |

### The guardrails (`decide`): the most important part to explain
1. **Intent implies tools:** a `plan_trip` always runs search_places + get_weather + generate_itinerary, even if the model forgot to list them.
2. **Ask instead of guessing:** no destination → "Where would you like to go?"; no duration and no dates → asks; past dates, end before start, or more than 14 days → asks.
3. **Tentative dates are disclosed:** if only a duration is given ("five days"), it plans 30 days from today and says so in the reply.
4. **Defaults are disclosed:** if the number of travellers is missing, it assumes 2 and says so.
5. **Memory fills gaps:** interests and pace come from saved preferences when the message doesn't say.
6. **Follow-ups inherit context:** "Will it rain there?" uses the draft's destination and dates.
7. **No draft, no edit:** modify, budget or save without a plan → "There's no trip plan in this conversation yet."
8. **Save only when asked:** `save_trip` is removed unless the intent is save or the message itself contains save/book/keep wording. Otherwise the reply offers a **Save to My Trips** button (`pending_action`).
9. **Only valid preferences are stored:** `remember` is filtered through the allowlist one key at a time.

### Cost per request
| Request | AI calls |
|---|---|
| Plan a trip | 2 (understand + itinerary) |
| Modify a plan | 2 (understand + modify) |
| Weather / places question | 2 (understand + grounded answer) |
| Save, preferences, clarifying question | 1 |

### Human in the loop (two ways to save)
- **Button:** `POST /api/agent/confirm` → `confirm_save()` saves the draft without any LLM involvement.
- **Typed:** "save it" → the guardrails allow `save_trip` because the user asked in that message.

Either way, `save_itinerary()` must read the row back before the reply says "saved". If it fails, the reply says "I couldn't save the trip … Nothing was saved."

### Streaming (`/api/agent/stream`)
- The Flask route starts the agent in a **worker thread** and passes it an `emit` callback that puts events on a **queue**.
- The response is a generator that yields **Server-Sent Events** from that queue: `conversation` → `step` (running/done/error, with detail such as "12 places found") → `result` (or `error`).
- Every 10 seconds of silence it sends `: keep-alive` so proxies don't close the connection.
- In the browser, `Voya.stream()` reads the body with a `ReadableStream`, splits on blank lines and calls the UI for each event. If streaming isn't supported, it falls back to `/api/agent/chat`.
- This was tested through Vercel on a preview deployment: events arrive separately.

### Dependency injection (why it's testable)
`Deps` holds the database client, the LLM function, each tool and the event emitter, and is passed in through the LangGraph `config`. Tests swap in a scripted fake LLM and fake tools while still using the real database.

### Why no LangGraph checkpointer?
Serverless instances share no memory, so an in-memory checkpointer loses state. A Postgres checkpointer would need a direct database connection. The conversation, messages and draft already live in Supabase, so each request rebuilds the state from there.

### Walkthrough: "Plan a five-day trip to Bali under ₹60,000. I like beaches, cafes and adventure activities."
1. `service.run_turn()` creates a conversation (titled from the message) and builds the initial state with a 110s deadline.
2. `load_context` loads empty history, plus any saved preferences and trips.
3. `understand` gets JSON like `{intent: plan_trip, tools: [search_places, get_weather, generate_itinerary], trip: {destination: Bali, duration_days: 5, budget: "₹60,000", interests: [...]}, remember: {interests: [beaches, cafes], activities: [adventure activities]}}`.
4. `decide` adds `remember_preferences`, sets tentative dates (+30 days, disclosed), sets travellers to 2 (disclosed), and orders the tools.
5. `execute_tools`:
   - remember → merge into `user_preferences`
   - places → Geoapify resolves "Bali" to the province and returns notable places
   - weather → outside the 16-day window, so "No forecast yet … Voya won't guess"
   - generate → the LLM drafts a 5-day plan using the verified places; code validates it, computes the budget, verifies each place on the map and adds distances
6. `respond` (template): "Here's your 5-day Bali plan (… to …) for 2 travellers. Estimated cost: ₹X of your ₹60,000 budget (₹Y left). … N of M stops are verified … Want me to save it?" plus `pending_action: save_trip`.
7. `persist` stores both messages and the draft. Nothing is in `trips` yet.
8. The user clicks **Save to My Trips** → `confirm_save()` → the trip is saved and read back → "Done! Your Bali trip is saved in My Trips."

This exact scenario is an automated test: `tests/test_agent.py::test_plan_trip_end_to_end_with_memory_and_confirmation`.

---

## 11. The tools, one by one

Every tool returns a status (`ok | partial | unavailable | error`) and **never raises for an external failure**, so the agent can say honestly what's missing.

### A. Destination search: `tools/places.py`
- **Resolve:** Geoapify geocoding; prefers real areas (country, state, city) over same-named businesses ("Bali" → the province, not "Bali Island" café).
- **Area:** cities are searched within **15 km of the centre** (administrative "Tokyo" includes islands 100+ km away); larger areas use their boundary.
- **Interests → categories:** e.g. beaches → `beach`, cafes → `catering.cafe`, history → `heritage,tourism.sights`; main sights are always included.
- **Ranking:** the API sorts by proximity, not popularity, so Voya scores places: Wikidata entry +3, website +1, opening hours +1, name not in Latin script −3. It also prefers the OSM English name (`name:en`).
- **Countries:** results are generic, so it returns a hint to search specific cities.

### Place verification: `tools/geo.py` → `verify_place()`
- Looks up each activity name **within the destination's country** (`filter=countrycode:xx`) and **biased to its centre**.
- Counts as verified only if Geoapify reports a **full-name match** on a specific place (amenity/building/street) with confidence ≥ 0.5. A match on just the town doesn't count.
- Real results: Tanah Lot Temple, Senso-ji, Chapora Fort and Baga Beach verified; a made-up café and a ramen branch missing from OpenStreetMap correctly **not** verified.
- Runs in parallel (8 threads, at most 40 lookups), skips transport and generic items like "Check-in".

### B. Weather: `tools/weather.py`
- Open-Meteo daily forecast: conditions (WMO code → "Light rain"), min/max °C, rain chance, plus source and fetch time.
- **Forecast window = today + 15 days.** Dates outside it → `unavailable` without calling the API, with a message that Voya won't guess. Partly outside → `partial`, saying which dates are covered.

### C. Budget: `tools/budget.py`
- `parse_amount()` understands "₹1,00,000", "$2,500", "60k", "1.5 lakh", "Rs 45000", "€1.200" (European thousands), "2500 USD", and rejects negative values.
- `calculate_budget()` uses **`Decimal`** to compute the total, each category's share, remaining (negative = over budget), per day, per person and per person per day.
- `format_amount()`: Indian grouping for INR (₹1,23,45,678).
- The LLM only **estimates** category amounts. Its own "total" is ignored (a test checks this).

### D/E. Itinerary generate and modify: `tools/itinerary.py`
- **Generate:** the prompt includes the verified places, the weather summary (to plan indoor options on rainy days), the user's saved context, pace (relaxed 3–4, balanced 4–5, packed 5–6 activities a day) and a strict JSON schema. The model is told **not** to compute totals or invent opening hours or prices.
- **Validation inside the retry loop:** exact day count, real activity names, allowed icons, numeric costs. Invalid output gets one retry (story 16.7).
- **After the AI:** budget via the budget tool, place verification and **straight-line distances** between consecutive verified stops (haversine, labelled approximate).
- **Modify:** the prompt shows a compact version of the current plan and asks for **only the changed days** as complete day objects. Day numbers are validated, the deep-copied plan gets only those days replaced, only the changed days are re-verified, and the budget is recalculated. Unchanged days stay exactly as they were (tested). "Reduce my budget to ₹45,000" with no other change recalculates without any AI call.

### F. Save trip: `services/trips.py`
- Validates the status, days, destination, date format and size (under 200 KB).
- **De-duplicates:** same user + destination (case-insensitive) + same dates → **update** instead of inserting a second row.
- **Reads the row back** before returning success; otherwise raises `TripError` and nothing is claimed.

---

## 12. Frontend

### Pages
| Page | Files | Highlights |
|---|---|---|
| Landing | `landing/index.html` | Static HTML; CTAs to signup/login |
| Login / Signup | `auth/index.html`, `auth/callback.html` | Password, email sign-in link; redirects to `next` |
| Dashboard | `app/index.html`, `dashboard/Dashboard.jsx`, `dashboard/agent.jsx` | Greeting and real stats, AI search bar (sends to agent), next upcoming trip, **Voya AI agent card**, recent searches |
| Plan Trip | `plantrip/App.jsx`, `PlanForm.jsx`, `ItineraryView.jsx` | Classic form → itinerary; also opens an agent plan via `?conversation=<id>` |
| My Trips | `plantrip/MyTripsView.jsx` | Filters, status changes, delete, open |
| Explore | `explore/ExploreApp.jsx` | Destination grid → planner prefilled |
| Profile | `profile/ProfileApp.jsx` (+ shared `profile/parts.jsx`) | Read-only summary: photo, name, **Edit profile** button, stats, your trips, passport stamps, countries |
| Settings | `settings/SettingsApp.jsx`, `profile/Preferences.jsx` | Edit profile, **Travel preferences**, Recent activity, Account (sign out) |

### The agent card (`dashboard/agent.jsx`)
- Same visual design as the original chat card (header, bubbles, input). It was rewired, not redesigned.
- **Live steps** while working, then the reply with the completed steps and their results.
- **Itinerary preview:** days, dates, travellers, budget line ("₹30,000 est. · ₹10,000 left", red if over), "X of Y stops verified on the map · costs are estimates".
- **Save to My Trips** → `/api/agent/confirm`; then "Saved · View in My Trips".
- **Open full plan** → `/app/plan?conversation=<id>`, which reuses the existing `ItineraryView`. That works because the agent outputs the same itinerary shape (each activity keeps `time/icon/name/note`).
- **History** (past conversations), **New chat**, suggestion chips. The conversation id is kept in `localStorage`, so a refresh restores the chat.

### Travel preferences card (`profile/Preferences.jsx`, shown in Settings)
Chips per list (add/remove), pace selector, budget text. **Save**, **Undo changes**, **Forget all** (with confirmation). Uses `GET/PUT/DELETE /api/preferences`.

### Shared UI and mobile
`dashboard/components.jsx` is the design system (colours `C`, `VBtn`, `VCard`, `VChip`, `VSidebar` with logout, `VNotice`, `useToast`). `shared/app.css` applies only below 860px: the sidebar becomes a top bar and grids stack. Browser tests check there's no horizontal overflow at 390px.

### Client-side storage
| Key | Holds | Trusted by the server? |
|---|---|---|
| `voya_token` | Session JWT | Only after the signature is verified |
| `voya_user_name` | Display name | No |
| `voya_agent_conversation` | Current agent conversation id | No; the server checks ownership (foreign id → 404) |
| `voya_next` (sessionStorage) | Where to return after login | Only `/app…` paths accepted |

---

## 13. Security

| Risk | Mitigation |
|---|---|
| Acting as another user | User identity comes **only** from the signed token; every query filters by it; foreign trip or conversation ids → 404 (tested with two users) |
| Leaked public key | RLS on with no policies + privileges revoked from `anon`/`authenticated`; only the service-role key (server-side) can access data |
| Password attacks | scrypt hashes, minimum 8 characters, same error for unknown email or wrong password, 10/min per IP on auth |
| Secrets in git | `.env` is ignored; `.env.example` has placeholders; every commit's diff is scanned for key patterns before pushing |
| LLM doing something harmful | The LLM can only *choose* from a fixed list of Python tools. It has no shell, no SQL and no arbitrary HTTP. Its plan is validated (`clean_plan`) and filtered by guardrails |
| LLM storing personal data | Preferences are allowlisted (e.g. a passport number is rejected) and visible and deletable by the user |
| LLM claiming false actions | Saves happen in code and are confirmed by reading back; the reply is generated from the tool result |
| Abuse / cost | Per-user rate limits (agent 6/min, generate 4/min, chat 15/min), 2,000-character message limit, 4 MB request limit, 2 MB avatars |
| Open redirect | `next` must start with `/app` |
| Headers | `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `no-store` on the API |

**Known gaps (say these confidently):** tokens can't be revoked before they expire (7 days); there's no email verification for password signups; rate limits are per serverless instance, not global (a shared store like Redis would fix that).

---

## 14. Reliability, performance and the free tier

### Time budgets (Vercel kills functions at 120s)
| Thing | Limit |
|---|---|
| Whole agent turn | 110s deadline carried in the state |
| Itinerary AI attempt | up to 100s; a retry only happens if ≥ 15s remain |
| Planning ("understand") call | ≤ 30s |
| Chat / answer call | ≤ 30s |
| External APIs (Geoapify, Open-Meteo) | 10–15s each, cached in memory (geocode 24h, places 6h, weather 3h) |

### Measured latency (free models)
| Request | Time |
|---|---|
| Chat / planning call | about 0.5–2s |
| Itinerary, 3 / 5 / 7 / 10 days (local) | 22s / 34s / 39s / 45s |
| Itinerary on the live site, 5 / 14 days | 37s / 92s |

Turning off hidden reasoning made itineraries **2–4× faster** (81s → 44s on the same 5-day prompt).

### Free-tier strategy
- **OpenRouter:** 50 free-model requests a day per account (1,000/day after a one-time $10 credit). Hence: 2 AI calls per plan, tests that never call the AI, and an honest "daily limit" message.
- **Geoapify:** 3,000 credits/day. **Open-Meteo:** free, no key.
- **Supabase free projects pause after about a week of inactivity**, so a daily Vercel cron (`/api/cron/keepalive`, 06:00 UTC) runs one tiny query.

---

## 15. Testing and evaluation

| Layer | What | Count / result |
|---|---|---|
| Unit (pytest, no network) | Budget maths and parsing, weather window, place ranking and verification rules, itinerary validation and retries, modify keeping unchanged days, AI payload (model order, fallback, reasoning off), preference validation | Part of the 130 |
| Integration (pytest, real Supabase) | Memory API, privacy between users, cascade delete, save de-duplication and read-back, **the agent end to end** with a scripted LLM (plan → modify → save, failed save not claimed, guardrail questions, daily limit, SSE endpoint) | Part of the 130; all test data is deleted afterwards |
| Live (opt-in, `pytest -m live`) | Real Geoapify and Open-Meteo calls | 3 |
| Browser (Playwright, `e2e/`) | Agent flow: live steps, preview, save, modify, reload, open full plan, history, new chat, search bar, preferences edit/delete, no overflow, no JS errors | 21 checks × desktop and mobile, all passing |
| Site smoke (`e2e/site_smoke.e2e.js`) | Every page on desktop and mobile: console errors, failed requests, overflow, every landing link | Clean |
| Evaluation (`eval/run_agent_eval.py`) | 20 realistic requests with the **real** model: intent accuracy, tool selection, parameter extraction, clarification behaviour, latency; `--full 3` runs complete plans and checks exact day count, budget, verified places | **Not yet run against the real model** (blocked by the daily AI limit) |

**How the fakes work:** the browser tests run `e2e/fake_agent_server.py`, which is the real app with the real database, real Geoapify and real Open-Meteo, where only the LLM is replaced by rules (e.g. "N days in X" → a plan intent). That tests the whole UI and backend without spending AI quota.

**Be honest when asked about model quality:** "The agent's logic and the UI are fully tested. I've written an evaluation set to measure how accurately the real model picks tools; the free tier's daily limit has held that up, so I don't quote accuracy numbers yet." (Update this once the evaluation has run.)

---

## 16. Engineering stories

Use the format **Situation → what I found → fix → result**.

### 16.1 The site went down: "API key expired"
- **Situation:** chat and itineraries started failing with "Voya AI is unavailable".
- **Found:** Vercel logs showed `OpenRouter HTTP 401: API key expired`. OpenRouter keys can have an expiry date.
- **Fix:** new key with no expiration, updated in Vercel, redeployed.
- **Result:** back up. Lesson: read the logs first, and note key expiry in the setup docs.

### 16.2 Empty answers from a free model
- **Situation:** 5-day trips failed after about 109s with "empty response"; short trips worked.
- **Found:** the model (Nemotron) is a *reasoning* model. Its hidden thinking used about 4,800 of the 8,192 output tokens, so long itineraries ran out of room. I measured reasoning off / low / default on the same prompt: 44s / 74s / 81s.
- **Fix:** `reasoning: {enabled: false}`, empty answers now get a retry, and the validator enforces the exact day count (with reasoning off the model once returned 6 days for a 5-day trip).
- **Result:** 3–14-day trips all work, 2–4× faster.

### 16.3 Free models are unreliable in different ways
- **Situation:** Google's Gemma was rate-limited upstream (429); NVIDIA sometimes hung (timeout); one model returned empty text for long outputs; another omitted the cost breakdown.
- **Fix:** probed every free model with the real prompt, then used **different first-choice models per task** (fast for chat, strong for itineraries) and OpenRouter's `models` fallback list (3 models per call).
- **Result:** chat in about 1s; itineraries succeed even when one provider is down (tested by forcing a rate-limited primary).

### 16.4 The daily limit
- **Situation:** during development, testing used up OpenRouter's **50 free requests/day**, which is shared with the live site.
- **Fix:** detect `free-models-per-day` → `AIError("daily limit")` → a clear message to users; tests use fake AIs; the agent design targets 2 calls per request.
- **Result:** users see an honest message instead of a generic error; no more quota burned by tests.

### 16.5 Place data was technically real but useless
- **Situation:** "Bali" resolved to a café called "Bali Island"; Tokyo returned obscure museums with only Japanese names from islands 100 km away.
- **Fix:** prefer area result types, search cities within 15 km, rank by notability (Wikidata/website/hours), prefer English names, filter verification by country and bias to the centre.
- **Result:** Goa → Chapora Fort, Fort Aguada; Paris → Notre-Dame, Conciergerie; Tanah Lot verified.

### 16.6 A security bug in a shared client
- **Situation:** supabase-py's `verify_otp` on a *shared* client swaps that client's auth header to the signed-in user's token, so later queries on the same warm serverless instance would run as that user.
- **Fix:** auth calls use a fresh throwaway client; only the database client is shared (documented in `db()`).

### 16.7 A test caught a real bug
- **Situation:** while writing tests for the itinerary tool, the test "too few days → retry" failed.
- **Found:** the retry only covered unreadable JSON; the day-count check ran after the retry loop, so a structurally wrong plan failed immediately.
- **Fix:** validation moved **inside** the retry loop (`_call_json(…, check=…)`) for both generate and modify.

### 16.8 Deploying a new dependency safely
- **Situation:** Phase 3 added LangGraph, and Python 3.14 on Vercel was untested.
- **Fix:** pushed to a branch to get a **preview deployment**, tested it there (signup, streaming agent endpoint through Vercel), deleted the test user, then merged to production.

### 16.9 A Supabase URL mix-up
- **Situation:** integration tests were skipped with an HTML "Page not found".
- **Found:** that page was Voya's own 404. The local `.env` had the website URL as `SUPABASE_URL`.
- **Fix:** corrected it; the test fixtures skip with a clear reason when the database isn't reachable.

---

## 17. Trade-offs, limitations and what I'd do next

| Decision | Upside | Downside / next step |
|---|---|---|
| Plan-and-execute (1 planning call) instead of a ReAct loop | 2 AI calls per plan; guardrails are deterministic and testable | Less flexible for long multi-step reasoning; with a paid model, a native tool-calling loop would be worth evaluating |
| CDN React + in-browser Babel | No build step; matches the Figma export | Slower first load → move to Vite |
| One Flask function | Simple deploys, no CORS | Long AI calls tie up the function → a background job queue for itineraries |
| In-memory rate limits | Zero infrastructure | Not global → Redis / Upstash |
| Free models only | ₹0 running cost | 50 requests/day, occasional outages → paid fallback or $10 credit |
| Straight-line distances | No extra paid API | Not real travel times → a routing API |
| Old tables keyed by email | Didn't risk working data | Migrate `trips`/`searches` to `user_id` foreign keys |
| JWT in localStorage, 7 days | Simple | No revocation → server-side sessions or short-lived tokens + refresh |

**"Book it all" doesn't book anything.** It saves the trip as Upcoming. Real booking would need partner APIs.

---

## 18. Interview question bank

### Overview
**Q: What does Voya do?**
An AI travel planner. You describe a trip in plain language; an agent searches real places, checks the forecast, writes a day-by-day plan, calculates the budget in code, lets you change it by chatting, and saves it when you confirm. It remembers your preferences.

**Q: What makes it more than "a chatbot wrapped around an LLM"?**
Three things: the agent **chooses and runs real tools** (map data, weather, budget maths, database); **facts come from tools, not the model** (verified places, real forecasts, Decimal totals); and **state lives in a database** (memory, conversations, drafts), with consequential actions gated by the user.

**Q: What's your role / what did you build?**
Answer truthfully about your own work. If you used AI coding tools, say so plainly, then talk about what you decided, reviewed and verified: the architecture choices (plan-and-execute, no checkpointer, the guardrails), the debugging (stories in section 16) and the testing strategy. Interviewers value someone who can explain and defend every line, which is what this guide is for.

### Backend and API
**Q: Why Flask and not FastAPI?**
The existing app was Flask and working. Async would mainly help with many concurrent long requests; here the bottleneck is the LLM, and Vercel scales by instances. Rewriting would add risk with little benefit.

**Q: How do you structure errors?**
`ApiError(message, status)` is raised anywhere and turned into `{success: false, error}`. Unexpected exceptions are logged and return a generic 500. Tools return statuses instead of raising, so one failing tool doesn't break an agent turn.

**Q: How does streaming work on Vercel with Flask?**
The route runs the agent in a thread that pushes events to a queue; the response is a generator yielding SSE lines, with keep-alive comments. It was tested through a Vercel preview, where events arrived separately.

**Q: Why 404 instead of 403 for someone else's trip?**
403 would confirm the id exists. 404 reveals nothing.

### Database
**Q: What's RLS and why enable it with no policies?**
Row Level Security makes Postgres check policies on every row access. With RLS on and no policies, plus revoked grants, the public key can access nothing; only the service-role key (which bypasses RLS) can, and it's server-side only. It's defence in depth in case the public key leaks.

**Q: How do you handle migrations?**
Plain SQL files in the repo, written to be idempotent (`if not exists`, `on conflict`), run in order in the Supabase SQL editor. Integration tests skip with a clear message if a migration is missing.

**Q: How do you prevent duplicate saves?**
`save_itinerary` looks for the same user + destination + dates and updates that row instead of inserting. Tested by saving twice.

### Auth and security
**Q: Walk me through a request's authentication.**
The browser sends `Authorization: Bearer <JWT>`. `@require_auth` verifies the HS256 signature with `APP_SECRET_KEY`, plus issuer, expiry and required claims, then sets `g.email`. Handlers use only `g.email` (and `current_user_id()` for memory tables).

**Q: How do you stop prompt injection from doing damage?**
The model can't execute anything itself. It outputs JSON choosing from fixed tool names; `clean_plan` drops anything unknown; guardrails enforce the rules (e.g. a save requires the user's explicit wording in that message, not the model's). Tools have fixed signatures with validated inputs. The worst case is a bad itinerary, not a data leak.

**Q: Could one user read another's conversation?**
No. Every conversation query filters by id **and** the token's user id. Invalid or foreign ids return 404. There are tests for list, read, delete and confirm across two users.

### AI and the agent
**Q: Why LangGraph?**
It makes the workflow explicit: typed state, named nodes, conditional edges. I can test each node, inject dependencies through `config`, and stream progress. A single "agent loop" would be harder to reason about and to guard.

**Q: Explain your graph.**
load_context (database) → understand (one LLM call returns intent, tools and details) → decide (code guardrails) → either execute_tools or straight to respond → respond (template or grounded answer) → persist.

**Q: Why plan-and-execute rather than ReAct?**
Cost and control. ReAct needs an LLM call per tool step; on a 50-requests/day free tier that's 5–6 calls per trip. Plan-and-execute is 2, and the risky decisions sit in deterministic, testable code.

**Q: How does memory work?**
Lasting preferences go into `user_preferences` (allowlisted, merged); conversations and messages go into their own tables; the current plan lives in `conversations.draft_itinerary`. Each turn reloads preferences, profile, the last 5 trips and the last 12 messages from the database. The model never has to "remember" anything.

**Q: Persistent preference vs trip-specific detail?**
"I'm vegetarian" or "I like a slow pace" → stored. "This trip is ₹60,000 from Dec 10" → belongs to the draft itinerary only. The planning prompt tells the model the difference, and the allowlist enforces which keys can ever be stored.

**Q: How do you keep the model from making things up?**
Places are searched and verified against map data and labelled; weather is only shown from a real forecast; totals are computed in code; the model is told not to invent prices or hours; the reply template uses tool results; and the UI shows what's verified and what's estimated.

**Q: How does modifying an itinerary avoid breaking the rest?**
The model returns only the changed days as complete objects. Code validates the day numbers and replaces just those days in a deep copy, then recalculates the budget. The unchanged days are identical to before (tested).

**Q: What happens when the AI fails mid-request?**
Planning failure → a friendly message and the turn ends cleanly (still saved to history). A tool failure → that step is marked failed and the others continue. Itinerary failure → one retry, then an honest message. Daily limit → "try again tomorrow".

**Q: How did you choose the models?**
Empirically: I sent the real prompts to each free model and measured validity and latency. A fast one for chat and planning, a strong one for long JSON, and fallbacks for availability.

### Frontend
**Q: How did you add the agent without redesigning the UI?**
The new card reuses the existing components and the same header/bubble/input styles. "Open full plan" reuses the existing itinerary page, because the agent produces the same data shape.

**Q: How does the UI know a step finished?**
Each SSE `step` event has a tool name and status; the card updates the matching row (spinner → check, or ✕/–) and shows details like "12 places found".

### Testing
**Q: How do you test something that depends on an LLM?**
Dependency injection. The LLM is a function in `Deps`; tests pass a scripted fake that returns the JSON I want, including broken JSON and errors, while the database is real. The browser tests use the real app with a rule-based LLM. Model quality is measured separately with an evaluation set against the real model.

**Q: What does your evaluation measure?**
Intent accuracy, tool-selection accuracy (after guardrails), parameter extraction (destination, dates, budget amount, pace), whether it asks for clarification when it should, and latency. With `--full`, complete plans are checked for exact day count, budget computed in code, staying within budget, and the percentage of verified places.

### Deployment and ops
**Q: How is it deployed?**
Push to `main` → Vercel builds and deploys production. Python dependencies come from `pyproject.toml`, the entrypoint is `backend.app:app`, `maxDuration` is 120s, and a daily cron is defined in `vercel.json`. Env vars are set in Vercel. New dependencies go to a branch first for a preview deployment.

**Q: How do you debug production?**
`vercel logs` filtered by path or text. That's how I found the expired key, the reasoning issue and the daily limit. Keys are masked when reading logs.

---

## 19. Numbers cheat sheet

| Fact | Value |
|---|---|
| Backend size | about 3,200 lines of Python across app, services, tools and agent |
| Automated tests | 130 pytest (unit + integration) + 3 live API tests |
| Browser tests | Agent flow 21 checks + planner/profile 20 checks, each on desktop (1440px) and mobile (390px), all passing |
| AI calls per trip plan | 2 |
| Free AI quota | 50 requests/day (1,000 with $10 credit) |
| Session token | HS256, 7 days |
| Rate limits | agent 6/min, generate 4/min, chat 15/min per user; auth 10/min per IP |
| Max trip length | 14 days |
| Agent turn deadline | 110s (Vercel limit 120s) |
| Itinerary latency | 22–45s for 3–10 days; 92s for 14 days live |
| Chat latency | about 1s |
| Weather forecast window | today + 15 days (16 days) |
| City search radius | 15 km |
| Place verification | full-name match, confidence ≥ 0.5, ≤ 40 lookups, 8 in parallel |
| Memory loaded per turn | preferences, profile, 5 recent trips, 12 recent messages, draft |
| Message limit | 2,000 characters |
| Uploads | avatars ≤ 2 MB; requests ≤ 4 MB |
| Geoapify free tier | 3,000 credits/day |

---

## 20. Glossary

- **Agent:** an LLM-driven program that decides which actions (tools) to take, not just what text to write.
- **Plan-and-execute:** the model plans all steps in one call; code executes them. Contrast with **ReAct**, which alternates reasoning and one tool call at a time.
- **LangGraph:** a library for building LLM workflows as graphs of nodes over a shared, typed state, with conditional edges.
- **Guardrails:** deterministic code that checks and corrects what the model decided.
- **Human-in-the-loop:** a person must confirm consequential actions (here, saving).
- **Grounding:** making the model answer only from provided facts (tool results).
- **JSON mode:** asking the API to return a valid JSON object.
- **Reasoning tokens:** hidden "thinking" output some models produce before the answer; they count against the output limit.
- **SSE (Server-Sent Events):** a one-way stream from server to browser over HTTP; each event is a `data: …` line followed by a blank line.
- **JWT:** a signed token carrying claims (`sub`, `exp`…); the server can verify it without a database lookup.
- **RLS (Row Level Security):** Postgres feature that applies access policies to every row.
- **Service-role key:** a Supabase key that bypasses RLS; must stay server-side.
- **Idempotent migration:** a script that can run many times with the same result.
- **Haversine:** the formula for the straight-line (great-circle) distance between two coordinates.
- **Decimal:** Python's exact decimal arithmetic; avoids floating-point rounding errors with money.
- **Dependency injection:** passing collaborators (DB, LLM, tools) in from outside so tests can replace them.
- **Fluid Compute:** Vercel's runtime that reuses warm instances for multiple requests.
- **Implicit OAuth flow:** the access token is returned in the URL fragment; no server-side code verifier is needed.
