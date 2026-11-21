// settings/SettingsApp.jsx — Settings: edit profile, travel preferences,
// recent activity and account. Uses the cards from profile/parts.jsx.
// ─── Account (Settings) ───────────────────────────────────────
function AccountCard({ email }) {
  const items = [
  { icon: 'user-round', label: 'View profile',         sub: email || 'Your travel profile',    go: () => { window.location.href = '/app/profile'; } },
  { icon: 'map',        label: 'My trips',             sub: 'Manage your saved itineraries',  go: () => { window.location.href = '/app/trips'; } },
  { icon: 'globe-2',    label: 'Explore destinations', sub: 'Find your next trip',            go: () => { window.location.href = '/app/explore'; } },
  { icon: 'log-out',    label: 'Sign out',             sub: '', danger: true,                 go: () => Voya.logout() }];

  return (
    <div id="account" style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
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


const SETTINGS_SECTIONS = [
  { id: 'edit-profile',       label: 'Edit profile',       icon: 'user-round' },
  { id: 'travel-preferences', label: 'Travel preferences', icon: 'sparkles' },
  { id: 'recent-activity',    label: 'Recent activity',    icon: 'activity' },
  { id: 'account',            label: 'Account',            icon: 'settings' },
];

function SettingsApp() {
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

  // /app/settings#travel-preferences → jump to that section once it has rendered.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!loading && id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
  }, [loading]);

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const go = (id) => {
    history.replaceState(null, '', '#' + id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="v-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <VSidebar active="settings" name={profile?.full_name} />
      <main className="v-main" style={{ flex: 1, overflowY: 'auto', padding: '36px 44px 60px', background: C.cream }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ocean, marginBottom: 8 }}>YOUR ACCOUNT</div>
          <h1 style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 34, color: C.navy, margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
        </div>
        <div data-testid="settings-nav" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {SETTINGS_SECTIONS.map(s => <VChip key={s.id} tone="sky" size="md" icon={s.icon} onClick={() => go(s.id)}>{s.label}</VChip>)}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: C.fb, fontSize: 14, color: C.fg3 }}>Loading settings…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}><VNotice>{error}</VNotice></div>
        ) : (
          <div style={{ maxWidth: 820 }}>
            <EditProfileCard profile={profile} onSaved={(p) => { setProfile(prev => ({ ...prev, ...p })); showToast('Profile updated'); }} />
            <TravelPreferencesCard onToast={showToast} />
            <div id="recent-activity"><RecentActivity trips={trips} /></div>
            <AccountCard email={profile?.email} />
          </div>
        )}
      </main>
      {toast}
    </div>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<SettingsApp />);
