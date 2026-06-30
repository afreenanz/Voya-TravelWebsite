// plantrip/App.jsx — Voya Plan Trip root
const { useState, useEffect, useRef } = React;

// ─── Destination metadata for display ─────────────────────────
const DEST_META = {
  'Thailand':    { flag: '🇹🇭', cities: 'Bangkok · Phuket · Phi Phi',        gradient: 'linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)' },
  'Bali':        { flag: '🇮🇩', cities: 'Ubud · Seminyak · Uluwatu',         gradient: 'linear-gradient(160deg,#A8D8A8 0%,#2E8B57 55%,#1B4332 100%)' },
  'Japan':       { flag: '🇯🇵', cities: 'Tokyo · Kyoto · Osaka',             gradient: 'linear-gradient(160deg,#FFD0DA 0%,#E8859C 50%,#0C447C 100%)' },
  'Dubai':       { flag: '🇦🇪', cities: 'Downtown · Marina · Desert',        gradient: 'linear-gradient(160deg,#FBE5BD 0%,#F2B650 45%,#87520A 100%)' },
  'Goa':         { flag: '🇮🇳', cities: 'North Goa · South Goa',             gradient: 'linear-gradient(160deg,#F6CD83 0%,#EF9F27 55%,#87520A 100%)' },
  'Maldives':    { flag: '🇲🇻', cities: 'Malé · Maafushi · Baa Atoll',       gradient: 'linear-gradient(160deg,#B2EBF2 0%,#00ACC1 55%,#006064 100%)' },
  'Vietnam':     { flag: '🇻🇳', cities: 'Hanoi · Hoi An · Ho Chi Minh',      gradient: 'linear-gradient(160deg,#FFCDD2 0%,#E53935 55%,#7F0000 100%)' },
  'Switzerland': { flag: '🇨🇭', cities: 'Zurich · Interlaken · Geneva',      gradient: 'linear-gradient(160deg,#E8F5E9 0%,#43A047 55%,#1B5E20 100%)' },
  'Paris':       { flag: '🇫🇷', cities: 'Eiffel Tower · Marais · Montmartre', gradient: 'linear-gradient(160deg,#EDE7F6 0%,#7E57C2 55%,#311B92 100%)' },
  'New York':    { flag: '🇺🇸', cities: 'Manhattan · Brooklyn · Queens',     gradient: 'linear-gradient(160deg,#E3F2FD 0%,#1E88E5 55%,#0D47A1 100%)' },
};

function buildTripFromApiResponse(apiData, formInputData) {
  const meta = DEST_META[apiData.destination] || {
    flag: '✈️',
    cities: apiData.destination,
    gradient: 'linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)',
  };

  const fmt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const itinerary = (apiData.days || []).map(d => ({
    day: d.day,
    title: d.title || `Day ${d.day}`,
    theme: d.theme || '',
    activities: (d.activities || []).map(act => {
      if (typeof act === 'string') return { time: '', icon: 'map-pin', name: act, note: '' };
      return { time: act.time || '', icon: act.icon || 'map-pin', name: act.name || act, note: act.note || '' };
    }),
  }));

  return {
    id: apiData.destination.toLowerCase().replace(/\s+/g, '-'),
    destination: apiData.destination,
    cities: meta.cities,
    flag: meta.flag,
    budget: formInputData.budget,
    days: itinerary.length,
    startDate: fmt(formInputData.startDate),
    endDate: fmt(formInputData.endDate),
    status: 'planning',
    travelers: formInputData.travelers,
    travelStyle:   formInputData.styles?.join(' & ') || apiData.travel_style || '',
    gradient:      meta.gradient,
    itinerary,
    costBreakdown: apiData.cost_breakdown || null,
  };
}

