# Voya — Design System

> **Travel more. Plan less.**
> Voya is an AI travel operating system — autonomous planning, booking, in-trip guidance, and adaptive replanning. Not a booking aggregator, not a chatbot, not a PDF generator: a full travel intelligence layer for the modern traveler.

This folder is the source of truth for Voya's visual identity, content style, and UI components. Use it any time you're building Voya screens, decks, mocks, marketing pages, or anything else that wears the brand.

---

## Sources we worked from

| File | What it is |
|---|---|
| `uploads/voya_mdfile.md` → `assets/voya-brand-spec.md` | Original brand concept spec — mission, audience, tone, palette, type pairing, business model. The canonical text source. |
| `uploads/voya_brandlogo.png` → `assets/voya-logo-light.png` | Primary wordmark on cream — for light surfaces. |
| `uploads/voya_brandlogo_2.png` → `assets/voya-logo-dark.png` | Primary wordmark on navy — for dark surfaces. |

No codebase, Figma file, or product screenshots were provided. UI kits were built from the brand spec + logo language. Treat them as **v1 component drafts** — they should be replaced or validated against real product code as soon as it exists.

---

## At a glance — the brand in 60 seconds

- **Tagline:** *Travel more. Plan less.*
- **Brand promise:** *We make travel easy, so you can enjoy the journey.*
- **One-liner positioning:** *Your cute smart travel friend who already planned everything.*
- **Personality (6 keywords):** Adventurous · Stress-free · Warm + playful · Smart · Travel-native · Comforting. **Calm, friendly, adventurous** is the overall tone.
- **Tone:** Like a well-traveled friend who's been everywhere you're going. Speaks plainly, never oversells, never panics.
- **Logo language:** Rounded chunky wordmark; the `o` is a sun + ocean wave, a dashed paper-plane route arcs through and past `voya`. The amber **location pin** is a recurring brand glyph used for map markers and "you are here" states.
- **Palette:** Navy ↔ Ocean Blue, with **Amber Orange** as the warm signature, on a soft **Cream** page. **Sky Tint** is the cool secondary surface.
- **Type:** **Clash Grotesk** (rounded, chunky) for display & CTAs · **Plus Jakarta Sans** (clean) for body & UI · **Instrument Serif Italic** sparingly for editorial accents and pull-quotes.
- **Shapes:** Rounded everything. Pill buttons. Generous corner radii. Soft, blue-tinted shadows.
- **Feel target:** Adventurous and youthful like Airbnb/Duolingo/Headspace. Not luxury, not tech-corporate. **Warm, minimal, postcard energy.**

---

## Index — what's in this folder

| Path | Purpose |
|---|---|
| `README.md` | This file — brand overview + content/visual/iconography fundamentals. |
| `SKILL.md` | Agent Skill entrypoint. Read this if you're a Claude instance. |
| `colors_and_type.css` | The full token layer — CSS variables for color, type, spacing, radii, shadows, motion, plus semantic type classes (`.voya-h1`, `.voya-body`, etc). Import this into every Voya artifact. |
| `assets/` | Brand assets — logos in light & dark, original brand spec markdown. |
| `preview/` | Specimen cards rendered into the Design System tab. Reference, not for production. |
| `ui_kits/app/` | Mobile app UI kit — components + interactive `index.html` showing core screens. |
| `ui_kits/web/` | Marketing website UI kit — landing/product/pricing components + `index.html`. |

---

## CONTENT FUNDAMENTALS

How Voya talks.

### Voice in one sentence
> A well-traveled friend who already knows where you should go and has booked the table.

### Posture & person
- **Second-person, addressing one traveler at a time** ("you'll land at 9:14") — never "users," never "guests."
- **First-person plural is rare** — only when Voya is doing something on your behalf: *"We rebooked you on the 11:40 — same seat row."*
- **Active voice always.** "Voya booked your hotel." Not "Your hotel has been booked."

### Tone settings
- **Calm confidence > excitement.** No exclamation marks except after celebratory moments ("You're in! ✈️" on confirmation only — and even then, use sparingly).
- **Plain English, not travel-blog purple.** Say "cheap flight to Lisbon," not "your unforgettable Iberian getaway awaits."
- **Specific over generic.** Replace adjectives with facts: not "amazing rooftop bar," but "rooftop bar, 6-min walk, opens at 7."
- **Never panics.** When something goes wrong: state the change, state what Voya did, give the user one decision. *"Your 8am flight is delayed 2h. I moved your hotel checkout to 11. Want me to push the museum to Day 3?"*

### Casing
- **Sentence case everywhere.** Buttons, headings, labels. `Plan a trip`, not `Plan A Trip` or `PLAN A TRIP`.
- **Brand wordmark is always lowercase: `voya.`** with the trailing period when set in the wordmark style. In body copy, write **Voya** (capitalized like a proper noun).
- **Tiny eyebrows use ULTRA-WIDE-TRACKED ALL CAPS** — only for section labels like `WHAT YOU GET` or `LIVE NOW`.

