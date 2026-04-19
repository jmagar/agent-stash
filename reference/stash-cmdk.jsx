// Agent Stash — Command Palette (⌘K)

function CommandPalette({ open, onClose, onNavigate }) {
  const [query, setQuery] = React.useState('');
  const [selected, setSelected] = React.useState(0);
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  // Static action catalog
  const actions = React.useMemo(() => [
    // Navigate
    { group: 'Navigate', label: 'Go to Overview', hint: 'Marketplace dashboard', icon: Icons.home,
      run: () => onNavigate({ tab: 'marketplace', side: 'overview' }) },
    { group: 'Navigate', label: 'Go to Feed', hint: 'Updates from things you starred', icon: Icons.activity,
      run: () => onNavigate({ tab: 'marketplace', side: 'feed' }) },
    { group: 'Navigate', label: 'Go to Marketplaces', hint: 'Browse marketplaces', icon: Icons.box,
      run: () => onNavigate({ tab: 'marketplace', side: 'marketplaces' }) },
    { group: 'Navigate', label: 'Go to Plugins', hint: 'Browse plugins', icon: Icons.puzzle,
      run: () => onNavigate({ tab: 'marketplace', side: 'plugins' }) },
    { group: 'Navigate', label: 'Go to MCP Registry', hint: 'Official MCP servers', icon: Icons.server,
      run: () => onNavigate({ tab: 'marketplace', side: 'mcp' }) },
    { group: 'Navigate', label: 'Go to My Stash', hint: 'Your local files', icon: Icons.folder,
      run: () => onNavigate({ tab: 'stash', side: 'all' }) },
    { group: 'Navigate', label: 'Agents', icon: Icons.users,
      run: () => onNavigate({ tab: 'stash', side: 'agents' }) },
    { group: 'Navigate', label: 'Skills', icon: Icons.zap,
      run: () => onNavigate({ tab: 'stash', side: 'skills' }) },
    { group: 'Navigate', label: 'Commands', icon: Icons.terminal,
      run: () => onNavigate({ tab: 'stash', side: 'commands' }) },
    { group: 'Navigate', label: 'Hooks', icon: Icons.git,
      run: () => onNavigate({ tab: 'stash', side: 'hooks' }) },
    // Actions
    { group: 'Actions', label: 'New plugin', hint: 'Scaffold a plugin', icon: Icons.plus, shortcut: 'N' },
    { group: 'Actions', label: 'New skill', icon: Icons.plus },
    { group: 'Actions', label: 'Install MCP server…', icon: Icons.download,
      run: () => onNavigate({ tab: 'marketplace', side: 'mcp' }) },
    { group: 'Actions', label: 'Open activity panel', icon: Icons.terminal, shortcut: '\\' },
    { group: 'Actions', label: 'Toggle theme', icon: Icons.settings },
    // MCP servers (mock quick-jump)
    ...(window.MCP_SERVERS || []).slice(0, 6).map(entry => ({
      group: 'MCP Servers', label: entry.server.title, hint: entry.server.name, icon: Icons.server,
      run: () => onNavigate({ tab: 'marketplace', side: 'mcp', mcpName: entry.server.name }),
    })),
    // Plugins (hardcoded jump targets)
    { group: 'Plugins', label: 'plex-deployer', hint: 'homelab-tools', icon: Icons.puzzle,
      run: () => onNavigate({ tab: 'marketplace', side: 'plugins', pluginId: 'plex-deployer' }) },
    { group: 'Plugins', label: 'nginx-config-manager', hint: 'homelab-tools', icon: Icons.puzzle,
      run: () => onNavigate({ tab: 'marketplace', side: 'plugins', pluginId: 'nginx-config' }) },
    { group: 'Plugins', label: 'unraid-maintenance', hint: 'homelab-tools', icon: Icons.puzzle,
      run: () => onNavigate({ tab: 'marketplace', side: 'plugins', pluginId: 'unraid-maint' }) },
  ], [onNavigate]);

  const q = query.toLowerCase().trim();
  const filtered = q
    ? actions.filter(a =>
        a.label.toLowerCase().includes(q) ||
        (a.hint || '').toLowerCase().includes(q) ||
        a.group.toLowerCase().includes(q))
    : actions;

  // group into sections preserving order
  const sections = [];
  const seen = new Map();
  filtered.forEach(a => {
    if (!seen.has(a.group)) { seen.set(a.group, sections.length); sections.push({ group: a.group, items: [] }); }
    sections[seen.get(a.group)].items.push(a);
  });
  const flat = filtered;

  const run = (a) => { if (a && a.run) a.run(); onClose(); };

  const onKey = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(flat.length - 1, s + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(0, s - 1)); }
    if (e.key === 'Enter') { e.preventDefault(); run(flat[selected]); }
  };

  React.useEffect(() => { setSelected(0); }, [query]);

  if (!open) return null;

  let idx = -1;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(12, 17, 40, 0.35)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '12vh',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 620, maxWidth: '90vw', maxHeight: '70vh',
        background: T.bg, borderRadius: 12,
        boxShadow: T.shadow4,
        border: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
          {Icons.search({ size: 16, color: T.textMuted })}
          <input ref={inputRef} placeholder="Search commands, pages, plugins, MCP servers…"
            value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKey}
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'none',
              fontSize: 15, fontFamily: T.font, color: T.text,
            }} />
          <kbd style={{
            fontSize: 10, color: T.textMuted, padding: '2px 6px',
            border: `1px solid ${T.border}`, borderRadius: 4,
            fontFamily: T.mono,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflow: 'auto', padding: '6px 0' }}>
          {flat.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: 13 }}>
              No results for "{query}"
            </div>
          )}
          {sections.map(section => (
            <div key={section.group}>
              <div style={{
                padding: '8px 16px 4px', fontSize: 10, fontWeight: 600,
                color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.7,
              }}>{section.group}</div>
              {section.items.map(a => {
                idx++;
                const isSel = idx === selected;
                const myIdx = idx;
                return (
                  <div key={section.group + a.label} onClick={() => run(a)}
                    onMouseEnter={() => setSelected(myIdx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 16px', cursor: 'pointer',
                      background: isSel ? T.accentMuted : 'transparent',
                      borderLeft: `2px solid ${isSel ? T.accent : 'transparent'}`,
                    }}>
                    <div style={{ color: isSel ? T.accent : T.textMuted, display: 'flex' }}>
                      {a.icon && a.icon({ size: 15, color: isSel ? T.accent : T.textMuted })}
                    </div>
                    <span style={{ fontSize: 13, color: T.text, flex: 1, fontWeight: isSel ? 500 : 400 }}>{a.label}</span>
                    {a.hint && (
                      <span style={{ fontSize: 12, color: T.textMuted,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        maxWidth: 220 }}>{a.hint}</span>
                    )}
                    {a.shortcut && (
                      <kbd style={{
                        fontSize: 10, color: T.textMuted, padding: '1px 5px',
                        border: `1px solid ${T.border}`, borderRadius: 3,
                        fontFamily: T.mono,
                      }}>⌘{a.shortcut}</kbd>
                    )}
                    {isSel && <span style={{ fontSize: 11, color: T.textMuted }}>↵</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 14px', borderTop: `1px solid ${T.border}`,
          display: 'flex', gap: 14, fontSize: 11, color: T.textMuted,
          background: T.surface,
        }}>
          <span>
            <kbd style={kbdStyle()}>↑</kbd> <kbd style={kbdStyle()}>↓</kbd> Navigate
          </span>
          <span><kbd style={kbdStyle()}>↵</kbd> Select</span>
          <span style={{ marginLeft: 'auto' }}>
            {flat.length} {flat.length === 1 ? 'result' : 'results'}
          </span>
        </div>
      </div>
    </div>
  );
}

function kbdStyle() {
  return {
    fontSize: 10, color: T.textMuted, padding: '1px 5px',
    border: `1px solid ${T.border}`, borderRadius: 3,
    fontFamily: T.mono, background: T.bg,
  };
}

Object.assign(window, { CommandPalette });
