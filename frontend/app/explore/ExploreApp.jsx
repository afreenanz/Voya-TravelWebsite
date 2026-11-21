// explore/ExploreApp.jsx — Voya Explore destinations
const { useState, useEffect } = React;

// ─── Destinations (names, flags, real landmarks) ────────────────────────────────────────────
const DESTINATIONS = [
  {
    id: 'thailand-beach', destination: 'Thailand', title: 'Bangkok & Beach Escape', category: 'beach',
    flag: '🇹🇭', gradient: 'linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)',
    highlights: ['Grand Palace Bangkok', 'Phi Phi Islands', 'Patong Beach sunset', 'Street food tour'],
  },
  {
    id: 'bali-culture', destination: 'Bali', title: 'Bali Temples & Rice Terraces', category: 'cultural',
    flag: '🇮🇩', gradient: 'linear-gradient(160deg,#A8D8A8 0%,#2E8B57 55%,#1B4332 100%)',
    highlights: ['Tanah Lot Temple', 'Tegallalang Rice Terraces', 'Ubud Monkey Forest', 'Seminyak Beach'],
  },
  {
    id: 'maldives-luxury', destination: 'Maldives', title: 'Overwater Villa Retreat', category: 'beach',
    flag: '🇲🇻', gradient: 'linear-gradient(160deg,#B2EBF2 0%,#00ACC1 55%,#006064 100%)',
    highlights: ['Overwater bungalow', 'Snorkelling with rays', 'Sunset dolphin cruise', 'Spa treatment'],
  },
  {
    id: 'japan-culture', destination: 'Japan', title: 'Tokyo · Kyoto · Osaka Trail', category: 'cultural',
    flag: '🇯🇵', gradient: 'linear-gradient(160deg,#FFD0DA 0%,#E8859C 50%,#0C447C 100%)',
    highlights: ['Shibuya Crossing', 'Arashiyama Bamboo Grove', 'Dotonbori food street', 'Mount Fuji view'],
  },
  {
    id: 'swiss-mountain', destination: 'Switzerland', title: 'Swiss Alps & Lakes', category: 'adventure',
    flag: '🇨🇭', gradient: 'linear-gradient(160deg,#E8F5E9 0%,#43A047 55%,#1B5E20 100%)',
    highlights: ['Jungfraujoch summit', 'Lake Geneva cruise', 'Interlaken adventure', 'Grindelwald hike'],
  },
  {
    id: 'dubai-luxury', destination: 'Dubai', title: 'Dubai Luxury & Desert', category: 'city',
    flag: '🇦🇪', gradient: 'linear-gradient(160deg,#FBE5BD 0%,#F2B650 45%,#87520A 100%)',
    highlights: ['Burj Khalifa At the Top', 'Desert safari & BBQ', 'Dubai Mall & Fountain', 'Gold Souk'],
  },
  {
    id: 'morocco-cultural', destination: 'Morocco', title: 'Marrakech & Sahara', category: 'cultural',
    flag: '🇲🇦', gradient: 'linear-gradient(160deg,#FFCCBC 0%,#E64A19 55%,#8D1010 100%)',
    highlights: ['Jemaa el-Fna square', 'Sahara camel trek', 'Chefchaouen blue city', 'Fes medina'],
  },
  {
    id: 'vietnam-food', destination: 'Vietnam', title: 'Ha Long Bay & Food Trail', category: 'adventure',
    flag: '🇻🇳', gradient: 'linear-gradient(160deg,#FFCDD2 0%,#E53935 55%,#7F0000 100%)',
    highlights: ['Ha Long Bay cruise', 'Hoi An lantern town', 'Hue Imperial Citadel', 'Street food tour'],
  },
  {
    id: 'singapore-city', destination: 'Singapore', title: 'Singapore City & Sentosa', category: 'city',
    flag: '🇸🇬', gradient: 'linear-gradient(160deg,#E3F2FD 0%,#1E88E5 55%,#0D47A1 100%)',
    highlights: ['Gardens by the Bay', 'Universal Studios', 'Marina Bay Sands', 'Hawker food tour'],
  },
  {
    id: 'paris-romantic', destination: 'Paris', title: 'Paris Romantic Getaway', category: 'city',
    flag: '🇫🇷', gradient: 'linear-gradient(160deg,#EDE7F6 0%,#7E57C2 55%,#311B92 100%)',
    highlights: ['Eiffel Tower dinner', 'Louvre Museum', 'Seine river cruise', 'Versailles gardens'],
  },
  {
    id: 'kenya-safari', destination: 'Kenya', title: 'Masai Mara Safari', category: 'adventure',
    flag: '🇰🇪', gradient: 'linear-gradient(160deg,#FFF9C4 0%,#F9A825 55%,#5D4037 100%)',
    highlights: ['Big 5 game drives', 'Hot air balloon safari', 'Maasai village visit', 'Nairobi National Park'],
  },
  {
    id: 'seychelles-honeymoon', destination: 'Seychelles', title: 'Seychelles Honeymoon', category: 'beach',
    flag: '🇸🇨', gradient: 'linear-gradient(160deg,#E0F7FA 0%,#26C6DA 55%,#006064 100%)',
    highlights: ['Anse Source beach', 'Snorkelling in coral bays', 'Island hopping', 'Spa & wellness'],
  },
];

