// Agent Stash — App Shell v6 (Unified 12-item Sidebar)

function AppShell() {
  const { loading: localLoading } = useLocalData();
  const [sideItem, setSideItem] = React.useState('hub');
  const [cliOpen, setCliOpen] = React.useState(false);
  const [artifactDetail, setArtifactDetail] = React.useState(null);
  const [artifactPath, setArtifactPath] = React.useState(null);
  const [artifactType, setArtifactType] = React.useState(null);
  const [cmdkOpen, setCmdkOpen] = React.useState(false);

  const openArtifact = (a, p) => { setArtifactDetail(a); setArtifactPath(p); };
  const closeArtifact = () => { setArtifactDetail(null); setArtifactPath(null); };

  const handleSideNav = (id) => {
    if (id !== sideItem) setArtifactType(null);
    setSideItem(id);
    setArtifactDetail(null);
    setArtifactPath(null);
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdkOpen(o => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault();
        setCliOpen(o => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handlePaletteNav = ({ side }) => {
    if (side) handleSideNav(side);
    closeArtifact();
  };

  const navItems = [
    { id: 'hub',       label: 'Hub',       icon: 'home' },
    { id: 'feed',      label: 'Feed',      icon: 'activity' },
    { id: 'artifacts', label: 'Artifacts', icon: 'layers' },
    { id: 'projects',  label: 'Projects',  icon: 'folder' },
    { id: 'bazaar',    label: 'Bazaar',    icon: 'bazaar' },
    { id: 'drafts',    label: 'Drafts',    icon: 'draft' },
    { id: 'ideas',     label: 'Ideas',     icon: 'idea' },
    { id: 'creator',   label: 'Creator',   icon: 'code' },
    { id: 'notes',     label: 'Notes',     icon: 'book' },
    { id: 'todos',     label: 'TODOs',     icon: 'check' },
    { id: 'beads',     label: 'Beads',     icon: 'hash' },
    { id: 'bundles',   label: 'Bundles',   icon: 'package' },
  ];

  const renderMainContent = () => {
    if (artifactDetail) {
      return <ArtifactDetail artifact={artifactDetail} path={artifactPath} onBack={closeArtifact} />;
    }
    switch (sideItem) {
      case 'hub':       return <MarketplaceOverview onNav={handleSideNav} />;
      case 'feed':      return <MarketplaceFeed />;
      case 'artifacts':
        if (artifactType) {
          return <ArtifactPage key={localLoading ? 'loading' : 'loaded'} type={artifactType} onOpenArtifact={openArtifact}
            onBack={() => setArtifactType(null)} />;
        }
        return <ArtifactsHub onSelectType={setArtifactType} />;
      case 'projects':  return <StashBrowser onOpenArtifact={openArtifact} />;
      case 'bazaar':    return <Bazaar />;
      case 'drafts':    return <EmptySection icon="draft"   label="Drafts"
        desc="Save works-in-progress before they're ready to share." />;
      case 'ideas':     return <EmptySection icon="idea"    label="Ideas"
        desc="Capture raw ideas and concepts to explore later." />;
      case 'creator':   return <EmptySection icon="code"    label="Creator"
        desc="Build and publish your own agents, skills, and commands." />;
      case 'notes':     return <EmptySection icon="book"    label="Notes"
        desc="Long-form notes, documentation, and reference material." />;
      case 'todos':     return <EmptySection icon="check"   label="TODOs"
        desc="Track tasks and action items across your projects." />;
      case 'beads':     return <EmptySection icon="hash"    label="Beads"
        desc="Structured data and configurations for your workflows." />;
      case 'bundles':   return <EmptySection icon="package" label="Bundles"
        desc="Packaged collections of agents, skills, and tools." />;
      default:          return <EmptySection icon="home" label={sideItem} desc="Coming soon." />;
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      background: T.bg, color: T.text, fontFamily: T.font, overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', height: 52, padding: '0 16px',
        background: T.surface, flexShrink: 0, gap: 12,
        borderBottom: `1px solid ${T.border}`,
        zIndex: 10, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginRight: 8, cursor: 'pointer' }}
          onClick={() => handleSideNav('hub')}>
          <StashLogo size={26} />
          <span style={{ fontSize: 15, fontWeight: 600, color: T.text, letterSpacing: -0.3 }}>Stash</span>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
          <button onClick={() => setCmdkOpen(true)} style={{
            width: '100%', maxWidth: 440,
            display: 'flex', alignItems: 'center', gap: 8,
            background: T.surfaceRaised, border: `1px solid ${T.border}`,
            borderRadius: T.radius, padding: '7px 11px',
            cursor: 'pointer', fontFamily: T.font,
            boxShadow: T.shadow1, transition: 'all 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.surfaceHover; e.currentTarget.style.borderColor = T.borderLight; }}
          onMouseLeave={e => { e.currentTarget.style.background = T.surfaceRaised; e.currentTarget.style.borderColor = T.border; }}>
            {Icons.search({ size: 14, color: T.textMuted })}
            <span style={{ fontSize: 13, color: T.textMuted, flex: 1, textAlign: 'left' }}>
              Search everything...
            </span>
            <kbd style={{
              fontSize: 10, color: T.textMuted, padding: '1px 5px',
              border: `1px solid ${T.border}`, borderRadius: 3, fontFamily: T.mono,
              background: T.bg,
            }}>⌘K</kbd>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <LocalDataStatus />
          <Btn size="sm" variant="ghost" icon={Icons.bell({ size: 14 })} style={{ padding: '6px 9px' }}>
            <span style={{
              position: 'absolute', width: 6, height: 6, borderRadius: 3,
              background: T.red, marginLeft: -8, marginTop: -9,
            }} />
          </Btn>
          <Btn size="sm" variant={cliOpen ? 'default' : 'ghost'} onClick={() => setCliOpen(!cliOpen)}
            icon={Icons.terminal({ size: 14 })}
            style={cliOpen ? { borderColor: T.accent + '66', color: T.accentText } : {}}>
            Activity
          </Btn>
          <Avatar name="jmagar" size={28} />
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{
          width: 208, flexShrink: 0, background: T.surface,
          borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ flex: 1, padding: '10px 8px', overflow: 'auto' }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: T.textMuted,
              textTransform: 'uppercase', letterSpacing: 0.7,
              padding: '0 10px 6px',
            }}>Navigation</div>
            {navItems.map(item => (
              <SideNavItem key={item.id} item={item}
                active={sideItem === item.id} onClick={() => handleSideNav(item.id)} />
            ))}
          </div>
          <div style={{ padding: '8px 8px', borderTop: `1px solid ${T.border}` }}>
            <button style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: 9, padding: '7px 10px', fontSize: 13, fontFamily: T.font,
              background: 'transparent', color: T.textMuted,
              border: 'none', borderRadius: T.radiusSm, cursor: 'pointer',
            }}>
              {Icons.settings({ size: 14 })} Settings
            </button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: T.surface }}>
          <div style={{ flex: 1, overflow: 'auto', background: T.bg }}>
            <ErrorBoundary key={sideItem + artifactType}>
              {renderMainContent()}
            </ErrorBoundary>
          </div>
          <AgentCLI isOpen={cliOpen} onToggle={() => setCliOpen(false)} />
        </div>
      </div>

      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} onNavigate={handlePaletteNav} />
    </div>
  );
}

