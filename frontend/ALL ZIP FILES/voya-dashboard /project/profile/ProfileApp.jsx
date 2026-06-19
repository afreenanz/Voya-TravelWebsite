// profile/ProfileApp.jsx — Voya Profile Page
const { useState, useEffect } = React;

// ─── Sidebar ──────────────────────────────────────────────────
function ProfileSidebar({ name }) {
  const displayName = name || 'Traveler';
  const items = [
  { id: 'home',    icon: 'compass',      label: 'Home',       href: 'Voya Dashboard.html' },
  { id: 'plan',    icon: 'map-pin-plus', label: 'Plan a trip', href: 'plantrip.html' },
  { id: 'trips',   icon: 'map',          label: 'My Trips',   href: 'plantrip.html#trips', badge: 4 },
  { id: 'explore', icon: 'globe-2',      label: 'Explore',    href: 'Voya Dashboard.html' },
  { id: 'profile', icon: 'user-round',   label: 'Profile',    href: null }];

  useEffect(() => {if (window.lucide) window.lucide.createIcons();});
  return (
    <aside style={{
      width: 245, flexShrink: 0, background: '#fff', height: '100vh',
      borderRight: `1px solid ${C.borderSoft}`,
      display: 'flex', flexDirection: 'column', padding: '24px 16px',
      position: 'sticky', top: 0
    }}>
      <div style={{ padding: '2px 6px 28px' }}>
        <img src="assets/voya-logo-light.png" alt="voya"
        onClick={() => window.location.href = 'Voya Dashboard.html'}
        style={{ height: 28, objectFit: 'contain', objectPosition: 'left', cursor: 'pointer' }} />
      </div>
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item) => {
          const on = item.id === 'profile';
          return (
            <button key={item.id}
            onClick={() => item.href && (window.location.href = item.href)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 12px', borderRadius: 12, border: 0,
              textAlign: 'left', cursor: 'pointer',
              background: on ? 'rgba(55,138,221,0.12)' : 'transparent',
              color: on ? C.ocean : C.fg3,
              fontFamily: C.fb, fontWeight: on ? 600 : 500, fontSize: 14.5,
              transition: 'background 140ms, color 140ms'
            }}>
              <Icon name={item.icon} size={19} color={on ? C.ocean : C.fg3} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge &&
              <span style={{
                background: on ? C.ocean : C.amber, color: '#fff',
                fontFamily: C.fd, fontWeight: 700, fontSize: 11,
                padding: '1px 7px', borderRadius: 99
              }}>{item.badge}</span>
              }
            </button>);
        })}
      </nav>
      <div style={{ height: 1, background: C.borderSoft, margin: '12px 0 14px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, background: C.sky, borderRadius: 14 }}>
        <VAvatar name={displayName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: C.navy, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
          <div style={{ fontFamily: C.fb, fontSize: 11, color: C.ocean, fontWeight: 600 }}>Pro Plan ✦</div>
        </div>
        <button style={{ width: 28, height: 28, borderRadius: 8, border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="settings" size={15} color={C.fg3} />
        </button>
      </div>
    </aside>);
}

// ─── Hero Card ────────────────────────────────────────────────
function ProfileHero({ profile, email }) {
  const name     = profile?.full_name || localStorage.getItem('voya_user_name') || 'Traveler';
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const bio      = profile?.bio || '';

  return (
    <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', marginBottom: 20, boxShadow: '0 2px 10px rgba(12,68,124,0.07)' }}>
      {/* Banner */}
      <div style={{
        height: 90, position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, #07304F 0%, ${C.navy} 52%, #1A6BB5 100%)`
      }}>
        <svg viewBox="0 0 700 90" width="100%" height="90" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
          <path d="M -20 60 C 120 10, 320 5, 520 40 S 640 70, 740 30"
            fill="none" stroke="rgba(241,239,232,0.9)" strokeWidth="2"
            strokeDasharray="4 10" strokeLinecap="round" />
          <g transform="translate(502,36)">
            <path d="M9 0C4.1 0 0 4 0 9c0 6.6 9 16 9 16s9-9.4 9-16C18 4 14 0 9 0Z" fill={C.amber} />
            <circle cx="9" cy="9" r="3" fill="rgba(255,255,255,0.9)" />
          </g>
        </svg>
      </div>

      {/* Avatar + Info */}
      <div style={{ padding: '0 28px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginTop: -28, marginBottom: 16 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: C.amber, border: '4px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(239,159,39,0.30)', flexShrink: 0
          }}>
            <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 28, color: '#fff' }}>{initials}</span>
          </div>
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 24, color: C.navy, lineHeight: 1.1 }}>{name}</div>
            {email && <div style={{ fontFamily: C.fb, fontSize: 13, color: C.ocean, marginTop: 2 }}>{email}</div>}
          </div>
          <div style={{ marginLeft: 'auto', paddingBottom: 4 }}>
            <span style={{
              background: 'rgba(239,159,39,0.14)', color: '#87520A',
              fontFamily: C.fd, fontWeight: 700, fontSize: 11,
              padding: '5px 13px', borderRadius: 99, letterSpacing: '0.06em'
            }}>PRO PLAN ✦</span>
          </div>
        </div>

        {bio && (
          <p style={{ fontFamily: C.fb, fontSize: 14, color: C.fg2, lineHeight: 1.6, marginBottom: 16, maxWidth: 520 }}>{bio}</p>
        )}

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {profile?.home_airport && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="plane" size={14} color={C.ocean} />
              <span style={{ fontFamily: C.fb, fontSize: 13, color: C.fg3 }}>Based at {profile.home_airport}</span>
            </div>
          )}
        </div>
      </div>
    </div>);
}

