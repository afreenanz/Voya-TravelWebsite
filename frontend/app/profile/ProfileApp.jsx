// profile/ProfileApp.jsx — Voya Profile Page
const { useState, useEffect, useRef } = React;

// ─── Hero Card ────────────────────────────────────────────────
function ProfileHero({ profile, onAvatarUpload, onError }) {
  const name       = profile?.full_name || Voya.userName() || 'Traveler';
  const email      = profile?.email || '';
  const initials   = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
  const bio        = profile?.bio || '';
  const avatarUrl  = profile?.avatar_url || '';
  const fileRef    = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [hoverAvatar, setHoverAvatar] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { onError('Avatar must be 2 MB or smaller.'); return; }
    setUploading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    const r = await Voya.api('/api/upload-avatar', { method: 'POST', form: formData });
    setUploading(false);
    if (r.ok) onAvatarUpload(r.data.avatar_url);
    else onError(r.error);
  };

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
        <div className="m-wrap" style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginTop: -28, marginBottom: 16 }}>
          {/* Clickable avatar */}
          <div
            onClick={() => !uploading && fileRef.current && fileRef.current.click()}
            onMouseEnter={() => setHoverAvatar(true)}
            onMouseLeave={() => setHoverAvatar(false)}
            style={{
              width: 80, height: 80, borderRadius: '50%',
              background: avatarUrl ? 'transparent' : C.amber,
              border: '4px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(239,159,39,0.30)', flexShrink: 0,
              cursor: 'pointer', position: 'relative', overflow: 'hidden',
            }}
          >
            {avatarUrl
              ? <img src={avatarUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 28, color: '#fff' }}>{initials}</span>
            }
            {(hoverAvatar || uploading) && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={uploading ? 'loader' : 'camera'} size={20} color="#fff" />
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileChange} style={{ display: 'none' }} />
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 24, color: C.navy, lineHeight: 1.1 }}>{name}</div>
            {email && <div style={{ fontFamily: C.fb, fontSize: 13, color: C.ocean, marginTop: 2 }}>{email}</div>}
          </div>
          <div style={{ marginLeft: 'auto', paddingBottom: 4 }}>
            <span style={{
              background: 'rgba(239,159,39,0.14)', color: '#87520A',
              fontFamily: C.fd, fontWeight: 700, fontSize: 11,
              padding: '5px 13px', borderRadius: 99, letterSpacing: '0.06em'
            }}>FREE PLAN</span>
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
function EditProfileCard({ profile, onSaved }) {
  const [form, setForm] = useState({
    full_name:    profile?.full_name    || '',
    phone:        profile?.phone        || '',
    home_airport: profile?.home_airport || '',
    bio:          profile?.bio          || '',
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (profile) setForm({
      full_name:    profile.full_name    || '',
      phone:        profile.phone        || '',
      home_airport: profile.home_airport || '',
      bio:          profile.bio          || '',
    });
  }, [profile]);

  const set = (k) => (e) => { setForm(f => ({...f, [k]: e.target.value})); setSuccess(false); setError(''); };

  const handleSave = async () => {
    if (!form.full_name.trim()) { setError("Full name can't be empty."); return; }
    setSaving(true); setSuccess(false); setError('');
    const r = await Voya.api('/api/profile', { method: 'POST', body: form });
    setSaving(false);
    if (!r.ok) { setError(r.error); return; }
    setSuccess(true);
    Voya.setUserName(r.data.profile.full_name);
    if (onSaved) onSaved(r.data.profile);
    setTimeout(() => setSuccess(false), 3000);
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
    <div id="edit-profile" style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(55,138,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="user-round" size={16} color={C.ocean} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Edit profile</span>
      </div>

      <div className="m-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
        <VNotice>{error}</VNotice>
      </div>
    </div>);
}

// ─── Derived travel stats (all from the user's saved trips) ──
function computeStats(trips) {
  const list = trips || [];
  const completed = list.filter(t => t.status === 'completed');
  const destinations = new Set(list.map(t => t.destination.trim().toLowerCase()));
  return {
    total: list.length,
    completed: completed.length,
    upcoming: list.filter(t => t.status === 'upcoming').length,
    wishlist: list.filter(t => t.status === 'wishlist').length,
    destinations: destinations.size,
    daysTravelled: completed.reduce((n, t) => n + (Number(t.days) || 0), 0),
    longest: list.reduce((n, t) => Math.max(n, Number(t.days) || 0), 0),
    biggestGroup: list.reduce((n, t) => Math.max(n, Number(t.travelers) || 0), 0),
  };
}

// ─── Stats Strip ──────────────────────────────────────────────
function StatsStrip({ stats }) {
  const items = [
  { val: stats.destinations,  label: 'Destinations',   icon: 'globe-2',  color: C.ocean },
  { val: stats.completed,     label: 'Trips taken',    icon: 'map',      color: '#2FA56A' },
  { val: stats.daysTravelled, label: 'Days travelled', icon: 'calendar', color: C.amber },
  { val: stats.wishlist,      label: 'On wishlist',    icon: 'heart',    color: '#E8859C' },
  { val: stats.upcoming,      label: 'Upcoming',       icon: 'clock',    color: C.navy }];

  return (
    <div className="m-wrap" style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {items.map((s) =>
      <div key={s.label} style={{
        flex: '1 1 100px', background: '#fff', borderRadius: 18, padding: '16px 14px',
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
function Achievements({ stats }) {
  const badges = [
  { icon: 'map-pin-plus',  label: 'First Plan',    earned: stats.total >= 1,        note: 'Save your first itinerary' },
  { icon: 'plane-takeoff', label: 'First Trip',    earned: stats.completed >= 1,    note: 'Mark a trip as completed' },
  { icon: 'calendar',      label: 'Booked In',     earned: stats.upcoming >= 1,     note: 'Have an upcoming trip' },
  { icon: 'globe-2',       label: 'Explorer',      earned: stats.destinations >= 3, note: 'Plan 3 different destinations' },
  { icon: 'heart',         label: 'Dreamer',       earned: stats.wishlist >= 5,     note: 'Save 5 trips to your wishlist' },
  { icon: 'moon',          label: 'Long Haul',     earned: stats.longest >= 10,     note: 'Plan a trip of 10+ days' },
  { icon: 'users',         label: 'Group Trip',    earned: stats.biggestGroup >= 4, note: 'Plan for 4+ travelers' },
  { icon: 'map',           label: 'World Citizen', earned: stats.destinations >= 10, note: 'Plan 10 different destinations' }];
  const earned = badges.filter(b => b.earned).length;

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,159,39,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="award" size={16} color={C.amber} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Achievements</span>
        <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginLeft: 4 }}>{earned} of {badges.length} earned</span>
      </div>
      <div className="m-2col" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {badges.map((b) =>
        <div key={b.label} title={b.note} style={{
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

// ─── Passport stamps: one per completed destination ───────────
function CountriesVisited({ trips }) {
  const byDest = {};
  (trips || []).filter(t => t.status === 'completed').forEach(t => {
    const key = t.destination.trim().toLowerCase();
    const prev = byDest[key];
    const date = t.endDate || t.startDate;
    if (!prev) byDest[key] = { flag: t.flag, name: t.destination, trips: 1, date };
    else { prev.trips += 1; if ((Voya.parseDate(date) || 0) > (Voya.parseDate(prev.date) || 0)) prev.date = date; }
  });
  const countries = Object.values(byDest);

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(55,138,221,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="stamp" size={16} color={C.ocean} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Passport stamps</span>
      </div>
      {countries.length === 0 ? (
        <div style={{ fontFamily: C.fb, fontSize: 13, color: C.fg3, lineHeight: 1.5 }}>
          Mark a trip as Completed in My Trips to collect your first stamp.
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {countries.map((c) =>
        <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 12, background: C.sky }}>
            <span style={{ fontSize: 22 }}>{c.flag}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: C.navy }}>{c.name}</div>
              <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3 }}>{c.trips} {c.trips === 1 ? 'trip' : 'trips'}</div>
            </div>
            <span style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>{fmtDate(c.date, { month: 'short', year: 'numeric' })}</span>
          </div>
        )}
      </div>
      )}
    </div>);
}

// ─── Recent Activity: latest saved trips ──────────────────────
function timeAgo(iso) {
  const d = Voya.parseDate(iso);
  if (!d) return '';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, n] of units) if (s >= n) { const v = Math.floor(s / n); return `${v} ${u}${v === 1 ? '' : 's'} ago`; }
  return '';
}

function RecentActivity({ trips }) {
  const verbs = {
    wishlist:  { icon: 'bookmark',     color: C.ocean,   text: d => `Saved ${d} to wishlist` },
    planning:  { icon: 'map-pin-plus', color: C.amber,   text: d => `Planning ${d}` },
    upcoming:  { icon: 'plane-takeoff', color: C.navy,   text: d => `${d} trip is upcoming` },
    completed: { icon: 'check-circle', color: '#2FA56A', text: d => `Completed ${d} trip` },
  };
  const activity = (trips || []).slice(0, 5).map(t => {
    const v = verbs[t.status] || verbs.planning;
    return {
      ...v, text: v.text(t.destination),
      sub: `${t.days} day${Number(t.days) === 1 ? '' : 's'}${t.cities ? ' · ' + t.cities : ''}`,
      time: timeAgo(t.createdAt),
    };
  });

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(44,44,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="activity" size={16} color={C.fg2} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Recent activity</span>
      </div>
      {activity.length === 0 ? (
        <div style={{ fontFamily: C.fb, fontSize: 13, color: C.fg3, lineHeight: 1.5 }}>
          No trips yet. <a href="/app/plan" style={{ color: C.ocean, fontWeight: 600, textDecoration: 'none' }}>Plan your first one →</a>
        </div>
      ) : (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {activity.map((a, i) =>
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottom: i < activity.length - 1 ? `1px solid ${C.borderSoft}` : 'none', marginBottom: i < activity.length - 1 ? 14 : 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${a.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={a.icon} size={17} color={a.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: C.navy }}>{a.text}</div>
              <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3, marginTop: 1 }}>{a.sub}</div>
            </div>
            <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3, whiteSpace: 'nowrap' }}>{a.time}</div>
          </div>
        )}
      </div>
      )}
    </div>);
}

