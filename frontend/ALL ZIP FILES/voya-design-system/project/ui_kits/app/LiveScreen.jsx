// LiveScreen.jsx — In-trip companion: where you are, what's next, dynamic replan
function LiveScreen({ onBack }) {
  return (
    <div style={{ paddingBottom: 120 }}>
      <VoyaScreenHeader title="Live · Lisbon" back onBack={onBack}
        trailing={
          <button style={{ width: 40, height: 40, borderRadius: 999, background: '#fff', border: 0,
                           boxShadow: '0 2px 6px rgba(12,68,124,0.10)', cursor: 'pointer', color: voyaColors.navy,
                           display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="bell" size={18} />
          </button>
        }/>

      {/* Map-ish hero — stylized */}
      <div style={{ padding: '0 20px 18px' }}>
        <div style={{
          height: 220, borderRadius: 24,
          background: 'radial-gradient(120% 80% at 20% 20%, #CFE3F8 0%, #9FC7F1 60%, #6FAAEA 100%)',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 6px 18px rgba(12,68,124,0.14)',
        }}>
          {/* "streets" */}
          <svg width="100%" height="100%" viewBox="0 0 360 220" preserveAspectRatio="none"
               style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
            <path d="M 0 80 L 360 60" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M 0 140 L 360 160" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M 80 0 L 100 220" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M 200 0 L 220 220" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
            <path d="M 290 0 L 310 220" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round"/>
            {/* the dashed brand route */}
            <path d="M 50 180 C 110 100, 180 130, 230 90 S 320 60, 330 40"
                  stroke="#0C447C" strokeWidth="2.5" strokeDasharray="2 6" fill="none" strokeLinecap="round"/>
          </svg>
          {/* You-are-here */}
          <div style={{ position: 'absolute', left: '13%', top: '78%' }}>
            <div style={{
              width: 22, height: 22, borderRadius: 999,
              background: voyaColors.ocean, border: '3px solid #fff',
              boxShadow: '0 0 0 8px rgba(55,138,221,0.22)',
            }}/>
          </div>
          {/* Pin */}
          <div style={{ position: 'absolute', right: '7%', top: '12%' }}>
            <svg width="30" height="40" viewBox="0 0 24 32">
              <path d="M12 0c-6.6 0-12 5.2-12 11.6 0 9 12 20.4 12 20.4s12-11.4 12-20.4C24 5.2 18.6 0 12 0z" fill="#EF9F27"/>
              <circle cx="12" cy="11" r="4" fill="#fff"/>
            </svg>
          </div>
          {/* Glass status pill */}
          <div style={{
            position: 'absolute', left: 14, top: 14,
            background: 'rgba(12,68,124,0.78)', backdropFilter: 'blur(10px)',
            borderRadius: 999, padding: '6px 12px', color: '#fff',
            fontFamily: 'Plus Jakarta Sans', fontSize: 12, fontWeight: 600,
            display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: '#37D88B' }}/>
            Walking · 6 min to Ramiro
          </div>
        </div>
      </div>

      {/* Live alert — Voya rebooked something */}
      <div style={{ padding: '0 20px 14px' }}>
        <VoyaCard padding={14} radius={20}
          style={{ background: 'rgba(239,159,39,0.10)',
                   boxShadow: 'inset 0 0 0 1.5px rgba(239,159,39,0.40)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 999,
              background: voyaColors.amber, color: '#fff', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="sparkles" size={18}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 15, color: voyaColors.navy }}>
                Rain coming at 17:00 — I swapped your walk for Museu do Azulejo.
              </div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: voyaColors.fg2, marginTop: 4 }}>
                Tickets booked · 15-min Uber, $7. Keep the change or revert?
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <VoyaButton variant="navy" size="sm">Keep it</VoyaButton>
                <VoyaButton variant="ghost" size="sm">Revert</VoyaButton>
              </div>
            </div>
          </div>
        </VoyaCard>
      </div>

      {/* Now / next */}
      <div style={{ padding: '0 20px' }}>
        <VoyaSectionHeader eyebrow="HAPPENING NOW" title="Up next" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <VoyaCard padding={14} radius={20}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: voyaColors.ocean, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="utensils" size={22}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: voyaColors.fg3, fontWeight: 600,
                              letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  19:30 · DINNER
                </div>
                <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 17, color: voyaColors.navy }}>
                  Cervejaria Ramiro
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: voyaColors.fg2, marginTop: 2 }}>
                  Av. Almirante Reis 1 · 6-min walk
                </div>
              </div>
              <button style={{
                width: 44, height: 44, borderRadius: 999, border: 0, cursor: 'pointer',
                background: voyaColors.ocean, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(55,138,221,0.32)',
              }}>
                <Icon name="navigation-2" size={18} color="#fff"/>
              </button>
            </div>
          </VoyaCard>

          {/* Budget tracker */}
          <VoyaCard padding={14} radius={20}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: voyaColors.fg3, fontWeight: 600,
                              letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  BUDGET · DAY 3
                </div>
                <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 24,
                              color: voyaColors.navy, letterSpacing: '-0.02em' }}>
                  €82 <span style={{ fontSize: 14, color: voyaColors.fg3, fontWeight: 600 }}>/ €140</span>
                </div>
              </div>
              <VoyaChip tone="success">€58 left</VoyaChip>
            </div>
            <div style={{ marginTop: 10, height: 8, borderRadius: 999, background: voyaColors.cream }}>
              <div style={{ width: '58%', height: '100%', borderRadius: 999,
                            background: `linear-gradient(90deg, ${voyaColors.ocean}, ${voyaColors.amber})` }}/>
            </div>
            <div style={{ display: 'flex', gap: 14, marginTop: 10,
                          fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: voyaColors.fg3 }}>
              <span><b style={{ color: voyaColors.navy, fontFamily: 'Clash Grotesk', fontWeight: 700 }}>€34</b> food</span>
              <span><b style={{ color: voyaColors.navy, fontFamily: 'Clash Grotesk', fontWeight: 700 }}>€26</b> activities</span>
              <span><b style={{ color: voyaColors.navy, fontFamily: 'Clash Grotesk', fontWeight: 700 }}>€22</b> transit</span>
            </div>
          </VoyaCard>
        </div>
      </div>
    </div>
  );
}

window.LiveScreen = LiveScreen;
