// plantrip/PlanForm.jsx
const { useState, useEffect } = React;

const DESTINATIONS_LIST = [
  // ── Top picks ──────────────────────────────────────────────
  { name: 'Thailand',         flag: '🇹🇭', hint: 'Bangkok · Beaches · Temples' },
  { name: 'Bali',             flag: '🇮🇩', hint: 'Temples · Rice Fields · Surf' },
  { name: 'Japan',            flag: '🇯🇵', hint: 'Tokyo · Kyoto · Cherry Blossoms' },
  { name: 'Dubai',            flag: '🇦🇪', hint: 'Skyline · Desert · Luxury' },
  { name: 'Goa',              flag: '🇮🇳', hint: 'Beaches · Nightlife · Portuguese' },
  { name: 'Maldives',         flag: '🇲🇻', hint: 'Overwater Villas · Coral Reefs' },
  { name: 'Vietnam',          flag: '🇻🇳', hint: 'Hoi An · Ha Long Bay · Pho' },
  { name: 'Switzerland',      flag: '🇨🇭', hint: 'Alps · Lakes · Trains' },
  { name: 'Paris',            flag: '🇫🇷', hint: 'Eiffel Tower · Art · Cuisine' },
  { name: 'New York',         flag: '🇺🇸', hint: 'Manhattan · Central Park · Jazz' },
  // ── Asia ───────────────────────────────────────────────────
  { name: 'Singapore',        flag: '🇸🇬', hint: 'Gardens · Food · Marina Bay' },
  { name: 'Malaysia',         flag: '🇲🇾', hint: 'KL · Penang · Borneo' },
  { name: 'Philippines',      flag: '🇵🇭', hint: 'Palawan · Cebu · Islands' },
  { name: 'Sri Lanka',        flag: '🇱🇰', hint: 'Temples · Tea · Wildlife' },
  { name: 'Nepal',            flag: '🇳🇵', hint: 'Everest · Kathmandu · Trekking' },
  { name: 'Bhutan',           flag: '🇧🇹', hint: 'Monasteries · Mountains · Happiness' },
  { name: 'Cambodia',         flag: '🇰🇭', hint: 'Angkor Wat · Phnom Penh' },
  { name: 'Laos',             flag: '🇱🇦', hint: 'Luang Prabang · Waterfalls' },
  { name: 'Myanmar',          flag: '🇲🇲', hint: 'Bagan · Inle Lake · Pagodas' },
  { name: 'China',            flag: '🇨🇳', hint: 'Great Wall · Shanghai · Beijing' },
  { name: 'South Korea',      flag: '🇰🇷', hint: 'Seoul · K-Culture · Temples' },
  { name: 'Taiwan',           flag: '🇹🇼', hint: 'Taipei · Night Markets · Mountains' },
  { name: 'Hong Kong',        flag: '🇭🇰', hint: 'Skyline · Dim Sum · Shopping' },
  { name: 'Mongolia',         flag: '🇲🇳', hint: 'Gobi Desert · Nomads · Steppes' },
  { name: 'Uzbekistan',       flag: '🇺🇿', hint: 'Samarkand · Silk Road · Mosques' },
  { name: 'Kazakhstan',       flag: '🇰🇿', hint: 'Almaty · Steppe · Adventure' },
  { name: 'Georgia',          flag: '🇬🇪', hint: 'Tbilisi · Caucasus · Wine' },
  { name: 'Armenia',          flag: '🇦🇲', hint: 'Yerevan · Monasteries · History' },
  { name: 'Turkey',           flag: '🇹🇷', hint: 'Istanbul · Cappadocia · Beaches' },
  { name: 'Jordan',           flag: '🇯🇴', hint: 'Petra · Wadi Rum · Dead Sea' },
  { name: 'Oman',             flag: '🇴🇲', hint: 'Muscat · Wadis · Desert' },
  { name: 'Qatar',            flag: '🇶🇦', hint: 'Doha · Souq Waqif · Desert' },
  { name: 'Saudi Arabia',     flag: '🇸🇦', hint: 'Riyadh · AlUla · Red Sea' },
  { name: 'Israel',           flag: '🇮🇱', hint: 'Jerusalem · Tel Aviv · Dead Sea' },
  // ── Europe ─────────────────────────────────────────────────
  { name: 'Italy',            flag: '🇮🇹', hint: 'Rome · Venice · Florence' },
  { name: 'Spain',            flag: '🇪🇸', hint: 'Barcelona · Madrid · Seville' },
  { name: 'Greece',           flag: '🇬🇷', hint: 'Santorini · Athens · Islands' },
  { name: 'Portugal',         flag: '🇵🇹', hint: 'Lisbon · Porto · Algarve' },
  { name: 'Netherlands',      flag: '🇳🇱', hint: 'Amsterdam · Tulips · Windmills' },
  { name: 'Germany',          flag: '🇩🇪', hint: 'Berlin · Munich · Black Forest' },
  { name: 'Austria',          flag: '🇦🇹', hint: 'Vienna · Salzburg · Alps' },
  { name: 'Czech Republic',   flag: '🇨🇿', hint: 'Prague · Castles · Beer' },
  { name: 'Hungary',          flag: '🇭🇺', hint: 'Budapest · Thermal Baths' },
  { name: 'Croatia',          flag: '🇭🇷', hint: 'Dubrovnik · Plitvice · Adriatic' },
  { name: 'Poland',           flag: '🇵🇱', hint: 'Kraków · Warsaw · History' },
  { name: 'Norway',           flag: '🇳🇴', hint: 'Fjords · Northern Lights · Bergen' },
  { name: 'Sweden',           flag: '🇸🇪', hint: 'Stockholm · Nature · Design' },
  { name: 'Denmark',          flag: '🇩🇰', hint: 'Copenhagen · Design · Hygge' },
  { name: 'Finland',          flag: '🇫🇮', hint: 'Northern Lights · Saunas · Lapland' },
  { name: 'Iceland',          flag: '🇮🇸', hint: 'Northern Lights · Glaciers · Geysers' },
  { name: 'Ireland',          flag: '🇮🇪', hint: 'Dublin · Cliffs of Moher · Pubs' },
  { name: 'United Kingdom',   flag: '🇬🇧', hint: 'London · Scotland · Lake District' },
  { name: 'Belgium',          flag: '🇧🇪', hint: 'Brussels · Bruges · Chocolate' },
  { name: 'Romania',          flag: '🇷🇴', hint: 'Transylvania · Castles · Bucovina' },
  { name: 'Bulgaria',         flag: '🇧🇬', hint: 'Sofia · Black Sea · Rhodopes' },
  { name: 'Serbia',           flag: '🇷🇸', hint: 'Belgrade · Novi Sad · Danube' },
  { name: 'Slovenia',         flag: '🇸🇮', hint: 'Lake Bled · Ljubljana · Triglav' },
  { name: 'Malta',            flag: '🇲🇹', hint: 'Valletta · Blue Lagoon · History' },
  { name: 'Cyprus',           flag: '🇨🇾', hint: 'Paphos · Beaches · Ancient Ruins' },
  { name: 'Russia',           flag: '🇷🇺', hint: 'Moscow · St. Petersburg · Trans-Siberian' },
  // ── Africa ─────────────────────────────────────────────────
  { name: 'Morocco',          flag: '🇲🇦', hint: 'Marrakech · Sahara · Medinas' },
  { name: 'Egypt',            flag: '🇪🇬', hint: 'Pyramids · Nile · Red Sea' },
  { name: 'South Africa',     flag: '🇿🇦', hint: 'Cape Town · Safari · Wine' },
  { name: 'Kenya',            flag: '🇰🇪', hint: 'Safari · Maasai Mara · Nairobi' },
  { name: 'Tanzania',         flag: '🇹🇿', hint: 'Serengeti · Zanzibar · Kilimanjaro' },
  { name: 'Mauritius',        flag: '🇲🇺', hint: 'Beaches · Luxury · Indian Ocean' },
  { name: 'Seychelles',       flag: '🇸🇨', hint: 'Pristine Beaches · Coral · Luxury' },
  { name: 'Rwanda',           flag: '🇷🇼', hint: 'Gorilla Trekking · Kigali · Volcanoes' },
  { name: 'Zimbabwe',         flag: '🇿🇼', hint: 'Victoria Falls · Safari · Ruins' },
  { name: 'Tunisia',          flag: '🇹🇳', hint: 'Carthage · Sahara · Medina' },
  { name: 'Ethiopia',         flag: '🇪🇹', hint: 'Lalibela · Danakil · Coffee' },
  // ── Americas ───────────────────────────────────────────────
  { name: 'Mexico',           flag: '🇲🇽', hint: 'Cancún · Mexico City · Pyramids' },
  { name: 'Costa Rica',       flag: '🇨🇷', hint: 'Rainforest · Volcanoes · Beaches' },
  { name: 'Cuba',             flag: '🇨🇺', hint: 'Havana · Vintage Cars · Cigars' },
  { name: 'Colombia',         flag: '🇨🇴', hint: 'Bogotá · Cartagena · Coffee' },
  { name: 'Peru',             flag: '🇵🇪', hint: 'Machu Picchu · Amazon · Cusco' },
  { name: 'Brazil',           flag: '🇧🇷', hint: 'Rio · Amazon · Iguazu Falls' },
  { name: 'Argentina',        flag: '🇦🇷', hint: 'Buenos Aires · Patagonia · Wine' },
  { name: 'Chile',            flag: '🇨🇱', hint: 'Atacama · Patagonia · Easter Island' },
  { name: 'Ecuador',          flag: '🇪🇨', hint: 'Galápagos · Quito · Amazon' },
  { name: 'Canada',           flag: '🇨🇦', hint: 'Toronto · Vancouver · Banff · Niagara' },
  { name: 'USA',              flag: '🇺🇸', hint: 'New York · LA · Miami · Grand Canyon' },
  { name: 'Dominican Republic', flag: '🇩🇴', hint: 'Punta Cana · Beaches · All-Inclusive' },
  // ── Oceania ────────────────────────────────────────────────
  { name: 'Australia',        flag: '🇦🇺', hint: 'Sydney · Melbourne · Great Barrier Reef' },
  { name: 'New Zealand',      flag: '🇳🇿', hint: 'Auckland · Fjords · Lord of the Rings' },
  { name: 'Fiji',             flag: '🇫🇯', hint: 'Coral Reefs · Overwater Bures · Islands' },
];

