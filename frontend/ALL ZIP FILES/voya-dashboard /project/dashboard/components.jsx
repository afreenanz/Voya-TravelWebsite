// dashboard/components.jsx — Voya shared primitives
const { useState, useEffect, useRef } = React;

const C = {
  ocean: '#378ADD',  navy: '#0C447C',  amber: '#EF9F27',
  cream: '#F1EFE8',  sky: '#E6F2FB',   ink: '#2C2C2A',
  white: '#FFFFFF',  fg2: '#4A4842',   fg3: '#6E6B60',
  success: '#2FA56A', danger: '#E2553D',
  borderSoft: 'rgba(44,44,42,0.08)',
  borderDefault: 'rgba(44,44,42,0.14)',
  fd: "'Clash Grotesk','Plus Jakarta Sans',system-ui",
  fb: "'Plus Jakarta Sans',system-ui",
};

function Icon({ name, size = 20, color = 'currentColor', style: s = {} }) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [name]);
  return (
    <i ref={ref} data-lucide={name}
      style={{
        width: size, height: size, color,
        display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, ...s
      }} />
  );
}

function VBtn({ variant = 'primary', size = 'md', icon, trailing, children, onClick, fullWidth, style: extra = {} }) {
  const [pressed, setPressed] = useState(false);
  const vars = {
    primary: { bg: C.ocean, color: '#fff',   sh: '0 6px 20px rgba(55,138,221,0.28)' },
    amber:   { bg: C.amber, color: '#fff',   sh: '0 8px 24px rgba(239,159,39,0.30)' },
    navy:    { bg: C.navy,  color: C.cream,  sh: '0 6px 18px rgba(12,68,124,0.28)' },
    outline: { bg: 'transparent', color: C.navy, sh: 'none', bd: `1.5px solid ${C.navy}` },
    ghost:   { bg: 'transparent', color: C.navy, sh: 'none' },
    sky:     { bg: C.sky, color: C.navy, sh: 'none' },
    white:   { bg: '#fff', color: C.navy, sh: '0 4px 14px rgba(12,68,124,0.12)' },
  };
  const szs = {
    sm: { pad: '8px 16px', fs: 13 },
    md: { pad: '11px 22px', fs: 15 },
    lg: { pad: '14px 28px', fs: 17 },
  };
  const v = vars[variant] || vars.primary;
  const sz = szs[size] || szs.md;
  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        fontFamily: C.fd, fontWeight: 700, letterSpacing: '-0.01em',
        border: v.bd || 'none', borderRadius: 999, cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: 7, whiteSpace: 'nowrap',
        background: v.bg, color: v.color, boxShadow: v.sh,
        padding: sz.pad, fontSize: sz.fs,
        width: fullWidth ? '100%' : 'auto',
        transform: pressed ? 'scale(0.97)' : 'none',
        transition: 'transform 140ms cubic-bezier(0.2,0.8,0.2,1)',
        ...extra,
      }}>
      {icon && <Icon name={icon} size={sz.fs + 1} color={v.color} />}
      {children}
      {trailing && <Icon name={trailing} size={sz.fs + 1} color={v.color} />}
    </button>
  );
}

function VCard({ children, padding = 20, radius = 20, style: extra = {}, onClick }) {
  const [hv, setHv] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onClick && setHv(true)}
      onMouseLeave={() => setHv(false)}
      style={{
        background: '#fff', borderRadius: radius, padding,
        boxShadow: hv ? '0 8px 24px rgba(12,68,124,0.12)' : '0 2px 8px rgba(12,68,124,0.07)',
        cursor: onClick ? 'pointer' : 'default',
        transform: hv && onClick ? 'translateY(-2px)' : 'none',
        transition: 'transform 220ms cubic-bezier(0.2,0.8,0.2,1), box-shadow 220ms',
        ...extra,
      }}>
      {children}
    </div>
  );
}

function VChip({ children, tone = 'ocean', icon, size = 'sm', onClick, active }) {
  const tones = {
    ocean: { bg: 'rgba(55,138,221,0.12)', color: '#144E8E' },
    amber: { bg: 'rgba(239,159,39,0.14)', color: '#87520A' },
    cream: { bg: 'rgba(44,44,42,0.08)', color: C.navy },
    sky:   { bg: C.sky, color: C.navy },
    navy:  { bg: C.navy, color: '#fff' },
  };
  const t = tones[tone] || tones.ocean;
  return (
    <button onClick={onClick} style={{
      border: 0, padding: size === 'sm' ? '5px 12px' : '7px 16px', borderRadius: 999,
      fontFamily: C.fb, fontWeight: 500, fontSize: size === 'sm' ? 12 : 14,
      display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
      cursor: onClick ? 'pointer' : 'default',
      background: active ? C.navy : t.bg, color: active ? '#fff' : t.color,
      transition: 'background 140ms, color 140ms',
    }}>
      {icon && <Icon name={icon} size={13} color={active ? '#fff' : t.color} />}
      {children}
    </button>
  );
}

function VAvatar({ name = 'A', size = 36 }) {
  const ini = name.trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: C.amber, color: '#fff', fontFamily: C.fd, fontWeight: 700,
      fontSize: size * 0.38, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, userSelect: 'none',
    }}>{ini}</div>
  );
}

function VSectionHead({ eyebrow, title, action, style: extra = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'space-between', marginBottom: 16, ...extra
    }}>
      <div>
        {eyebrow && (
          <div style={{
            fontFamily: C.fd, fontWeight: 700, fontSize: 11,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: C.ocean, marginBottom: 4,
          }}>{eyebrow}</div>
        )}
        <h2 style={{
          margin: 0, fontFamily: C.fd, fontWeight: 700,
          fontSize: 22, color: C.navy, letterSpacing: '-0.01em',
        }}>{title}</h2>
      </div>
      {action && (
        <button onClick={action.fn} style={{
          background: 'none', border: 0, padding: 0, cursor: 'pointer',
          fontFamily: C.fb, fontWeight: 600, fontSize: 13, color: C.ocean,
        }}>{action.label} →</button>
      )}
    </div>
  );
}

Object.assign(window, { C, Icon, VBtn, VCard, VChip, VAvatar, VSectionHead });