function EmptySection({ icon, label, desc }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100%', gap: 12, color: T.textMuted, padding: 40,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: T.surfaceRaised, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {Icons[icon] ? Icons[icon]({ size: 24, color: T.textMuted }) : null}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.textSecondary, marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 13, color: T.textMuted, maxWidth: 280, lineHeight: 1.55 }}>{desc}</div>
      </div>
      <Badge color={T.textMuted}>Coming soon</Badge>
    </div>
  );
}

function ArtifactsHub({ onSelectType }) {
  const types = [
    { id: 'agents',   label: 'Agents',   icon: 'users',    color: T.accent,  desc: 'Autonomous agents and assistants' },
    { id: 'skills',   label: 'Skills',   icon: 'zap',      color: T.green,   desc: 'Reusable capabilities and workflows' },
    { id: 'commands', label: 'Commands', icon: 'terminal', color: T.orange,  desc: 'Slash commands and shortcuts' },
    { id: 'hooks',    label: 'Hooks',    icon: 'git',      color: T.purple,  desc: 'Event handlers and triggers' },
    { id: 'sessions', label: 'Sessions', icon: 'clock',    color: T.teal,    desc: 'Conversation history and context' },
    { id: 'scripts',  label: 'Scripts',  icon: 'code',     color: T.pink,    desc: 'Automation scripts and utilities' },
  ];

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: T.text, marginBottom: 4 }}>Artifacts</div>
        <div style={{ fontSize: 13, color: T.textMuted }}>
          Browse and manage your agents, skills, commands, and more.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {types.map(type => (
          <Card key={type.id} hoverable onClick={() => onSelectType(type.id)} style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: type.color + '1f',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {Icons[type.icon]({ size: 16, color: type.color })}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{type.label}</div>
            </div>
            <div style={{ fontSize: 12, color: T.textMuted }}>{type.desc}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SideNavItem({ item, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  const bg = active ? T.surfaceRaised : (hover ? T.surfaceHover : 'transparent');
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        gap: 9, padding: '7px 10px 7px 8px',
        fontSize: 13, fontFamily: T.font, fontWeight: active ? 500 : 400,
        background: bg,
        color: active ? T.text : T.textSecondary,
        border: 'none', borderRadius: T.radiusSm, cursor: 'pointer',
        marginBottom: 1, transition: 'all 0.08s',
        boxShadow: active ? T.shadow1 : 'none',
        borderLeft: active ? `2px solid ${T.accent}` : '2px solid transparent',
      }}>
      {Icons[item.icon] && Icons[item.icon]({ size: 14, color: active ? T.accentText : T.textMuted })}
      <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
    </button>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: '#f87171', fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>React Error</div>
          {String(this.state.error)}
          {'\n\n'}
          {this.state.error?.stack}
        </div>
      );
    }
    return this.props.children;
  }
}

Object.assign(window, { AppShell, SideNavItem, EmptySection, ArtifactsHub, ErrorBoundary });
