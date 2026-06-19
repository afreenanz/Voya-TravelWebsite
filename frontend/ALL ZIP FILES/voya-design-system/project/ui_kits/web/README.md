# Voya · Marketing Website UI kit

Long-form landing page mockup. Open `index.html`.

## Sections

| Section | File | Notes |
|---|---|---|
| Top nav | `HeroSection.jsx` → `NavBar` | Sticky glass-blur header, primary CTA on the right. |
| Hero | `HeroSection.jsx` → `HeroSection` | "Travel more. Plan less." split layout with stylized AI plan card. |
| Features | `PageSections.jsx` → `FeaturesSection` | Six what-you-get cards, 3-up grid. |
| How it works | `PageSections.jsx` → `HowItWorksSection` | Sticky left column, 4 numbered step cards on the right. |
| Destinations | `PageSections.jsx` → `DestinationsSection` | "Trending this week" 4-up tile grid. |
| Pricing | `PageSections.jsx` → `PricingSection` | Three tiers — Wanderer / Pro (highlighted) / Concierge. |
| Final CTA | `PageSections.jsx` → `FinalCTASection` | Navy full-bleed with dashed route motif. |
| Footer | `PageSections.jsx` → `FooterSection` | 4-column navy footer with sub-row legal. |

## Primitives

`VoyaWebUI.jsx`:
- `wColors` — the local color object.
- `WIcon` — Lucide wrapper.
- `WButton` — primary / amber / navy / outline / ghost variants in sm / md / lg sizes; renders as `<a>`.
- `Section` — full-bleed section with maxWidth 1200px content shelf, supports `background="cream|white|navy"`.
- `Eyebrow` — the standard tiny-tracked uppercase label.
- `Logo` — uses `assets/voya-logo-light.png` directly (with cream-tile wrapper for dark surfaces).

## Caveats

- Destination tile imagery is gradient placeholders — replace with real photos from `assets/destinations/` when those exist.
- Pricing numbers and feature breakdowns are interpretations of the brand spec — validate against final tiering.
- All copy follows the Voya tone guide (sentence-case, plain English, no exclamation, second person).
