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

function lookupFlag(dest) {
  const hit = (window.DESTINATIONS_LIST || []).find(d => d.name.toLowerCase() === (dest || '').toLowerCase());
  return hit ? hit.flag : null;
}

function buildTripFromApiResponse(apiData, formInputData) {
  const meta = DEST_META[apiData.destination] || {};

  const itinerary = (apiData.days || []).map(d => ({
    day: d.day,
    title: d.title || `Day ${d.day}`,
    theme: d.theme || '',
    activities: (d.activities || []).map(act => ({
      time: act.time || '', icon: act.icon || 'map-pin', name: act.name || '', note: act.note || '',
    })),
  }));

  return {
    id: null,  // not saved yet
    destination:   apiData.destination,
    cities:        apiData.cities || meta.cities || apiData.destination,
    flag:          meta.flag || lookupFlag(apiData.destination) || '✈️',
    budget:        formInputData.budget,
    days:          itinerary.length,
    startDate:     formInputData.startDate,   // ISO YYYY-MM-DD; formatted at render
    endDate:       formInputData.endDate,
    status:        'planning',
    travelers:     formInputData.travelers,
    travelStyle:   formInputData.styleLabels?.join(', ') || apiData.travel_style || '',
    gradient:      meta.gradient || 'linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)',
    itinerary,
    costBreakdown: apiData.cost_breakdown || null,
  };
}

// ─── Loading screen ───────────────────────────────────────────
function LoadingView({ dest }) {
  const steps = [
    'Reading your trip details…',
    'Picking real places for each day…',
    'Building your day-by-day plan…',
    'Estimating costs for your budget…',
    'Almost there — polishing your itinerary ✈️',
  ];
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    // Generation takes ~15–40s. Ease toward 95% so the bar never sits at 100%
    // while we're still waiting; the view switches as soon as the plan arrives.
    const start = Date.now();
    const pctTimer = setInterval(() => {
      const t = (Date.now() - start) / 1000;
      setPct(Math.min(95, Math.round(95 * (1 - Math.exp(-t / 14)))));
    }, 200);
    const stepTimer = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s));
    }, 6000);
    return () => { clearInterval(pctTimer); clearInterval(stepTimer); };
  }, []);

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <div className="v-main" style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: C.cream, padding: 40, minHeight: '70vh',
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
const PATH_FOR_VIEW = { form: '/app/plan', trips: '/app/trips' };

function PlanTripApp() {
  const params = new URLSearchParams(window.location.search);
  const [agentConv]                       = useState(() => params.get('conversation'));
  const [view, setView] = useState(() =>
    agentConv ? 'opening'
      : (window.location.pathname.replace(/\/$/, '') === '/app/trips' || window.location.hash === '#trips' || params.get('trip'))
        ? 'trips' : 'form');
  const [openTripId]                      = useState(() => params.get('trip'));
  const [prefillDest]                     = useState(() => params.get('destination') || '');
  const [formData, setFormData]           = useState(null);
  const [formInputData, setFormInputData] = useState(null);
  const [selectedTrip, setSelectedTrip]   = useState(null);
  const [genError, setGenError]           = useState('');

  // Keep the address bar in sync so refresh / back land on the same view.
  useEffect(() => {
    const path = PATH_FOR_VIEW[view];
    if (path && window.location.pathname !== path) window.history.replaceState(null, '', path);
  }, [view]);

  const handleGenerate = async (data) => {
    setFormInputData(data);
    setGenError('');
    setView('loading');

    const r = await Voya.api('/api/generate-trip', {
      method: 'POST',
      body: {
        destination:  data.dest,
        from_city:    data.from || '',
        budget:       data.budget,
        travel_style: data.styleLabels.join(', '),
        travelers:    data.travelers,
        start_date:   data.startDate,
        end_date:     data.endDate,
      },
    });

    if (!r.ok || !r.data.itinerary) {
      setGenError(r.error || 'Failed to generate itinerary. Please try again.');
      setView('form');
      return;
    }
    setFormData(buildTripFromApiResponse(r.data.itinerary, data));
    setView('itinerary');
  };

  // "Open full plan" from the AI agent: show the conversation's draft in the normal itinerary view.
  useEffect(() => {
    if (!agentConv) return;
    Voya.api(`/api/conversations/${encodeURIComponent(agentConv)}`).then(r => {
      const d = r.ok && r.data.conversation.draft_itinerary;
      if (!d) { setGenError(r.ok ? 'That conversation has no trip plan yet.' : r.error); setView('form'); return; }
      const trip = buildTripFromApiResponse(d, {
        budget: d.budget || (d.budget_summary || {}).total_formatted || '', startDate: d.start_date, endDate: d.end_date,
        travelers: d.travelers, styleLabels: d.interests || [],
      });
      if (d.saved_trip_id) { setSelectedTrip({ ...trip, id: d.saved_trip_id }); setView('tripDetail'); }
      else { setFormData(trip); setView('itinerary'); }
    });
  }, [agentConv]);

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
    <div className="v-shell" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <PTSidebar activeView={view} onSetView={handleSetView} />

      {view === 'form' && (
        <PlanForm onGenerate={handleGenerate} error={genError}
          initial={formInputData || (prefillDest ? { dest: prefillDest } : null)} />
      )}
      {view === 'opening' && (
        <main className="v-main" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream,
          fontFamily: C.fb, fontSize: 15, color: C.fg3 }}>Opening your plan…</main>
      )}
      {view === 'loading' && (
        <LoadingView dest={formInputData?.dest || 'your'} />
      )}
      {view === 'itinerary' && (
        <ItineraryView
          formData={formData}
          onBack={() => (agentConv ? window.location.assign('/app') : setView('form'))}
        />
      )}
      {view === 'trips' && (
        <MyTripsView onSelectTrip={handleSelectTrip} openTripId={openTripId}
          onNewTrip={() => setView('form')} />
      )}
      {view === 'tripDetail' && selectedTrip && (
        <ItineraryView
          trip={selectedTrip}
          isSaved={true}
          onBack={() => (agentConv ? window.location.assign('/app') : setView('trips'))}
        />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<PlanTripApp />);
