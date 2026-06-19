// HomeScreen.jsx — the "Where to next?" Explore screen
function HomeScreen({ onSearch, onOpenTrip }) {
  const trending = [
    { city: 'Lisbon',   country: 'Portugal', tag: 'Trending',    price: '€1,240', img: 'linear-gradient(180deg,#6FAAEA 0%,#1E62AC 100%)' },
    { city: 'Kyoto',    country: 'Japan',    tag: 'Cherry season', price: '$2,180', img: 'linear-gradient(180deg,#F6CD83 0%,#D8881A 100%)' },
    { city: 'Mexico City', country: 'Mexico', tag: 'Cheap eats', price: '$890',  img: 'linear-gradient(180deg,#F2B650 0%,#B26C10 100%)' },
    { city: 'Reykjavík',country: 'Iceland',  tag: 'Last week of aurora', price: '$1,560', img: 'linear-gradient(180deg,#9FC7F1 0%,#0C447C 100%)' },
  ];

  const moods = [
    { id: 'beach', label: 'Beach', icon: 'sun' },
    { id: 'city',  label: 'City',  icon: 'building-2' },
    { id: 'food',  label: 'Food',  icon: 'utensils' },
    { id: 'hike',  label: 'Hike',  icon: 'mountain' },
    { id: 'solo',  label: 'Solo',  icon: 'user' },
  ];

  return (
    <div style={{ paddingBottom: 120 }}>
      {/* Greeting */}
      <div style={{ padding: '4px 24px 12px' }}>
        <h1 style={{ margin: 0, fontFamily: 'Plus Jakarta Sans', fontWeight: 700,
                     fontSize: 30, lineHeight: 1.08, letterSpacing: '-0.025em',
                     color: voyaColors.navy }}>
          Where to next, <span style={{ color: voyaColors.amber }}>Maya</span>?
        </h1>
      </div>

      {/* Big search — right below the greeting */}
      <div style={{ padding: '0 20px 16px' }}>
        <div onClick={onSearch} style={{
          background: '#fff', borderRadius: 24, padding: '14px 16px',
          boxShadow: '0 6px 18px rgba(12,68,124,0.10)',
          display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 999, background: voyaColors.ocean,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          }}>
            <Icon name="search" size={20} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 15, color: voyaColors.navy }}>
              Tell Voya where you're dreaming
            </div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: voyaColors.fg3, marginTop: 2 }}>
              "10 days in Japan in May, under $3k"
            </div>
          </div>
          <Icon name="sparkles" size={18} color={voyaColors.amber} />
        </div>
      </div>

      {/* Mood chips */}
      <div style={{ padding: '0 20px 24px', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {moods.map(m => (
          <VoyaChip key={m.id} tone="cream" icon={m.icon}>{m.label}</VoyaChip>
        ))}
      </div>

      {/* Current trip strip */}
      <div style={{ padding: '0 20px 24px' }}>
        <VoyaCard onClick={onOpenTrip} padding={0} radius={24} style={{
          background: voyaColors.navy, color: '#fff', overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ padding: 18, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                background: voyaColors.amber, padding: '3px 10px', borderRadius: 999,
                fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 10,
                letterSpacing: '0.16em', textTransform: 'uppercase', color: '#fff',
                whiteSpace: 'nowrap',
              }}>Live trip</span>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, opacity: 0.8 }}>Day 3 of 6</span>
            </div>
            <h3 style={{ margin: 0, fontFamily: 'Clash Grotesk', fontWeight: 700,
                         fontSize: 26, letterSpacing: '-0.02em' }}>
              Lisbon, Portugal
            </h3>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 13, marginTop: 4, opacity: 0.86 }}>
              Next: dinner at Cervejaria Ramiro · 19:30
            </div>
            <div style={{ marginTop: 14 }}>
              <VoyaButton variant="glass" size="sm" trailingIcon="arrow-right">Open itinerary</VoyaButton>
            </div>
          </div>
          <div style={{ position: 'absolute', right: -10, top: 8, opacity: 0.30 }}>
            <VoyaRoute height={150} width={220} plane={true} pin={true}
                       d="M 20 80 C 70 30, 130 30, 180 60 S 250 100, 290 80" />
          </div>
        </VoyaCard>
      </div>

      {/* Trending */}
      <div style={{ padding: '0 20px' }}>
        <VoyaSectionHeader eyebrow="TRENDING THIS WEEK"
                           title="Where you'll love"
                           action={{ label: 'See all' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {trending.map(d => (
            <VoyaCard key={d.city} padding={0} radius={20} style={{ overflow: 'hidden' }}>
              <div style={{
                height: 110, background: d.img, padding: 12,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                color: '#fff', position: 'relative',
              }}>
                <span style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)',
                  padding: '3px 9px', borderRadius: 999,
                  fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: 10,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>{d.tag}</span>
                <div>
                  <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 20,
                                letterSpacing: '-0.01em', lineHeight: 1.05 }}>{d.city}</div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, opacity: 0.88 }}>{d.country}</div>
                </div>
              </div>
              <div style={{ padding: '10px 12px 12px', display: 'flex',
                            alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 16, color: voyaColors.navy }}>
                    {d.price}
                  </div>
                  <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 10, color: voyaColors.fg3 }}>
                    all-in, 6 nights
                  </div>
                </div>
                <Icon name="arrow-right" size={16} color={voyaColors.ocean} />
              </div>
            </VoyaCard>
          ))}
        </div>
      </div>
    </div>
  );
}

window.HomeScreen = HomeScreen;