// ─── Loading screen ───────────────────────────────────────────
function LoadingView({ dest, onDone }) {
  const steps = [
    'Scanning 2,400 flights…',
    'Checking hotel availability…',
    'Building your day-by-day plan…',
    'Adding local tips & hidden gems…',
    'Finalising your itinerary ✈️',
  ];
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const total = 2200;
    const start = Date.now();
    const pctTimer = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, Math.round((elapsed / total) * 100));
      setPct(p);
      if (p >= 100) clearInterval(pctTimer);
    }, 40);
    const stepTimer = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 420);
    const doneTimer = setTimeout(onDone, total);
    return () => { clearInterval(pctTimer); clearInterval(stepTimer); clearTimeout(doneTimer); };
  }, []);

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.cream, padding: 40,
    }}>
      {/* Animated route SVG */}
      <div style={{ marginBottom: 36, position: 'relative', width: 260, height: 120 }}>
        <svg viewBox="0 0 260 120" width="260" height="120">
          <path
            d="M 20 95 C 80 20, 170 10, 240 65"
            fill="none" stroke={C.borderDefault} strokeWidth="2"
            strokeDasharray="4 9" strokeLinecap="round"
          />
          <path
            d="M 20 95 C 80 20, 170 10, 240 65"
            fill="none" stroke={C.ocean} strokeWidth="2.5"
            strokeDasharray="4 9" strokeLinecap="round"
            style={{
              strokeDashoffset: 0,
              animation: 'dashFlow 1.2s linear infinite',
            }}
          />
          {/* Plane */}
          <g transform="translate(8,83) rotate(-36)">
            <path d="M0 6L12 0v3.5l-6 1.5v7l2 2-4-1-2 1 2-2V7.5z"
              fill={C.ocean} />
          </g>
          {/* Pin */}
          <g transform="translate(228,52)">
            <path d="M9 0C4.1 0 0 4 0 9c0 6.6 9 16 9 16s9-9.4 9-16C18 4 14 0 9 0Z"
              fill={C.amber} />
            <circle cx="9" cy="9" r="3" fill="rgba(255,255,255,0.9)" />
          </g>
        </svg>
      </div>

      <div style={{
        fontFamily: C.fd, fontWeight: 700, fontSize: 28,
        color: C.navy, letterSpacing: '-0.02em', marginBottom: 8, textAlign: 'center',
      }}>
        Crafting your {dest} itinerary…
      </div>

      <div style={{
        fontFamily: C.fb, fontSize: 15, color: C.fg3,
        marginBottom: 36, textAlign: 'center', height: 22,
        transition: 'opacity 300ms',
      }}>
        {steps[step]}
      </div>

      {/* Progress bar */}
      <div style={{ width: 320, maxWidth: '100%' }}>
        <div style={{ height: 6, background: C.sky, borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: `linear-gradient(90deg, ${C.ocean}, ${C.amber})`,
            width: `${pct}%`, transition: 'width 80ms linear',
          }} />
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8,
          fontFamily: C.fb, fontSize: 12, color: C.fg3,
        }}>
          <span>Voya AI</span>
          <span>{pct}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── App root ─────────────────────────────────────────────────
function PlanTripApp() {
  const [view, setView] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'trips') return 'trips';
    return 'form';
  });
  const [formData, setFormData]           = useState(null);
  const [formInputData, setFormInputData] = useState(null);
  const [selectedTrip, setSelectedTrip]   = useState(null);

  const handleGenerate = async (data) => {
    setFormInputData(data);
    setView('loading');

    try {
      const [result] = await Promise.all([
        fetch('http://127.0.0.1:5000/generate-trip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination:  data.dest,
            from_city:    data.from || '',
            budget:       data.budget,
            travel_style: data.styles.join(', '),
            travelers:    data.travelers,
            start_date:   data.startDate,
            end_date:     data.endDate,
            email:        localStorage.getItem('voya_user_email') || '',
          }),
        }).then(r => r.json()),
        new Promise(resolve => setTimeout(resolve, 2200)),
      ]);

      if (!result.success || !result.itinerary) {
        throw new Error(result.error || 'No itinerary returned');
      }

      setFormData(buildTripFromApiResponse(result.itinerary, data));
      setView('itinerary');

      // Save to recent searches (fire and forget)
      const email = localStorage.getItem('voya_user_email') || '';
      if (email) {
        const query = data.styles && data.styles.length
          ? `${data.dest} · ${data.styles.join(', ')} · ${data.budget}`
          : data.dest;
        fetch('http://127.0.0.1:5000/save-search', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_email: email, query }),
        }).catch(() => {});
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate itinerary. Please try again.');
      setView('form');
    }
  };

  const handleLoadingDone = () => {};

  const handleSelectTrip = (trip) => {
    setSelectedTrip(trip);
    setView('tripDetail');
  };

  const handleSetView = (v) => {
    setView(v);
    if (v !== 'tripDetail') setSelectedTrip(null);
  };

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <PTSidebar activeView={view} onSetView={handleSetView} />

      {view === 'form' && (
        <PlanForm onGenerate={handleGenerate} />
      )}
      {view === 'loading' && (
        <LoadingView dest={formInputData?.dest || 'your'} onDone={handleLoadingDone} />
      )}
      {view === 'itinerary' && (
        <ItineraryView
          formData={formData}
          onSave={() => setView('trips')}
          onBack={() => setView('form')}
        />
      )}
      {view === 'trips' && (
        <MyTripsView onSelectTrip={handleSelectTrip} />
      )}
      {view === 'tripDetail' && selectedTrip && (
        <ItineraryView
          trip={selectedTrip}
          isSaved={true}
          onBack={() => setView('trips')}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PlanTripApp />);
