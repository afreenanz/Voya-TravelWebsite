"""Build the ready-made itineraries shown on the Explore page.

Hand-written sample plans (real, well-known places) → validated and costed by the
same code as AI plans (budget tool: totals in Decimal) → each place checked against
OpenStreetMap via Geoapify (verified flag + address) → frontend/app/explore/samples.json.

Run from the repo root:  python scripts/build_explore_samples.py   (needs GEOAPIFY_API_KEY in .env)
Costs are estimates for 2 travellers from India, in INR.
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.tools import budget, geo  # noqa: E402
from backend.tools.itinerary import enrich_days, normalise_day  # noqa: E402

A = lambda time, name, cat, cost, desc, tip="": {"time": time, "name": name, "category": cat, "estimated_cost": cost,
                                                  "description": desc, "tip": tip}

SAMPLES = [
    {"id": "thailand-beach", "destination": "Thailand", "title": "Bangkok & Beach Escape", "cities": "Bangkok · Phuket",
     "transport": "flight", "costs": {"flights": 56000, "accommodation": 18000, "food": 15000, "activities": 14000, "local_transport": 15000, "misc": 5000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "4 nights · 3-star hotels", "local_transport": "Incl. Bangkok → Phuket flight"},
     "days": [
        ("Arrive in Bangkok", [A("14:00", "Suvarnabhumi Airport", "transport", 0, "Land and take the Airport Rail Link into the city."),
                               A("17:00", "Wat Arun", "culture", 400, "Riverside temple, best at sunset.", "Cover shoulders and knees."),
                               A("20:00", "Asiatique The Riverfront", "food", 1500, "Night market and riverside dinner.")]),
        ("Royal Bangkok", [A("09:00", "Grand Palace", "culture", 1000, "The former royal residence and Wat Phra Kaew.", "Opens 08:30; go early to beat the heat."),
                           A("11:30", "Wat Pho", "culture", 400, "Home of the giant reclining Buddha."),
                           A("15:00", "Chatuchak Weekend Market", "shopping", 1500, "Huge market (weekends only)."),
                           A("19:30", "Yaowarat Road", "food", 1200, "Chinatown street food.")]),
        ("Fly to Phuket", [A("10:00", "Phuket International Airport", "transport", 0, "Short domestic flight south."),
                           A("15:00", "Patong Beach", "beach", 0, "Swim and relax on Phuket's busiest beach."),
                           A("18:30", "Promthep Cape", "nature", 0, "Phuket's famous sunset viewpoint.")]),
        ("Island day", [A("08:00", "Phi Phi Islands", "adventure", 9000, "Speedboat day trip with snorkelling stops.", "Book a tour that includes Maya Bay entry."),
                        A("19:00", "Bangla Road", "nightlife", 1500, "Lively nightlife street in Patong.")]),
        ("Old Town & departure", [A("09:00", "Big Buddha Phuket", "culture", 0, "Hilltop statue with island views."),
                                  A("11:30", "Phuket Old Town", "culture", 800, "Sino-Portuguese shophouses and cafés."),
                                  A("16:00", "Phuket International Airport", "transport", 0, "Fly home.")]),
     ]},
    {"id": "bali-culture", "destination": "Bali", "title": "Bali Temples & Rice Terraces", "cities": "Ubud · Seminyak · Uluwatu",
     "transport": "flight", "costs": {"flights": 60000, "accommodation": 20000, "food": 12000, "activities": 9000, "local_transport": 7000, "misc": 4000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "4 nights · villa + hotel"},
     "days": [
        ("Arrive & Seminyak", [A("13:00", "Ngurah Rai International Airport", "transport", 0, "Land in Denpasar; taxi to Seminyak."),
                               A("17:00", "Seminyak Beach", "beach", 0, "Sunset on the sand."),
                               A("20:00", "Potato Head Beach Club", "food", 3000, "Dinner by the sea.")]),
        ("Ubud", [A("09:00", "Tegallalang Rice Terrace", "nature", 500, "Classic terraced rice fields.", "Go before 10:00 for soft light."),
                  A("12:30", "Sacred Monkey Forest Sanctuary", "nature", 1000, "Temple forest with long-tailed macaques.", "Keep sunglasses and snacks away."),
                  A("16:00", "Ubud Palace", "culture", 0, "Royal palace in the town centre."),
                  A("19:30", "Ubud Art Market", "shopping", 1000, "Crafts and souvenirs.")]),
        ("Temples & waterfalls", [A("08:30", "Tirta Empul", "culture", 600, "Holy spring water temple."),
                                  A("11:30", "Tegenungan Waterfall", "nature", 300, "Easy-to-reach waterfall near Ubud."),
                                  A("17:00", "Tanah Lot", "culture", 700, "Sea temple on a rock, famous at sunset.")]),
        ("Uluwatu", [A("10:00", "Padang Padang Beach", "beach", 300, "Small cove beach between cliffs."),
                     A("16:30", "Uluwatu Temple", "culture", 1000, "Clifftop temple; Kecak fire dance at sunset.", "The dance starts around 18:00."),
                     A("19:30", "Jimbaran Beach", "food", 3000, "Seafood dinner on the sand.")]),
        ("Departure", [A("09:00", "Nusa Dua Beach", "beach", 0, "Calm water for a last swim."),
                       A("14:00", "Ngurah Rai International Airport", "transport", 0, "Fly home.")]),
     ]},
    {"id": "maldives-luxury", "destination": "Maldives", "title": "Overwater Villa Retreat", "cities": "Malé · South Malé Atoll",
     "transport": "flight", "costs": {"flights": 50000, "accommodation": 75000, "food": 30000, "activities": 20000, "local_transport": 30000, "misc": 5000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "3 nights · overwater villa (mid-range resort)", "local_transport": "Speedboat transfers to the resort"},
     "days": [
        ("Arrive & resort", [A("12:00", "Velana International Airport", "transport", 0, "Land in Malé; resort speedboat transfer."),
                             A("16:00", "House reef snorkelling", "adventure", 0, "Snorkel straight from your villa."),
                             A("19:30", "Resort beach dinner", "food", 8000, "Dinner on the sand.")]),
        ("Ocean day", [A("09:00", "Manta ray & turtle snorkel trip", "adventure", 9000, "Boat trip to snorkel spots."),
                       A("15:00", "Spa treatment", "relaxation", 7000, "Over-water spa session."),
                       A("18:00", "Sunset dolphin cruise", "nature", 4000, "Dolphins often swim alongside at dusk.")]),
        ("Malé visit", [A("10:00", "Malé Friday Mosque", "culture", 0, "Coral-stone mosque from 1658.", "Dress modestly."),
                        A("11:30", "Malé Local Market", "shopping", 500, "Fish market and local produce."),
                        A("15:00", "Sandbank picnic", "beach", 0, "Afternoon on a sandbank near the resort.")]),
        ("Departure", [A("09:00", "Sunrise kayak", "adventure", 0, "Calm morning paddle in the lagoon."),
                       A("13:00", "Velana International Airport", "transport", 0, "Speedboat back and fly home.")]),
     ]},
    {"id": "japan-culture", "destination": "Japan", "title": "Tokyo · Kyoto · Osaka Trail", "cities": "Tokyo · Kyoto · Osaka",
     "transport": "flight", "costs": {"flights": 90000, "accommodation": 45000, "food": 30000, "activities": 15000, "local_transport": 45000, "misc": 8000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "5 nights · business hotels", "local_transport": "Shinkansen + metro passes"},
     "days": [
        ("Tokyo", [A("10:00", "Senso-ji", "culture", 0, "Tokyo's oldest temple in Asakusa."),
                   A("13:00", "Tokyo Skytree", "sightseeing", 6000, "City views from 350 m."),
                   A("18:00", "Shibuya Crossing", "sightseeing", 0, "The world's busiest crossing.")]),
        ("Modern Tokyo", [A("09:00", "Meiji Jingu", "culture", 0, "Forest shrine near Harajuku."),
                          A("11:00", "Takeshita Street", "shopping", 1500, "Harajuku street fashion and crêpes."),
                          A("15:00", "teamLab Planets", "sightseeing", 6000, "Immersive digital art.", "Book timed tickets online."),
                          A("19:30", "Shinjuku Omoide Yokocho", "food", 3000, "Tiny yakitori bars.")]),
        ("Kyoto", [A("09:00", "Fushimi Inari-taisha", "culture", 0, "Thousands of red torii gates.", "Start early; the upper trail is quieter."),
                   A("13:00", "Kinkaku-ji", "culture", 1000, "The Golden Pavilion."),
                   A("17:00", "Gion", "culture", 0, "Historic geisha district at dusk.")]),
        ("Arashiyama", [A("08:30", "Arashiyama Bamboo Grove", "nature", 0, "Walk through towering bamboo."),
                        A("10:30", "Tenryu-ji", "culture", 1000, "Zen temple and garden."),
                        A("15:00", "Kiyomizu-dera", "culture", 800, "Wooden temple terrace over Kyoto.")]),
        ("Osaka", [A("10:00", "Osaka Castle", "culture", 1200, "Castle museum and park."),
                   A("15:00", "Kuromon Market", "food", 2500, "Seafood and street snacks."),
                   A("19:00", "Dotonbori", "food", 3000, "Neon canal street and takoyaki.")]),
        ("Departure", [A("09:00", "Shinsekai", "food", 1500, "Retro district for kushikatsu breakfast-lunch."),
                       A("14:00", "Kansai International Airport", "transport", 0, "Fly home.")]),
     ]},
    {"id": "swiss-mountain", "destination": "Switzerland", "title": "Swiss Alps & Lakes", "cities": "Zurich · Lucerne · Interlaken",
     "transport": "flight", "costs": {"flights": 110000, "accommodation": 64000, "food": 40000, "activities": 50000, "local_transport": 70000, "misc": 10000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "4 nights · 3-star hotels", "local_transport": "Swiss Travel Pass (2 people)"},
     "days": [
        ("Zurich", [A("11:00", "Zurich Old Town", "culture", 0, "Lanes of the Altstadt and Grossmünster."),
                    A("15:00", "Lake Zurich", "nature", 1500, "Lake cruise (covered by the Swiss Travel Pass)."),
                    A("19:00", "Bahnhofstrasse", "shopping", 0, "Evening walk on the famous shopping street.")]),
        ("Lucerne", [A("09:30", "Chapel Bridge", "culture", 0, "Medieval covered wooden bridge."),
                     A("11:00", "Lion Monument", "culture", 0, "Carved rock memorial."),
                     A("14:00", "Mount Pilatus", "adventure", 12000, "Cogwheel railway and cable car to the summit.")]),
        ("Interlaken", [A("10:00", "Harder Kulm", "sightseeing", 5000, "Funicular viewpoint over two lakes."),
                        A("14:00", "Lake Brienz", "nature", 0, "Turquoise lake boat ride."),
                        A("17:00", "Höhematte Park", "relaxation", 0, "Meadow with views of the Jungfrau.")]),
        ("Jungfrau region", [A("08:00", "Jungfraujoch", "adventure", 30000, "Train to the 'Top of Europe' at 3,454 m.", "Check the summit webcam for weather first."),
                             A("16:00", "Grindelwald", "nature", 0, "Mountain village walk.")]),
        ("Departure", [A("09:00", "Lauterbrunnen", "nature", 0, "Valley of 72 waterfalls."),
                       A("15:00", "Zurich Airport", "transport", 0, "Train to the airport and fly home.")]),
     ]},
    {"id": "dubai-luxury", "destination": "Dubai", "title": "Dubai Luxury & Desert", "cities": "Downtown · Marina · Desert",
     "transport": "flight", "costs": {"flights": 35000, "accommodation": 24000, "food": 16000, "activities": 18000, "local_transport": 6000, "misc": 6000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "3 nights · 4-star hotel"},
     "days": [
        ("Downtown", [A("15:00", "Dubai Mall", "shopping", 0, "One of the world's largest malls."),
                      A("18:00", "Burj Khalifa", "sightseeing", 8000, "'At the Top' observation deck.", "Sunset slots cost more; book ahead."),
                      A("20:00", "Dubai Fountain", "sightseeing", 0, "Evening fountain show.")]),
        ("Old Dubai", [A("09:30", "Al Fahidi Historical Neighbourhood", "culture", 0, "Wind-tower houses and museums."),
                       A("11:30", "Dubai Creek", "culture", 100, "Cross on an abra water taxi."),
                       A("12:30", "Gold Souk", "shopping", 0, "Traditional gold market."),
                       A("15:00", "Desert safari", "adventure", 8000, "Dune bashing, camel ride and BBQ dinner.")]),
        ("Marina & beach", [A("10:00", "Jumeirah Beach", "beach", 0, "Swim with Burj Al Arab views."),
                            A("15:00", "Dubai Marina", "sightseeing", 0, "Waterfront promenade."),
                            A("19:00", "Dubai Frame", "sightseeing", 2000, "Views of old and new Dubai.")]),
        ("Departure", [A("10:00", "Museum of the Future", "sightseeing", 0, "Iconic building (exterior; tickets optional)."),
                       A("14:00", "Dubai International Airport", "transport", 0, "Fly home.")]),
     ]},
    {"id": "morocco-cultural", "destination": "Morocco", "title": "Marrakech & Sahara", "cities": "Marrakech · Merzouga · Fes",
     "transport": "flight", "costs": {"flights": 90000, "accommodation": 24000, "food": 14000, "activities": 30000, "local_transport": 18000, "misc": 6000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "4 nights · riads + desert camp", "activities": "Incl. 2-day Sahara tour"},
     "days": [
        ("Marrakech", [A("15:00", "Jardin Majorelle", "nature", 1500, "Cobalt-blue garden and Berber museum."),
                       A("18:00", "Jemaa el-Fnaa", "food", 1200, "Main square: food stalls and performers.")]),
        ("Medina", [A("09:30", "Bahia Palace", "culture", 600, "19th-century palace and courtyards."),
                    A("11:30", "Koutoubia Mosque", "culture", 0, "Landmark minaret (exterior)."),
                    A("14:00", "Souk Semmarine", "shopping", 2000, "Main souk for crafts and spices.")]),
        ("Into the Sahara", [A("07:00", "Aït Benhaddou", "culture", 300, "Fortified clay village en route."),
                             A("17:00", "Erg Chebbi", "adventure", 15000, "Camel trek to a desert camp at sunset.", "Bring a warm layer for the night.")]),
        ("Fes", [A("10:00", "Fes el Bali", "culture", 0, "Car-free medieval medina."),
                 A("12:00", "Chouara Tannery", "culture", 300, "Historic leather tannery."),
                 A("15:00", "Bou Inania Madrasa", "culture", 400, "Ornate 14th-century school.")]),
        ("Departure", [A("09:00", "Bab Bou Jeloud", "culture", 0, "The Blue Gate of Fes."),
                       A("13:00", "Fès–Saïs Airport", "transport", 0, "Fly home via Casablanca.")]),
     ]},
    {"id": "vietnam-food", "destination": "Vietnam", "title": "Ha Long Bay & Food Trail", "cities": "Hanoi · Ha Long · Hoi An",
     "transport": "flight", "costs": {"flights": 40000, "accommodation": 16000, "food": 10000, "activities": 22000, "local_transport": 16000, "misc": 4000},
     "notes": {"flights": "Return flights from India (2 people)", "local_transport": "Incl. Hanoi → Da Nang flight", "activities": "Incl. overnight Ha Long cruise"},
     "days": [
        ("Hanoi", [A("14:00", "Hoan Kiem Lake", "sightseeing", 0, "Lake and Ngoc Son Temple."),
                   A("16:00", "Hanoi Old Quarter", "culture", 0, "36 streets of trades and cafés."),
                   A("19:00", "Hanoi street food tour", "food", 2500, "Pho, bun cha and egg coffee.")]),
        ("Ha Long Bay", [A("08:00", "Ha Long Bay", "nature", 18000, "Overnight cruise among limestone islands.", "Pick a cruise with kayaking included."),
                         A("16:00", "Sung Sot Cave", "nature", 0, "Huge cave on Bo Hon island.")]),
        ("Back to Hanoi", [A("12:00", "Temple of Literature", "culture", 300, "Vietnam's first university."),
                           A("15:00", "Ho Chi Minh Mausoleum", "culture", 0, "Ba Dinh Square (check opening days)."),
                           A("19:00", "Hanoi Train Street", "sightseeing", 300, "Café-lined railway lane.")]),
        ("Hoi An", [A("10:00", "Hoi An Ancient Town", "culture", 600, "UNESCO trading port."),
                    A("15:00", "An Bang Beach", "beach", 0, "Relaxed beach near town."),
                    A("19:00", "Japanese Covered Bridge", "culture", 0, "Lantern-lit old town at night.")]),
        ("Departure", [A("09:00", "Marble Mountains", "nature", 400, "Caves and pagodas near Da Nang."),
                       A("14:00", "Da Nang International Airport", "transport", 0, "Fly home.")]),
     ]},
    {"id": "singapore-city", "destination": "Singapore", "title": "Singapore City & Sentosa", "cities": "Marina Bay · Sentosa",
     "transport": "flight", "costs": {"flights": 35000, "accommodation": 30000, "food": 14000, "activities": 20000, "local_transport": 4000, "misc": 5000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "3 nights · 3-star hotel"},
     "days": [
        ("Marina Bay", [A("14:00", "Merlion Park", "sightseeing", 0, "Singapore's icon by the bay."),
                        A("17:00", "Gardens by the Bay", "nature", 3500, "Supertrees, Cloud Forest and Flower Dome."),
                        A("19:45", "Garden Rhapsody", "sightseeing", 0, "Free light show at the Supertree Grove.")]),
        ("Sentosa", [A("10:00", "Universal Studios Singapore", "adventure", 14000, "Theme park day."),
                     A("18:00", "Siloso Beach", "beach", 0, "Sunset on Sentosa.")]),
        ("Neighbourhoods", [A("09:00", "Chinatown", "culture", 0, "Buddha Tooth Relic Temple and lanes."),
                            A("12:00", "Maxwell Food Centre", "food", 800, "Hawker centre: chicken rice."),
                            A("15:00", "Little India", "culture", 0, "Temples and spice shops."),
                            A("19:00", "Clarke Quay", "nightlife", 2500, "Riverside dinner and drinks.")]),
        ("Departure", [A("09:00", "Jewel Changi Airport", "sightseeing", 0, "Rain Vortex waterfall before your flight.", "Arrive 3 hours early to enjoy it.")]),
     ]},
    {"id": "paris-romantic", "destination": "Paris", "title": "Paris Romantic Getaway", "cities": "Paris · Versailles",
     "transport": "flight", "costs": {"flights": 100000, "accommodation": 56000, "food": 35000, "activities": 18000, "local_transport": 8000, "misc": 8000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "4 nights · 3-star hotel"},
     "days": [
        ("Arrive & the Seine", [A("15:00", "Notre-Dame de Paris", "culture", 0, "Cathedral on Île de la Cité."),
                                A("18:30", "Seine river cruise", "sightseeing", 3000, "Evening cruise past the monuments.")]),
        ("Icons", [A("09:00", "Louvre Museum", "culture", 4000, "Mona Lisa and much more.", "Book a timed entry."),
                   A("14:00", "Jardin des Tuileries", "nature", 0, "Gardens between the Louvre and Concorde."),
                   A("16:00", "Arc de Triomphe", "sightseeing", 3000, "Rooftop view over the Champs-Élysées."),
                   A("20:00", "Eiffel Tower", "sightseeing", 5000, "Summit at night.")]),
        ("Versailles", [A("09:00", "Palace of Versailles", "culture", 4000, "Hall of Mirrors and gardens.", "Closed on Mondays."),
                        A("18:00", "Le Marais", "food", 4000, "Dinner in the historic quarter.")]),
        ("Montmartre", [A("10:00", "Sacré-Cœur", "culture", 0, "Basilica on Montmartre hill."),
                        A("12:00", "Place du Tertre", "culture", 0, "Artists' square."),
                        A("15:00", "Musée d'Orsay", "culture", 3000, "Impressionist masterpieces.")]),
        ("Departure", [A("09:00", "Le Bon Marché", "shopping", 0, "Historic department store."),
                       A("14:00", "Paris Charles de Gaulle Airport", "transport", 0, "Fly home.")]),
     ]},
    {"id": "kenya-safari", "destination": "Kenya", "title": "Masai Mara Safari", "cities": "Nairobi · Masai Mara",
     "transport": "flight", "costs": {"flights": 75000, "accommodation": 72000, "food": 8000, "activities": 100000, "local_transport": 30000, "misc": 6000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "4 nights · safari camp, full board", "activities": "Mara park fees (2 people, 3 days)", "local_transport": "Safari vehicle + driver-guide"},
     "days": [
        ("Nairobi", [A("14:00", "David Sheldrick Elephant Orphanage", "nature", 2000, "Baby elephant visiting hour.", "Visiting hour is 11:00–12:00; book ahead."),
                     A("16:00", "Giraffe Centre", "nature", 1500, "Feed Rothschild's giraffes.")]),
        ("Into the Mara", [A("08:00", "Great Rift Valley viewpoint", "nature", 0, "Viewpoint on the drive west."),
                           A("16:00", "Masai Mara National Reserve", "adventure", 0, "Afternoon game drive.")]),
        ("Game drives", [A("06:30", "Masai Mara National Reserve", "adventure", 0, "Full-day game drive for the Big Five."),
                         A("13:00", "Mara River", "nature", 0, "Hippos and crocodiles (river crossings Jul–Oct).")]),
        ("Maasai culture", [A("07:00", "Masai Mara National Reserve", "adventure", 0, "Morning game drive."),
                            A("15:00", "Maasai village visit", "culture", 2000, "Meet a Maasai community.")]),
        ("Departure", [A("08:00", "Nairobi National Park", "nature", 0, "Short drive if time allows."),
                       A("15:00", "Jomo Kenyatta International Airport", "transport", 0, "Fly home.")]),
     ]},
    {"id": "seychelles-honeymoon", "destination": "Seychelles", "title": "Seychelles Island Hopping", "cities": "Mahé · Praslin · La Digue",
     "transport": "flight", "costs": {"flights": 80000, "accommodation": 60000, "food": 30000, "activities": 15000, "local_transport": 15000, "misc": 6000},
     "notes": {"flights": "Return flights from India (2 people)", "accommodation": "4 nights · guesthouses", "local_transport": "Inter-island ferries"},
     "days": [
        ("Mahé", [A("13:00", "Beau Vallon", "beach", 0, "Mahé's main swimming beach."),
                  A("17:00", "Victoria Market", "shopping", 500, "Sir Selwyn Selwyn-Clarke Market in the capital.")]),
        ("Praslin", [A("09:00", "Vallée de Mai", "nature", 7000, "UNESCO palm forest with the coco de mer.", "Morning is best for spotting the black parrot."),
                     A("14:00", "Anse Lazio", "beach", 0, "One of the world's most beautiful beaches.")]),
        ("La Digue", [A("09:00", "Anse Source d'Argent", "beach", 2000, "Granite boulders and turquoise water.", "Rent a bicycle; it's the way to get around."),
                      A("15:00", "Grand Anse", "beach", 0, "Wild beach (strong currents; don't swim).")]),
        ("Snorkel day", [A("09:00", "Curieuse Island", "adventure", 5000, "Giant tortoises and snorkelling."),
                         A("15:00", "Côte d'Or", "beach", 0, "Calm afternoon swim.")]),
        ("Departure", [A("10:00", "Mahé", "transport", 0, "Ferry back to Mahé."),
                       A("15:00", "Seychelles International Airport", "transport", 0, "Fly home.")]),
     ]},
]


def build():
    out = []
    for s in SAMPLES:
        days = [normalise_day({"title": title, "activities": acts}, i, "INR") for i, (title, acts) in enumerate(s["days"], start=1)]
        try:
            dest = geo.resolve_destination(s["destination"])
        except geo.ToolUnavailable:
            dest = None
        enrich_days(days, dest)
        res = budget.calculate_budget(s["costs"], days=len(days), travelers=2, currency="INR",
                                      labels={"flights": "Flights"})
        assert res["status"] == "ok", res
        v = sum(a.get("verified", False) for d in days for a in d["activities"]), sum(len(d["activities"]) for d in days)
        out.append({"id": s["id"], "destination": s["destination"], "title": s["title"], "cities": s["cities"],
                    "transport": s["transport"], "travelers": 2, "days": days, "budget_summary": res,
                    "cost_breakdown": budget.to_cost_breakdown(res, s.get("notes")),
                    "verification": {"verified": v[0], "total": v[1]}})
        print(f"{s['destination']:12} {len(days)} days · total {res['total_formatted']:>10} · {v[0]}/{v[1]} places verified")
    path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "app", "explore", "samples.json")
    with open(path, "w") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print("wrote", path)


if __name__ == "__main__":
    build()