// ─── Edit Profile Card ────────────────────────────────────────
function EditProfileCard({ profile, email, onSaved }) {
  const [form, setForm] = useState({
    full_name:    profile?.full_name    || '',
    phone:        profile?.phone        || '',
    home_airport: profile?.home_airport || '',
    bio:          profile?.bio          || '',
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) setForm({
      full_name:    profile.full_name    || '',
      phone:        profile.phone        || '',
      home_airport: profile.home_airport || '',
      bio:          profile.bio          || '',
    });
  }, [profile]);

  const set = (k) => (e) => { setForm(f => ({...f, [k]: e.target.value})); setSuccess(false); };

  const handleSave = async () => {
    if (!email) { alert('No email found. Please log in again.'); return; }
    setSaving(true); setSuccess(false);
    try {
      const res  = await fetch('http://127.0.0.1:5000/profile', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, ...form }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        if (form.full_name) localStorage.setItem('voya_user_name', form.full_name);
        if (onSaved) onSaved(form);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to save profile.');
      }
    } catch {
      alert('Could not connect to server.');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: '100%', fontFamily: C.fb, fontSize: 14,
    padding: '10px 14px', borderRadius: 12,
    border: `1.5px solid ${C.borderDefault}`,
    background: C.sky, color: C.ink, outline: 'none',
    transition: 'border-color 140ms',
  };
  const labelStyle = {
    display: 'block', fontFamily: C.fb, fontWeight: 600,
    fontSize: 12, color: C.fg3, marginBottom: 6,
  };

  const fields = [
    { key: 'full_name',    label: 'Full name',    placeholder: 'Your full name',        type: 'text' },
    { key: 'phone',        label: 'Phone',        placeholder: '+91 98765 43210',       type: 'tel'  },
    { key: 'home_airport', label: 'Home airport', placeholder: 'e.g. BOM, DEL, BLR',   type: 'text' },
  ];

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(55,138,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="user-round" size={16} color={C.ocean} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Edit profile</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.label}</label>
            <input
              type={f.type}
              value={form[f.key]}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = C.ocean}
              onBlur={e  => e.target.style.borderColor = C.borderDefault}
            />
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Bio</label>
          <textarea
            value={form.bio}
            onChange={set('bio')}
            placeholder="Tell fellow travelers about yourself…"
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
            onFocus={e => e.target.style.borderColor = C.ocean}
            onBlur={e  => e.target.style.borderColor = C.borderDefault}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '10px 24px', borderRadius: 99, border: 0,
            background: success ? 'rgba(47,165,106,0.12)' : C.ocean,
            color: success ? '#1e7a4d' : '#fff',
            fontFamily: C.fd, fontWeight: 700, fontSize: 14,
            cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', gap: 7,
            boxShadow: success ? 'none' : '0 6px 20px rgba(55,138,221,0.28)',
            transition: 'all 220ms',
          }}
        >
          <Icon name={success ? 'check' : saving ? 'loader' : 'save'} size={14} color={success ? '#1e7a4d' : '#fff'} />
          {success ? 'Saved!' : saving ? 'Saving…' : 'Save profile'}
        </button>
        {success && (
          <span style={{ fontFamily: C.fb, fontSize: 13, color: '#1e7a4d' }}>Profile updated successfully.</span>
        )}
      </div>
    </div>);
}

