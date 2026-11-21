// plantrip/ItineraryView.jsx
const { useState, useEffect } = React;

const STATUS_CONFIG = {
  upcoming:  { label: 'Upcoming',  bg: 'rgba(47,165,106,0.12)', color: '#1e7a4d' },
  planning:  { label: 'Planning',  bg: 'rgba(55,138,221,0.12)', color: '#144E8E' },
  completed: { label: 'Completed', bg: 'rgba(44,44,42,0.08)',   color: '#4A4842' },
  wishlist:  { label: 'Wishlist',  bg: 'rgba(239,159,39,0.14)', color: '#87520A' },
};

function ActivityRow({ act, isLast }) {
  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
      {/* Timeline spine */}
      {!isLast && (
        <div style={{
          position: 'absolute', left: 56, top: 36, bottom: -4,
          width: 1, background: `linear-gradient(to bottom, ${C.borderDefault}, transparent)`,
        }} />
      )}

      {/* Time */}
      <div style={{
        width: 52, flexShrink: 0, paddingTop: 10,
        fontFamily: C.fb, fontSize: 11, fontWeight: 600,
        color: C.fg3, textAlign: 'right', paddingRight: 8,
        letterSpacing: '0.02em',
      }}>{act.time}</div>

      {/* Icon dot */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        background: 'rgba(55,138,221,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 4, position: 'relative', zIndex: 1,
      }}>
        <Icon name={act.icon} size={14} color={C.ocean} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, paddingLeft: 12, paddingBottom: isLast ? 0 : 20, paddingTop: 6 }}>
        <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 14, color: C.navy, lineHeight: 1.3 }}>
          {act.name}
        </div>
        <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginTop: 2, lineHeight: 1.4 }}>
          {act.note}
        </div>
      </div>
    </div>
  );
}

