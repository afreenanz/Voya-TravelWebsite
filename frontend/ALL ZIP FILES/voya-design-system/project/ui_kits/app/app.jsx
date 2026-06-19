// app.jsx — Voya mobile app shell. Mounts the active screen + tab bar inside an IOSDevice.
function VoyaApp() {
  // Screens: home | search | trip | live | profile
  const [screen, setScreen] = React.useState('home');
  // tab state mirrors screen for bottom-tab cases
  const tabFor = { home: 'home', search: 'home', trip: 'trips', live: 'live', profile: 'profile' };
  const activeTab = tabFor[screen] || 'home';

  function go(s) { setScreen(s); }

  function onTab(t) {
    if (t === 'home')    go('home');
    if (t === 'trips')   go('trip');
    if (t === 'live')    go('live');
    if (t === 'profile') go('profile');
  }

  let content = null;
  if (screen === 'home') {
    content = <HomeScreen onSearch={() => go('search')} onOpenTrip={() => go('trip')} />;
  } else if (screen === 'search') {
    content = <SearchScreen onBack={() => go('home')} onPlan={() => go('trip')} />;
  } else if (screen === 'trip') {
    content = <TripScreen onBack={() => go('home')} />;
  } else if (screen === 'live') {
    content = <LiveScreen onBack={() => go('home')} />;
  } else if (screen === 'profile') {
    content = <ProfileScreen />;
  }

  // re-init lucide on every screen change
  React.useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [screen]);

  // For the home screen, render a custom greeting header offset so it doesn't crash into status bar
  const showHeaderSpacer = screen === 'home' || screen === 'profile';

  return (
    <IOSDevice width={402} height={874} dark={false}>
      <div style={{
        height: '100%', width: '100%', background: voyaColors.cream,
        overflow: 'auto', WebkitOverflowScrolling: 'touch',
        paddingTop: showHeaderSpacer ? 70 : 56,
      }}
      key={screen}>
        {content}
      </div>
      <VoyaTabBar active={activeTab} onTab={onTab} />
    </IOSDevice>
  );
}

window.VoyaApp = VoyaApp;
