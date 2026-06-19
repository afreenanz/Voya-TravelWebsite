# Voya · Mobile App UI kit

Click-thru recreation of the core Voya app, designed to feel like a real day in the product. Open `index.html`.

## Screens

| Screen | File | What it shows |
|---|---|---|
| Explore (home) | `HomeScreen.jsx` | Greeting, AI search prompt, mood chips, live trip strip, trending destinations grid. |
| Plan a trip (search) | `SearchScreen.jsx` | AI prompt input (textarea), constraint chips, suggested prompts, primary CTA. |
| Trip itinerary | `TripScreen.jsx` | Day picker, weather hero, vertical timeline of stops with booked/Voya-guide badges. |
| Live companion | `LiveScreen.jsx` | Stylized map with you-are-here, dynamic replan alert, next stop, daily budget tracker. |
| You / Trips | `ProfileScreen.jsx` | Profile header with stats, full trip journal with status chips. |

## Components

`VoyaUI.jsx` — `voyaColors`, `Icon` (Lucide wrapper), `VoyaButton`, `VoyaCard`, `VoyaChip`, `VoyaAvatar`, `VoyaSectionHeader`, `VoyaRoute` (dashed brand path), `VoyaTabBar`, `VoyaScreenHeader`.

`ios-frame.jsx` — iOS device bezel + status bar (starter component).

## Click-thru paths

- Home → tap the big search → Search → tap **Plan my trip** → Trip itinerary.
- Home → tap the live trip strip → Trip itinerary.
- Bottom tab bar swaps Explore / Trips / Live / You.

## Caveats

- All UI here is an **interpretation** of the brand spec; no real Voya product code was provided. Treat as a v1 mock — replace anything that diverges from the real product as soon as it exists.
- The map view is a stylized illustration, not a real map tile system. In production, drop in Mapbox / MapLibre with the Voya color treatment (cream land, ocean water, navy roads, amber pins).
- Real destination photos should replace the gradient hero cards in `HomeScreen.jsx`.