### Pronouns & ownership
- The product can be called **Voya** or **we** when describing what it's doing. Lean toward **Voya** when introducing a feature, **we** when reassuring mid-action.
- ✅ "Voya monitors flight prices for you." (feature description)
- ✅ "We pushed your dinner reservation to 8:30." (in-trip update)

### Emoji
- **Sparingly, never as ornament.** A single emoji can lead a section heading or a celebratory state, but body copy is emoji-free.
- **Travel-relevant only:** ✈️ 🗺 🎟 🌊 📍 ☀️ 🌧 — the things Voya actually does or talks about. Not 🚀 ✨ 🎉 corporate-launch emoji.
- Logos and icons do the visual lifting — emoji is a last resort.

### Numbers, time, money
- **Use digits even for small numbers** when the number matters: "3 stops," "6-min walk," "$84/night."
- **Local currency first, with conversion in parentheses if helpful**: `€42 (~$45)`.
- **24-hour time when ambiguous (boarding, schedules), 12-hour when conversational.** Boarding at `09:14`, dinner at `8pm`.

### Microcopy examples

| Where | Voya says | Voya doesn't say |
|---|---|---|
| Empty state | "Where do you want to go?" | "You haven't created any trips yet." |
| Loading | "Looking at 2,400 flights…" | "Loading… Please wait." |
| Confirmation | "Booked. See you in Lisbon." | "Booking confirmation successful." |
| Error | "That fare just sold out — I found you a $12 cheaper one on the same route." | "Error: Unable to complete transaction." |
| Push notif | "Rain on Tuesday — I swapped the hike for the museum." | "Weather alert: precipitation expected." |
| CTA primary | "Plan my trip" / "Book this" / "Show me" | "Get Started" / "Submit" / "Click here" |
| Pricing tier | "Pro — for the people who actually leave." | "Premium subscription tier." |

### What to never write
- ❌ "Unlock," "elevate," "seamlessly," "revolutionize," "game-changing"
- ❌ "Your journey begins here" / any sentence that could be on a luxury cruise brochure
- ❌ Corporate hedging: "may," "might," "could potentially"
- ❌ Apologetic openers: "Sorry, but…" — just say what changed and what's next.

---

## VISUAL FOUNDATIONS

The visual system in one breath: **cream page, navy ink, ocean accents, amber warmth, rounded everything, soft shadows, dashed routes connecting things.**

### Color
The full palette lives in `colors_and_type.css`. The six canonical colors:

| Token | Hex | Role |
|---|---|---|
| `--voya-navy` | `#0C447C` | Headlines, dark surfaces, primary text on cream. |
| `--voya-ocean` | `#378ADD` | Primary accent. Buttons, links, highlights, route lines. |
| `--voya-amber` | `#EF9F27` | Warmth + delight. Pins, highlights, secondary CTA, celebrations. |
| `--voya-cream` | `#F1EFE8` | The warm page. Everything sits on this by default. |
| `--voya-sky` | `#E6F2FB` | Cool secondary surface — soft tiles, illustration backgrounds, hover states. |
| `--voya-ink` | `#2C2C2A` | Body text. Warm near-black, never pure `#000`. |