function DayCard({ dayData, index }) {
  const [open, setOpen] = useState(true);
  const dayColors = ['#378ADD', '#EF9F27', '#2FA56A', '#E8859C', '#6FAAEA'];
  const accent = dayColors[index % dayColors.length];

  return (
    <div style={{
      background: '#fff', borderRadius: 20,
      boxShadow: '0 2px 10px rgba(12,68,124,0.07)',
      overflow: 'hidden', marginBottom: 16,
    }}>
      {/* Day header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '16px 20px', border: 0,
          background: '#fff', cursor: 'pointer', textAlign: 'left',
          display: 'flex', alignItems: 'center', gap: 14,
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: accent,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 14, color: '#fff' }}>
            D{dayData.day}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy, lineHeight: 1.2 }}>
            {dayData.title}
          </div>
          {dayData.theme && (
            <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginTop: 2 }}>{dayData.theme}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: C.fb, fontSize: 12, color: C.fg3,
          }}>{dayData.activities.length} activities</span>
          <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color={C.fg3} />
        </div>
      </button>

      {/* Activities */}
      {open && (
        <div style={{
          padding: '4px 20px 20px',
          borderTop: `1px solid ${C.borderSoft}`,
        }}>
          {dayData.activities.map((act, i) => (
            <ActivityRow key={i} act={act} isLast={i === dayData.activities.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Cost Breakdown Card ──────────────────────────────────────
// How the traveller gets there decides the label/icon of the first cost line.
const TRANSPORT_COST_LINE = {
  flight: { icon: 'plane', label: 'Flights' }, train: { icon: 'train-front', label: 'Train tickets' },
  bus: { icon: 'bus', label: 'Bus tickets' }, car: { icon: 'car', label: 'Fuel & tolls' },
  any: { icon: 'plane', label: 'Getting there' },
};

function CostBreakdownCard({ breakdown, summary, transport, onProceed }) {
  if (!breakdown) return null;
  const travelLine = TRANSPORT_COST_LINE[transport] || TRANSPORT_COST_LINE.flight;

  const rows = [
    { icon: travelLine.icon, label: travelLine.label,  data: breakdown.flights },
    { icon: 'building-2',   label: 'Accommodation',    data: breakdown.accommodation },
    { icon: 'utensils',     label: 'Food & Dining',    data: breakdown.food },
    { icon: 'ticket',       label: 'Activities',       data: breakdown.activities },
    { icon: 'car',          label: 'Local Transport',  data: breakdown.local_transport },
    { icon: 'shopping-bag', label: 'Miscellaneous',    data: breakdown.misc },
  ].filter(r => r.data?.amount);

  if (rows.length === 0) return null;

  return (
    <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 12px rgba(12,68,124,0.08)', marginTop: 28 }}>
      {/* Header */}
      <div style={{ padding: '22px 28px 16px', borderBottom: `1px solid ${C.borderSoft}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(55,138,221,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="receipt" size={18} color={C.ocean} />
        </div>
        <div>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.ocean, marginBottom: 1 }}>TRIP COST</div>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 18, color: C.navy }}>Full cost breakdown</div>
        </div>
      </div>

      {/* Rows */}
      <div style={{ padding: '4px 28px' }}>
        {rows.map(({ icon, label, data }, i) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: i < rows.length - 1 ? `1px solid ${C.borderSoft}` : 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.sky, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={15} color={C.ocean} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 14, color: C.navy }}>{label}</div>
              {data.note && <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginTop: 1 }}>{data.note}</div>}
            </div>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 15, color: C.ink, whiteSpace: 'nowrap' }}>{data.amount}</div>
          </div>
        ))}
      </div>

      {/* Total + CTA */}
      <div style={{ padding: '18px 28px 24px', background: C.sky }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginBottom: 3 }}>Total trip cost</div>
            <div data-testid="trip-total" style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 30, color: C.navy, letterSpacing: '-0.02em' }}>{breakdown.total}</div>
            {summary && summary.budget_formatted && (
              <div data-testid="budget-diff" style={{ fontFamily: C.fb, fontWeight: 600, fontSize: 13, marginTop: 4,
                color: summary.over_budget ? C.danger : C.success }}>
                {summary.over_budget
                  ? `${summary.remaining_formatted.replace('-', '')} over your ${summary.budget_formatted} budget`
                  : summary.remaining === 0 ? `Exactly your ${summary.budget_formatted} budget`
                  : `${summary.remaining_formatted} under your ${summary.budget_formatted} budget`}
              </div>
            )}
          </div>
          <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, textAlign: 'right', maxWidth: 180, lineHeight: 1.5 }}>
            Each line is a realistic AI estimate; the total is added up by Voya. Check live prices before you book.
          </div>
        </div>
        <button
          onClick={onProceed}
          style={{
            width: '100%', padding: '16px', borderRadius: 99, border: 0,
            background: `linear-gradient(135deg, ${C.amber}, #F2B650)`,
            color: '#fff', fontFamily: C.fd, fontWeight: 700, fontSize: 16,
            letterSpacing: '-0.01em', cursor: 'pointer',
            boxShadow: '0 8px 28px rgba(239,159,39,0.38)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'transform 140ms, box-shadow 140ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(239,159,39,0.46)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 28px rgba(239,159,39,0.38)'; }}
        >
          <Icon name="credit-card" size={18} color="#fff" />
          Proceed to Book
          <Icon name="arrow-right" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

// ─── Booking Page ────────────────────────────────────────────
// Voya doesn't sell flights or hotels. "Book" means: mark this plan as an
// upcoming trip in My Trips. The cards below summarise the AI estimates.
function BookingPage({ trip, savedId, onBooked, onClose }) {
  const bd  = trip.costBreakdown || {};
  const [confirming, setConfirming] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');

  const allActs      = (trip.itinerary || []).flatMap(d => d.activities || []);
  const flightArr    = allActs.find(a => a.icon === 'plane-landing');
  const flightDep    = allActs.find(a => a.icon === 'plane-takeoff');
  const hotelCheckIn = (trip.itinerary?.[0]?.activities || []).find(a => a.icon === 'building-2');
  const skipIcons    = new Set(['plane-landing','plane-takeoff','building-2','car','bus','train-front','ship','coffee','utensils']);
  const topActs      = allActs.filter(a => !skipIcons.has(a.icon) && a.name).slice(0, 5);
  const start        = fmtDate(trip.startDate);
  const end          = fmtDate(trip.endDate);

  const handleBookAll = async () => {
    if (confirming || done) return;
    setConfirming(true);
    setError('');
    const r = savedId
      ? await Voya.api(`/api/update-trip-status/${savedId}`, { method: 'PATCH', body: { status: 'upcoming' } })
      : await Voya.api('/api/save-trip', { method: 'POST', body: { trip: { ...trip, status: 'upcoming' } } });
    setConfirming(false);
    if (!r.ok) { setError(r.error); return; }
    setDone(true);
    if (onBooked) onBooked(r.data.trip);
  };

  const cardStyle = {
    background: done ? 'rgba(47,165,106,0.05)' : '#fff',
    borderRadius: 20, padding: '20px 22px', marginBottom: 14,
    border: `1.5px solid ${done ? 'rgba(47,165,106,0.25)' : C.borderSoft}`,
    transition: 'all 280ms',
  };

  const sectionLabel = (label, icon, accentColor) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: done ? 'rgba(47,165,106,0.12)' : `${accentColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={14} color={done ? '#1e7a4d' : accentColor} />
      </div>
      <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: done ? '#1e7a4d' : accentColor }}>{label}</span>
      <span style={{ marginLeft: 'auto', fontFamily: C.fb, fontSize: 11, color: C.fg3 }}>Estimate</span>
    </div>
  );

  if (done) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(7,24,50,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 28, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 32px 64px rgba(7,24,50,0.3)' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#2FA56A,#1a8a53)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 12px 32px rgba(47,165,106,0.28)' }}>
          <Icon name="check" size={32} color="#fff" />
        </div>
        <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 28, color: C.navy, marginBottom: 10 }}>Trip saved as upcoming!</div>
        <div style={{ fontFamily: C.fb, fontSize: 15, color: C.fg2, lineHeight: 1.6, marginBottom: 28 }}>
          Your {trip.destination} trip is now in My Trips as Upcoming, with the full itinerary and cost estimate.
        </div>
        <div style={{ background: C.sky, borderRadius: 16, padding: '14px 18px', marginBottom: 28, textAlign: 'left' }}>
          {[
            { icon: 'calendar',     label: start ? `${start} – ${end}` : `${trip.days} days` },
            { icon: 'map',          label: `${trip.itinerary?.length || trip.days} day-by-day plan saved` },
            { icon: 'check-circle', label: `Estimated total ${bd.total || trip.budget}` },
          ].map((m, i, arr) => (
            <div key={m.icon} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 0', borderBottom: i < arr.length - 1 ? `1px solid ${C.borderSoft}` : 'none' }}>
              <Icon name={m.icon} size={14} color='#2FA56A' />
              <span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}>{m.label}</span>
            </div>
          ))}
        </div>
        <button onClick={() => { window.location.href = '/app/trips'; }} style={{ width: '100%', padding: '14px', borderRadius: 99, border: 0, background: C.amber, color: '#fff', fontFamily: C.fd, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 8px 24px rgba(239,159,39,0.32)' }}>
          View in My Trips →
        </button>
        <button onClick={onClose} style={{ marginTop: 12, background: 'none', border: 0, cursor: 'pointer', fontFamily: C.fb, fontWeight: 600, fontSize: 14, color: C.fg3 }}>
          Back to itinerary
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(7,24,50,0.72)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: C.cream, borderRadius: 28, width: '100%', maxWidth: 600, maxHeight: '94vh', overflowY: 'auto', boxShadow: '0 32px 64px rgba(7,24,50,0.3)' }}>

        {/* Gradient header */}
        <div style={{ background: trip.gradient, borderRadius: '28px 28px 0 0', padding: '22px 26px 24px' }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.18)', border: 0, borderRadius: 10, padding: '6px 14px', cursor: 'pointer', color: '#fff', fontFamily: C.fb, fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Icon name="arrow-left" size={14} color="#fff" /> Back to itinerary
          </button>
          <div style={{ fontSize: 26, marginBottom: 4 }}>{trip.flag}</div>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 24, color: '#fff', marginBottom: 3 }}>{trip.destination} Trip</div>
          <div style={{ fontFamily: C.fb, fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>{start} – {end} · {trip.travelers} traveler{trip.travelers === 1 ? '' : 's'} · {trip.days} days</div>
        </div>

        <div style={{ padding: '20px 20px 24px' }}>

          {/* ── FLIGHTS ── */}
          {(bd.flights || flightArr || flightDep) && (
          <div style={cardStyle}>
            {sectionLabel('Flights', 'plane', C.ocean)}
            {bd.flights?.note && <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 15, color: C.navy, marginBottom: 8 }}>{bd.flights.note.split('·')[0].trim()}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {flightArr && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><Icon name="plane-landing" size={13} color={C.fg3} style={{ marginTop: 2 }} /><span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}><b>Arrival:</b> {flightArr.name}{flightArr.note ? ` — ${flightArr.note.split('·')[0].trim()}` : ''}</span></div>}
              {flightDep && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><Icon name="plane-takeoff" size={13} color={C.fg3} style={{ marginTop: 2 }} /><span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}><b>Departure:</b> {flightDep.name}{flightDep.note ? ` — ${flightDep.note.split('·')[0].trim()}` : ''}</span></div>}
              {bd.flights?.note && <div style={{ display: 'flex', gap: 8 }}><Icon name="info" size={13} color={C.fg3} /><span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>{bd.flights.note}</span></div>}
            </div>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 22, color: C.navy }}>{bd.flights?.amount}</div>
          </div>
          )}

          {/* ── STAY ── */}
          {(bd.accommodation || hotelCheckIn) && (
          <div style={cardStyle}>
            {sectionLabel('Stay', 'building-2', C.amber)}
            {bd.accommodation?.note && <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 15, color: C.navy, marginBottom: 8 }}>{bd.accommodation.note.split('·')[0].trim()}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {hotelCheckIn && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><Icon name="key" size={13} color={C.fg3} style={{ marginTop: 2 }} /><span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}>{hotelCheckIn.name}{hotelCheckIn.note ? ` — ${hotelCheckIn.note.split('·')[0].trim()}` : ''}</span></div>}
              {start && <div style={{ display: 'flex', gap: 8 }}><Icon name="calendar" size={13} color={C.fg3} /><span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg2 }}>Check-in {start} · Check-out {end}</span></div>}
              {bd.accommodation?.note && <div style={{ display: 'flex', gap: 8 }}><Icon name="info" size={13} color={C.fg3} /><span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>{bd.accommodation.note}</span></div>}
            </div>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 22, color: C.navy }}>{bd.accommodation?.amount}</div>
          </div>
          )}

          {/* ── ACTIVITIES ── */}
          {(topActs.length > 0 || bd.activities) && (
          <div style={cardStyle}>
            {sectionLabel('Activities & Experiences', 'compass', C.navy)}
            {topActs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {topActs.map((act, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 7, background: C.sky, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <Icon name={act.icon || 'map-pin'} size={11} color={C.ocean} />
                    </div>
                    <div>
                      <div style={{ fontFamily: C.fd, fontWeight: 600, fontSize: 13, color: C.navy }}>{act.name}</div>
                      {act.note && <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3, marginTop: 1 }}>{act.note.split('·')[0].trim()}</div>}
                    </div>
                  </div>
                ))}
                {bd.activities?.note && <div style={{ display: 'flex', gap: 8, marginTop: 4 }}><Icon name="info" size={13} color={C.fg3} /><span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>{bd.activities.note}</span></div>}
              </div>
            )}
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 22, color: C.navy }}>{bd.activities?.amount}</div>
          </div>
          )}

          {/* ── BOOK EVERYTHING ── */}
          <div style={{ background: '#fff', borderRadius: 20, padding: '20px 22px', border: `1.5px solid ${C.borderDefault}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginBottom: 3 }}>Estimated total</div>
                <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 28, color: C.navy, letterSpacing: '-0.02em' }}>{bd.total || trip.budget}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
                {[bd.flights, bd.accommodation, bd.activities].filter(Boolean).map((item, i) => (
                  <span key={i} style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3 }}>{item.amount}</span>
                ))}
              </div>
            </div>
            <button
              onClick={handleBookAll}
              disabled={confirming}
              style={{
                width: '100%', padding: '15px', borderRadius: 99, border: 0,
                background: `linear-gradient(135deg,${C.amber},#F2B650)`,
                color: '#fff',
                fontFamily: C.fd, fontWeight: 700, fontSize: 16,
                cursor: confirming ? 'default' : 'pointer',
                opacity: confirming ? 0.75 : 1,
                boxShadow: '0 8px 28px rgba(239,159,39,0.38)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 220ms',
              }}
            >
              <Icon name={confirming ? 'loader' : 'zap'} size={18} color="#fff" />
              {confirming ? 'Saving…' : 'Book it all'}
            </button>
            <VNotice style={{ textAlign: 'center', marginTop: 10 }}>{error}</VNotice>
            <p style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3, textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              Voya doesn't take payments. This saves the trip to My Trips as Upcoming so you can book each part yourself.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function itineraryAsText(t) {
  const lines = [`${t.flag || ''} ${t.destination} Trip`.trim(), t.cities, ''];
  (t.itinerary || []).forEach(d => {
    lines.push(`Day ${d.day}: ${d.title}`);
    (d.activities || []).forEach(a => lines.push(`  ${a.time ? a.time + ' ' : ''}${a.name}${a.note ? ' — ' + a.note : ''}`));
    lines.push('');
  });
  if (t.costBreakdown?.total) lines.push(`Estimated total: ${t.costBreakdown.total}`);
  lines.push('', 'Planned with Voya');
  return lines.join('\n');
}

// ─── Itinerary View ───────────────────────────────────────────
function ItineraryView({ trip, formData, onBack, isSaved }) {
  const [current,     setCurrent]     = useState(trip || formData);
  const [savedId,     setSavedId]     = useState(isSaved && trip ? trip.id : null);
  const [saving,      setSaving]      = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [toast, showToast]            = useToast();

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  if (!current) return null;
  const displayTrip = current;
  const saved = Boolean(savedId);
  const st = STATUS_CONFIG[displayTrip.status] || STATUS_CONFIG.planning;

  const handleSave = async () => {
    if (saved || saving) return;
    setSaving(true);
    const r = await Voya.api('/api/save-trip', { method: 'POST', body: { trip: { ...displayTrip, status: 'wishlist' } } });
    setSaving(false);
    if (!r.ok) { showToast(r.error, 'error'); return; }
    setSavedId(r.data.trip.id);
    setCurrent(c => ({ ...c, id: r.data.trip.id, status: 'wishlist' }));
    showToast('Saved to My Trips');
  };

  const handleShare = async () => {
    const textOut = itineraryAsText(displayTrip);
    try {
      if (navigator.share) { await navigator.share({ title: `${displayTrip.destination} Trip`, text: textOut }); return; }
      await navigator.clipboard.writeText(textOut);
      showToast('Itinerary copied to clipboard');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      showToast("Couldn't copy the itinerary", 'error');
    }
  };

  const handleBooked = (bookedTrip) => {
    if (bookedTrip?.id) setSavedId(bookedTrip.id);
    setCurrent(c => ({ ...c, id: bookedTrip?.id || c.id, status: 'upcoming' }));
  };

  const dates = displayTrip.startDate ? `${fmtDate(displayTrip.startDate)} – ${fmtDate(displayTrip.endDate)}` : 'Flexible';

  return (
    <div className="v-main-flush" style={{ flex: 1, overflowY: 'auto', background: C.cream }}>

      {/* Hero banner */}
      <div className="m-pad has-photo" style={{
        background: displayTrip.gradient,
        padding: '36px 52px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <PhotoLayer place={displayTrip.destination} photo={displayTrip.photo} width={1600} credit
          overlay="linear-gradient(to bottom, rgba(7,48,79,0.55), rgba(7,48,79,0.78))" />
        {/* Deco route */}
        <svg viewBox="0 0 600 120" width="600" height="120" style={{
          position: 'absolute', right: 0, top: 0, opacity: 0.18, pointerEvents: 'none',
        }}>
          <path d="M 30 90 C 120 20, 320 10, 480 60 S 560 100, 620 50"
            fill="none" stroke="#fff" strokeWidth="2"
            strokeDasharray="4 10" strokeLinecap="round" />
        </svg>

        {onBack && (
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.18)', border: 0, borderRadius: 10,
            padding: '6px 14px', cursor: 'pointer', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: C.fb, fontWeight: 600, fontSize: 13, color: '#fff',
          }}>
            <Icon name="arrow-left" size={14} color="#fff" />
            Back
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 36, marginBottom: 6 }}>{displayTrip.flag}</div>
            <h1 className="m-h1" style={{
              fontFamily: C.fd, fontWeight: 700, fontSize: 40,
              color: '#fff', margin: '0 0 4px', letterSpacing: '-0.025em',
            }}>{displayTrip.destination} Trip</h1>
            <p style={{ fontFamily: C.fb, fontSize: 15, color: 'rgba(255,255,255,0.72)', margin: 0 }}>
              {displayTrip.cities}
            </p>
          </div>
          <span style={{
            background: st.bg, color: st.color,
            fontFamily: C.fd, fontWeight: 700, fontSize: 12,
            padding: '6px 14px', borderRadius: 99, letterSpacing: '0.06em',
            textTransform: 'uppercase', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0,
          }}>{st.label}</span>
        </div>

        {/* Stats strip */}
        <div className="m-wrap" style={{
          display: 'flex', gap: 0, marginTop: 28,
          background: 'rgba(255,255,255,0.15)', borderRadius: 16,
          backdropFilter: 'blur(10px)', overflow: 'hidden',
        }}>
          {[
            { icon: 'moon',      label: 'Duration',  val: `${displayTrip.days} day${displayTrip.days === 1 ? '' : 's'}` },
            { icon: 'banknote',  label: 'Budget',    val: displayTrip.budget },
            { icon: 'calendar',  label: 'Dates',     val: dates },
            { icon: 'users',     label: 'Travelers', val: `${displayTrip.travelers} ${displayTrip.travelers === 1 ? 'person' : 'people'}` },
            { icon: 'compass',   label: 'Style',     val: displayTrip.travelStyle || '—' },
          ].map((s, i, arr) => (
            <div key={s.label} style={{
              flex: '1 1 140px', padding: '14px 18px',
              borderRight: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.20)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <Icon name={s.icon} size={13} color="rgba(255,255,255,0.70)" />
                <span style={{ fontFamily: C.fb, fontSize: 11, color: 'rgba(255,255,255,0.60)' }}>{s.label}</span>
              </div>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 14, color: '#fff' }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Itinerary body */}
      <div className="m-pad" style={{ padding: '32px 52px 60px' }}>

        {/* Action buttons */}
        <div className="m-wrap" style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
          <button
            onClick={handleSave}
            disabled={saved || saving}
            style={{
              padding: '10px 22px', borderRadius: 99, border: 0,
              cursor: (saved || saving) ? 'default' : 'pointer',
              background: saved ? 'rgba(47,165,106,0.12)' : saving ? 'rgba(239,159,39,0.55)' : C.amber,
              color: saved ? '#1e7a4d' : '#fff',
              fontFamily: C.fd, fontWeight: 700, fontSize: 14,
              boxShadow: (saved || saving) ? 'none' : '0 6px 20px rgba(239,159,39,0.30)',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'all 220ms',
            }}
          >
            <Icon name={saved ? 'check' : saving ? 'loader' : 'bookmark-plus'} size={15} color={saved ? '#1e7a4d' : '#fff'} />
            {saved ? 'Saved to My Trips' : saving ? 'Saving…' : 'Save to wishlist'}
          </button>
          {!isSaved && onBack && (
            <button onClick={onBack} style={{
              padding: '10px 20px', borderRadius: 99,
              border: `1.5px solid ${C.navy}`, background: 'transparent',
              color: C.navy, fontFamily: C.fd, fontWeight: 700, fontSize: 14,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
            }}>
              <Icon name="sparkles" size={15} color={C.navy} />
              Modify with AI
            </button>
          )}
          <button onClick={handleShare} style={{
            padding: '10px 20px', borderRadius: 99, border: 0,
            background: C.sky, color: C.navy,
            fontFamily: C.fd, fontWeight: 700, fontSize: 14,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <Icon name="share-2" size={15} color={C.navy} />
            Share
          </button>
        </div>

        {/* Section label */}
        <div style={{
          fontFamily: C.fd, fontWeight: 700, fontSize: 11,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: C.ocean, marginBottom: 16,
        }}>DAY-BY-DAY ITINERARY</div>

        {/* Day cards */}
        {(displayTrip.itinerary || []).map((day, i) => (
          <DayCard key={day.day ?? i} dayData={day} index={i} />
        ))}

        {/* Cost breakdown + proceed */}
        <CostBreakdownCard
          breakdown={displayTrip.costBreakdown}
          summary={displayTrip.budgetSummary}
          transport={displayTrip.transport}
          onProceed={() => setShowBooking(true)}
        />

        {/* Older saved trips have no cost breakdown — still allow booking */}
        {!displayTrip.costBreakdown && displayTrip.status !== 'upcoming' && (
          <div style={{ marginTop: 28 }}>
            <VBtn variant="amber" icon="zap" onClick={() => setShowBooking(true)}>Book it all</VBtn>
          </div>
        )}
      </div>

      {/* Booking modal */}
      {showBooking && (
        <BookingPage
          trip={displayTrip}
          savedId={savedId}
          onBooked={handleBooked}
          onClose={() => setShowBooking(false)}
        />
      )}
      {toast}
    </div>
  );
}

Object.assign(window, { ItineraryView, STATUS_CONFIG });
