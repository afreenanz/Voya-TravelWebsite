// plantrip/Sidebar.jsx — Plan page uses the shared sidebar; "Plan a trip" and
// "My Trips" switch views in-page instead of reloading.
function PTSidebar({ activeView, onSetView }) {
  const active = (activeView === 'trips' || activeView === 'tripDetail') ? 'trips' : 'plan';
  return (
    <VSidebar active={active} onNav={(id) => {
      if (id === 'plan')  { onSetView('form');  return true; }
      if (id === 'trips') { onSetView('trips'); return true; }
      return false;
    }} />
  );
}

Object.assign(window, { PTSidebar });
