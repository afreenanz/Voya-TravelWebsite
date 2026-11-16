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

// ─── Shared app sidebar (same design on every app page) ──────
const NAV_ITEMS = [
  { id: 'home',    icon: 'compass',      label: 'Home',        href: '/app' },
  { id: 'plan',    icon: 'map-pin-plus', label: 'Plan a trip', href: '/app/plan' },
  { id: 'trips',   icon: 'map',          label: 'My Trips',    href: '/app/trips' },
  { id: 'explore', icon: 'globe-2',      label: 'Explore',     href: '/app/explore' },
  { id: 'profile', icon: 'user-round',   label: 'Profile',     href: '/app/profile' },
];

// onNav(id) may handle a click in-page (return true) instead of navigating.
function VSidebar({ active, onNav, name }) {
  const userName = name || Voya.userName() || 'Traveler';
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
  return (
    <aside className="v-sidebar" style={{
      width: 245, flexShrink: 0, background: '#fff', height: '100vh',
      borderRight: `1px solid ${C.borderSoft}`,
      display: 'flex', flexDirection: 'column', padding: '24px 16px',
      position: 'sticky', top: 0,
    }}>
      <div className="v-logo" style={{ padding: '2px 6px 28px' }}>
        <a href="/app" style={{ display: 'block' }}>
          <img src="/shared/assets/voya-logo-light.png" alt="voya"
            style={{ height: 28, objectFit: 'contain', objectPosition: 'left', cursor: 'pointer' }} />
        </a>
      </div>

      <nav className="v-nav" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const on = active === item.id;
          return (
            <button key={item.id} title={item.label} onClick={() => {
              if (onNav && onNav(item.id)) return;
              window.location.href = item.href;
            }} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12, border: 0,
              textAlign: 'left', cursor: 'pointer',
              background: on ? 'rgba(55,138,221,0.12)' : 'transparent',
              color: on ? C.ocean : C.fg3,
              fontFamily: C.fb, fontWeight: on ? 600 : 500, fontSize: 14.5,
              transition: 'background 140ms, color 140ms',
            }}>
              <Icon name={item.icon} size={19} color={on ? C.ocean : C.fg3} />
              <span className="v-nav-label" style={{ flex: 1 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="v-divider" style={{ height: 1, background: C.borderSoft, margin: '12px 0 14px' }} />

      <div className="v-user" style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 12, background: C.sky, borderRadius: 14,
      }}>
        <VAvatar name={userName} size={36} />
        <div className="v-user-text" style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: C.navy,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{userName}</div>
          <div style={{ fontFamily: C.fb, fontSize: 11, color: C.ocean, fontWeight: 600 }}>Free plan</div>
        </div>
        <button onClick={() => Voya.logout()} title="Log out" aria-label="Log out" style={{
          width: 28, height: 28, borderRadius: 8, border: 0,
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="log-out" size={15} color={C.fg3} />
        </button>
      </div>
    </aside>
  );
}

// Small inline error/notice line used under forms and in cards.
function VNotice({ children, tone = 'error', style: extra = {} }) {
  if (!children) return null;
  const color = tone === 'error' ? C.danger : tone === 'success' ? '#1e7a4d' : C.fg3;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} style={{
      fontFamily: C.fb, fontSize: 13, color, lineHeight: 1.45, ...extra,
    }}>{children}</div>
  );
}

// Bottom-centre toast. Usage: const [toast, showToast] = useToast(); … {toast}
function useToast() {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = (text, tone = 'success') => {
    clearTimeout(timer.current);
    setMsg({ text, tone });
    timer.current = setTimeout(() => setMsg(null), 3200);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = msg ? (
    <div role="status" style={{
      position: 'fixed', left: '50%', bottom: 28, transform: 'translateX(-50%)', zIndex: 2000,
      background: msg.tone === 'error' ? C.danger : C.navy, color: '#fff',
      padding: '12px 20px', borderRadius: 99, boxShadow: '0 12px 32px rgba(7,24,50,0.28)',
      fontFamily: C.fd, fontWeight: 700, fontSize: 14, maxWidth: 'calc(100vw - 32px)', textAlign: 'center',
    }}>{msg.text}</div>
  ) : null;
  return [node, show];
}

const fmtDate = (v, opts) => Voya.formatDate(v, opts);

Object.assign(window, { C, Icon, VBtn, VCard, VChip, VAvatar, VSectionHead, VSidebar, VNotice, useToast, fmtDate });
