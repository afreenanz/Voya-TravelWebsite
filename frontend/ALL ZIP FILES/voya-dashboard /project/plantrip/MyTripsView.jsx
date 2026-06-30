// plantrip/MyTripsView.jsx
const { useState, useEffect } = React;

const TRIP_GRADIENTS = {
  thailand: 'linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)',
  goa:      'linear-gradient(160deg,#F6CD83 0%,#EF9F27 55%,#87520A 100%)',
  dubai:    'linear-gradient(160deg,#FBE5BD 0%,#F2B650 45%,#87520A 100%)',
  japan:    'linear-gradient(160deg,#FFD0DA 0%,#E8859C 50%,#0C447C 100%)',
};

function TripCard({ trip, onClick }) {
  const [hv, setHv] = useState(false);
  const st = STATUS_CONFIG[trip.status] || STATUS_CONFIG.planning;

  return (
    <div
      onClick={() => onClick(trip)}
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      style={{
        background: '#fff', borderRadius: 20, overflow: 'hidden', cursor: 'pointer',
        boxShadow: hv ? '0 10px 28px rgba(12,68,124,0.13)' : '0 2px 10px rgba(12,68,124,0.07)',
        transform: hv ? 'translateY(-3px)' : 'none',
        transition: 'all 220ms cubic-bezier(0.2,0.8,0.2,1)',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        height: 140, background: TRIP_GRADIENTS[trip.id] || trip.gradient,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative SVG artwork per destination */}
        <svg viewBox="0 0 320 140" width="100%" height="140"
          style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
          {trip.id === 'thailand' && <>
            <rect x="110" y="60" width="100" height="80" fill="rgba(4,24,50,0.5)" />
            <polygon points="100,60 160,28 220,60" fill="rgba(4,24,50,0.6)" />
            <polygon points="112,50 160,22 208,50" fill="rgba(2,15,36,0.55)" />
            <rect x="146" y="94" width="28" height="46" rx="2" fill="rgba(2,15,36,0.5)" />
          </>}
          {trip.id === 'goa' && <>
            <ellipse cx="160" cy="130" rx="200" ry="32" fill="rgba(0,0,0,0.15)" />
            <path d="M 100 140 Q 120 90 140 68" stroke="rgba(0,0,0,0.30)" strokeWidth="8" fill="none" strokeLinecap="round" />
            <path d="M 140 68 C 108 50 80 54 60 44" stroke="rgba(0,0,0,0.22)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 140 68 C 168 48 190 52 210 42" stroke="rgba(0,0,0,0.22)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </>}
          {trip.id === 'dubai' && <>
            <rect x="30"  y="50" width="28" height="90" fill="rgba(0,0,0,0.22)" />
            <rect x="68"  y="34" width="32" height="106" fill="rgba(0,0,0,0.26)" />
            <rect x="110" y="18" width="24" height="122" fill="rgba(0,0,0,0.30)" />
            <rect x="144" y="42" width="28" height="98" fill="rgba(0,0,0,0.24)" />
            <rect x="182" y="60" width="22" height="80" fill="rgba(0,0,0,0.20)" />
            <rect x="214" y="48" width="30" height="92" fill="rgba(0,0,0,0.22)" />
          </>}
          {trip.id === 'japan' && <>
            {[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <circle key={i} cx={10 + i * 25} cy={100 + (i % 2) * 12} r={9} fill="rgba(255,160,185,0.40)" />
            ))}
            <polygon points="130,10 220,130 40,130" fill="rgba(255,255,255,0.06)" />
          </>}
        </svg>

        {/* Flag badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(0,0,0,0.24)', backdropFilter: 'blur(8px)',
          padding: '4px 10px', borderRadius: 99,
          fontFamily: C.fb, fontWeight: 600, fontSize: 12, color: '#fff',
        }}>{trip.flag} {trip.destination}</div>

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: st.bg, color: st.color,
          fontFamily: C.fd, fontWeight: 700, fontSize: 10,
          padding: '4px 10px', borderRadius: 99, backdropFilter: 'blur(8px)',
          letterSpacing: '0.07em', textTransform: 'uppercase',
          border: '1px solid rgba(255,255,255,0.25)',
        }}>{st.label}</div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px 18px 18px' }}>
        <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 20, color: C.navy, marginBottom: 3 }}>
          {trip.destination}
        </div>
        <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginBottom: 12 }}>{trip.cities}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon name="calendar" size={13} color={C.fg3} />
            <span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}>{trip.startDate} – {trip.endDate}</span>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="moon" size={13} color={C.fg3} />
              <span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}>{trip.days} days</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="banknote" size={13} color={C.fg3} />
              <span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}>{trip.budget}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="users" size={13} color={C.fg3} />
              <span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}>{trip.travelers}</span>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 14, paddingTop: 14,
          borderTop: `1px solid ${C.borderSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>{trip.travelStyle}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.ocean }}>
            <span style={{ fontFamily: C.fd, fontWeight: 600, fontSize: 13 }}>View itinerary</span>
            <Icon name="arrow-right" size={13} color={C.ocean} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MyTripsView({ onSelectTrip }) {
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    const email = localStorage.getItem('voya_user_email') || '';
    fetch(`http://127.0.0.1:5000/get-trips?user_email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setTrips(data.trips);
        else setError(data.error || 'Failed to load trips.');
      })
      .catch(() => setError('Could not reach the server.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const counts = {
    upcoming:  trips.filter(t => t.status === 'upcoming').length,
    planning:  trips.filter(t => t.status === 'planning').length,
    completed: trips.filter(t => t.status === 'completed').length,
    wishlist:  trips.filter(t => t.status === 'wishlist').length,
  };

  const visibleTrips = filter === 'all' ? trips : trips.filter(t => t.status === filter);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 52px 60px', background: C.cream }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: C.fd, fontWeight: 700, fontSize: 11,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: C.ocean, marginBottom: 8,
        }}>YOUR ADVENTURES</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <h1 style={{
            fontFamily: C.fd, fontWeight: 700, fontSize: 34,
            color: C.navy, margin: 0, letterSpacing: '-0.02em',
          }}>My Trips</h1>
          <button style={{
            padding: '10px 22px', borderRadius: 99, border: 0,
            background: C.amber, color: '#fff',
            fontFamily: C.fd, fontWeight: 700, fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: '0 6px 20px rgba(239,159,39,0.28)',
          }}>
            <Icon name="plus" size={15} color="#fff" />
            New trip
          </button>
        </div>
      </div>

      {/* Stats strip — click to filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {[
          { key: 'all',       label: 'All',       val: trips.length,    color: C.navy,    activeBg: 'rgba(12,68,124,0.08)' },
          { key: 'upcoming',  label: 'Upcoming',  val: counts.upcoming, color: '#1e7a4d', activeBg: 'rgba(47,165,106,0.10)' },
          { key: 'wishlist',  label: 'Saved',     val: counts.wishlist, color: '#87520A', activeBg: 'rgba(239,159,39,0.10)' },
          { key: 'completed', label: 'Completed', val: counts.completed,color: C.fg2,     activeBg: 'rgba(44,44,42,0.07)' },
        ].map(s => {
          const active = filter === s.key;
          return (
            <div key={s.key} onClick={() => setFilter(s.key)} style={{
              flex: 1, padding: '14px 18px', background: active ? s.activeBg : '#fff',
              borderRadius: 16, cursor: 'pointer',
              boxShadow: active ? 'none' : '0 1px 6px rgba(12,68,124,0.06)',
              border: `1.5px solid ${active ? s.color + '40' : 'transparent'}`,
              transition: 'all 180ms',
            }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 28, color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontFamily: C.fb, fontSize: 12, color: active ? s.color : C.fg3, marginTop: 4, fontWeight: active ? 600 : 400 }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Trip grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: C.fb, fontSize: 14, color: C.fg3 }}>
          Loading your trips…
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontFamily: C.fb, fontSize: 14, color: '#E2553D' }}>{error}</div>
        </div>
      ) : visibleTrips.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 22, color: C.navy, marginBottom: 10 }}>
            {filter === 'all' ? 'No trips yet' : `No ${filter === 'wishlist' ? 'saved' : filter} trips`}
          </div>
          <div style={{ fontFamily: C.fb, fontSize: 14, color: C.fg3 }}>
            {filter === 'wishlist' ? 'Save an itinerary to see it here.' :
             filter === 'upcoming' ? 'Complete a booking to see confirmed trips here.' :
             'Generate your first itinerary and save it to see it here.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {visibleTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} onClick={onSelectTrip} />
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MyTripsView });
