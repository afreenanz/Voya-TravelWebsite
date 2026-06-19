---
name: voya-design
description: Use this skill to generate well-branded interfaces and assets for Voya, the AI travel operating system. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping marketing pages, in-product screens, decks, and any throwaway mocks that need to wear the Voya brand.
user-invocable: true
---

Read the `README.md` file within this skill first — it is the canonical reference for the brand (tone, palette, type, motion, iconography, content rules). Then explore the other files as needed:

- `colors_and_type.css` — design tokens (CSS variables for color / type / spacing / radii / shadows / motion) plus semantic type classes. Import this into every Voya artifact.
- `assets/` — logos (light + dark), the original brand spec markdown.
- `preview/` — small specimen cards (colors, type, components, route motif, icons). Useful as visual reference.
- `ui_kits/app/` — mobile app components + interactive screens (`HomeScreen`, `SearchScreen`, `TripScreen`, `LiveScreen`, `ProfileScreen`) inside an iOS device frame.
- `ui_kits/web/` — marketing site sections (`NavBar`, `HeroSection`, `FeaturesSection`, `HowItWorksSection`, `DestinationsSection`, `PricingSection`, `FinalCTASection`, `FooterSection`).

When creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out of this folder and create static HTML files for the user to view. When working on production code, copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask a few questions (audience, surface, length, level of polish, variations), and then act as an expert designer — outputting HTML artifacts or production code as appropriate.

A few brand fundamentals you should treat as non-negotiable unless the user explicitly overrides:
- **Palette:** Navy `#0C447C`, Ocean `#378ADD`, Amber `#EF9F27`, Cream `#F1EFE8`, Sky Tint `#E6F2FB`, Ink `#2C2C2A`. No bluish-purple gradients. Amber is the spice — use it on ≤15% of any composition.
- **Type:** Clash Grotesk (display, 400–700) + Plus Jakarta Sans (body, 400–800) + Instrument Serif Italic (accents — sparingly). Sentence case everywhere except ultra-wide-tracked all-caps eyebrows.
- **Shape:** Rounded everything. Pill buttons. Generous corner radii. Soft, blue-tinted shadows. Never sharper than 6px.
- **Voice:** Plain, second-person, calm confidence. "Where to next?" not "Discover your dream destination." The brand promise is *"We make travel easy, so you can enjoy the journey."*
- **Personality:** Adventurous, stress-free, warm + playful, smart, travel-native, comforting.
- **Icons:** Voya's icon style is rounded outline strokes (2.2px, round caps + joins) with selective ocean or amber fills. For utility icons not yet drawn, fall back to **Lucide** via CDN. Three branded glyphs render as full-color illustrations: amber location pin, blue paper plane, sun + wave-in-O.
- **Motif:** A dashed ocean-blue route line (3px stroke, 3/8 dash) is the signature graphic device. Use sparingly — on heroes, key cards, never as ambient decoration.

Do not generate AI imagery, emoji-heavy compositions, mesh gradients, or luxury-serif treatments — those are off-brand.
