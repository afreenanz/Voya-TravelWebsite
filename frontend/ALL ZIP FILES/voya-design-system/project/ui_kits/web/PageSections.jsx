// PageSections.jsx — features, how it works, destinations, pricing, footer

function FeaturesSection() {
  const features = [
    { icon: 'sparkles', title: 'AI Trip Architect',
      body: 'Full itinerary from one prompt. Budget, pace, group, vibe — handled. Day-by-day plans with real costs and alternatives.' },
    { icon: 'ticket', title: 'Booking automation',
      body: 'Flights, hotels, trains, cabs, activities — searched, compared, booked through real travel APIs. No 40 open tabs.' },
    { icon: 'navigation-2', title: 'Live travel companion',
      body: 'Real-time guidance during the trip — directions, scam alerts, local tips, translation, dynamic replans when things shift.' },
    { icon: 'refresh-cw', title: 'Adaptive intelligence',
      body: "Plans shift around weather, delays, budget drift, or changed minds. Voya doesn't just plan — it watches and adjusts." },
    { icon: 'wallet', title: 'Budget optimizer',
      body: 'Spend tracking, cheaper alternatives surfaced automatically, overspend flagged before it happens. Every dollar accounted for.' },
    { icon: 'shield-check', title: 'Concierge backstop',
      body: 'Human-in-the-loop validation for complex multi-country or high-value trips. Real humans, when it matters.' },
  ];
  return (
    <Section id="features" background="white">
      <div style={{ textAlign: 'center', maxWidth: 740, margin: '0 auto 56px' }}>
        <Eyebrow>WHAT YOU GET</Eyebrow>
        <h2 style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 52, lineHeight: 1.05,
                     letterSpacing: '-0.025em', color: wColors.navy, margin: '14px 0 14px' }}>
          One platform.<br/>Zero agencies. Zero tabs.
        </h2>
        <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 18, color: wColors.fg2, margin: 0, lineHeight: 1.5 }}>
          Not a booking aggregator. Not a chatbot with a map. A full autonomous travel layer from search to home.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {features.map(f => (
          <div key={f.title} style={{
            background: wColors.cream, borderRadius: 24, padding: 24,
            transition: 'transform 220ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 220ms',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)';
                               e.currentTarget.style.boxShadow = '0 14px 36px rgba(12,68,124,0.14)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = '';
                               e.currentTarget.style.boxShadow = ''; }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: wColors.ocean, marginBottom: 16,
              boxShadow: '0 2px 6px rgba(12,68,124,0.08)',
            }}>
              <WIcon name={f.icon} size={22}/>
            </div>
            <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 19,
                          color: wColors.navy, marginBottom: 6, letterSpacing: '-0.01em' }}>
              {f.title}
            </div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14.5, lineHeight: 1.55, color: wColors.fg2 }}>
              {f.body}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function HowItWorksSection() {
  const steps = [
    { n: '01', title: 'Tell Voya what you want',
      body: "“10 days in Japan, food + temples, under $3k” — that's all it takes." },
    { n: '02', title: 'Get a full plan in seconds',
      body: 'Day-by-day itinerary with real flights, hotels, meals, and routes.' },
    { n: '03', title: 'Book everything in one tap',
      body: 'Voya pulls fares from Amadeus, Booking.com, and Viator and books in your name.' },
    { n: '04', title: 'Travel — Voya rides along',
      body: 'Live nav, translations, scam alerts. Re-plans on the fly when things shift.' },
  ];
  return (
    <Section id="how" background="cream">
      <div style={{ display: 'grid', gridTemplateColumns: '0.9fr 1.1fr', gap: 64, alignItems: 'flex-start' }}>
        <div style={{ position: 'sticky', top: 100 }}>
          <Eyebrow>HOW IT WORKS</Eyebrow>
          <h2 style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 48, lineHeight: 1.05,
                       letterSpacing: '-0.025em', color: wColors.navy, margin: '14px 0 18px' }}>
            From “I want to go” to “I'm back home with the best trip of my life.”
          </h2>
          <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 17, color: wColors.fg2, lineHeight: 1.55, margin: '0 0 28px' }}>
            Four steps. Most travelers go from idea to booked plan in under an hour.
          </p>
          <WButton variant="primary" size="md" trailingIcon="arrow-right">Try it free</WButton>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{
              background: '#fff', borderRadius: 24, padding: 24,
              boxShadow: '0 6px 18px rgba(12,68,124,0.10)',
              display: 'grid', gridTemplateColumns: '64px 1fr', gap: 20,
            }}>
              <div style={{
                fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 36,
                color: i === 0 ? wColors.amber : wColors.ocean,
                letterSpacing: '-0.04em', lineHeight: 1,
              }}>{s.n}</div>
              <div>
                <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 20,
                              color: wColors.navy, letterSpacing: '-0.01em' }}>
                  {s.title}
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 15, color: wColors.fg2,
                              lineHeight: 1.55, marginTop: 6 }}>
                  {s.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function DestinationsSection() {
  const dests = [
    { city: 'Lisbon',     country: 'Portugal',    img: 'linear-gradient(180deg,#6FAAEA 0%,#1E62AC 100%)', price: 'from €820' },
    { city: 'Kyoto',      country: 'Japan',       img: 'linear-gradient(180deg,#F6CD83 0%,#D8881A 100%)', price: 'from $1,940' },
    { city: 'Mexico City',country: 'Mexico',      img: 'linear-gradient(180deg,#F2B650 0%,#B26C10 100%)', price: 'from $690' },
    { city: 'Reykjavík',  country: 'Iceland',     img: 'linear-gradient(180deg,#9FC7F1 0%,#0C447C 100%)', price: 'from $1,260' },
  ];
  return (
    <Section id="destinations" background="white">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                    marginBottom: 32, flexWrap: 'wrap', gap: 24 }}>
        <div>
          <Eyebrow>TRENDING THIS WEEK</Eyebrow>
          <h2 style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 44, lineHeight: 1.05,
                       letterSpacing: '-0.025em', color: wColors.navy, margin: '12px 0 0' }}>
            Where Voya travelers are going
          </h2>
        </div>
        <WButton variant="outline" size="md" trailingIcon="arrow-right">All destinations</WButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {dests.map(d => (
          <div key={d.city} style={{
            borderRadius: 24, overflow: 'hidden', background: '#fff',
            boxShadow: '0 6px 18px rgba(12,68,124,0.10)',
            transition: 'transform 220ms cubic-bezier(0.2,0.8,0.2,1)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}>
            <div style={{ height: 200, background: d.img, padding: 16,
                          display: 'flex', flexDirection: 'column',
                          justifyContent: 'flex-end', color: '#fff' }}>
              <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 26,
                            letterSpacing: '-0.02em', lineHeight: 1.05 }}>{d.city}</div>
              <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 13, opacity: 0.92 }}>{d.country}</div>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex',
                          alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 15, color: wColors.navy }}>
                  {d.price}
                </div>
                <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 11, color: wColors.fg3 }}>
                  6-day plan · all-in
                </div>
              </div>
              <WIcon name="arrow-right" size={18} color={wColors.ocean}/>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function PricingSection() {
  const tiers = [
    { name: 'Wanderer', price: '$0', sub: 'forever',
      desc: 'For the once-a-year trip.',
      feats: ['Unlimited itinerary generation', 'Compare flights + hotels', '1 active trip', 'Community trip templates'],
      cta: 'Start free', variant: 'outline' },
    { name: 'Pro', price: '$14', sub: '/ month',
      desc: 'For the people who actually leave.', highlight: true,
      feats: ['Everything in Wanderer', 'Live travel companion', 'Auto-booking + rebooking', 'Budget watcher + alerts',
              'Unlimited trips · all open at once', 'Priority replan when things shift'],
      cta: 'Go Pro', variant: 'amber' },
    { name: 'Concierge', price: '$89', sub: '/ trip',
      desc: 'For the trip that has to be perfect.',
      feats: ['Everything in Pro', 'Human travel agent reviews every plan', 'White-glove booking', '24/7 in-trip support',
              'Visa + paperwork handled'],
      cta: 'Book a call', variant: 'navy' },
  ];

  return (
    <Section id="pricing" background="cream">
      <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 48px' }}>
        <Eyebrow>PRICING</Eyebrow>
        <h2 style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 48, lineHeight: 1.05,
                     letterSpacing: '-0.025em', color: wColors.navy, margin: '14px 0 14px' }}>
          One plan. Or one trip at a time.
        </h2>
        <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 17, color: wColors.fg2, margin: 0, lineHeight: 1.5 }}>
          Plan unlimited trips on the free tier. Pay only when you want Voya to ride along on the journey.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {tiers.map(t => (
          <div key={t.name} style={{
            background: t.highlight ? wColors.navy : '#fff',
            color: t.highlight ? wColors.cream : wColors.ink,
            borderRadius: 28, padding: 28,
            boxShadow: t.highlight ? '0 24px 48px rgba(12,68,124,0.28)' : '0 6px 18px rgba(12,68,124,0.10)',
            position: 'relative',
            transform: t.highlight ? 'translateY(-12px) scale(1.03)' : '',
          }}>
            {t.highlight ? (
              <div style={{
                position: 'absolute', top: -12, left: 28,
                background: wColors.amber, color: '#fff',
                padding: '4px 14px', borderRadius: 999,
                fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 11,
                letterSpacing: '0.16em', textTransform: 'uppercase',
              }}>Most loved</div>
            ) : null}
            <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 18,
                          color: t.highlight ? wColors.amber : wColors.ocean,
                          letterSpacing: '-0.01em' }}>{t.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6 }}>
              <span style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 52,
                             letterSpacing: '-0.03em',
                             color: t.highlight ? '#fff' : wColors.navy }}>{t.price}</span>
              <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14,
                             color: t.highlight ? 'rgba(241,239,232,0.7)' : wColors.fg3 }}>{t.sub}</span>
            </div>
            <div style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14, lineHeight: 1.5,
                          color: t.highlight ? 'rgba(241,239,232,0.86)' : wColors.fg2,
                          marginTop: 6, marginBottom: 22 }}>{t.desc}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 26px',
                         display: 'flex', flexDirection: 'column', gap: 9 }}>
              {t.feats.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                                     fontFamily: 'Plus Jakarta Sans', fontSize: 14, lineHeight: 1.4,
                                     color: t.highlight ? wColors.cream : wColors.ink }}>
                  <WIcon name="check" size={16} color={wColors.amber}/>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <WButton variant={t.variant} size="md" trailingIcon="arrow-right"
                     style={{ width: '100%', justifyContent: 'center' }}>{t.cta}</WButton>
          </div>
        ))}
      </div>
    </Section>
  );
}

