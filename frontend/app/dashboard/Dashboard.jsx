// dashboard/Dashboard.jsx — Voya post-login dashboard
const { useState, useEffect, useRef } = React;

// ─── Hero ─────────────────────────────────────────────────────
function HeroSection({ name, stats }) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="m-stack" style={{
      background: `linear-gradient(135deg, #07304F 0%, ${C.navy} 52%, #1A6BB5 100%)`,
      borderRadius: 24, padding: '40px 44px 40px', marginBottom: 24,
      display: 'grid', gridTemplateColumns: '1fr 260px',
      gap: 24, alignItems: 'center',
      overflow: 'hidden', position: 'relative', minHeight: 215,
    }}>
      {/* Text */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={{
          fontFamily: C.fb, fontSize: 14, fontWeight: 500, marginBottom: 6,
          color: 'rgba(241,239,232,0.60)',
        }}>{greet}{name ? `, ${name.split(' ')[0]}` : ''} 👋</div>
        <h1 style={{
          fontFamily: C.fd, fontWeight: 700, fontSize: 38,
          letterSpacing: '-0.025em', lineHeight: 1.06, color: '#fff',
          margin: '0 0 10px',
        }}>
          Ready for your<br />
          <span style={{ color: C.amber }}>next adventure?</span>
        </h1>
        <p style={{
          fontFamily: C.fb, fontSize: 15, lineHeight: 1.5, margin: '0 0 24px',
          color: 'rgba(241,239,232,0.65)',
        }}>
          Plan a full day-by-day trip in under a minute.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <VBtn variant="amber" size="md" trailing="arrow-right"
            onClick={() => window.location.href = '/app/plan'}>
            Plan a new trip
          </VBtn>
          <button
            onClick={() => window.location.href = '/app/trips'}
            style={{
              background: 'none', border: 0, cursor: 'pointer',
              fontFamily: C.fb, fontWeight: 600, fontSize: 14,
              color: 'rgba(241,239,232,0.70)',
            }}>View my trips →</button>
        </div>
      </div>

      {/* Route SVG */}
      <div className="m-hide" style={{ height: 170, position: 'relative' }}>
        <svg viewBox="0 0 260 170" width="260" height="170"
          style={{ overflow: 'visible', opacity: 0.5 }}>
          <path d="M 18 148 C 70 72, 155 55, 218 95 S 280 138, 308 112"
                fill="none" stroke="rgba(241,239,232,0.80)"
                strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round"
                style={{ animation: 'dashFlow 3s linear infinite' }} />
          {/* Paper plane */}
          <g transform="translate(4,138) rotate(-28)">
            <path d="M0 7L14 0v4l-7 2v8l2 2-4-1-2 1 2-2V9z"
                  fill="rgba(230,242,251,0.85)" />
          </g>
          {/* Amber pin */}
          <g transform="translate(296,103)">
            <path d="M9 0C4.1 0 0 4 0 9c0 6.6 9 16 9 16s9-9.4 9-16C18 4 14 0 9 0Z"
                  fill={C.amber} />
            <circle cx="9" cy="9" r="3.2" fill="rgba(230,242,251,0.95)" />
          </g>
        </svg>
      </div>

      {/* Stats */}
      <div className="m-static" style={{
        position: 'absolute', bottom: 24, right: 44,
        display: 'flex', gap: 28, zIndex: 2,
      }}>
        {[
          { v: stats ? stats.total : '–', l: 'Trips' },
          { v: stats ? stats.upcoming : '–', l: 'Upcoming' },
          { v: stats ? stats.destinations : '–', l: 'Destinations' },
        ].map(s => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: C.fd, fontWeight: 700, fontSize: 26,
              color: '#fff', lineHeight: 1,
            }}>{s.v}</div>
            <div style={{
              fontFamily: C.fb, fontSize: 11, marginTop: 2,
              color: 'rgba(241,239,232,0.50)',
            }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI Search ────────────────────────────────────────────────
function AISearch() {
  const [q, setQ] = useState('');
  // Free-text requests ("Thailand under ₹50,000") go to the AI agent card below.
  const go = (value) => {
    const v = (value ?? q).trim();
    if (!v) return;
    setQ('');
    window.dispatchEvent(new CustomEvent('voya:ask', { detail: v }));
  };
  const [focused, setFocused] = useState(false);
  const [pi, setPi] = useState(0);
  const pls = ['3 days in Goa', 'Thailand under ₹50,000', 'Bali honeymoon trip', 'Japan in December'];

  useEffect(() => {
    const t = setInterval(() => setPi(p => (p + 1) % pls.length), 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <VCard padding={0} radius={20} style={{
      marginBottom: 24,
      border: `2px solid ${focused ? C.ocean : 'transparent'}`,
      transition: 'border-color 200ms',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '16px 20px', gap: 14,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14, flexShrink: 0,
          background: `linear-gradient(135deg, ${C.amber}, #F2B650)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="sparkles" size={20} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: C.fd, fontWeight: 700, fontSize: 11, color: C.ocean,
            letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4,
          }}>AI TRAVEL SEARCH</div>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => e.key === 'Enter' && go()}
            placeholder={`Try: "${pls[pi]}"`}
            style={{
              width: '100%', border: 'none', outline: 'none',
              background: 'transparent', fontFamily: C.fb,
              fontSize: 15.5, color: C.ink,
            }}
          />
        </div>
        <VBtn variant="primary" size="sm" icon="search" onClick={() => go()}>Search</VBtn>
      </div>
      <div style={{
        borderTop: `1px solid ${C.borderSoft}`,
        padding: '10px 20px 14px',
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>Try:</span>
        {pls.map(s => (
          <VChip key={s} tone="sky" size="sm" onClick={() => go(s)}>{s}</VChip>
        ))}
      </div>
      <RecentSearches />
    </VCard>
  );
}

// ─── Quick Actions ────────────────────────────────────────────
function QuickActions() {
  const acts = [
    { icon: 'plane-takeoff', label: 'Plan new trip',  sub: 'AI-powered itinerary',  bg: C.ocean, href: '/app/plan' },
    { icon: 'globe-2',       label: 'Explore',         sub: 'Discover destinations', bg: C.navy,  href: '/app/explore' },
    { icon: 'map',           label: 'My trips',         sub: 'View saved itineraries', bg: C.amber, href: '/app/trips' },
  ];
  return (
    <div className="m-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
      {acts.map((a, i) => (
        <VCard key={i} padding={20} radius={18} onClick={() => { window.location.href = a.href; }}>
          <div style={{
            width: 46, height: 46, borderRadius: 14, background: a.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 14,
          }}>
            <Icon name={a.icon} size={22} color="#fff" />
          </div>
          <div style={{
            fontFamily: C.fd, fontWeight: 700, fontSize: 15,
            color: C.navy, marginBottom: 3,
          }}>{a.label}</div>
          <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>{a.sub}</div>
        </VCard>
      ))}
    </div>
  );
}

// ─── Upcoming Trips ───────────────────────────────────────────
function UpcomingTrips({ trips, error }) {
  const loading = trips === null && !error;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = (trips || [])
    .filter(t => t.status === 'upcoming')
    .map(t => ({ t, d: Voya.parseDate(t.startDate) }))
    .sort((a, b) => {
      // Future trips first (soonest first), then undated / past ones.
      const af = a.d && a.d >= today, bf = b.d && b.d >= today;
      if (af !== bf) return af ? -1 : 1;
      return (a.d ? a.d.getTime() : Infinity) - (b.d ? b.d.getTime() : Infinity);
    });
  const trip = upcoming.length ? upcoming[0].t : null;

  const daysLeft = (dateStr) => {
    const d = Voya.parseDate(dateStr);
    if (!d) return null;
    const diff = Math.ceil((d - today) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const shortDate = (v) => fmtDate(v, { day: 'numeric', month: 'short' });

  return (
    <div>
      <VSectionHead
        eyebrow="COMING UP"
        title="Upcoming trips"
        action={{ label: 'View all', fn: () => { window.location.href = '/app/trips'; } }}
      />
      {error ? (
        <VCard padding={24} radius={20}>
          <VNotice>{error}</VNotice>
        </VCard>
      ) : loading ? (
        <VCard padding={24} radius={20}>
          <div style={{ fontFamily: C.fb, fontSize: 13, color: C.fg3 }}>Loading…</div>
        </VCard>
      ) : !trip ? (
        <VCard padding={28} radius={20} style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(55,138,221,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icon name="plane" size={22} color={C.ocean} />
          </div>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 17, color: C.navy, marginBottom: 6 }}>No upcoming trips</div>
          <div style={{ fontFamily: C.fb, fontSize: 13, color: C.fg3, marginBottom: 16 }}>Plan your next adventure and book it to see it here.</div>
          <VBtn variant="amber" size="sm" trailing="arrow-right" onClick={() => { window.location.href = '/app/plan'; }}>Plan a trip</VBtn>
        </VCard>
      ) : (
        <VCard padding={0} radius={20} style={{ overflow: 'hidden' }}>
          <div className="m-col" style={{ display: 'flex' }}>
            {/* Thumbnail */}
            <div style={{
              width: 160, flexShrink: 0,
              background: trip.gradient || `linear-gradient(160deg,#6FAAEA 0%,${C.ocean} 50%,#07304F 100%)`,
              borderRadius: '20px 0 0 20px', position: 'relative', minHeight: 148, overflow: 'hidden',
            }} className="has-photo">
              <svg viewBox="0 0 160 148" width="160" height="148" style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
                <ellipse cx="80" cy="132" rx="100" ry="24" fill="rgba(0,0,0,0.18)" />
                <rect x="45" y="82" width="70" height="60" fill="rgba(12,68,124,0.52)" />
                <polygon points="40,82 80,54 120,82" fill="rgba(12,68,124,0.60)" />
                <polygon points="50,70 80,46 110,70" fill="rgba(7,48,79,0.55)" />
                <rect x="68" y="107" width="24" height="35" rx="3" fill="rgba(4,24,50,0.55)" />
              </svg>
              <PhotoLayer place={trip.destination} photo={trip.photo} width={480} />
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(8px)',
                padding: '3px 9px', borderRadius: 99,
                fontFamily: C.fb, fontWeight: 600, fontSize: 11, color: '#fff',
              }}>{trip.flag} {trip.destination}</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, padding: '20px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 22, color: C.navy, margin: '0 0 3px' }}>{trip.destination}</h3>
                  <div style={{ fontFamily: C.fb, fontSize: 13, color: C.fg3 }}>{trip.cities}</div>
                </div>
                <span style={{
                  background: 'rgba(47,165,106,0.12)', color: '#1e7a4d',
                  fontFamily: C.fd, fontWeight: 700, fontSize: 11,
                  padding: '5px 11px', borderRadius: 99,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>Upcoming</span>
              </div>

              <div className="m-wrap" style={{ display: 'flex', gap: 20, margin: '14px 0' }}>
                {[
                  { i: 'calendar', t: trip.startDate ? `${shortDate(trip.startDate)} – ${shortDate(trip.endDate)}` : 'Dates not set' },
                  { i: 'moon',     t: `${trip.days} days` },
                  { i: 'banknote', t: trip.budget },
                ].map(m => (
                  <div key={m.i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name={m.i} size={14} color={C.fg3} />
                    <span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}>{m.t}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {daysLeft(trip.startDate) !== null ? (() => {
                  const dl = daysLeft(trip.startDate);
                  const pct = dl !== null ? Math.max(4, Math.min(96, 100 - (dl / 90) * 100)) : 50;
                  return (
                    <div style={{ flex: 1, maxWidth: 210 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>Countdown</span>
                        <span style={{ fontFamily: C.fb, fontSize: 12, fontWeight: 600, color: C.ocean }}>
                          {dl === 0 ? 'Today!' : `${dl} days away`}
                        </span>
                      </div>
                      <div style={{ height: 6, background: C.sky, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${C.ocean},${C.amber})`, borderRadius: 99 }} />
                      </div>
                    </div>
                  );
                })() : <div />}
                <VBtn variant="outline" size="sm" trailing="arrow-right" style={{ marginLeft: 20 }}
                  onClick={() => { window.location.href = `/app/trips?trip=${encodeURIComponent(trip.id)}`; }}>Open</VBtn>
              </div>
            </div>
          </div>
        </VCard>
      )}
    </div>
  );
}

// ─── AI Assistant: see agent.jsx ─────────────────────────────

// ─── Recent Searches ──────────────────────────────────────────
function RecentSearches() {
  // Shown as a row inside the AI search card, right under the search box.
  const [searches, setSearches] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = () => Voya.api('/api/searches').then(r => {
      if (r.ok) { setSearches(r.data.searches); setError(''); } else setError(r.error);
    });
    load();
    window.addEventListener('voya:searches-changed', load);   // the AI agent planned a trip
    return () => window.removeEventListener('voya:searches-changed', load);
  }, []);

  const handleClear = async () => {
    const r = await Voya.api('/api/searches', { method: 'DELETE' });
    if (r.ok) setSearches([]); else setError(r.error);
  };

  if (!error && searches.length === 0) return null;

  return (
    <div data-testid="recent-searches" style={{
      borderTop: `1px solid ${C.borderSoft}`, padding: '10px 20px 14px',
      display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
    }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>
        <Icon name="clock" size={12} color={C.fg3} /> Recent:
      </span>
      {error ? <span style={{ fontFamily: C.fb, fontSize: 12, color: C.danger }}>{error}</span> : searches.map(s => (
        <VChip key={s.id} tone="ocean" size="sm" icon="search"
          onClick={() => { window.location.href = `/app/plan?destination=${encodeURIComponent(s.destination)}`; }}>
          {s.destination}
        </VChip>
      ))}
      {!error && (
        <button onClick={handleClear} style={{
          border: 0, background: 'none', cursor: 'pointer', marginLeft: 'auto',
          fontFamily: C.fb, fontSize: 12, color: C.fg3,
        }}>Clear</button>
      )}
    </div>
  );
}

// Destinations with a ready-made itinerary (see /app/explore/samples.json).
const SAMPLE_FOR = { bali: 'bali-culture', thailand: 'thailand-beach', dubai: 'dubai-luxury', japan: 'japan-culture', maldives: 'maldives-luxury', switzerland: 'swiss-mountain' };

// ─── Popular Destinations ─────────────────────────────────────
function PopularDestinations() {
  const dests = [
    { name: 'Bali',        c: 'Indonesia',   flag: '🇮🇩', best: 'Apr–Oct',
      g: `linear-gradient(160deg,#F6CD83 0%,${C.amber} 45%,#87520A 100%)` },
    { name: 'Thailand',    c: 'Thailand',    flag: '🇹🇭', best: 'Nov–Mar',
      g: `linear-gradient(160deg,${C.sky} 0%,${C.ocean} 55%,${C.navy} 100%)` },
    { name: 'Dubai',       c: 'UAE',         flag: '🇦🇪', best: 'Nov–Mar',
      g: 'linear-gradient(160deg,#FBE5BD 0%,#F2B650 45%,#87520A 100%)' },
    { name: 'Japan',       c: 'Japan',       flag: '🇯🇵', best: 'Mar–May',
      g: 'linear-gradient(160deg,#FFD0DA 0%,#E8859C 50%,#0C447C 100%)' },
    { name: 'Maldives',    c: 'Maldives',    flag: '🇲🇻', best: 'Nov–Apr',
      g: 'linear-gradient(160deg,#B0EEFF 0%,#378ADD 45%,#07304F 100%)' },
    { name: 'Switzerland', c: 'Switzerland', flag: '🇨🇭', best: 'Jun–Sep',
      g: `linear-gradient(160deg,#9FC7F1 0%,#1E62AC 50%,${C.navy} 100%)` },
  ];

  const artworks = {
    Bali: (
      <>
        <circle cx="138" cy="26" r="20" fill="rgba(255,255,255,0.18)" />
        <path d="M 55 130 Q 60 90 70 68" stroke="rgba(0,0,0,0.30)" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M 70 68 C 50 52 30 56 18 48" stroke="rgba(0,0,0,0.25)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 70 68 C 72 44 84 35 88 24" stroke="rgba(0,0,0,0.22)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M 70 68 C 90 55 108 57 122 50" stroke="rgba(0,0,0,0.22)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ),
    Thailand: (
      <>
        <rect x="49" y="72" width="80" height="56" fill="rgba(7,48,79,0.50)" />
        <polygon points="44,72 89,44 134,72" fill="rgba(7,48,79,0.58)" />
        <polygon points="54,62 89,38 124,62" fill="rgba(4,30,56,0.52)" />
        <polygon points="64,52 89,32 114,52" fill="rgba(4,30,56,0.55)" />
        <rect x="72" y="97" width="34" height="31" rx="2" fill="rgba(2,18,36,0.50)" />
      </>
    ),
    Dubai: (
      <>
        <rect x="18" y="55" width="24" height="73" fill="rgba(0,0,0,0.22)" />
        <rect x="50" y="40" width="28" height="88" fill="rgba(0,0,0,0.26)" />
        <rect x="87" y="24" width="20" height="104" fill="rgba(0,0,0,0.28)" />
        <rect x="115" y="48" width="24" height="80" fill="rgba(0,0,0,0.24)" />
        <rect x="147" y="63" width="18" height="65" fill="rgba(0,0,0,0.20)" />
      </>
    ),
    Japan: (
      <>
        <polygon points="89,16 150,108 28,108" fill="rgba(255,255,255,0.10)" />
        <polygon points="78,68 89,20 100,68" fill="rgba(255,255,255,0.18)" />
        {[0,1,2,3,4,5,6,7].map(i => (
          <circle key={i} cx={14 + i * 22} cy={96 + (i%2)*6} r="7" fill="rgba(255,165,185,0.38)" />
        ))}
      </>
    ),
    Maldives: (
      <>
        <rect x="54" y="52" width="70" height="18" rx="3" fill="rgba(255,255,255,0.20)" />
        <rect x="68" y="65" width="42" height="48" rx="2" fill="rgba(255,255,255,0.16)" />
        <rect x="44" y="67" width="12" height="2" fill="rgba(255,255,255,0.35)" />
        <rect x="122" y="67" width="12" height="2" fill="rgba(255,255,255,0.35)" />
        <ellipse cx="89" cy="84" rx="82" ry="8" fill="rgba(0,0,0,0.08)" />
      </>
    ),
    Switzerland: (
      <>
        <polygon points="50,130 89,28 128,130" fill="rgba(255,255,255,0.12)" />
        <polygon points="89,28 128,130 89,130" fill="rgba(255,255,255,0.06)" />
        <polygon points="10,130 46,58 80,130" fill="rgba(255,255,255,0.09)" />
        <polygon points="98,130 140,55 178,130" fill="rgba(255,255,255,0.10)" />
        <polygon points="68,62 89,28 110,62" fill="rgba(255,255,255,0.30)" />
      </>
    ),
  };

  return (
    <div style={{ marginBottom: 28 }}>
      <VSectionHead
        eyebrow="EXPLORE"
        title="Popular destinations"
        action={{ label: 'See all', fn: () => { window.location.href = '/app/explore'; } }}
      />
      <div className="no-scrollbar" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {dests.map(d => (
          <VCard key={d.name} padding={0} radius={20} onClick={() => { window.location.href = `/app/plan?sample=${SAMPLE_FOR[d.name.toLowerCase()]}`; }}
            style={{ minWidth: 178, maxWidth: 178, overflow: 'hidden', flexShrink: 0 }}>
            <div className="has-photo" style={{ height: 130, background: d.g, position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 178 130" width="178" height="130"
                style={{ position: 'absolute', inset: 0 }}>
                <ellipse cx="89" cy="118" rx="115" ry="28" fill="rgba(0,0,0,0.14)" />
                {artworks[d.name]}
              </svg>
              <PhotoLayer place={d.name} width={480} />
              <div style={{
                position: 'absolute', top: 10, left: 10,
                background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)',
                padding: '3px 9px', borderRadius: 99,
                fontFamily: C.fb, fontWeight: 600, fontSize: 11, color: '#fff',
              }}>{d.flag} {d.c}</div>
            </div>
            <div style={{ padding: '12px 14px 14px' }}>
              <div style={{
                fontFamily: C.fd, fontWeight: 700, fontSize: 17,
                color: C.navy, marginBottom: 8,
              }}>{d.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="sparkles" size={12} color={C.fg3} />
                  <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg2 }}>Plan this trip</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="sun" size={12} color={C.fg3} />
                  <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg2 }}>Best: {d.best}</span>
                </div>
              </div>
            </div>
          </VCard>
        ))}
      </div>
    </div>
  );
}

// ─── Travel Inspiration ───────────────────────────────────────
function TravelInspiration() {
  const items = [
    {
      ey: 'SEASONAL', tag: '🌸 Seasonal', dest: 'Japan',
      title: 'Cherry blossom in Japan',
      desc: 'Blossoms usually peak late March to early April.',
      g: 'linear-gradient(160deg,#FFD0DA 0%,#E8859C 50%,#0C447C 100%)',
    },
    {
      ey: 'NATURE', tag: '🏔 Nature', dest: 'Switzerland',
      title: 'Summer in Switzerland',
      desc: 'Hiking, lakes, crisp alpine air. June–August.',
      g: `linear-gradient(160deg,#9FC7F1 0%,#1E62AC 50%,${C.navy} 100%)`,
    },
    {
      ey: 'BUDGET IDEA', tag: '💰 Budget', dest: 'Thailand',
      title: 'Thailand under ₹50,000',
      desc: 'Set a ₹50,000 budget and let Voya plan around it.',
      g: `linear-gradient(160deg,${C.sky} 0%,${C.ocean} 55%,${C.navy} 100%)`,
    },
  ];
  return (
    <div style={{ marginBottom: 28 }}>
      <VSectionHead
        eyebrow="INSPIRATION"
        title="Ideas for your next trip"
        action={{ label: 'See all', fn: () => { window.location.href = '/app/explore'; } }}
      />
      <div className="m-stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {items.map(it => (
          <VCard key={it.title} padding={0} radius={20} onClick={() => { window.location.href = `/app/plan?sample=${SAMPLE_FOR[it.dest.toLowerCase()]}`; }} style={{ overflow: 'hidden' }}>
            <div className="has-photo" style={{
              height: 110, background: it.g, position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'flex-end', padding: 12,
            }}>
              <PhotoLayer place={it.dest} width={600} />
              <span style={{
                background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)',
                padding: '3px 10px', borderRadius: 99,
                fontFamily: C.fb, fontWeight: 600, fontSize: 11, color: '#fff',
              }}>{it.tag}</span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{
                fontFamily: C.fd, fontWeight: 700, fontSize: 11, letterSpacing: '0.16em',
                textTransform: 'uppercase', color: C.ocean, marginBottom: 4,
              }}>{it.ey}</div>
              <div style={{
                fontFamily: C.fd, fontWeight: 700, fontSize: 15, color: C.navy,
                marginBottom: 4, lineHeight: 1.3,
              }}>{it.title}</div>
              <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, lineHeight: 1.5 }}>{it.desc}</div>
            </div>
          </VCard>
        ))}
      </div>
    </div>
  );
}

// ─── Root Dashboard ───────────────────────────────────────────
function Dashboard() {
  const [trips, setTrips] = useState(null);
  const [tripsError, setTripsError] = useState('');
  const [name, setName] = useState(Voya.userName());

  useEffect(() => {
    Voya.api('/api/get-trips').then(r => {
      if (r.ok) setTrips(r.data.trips); else setTripsError(r.error);
    });
    Voya.api('/api/me').then(r => {
      if (r.ok && r.data.user.name) { setName(r.data.user.name); Voya.setUserName(r.data.user.name); }
    });
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (window.lucide) window.lucide.createIcons();
    });
    return () => cancelAnimationFrame(id);
  });

  const stats = trips ? {
    total: trips.length,
    upcoming: trips.filter(t => t.status === 'upcoming').length,
    destinations: new Set(trips.map(t => t.destination.trim().toLowerCase())).size,
  } : null;

  return (
    <div className="v-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <VSidebar active="home" name={name} />
      <main className="v-main" style={{
        flex: 1, overflowY: 'auto',
        padding: '32px 36px', background: C.cream,
      }}>
        <HeroSection name={name} stats={stats} />
        <AISearch />
        <QuickActions />
        <div className="m-stack" style={{
          display: 'grid', gridTemplateColumns: '1fr 358px',
          gap: 28, marginBottom: 28,
        }}>
          <UpcomingTrips trips={trips} error={tripsError} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AIAssistant />
          </div>
        </div>
        <PopularDestinations />
        <TravelInspiration />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />);
