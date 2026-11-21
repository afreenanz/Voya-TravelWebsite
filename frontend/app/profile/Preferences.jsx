// profile/Preferences.jsx — "What Voya remembers": view, edit and delete the
// travel preferences the AI agent uses (stored server-side in user_preferences).

function TravelPreferencesCard({ onToast }) {
  const [prefs, setPrefs] = React.useState(null);      // last saved
  const [draft, setDraft] = React.useState(null);      // being edited
  const [fields, setFields] = React.useState(null);
  const [adding, setAdding] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    Voya.api('/api/preferences').then(r => {
      if (!r.ok) { setError(r.error); return; }
      setPrefs(r.data.preferences); setDraft(r.data.preferences); setFields(r.data.fields);
    });
  }, []);
  React.useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  if (error && !draft) return <div style={{ marginBottom: 20 }}><VNotice>{error}</VNotice></div>;
  if (!draft || !fields) return null;

  const dirty = JSON.stringify(prefs) !== JSON.stringify(draft);
  const setKey = (k, v) => { setError(''); setDraft(d => { const n = { ...d }; if (v && (!Array.isArray(v) || v.length)) n[k] = v; else delete n[k]; return n; }); };
  const addItem = (k) => {
    const v = (adding[k] || '').trim();
    if (!v) return;
    const cur = draft[k] || [];
    if (!cur.some(x => x.toLowerCase() === v.toLowerCase())) setKey(k, [...cur, v]);
    setAdding(a => ({ ...a, [k]: '' }));
  };
  const save = async () => {
    setSaving(true); setError('');
    const r = await Voya.api('/api/preferences', { method: 'PUT', body: { preferences: draft } });
    setSaving(false);
    if (!r.ok) { setError(r.error); return; }
    setPrefs(r.data.preferences); setDraft(r.data.preferences);
    onToast && onToast('Preferences saved');
  };
  const clearAll = async () => {
    if (!window.confirm('Forget all your travel preferences? Voya will stop personalising plans with them.')) return;
    const r = await Voya.api('/api/preferences', { method: 'DELETE' });
    if (!r.ok) { setError(r.error); return; }
    setPrefs({}); setDraft({});
    onToast && onToast('Preferences cleared');
  };

  const labelStyle = { display: 'block', fontFamily: C.fb, fontWeight: 600, fontSize: 12, color: C.fg3, marginBottom: 6 };
  const inputStyle = { flex: 1, minWidth: 0, fontFamily: C.fb, fontSize: 13, padding: '7px 12px', borderRadius: 10,
                       border: `1.5px solid ${C.borderDefault}`, background: C.sky, color: C.ink, outline: 'none' };
  const empty = Object.keys(prefs || {}).length === 0;

  return (
    <div id="travel-preferences" data-testid="travel-preferences" style={{ background: '#fff', borderRadius: 20, padding: '22px 24px', marginBottom: 20, boxShadow: '0 2px 8px rgba(12,68,124,0.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,159,39,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={16} color={C.amber} />
        </div>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 16, color: C.navy }}>Travel preferences</span>
      </div>
      <div style={{ fontFamily: C.fb, fontSize: 12.5, color: C.fg3, marginBottom: 18 }}>
        What Voya AI remembers to personalise your plans. {empty && 'Tell Voya AI what you like (e.g. "I prefer beaches and cafes") or add it here.'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }} className="m-stack">
        {Object.entries(fields.lists).map(([k, label]) => (
          <div key={k}>
            <label style={labelStyle}>{label}</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
              {(draft[k] || []).map(item => (
                <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 6px 4px 11px', borderRadius: 999,
                  background: C.sky, color: C.navy, fontFamily: C.fb, fontSize: 12 }}>
                  {item}
                  <button aria-label={`Remove ${item}`} onClick={() => setKey(k, draft[k].filter(x => x !== item))}
                    style={{ border: 0, background: 'transparent', cursor: 'pointer', padding: 2, display: 'flex' }}>
                    <Icon name="x" size={12} color={C.fg3} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={adding[k] || ''} placeholder="Add…" maxLength={60} style={inputStyle}
                onChange={e => setAdding(a => ({ ...a, [k]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addItem(k)} />
              <VBtn variant="sky" size="sm" onClick={() => addItem(k)}>Add</VBtn>
            </div>
          </div>
        ))}
        <div>
          <label style={labelStyle}>{fields.text.pace}</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {fields.pace_values.map(p => (
              <VChip key={p} tone="sky" size="md" active={draft.pace === p} onClick={() => setKey('pace', draft.pace === p ? '' : p)}>
                {p[0].toUpperCase() + p.slice(1)}
              </VChip>
            ))}
          </div>
        </div>
        <div>
          <label style={labelStyle}>{fields.text.budget}</label>
          <input value={draft.budget || ''} placeholder="e.g. mid-range, under ₹50,000" maxLength={60}
            style={{ ...inputStyle, width: '100%' }} onChange={e => setKey('budget', e.target.value)} />
        </div>
      </div>

      {error && <VNotice style={{ marginTop: 14 }}>{error}</VNotice>}
      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <VBtn variant="primary" size="sm" icon="check" onClick={save} style={{ opacity: dirty && !saving ? 1 : 0.5, pointerEvents: dirty && !saving ? 'auto' : 'none' }}>
          {saving ? 'Saving…' : 'Save preferences'}
        </VBtn>
        {dirty && <VBtn variant="ghost" size="sm" onClick={() => setDraft(prefs)}>Undo changes</VBtn>}
        {!empty && <VBtn variant="ghost" size="sm" icon="trash-2" onClick={clearAll} style={{ color: C.danger }}>Forget all</VBtn>}
      </div>
    </div>
  );
}
