// Agent Stash — Stash Browser (minimal, search-first)

function StashBrowser({ onOpenArtifact }) {
  const [query, setQuery] = React.useState('');
  const searchRef = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') searchRef.current?.blur();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const recent = [
    { name: '2026-04-17-jellyfin-docker-deploy.md', type: 'sessions', author: 'claude-code', modified: '30m ago', action: 'created' },
    { name: 'homelab-ops.md', type: 'agents', author: 'jmagar', modified: '1h ago', action: 'v14' },
    { name: 'docker-compose-gen/', type: 'skills', author: 'claude-code', modified: '2h ago', action: 'updated' },
    { name: 'hooks.json', type: 'hooks', author: 'jmagar', modified: '4h ago', action: 'v11' },
    { name: 'deploy.md', type: 'commands', author: 'claude-code', modified: '1d ago', action: 'v8' },
    { name: 'deployment-checklist.md', type: 'plans', author: 'jmagar', modified: '2h ago', action: 'v3' },
    { name: 'security-reviewer.md', type: 'agents', author: 'jmagar', modified: '2d ago', action: 'v7' },
    { name: 'ssl-cert-renewal/', type: 'skills', author: 'jmagar', modified: '1d ago', action: 'v3' },
  ];

  const pinned = [
    { name: 'homelab-ops.md', type: 'agents', subtitle: 'unRAID management' },
    { name: 'deployment-checklist.md', type: 'plans', subtitle: 'plans/' },
    { name: 'docker-compose-gen/', type: 'skills', subtitle: 'AI compose generator' },
    { name: 'hooks.json', type: 'hooks', subtitle: 'core automation' },
  ];

  const typeLabel = { agents: 'Agent', skills: 'Skill', commands: 'Command', hooks: 'Hook',
    sessions: 'Session', scripts: 'Script', plans: 'Plan', docs: 'Doc' };

  // Flat search corpus
  const corpus = [...recent, ...pinned.map(p => ({ ...p, modified: '', author: '', action: '' }))];
  const results = query.trim() ? corpus.filter(i =>
    i.name.toLowerCase().includes(query.toLowerCase()) ||
    i.type.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8) : [];

  const ItemRow = ({ item, compact }) => (
    <div onClick={() => onOpenArtifact && onOpenArtifact(item, ['stash', item.type])}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: compact ? '8px 10px' : '10px 12px',
        cursor: 'pointer', borderRadius: 6, transition: 'background 0.08s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = T.surfaceHover}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      {Icons.file({ size: 14, color: T.textMuted })}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: T.text, fontWeight: 500, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>
          {item.subtitle || `${typeLabel[item.type] || item.type}${item.author ? ' · ' + item.author : ''}${item.action ? ' · ' + item.action : ''}`}
        </div>
      </div>
      {item.modified && <span style={{ fontSize: 11, color: T.textMuted, flexShrink: 0 }}>{item.modified}</span>}
    </div>
  );

  return (
    <div style={{ padding: '60px 32px 40px', maxWidth: 720, margin: '0 auto' }}>
      {/* Hero search */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{
          fontSize: 26, fontWeight: 600, color: T.text, textAlign: 'center',
          marginBottom: 20, letterSpacing: -0.5,
        }}>Your stash</h1>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: T.bg, border: `1px solid ${T.border}`,
          borderRadius: 10, padding: '12px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {Icons.search({ size: 18, color: T.textMuted })}
          <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search files, agents, sessions, or paste a stash:// link"
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              color: T.text, fontSize: 15, fontFamily: T.font,
            }} />
          <span style={{
            fontSize: 11, color: T.textMuted, fontFamily: T.mono,
            padding: '2px 6px', border: `1px solid ${T.border}`, borderRadius: 4,
          }}>⌘K</span>
        </div>

        {/* Search results dropdown */}
        {results.length > 0 && (
          <div style={{
            marginTop: 8, padding: 6,
            border: `1px solid ${T.border}`, borderRadius: 8, background: T.bg,
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}>
            {results.map(r => <ItemRow key={r.name} item={r} compact />)}
          </div>
        )}
      </div>

      {!query && (
        <>
          {/* Pinned */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase',
              letterSpacing: 0.6, marginBottom: 8, paddingLeft: 12 }}>Pinned</div>
            <div>
              {pinned.map(p => <ItemRow key={p.name} item={p} />)}
            </div>
          </div>

          {/* Recent */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.textMuted, textTransform: 'uppercase',
              letterSpacing: 0.6, marginBottom: 8, paddingLeft: 12 }}>Recent</div>
            <div>
              {recent.map(r => <ItemRow key={r.name + r.modified} item={r} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { StashBrowser });
