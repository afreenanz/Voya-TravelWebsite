// VoyaUI.jsx — shared primitives for the Voya mobile UI kit
// Atoms used across every screen: Button, Card, Chip, Pill, Avatar, RoutePath, Icon

const voyaColors = {
  ocean: '#378ADD',
  navy:  '#0C447C',
  amber: '#EF9F27',
  cream: '#F1EFE8',
  ink:   '#2C2C2A',
  white: '#FFFFFF',
  fg2:   '#4A4842',
  fg3:   '#6E6B60',
  borderSoft: 'rgba(44,44,42,0.08)',
};

// ── Lucide icon, refreshed after mount
function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons({ nameAttr: 'data-lucide' });
  }, []);
  return (
    <i ref={ref} data-lucide={name}
       style={{ width: size, height: size, color, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', ...style }} />
  );
}

// ── Button: friendly, pill-shaped, Nunito-display label
function VoyaButton({
  variant = 'primary', size = 'md', icon, trailingIcon, children,
  fullWidth = false, onClick, style = {},
}) {
  const variants = {
    primary: { bg: voyaColors.ocean, color: '#fff', shadow: '0 8px 22px rgba(55,138,221,0.34)' },
    amber:   { bg: voyaColors.amber, color: '#fff', shadow: '0 10px 26px rgba(239,159,39,0.40)' },
    navy:    { bg: voyaColors.navy,  color: voyaColors.cream, shadow: '0 6px 18px rgba(12,68,124,0.30)' },
    outline: { bg: 'transparent', color: voyaColors.navy, shadow: 'inset 0 0 0 1.5px ' + voyaColors.navy },
    ghost:   { bg: 'transparent', color: voyaColors.navy, shadow: 'none' },
    glass:   { bg: 'rgba(255,255,255,0.90)', color: voyaColors.navy, shadow: '0 6px 18px rgba(12,68,124,0.14)' },
  };
  const sizes = {
    sm: { padding: '8px 16px', fontSize: 13 },
    md: { padding: '12px 22px', fontSize: 15 },
    lg: { padding: '16px 28px', fontSize: 17 },
  };
  const v = variants[variant]; const s = sizes[size];
  return (
    <button onClick={onClick} style={{
      fontFamily: 'Clash Grotesk, Plus Jakarta Sans, system-ui', fontWeight: 700, letterSpacing: '-0.005em',
      border: 'none', borderRadius: 999, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      whiteSpace: 'nowrap',
      background: v.bg, color: v.color, boxShadow: v.shadow,
      padding: s.padding, fontSize: s.fontSize,
      width: fullWidth ? '100%' : 'auto',
      transition: 'transform 140ms cubic-bezier(0.2,0.8,0.2,1)',
      ...style,
    }}
    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
    onMouseUp={e => e.currentTarget.style.transform = ''}
    onMouseLeave={e => e.currentTarget.style.transform = ''}>
      {icon ? <Icon name={icon} size={s.fontSize + 3} /> : null}
      {children}
      {trailingIcon ? <Icon name={trailingIcon} size={s.fontSize + 3} /> : null}
    </button>
  );
}

// ── Card: white surface, rounded-lg, soft blue shadow
function VoyaCard({ children, padding = 16, radius = 20, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: radius, padding,
      boxShadow: '0 2px 6px rgba(12,68,124,0.08)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 220ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 220ms',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Chip: filter / tag
function VoyaChip({ children, tone = 'ocean', icon, active = false, onClick }) {
  const tones = {
    ocean:   { bg: 'rgba(55,138,221,0.14)', color: '#144E8E' },
    amber:   { bg: 'rgba(239,159,39,0.18)', color: '#87520A' },
    cream:   { bg: 'rgba(44,44,42,0.06)',   color: voyaColors.navy },
    success: { bg: 'rgba(47,165,106,0.16)', color: '#1e7a4d' },
    danger:  { bg: 'rgba(226,85,61,0.16)',  color: '#b53a25' },
    navy:    { bg: voyaColors.navy, color: '#fff' },
    outline: { bg: 'transparent', color: voyaColors.navy, boxShadow: 'inset 0 0 0 1.5px rgba(12,68,124,0.30)' },
  };
  const t = tones[tone];
  const activeStyle = active ? { background: voyaColors.navy, color: '#fff', boxShadow: 'none' } : {};
  return (
    <button onClick={onClick} style={{
      border: 0, padding: '6px 12px', borderRadius: 999,
      fontFamily: 'Plus Jakarta Sans, system-ui', fontWeight: 500, fontSize: 13,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      cursor: onClick ? 'pointer' : 'default',
      background: t.bg, color: t.color, boxShadow: t.boxShadow,
      ...activeStyle,
    }}>
      {icon ? <Icon name={icon} size={14} /> : null}
      {children}
    </button>
  );
}

// ── Avatar
function VoyaAvatar({ name = 'Maya', size = 36, src }) {
  const initials = name.split(' ').map(s => s[0]).slice(0,2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: voyaColors.amber, color: '#fff',
      fontFamily: 'Clash Grotesk, Plus Jakarta Sans, system-ui', fontWeight: 700, fontSize: size * 0.4,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundImage: src ? `url(${src})` : '', backgroundSize: 'cover',
      flexShrink: 0,
    }}>
      {!src && initials}
    </div>
  );
}

// ── Section header (eyebrow + heading + optional action)
function VoyaSectionHeader({ eyebrow, title, action, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                  marginBottom: 12, ...style }}>
      <div>
        {eyebrow ? (
          <div style={{ fontFamily: 'Clash Grotesk, Plus Jakarta Sans, system-ui', fontWeight: 700, fontSize: 11,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: voyaColors.ocean, marginBottom: 4, whiteSpace: 'nowrap' }}>
            {eyebrow}
          </div>
        ) : null}
        <h2 style={{ margin: 0, fontFamily: 'Clash Grotesk, Plus Jakarta Sans, system-ui', fontWeight: 700,
                     fontSize: 22, color: voyaColors.navy, letterSpacing: '-0.01em' }}>
          {title}
        </h2>
      </div>
      {action ? (
        <button onClick={action.onClick} style={{
          background: 'transparent', border: 0, padding: 0, whiteSpace: 'nowrap',
          fontFamily: 'Plus Jakarta Sans, system-ui', fontWeight: 600, fontSize: 13,
          color: voyaColors.ocean, cursor: 'pointer',
        }}>{action.label} →</button>
      ) : null}
    </div>
  );
}