// ─── Account links ────────────────────────────────────────────
function QuickSettings() {
  const items = [
  { icon: 'user-round', label: 'Edit profile',         sub: 'Name, phone, home airport, bio', go: () => document.getElementById('edit-profile')?.scrollIntoView({ behavior: 'smooth' }) },
  { icon: 'map',        label: 'My trips',             sub: 'Manage your saved itineraries',  go: () => { window.location.href = '/app/trips'; } },
  { icon: 'globe-2',    label: 'Explore destinations', sub: 'Find your next trip',            go: () => { window.location.href = '/app/explore'; } },
  { icon: 'log-out',    label: 'Sign out',             sub: '', danger: true,                 go: () => Voya.logout() }];

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(44,44,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="settings" size={16} color={C.fg2} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Account</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, i) =>
        <button key={i} onClick={item.go} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 12, border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background 120ms' }}
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
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [toast, showToast]    = useToast();

  useEffect(() => {
    Promise.all([Voya.api('/api/profile'), Voya.api('/api/get-trips')]).then(([p, t]) => {
      if (p.ok) { setProfile(p.data.profile); Voya.setUserName(p.data.profile.full_name); }
      else setError(p.error);
      if (t.ok) setTrips(t.data.trips);
      setLoading(false);
    });
  }, []);

  useEffect(() => {if (window.lucide) window.lucide.createIcons();});

  const displayName = profile?.full_name || Voya.userName() || 'Traveler';
  const stats = computeStats(trips);

  return (
    <div className="v-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <VSidebar active="profile" name={displayName} />
      <main className="v-main" style={{ flex: 1, overflowY: 'auto', padding: '36px 44px 60px', background: C.cream }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: C.fb, fontSize: 14, color: C.fg3 }}>
            Loading profile…
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}><VNotice>{error}</VNotice></div>
        ) : (
          <>
            <ProfileHero profile={profile}
              onAvatarUpload={(url) => { setProfile(prev => ({ ...prev, avatar_url: url })); showToast('Photo updated'); }}
              onError={(msg) => showToast(msg, 'error')} />
            <StatsStrip stats={stats} />
            <div className="m-stack" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
              <div>
                <EditProfileCard profile={profile} onSaved={(p) => setProfile(prev => ({ ...prev, ...p }))} />
                <Achievements stats={stats} />
                <RecentActivity trips={trips} />
              </div>
              <div>
                <CountriesVisited trips={trips} />
                <div style={{ marginTop: 20 }}>
                  <QuickSettings />
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      {toast}
    </div>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProfileApp />);