// ─── Stats Strip ──────────────────────────────────────────────
function StatsStrip() {
  const stats = [
  { val: '8', label: 'Countries', icon: 'globe-2', color: C.ocean },
  { val: '18', label: 'Trips taken', icon: 'map', color: '#2FA56A' },
  { val: '94', label: 'Days abroad', icon: 'calendar', color: C.amber },
  { val: '48.2K', label: 'Miles flown', icon: 'plane', color: '#E8859C' },
  { val: '3', label: 'Upcoming', icon: 'clock', color: C.navy }];

  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {stats.map((s) =>
      <div key={s.label} style={{
        flex: 1, background: '#fff', borderRadius: 18, padding: '16px 14px',
        boxShadow: '0 2px 8px rgba(12,68,124,0.06)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
      }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={s.icon} size={17} color={s.color} />
          </div>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 22, color: C.navy, lineHeight: 1 }}>{s.val}</div>
          <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3, textAlign: 'center' }}>{s.label}</div>
        </div>
      )}
    </div>);
}

// ─── Achievements ─────────────────────────────────────────────
function Achievements() {
  const badges = [
  { icon: 'plane-takeoff', label: 'First Trip',    earned: true,  note: 'Completed your first Voya trip' },
  { icon: 'globe-2',       label: 'Asia Explorer', earned: true,  note: '5+ countries in Asia' },
  { icon: 'user',          label: 'Solo Traveler', earned: true,  note: 'Traveled alone at least once' },
  { icon: 'utensils',      label: 'Food Hunter',   earned: true,  note: '10+ food experiences logged' },
  { icon: 'piggy-bank',    label: 'Budget Master', earned: true,  note: 'Stayed under budget 3x' },
  { icon: 'calendar',      label: '7-Day Streak',  earned: true,  note: 'Used Voya 7 days in a row' },
  { icon: 'heart',         label: 'Super Saver',   earned: false, note: 'Save 10 destinations' },
  { icon: 'map',           label: 'World Citizen', earned: false, note: 'Visit 20+ countries' }];

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,159,39,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="award" size={16} color={C.amber} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Achievements</span>
        <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginLeft: 4 }}>6 of 8 earned</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {badges.map((b) =>
        <div key={b.label} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          padding: '14px 10px', borderRadius: 16,
          background: b.earned ? C.sky : 'rgba(44,44,42,0.04)',
          opacity: b.earned ? 1 : 0.45, position: 'relative'
        }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${b.earned ? C.navy : C.borderDefault}`, background: b.earned ? C.navy : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={b.icon} size={20} color={b.earned ? '#fff' : C.fg3} />
            </div>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 11, color: b.earned ? C.navy : C.fg3, textAlign: 'center', lineHeight: 1.3 }}>{b.label}</div>
            {b.earned && <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%', background: '#2FA56A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="check" size={9} color="#fff" />
            </div>}
          </div>
        )}
      </div>
    </div>);
}

// ─── Countries Visited ────────────────────────────────────────
function CountriesVisited() {
  const countries = [
  { flag: '🇹🇭', name: 'Thailand',  date: 'Jun 2026', trips: 1 },
  { flag: '🇦🇪', name: 'UAE',       date: 'Dec 2025', trips: 1 },
  { flag: '🇮🇩', name: 'Indonesia', date: 'Mar 2025', trips: 1 },
  { flag: '🇸🇬', name: 'Singapore', date: 'Jan 2025', trips: 2 },
  { flag: '🇱🇰', name: 'Sri Lanka', date: 'Aug 2024', trips: 1 },
  { flag: '🇳🇵', name: 'Nepal',     date: 'Oct 2024', trips: 1 },
  { flag: '🇲🇻', name: 'Maldives',  date: 'Feb 2024', trips: 1 },
  { flag: '🇮🇳', name: 'India',     date: 'Ongoing',  trips: 8 }];

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(55,138,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="stamp" size={16} color={C.ocean} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Passport stamps</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {countries.map((c) =>
        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 12, background: C.sky }}>
            <span style={{ fontSize: 22 }}>{c.flag}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: C.navy }}>{c.name}</div>
              <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3 }}>{c.trips} {c.trips === 1 ? 'trip' : 'trips'}</div>
            </div>
            <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>{c.date}</span>
          </div>
        )}
      </div>
    </div>);
}

// ─── Recent Activity ──────────────────────────────────────────
function RecentActivity() {
  const activity = [
  { icon: 'check-circle',  color: '#2FA56A', text: 'Completed Thailand trip',       sub: '5 days · Bangkok & Phuket',        time: '2 days ago'  },
  { icon: 'bookmark',      color: C.ocean,   text: 'Saved Japan to wishlist',        sub: '10 days · Tokyo · Kyoto',          time: '1 week ago'  },
  { icon: 'map-pin-plus',  color: C.amber,   text: 'Planned Goa trip',               sub: '4 days · North & South Goa',       time: '2 weeks ago' },
  { icon: 'star',          color: '#E8859C', text: 'Reviewed Kata Beach Resort',     sub: 'Phuket, Thailand · ⭐⭐⭐⭐⭐',    time: '3 days ago'  },
  { icon: 'plane-takeoff', color: C.navy,    text: 'Booked Dubai return flight',     sub: 'BOM → DXB · Dec 20, 2025',         time: '3 weeks ago' }];

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(44,44,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="activity" size={16} color={C.fg2} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Recent activity</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {activity.map((a, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: i < activity.length - 1 ? `1px solid ${C.borderSoft}` : 'none', marginBottom: i < activity.length - 1 ? 14 : 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={a.icon} size={17} color={a.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: C.navy }}>{a.text}</div>
              <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginTop: 1 }}>{a.sub}</div>
            </div>
            <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3, whiteSpace: 'nowrap' }}>{a.time}</div>
          </div>
        )}
      </div>
    </div>);
}

// ─── Quick Settings ───────────────────────────────────────────
function QuickSettings() {
  const items = [
  { icon: 'bell',          label: 'Notifications',     sub: 'Flight alerts, itinerary updates' },
  { icon: 'credit-card',   label: 'Payment methods',   sub: 'Visa •••• 4521' },
  { icon: 'shield-check',  label: 'Privacy & security', sub: 'Password, 2FA, data' },
  { icon: 'globe-2',       label: 'Language & region', sub: 'English · INR · IST' },
  { icon: 'log-out',       label: 'Sign out',          sub: '', danger: true }];

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(44,44,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="settings" size={16} color={C.fg2} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Account settings</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, i) =>
        <button key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 120ms' }}
        onMouseEnter={(e) => e.currentTarget.style.background = C.sky}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: item.danger ? 'rgba(226,85,61,0.10)' : C.sky, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={item.icon} size={16} color={item.danger ? '#E2553D' : C.fg2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: item.danger ? '#E2553D' : C.navy }}>{item.label}</div>
              {item.sub && <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginTop: 1 }}>{item.sub}</div>}
            </div>
            {!item.danger && <Icon name="chevron-right" size={15} color={C.fg3} />}
          </button>
        )}
      </div>
    </div>);
}

// ─── App Root ─────────────────────────────────────────────────
function ProfileApp() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // email is the lookup key — stored in localStorage on login
  // future: also support OAuth access token via localStorage('voya_access_token')
  const email = localStorage.getItem('voya_user_email') || '';

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    fetch(`http://127.0.0.1:5000/profile?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(data => { if (data.success) setProfile(data.profile); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {if (window.lucide) window.lucide.createIcons();});

  const displayName = profile?.full_name
    || localStorage.getItem('voya_user_name')
    || email.split('@')[0]
    || 'Traveler';

  const handleProfileSaved = (updated) => {
    setProfile(prev => ({ ...prev, ...updated }));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <ProfileSidebar name={displayName} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '36px 44px 60px', background: C.cream }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: C.fb, fontSize: 14, color: C.fg3 }}>
            Loading profile…
          </div>
        ) : (
          <>
            <ProfileHero profile={profile} email={email} />
            <StatsStrip />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              <div>
                <EditProfileCard profile={profile} email={email} onSaved={handleProfileSaved} />
                <Achievements />
                <RecentActivity />
              </div>
              <div>
                <CountriesVisited />
                <div style={{ marginTop: 20 }}>
                  <QuickSettings />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProfileApp />);