// ── Route path SVG (the dashed brand motif)
function VoyaRoute({ d, height = 100, width = '100%', plane = true, pin = true, animated = false }) {
  return (
    <svg viewBox="0 0 320 100" width={width} height={height} preserveAspectRatio="none"
         style={{ overflow: 'visible' }}>
      <path d={d || "M 12 60 C 80 10, 180 10, 240 50 S 305 80, 308 50"}
            fill="none" stroke={voyaColors.ocean} strokeWidth={2.5}
            strokeDasharray="2 6" strokeLinecap="round"
            style={animated ? {
              strokeDasharray: '800',
              strokeDashoffset: '800',
              animation: 'voyaDraw 1.2s cubic-bezier(0.2,0.8,0.2,1) forwards',
            } : null}/>
      {plane ? (
        <g transform="translate(2, 50) rotate(-22)">
          <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5z"
                fill="none" stroke={voyaColors.ocean} strokeWidth="2" strokeLinejoin="round"/>
        </g>
      ) : null}
      {pin ? (
        <g transform="translate(298, 42)">
          <path d="M12 0c-6.6 0-12 5.2-12 11.6 0 9 12 20.4 12 20.4s12-11.4 12-20.4C24 5.2 18.6 0 12 0z" fill={voyaColors.amber}/>
          <circle cx="12" cy="11" r="4" fill={voyaColors.cream}/>
        </g>
      ) : null}
    </svg>
  );
}

// ── Bottom tab bar
function VoyaTabBar({ active, onTab }) {
  const tabs = [
    { id: 'home',    icon: 'compass', label: 'Explore' },
    { id: 'trips',   icon: 'map',     label: 'Trips' },
    { id: 'live',    icon: 'navigation-2', label: 'Live' },
    { id: 'profile', icon: 'user',    label: 'You' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 16, right: 16, bottom: 28,
      height: 68, background: '#fff', borderRadius: 999,
      boxShadow: '0 14px 36px rgba(12,68,124,0.18)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      paddingInline: 8,
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            border: 0, background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '8px 10px',
            color: on ? voyaColors.ocean : voyaColors.fg3,
          }}>
            <div style={{
              width: 44, height: 32, borderRadius: 999,
              background: on ? 'rgba(55,138,221,0.16)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={t.icon} size={20} color={on ? voyaColors.ocean : voyaColors.fg3} />
            </div>
            <span style={{ fontFamily: 'Plus Jakarta Sans, system-ui', fontSize: 10.5, fontWeight: 600 }}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Top "screen" header — back chevron, title, trailing
function VoyaScreenHeader({ title, back, onBack, trailing }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 20px 16px', gap: 12,
    }}>
      {back ? (
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: 999, background: '#fff', border: 0,
          boxShadow: '0 2px 6px rgba(12,68,124,0.10)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: voyaColors.navy,
        }}>
          <Icon name="chevron-left" size={20} />
        </button>
      ) : <span style={{ width: 40 }}/>}
      <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontFamily: 'Clash Grotesk, Plus Jakarta Sans, system-ui',
                   fontWeight: 700, fontSize: 17, color: voyaColors.navy }}>{title}</h2>
      <div style={{ width: 40, display: 'flex', justifyContent: 'flex-end' }}>{trailing}</div>
    </div>
  );
}

// global keyframe
(() => {
  if (document.getElementById('voya-anim-keyframes')) return;
  const s = document.createElement('style');
  s.id = 'voya-anim-keyframes';
  s.textContent = `
    @keyframes voyaDraw { to { stroke-dashoffset: 0; } }
    @keyframes voyaFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
    .voya-fade-up { animation: voyaFadeUp 0.42s cubic-bezier(0.2,0.8,0.2,1) forwards; }
  `;
  document.head.appendChild(s);
})();

Object.assign(window, {
  voyaColors, Icon, VoyaButton, VoyaCard, VoyaChip, VoyaAvatar,
  VoyaSectionHeader, VoyaRoute, VoyaTabBar, VoyaScreenHeader,
});