const DEPARTURE_CITIES = [
  // ── India ──────────────────────────────────────────────────
  { name: 'Mumbai',           code: 'BOM', hint: 'Chhatrapati Shivaji International' },
  { name: 'Delhi',            code: 'DEL', hint: 'Indira Gandhi International' },
  { name: 'Bangalore',        code: 'BLR', hint: 'Kempegowda International' },
  { name: 'Hyderabad',        code: 'HYD', hint: 'Rajiv Gandhi International' },
  { name: 'Chennai',          code: 'MAA', hint: 'Chennai International' },
  { name: 'Kolkata',          code: 'CCU', hint: 'Netaji Subhas Chandra Bose' },
  { name: 'Pune',             code: 'PNQ', hint: 'Pune Airport' },
  { name: 'Ahmedabad',        code: 'AMD', hint: 'Sardar Vallabhbhai Patel' },
  { name: 'Kochi',            code: 'COK', hint: 'Cochin International' },
  { name: 'Goa',              code: 'GOI', hint: 'Mopa International' },
  { name: 'Jaipur',           code: 'JAI', hint: 'Jaipur International' },
  { name: 'Lucknow',          code: 'LKO', hint: 'Chaudhary Charan Singh' },
  { name: 'Chandigarh',       code: 'IXC', hint: 'Chandigarh International' },
  { name: 'Indore',           code: 'IDR', hint: 'Devi Ahilyabai Holkar' },
  { name: 'Nagpur',           code: 'NAG', hint: 'Dr. Babasaheb Ambedkar' },
  { name: 'Coimbatore',       code: 'CJB', hint: 'Coimbatore International' },
  { name: 'Visakhapatnam',    code: 'VTZ', hint: 'Visakhapatnam Airport' },
  { name: 'Thiruvananthapuram', code: 'TRV', hint: 'Trivandrum International' },
  // ── International hubs ─────────────────────────────────────
  { name: 'Dubai',            code: 'DXB', hint: 'Dubai International' },
  { name: 'Singapore',        code: 'SIN', hint: 'Changi Airport' },
  { name: 'Bangkok',          code: 'BKK', hint: 'Suvarnabhumi Airport' },
  { name: 'Kuala Lumpur',     code: 'KUL', hint: 'KL International' },
  { name: 'London',           code: 'LHR', hint: 'Heathrow Airport' },
  { name: 'New York',         code: 'JFK', hint: 'John F. Kennedy International' },
  { name: 'Sydney',           code: 'SYD', hint: 'Kingsford Smith Airport' },
  { name: 'Toronto',          code: 'YYZ', hint: 'Pearson International' },
  { name: 'Hong Kong',        code: 'HKG', hint: 'Hong Kong International' },
  { name: 'Tokyo',            code: 'NRT', hint: 'Narita International' },
];