**Rules of thumb:**
- Cream is the default surface. White (`#FFFFFF`) is reserved for cards / panels floating on cream.
- Navy is the dark mode — large blocks of navy with cream text are on-brand and welcome (see `voya-logo-dark.png`).
- Amber is the spice. Use it on **≤15%** of any composition — for the one pin, the one CTA, the one stat that matters.
- Ocean is the workhorse blue. When in doubt, use ocean for interactive things.
- **Never use bluish-purple gradients.** Stick to ocean → navy if you must gradient (and you usually shouldn't).

### Type
- **Clash Grotesk** for display, headings, CTAs, big numbers. Weights 600–700 for headlines, 500 for soft sub-headings. **Note:** The brand sheet calls for "Clash Grotesk **Rounded**" — that cut is paid and not on Fontshare's free tier yet, so we ship the standard Clash Grotesk variable (still rounded-grotesk in feel, same family). The display token caps at weight 700.
- **Plus Jakarta Sans** for body, labels, captions, UI chrome. 400 for body, 500 for labels, 600 for emphasis, 700 for buttons. Full weight range 400–800.
- **Instrument Serif Italic** for accents — pull-quotes, editorial moments, "Relax, we got this." stickers. Use *sparingly*. Available via `--font-accent` and the `.voya-accent` / `.voya-quote` classes.
- **Letter-spacing:** tight (-0.03em) on display; normal on body; very wide (+0.18em) on ALL-CAPS eyebrows.
- **Line-height:** 1.0–1.05 on display, 1.6 on body — generous breathing room.
- Body never goes below 14px (web) or 13px (mobile dense states).

### Spacing
4-pt grid (`--space-1` = 4px through `--space-24` = 96px). Common rhythms:
- Inside a card: `--space-4` (16px) padding, `--space-3` (12px) between elements.
- Between cards: `--space-4` to `--space-6`.
- Section blocks on web: `--space-16` to `--space-24` of vertical air.

### Backgrounds
- **Default:** flat `--voya-cream`. No noise, no grain.
- **Hero / marketing:** sometimes a soft cream → white wash, with a **single dashed route line** (the brand's signature) curving through the composition. Sometimes a tiny amber pin and/or paper-plane glyph along the route.
- **No stock photography filters.** When photos are used (hotel previews, destinations), they're full-color, warm, sunlit. Never b&w, never desaturated. A subtle warm grade is welcome.
- **No mesh gradients, no glassmorphism, no abstract 3D blobs.**
- The dashed-route motif (2px stroke, 2px dash + 5px gap, ocean blue) is the only graphic flourish that recurs.

### Borders
- Cards on white usually have **no border** — they're separated by shadow.
- Cards on cream get a soft `--border-soft` (8% ink) or no border + shadow.
- Inputs and segmented controls get a `--border-default` (14% ink) hairline.
- **Pill buttons** never get a border in default state. Outlined buttons use a 1.5px navy border.

### Shadows
Soft, blue-tinted (never gray), and always offset downward. Five-step system in tokens:
- `--shadow-xs` — almost imperceptible, for inputs/chips on hover.
- `--shadow-sm` — resting card on cream.
- `--shadow-md` — floating card, popover.
- `--shadow-lg` — modal, big hero card.
- `--shadow-xl` — toast / drag preview.
- `--shadow-amber` — special: amber-tinted glow under the primary CTA on key moments.

**Inner shadow** is rare — only on segmented controls or pressed-in states.

### Corner radii
Rounded is identity. Defaults:
- **Buttons:** pill (`--radius-pill`).
- **Cards:** `--radius-lg` (20px) or `--radius-xl` (28px) for hero cards.
- **Inputs:** `--radius-md` (14px) — slightly less round than buttons so they read as containers.
- **Avatars/badges:** circular or pill.
- **Tiles / small chips:** `--radius-sm` (10px) min.
- **Never use 4px or sharper.** 6px (`--radius-xs`) is the absolute floor, reserved for tiny inline tags.

### Cards
The Voya card recipe:
- White surface on cream page, OR cream-100 surface on white page.
- `--radius-lg` corners.
- `--shadow-sm` at rest, `--shadow-md` on hover, lift 2–4px on `:hover` via translateY.
- `--space-4` to `--space-6` padding.
- Often a small amber dot, ocean chip, or dashed underline as the only color accent.

### Animation
- **Default ease:** `cubic-bezier(0.2, 0.8, 0.2, 1)` — `--ease-out`. Fast-in, soft-out.
- **Bouncy ease (sparingly):** `--ease-bounce` for confirmations, pin-drops, new-itinerary reveals.
- **Durations:** 140ms (micro), 220ms (default), 420ms (page transitions).
- Things **fade + slide up 6–10px** on enter. They **fade + scale down 0.96** on dismiss.
- The dashed-route line is the only thing that gets a longer animation — it **draws on** over ~800ms using `stroke-dasharray` + `stroke-dashoffset`. Use this on hero reveals, never as ambient noise.
- **No spinners that spin forever.** Indeterminate progress uses the route-drawing animation or a 3-dot pulsing wave.

### Hover & press states
- **Hover (button, link, card):** color darkens by ~one step (`ocean → ocean-500`), shadow grows one step, slight lift (`translateY(-2px)`), duration 140ms.
- **Press:** scale to `0.97`, drop shadow one step. Snappy — 100ms in, 220ms out.
- **Focus ring:** 2px ocean ring offset 2px from the element, never the browser default blue.
- **Disabled:** 40% opacity, no shadow, cursor `not-allowed`. Never replace the color — opacity carries the meaning.

### Transparency & blur
- Used **sparingly**, only on overlays.
- Modal scrim: navy at 55% opacity (`--bg-overlay`) with no blur, or 4px blur if behind content needs softening.
- Sticky headers on scroll get a `background: rgba(241, 239, 232, 0.85)` + `backdrop-filter: blur(12px)` — but only when scrolled, not at rest.
- Avoid glassmorphism — frosted panels everywhere is not the Voya look.

### Layout rules
- **Cream is the canvas.** Don't fight it with white full-bleed sections unless you have a reason.
- **Container max-width:** 1200px on web; 392px on mobile mocks (iPhone 14 design width).
- **Generous edge gutters:** 24px on mobile, 32–48px on web.
- **Sticky bottom action bar on mobile** for primary CTAs — pill button with `--shadow-amber` when it matters.
- **No fixed top headers on marketing pages** unless the nav has 5+ items. Let it scroll.

### Imagery color vibe
Warm, sunlit, slightly golden. Real photos of real places — beaches, alleys, food, transit moments. **Always color**, never b&w. Faces are welcome but never the focus (the place is the hero). No stock-photo handshakes, no aerial drone clichés.

---

## ICONOGRAPHY

See the ICONOGRAPHY section in `assets/` reference + below.

### Approach
Voya uses **Lucide** as its icon system. Lucide's stroke-based, rounded-join geometry is a perfect match for the wordmark — same DNA, friendly but precise. We load it from CDN:

```html
<script src="https://unpkg.com/lucide@latest/dist/lucide.min.js"></script>
```

Default icon settings:
- **Size:** 20px in UI chrome, 24px for buttons-with-icon, 32px+ for marketing illustrations.
- **Stroke width:** `2` (Lucide default) for UI, `2.25` for large/marketing.
- **Color:** inherits `currentColor` — so it adopts the text color of its container.
- **Rounded caps/joins** (Lucide default — don't override to `square`).

**Why Lucide (not Material, not Heroicons-solid):** Material is too utilitarian; solid icons feel heavy against Voya's soft type. Lucide's open, rounded stroke style matches the wordmark's energy.

### Branded glyphs
Three icons are **part of the brand**, not the icon set, and should be rendered as full-color SVG/illustrations rather than monoline strokes:
1. **The amber location pin** (`📍` shape, amber fill, white dot center) — used for destinations, the "you are here" marker, the end of the dashed route.
2. **The blue paper-plane / airplane** — start of the dashed route, used on hero illustrations and the splash screen.
3. **The sun + wave** (inside the wordmark `o`) — used as a standalone favicon-style mark, app icon, and section-end ornament.

These three live in `assets/` as standalone PNG/SVG when needed.

### Emoji as icons?
No — emoji are not icons. See Content Fundamentals. The only place emoji appear is occasionally in copy (see emoji rules above).

### Unicode characters
- `·` (middle dot, U+00B7) is allowed as a separator: `Lisbon · 6 days · €1,240`.
- `→` (rightwards arrow, U+2192) is allowed in CTAs and breadcrumbs.
- Avoid `★`, `✦`, `❤` and other Unicode ornaments — use a Lucide icon instead.

### Logos
- `assets/voya-logo-light.png` — on cream/white backgrounds.
- `assets/voya-logo-dark.png` — on navy/dark backgrounds.
- The wordmark should never be recolored, stretched, or have its dashed-route stripped.
- The wordmark **with tagline** is the primary lockup. The wordmark **alone** is the secondary lockup for tight spaces (favicon, app icon, social avatar).

---

## Substitutions & known gaps

- **Display font:** The brand sheet specifies **Clash Grotesk Rounded** — the *Rounded* cut isn't on Fontshare's free tier. We're loading the standard Clash Grotesk variable from Fontshare, which is the same family without the rounded terminals. Visually very close but not identical. If pixel-perfect Rounded matters, license the rounded cut and drop the `.woff2` into `fonts/` then swap to `@font-face`.
- **Body font:** **Plus Jakarta Sans** loads from Google Fonts (free, full weight range).
- **Accent font:** **Instrument Serif** loads from Google Fonts. The Italic style is the only one we use.
- **Icon set:** No bespoke Voya icons exist yet — `preview/iconography.html` shows the *style* (rounded outline + selective ocean/amber fills) using hand-drawn placeholder SVGs. For utility icons, fall back to **Lucide** via CDN (pinned 0.469.0). Flag the bespoke-set build for future work.
- **Logo:** The light and dark wordmarks live in `assets/voya-logo-light.png` and `assets/voya-logo-dark.png` — both extracted from the brand identity sheet.
- **Illustration style:** The brand sheet shows a warm, minimal, rounded postcard style with palm trees, sunsets, suitcases, characters, etc. No illustration library is bundled — flag for asset production. Use ocean/amber/cream/navy color harmony and avoid stock photography clichés.
- **Real product UI:** None was provided, so all UI kit screens are interpretations of the brand. Treat them as a starting target, not a ground truth.

---

## Quick-start for a new artifact

```html
<link rel="stylesheet" href="../colors_and_type.css">
<script src="https://unpkg.com/lucide@latest/dist/lucide.min.js"></script>
<body style="background: var(--bg-page);">
  <h1 class="voya-h1">Where do you want to go?</h1>
  <button class="voya-btn voya-btn--primary">Plan my trip →</button>
</body>
<script>lucide.createIcons();</script>
```

See `ui_kits/app/index.html` and `ui_kits/web/index.html` for richer starting points.
