// plantrip/MyTripsView.jsx
const { useState, useEffect } = React;

const STATUS_OPTIONS = [
  { key: 'planning',  label: 'Planning'  },
  { key: 'upcoming',  label: 'Upcoming'  },
  { key: 'completed', label: 'Completed' },
  { key: 'wishlist',  label: 'Wishlist'  },
];

function TripCard({ trip, onClick, onDelete, onStatusChange }) {
  const [hv,           setHv]           = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [showStatuses, setShowStatuses] = useState(false);
  const [updating,     setUpdating]     = useState(false);
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
        height: 140, background: trip.gradient,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Flag badge */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: 'rgba(0,0,0,0.24)', backdropFilter: 'blur(8px)',
          padding: '4px 10px', borderRadius: 99,
          fontFamily: C.fb, fontWeight: 600, fontSize: 12, color: '#fff',
        }}>{trip.flag} {trip.destination}</div>

        {/* Status badge — click to change */}
        <div style={{ position: 'absolute', top: 12, right: 12 }}>
          <div
            onClick={e => { e.stopPropagation(); if (!updating) setShowStatuses(s => !s); }}
            style={{
              background: st.bg, color: st.color,
              fontFamily: C.fd, fontWeight: 700, fontSize: 10,
              padding: '4px 10px', borderRadius: 99, backdropFilter: 'blur(8px)',
              letterSpacing: '0.07em', textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.25)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              opacity: updating ? 0.6 : 1,
            }}
          >
            {st.label}
            <Icon name="chevron-down" size={10} color={st.color} />
          </div>
          {showStatuses && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: 'absolute', top: 30, right: 0, zIndex: 50,
                background: '#fff', borderRadius: 12,
                boxShadow: '0 8px 24px rgba(12,68,124,0.16)',
                padding: '6px 0', minWidth: 130,
                border: `1px solid ${C.borderSoft}`,
              }}
            >
              {STATUS_OPTIONS.map(opt => {
                const cfg = STATUS_CONFIG[opt.key];
                const isActive = trip.status === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={async () => {
                      if (isActive) { setShowStatuses(false); return; }
                      setShowStatuses(false);
                      setUpdating(true);
                      await onStatusChange(trip.id, opt.key);
                      setUpdating(false);
                    }}
                    style={{
                      padding: '8px 14px', cursor: 'pointer',
                      fontFamily: C.fd, fontWeight: isActive ? 700 : 600,
                      fontSize: 12, color: isActive ? cfg.color : C.fg2,
                      background: isActive ? cfg.bg : 'transparent',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    {isActive && <Icon name="check" size={11} color={cfg.color} />}
                    {opt.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>
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
            <span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}>{trip.startDate ? `${fmtDate(trip.startDate)} – ${fmtDate(trip.endDate)}` : 'Dates not set'}</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={e => {
                e.stopPropagation();
                if (!deleting && window.confirm(`Delete ${trip.destination} trip?`)) {
                  setDeleting(true);
                  onDelete(trip.id).finally(() => setDeleting(false));
                }
              }}
              style={{
                background: 'none', border: 0, padding: 4, cursor: deleting ? 'default' : 'pointer',
                opacity: deleting ? 0.4 : 0.55, display: 'flex', alignItems: 'center',
                transition: 'opacity 150ms',
              }}
            >
              <Icon name="trash-2" size={14} color="#E2553D" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.ocean }}>
              <span style={{ fontFamily: C.fd, fontWeight: 600, fontSize: 13 }}>View itinerary</span>
              <Icon name="arrow-right" size={13} color={C.ocean} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MyTripsView({ onSelectTrip, openTripId, onNewTrip }) {
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [filter,  setFilter]  = useState('all');
  const [toast, showToast]    = useToast();

  useEffect(() => {
    Voya.api('/api/get-trips').then(r => {
      if (!r.ok) { setError(r.error); setLoading(false); return; }
      setTrips(r.data.trips);
      setLoading(false);
      if (openTripId) {
        const t = r.data.trips.find(x => x.id === String(openTripId));
        if (t) onSelectTrip(t);
      }
    });
  }, []);

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const counts = {
    upcoming:  trips.filter(t => t.status === 'upcoming').length,
    planning:  trips.filter(t => t.status === 'planning').length,
    completed: trips.filter(t => t.status === 'completed').length,
    wishlist:  trips.filter(t => t.status === 'wishlist').length,
  };

  const visibleTrips = filter === 'all' ? trips : trips.filter(t => t.status === filter);

  const handleStatusChange = async (id, newStatus) => {
    const r = await Voya.api(`/api/update-trip-status/${id}`, { method: 'PATCH', body: { status: newStatus } });
    if (r.ok) setTrips(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    else showToast(r.error, 'error');
  };

  const handleDelete = async (id) => {
    const r = await Voya.api(`/api/delete-trip/${id}`, { method: 'DELETE' });
    if (r.ok) { setTrips(prev => prev.filter(t => t.id !== id)); showToast('Trip deleted'); }
    else showToast(r.error, 'error');
  };

  return (
    <div className="v-main" style={{ flex: 1, overflowY: 'auto', padding: '40px 52px 60px', background: C.cream }}>

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
          <button onClick={onNewTrip} style={{
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
      <div className="m-wrap" style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
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
             filter === 'upcoming' ? 'Use "Book it all" on an itinerary to see it here.' :
             'Generate your first itinerary and save it to see it here.'}
          </div>
        </div>
      ) : (
        <div className="m-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {visibleTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} onClick={onSelectTrip} onDelete={handleDelete} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
      {toast}
    </div>
  );
}

Object.assign(window, { MyTripsView });