const CATEGORIES = [
  { id: 'all',       label: 'All',           icon: 'globe-2' },
  { id: 'beach',     label: 'Beach',         icon: 'waves' },
  { id: 'adventure', label: 'Adventure',     icon: 'mountain' },
  { id: 'cultural',  label: 'Cultural',      icon: 'landmark' },
  { id: 'city',      label: 'City Break',    icon: 'building-2' },
];

// ─── Destination Card ─────────────────────────────────────────────
function DestinationCard({ pkg, sample }) {
  // Opens the ready-made itinerary; "Customise" starts the planner for this destination.
  const open = () => { window.location.href = `/app/plan?sample=${encodeURIComponent(pkg.id)}`; };
  const customise = () => { window.location.href = `/app/plan?destination=${encodeURIComponent(pkg.destination)}`; };
  const [hv, setHv] = useState(false);

  return (
    <div
      onClick={open}
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      style={{
        background: '#fff', borderRadius: 22, overflow: 'hidden', cursor: 'pointer',
        boxShadow: hv ? '0 12px 32px rgba(12,68,124,0.14)' : '0 2px 10px rgba(12,68,124,0.07)',
        transform: hv ? 'translateY(-4px)' : 'none',
        transition: 'all 220ms cubic-bezier(0.2,0.8,0.2,1)',
      }}>

      {/* Thumbnail */}
      <div className="has-photo" style={{ height: 150, background: pkg.gradient, position: 'relative', overflow: 'hidden' }}>
        <PhotoLayer place={pkg.destination} width={640} />
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 99, fontFamily: C.fb, fontWeight: 600, fontSize: 12, color: '#fff' }}>
          {pkg.flag} {pkg.destination}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 17, color: C.navy, marginBottom: 4 }}>{pkg.title}</div>

        {/* Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {pkg.highlights.slice(0, 4).map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.ocean, flexShrink: 0 }} />
              <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg2 }}>{h}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${C.borderSoft}` }}>
          <div>
            <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3 }}>
              {sample ? `${sample.days.length} days · for 2` : 'Best for'}
            </div>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 15, color: C.navy }}>
              {sample ? `${sample.budget_summary.total_formatted} est.` : CATEGORIES.find(c => c.id === pkg.category)?.label}
            </div>
            <button onClick={e => { e.stopPropagation(); customise(); }} style={{
              border: 0, background: 'none', padding: 0, marginTop: 2, cursor: 'pointer',
              fontFamily: C.fb, fontSize: 12, color: C.ocean, fontWeight: 600,
            }}>Customise →</button>
          </div>
          <button
            onClick={e => { e.stopPropagation(); open(); }}
            style={{
              padding: '10px 18px', borderRadius: 99, border: 0,
              background: C.amber, color: '#fff',
              fontFamily: C.fd, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 6px 18px rgba(239,159,39,0.30)',
              transition: 'all 140ms',
            }}>
            <Icon name="map" size={13} color="#fff" />
            View itinerary
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────
function ExploreApp() {
  const [category, setCategory] = useState('all');
  const [search,   setSearch]   = useState('');
  const [samples,  setSamples]  = useState({});

  useEffect(() => {   // ready-made itineraries, built by scripts/build_explore_samples.py
    fetch('/app/explore/samples.json').then(r => r.json()).then(list => {
      setSamples(Object.fromEntries(list.map(s => [s.id, s])));
    }).catch(() => {});
  }, []);

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const visible = DESTINATIONS.filter(p => {
    const matchCat = category === 'all' || p.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || p.destination.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)
      || p.highlights.some(h => h.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="v-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <VSidebar active="explore" />
      <main className="v-main-flush" style={{ flex: 1, overflowY: 'auto', background: C.cream }}>

        {/* Hero */}
        <div className="m-pad" style={{
          background: `linear-gradient(135deg, #07304F 0%, ${C.navy} 52%, #1A6BB5 100%)`,
          padding: '40px 44px 36px', position: 'relative', overflow: 'hidden',
        }}>
          <svg viewBox="0 0 800 160" width="100%" height="160" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }}>
            <path d="M -20 120 C 160 30, 380 10, 620 70 S 740 130, 840 60" fill="none" stroke="rgba(241,239,232,0.9)" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" />
          </svg>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(241,239,232,0.60)', marginBottom: 8 }}>DISCOVER YOUR NEXT ADVENTURE</div>
            <h1 style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 36, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Explore destinations
            </h1>
            <p style={{ fontFamily: C.fb, fontSize: 15, color: 'rgba(241,239,232,0.70)', margin: '0 0 24px', maxWidth: 520 }}>
              Pick a destination and Voya will plan the whole trip around your dates and budget.
            </p>
            {/* Search */}
            <div style={{ position: 'relative', maxWidth: 420 }}>
              <Icon name="search" size={16} color="rgba(241,239,232,0.50)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search destinations or places…"
                style={{
                  width: '100%', padding: '13px 16px 13px 44px',
                  borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.20)',
                  background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)',
                  color: '#fff', fontFamily: C.fb, fontSize: 14, outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="m-pad" style={{ padding: '20px 44px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => {
            const on = category === cat.id;
            return (
              <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
                padding: '8px 18px', borderRadius: 99,
                border: `1.5px solid ${on ? C.ocean : C.borderDefault}`,
                background: on ? 'rgba(55,138,221,0.10)' : '#fff',
                color: on ? C.ocean : C.fg2,
                fontFamily: C.fd, fontWeight: 600, fontSize: 13,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 140ms',
              }}>
                <Icon name={cat.icon} size={13} color={on ? C.ocean : C.fg3} />
                {cat.label}
              </button>
            );
          })}
          <div style={{ marginLeft: 'auto', fontFamily: C.fb, fontSize: 13, color: C.fg3, display: 'flex', alignItems: 'center' }}>
            {visible.length} destination{visible.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Grid */}
        <div className="m-pad" style={{ padding: '20px 44px 60px' }}>
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 20, color: C.navy, marginBottom: 8 }}>No destinations found</div>
              <div style={{ fontFamily: C.fb, fontSize: 14, color: C.fg3 }}>Try a different search or category.</div>
            </div>
          ) : (
            <div className="m-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {visible.map(pkg => <DestinationCard key={pkg.id} pkg={pkg} sample={samples[pkg.id]} />)}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ExploreApp />);
