// ProfileScreen.jsx — user profile, trips list, plan
function ProfileScreen() {
  const trips = [
    { city: 'Lisbon, Portugal', dates: 'May 14–20 · 2026', status: 'live',  spend: '€820 / €1,240' },
    { city: 'Kyoto, Japan',     dates: 'Mar 28 – Apr 6 · 2026', status: 'done',  spend: '¥328,500' },
    { city: 'Mexico City',      dates: 'Oct 12–16 · 2025', status: 'done',  spend: '$612' },
    { city: 'Iceland · ring road', dates: 'Booked for Aug 2026', status: 'next', spend: '— pending' },
  ];

  return (
    <div style={{ paddingBottom: 120 }}>
      <VoyaScreenHeader title="You" />
      {/* Header card */}
      <div style={{ padding: '0 20px 18px' }}>
        <VoyaCard padding={18} radius={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <VoyaAvatar name="Maya Okafor" size={56} />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 20,
                            color: voyaColors.navy, letterSpacing: '-0.01em' }}>
                Maya Okafor
              </div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 13, color: voyaColors.fg2 }}>
                4 trips · 7 countries · 2 in 2026
              </div>
            </div>
            <VoyaChip tone="navy">Pro</VoyaChip>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 18 }}>
            {[
              { v: '47', l: 'days traveled' },
              { v: '$8.2k', l: 'this year' },
              { v: '3', l: 'upcoming' },
            ].map(s => (
              <div key={s.l} style={{ background: voyaColors.cream, borderRadius: 14, padding: 12, textAlign: 'center' }}>
                <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 20, color: voyaColors.navy,
                              letterSpacing: '-0.02em' }}>{s.v}</div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 10, color: voyaColors.fg3, marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </VoyaCard>
      </div>

      {/* Trips list */}
      <div style={{ padding: '0 20px' }}>
        <VoyaSectionHeader eyebrow="YOUR TRAVEL JOURNAL" title="All trips" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trips.map(t => {
            const tone = t.status === 'live' ? 'amber' : t.status === 'next' ? 'ocean' : 'cream';
            const label = t.status === 'live' ? 'Live now' : t.status === 'next' ? 'Up next' : 'Completed';
            return (
              <VoyaCard key={t.city} padding={14} radius={18}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 16, color: voyaColors.navy }}>
                      {t.city}
                    </div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: voyaColors.fg2, marginTop: 2 }}>
                      {t.dates}
                    </div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: voyaColors.fg3, marginTop: 4 }}>
                      Spend · <b style={{ color: voyaColors.navy, fontFamily: 'Clash Grotesk', fontWeight: 700 }}>{t.spend}</b>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <VoyaChip tone={tone}>{label}</VoyaChip>
                    <Icon name="chevron-right" size={16} color={voyaColors.fg3} />
                  </div>
                </div>
              </VoyaCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
