// profile/ProfileApp.jsx — Profile: who you are and where you've been.
// Editing lives in Settings (/app/settings); see profile/parts.jsx for the cards.

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

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const displayName = profile?.full_name || Voya.userName() || 'Traveler';
  const stats = computeStats(trips);

  return (
    <div className="v-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <VSidebar active="profile" name={displayName} />
      <main className="v-main" style={{ flex: 1, overflowY: 'auto', padding: '36px 44px 60px', background: C.cream }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: C.fb, fontSize: 14, color: C.fg3 }}>Loading profile…</div>
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
                <TripsTaken trips={trips} />
                <Achievements stats={stats} />
              </div>
              <div>
                <CountriesVisited trips={trips} />
              </div>
            </div>
          </>
        )}
      </main>
      {toast}
    </div>);
}

ReactDOM.createRoot(document.getElementById('root')).render(<ProfileApp />);
