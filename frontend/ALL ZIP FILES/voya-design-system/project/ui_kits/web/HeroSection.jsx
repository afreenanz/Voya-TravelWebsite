// HeroSection.jsx — landing hero
function NavBar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(241,239,232,0.85)', backdropFilter: 'blur(12px)',
      padding: '14px 32px',
      borderBottom: '1px solid rgba(44,44,42,0.06)',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <Logo size={20}/>
        <div style={{ display: 'flex', gap: 32, fontFamily: 'Plus Jakarta Sans', fontWeight: 500, fontSize: 14 }}>
          <a href="#features" style={{ color: wColors.navy, textDecoration: 'none' }}>How it works</a>
          <a href="#destinations" style={{ color: wColors.navy, textDecoration: 'none' }}>Destinations</a>
          <a href="#pricing" style={{ color: wColors.navy, textDecoration: 'none' }}>Pricing</a>
          <a href="#" style={{ color: wColors.navy, textDecoration: 'none' }}>For business</a>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="#" style={{ color: wColors.navy, fontFamily: 'Plus Jakarta Sans', fontWeight: 500,
                               fontSize: 14, textDecoration: 'none' }}>Log in</a>
          <WButton variant="primary" size="sm" trailingIcon="arrow-right">Start free</WButton>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <Section background="cream" style={{ padding: '64px 32px 80px', position: 'relative', overflow: 'hidden' }}>
      {/* Big dashed route across hero */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
           viewBox="0 0 1200 700" preserveAspectRatio="none">
        <path d="M -20 380 C 240 200, 480 480, 720 280 S 1080 240, 1240 360"
              fill="none" stroke={wColors.ocean} strokeWidth="2.5"
              strokeDasharray="2 7" strokeLinecap="round" opacity="0.55"/>
      </svg>
      <div style={{ position: 'relative', display: 'grid',
                    gridTemplateColumns: '1.05fr 0.95fr', gap: 56, alignItems: 'center' }}>
        <div>
          <Eyebrow>AI TRAVEL · NOW IN BETA</Eyebrow>
          <h1 style={{
            fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 80, lineHeight: 0.98,
            letterSpacing: '-0.03em', color: wColors.navy,
            margin: '14px 0 20px', textWrap: 'balance',
          }}>
            Travel more.<br/>
            <span style={{ color: wColors.amber }}>Plan less.</span>
          </h1>
          <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 19, lineHeight: 1.5,
                      color: wColors.fg2, margin: 0, maxWidth: 520 }}>
            A well-traveled friend who already knows where you're going — and has booked the table.
            Voya plans, books, guides, and adapts your whole trip. You just show up.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
            <WButton variant="amber" size="lg" trailingIcon="arrow-right">Plan my trip free</WButton>
            <WButton variant="outline" size="lg" icon="play-circle">Watch 90s demo</WButton>
          </div>
          <div style={{ display: 'flex', gap: 24, marginTop: 28, fontFamily: 'Plus Jakarta Sans',
                        fontSize: 13, color: wColors.fg3 }}>
            <span>Free tier — no card</span>
            <span style={{ color: 'rgba(44,44,42,0.25)' }}>·</span>
            <span>2,400+ trips planned this week</span>
          </div>
        </div>

        {/* Right side: stylized "AI plan" card */}
        <div style={{ position: 'relative' }}>
          <div style={{
            background: '#fff', borderRadius: 28, padding: 22,
            boxShadow: '0 30px 60px rgba(12,68,124,0.18)',
            transform: 'rotate(-1.5deg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 999, background: wColors.amber,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><WIcon name="sparkles" size={18}/></div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 13, color: wColors.fg2 }}>
                You · <span style={{ color: wColors.navy, fontWeight: 600 }}>10 days in Japan, under $3k, food + temples</span>
              </div>
            </div>
            <div style={{ background: wColors.cream, borderRadius: 20, padding: 16, marginBottom: 12 }}>
              <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 18, color: wColors.navy }}>
                Here's your plan
              </div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 13, color: wColors.fg2, marginTop: 2 }}>
                Tokyo · Hakone · Kyoto · Osaka — May 14–24
              </div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { d: 'Day 1', t: 'Land Narita 14:20', icon: 'plane' },
                  { d: 'Day 2', t: 'Tsukiji breakfast tour', icon: 'utensils' },
                  { d: 'Day 4', t: 'Hakone onsen + ryokan', icon: 'waves' },
                  { d: 'Day 7', t: 'Fushimi Inari at sunrise', icon: 'sun' },
                ].map(r => (
                  <div key={r.d} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: wColors.ocean,
                                  boxShadow: '0 2px 6px rgba(12,68,124,0.10)' }}>
                      <WIcon name={r.icon} size={14}/>
                    </div>
                    <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 12,
                                  color: wColors.fg3, width: 38 }}>{r.d}</div>
                    <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 13, color: wColors.navy, fontWeight: 500 }}>
                      {r.t}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: wColors.fg3 }}>
                Built in <b style={{ color: wColors.navy, fontFamily: 'Clash Grotesk' }}>14 seconds</b> · $2,830 est.
              </div>
              <WButton variant="primary" size="sm" trailingIcon="arrow-right">Book it all</WButton>
            </div>
          </div>
          {/* Floating pin sticker */}
          <div style={{
            position: 'absolute', top: -16, right: -12,
            background: '#fff', padding: '6px 12px 6px 8px',
            borderRadius: 999, boxShadow: '0 10px 24px rgba(239,159,39,0.30)',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 12, color: wColors.amber,
            transform: 'rotate(6deg)',
          }}>
            <WIcon name="map-pin" size={14}/>
            Kyoto · day 7
          </div>
        </div>
      </div>
    </Section>
  );
}

Object.assign(window, { NavBar, HeroSection });
