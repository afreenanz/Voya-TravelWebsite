// explore/ExploreApp.jsx — Voya Explore Packages
const { useState, useEffect } = React;

// ─── Packages data ────────────────────────────────────────────
const PACKAGES = [
  {
    id: 'thailand-beach', destination: 'Thailand', title: 'Bangkok & Beach Escape',
    duration: '7D / 6N', price: '₹45,000', perPerson: true, category: 'beach',
    flag: '🇹🇭', gradient: 'linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)',
    highlights: ['Grand Palace Bangkok', 'Phi Phi Islands', 'Patong Beach sunset', 'Street food tour'],
    includes: ['Flights', 'Hotels', 'Transfers', 'Breakfast'],
    rating: 4.8, reviews: 234,
  },
  {
    id: 'bali-culture', destination: 'Bali', title: 'Bali Temples & Rice Terraces',
    duration: '6D / 5N', price: '₹38,000', perPerson: true, category: 'cultural',
    flag: '🇮🇩', gradient: 'linear-gradient(160deg,#A8D8A8 0%,#2E8B57 55%,#1B4332 100%)',
    highlights: ['Tanah Lot Temple', 'Tegallalang Rice Terraces', 'Ubud Monkey Forest', 'Seminyak Beach'],
    includes: ['Flights', 'Villas', 'Breakfast', 'Temple tour'],
    rating: 4.9, reviews: 318,
  },
  {
    id: 'maldives-luxury', destination: 'Maldives', title: 'Overwater Villa Retreat',
    duration: '5D / 4N', price: '₹1,20,000', perPerson: true, category: 'beach',
    flag: '🇲🇻', gradient: 'linear-gradient(160deg,#B2EBF2 0%,#00ACC1 55%,#006064 100%)',
    highlights: ['Overwater bungalow', 'Snorkelling with rays', 'Sunset dolphin cruise', 'Spa treatment'],
    includes: ['Flights', 'Overwater villa', 'All meals', 'Water sports'],
    rating: 5.0, reviews: 89,
  },
  {
    id: 'japan-culture', destination: 'Japan', title: 'Tokyo · Kyoto · Osaka Trail',
    duration: '10D / 9N', price: '₹1,05,000', perPerson: true, category: 'cultural',
    flag: '🇯🇵', gradient: 'linear-gradient(160deg,#FFD0DA 0%,#E8859C 50%,#0C447C 100%)',
    highlights: ['Shibuya Crossing', 'Arashiyama Bamboo Grove', 'Dotonbori food street', 'Mount Fuji view'],
    includes: ['Flights', 'Hotels', 'JR Rail Pass', 'Breakfast'],
    rating: 4.9, reviews: 412,
  },
  {
    id: 'swiss-mountain', destination: 'Switzerland', title: 'Swiss Alps & Lakes',
    duration: '8D / 7N', price: '₹1,65,000', perPerson: true, category: 'adventure',
    flag: '🇨🇭', gradient: 'linear-gradient(160deg,#E8F5E9 0%,#43A047 55%,#1B5E20 100%)',
    highlights: ['Jungfraujoch summit', 'Lake Geneva cruise', 'Interlaken adventure', 'Grindelwald hike'],
    includes: ['Flights', 'Hotels', 'Swiss Travel Pass', 'Breakfast'],
    rating: 4.7, reviews: 156,
  },
  {
    id: 'dubai-luxury', destination: 'Dubai', title: 'Dubai Luxury & Desert',
    duration: '5D / 4N', price: '₹65,000', perPerson: true, category: 'city',
    flag: '🇦🇪', gradient: 'linear-gradient(160deg,#FBE5BD 0%,#F2B650 45%,#87520A 100%)',
    highlights: ['Burj Khalifa At the Top', 'Desert safari & BBQ', 'Dubai Mall & Fountain', 'Gold Souk'],
    includes: ['Flights', '5-star hotel', 'Desert safari', 'City tour'],
    rating: 4.8, reviews: 287,
  },
  {
    id: 'morocco-cultural', destination: 'Morocco', title: 'Marrakech & Sahara',
    duration: '7D / 6N', price: '₹72,000', perPerson: true, category: 'cultural',
    flag: '🇲🇦', gradient: 'linear-gradient(160deg,#FFCCBC 0%,#E64A19 55%,#8D1010 100%)',
    highlights: ['Jemaa el-Fna square', 'Sahara camel trek', 'Chefchaouen blue city', 'Fes medina'],
    includes: ['Flights', 'Riads', 'Sahara camp', 'Guided tours'],
    rating: 4.7, reviews: 193,
  },
  {
    id: 'vietnam-food', destination: 'Vietnam', title: 'Ha Long Bay & Food Trail',
    duration: '8D / 7N', price: '₹52,000', perPerson: true, category: 'adventure',
    flag: '🇻🇳', gradient: 'linear-gradient(160deg,#FFCDD2 0%,#E53935 55%,#7F0000 100%)',
    highlights: ['Ha Long Bay cruise', 'Hoi An lantern town', 'Hue Imperial Citadel', 'Street food tour'],
    includes: ['Flights', 'Hotels', 'Ha Long cruise', 'Breakfast'],
    rating: 4.8, reviews: 241,
  },
  {
    id: 'singapore-city', destination: 'Singapore', title: 'Singapore City & Sentosa',
    duration: '4D / 3N', price: '₹42,000', perPerson: true, category: 'city',
    flag: '🇸🇬', gradient: 'linear-gradient(160deg,#E3F2FD 0%,#1E88E5 55%,#0D47A1 100%)',
    highlights: ['Gardens by the Bay', 'Universal Studios', 'Marina Bay Sands', 'Hawker food tour'],
    includes: ['Flights', 'Hotel', 'Sentosa pass', 'Airport transfers'],
    rating: 4.6, reviews: 178,
  },
  {
    id: 'paris-romantic', destination: 'Paris', title: 'Paris Romantic Getaway',
    duration: '6D / 5N', price: '₹1,15,000', perPerson: true, category: 'city',
    flag: '🇫🇷', gradient: 'linear-gradient(160deg,#EDE7F6 0%,#7E57C2 55%,#311B92 100%)',
    highlights: ['Eiffel Tower dinner', 'Louvre Museum', 'Seine river cruise', 'Versailles gardens'],
    includes: ['Flights', 'Boutique hotel', 'Museum passes', 'Breakfast'],
    rating: 4.8, reviews: 304,
  },
  {
    id: 'kenya-safari', destination: 'Kenya', title: 'Masai Mara Safari',
    duration: '7D / 6N', price: '₹1,40,000', perPerson: true, category: 'adventure',
    flag: '🇰🇪', gradient: 'linear-gradient(160deg,#FFF9C4 0%,#F9A825 55%,#5D4037 100%)',
    highlights: ['Big 5 game drives', 'Hot air balloon safari', 'Maasai village visit', 'Nairobi National Park'],
    includes: ['Flights', 'Safari lodge', 'All meals', 'Game drives'],
    rating: 4.9, reviews: 127,
  },
  {
    id: 'seychelles-honeymoon', destination: 'Seychelles', title: 'Seychelles Honeymoon',
    duration: '6D / 5N', price: '₹1,55,000', perPerson: true, category: 'beach',
    flag: '🇸🇨', gradient: 'linear-gradient(160deg,#E0F7FA 0%,#26C6DA 55%,#006064 100%)',
    highlights: ['Anse Source beach', 'Snorkelling in coral bays', 'Island hopping', 'Spa & wellness'],
    includes: ['Flights', 'Beach villa', 'Breakfast', 'Boat trip'],
    rating: 5.0, reviews: 62,
  },
];