function FinalCTASection() {
  return (
    <Section background="navy" style={{ padding: '88px 32px', position: 'relative', overflow: 'hidden' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}
           viewBox="0 0 1200 360" preserveAspectRatio="none">
        <path d="M -20 200 C 240 30, 480 320, 720 120 S 1080 60, 1240 200"
              fill="none" stroke="#6FAAEA" strokeWidth="2.5"
              strokeDasharray="2 7" strokeLinecap="round"/>
      </svg>
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <h2 style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 64, lineHeight: 1,
                     letterSpacing: '-0.03em', color: wColors.cream, margin: '0 0 18px' }}>
          The trip is waiting.<br/>
          <span style={{ color: wColors.amber }}>Let's go.</span>
        </h2>
        <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 18,
                    color: 'rgba(241,239,232,0.78)', maxWidth: 540, margin: '0 auto 32px' }}>
          Plan your first trip in 14 seconds. Free, no card.
        </p>
        <div style={{ display: 'inline-flex', gap: 12 }}>
          <WButton variant="amber" size="lg" trailingIcon="arrow-right">Plan my trip free</WButton>
          <WButton variant="ghost" size="lg" style={{ color: wColors.cream }}>See sample trips</WButton>
        </div>
      </div>
    </Section>
  );
}

function FooterSection() {
  const cols = [
    { h: 'Product', items: ['How it works', 'Destinations', 'Pricing', 'Mobile app', "What's new"] },
    { h: 'For travelers', items: ['Solo travel', 'Family trips', 'Digital nomads', 'Business travel', 'Group trips'] },
    { h: 'Company', items: ['About', 'Careers', 'Press', 'Blog', 'Contact'] },
    { h: 'Resources', items: ['Help center', 'Travel guides', 'Visa info', 'API docs', 'Status'] },
  ];
  return (
    <footer style={{ background: wColors.navy, color: wColors.cream, padding: '64px 32px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)',
                      gap: 32, marginBottom: 48 }}>
          <div>
            <Logo dark size={22}/>
            <p style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 14, lineHeight: 1.55,
                        color: 'rgba(241,239,232,0.7)', marginTop: 18, maxWidth: 280 }}>
              The AI travel operating system. Plans, books, guides, adapts — so you spend zero time on logistics.
            </p>
          </div>
          {cols.map(c => (
            <div key={c.h}>
              <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 13, color: wColors.amber,
                            letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: 14 }}>
                {c.h}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0,
                           display: 'flex', flexDirection: 'column', gap: 10 }}>
                {c.items.map(i => (
                  <li key={i}><a href="#" style={{
                    fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: 'rgba(241,239,232,0.78)',
                    textDecoration: 'none',
                  }}>{i}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      flexWrap: 'wrap', gap: 16,
                      paddingTop: 24, borderTop: '1px solid rgba(241,239,232,0.12)',
                      fontFamily: 'Plus Jakarta Sans', fontSize: 12, color: 'rgba(241,239,232,0.55)' }}>
          <span>© 2026 voya.ai — travel more, plan less.</span>
          <div style={{ display: 'flex', gap: 18 }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Cookies</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  FeaturesSection, HowItWorksSection, DestinationsSection,
  PricingSection, FinalCTASection, FooterSection,
});
