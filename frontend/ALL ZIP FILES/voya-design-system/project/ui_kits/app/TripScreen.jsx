// TripScreen.jsx — Day-by-day itinerary view
function TripScreen({ onBack }) {
  const [day, setDay] = React.useState(3);
  const days = [1,2,3,4,5,6];

  const dayPlans = {
    3: {
      title: 'Day 3 · Alfama, Fado, Ramiro',
      weather: { temp: 22, icon: 'sun', summary: 'Sunny · light breeze' },
      stops: [
        { time: '09:30', icon: 'coffee', name: 'Dear Breakfast', kind: 'Breakfast',
          meta: 'Príncipe Real · 6-min walk', tag: { tone: 'amber', label: 'Local pick' } },
        { time: '11:00', icon: 'landmark', name: 'Castelo de São Jorge', kind: 'Sightseeing',
          meta: 'Skip-the-line booked · 2h', tag: { tone: 'success', label: 'Booked' } },
        { time: '14:00', icon: 'utensils', name: 'Time Out Market', kind: 'Lunch',
          meta: '€20 budget set · 8 stalls picked' },
        { time: '16:30', icon: 'tram-front', name: 'Tram 28 + Alfama walk', kind: 'Activity',
          meta: '90-min Voya audio guide queued', tag: { tone: 'ocean', label: 'Voya guide' } },
        { time: '19:30', icon: 'utensils', name: 'Cervejaria Ramiro', kind: 'Dinner',
          meta: 'Reservation confirmed · table for 2', tag: { tone: 'success', label: 'Booked' } },
        { time: '22:00', icon: 'music', name: 'Mesa de Frades · Fado', kind: 'Nightlife',
          meta: '€35 cover · alt: Tasca do Chico (free)' },
      ],
    },
  };

  const plan = dayPlans[day] || dayPlans[3];

  return (
    <div style={{ paddingBottom: 120 }}>
      <VoyaScreenHeader title="Lisbon trip" back onBack={onBack}
        trailing={
          <button style={{ width: 40, height: 40, borderRadius: 999, background: '#fff', border: 0,
                           boxShadow: '0 2px 6px rgba(12,68,124,0.10)', cursor: 'pointer', color: voyaColors.navy,
                           display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="share-2" size={18} />
          </button>
        }/>

      {/* Hero */}
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{
          background: 'linear-gradient(180deg, #6FAAEA 0%, #0C447C 100%)',
          borderRadius: 24, padding: 18, color: '#fff', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
            <VoyaRoute height={'100%'} width={'100%'} plane pin animated
                       d="M 10 100 C 80 30, 180 30, 240 70 S 320 110, 310 60"/>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                background: voyaColors.amber, padding: '4px 10px', borderRadius: 999,
                fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 10,
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>Day {day} of 6</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'Plus Jakarta Sans', fontSize: 13 }}>
                <Icon name={plan.weather.icon} size={16}/> {plan.weather.temp}°C
              </span>
            </div>
            <h2 style={{ margin: '14px 0 4px', fontFamily: 'Clash Grotesk', fontWeight: 700,
                         fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{plan.title}</h2>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 13, opacity: 0.86 }}>{plan.weather.summary}</div>
          </div>
        </div>
      </div>

      {/* Day picker */}
      <div style={{ padding: '0 20px 18px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {days.map(d => (
          <button key={d} onClick={() => setDay(d)} style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 0,
            background: d === day ? voyaColors.navy : '#fff',
            color: d === day ? '#fff' : voyaColors.navy,
            fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            boxShadow: d === day ? '0 6px 18px rgba(12,68,124,0.18)' : '0 1px 2px rgba(12,68,124,0.06)',
          }}>Day {d}</button>
        ))}
      </div>

      {/* Stops timeline */}
      <div style={{ padding: '0 20px', position: 'relative' }}>
        {/* connecting dashed line behind */}
        <div style={{
          position: 'absolute', left: 38, top: 18, bottom: 8, width: 2,
          backgroundImage: `repeating-linear-gradient(to bottom, ${voyaColors.ocean} 0 4px, transparent 4px 9px)`,
        }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plan.stops.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              {/* time + icon */}
              <div style={{ width: 38, flexShrink: 0, display: 'flex',
                            flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 11, color: voyaColors.fg2 }}>
                  {s.time}
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 999, background: '#fff',
                  border: `2px solid ${voyaColors.ocean}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: voyaColors.navy, position: 'relative', zIndex: 1,
                }}>
                  <Icon name={s.icon} size={16}/>
                </div>
              </div>
              <VoyaCard style={{ flex: 1 }} padding={14} radius={18}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: voyaColors.fg3,
                                  textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                      {s.kind}
                    </div>
                    <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 16,
                                  color: voyaColors.navy, marginTop: 2, letterSpacing: '-0.01em' }}>
                      {s.name}
                    </div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: voyaColors.fg2, marginTop: 4 }}>
                      {s.meta}
                    </div>
                  </div>
                  {s.tag ? <VoyaChip tone={s.tag.tone}>{s.tag.label}</VoyaChip> : null}
                </div>
              </VoyaCard>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.TripScreen = TripScreen;