const CATEGORIES = [
  { id: 'all',       label: 'All Packages',  icon: 'globe-2' },
  { id: 'beach',     label: 'Beach',         icon: 'waves' },
  { id: 'adventure', label: 'Adventure',     icon: 'mountain' },
  { id: 'cultural',  label: 'Cultural',      icon: 'landmark' },
  { id: 'city',      label: 'City Break',    icon: 'building-2' },
];

// ─── Sidebar ──────────────────────────────────────────────────
function ExploreSidebar() {
  const userName = localStorage.getItem('voya_user_name')
    || localStorage.getItem('voya_user_email')?.split('@')[0]
    || 'Traveler';

  const items = [
    { id: 'home',    icon: 'compass',      label: 'Home',        href: 'Voya Dashboard.html' },
    { id: 'plan',    icon: 'map-pin-plus', label: 'Plan a trip', href: 'plantrip.html' },
    { id: 'trips',   icon: 'map',          label: 'My Trips',    href: 'plantrip.html#trips', badge: 4 },
    { id: 'explore', icon: 'globe-2',      label: 'Explore',     href: null },
    { id: 'profile', icon: 'user-round',   label: 'Profile',     href: 'profile.html' },
  ];

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <aside style={{
      width: 245, flexShrink: 0, background: '#fff', height: '100vh',
      borderRight: `1px solid ${C.borderSoft}`,
      display: 'flex', flexDirection: 'column', padding: '24px 16px',
      position: 'sticky', top: 0,
    }}>
      <div style={{ padding: '2px 6px 28px' }}>
        <img src="assets/voya-logo-light.png" alt="voya"
          onClick={() => window.location.href = 'Voya Dashboard.html'}
          style={{ height: 28, objectFit: 'contain', objectPosition: 'left', cursor: 'pointer' }} />
      </div>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(item => {
          const on = item.id === 'explore';
          return (
            <button key={item.id}
              onClick={() => item.href && (window.location.href = item.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 12, border: 0,
                textAlign: 'left', cursor: 'pointer',
                background: on ? 'rgba(55,138,221,0.12)' : 'transparent',
                color: on ? C.ocean : C.fg3,
                fontFamily: C.fb, fontWeight: on ? 600 : 500, fontSize: 14.5,
                transition: 'background 140ms, color 140ms',
              }}>
              <Icon name={item.icon} size={19} color={on ? C.ocean : C.fg3} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ background: C.amber, color: '#fff', fontFamily: C.fd, fontWeight: 700, fontSize: 11, padding: '1px 7px', borderRadius: 99 }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
      <div style={{ height: 1, background: C.borderSoft, margin: '12px 0 14px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: C.sky, borderRadius: 14 }}>
        <VAvatar name={userName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName}</div>
          <div style={{ fontFamily: C.fb, fontSize: 11, color: C.ocean, fontWeight: 600 }}>Pro Plan ✦</div>
        </div>
      </div>
    </aside>
  );
}

// ─── Package Card ─────────────────────────────────────────────
function PackageCard({ pkg }) {
  const [hv, setHv] = useState(false);

  return (
    <div
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      style={{
        background: '#fff', borderRadius: 22, overflow: 'hidden',
        boxShadow: hv ? '0 12px 32px rgba(12,68,124,0.14)' : '0 2px 10px rgba(12,68,124,0.07)',
        transform: hv ? 'translateY(-4px)' : 'none',
        transition: 'all 220ms cubic-bezier(0.2,0.8,0.2,1)',
      }}>

      {/* Thumbnail */}
      <div style={{ height: 150, background: pkg.gradient, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 99, fontFamily: C.fb, fontWeight: 600, fontSize: 12, color: '#fff' }}>
          {pkg.flag} {pkg.destination}
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 99, fontFamily: C.fd, fontWeight: 700, fontSize: 11, color: '#fff' }}>
          {pkg.duration}
        </div>
        {/* Rating */}
        <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)', padding: '4px 10px', borderRadius: 99 }}>
          <Icon name="star" size={11} color="#FCD34D" />
          <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 12, color: '#fff' }}>{pkg.rating}</span>
          <span style={{ fontFamily: C.fb, fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>({pkg.reviews})</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 17, color: C.navy, marginBottom: 4 }}>{pkg.title}</div>

        {/* Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          {pkg.highlights.slice(0, 3).map((h, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.ocean, flexShrink: 0 }} />
              <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg2 }}>{h}</span>
            </div>
          ))}
        </div>

        {/* Includes chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {pkg.includes.map(inc => (
            <span key={inc} style={{ fontFamily: C.fb, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 99, background: C.sky, color: C.navy }}>
              {inc}
            </span>
          ))}
        </div>

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${C.borderSoft}` }}>
          <div>
            <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3 }}>from</div>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 20, color: C.navy, letterSpacing: '-0.01em' }}>{pkg.price}</div>
            <div style={{ fontFamily: C.fb, fontSize: 10, color: C.fg3 }}>per person</div>
          </div>
          <button
            onClick={() => { window.location.href = `plantrip.html`; }}
            style={{
              padding: '10px 18px', borderRadius: 99, border: 0,
              background: C.amber, color: '#fff',
              fontFamily: C.fd, fontWeight: 700, fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 6px 18px rgba(239,159,39,0.30)',
              transition: 'all 140ms',
            }}>
            <Icon name="sparkles" size={13} color="#fff" />
            Plan this trip
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

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const visible = PACKAGES.filter(p => {
    const matchCat = category === 'all' || p.category === category;
    const q = search.toLowerCase();
    const matchSearch = !q || p.destination.toLowerCase().includes(q) || p.title.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <ExploreSidebar />
      <main style={{ flex: 1, overflowY: 'auto', background: C.cream }}>

        {/* Hero */}
        <div style={{
          background: `linear-gradient(135deg, #07304F 0%, ${C.navy} 52%, #1A6BB5 100%)`,
          padding: '40px 44px 36px', position: 'relative', overflow: 'hidden',
        }}>
          <svg viewBox="0 0 800 160" width="100%" height="160" style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none' }}>
            <path d="M -20 120 C 160 30, 380 10, 620 70 S 740 130, 840 60" fill="none" stroke="rgba(241,239,232,0.9)" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" />
          </svg>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(241,239,232,0.60)', marginBottom: 8 }}>DISCOVER YOUR NEXT ADVENTURE</div>
            <h1 style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 36, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              Explore Travel Packages
            </h1>
            <p style={{ fontFamily: C.fb, fontSize: 15, color: 'rgba(241,239,232,0.70)', margin: '0 0 24px', maxWidth: 520 }}>
              Curated packages with flights, hotels, and experiences — all in one price.
            </p>
            {/* Search */}
            <div style={{ position: 'relative', maxWidth: 420 }}>
              <Icon name="search" size={16} color="rgba(241,239,232,0.50)" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search destinations or packages…"
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
        <div style={{ padding: '20px 44px 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
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
            {visible.length} package{visible.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Grid */}
        <div style={{ padding: '20px 44px 60px' }}>
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 20, color: C.navy, marginBottom: 8 }}>No packages found</div>
              <div style={{ fontFamily: C.fb, fontSize: 14, color: C.fg3 }}>Try a different search or category.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {visible.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ExploreApp />);
