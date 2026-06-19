// VoyaWebUI.jsx — primitives for the marketing site
const wColors = {
  ocean: '#378ADD', navy: '#0C447C', amber: '#EF9F27',
  cream: '#F1EFE8', ink: '#2C2C2A', white: '#FFFFFF',
  fg2: '#4A4842', fg3: '#6E6B60',
};

function WIcon({ name, size = 22, color = 'currentColor' }) {
  return <i data-lucide={name}
            style={{ width: size, height: size, color, display: 'inline-flex',
                     alignItems: 'center', justifyContent: 'center' }} />;
}

function WButton({ variant = 'primary', size = 'md', icon, trailingIcon, children, href = '#', style }) {
  const v = {
    primary: { bg: wColors.ocean, color: '#fff', shadow: '0 8px 24px rgba(55,138,221,0.32)' },
    amber:   { bg: wColors.amber, color: '#fff', shadow: '0 10px 28px rgba(239,159,39,0.40)' },
    navy:    { bg: wColors.navy,  color: wColors.cream, shadow: '0 6px 18px rgba(12,68,124,0.24)' },
    outline: { bg: 'transparent', color: wColors.navy, shadow: 'inset 0 0 0 1.5px ' + wColors.navy },
    ghost:   { bg: 'transparent', color: wColors.navy, shadow: 'none' },
  }[variant];
  const s = {
    sm: { padding: '10px 18px', fontSize: 14 },
    md: { padding: '14px 24px', fontSize: 15 },
    lg: { padding: '18px 32px', fontSize: 17 },
  }[size];
  return (
    <a href={href} style={{
      fontFamily: 'Nunito, system-ui', fontWeight: 700, letterSpacing: '-0.005em',
      textDecoration: 'none', borderRadius: 999, display: 'inline-flex',
      alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
      background: v.bg, color: v.color, boxShadow: v.shadow,
      padding: s.padding, fontSize: s.fontSize,
      transition: 'transform 140ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 140ms',
      ...style,
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = ''}>
      {icon ? <WIcon name={icon} size={s.fontSize + 3}/> : null}
      {children}
      {trailingIcon ? <WIcon name={trailingIcon} size={s.fontSize + 3}/> : null}
    </a>
  );
}

function Section({ children, background = 'cream', style = {}, id }) {
  const bg = { cream: wColors.cream, white: '#fff', navy: wColors.navy }[background] || background;
  const fg = background === 'navy' ? wColors.cream : wColors.ink;
  return (
    <section id={id} style={{ background: bg, color: fg, padding: '96px 32px', ...style }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function Eyebrow({ children, color = wColors.ocean }) {
  return (
    <div style={{ fontFamily: 'Nunito, system-ui', fontWeight: 700, fontSize: 12,
                  letterSpacing: '0.20em', textTransform: 'uppercase', color }}>
      {children}
    </div>
  );
}

function Logo({ dark = false, size = 28 }) {
  // Use the actual brand asset PNG to avoid drift from the real wordmark.
  // For dark surfaces we present it on a small cream "chip".
  const img = <img src="../../assets/voya-logo-light.png" alt="voya."
                   style={{ height: size * 1.45, width: 'auto', display: 'block' }} />;
  if (dark) {
    return (
      <div style={{
        background: '#F1EFE8', borderRadius: 12,
        padding: '4px 10px', display: 'inline-flex', alignItems: 'center',
      }}>{img}</div>
    );
  }
  return <div style={{ display: 'inline-flex', alignItems: 'center' }}>{img}</div>;
}

Object.assign(window, { wColors, WIcon, WButton, Section, Eyebrow, Logo });
