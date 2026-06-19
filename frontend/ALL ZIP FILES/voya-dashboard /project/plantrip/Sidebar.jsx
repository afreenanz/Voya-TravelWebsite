// plantrip/Sidebar.jsx
const { useEffect } = React;

function PTSidebar({ activeView, onSetView }) {
  const userName = localStorage.getItem('voya_user_name')
    || localStorage.getItem('voya_user_email')?.split('@')[0]
    || 'Traveler';
  const items = [
    { id: 'home',    icon: 'compass',       label: 'Home' },
    { id: 'plan',    icon: 'map-pin-plus',  label: 'Plan a trip' },
    { id: 'trips',   icon: 'map',           label: 'My Trips', badge: 4 },
    { id: 'explore', icon: 'globe-2',       label: 'Explore' },
    { id: 'profile', icon: 'user-round',    label: 'Profile' },
  ];

  const activeId =
    (activeView === 'trips' || activeView === 'tripDetail') ? 'trips' :
    (activeView === 'form' || activeView === 'loading' || activeView === 'itinerary') ? 'plan' :
    'home';

  const handleClick = (id) => {
    if (id === 'home') {
      window.location.href = 'Voya Dashboard.html';
    } else if (id === 'explore') {
      window.location.href = 'explore.html';
    } else if (id === 'profile') {
      window.location.href = 'profile.html';
    } else if (id === 'plan') {
      onSetView('form');
    } else if (id === 'trips') {
      onSetView('trips');
    }
  };

  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  return (
    <aside style={{
      width: 245, flexShrink: 0, background: '#fff', height: '100vh',
      borderRight: `1px solid ${C.borderSoft}`,
      display: 'flex', flexDirection: 'column', padding: '24px 16px',
      position: 'sticky', top: 0,
    }}>
      <div style={{ padding: '2px 6px 28px' }}>
        <img
          src="assets/voya-logo-light.png"
          alt="voya"
          onClick={() => window.location.href = 'Voya Dashboard.html'}
          style={{ height: 28, objectFit: 'contain', objectPosition: 'left', cursor: 'pointer' }}
        />
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(item => {
          const on = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 12, border: 0,
                textAlign: 'left', cursor: 'pointer',
                background: on ? 'rgba(55,138,221,0.12)' : 'transparent',
                color: on ? C.ocean : C.fg3,
                fontFamily: C.fb, fontWeight: on ? 600 : 500, fontSize: 14.5,
                transition: 'background 140ms, color 140ms',
              }}
            >
              <Icon name={item.icon} size={19} color={on ? C.ocean : C.fg3} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  background: on ? C.ocean : C.amber, color: '#fff',
                  fontFamily: C.fd, fontWeight: 700, fontSize: 11,
                  padding: '1px 7px', borderRadius: 99,
                }}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{ height: 1, background: C.borderSoft, margin: '12px 0 14px' }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: 12, background: C.sky, borderRadius: 14,
      }}>
        <VAvatar name={userName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: C.fd, fontWeight: 700, fontSize: 13.5, color: C.navy,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{userName}</div>
          <div style={{ fontFamily: C.fb, fontSize: 11, color: C.ocean, fontWeight: 600 }}>Pro Plan ✦</div>
        </div>
        <button style={{
          width: 28, height: 28, borderRadius: 8, border: 0,
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="settings" size={15} color={C.fg3} />
        </button>
      </div>
    </aside>
  );
}

Object.assign(window, { PTSidebar });
