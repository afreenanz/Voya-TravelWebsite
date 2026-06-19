// SearchScreen.jsx — AI prompt search ("Tell Voya where you're dreaming")
function SearchScreen({ onBack, onPlan }) {
  const [text, setText] = React.useState("10 days in Japan in May, under $3k, want food + temples");
  const [planning, setPlanning] = React.useState(false);
  const suggestions = [
    "Weekend in Mexico City under $600",
    "Two weeks Southeast Asia, beach + city mix",
    "Solo trip to Iceland, no driving",
    "Family of 4 to Lisbon, kids 6 and 9",
  ];

  function plan() {
    setPlanning(true);
    setTimeout(onPlan, 1400);
  }

  return (
    <div style={{ padding: '0 0 120px' }}>
      <VoyaScreenHeader title="Plan a trip" back onBack={onBack}
        trailing={<button style={{ background: 'transparent', border: 0, color: voyaColors.ocean,
                                   fontFamily: 'Plus Jakarta Sans', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    Clear
                  </button>} />

      <div style={{ padding: '0 20px' }}>
        <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 11,
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: voyaColors.ocean, marginBottom: 6 }}>
          TELL VOYA
        </div>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          style={{
            width: '100%', minHeight: 110, boxSizing: 'border-box',
            background: '#fff', border: '1.5px solid rgba(55,138,221,0.30)',
            borderRadius: 20, padding: 16, resize: 'none',
            fontFamily: 'Plus Jakarta Sans', fontSize: 16, color: voyaColors.ink,
            lineHeight: 1.5, outline: 'none',
            boxShadow: '0 6px 18px rgba(12,68,124,0.08)',
          }}/>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <VoyaChip tone="cream" icon="calendar">Dates</VoyaChip>
          <VoyaChip tone="cream" icon="users">2 travelers</VoyaChip>
          <VoyaChip tone="cream" icon="wallet">Budget</VoyaChip>
          <VoyaChip tone="cream" icon="plane">From SFO</VoyaChip>
        </div>

        <div style={{ marginTop: 24 }}>
          <div style={{ fontFamily: 'Clash Grotesk', fontWeight: 700, fontSize: 11,
                        letterSpacing: '0.18em', textTransform: 'uppercase',
                        color: voyaColors.ocean, marginBottom: 10 }}>
            TRY SOMETHING LIKE
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => setText(s)} style={{
                background: '#fff', border: 0, textAlign: 'left',
                padding: '12px 14px', borderRadius: 16,
                boxShadow: '0 1px 2px rgba(12,68,124,0.06)',
                fontFamily: 'Plus Jakarta Sans', fontSize: 14, color: voyaColors.navy,
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}>
                <Icon name="sparkles" size={16} color={voyaColors.amber}/>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky plan button */}
      <div style={{
        position: 'absolute', left: 16, right: 16, bottom: 110,
      }}>
        <VoyaButton variant="amber" size="lg" fullWidth onClick={plan}
          trailingIcon={planning ? null : 'arrow-right'}>
          {planning ? 'Voya is planning…' : 'Plan my trip'}
        </VoyaButton>
      </div>
    </div>
  );
}

window.SearchScreen = SearchScreen;
