// dashboard/agent.jsx — Voya AI travel agent (chat card on the dashboard)
// Talks to /api/agent/stream: shows each tool step live, previews the itinerary,
// and only saves when the traveller presses "Save to My Trips" (/api/agent/confirm).

const AGENT_CONV_KEY = 'voya_agent_conversation';
const GREETING = 'Hey! Tell me where you want to go — I can plan a full trip, check the weather, find places, adjust a plan or remember what you like. ✈️';

function readConvId() { try { return localStorage.getItem(AGENT_CONV_KEY) || ''; } catch (e) { return ''; } }
function writeConvId(id) { try { id ? localStorage.setItem(AGENT_CONV_KEY, id) : localStorage.removeItem(AGENT_CONV_KEY); } catch (e) {} }

// ─── Tool steps ("Checking weather…") ─────────────────────────
function AgentSteps({ steps }) {
  if (!steps || !steps.length) return null;
  const icon = { running: 'loader', done: 'check', error: 'x', unavailable: 'minus' };
  const color = { running: C.ocean, done: C.success, error: C.danger, unavailable: C.fg3 };
  return (
    <div data-testid="agent-steps" style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 0' }}>
      {steps.map((s, i) => (
        <div key={s.tool + i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontFamily: C.fb, fontSize: 12, color: C.fg2 }}>
          <Icon name={icon[s.status] || 'circle'} size={13} color={color[s.status] || C.fg3}
            style={{ marginTop: 2, animation: s.status === 'running' ? 'spin 1s linear infinite' : 'none' }} />
          <span>
            {s.label.replace('…', '')}
            {s.detail && <span style={{ color: C.fg3 }}> · {s.detail}</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Itinerary preview card inside the chat ───────────────────
function ItineraryPreview({ itin, conversationId, saved, saving, onSave }) {
  const b = itin.budget_summary || {};
  const v = itin.verification || {};
  const money = b.total_formatted
    ? (b.budget_formatted
        ? `${b.total_formatted} est. · ${b.over_budget ? b.remaining_formatted.replace('-', '') + ' over' : b.remaining_formatted + ' left'}`
        : `${b.total_formatted} est.`)
    : '';
  return (
    <div data-testid="itinerary-preview" style={{
      background: '#fff', border: `1.5px solid ${C.borderDefault}`, borderRadius: 14,
      padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div className="has-photo" style={{ height: 84, margin: '-12px -13px 2px', borderRadius: '13px 13px 0 0', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(160deg,#6FAAEA 0%,#378ADD 55%,#07304F 100%)' }}>
        <PhotoLayer place={itin.destination} photo={itin.photo} width={640} overlay="linear-gradient(to bottom, transparent 50%, rgba(7,48,79,0.35))" />
      </div>
      <div>
        <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 15, color: C.navy }}>
          {itin.days.length}-day {itin.destination} trip
        </div>
        <div style={{ fontFamily: C.fb, fontSize: 11.5, color: C.fg3, marginTop: 2 }}>
          {Voya.formatDate(itin.start_date, { month: 'short', day: 'numeric' })} – {Voya.formatDate(itin.end_date, { month: 'short', day: 'numeric', year: 'numeric' })}
          {' · '}{itin.travelers} traveller{itin.travelers > 1 ? 's' : ''}
        </div>
      </div>
      {money && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: C.fb, fontSize: 12, color: b.over_budget ? C.danger : C.fg2 }}>
          <Icon name="wallet" size={13} color={b.over_budget ? C.danger : C.ocean} /> {money}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {itin.days.slice(0, 4).map(d => (
          <div key={d.day} style={{ fontFamily: C.fb, fontSize: 12, color: C.ink, display: 'flex', gap: 6 }}>
            <span style={{ color: C.ocean, fontWeight: 600, flexShrink: 0 }}>D{d.day}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
          </div>
        ))}
        {itin.days.length > 4 && <div style={{ fontFamily: C.fb, fontSize: 11.5, color: C.fg3 }}>+ {itin.days.length - 4} more days</div>}
      </div>
      {v.total > 0 && (
        <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3 }}>
          <Icon name="map-pin" size={11} color={C.fg3} /> {v.verified} of {v.total} stops verified on the map · costs are estimates
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {saved
          ? <VBtn variant="sky" size="sm" icon="check" onClick={() => { window.location.href = '/app/trips'; }}>Saved · View in My Trips</VBtn>
          : <VBtn variant="primary" size="sm" icon="bookmark" onClick={onSave} style={{ opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving…' : 'Save to My Trips'}
            </VBtn>}
        <VBtn variant="ghost" size="sm" trailing="arrow-right"
          onClick={() => { window.location.href = `/app/plan?conversation=${encodeURIComponent(conversationId)}`; }}>
          Open full plan
        </VBtn>
      </div>
    </div>
  );
}

// ─── Past conversations ───────────────────────────────────────
function AgentHistory({ onPick, onClose }) {
  const [list, setList] = React.useState(null);
  const [error, setError] = React.useState('');
  React.useEffect(() => {
    Voya.api('/api/conversations').then(r => r.ok ? setList(r.data.conversations) : setError(r.error));
  }, []);
  return (
    <div data-testid="agent-history" style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 13, color: C.navy }}>Past conversations</span>
        <button onClick={onClose} style={{ border: 0, background: 'none', cursor: 'pointer', fontFamily: C.fb, fontSize: 12, color: C.ocean }}>Back to chat</button>
      </div>
      {error && <VNotice>{error}</VNotice>}
      {list === null && !error && <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>Loading…</div>}
      {list && list.length === 0 && <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>No conversations yet.</div>}
      {list && list.map(c => (
        <button key={c.id} onClick={() => onPick(c.id)} style={{
          textAlign: 'left', border: `1px solid ${C.borderSoft}`, background: C.sky, borderRadius: 10,
          padding: '8px 10px', cursor: 'pointer', fontFamily: C.fb,
        }}>
          <div style={{ fontSize: 12.5, color: C.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
          <div style={{ fontSize: 11, color: C.fg3 }}>{Voya.formatDate((c.updated_at || '').slice(0, 10))}</div>
        </button>
      ))}
    </div>
  );
}

// ─── The chat card ────────────────────────────────────────────
function AIAssistant() {
  const greeting = { r: 'voya', t: GREETING };
  const [input, setInput] = React.useState('');
  const [msgs, setMsgs] = React.useState([greeting]);
  const [busy, setBusy] = React.useState(false);
  const [liveSteps, setLiveSteps] = React.useState([]);
  const [convId, setConvId] = React.useState(readConvId());
  const [draft, setDraft] = React.useState(null);        // latest itinerary in this conversation
  const [saved, setSaved] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const chatRef = React.useRef(null);
  const cardRef = React.useRef(null);

  React.useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [msgs, busy, liveSteps]);

  const loadConversation = React.useCallback((id) => {
    if (!id) return;
    Voya.api(`/api/conversations/${encodeURIComponent(id)}`).then(r => {
      if (!r.ok) { writeConvId(''); setConvId(''); return; }   // deleted or not ours: start fresh
      const loaded = r.data.messages.map(m => ({ r: m.role === 'user' ? 'user' : 'voya', t: m.content }));
      const d = r.data.conversation.draft_itinerary;
      if (d) {  // show the plan preview under the latest assistant message
        for (let i = loaded.length - 1; i >= 0; i--) if (loaded[i].r === 'voya') { loaded[i].preview = true; break; }
      }
      setMsgs([greeting, ...loaded]);
      setDraft(d || null);
      setSaved(Boolean(d && d.saved_trip_id));
      setConvId(id); writeConvId(id);
    });
  }, []);

  React.useEffect(() => { loadConversation(readConvId()); }, [loadConversation]);

  const newChat = () => {
    writeConvId(''); setConvId(''); setMsgs([greeting]); setDraft(null); setSaved(false); setShowHistory(false);
  };

  const confirmSave = async () => {
    if (!convId || saving || saved) return;
    setSaving(true);
    const r = await Voya.api('/api/agent/confirm', { method: 'POST', body: { conversation_id: convId, action: 'save_trip' } });
    setSaving(false);
    if (r.ok) {
      setSaved(true);
      setMsgs(m => [...m, { r: 'voya', t: r.data.reply, steps: r.data.steps }]);
    } else {
      setMsgs(m => [...m, { r: 'error', t: r.error }]);
    }
  };

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || busy) return;
    if (/^save( it| this)?( to my trips)?$/i.test(msg) && draft && !saved) { setInput(''); return confirmSave(); }
    setInput('');
    setShowHistory(false);
    setMsgs(m => [...m, { r: 'user', t: msg }]);
    setBusy(true);
    setLiveSteps([]);
    const steps = [];
    const res = await Voya.stream('/api/agent/stream', { message: msg, conversation_id: convId || undefined }, ev => {
      if (ev.type === 'conversation') { setConvId(ev.conversation_id); writeConvId(ev.conversation_id); }
      if (ev.type === 'step') {
        const i = steps.findIndex(s => s.tool === ev.tool);
        if (i >= 0) steps[i] = { ...steps[i], ...ev }; else steps.push(ev);
        setLiveSteps(steps.slice());
      }
    }, '/api/agent/chat');
    setBusy(false);
    setLiveSteps([]);
    if (!res.ok) { setMsgs(m => [...m, { r: 'error', t: res.error }]); return; }
    const out = res.result;
    if (out.conversation_id) { setConvId(out.conversation_id); writeConvId(out.conversation_id); }
    if (out.itinerary_changed && out.itinerary) { setDraft(out.itinerary); setSaved(Boolean(out.itinerary.saved_trip_id)); }
    if ((out.steps || []).some(st => st.tool === 'generate_itinerary')) window.dispatchEvent(new Event('voya:searches-changed'));
    if (out.itinerary && out.itinerary.saved_trip_id) setSaved(true);
    setMsgs(m => [...m, {
      r: 'voya', t: out.reply, steps: (out.steps || []).filter(s => s.tool !== 'understand'),
      preview: out.itinerary_changed && out.itinerary ? true : false, suggestions: out.suggestions || [],
    }]);
  };

  // The dashboard search bar sends its query here.
  React.useEffect(() => {
    const onAsk = e => {
      if (cardRef.current) cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      send(e.detail);
    };
    window.addEventListener('voya:ask', onAsk);
    return () => window.removeEventListener('voya:ask', onAsk);
  });

  const expanded = msgs.length > 1 || busy;
  const lastPreview = (() => { for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].preview) return i; return -1; })();

  return (
    <div ref={cardRef}>
    <VCard padding={0} radius={20} style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, ${C.ocean} 100%)`,
        padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.amber, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={18} color="#fff" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 15, color: '#fff' }}>Voya AI</div>
          <div style={{ fontFamily: C.fb, fontSize: 11, color: 'rgba(241,239,232,0.60)' }}>Your travel agent</div>
        </div>
        <button title="Past conversations" aria-label="Past conversations" onClick={() => setShowHistory(s => !s)} style={{ border: 0, background: 'rgba(255,255,255,0.12)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="history" size={14} color="#fff" />
        </button>
        <button title="New chat" aria-label="New chat" onClick={newChat} style={{ border: 0, background: 'rgba(255,255,255,0.12)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="plus" size={15} color="#fff" />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: busy ? C.amber : '#2FA56A', transition: 'background 300ms' }} />
          <span style={{ fontFamily: C.fb, fontSize: 11, color: 'rgba(241,239,232,0.70)' }}>{busy ? 'Working…' : 'Online'}</span>
        </div>
      </div>

      {showHistory ? (
        <AgentHistory onClose={() => setShowHistory(false)} onPick={id => { setShowHistory(false); loadConversation(id); }} />
      ) : (
        <div ref={chatRef} data-testid="agent-messages" style={{ padding: '12px 14px 6px', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: expanded ? 420 : 185, overflowY: 'auto', transition: 'max-height 250ms' }}>
          {msgs.map((m, i) => (
            <div key={i} className="fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: m.r === 'user' ? 'flex-end' : 'flex-start', gap: 6 }}>
              <div style={{
                maxWidth: '88%', padding: '8px 12px',
                borderRadius: m.r === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: m.r === 'user' ? C.ocean : m.r === 'error' ? 'rgba(226,85,61,0.10)' : C.sky,
                color: m.r === 'user' ? '#fff' : m.r === 'error' ? C.danger : C.ink,
                fontFamily: C.fb, fontSize: 13, lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {m.steps && m.steps.length > 0 && <AgentSteps steps={m.steps} />}
                <span data-testid={m.r === 'voya' ? 'agent-reply' : undefined}>{m.t}</span>
              </div>
              {i === lastPreview && draft && (
                <div style={{ width: '100%' }}>
                  <ItineraryPreview itin={draft} conversationId={convId} saved={saved} saving={saving} onSave={confirmSave} />
                </div>
              )}
              {i === msgs.length - 1 && !busy && m.suggestions && m.suggestions.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {m.suggestions.filter(s => !(saved && s === 'Save to My Trips')).map(s => (
                    <VChip key={s} tone="sky" size="sm" onClick={() => (s === 'Save to My Trips' ? confirmSave() : send(s))}>{s}</VChip>
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ padding: '10px 14px', borderRadius: '14px 14px 14px 4px', background: C.sky, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {liveSteps.length > 0 ? <AgentSteps steps={liveSteps} /> : (
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: C.fg3, display: 'inline-block', animation: `dotPulse 1.2s ease-in-out ${i * 0.18}s infinite` }} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '8px 14px 14px', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Plan a trip, ask about weather…"
          disabled={busy}
          maxLength={2000}
          style={{
            flex: 1, minWidth: 0, padding: '9px 13px',
            border: `1.5px solid ${C.borderDefault}`,
            borderRadius: 12, outline: 'none', background: C.sky,
            fontFamily: C.fb, fontSize: 13, color: C.ink,
            opacity: busy ? 0.65 : 1,
          }}
        />
        <button onClick={() => send()} disabled={busy} aria-label="Send" style={{
          width: 36, height: 36, borderRadius: 10, border: 0,
          background: busy ? C.borderDefault : C.ocean,
          cursor: busy ? 'default' : 'pointer', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 200ms',
        }}>
          <Icon name="send" size={15} color="#fff" />
        </button>
      </div>
    </VCard>
    </div>
  );
}
