// dashboard/Dashboard.jsx — Voya post-login dashboard
const { useState, useEffect, useRef } = React;

// ─── Sidebar ──────────────────────────────────────────────────
function Sidebar({ active, onNav }) {
  const userName = localStorage.getItem('voya_user_name')
    || localStorage.getItem('voya_user_email')?.split('@')[0]
    || 'Traveler';
  const items = [
    { id: 'home',    icon: 'compass',      label: 'Home' },
    { id: 'plan',    icon: 'map-pin-plus', label: 'Plan a trip' },
    { id: 'trips',   icon: 'map',          label: 'My Trips', badge: 1 },
    { id: 'explore', icon: 'globe-2',      label: 'Explore' },
    { id: 'profile', icon: 'user-round',   label: 'Profile' },
  ];
  return (
    <aside style={{
      width: 245, flexShrink: 0, background: '#fff', height: '100vh',
      borderRight: `1px solid ${C.borderSoft}`,
      display: 'flex', flexDirection: 'column', padding: '24px 16px',
      position: 'sticky', top: 0,
    }}>
      <div style={{ padding: '2px 6px 28px' }}>
        <img src="assets/voya-logo-light.png" alt="voya"
          style={{ height: 28, objectFit: 'contain', objectPosition: 'left' }} />
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(item => {
          const on = active === item.id;
          return (
            <button key={item.id} onClick={() => {
              if (item.id === 'profile') { window.location.href = 'profile.html'; }
              else if (item.id === 'trips')   { window.location.href = 'plantrip.html#trips'; }
              else if (item.id === 'plan')    { window.location.href = 'plantrip.html'; }
              else if (item.id === 'explore') { window.location.href = 'explore.html'; }
              else { onNav(item.id); }
            }} style={{
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
                <span style={{
                  background: on ? C.ocean : C.amber, color: '#fff',
                  fontFamily: C.fd, fontWeight: 700, fontSize: 11,
                  padding: '1px 7px', borderRadius: 99,
                }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ height: 1, background: C.borderSoft, margin: '12px 0 14px' }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 12, background: C.sky, borderRadius: 14,
      }}>
        <VAvatar name={userName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: C.navy,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{userName}</div>
          <div style={{ fontFamily: C.fb, fontSize: 11, color: C.ocean, fontWeight: 600 }}>Pro Plan ✦</div>
        </div>
        <button style={{
          width: 28, height: 28, borderRadius: 8, border: 0,
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="settings" size={15} color={C.fg3} />
        </button>
      </div>
    </aside>
  );
}

// ─── Hero ─────────────────────────────────────────────────────
function HeroSection() {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <div style={{
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
        }}>{greet}, Afreen 👋</div>
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
          Voya has scanned 2,400 flights for you today.
        </p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <VBtn variant="amber" size="md" trailing="arrow-right"
            onClick={() => window.location.href = 'plantrip.html'}>
            Plan a new trip
          </VBtn>
          <button
            onClick={() => window.location.href = 'plantrip.html#trips'}
            style={{
              background: 'none', border: 0, cursor: 'pointer',
              fontFamily: C.fb, fontWeight: 600, fontSize: 14,
              color: 'rgba(241,239,232,0.70)',
            }}>View my trips →</button>
        </div>
      </div>

      {/* Route SVG */}
      <div style={{ height: 170, position: 'relative' }}>
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
      <div style={{
        position: 'absolute', bottom: 24, right: 44,
        display: 'flex', gap: 28, zIndex: 2,
      }}>
        {[{ v: '3', l: 'Saved' }, { v: '1', l: 'Active trip' }, { v: '12', l: 'Countries' }].map(s => (
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
            placeholder={`Try: "${pls[pi]}"`}
            style={{
              width: '100%', border: 'none', outline: 'none',
              background: 'transparent', fontFamily: C.fb,
              fontSize: 15.5, color: C.ink,
            }}
          />
        </div>
        <VBtn variant="primary" size="sm" icon="search">Search</VBtn>
      </div>
      <div style={{
        borderTop: `1px solid ${C.borderSoft}`,
        padding: '10px 20px 14px',
        display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>Try:</span>
        {pls.map(s => (
          <VChip key={s} tone="sky" size="sm" onClick={() => setQ(s)}>{s}</VChip>
        ))}
      </div>
    </VCard>
  );
}

// ─── Quick Actions ────────────────────────────────────────────
function QuickActions({ onNav }) {
  const acts = [
    { icon: 'plane-takeoff', label: 'Plan new trip',  sub: 'AI-powered itinerary',  bg: C.ocean, id: 'plantrip' },
    { icon: 'globe-2',       label: 'Explore',         sub: 'Discover destinations', bg: C.navy,  id: 'explore' },
    { icon: 'map',           label: 'My trips',         sub: 'View saved itineraries', bg: C.amber, id: 'trips' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
      {acts.map((a, i) => (
        <VCard key={i} padding={20} radius={18} onClick={() => {
          if (a.id === 'plantrip') { window.location.href = 'plantrip.html'; }
          else if (a.id === 'trips') { window.location.href = 'plantrip.html#trips'; }
          else { onNav(a.id); }
        }}>
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
function UpcomingTrips() {
  const [trip,    setTrip]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem('voya_user_email') || '';
    if (!email) { setLoading(false); return; }
    fetch(`http://127.0.0.1:5000/get-trips?user_email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.trips.length > 0) {
          const upcoming = data.trips.find(t => t.status === 'upcoming')
                        || data.trips.find(t => t.status === 'planning')
                        || null;
          setTrip(upcoming);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const daysLeft = (dateStr) => {
    if (!dateStr) return null;
    const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  return (
    <div>
      <VSectionHead
        eyebrow="COMING UP"
        title="Upcoming trips"
        action={{ label: 'View all', fn: () => {} }}
      />
      {loading ? (
        <VCard padding={24} radius={20}>
          <div style={{ fontFamily: C.fb, fontSize: 13, color: C.fg3 }}>Loading…</div>
        </VCard>
      ) : !trip ? (
        <VCard padding={28} radius={20} style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(55,138,221,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icon name="plane" size={22} color={C.ocean} />
          </div>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 17, color: C.navy, marginBottom: 6 }}>No upcoming trips</div>
          <div style={{ fontFamily: C.fb, fontSize: 13, color: C.fg3 }}>Plan your next adventure and save it to see it here.</div>
        </VCard>
      ) : (
        <VCard padding={0} radius={20} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex' }}>
            {/* Thumbnail */}
            <div style={{
              width: 160, flexShrink: 0,
              background: trip.gradient || `linear-gradient(160deg,#6FAAEA 0%,${C.ocean} 50%,#07304F 100%)`,
              borderRadius: '20px 0 0 20px', position: 'relative', minHeight: 148, overflow: 'hidden',
            }}>
              <svg viewBox="0 0 160 148" width="160" height="148" style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
                <ellipse cx="80" cy="132" rx="100" ry="24" fill="rgba(0,0,0,0.18)" />
                <rect x="45" y="82" width="70" height="60" fill="rgba(12,68,124,0.52)" />
                <polygon points="40,82 80,54 120,82" fill="rgba(12,68,124,0.60)" />
                <polygon points="50,70 80,46 110,70" fill="rgba(7,48,79,0.55)" />
                <rect x="68" y="107" width="24" height="35" rx="3" fill="rgba(4,24,50,0.55)" />
              </svg>
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
                  background: trip.status === 'upcoming' ? 'rgba(47,165,106,0.12)' : 'rgba(55,138,221,0.12)',
                  color: trip.status === 'upcoming' ? '#1e7a4d' : '#144E8E',
                  fontFamily: C.fd, fontWeight: 700, fontSize: 11,
                  padding: '5px 11px', borderRadius: 99,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>{trip.status === 'upcoming' ? 'Confirmed' : 'Planning'}</span>
              </div>

              <div style={{ display: 'flex', gap: 20, margin: '14px 0' }}>
                {[
                  { i: 'calendar', t: `${fmtDate(trip.startDate)} – ${fmtDate(trip.endDate)}` },
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
                {trip.startDate ? (() => {
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
                <VBtn variant="outline" size="sm" trailing="arrow-right" style={{ marginLeft: 20 }}>Open</VBtn>
              </div>
            </div>
          </div>
        </VCard>
      )}
    </div>
  );
}

// ─── AI Assistant ─────────────────────────────────────────────
function AIAssistant() {
  const [input,  setInput]  = useState('');
  const [msgs,   setMsgs]   = useState([
    { r: 'voya', t: 'Hey! Where are you dreaming of going? Ask me anything — destinations, budgets, best seasons, hidden gems. ✈️' },
  ]);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, typing]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || typing) return;
    setInput('');

    const updated = [...msgs, { r: 'user', t: msg }];
    setMsgs(updated);
    setTyping(true);

    try {
      // Build history in OpenRouter format (exclude current message — it goes in `message`)
      const history = updated.slice(0, -1).map(m => ({
        role:    m.r === 'user' ? 'user' : 'assistant',
        content: m.t,
      }));

      const res  = await fetch('http://127.0.0.1:5000/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();

      setMsgs(m => [...m, {
        r: 'voya',
        t: data.success ? data.reply : 'Sorry, couldn\'t reach my knowledge base right now. Try again! ✈️',
      }]);
    } catch {
      setMsgs(m => [...m, { r: 'voya', t: 'Connection issue — please try again.' }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <VCard padding={0} radius={20} style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.ocean} 100%)`,
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={18} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 15, color: '#fff' }}>Voya AI</div>
          <div style={{ fontFamily: C.fb, fontSize: 11, color: 'rgba(241,239,232,0.60)' }}>Your travel companion</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: typing ? C.amber : '#2FA56A', transition: 'background 300ms' }} />
          <span style={{ fontFamily: C.fb, fontSize: 11, color: 'rgba(241,239,232,0.70)' }}>{typing ? 'Thinking…' : 'Online'}</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ padding: '12px 14px 6px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 185, overflowY: 'auto' }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.r === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '84%', padding: '8px 12px',
              borderRadius: m.r === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.r === 'user' ? C.ocean : C.sky,
              color: m.r === 'user' ? '#fff' : C.ink,
              fontFamily: C.fb, fontSize: 13, lineHeight: 1.5,
            }}>{m.t}</div>
          </div>
        ))}
        {typing && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: C.sky, display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.fg3, display: 'inline-block', animation: `dotPulse 1.2s ease-in-out ${i * 0.18}s infinite` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 14px 14px', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask Voya anything..."
          disabled={typing}
          style={{
            flex: 1, padding: '9px 13px',
            border: `1.5px solid ${C.borderDefault}`,
            borderRadius: 12, outline: 'none', background: C.sky,
            fontFamily: C.fb, fontSize: 13, color: C.ink,
            opacity: typing ? 0.65 : 1,
          }}
        />
        <button onClick={send} disabled={typing} style={{
          width: 36, height: 36, borderRadius: 10, border: 0,
          background: typing ? C.borderDefault : C.ocean,
          cursor: typing ? 'default' : 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 200ms',
        }}>
          <Icon name="send" size={15} color="#fff" />
        </button>
      </div>
    </VCard>
  );
}

// ─── Recent Searches ──────────────────────────────────────────
function RecentSearches() {
  const [searches, setSearches] = useState([]);

  useEffect(() => {
    const email = localStorage.getItem('voya_user_email') || '';
    if (!email) return;
    fetch(`http://127.0.0.1:5000/recent-searches?user_email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => { if (data.success) setSearches(data.searches); })
      .catch(() => {});
  }, []);

  const handleClear = async () => {
    const email = localStorage.getItem('voya_user_email') || '';
    if (!email) return;
    try {
      await fetch(`http://127.0.0.1:5000/clear-searches?user_email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      setSearches([]);
    } catch {}
  };

  if (searches.length === 0) return null;

  return (
    <VCard padding={18} radius={18}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="clock" size={16} color={C.ocean} />
          <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 15, color: C.navy }}>
            Recent searches
          </span>
        </div>
        <button onClick={handleClear} style={{
          border: 0, background: 'none', cursor: 'pointer',
          fontFamily: C.fb, fontSize: 12, color: C.fg3,
        }}>Clear</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {searches.map(s => (
          <div key={s.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 10px', borderRadius: 10,
            background: C.sky, cursor: 'pointer',
          }}>
            <Icon name="search" size={13} color={C.fg3} />
            <span style={{ fontFamily: C.fb, fontSize: 13, color: C.ink, flex: 1 }}>{s.query}</span>
            <Icon name="arrow-right" size={13} color={C.ocean} />
          </div>
        ))}
      </div>
    </VCard>
  );
}

// ─── Popular Destinations ─────────────────────────────────────
function PopularDestinations({ bookmarks, onToggle }) {
  const dests = [
    { name: 'Bali',        c: 'Indonesia',   flag: '🇮🇩', bud: '₹35,000', best: 'Apr–Oct',
      g: `linear-gradient(160deg,#F6CD83 0%,${C.amber} 45%,#87520A 100%)` },
    { name: 'Thailand',    c: 'Thailand',    flag: '🇹🇭', bud: '₹45,000', best: 'Nov–Mar',
      g: `linear-gradient(160deg,${C.sky} 0%,${C.ocean} 55%,${C.navy} 100%)` },
    { name: 'Dubai',       c: 'UAE',         flag: '🇦🇪', bud: '₹60,000', best: 'Nov–Mar',
      g: 'linear-gradient(160deg,#FBE5BD 0%,#F2B650 45%,#87520A 100%)' },
    { name: 'Japan',       c: 'Japan',       flag: '🇯🇵', bud: '₹80,000', best: 'Mar–May',
      g: 'linear-gradient(160deg,#FFD0DA 0%,#E8859C 50%,#0C447C 100%)' },
    { name: 'Maldives',    c: 'Maldives',    flag: '🇲🇻', bud: '₹1.2L',  best: 'Nov–Apr',
      g: 'linear-gradient(160deg,#B0EEFF 0%,#378ADD 45%,#07304F 100%)' },
    { name: 'Switzerland', c: 'Switzerland', flag: '🇨🇭', bud: '₹1.5L',  best: 'Jun–Sep',
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
        action={{ label: 'See all', fn: () => {} }}
      />
      <div className="no-scrollbar" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {dests.map(d => (
          <VCard key={d.name} padding={0} radius={20} onClick={() => {}}
            style={{ minWidth: 178, maxWidth: 178, overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ height: 130, background: d.g, position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 178 130" width="178" height="130"
                style={{ position: 'absolute', inset: 0 }}>
                <ellipse cx="89" cy="118" rx="115" ry="28" fill="rgba(0,0,0,0.14)" />
                {artworks[d.name]}
              </svg>
              <div style={{
                position: 'absolute', top: 10, left: 10,
                background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)',
                padding: '3px 9px', borderRadius: 99,
                fontFamily: C.fb, fontWeight: 600, fontSize: 11, color: '#fff',
              }}>{d.flag} {d.c}</div>
              {(() => {
                const saved = bookmarks && bookmarks.find(b => b.destination === d.name);
                return (
                  <button onClick={e => { e.stopPropagation(); onToggle && onToggle(d, saved); }} style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 28, height: 28, borderRadius: 8, border: 0,
                    background: saved ? 'rgba(226,85,61,0.85)' : 'rgba(255,255,255,0.18)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'background 180ms',
                  }}>
                    <Icon name="heart" size={14} color="#fff" />
                  </button>
                );
              })()}
            </div>
            <div style={{ padding: '12px 14px 14px' }}>
              <div style={{
                fontFamily: C.fd, fontWeight: 700, fontSize: 17,
                color: C.navy, marginBottom: 8,
              }}>{d.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="banknote" size={12} color={C.fg3} />
                  <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg2 }}>From {d.bud}</span>
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
      ey: 'TRENDING', tag: '🌸 Seasonal',
      title: 'Cherry blossom in Japan',
      desc: 'Book 3 months out. March–April window.',
      g: 'linear-gradient(160deg,#FFD0DA 0%,#E8859C 50%,#0C447C 100%)',
    },
    {
      ey: 'POPULAR', tag: '🏔 Nature',
      title: 'Summer in Switzerland',
      desc: 'Hiking, lakes, crisp alpine air. June–August.',
      g: `linear-gradient(160deg,#9FC7F1 0%,#1E62AC 50%,${C.navy} 100%)`,
    },
    {
      ey: 'BUDGET GUIDE', tag: '💰 Budget',
      title: 'Thailand under ₹50,000',
      desc: 'Flights + 7 nights, all-in. Fully plannable.',
      g: `linear-gradient(160deg,${C.sky} 0%,${C.ocean} 55%,${C.navy} 100%)`,
    },
  ];
  return (
    <div style={{ marginBottom: 28 }}>
      <VSectionHead
        eyebrow="INSPIRATION"
        title="Trending this week"
        action={{ label: 'See all', fn: () => {} }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {items.map(it => (
          <VCard key={it.title} padding={0} radius={20} onClick={() => {}} style={{ overflow: 'hidden' }}>
            <div style={{
              height: 110, background: it.g, position: 'relative',
              display: 'flex', alignItems: 'flex-end', padding: 12,
            }}>
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

// ─── Saved Places ─────────────────────────────────────────────
function SavedPlaces({ bookmarks, onRemove }) {
  if (!bookmarks || bookmarks.length === 0) return null;
  return (
    <VCard padding={20} radius={20} style={{ marginBottom: 40 }}>
      <VSectionHead
        eyebrow="YOUR WISHLIST"
        title="Saved places"
        action={{ label: 'See all', fn: () => {} }}
        style={{ marginBottom: 12 }}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {bookmarks.map(p => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 14, background: C.sky, cursor: 'pointer',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: p.gradient || `linear-gradient(135deg,${C.ocean},${C.navy})`, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 14, color: C.navy }}>{p.flag} {p.destination}</div>
              <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3 }}>{p.hint}</div>
            </div>
            <button onClick={() => onRemove && onRemove(p.id)} style={{
              background: 'none', border: 0, cursor: 'pointer', padding: 4, display: 'flex',
            }}>
              <Icon name="heart" size={16} color="#E2553D" />
            </button>
          </div>
        ))}
      </div>
    </VCard>
  );
}

// ─── Root Dashboard ───────────────────────────────────────────
function Dashboard() {
  const [nav,       setNav]       = useState('home');
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const email = localStorage.getItem('voya_user_email') || '';
    if (!email) return;
    fetch(`http://127.0.0.1:5000/bookmarks?user_email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => { if (data.success) setBookmarks(data.bookmarks); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (window.lucide) window.lucide.createIcons();
    });
    return () => cancelAnimationFrame(id);
  });

  const handleToggleBookmark = async (dest, existing) => {
    const email = localStorage.getItem('voya_user_email') || '';
    if (!email) return;
    if (existing) {
      await fetch(`http://127.0.0.1:5000/bookmark/${existing.id}?user_email=${encodeURIComponent(email)}`, { method: 'DELETE' }).catch(() => {});
      setBookmarks(prev => prev.filter(b => b.id !== existing.id));
    } else {
      const res  = await fetch('http://127.0.0.1:5000/bookmark', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_email: email, destination: dest.name, flag: dest.flag, gradient: dest.g, hint: dest.c }),
      }).catch(() => null);
      if (res) {
        const data = await res.json();
        if (data.success && data.bookmark) setBookmarks(prev => [data.bookmark, ...prev]);
      }
    }
  };

  const handleRemoveBookmark = async (id) => {
    const email = localStorage.getItem('voya_user_email') || '';
    await fetch(`http://127.0.0.1:5000/bookmark/${id}?user_email=${encodeURIComponent(email)}`, { method: 'DELETE' }).catch(() => {});
    setBookmarks(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={nav} onNav={setNav} />
      <main style={{
        flex: 1, overflowY: 'auto',
        padding: '32px 36px', background: C.cream,
      }}>
        <HeroSection />
        <AISearch />
        <QuickActions onNav={setNav} />
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 358px',
          gap: 28, marginBottom: 28,
        }}>
          <UpcomingTrips />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AIAssistant />
            <RecentSearches />
          </div>
        </div>
        <PopularDestinations bookmarks={bookmarks} onToggle={handleToggleBookmark} />
        <TravelInspiration />
        <SavedPlaces bookmarks={bookmarks} onRemove={handleRemoveBookmark} />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Dashboard />);