const TRAVEL_STYLES = [
  { id: 'adventure',   label: 'Adventure',    icon: 'mountain' },
  { id: 'cultural',    label: 'Cultural',     icon: 'landmark' },
  { id: 'relaxation',  label: 'Relaxation',   icon: 'sun' },
  { id: 'food',        label: 'Food & Dining',icon: 'utensils' },
  { id: 'romantic',    label: 'Romantic',     icon: 'heart' },
  { id: 'family',      label: 'Family',       icon: 'users' },
];

const BUDGET_OPTIONS = ['₹30,000', '₹50,000', '₹75,000', '₹1,00,000', '₹1,50,000+'];

function PlanForm({ onGenerate }) {
  const [dest, setDest]               = useState('');
  const [showSugg, setShowSugg]       = useState(false);
  const [from, setFrom]               = useState('');
  const [showFromSugg, setShowFromSugg] = useState(false);
  const [startDate, setStartDate]     = useState('');
  const [endDate, setEndDate]         = useState('');
  const [budget, setBudget]           = useState('₹60,000');
  const [travelers, setTravelers]     = useState(2);
  const [styles, setStyles]           = useState(['cultural', 'food']);

  const filtered     = DESTINATIONS_LIST.filter(d =>
    dest.length === 0 || d.name.toLowerCase().includes(dest.toLowerCase())
  );
  const filteredFrom = DEPARTURE_CITIES.filter(d =>
    from.length === 0 || d.name.toLowerCase().includes(from.toLowerCase()) || d.code.toLowerCase().includes(from.toLowerCase())
  );

  const toggleStyle = (id) => setStyles(prev =>
    prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
  );

  const canGenerate = dest.trim().length > 0;

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  const inputStyle = {
    width: '100%', border: `1.5px solid ${C.borderDefault}`,
    borderRadius: 14, outline: 'none', fontFamily: C.fb,
    fontSize: 14, color: C.ink, background: C.sky,
    transition: 'border-color 150ms',
  };

  const labelStyle = {
    display: 'block', fontFamily: C.fd, fontWeight: 700, fontSize: 13,
    color: C.navy, marginBottom: 8, letterSpacing: '-0.01em',
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '40px 52px 60px', background: C.cream }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: C.fd, fontWeight: 700, fontSize: 11,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: C.ocean, marginBottom: 8,
        }}>AI TRIP PLANNER</div>
        <h1 style={{
          fontFamily: C.fd, fontWeight: 700, fontSize: 34,
          color: C.navy, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1,
        }}>Plan your perfect trip</h1>
        <p style={{ fontFamily: C.fb, fontSize: 15, color: C.fg3, marginTop: 8, lineHeight: 1.5 }}>
          Tell Voya where you want to go and we'll handle everything else.
        </p>
      </div>

      {/* Form card */}
      <div style={{
        background: '#fff', borderRadius: 24, padding: '32px 36px',
        boxShadow: '0 4px 20px rgba(12,68,124,0.07)',
        display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 680,
      }}>

        {/* From + Destination — side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* From */}
        <div>
          <label style={labelStyle}>Departing from</label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
              <Icon name="plane-takeoff" size={16} color={C.ocean} />
            </span>
            <input
              value={from}
              onChange={e => { setFrom(e.target.value); setShowFromSugg(true); }}
              onFocus={() => setShowFromSugg(true)}
              onBlur={() => setTimeout(() => setShowFromSugg(false), 150)}
              placeholder="Your city or airport"
              style={{ ...inputStyle, padding: '13px 16px 13px 42px', fontSize: 15, fontFamily: C.fd, fontWeight: 600 }}
            />
            {showFromSugg && filteredFrom.length > 0 && (
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 8px 28px rgba(12,68,124,0.14)', border: `1px solid ${C.borderSoft}` }}>
                {filteredFrom.slice(0, 6).map(d => (
                  <div key={d.code} onMouseDown={() => { setFrom(`${d.name} (${d.code})`); setShowFromSugg(false); }}
                    style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.sky}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(55,138,221,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 10, color: C.ocean }}>{d.code}</span>
                    </div>
                    <div>
                      <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 13, color: C.navy }}>{d.name}</div>
                      <div style={{ fontFamily: C.fb, fontSize: 11, color: C.fg3 }}>{d.hint}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Destination */}
        <div>
          <label style={labelStyle}>Destination</label>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                <Icon name="map-pin" size={17} color={C.ocean} />
              </span>
              <input
                value={dest}
                onChange={e => { setDest(e.target.value); setShowSugg(true); }}
                onFocus={() => setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                placeholder="Where do you want to go?"
                style={{ ...inputStyle, padding: '13px 16px 13px 42px', fontSize: 16, fontFamily: C.fd, fontWeight: 600 }}
              />
            </div>
            {showSugg && filtered.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 100,
                background: '#fff', borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 8px 28px rgba(12,68,124,0.14)',
                border: `1px solid ${C.borderSoft}`,
              }}>
                {filtered.slice(0, 6).map(d => (
                  <div
                    key={d.name}
                    onMouseDown={() => { setDest(d.name); setShowSugg(false); }}
                    style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.sky}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ fontSize: 22 }}>{d.flag}</span>
                    <div>
                      <div style={{ fontFamily: C.fd, fontWeight: 700, fontSize: 14, color: C.navy }}>{d.name}</div>
                      <div style={{ fontFamily: C.fb, fontSize: 12, color: C.fg3 }}>{d.hint}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        </div>{/* end From + Destination grid */}

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            { label: 'Start date', val: startDate, set: setStartDate },
            { label: 'End date',   val: endDate,   set: setEndDate },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label style={labelStyle}>{label}</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                  <Icon name="calendar" size={16} color={C.ocean} />
                </span>
                <input
                  type="date"
                  value={val}
                  onChange={e => set(e.target.value)}
                  style={{ ...inputStyle, padding: '12px 14px 12px 38px', cursor: 'pointer' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Budget */}
        <div>
          <label style={labelStyle}>Budget</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {BUDGET_OPTIONS.map(b => {
              const on = budget === b;
              return (
                <button key={b} onClick={() => setBudget(b)} style={{
                  padding: '8px 18px', borderRadius: 99,
                  border: `1.5px solid ${on ? C.ocean : C.borderDefault}`,
                  background: on ? 'rgba(55,138,221,0.10)' : '#fff',
                  color: on ? C.ocean : C.fg2,
                  fontFamily: C.fd, fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', transition: 'all 140ms',
                }}>{b}</button>
              );
            })}
          </div>
        </div>

        {/* Travelers */}
        <div>
          <label style={labelStyle}>Number of travelers</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center',
              border: `1.5px solid ${C.borderDefault}`, borderRadius: 14,
              overflow: 'hidden', background: C.sky,
            }}>
              <button onClick={() => setTravelers(t => Math.max(1, t - 1))} style={{
                width: 44, height: 44, border: 0, background: 'transparent', cursor: 'pointer',
                fontFamily: C.fd, fontWeight: 700, fontSize: 20, color: C.navy,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>−</button>
              <div style={{ width: 44, textAlign: 'center', fontFamily: C.fd, fontWeight: 700, fontSize: 18, color: C.navy }}>{travelers}</div>
              <button onClick={() => setTravelers(t => Math.min(20, t + 1))} style={{
                width: 44, height: 44, border: 0, background: 'transparent', cursor: 'pointer',
                fontFamily: C.fd, fontWeight: 700, fontSize: 20, color: C.navy,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>+</button>
            </div>
            <span style={{ fontFamily: C.fb, fontSize: 14, color: C.fg3 }}>
              {travelers === 1 ? '1 traveler' : `${travelers} travelers`}
            </span>
          </div>
        </div>

        {/* Travel Style */}
        <div>
          <label style={labelStyle}>Travel style <span style={{ fontWeight: 400, color: C.fg3, fontSize: 12 }}>(pick all that apply)</span></label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TRAVEL_STYLES.map(s => {
              const on = styles.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggleStyle(s.id)} style={{
                  padding: '8px 16px', borderRadius: 99,
                  border: `1.5px solid ${on ? C.ocean : C.borderDefault}`,
                  background: on ? 'rgba(55,138,221,0.10)' : '#fff',
                  color: on ? C.ocean : C.fg2,
                  fontFamily: C.fd, fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', transition: 'all 140ms',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Icon name={s.icon} size={13} color={on ? C.ocean : C.fg3} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => canGenerate && onGenerate({ dest, from, startDate, endDate, budget, travelers, styles })}
          style={{
            width: '100%', padding: '17px', borderRadius: 99, border: 0,
            cursor: canGenerate ? 'pointer' : 'not-allowed',
            background: canGenerate ? C.amber : C.borderDefault,
            color: '#fff', fontFamily: C.fd, fontWeight: 700, fontSize: 17,
            letterSpacing: '-0.01em',
            boxShadow: canGenerate ? '0 8px 28px rgba(239,159,39,0.34)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            transition: 'all 200ms',
            opacity: canGenerate ? 1 : 0.45,
          }}
        >
          <Icon name="sparkles" size={18} color="#fff" />
          Generate itinerary
          <Icon name="arrow-right" size={18} color="#fff" />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { PlanForm });
