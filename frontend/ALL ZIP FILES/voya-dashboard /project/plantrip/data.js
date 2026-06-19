// plantrip/data.js — Voya trip data store
window.TRIPS_DATA = [
  {
    id: 'thailand',
    destination: 'Thailand',
    cities: 'Bangkok · Phuket · Phi Phi',
    flag: '🇹🇭',
    budget: '₹60,000',
    days: 5,
    startDate: 'Jun 12, 2026',
    endDate: 'Jun 17, 2026',
    status: 'upcoming',
    travelers: 2,
    travelStyle: 'Cultural & Food',
    gradient: 'linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)',
    itinerary: [
      {
        day: 1, title: 'Arrive Bangkok', theme: 'Arrival',
        activities: [
          { time: '14:00', icon: 'plane-landing', name: 'Land at Suvarnabhumi Airport', note: 'Terminal D · Grab taxi ₹350 to hotel' },
          { time: '16:30', icon: 'building-2', name: 'Check in – Riva Surya Hotel', note: 'Chao Phraya riverfront · ₹3,200/night' },
          { time: '18:00', icon: 'map-pin', name: 'Grand Palace & Wat Phra Kaew', note: '₹600 entry · Dress code enforced · 2h visit' },
          { time: '20:30', icon: 'utensils', name: 'Yaowarat Street Food Tour', note: "Bangkok's Chinatown · Budget ₹400/person" },
        ]
      },
      {
        day: 2, title: 'Floating Market & Temples', theme: 'Culture & Flavours',
        activities: [
          { time: '07:00', icon: 'sunrise', name: 'Damnoen Saduak Floating Market', note: 'Leave early to beat crowds · 1.5h drive from Bangkok' },
          { time: '11:00', icon: 'landmark', name: 'Wat Pho – Reclining Buddha', note: '₹350 entry · Largest reclining Buddha in Thailand' },
          { time: '13:30', icon: 'utensils', name: 'Thip Samai Pad Thai', note: 'Legendary street food · Long queues · Worth every minute' },
          { time: '19:00', icon: 'shopping-bag', name: 'Asiatique Night Market', note: 'Riverside · Shops open midnight · Free entry' },
        ]
      },
      {
        day: 3, title: 'Ayutthaya Day Trip', theme: 'Ancient Ruins',
        activities: [
          { time: '08:00', icon: 'train-front', name: 'Train to Ayutthaya', note: '₹120 · 1h 30min · Hua Lamphong Station' },
          { time: '10:00', icon: 'landmark', name: 'Wat Mahathat', note: 'Buddha head entwined in tree roots · ₹120 entry' },
          { time: '13:00', icon: 'landmark', name: 'Wat Chaiwatthanaram', note: 'Khmer-style ruins on the Chao Phraya river' },
          { time: '19:00', icon: 'ship', name: 'Riverside Dinner Cruise', note: 'Traditional Thai dinner · ₹800/person · Book ahead' },
        ]
      },
      {
        day: 4, title: 'Bangkok → Phuket', theme: 'Island Arrival',
        activities: [
          { time: '09:30', icon: 'plane-takeoff', name: 'Fly Bangkok to Phuket', note: 'BKK→HKT · 1h 20min · AirAsia ₹2,200' },
          { time: '13:00', icon: 'building-2', name: 'Check in – Kata Beach Resort', note: 'Sea-view room · ₹4,100/night' },
          { time: '15:00', icon: 'circle-dot', name: 'Big Buddha Viewpoint', note: '45m marble statue · Free entry · Panoramic hilltop views' },
          { time: '18:00', icon: 'waves', name: 'Patong Beach Sunset', note: 'Beach bars open at 7pm · Street food stalls nearby' },
        ]
      },
      {
        day: 5, title: 'Phi Phi Islands & Departure', theme: 'Islands & Farewell',
        activities: [
          { time: '08:00', icon: 'ship', name: 'Phi Phi Islands Speedboat Tour', note: '₹1,800/person · Snorkeling gear included' },
          { time: '12:00', icon: 'fish', name: 'Maya Bay – The Beach', note: 'Limited daily entry · Crystal clear water · 30min stop' },
          { time: '16:30', icon: 'utensils', name: 'Farewell Seafood Dinner', note: 'Kata Noi viewpoint restaurant · ₹1,200/person' },
          { time: '20:00', icon: 'plane-takeoff', name: 'Fly Home from Phuket', note: 'HKT departure · Check in 2h before' },
        ]
      },
    ]
  },
  {
    id: 'goa',
    destination: 'Goa',
    cities: 'North Goa · South Goa',
    flag: '🇮🇳',
    budget: '₹25,000',
    days: 4,
    startDate: 'Jul 18, 2026',
    endDate: 'Jul 22, 2026',
    status: 'planning',
    travelers: 3,
    travelStyle: 'Beach & Nightlife',
    gradient: 'linear-gradient(160deg,#F6CD83 0%,#EF9F27 55%,#87520A 100%)',
    itinerary: [
      {
        day: 1, title: 'Arrive North Goa', theme: 'Beach Arrival',
        activities: [
          { time: '11:00', icon: 'plane-landing', name: 'Land at Goa Airport (GOI)', note: 'Taxi to Baga Beach · ₹600' },
          { time: '13:00', icon: 'building-2', name: 'Check in – Baga Beach Resort', note: '₹1,800/night · 5 min walk to beach' },
          { time: '16:00', icon: 'waves', name: 'Baga Beach afternoon', note: 'Sunbeds ₹200 · Water sports from ₹800' },
          { time: '20:00', icon: 'utensils', name: "Britto's Restaurant", note: 'Seafood & live music right on the beach' },
        ]
      },
      {
        day: 2, title: 'Markets & Old Goa', theme: 'Culture & Nightlife',
        activities: [
          { time: '09:00', icon: 'shopping-bag', name: 'Anjuna Flea Market', note: 'Every Wednesday · Boho finds · Bargain hard' },
          { time: '13:00', icon: 'landmark', name: 'Basilica of Bom Jesus', note: 'UNESCO World Heritage · Free entry' },
          { time: '16:00', icon: 'waves', name: 'Calangute Beach', note: 'Water sports ₹800 · Parasailing ₹1,200' },
          { time: '21:00', icon: 'music', name: "Tito's Club", note: "Goa's legendary nightclub · Entry ₹600" },
        ]
      },
      {
        day: 3, title: 'South Goa Day', theme: 'Hidden Beaches',
        activities: [
          { time: '09:00', icon: 'bike', name: 'Rent a scooter', note: '₹300/day · Drive to Palolem 1.5h south' },
          { time: '11:00', icon: 'waves', name: 'Palolem Beach', note: 'Crescent bay · Clear water · Floating huts' },
          { time: '14:00', icon: 'utensils', name: 'Magic Italy Restaurant', note: 'Best pasta in South Goa · ₹600/person' },
          { time: '17:00', icon: 'sunset', name: 'Cabo de Rama Fort Sunset', note: 'Cliff-top ruins · Free · Stunning views' },
        ]
      },
      {
        day: 4, title: 'Last Morning & Departure', theme: 'Farewell',
        activities: [
          { time: '07:00', icon: 'sunrise', name: 'Sunrise at Vagator Beach', note: 'Chapora Fort backdrop · Quiet before crowds' },
          { time: '10:00', icon: 'shopping-bag', name: 'Mapusa Market', note: 'Spices · Cashews · Feni · Load up!' },
          { time: '14:00', icon: 'plane-takeoff', name: 'Fly Home', note: 'GOI departure · Arrive 2h early' },
        ]
      },
    ]
  },
  {
    id: 'dubai',
    destination: 'Dubai',
    cities: 'Downtown · Marina · Desert',
    flag: '🇦🇪',
    budget: '₹90,000',
    days: 5,
    startDate: 'Dec 20, 2025',
    endDate: 'Dec 25, 2025',
    status: 'completed',
    travelers: 2,
    travelStyle: 'Luxury & Culture',
    gradient: 'linear-gradient(160deg,#FBE5BD 0%,#F2B650 45%,#87520A 100%)',
    itinerary: [
      {
        day: 1, title: 'Arrive Dubai', theme: 'Arrival',
        activities: [
          { time: '18:00', icon: 'plane-landing', name: 'Land at Dubai International (DXB)', note: 'Metro Red Line to Marina · ₹180' },
          { time: '20:00', icon: 'building-2', name: 'Address Dubai Marina', note: '₹8,500/night · Pool overlooks the marina' },
          { time: '21:30', icon: 'utensils', name: 'Dubai Marina Walk dinner', note: 'Waterfront restaurants · Good first night' },
        ]
      },
      {
        day: 2, title: 'Downtown & Burj Khalifa', theme: 'Skyline Day',
        activities: [
          { time: '10:00', icon: 'building', name: 'Burj Khalifa – At the Top (124F)', note: 'Book online · ₹2,200 · 90min visit' },
          { time: '13:00', icon: 'shopping-bag', name: 'Dubai Mall', note: "World's largest mall · Aquarium + ice rink inside" },
          { time: '18:00', icon: 'waves', name: 'Dubai Fountain Show', note: 'Every 30 min after sunset · Free · 1,000 water jets' },
          { time: '20:00', icon: 'utensils', name: 'Zuma Restaurant', note: 'Japanese robatayaki · ₹4,500/person · Reserve ahead' },
        ]
      },
      {
        day: 3, title: 'Desert Safari', theme: 'Into the Dunes',
        activities: [
          { time: '14:30', icon: 'map', name: 'Desert Safari 4x4 Pickup', note: '₹3,500 includes dune bashing + BBQ dinner' },
          { time: '17:00', icon: 'sunset', name: 'Golden Dunes at Sunset', note: 'Camel ride · Sandboarding · Falconry show' },
          { time: '19:00', icon: 'utensils', name: 'Bedouin Camp Dinner', note: 'BBQ under the stars · Shisha included' },
        ]
      },
      {
        day: 4, title: 'Old Dubai & Gold Souk', theme: 'Heritage',
        activities: [
          { time: '10:00', icon: 'map-pin', name: 'Al Fahidi Historic District', note: 'Wind towers · Dubai Museum ₹350' },
          { time: '12:00', icon: 'shopping-bag', name: 'Gold & Spice Souk', note: 'Cross Dubai Creek by Abra (₹10) · Bargain!' },
          { time: '15:00', icon: 'landmark', name: 'Jumeirah Mosque', note: 'Guided tour ₹200 · Open to non-Muslims' },
          { time: '19:00', icon: 'utensils', name: 'Pier 7 Sky Dining', note: '7 restaurants · Rooftop · Burj Al Arab backdrop' },
        ]
      },
      {
        day: 5, title: 'Beach Day & Departure', theme: 'Farewell',
        activities: [
          { time: '09:00', icon: 'waves', name: 'Jumeirah Beach morning', note: 'Free beach · Burj Al Arab backdrop for photos' },
          { time: '12:30', icon: 'utensils', name: 'Lunch at Nobu, Atlantis Palm', note: '₹3,800/person · Worth it for the view' },
          { time: '18:00', icon: 'plane-takeoff', name: 'Fly Home', note: 'DXB departure · Emirates lounge if available' },
        ]
      },
    ]
  },
  {
    id: 'japan',
    destination: 'Japan',
    cities: 'Tokyo · Kyoto · Osaka',
    flag: '🇯🇵',
    budget: '₹1,20,000',
    days: 10,
    startDate: 'Mar 25, 2027',
    endDate: 'Apr 4, 2027',
    status: 'wishlist',
    travelers: 2,
    travelStyle: 'Cultural & Scenic',
    gradient: 'linear-gradient(160deg,#FFD0DA 0%,#E8859C 50%,#0C447C 100%)',
    itinerary: [
      {
        day: 1, title: 'Arrive Tokyo', theme: 'Arrival',
        activities: [
          { time: '14:00', icon: 'plane-landing', name: 'Land at Narita Airport', note: 'Narita Express to Shinjuku · ¥3,070' },
          { time: '17:00', icon: 'building-2', name: 'Check in – Shinjuku Granbell', note: '₹4,200/night · Walk to Shinjuku Gyoen' },
          { time: '19:00', icon: 'utensils', name: 'Omoide Yokocho (Memory Lane)', note: 'Tiny alleys of yakitori stalls · Cash only' },
        ]
      },
      {
        day: 2, title: 'Shibuya & Harajuku', theme: 'Urban Tokyo',
        activities: [
          { time: '09:00', icon: 'map-pin', name: 'Meiji Shrine & Forest Walk', note: 'Free · Morning mist through the ancient trees' },
          { time: '11:00', icon: 'map-pin', name: 'Shibuya Scramble Crossing', note: 'Shibuya Sky deck · ₹1,800 · Best views in Tokyo' },
          { time: '14:00', icon: 'shopping-bag', name: 'Harajuku – Takeshita Street', note: 'Crepes · Rainbow cotton candy · Street fashion' },
          { time: '19:00', icon: 'utensils', name: 'Izakaya dinner in Ebisu', note: 'Order everything · ₹1,800/person' },
        ]
      },
      {
        day: 3, title: 'Asakusa & Akihabara', theme: 'Old & New',
        activities: [
          { time: '09:00', icon: 'landmark', name: 'Senso-ji Temple, Asakusa', note: "Tokyo's oldest temple · Arrive before 9am" },
          { time: '11:00', icon: 'shopping-bag', name: 'Nakamise Shopping Street', note: 'Traditional snacks and souvenirs' },
          { time: '14:00', icon: 'map-pin', name: 'Akihabara Electric Town', note: 'Anime · Electronics · Retro games · Nerd heaven' },
          { time: '18:00', icon: 'utensils', name: 'Tsukiji Outer Market', note: 'Sushi for dinner · Tuna sashimi ₹900' },
        ]
      },
      {
        day: 4, title: 'Tokyo → Kyoto', theme: 'Shinkansen Day',
        activities: [
          { time: '09:00', icon: 'train-front', name: 'Shinkansen Tokyo → Kyoto', note: '2h 15min · ¥13,910 · Window seat for Fuji views' },
          { time: '12:00', icon: 'building-2', name: 'Check in – Gion Machiya', note: 'Traditional townhouse stay · ₹5,500/night' },
          { time: '14:00', icon: 'landmark', name: 'Fushimi Inari Shrine', note: '10,000 torii gates · Hike to summit · Free' },
          { time: '19:00', icon: 'utensils', name: 'Kaiseki dinner near Gion', note: 'Traditional multi-course · ₹3,200/person' },
        ]
      },
      {
        day: 5, title: 'Kyoto Temples & Arashiyama', theme: 'Bamboo & Gold',
        activities: [
          { time: '08:00', icon: 'landmark', name: 'Kinkaku-ji (Golden Pavilion)', note: '₹460 · Go early to avoid crowds' },
          { time: '10:30', icon: 'map-pin', name: 'Arashiyama Bamboo Grove', note: 'Free · 10 minutes of pure magic' },
          { time: '13:00', icon: 'ship', name: 'Hozu River Boat Ride', note: '₹1,650 · 2h through forest gorges' },
          { time: '18:00', icon: 'shopping-bag', name: 'Nishiki Market', note: "Kyoto's Kitchen · 130 stalls · Pickles, matcha, street food" },
        ]
      },
    ]
  },
];
