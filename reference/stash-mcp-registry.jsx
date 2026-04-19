// Agent Stash — MCP Registry (matches official MCP Registry API schema)

const MCP_SERVERS = [
  {
    server: {
      name: 'io.github.modelcontextprotocol/filesystem',
      title: 'Filesystem',
      description: 'Secure file operations with configurable access controls for MCP clients',
      version: '1.4.2',
      websiteUrl: 'https://modelcontextprotocol.io/servers/filesystem',
      repository: { url: 'https://github.com/modelcontextprotocol/servers', source: 'github', subfolder: 'src/filesystem' },
      _meta: { official: true },
    },
    stars: 2341, installs: 18234, installed: true, tags: ['files', 'official'],
    author: 'modelcontextprotocol', updated: '2d ago',
  },
  {
    server: {
      name: 'io.github.modelcontextprotocol/github',
      title: 'GitHub',
      description: 'Access GitHub repositories, issues, pull requests, and perform common workflow operations',
      version: '2.1.0',
      websiteUrl: 'https://modelcontextprotocol.io/servers/github',
      repository: { url: 'https://github.com/modelcontextprotocol/servers', source: 'github' },
      _meta: { official: true },
    },
    stars: 1892, installs: 14120, installed: true, tags: ['github', 'vcs', 'official'],
    author: 'modelcontextprotocol', updated: '4d ago',
  },
  {
    server: {
      name: 'io.github.modelcontextprotocol/postgres',
      title: 'Postgres',
      description: 'Read-only access to PostgreSQL databases. Runs queries and inspects schemas',
      version: '0.9.4',
      repository: { url: 'https://github.com/modelcontextprotocol/servers', source: 'github' },
      _meta: { official: true },
    },
    stars: 1203, installs: 8903, installed: false, tags: ['database', 'sql', 'official'],
    author: 'modelcontextprotocol', updated: '1w ago',
  },
  {
    server: {
      name: 'io.github.modelcontextprotocol/slack',
      title: 'Slack',
      description: 'Send messages, read channels, and manage Slack workspace via MCP',
      version: '1.2.0',
      repository: { url: 'https://github.com/modelcontextprotocol/servers', source: 'github' },
      _meta: { official: true },
    },
    stars: 987, installs: 7423, installed: false, tags: ['slack', 'chat', 'official'],
    author: 'modelcontextprotocol', updated: '2w ago',
  },
  {
    server: {
      name: 'io.github.jmagar/unraid-mcp',
      title: 'unRAID',
      description: 'Query and manage unRAID server — arrays, Docker containers, VMs, system status',
      version: '0.4.1',
      repository: { url: 'https://github.com/jmagar/unraid-mcp', source: 'github' },
    },
    stars: 142, installs: 834, installed: true, tags: ['homelab', 'unraid', 'docker'],
    author: 'jmagar', updated: '1d ago',
  },
  {
    server: {
      name: 'io.github.domdomegg/airtable-mcp-server',
      title: 'Airtable',
      description: 'Read and write data in Airtable bases, query records, manage schemas',
      version: '1.7.2',
      repository: { url: 'https://github.com/domdomegg/airtable-mcp-server', source: 'github' },
    },
    stars: 423, installs: 3021, installed: false, tags: ['airtable', 'database'],
    author: 'domdomegg', updated: '3d ago',
  },
  {
    server: {
      name: 'io.github.sooperset/mcp-atlassian',
      title: 'Atlassian',
      description: 'Comprehensive Jira and Confluence integration with search, CRUD, and workflow automation',
      version: '2.3.0',
      repository: { url: 'https://github.com/sooperset/mcp-atlassian', source: 'github' },
    },
    stars: 612, installs: 4230, installed: false, tags: ['atlassian', 'jira', 'confluence'],
    author: 'sooperset', updated: '5d ago',
  },
  {
    server: {
      name: 'io.github.zcaceres/fetch-mcp',
      title: 'Fetch',
      description: 'Fetch and extract content from URLs — HTML, JSON, markdown conversion, screenshots',
      version: '0.8.3',
      repository: { url: 'https://github.com/zcaceres/fetch-mcp', source: 'github' },
    },
    stars: 891, installs: 6234, installed: true, tags: ['web', 'fetch', 'scraping'],
    author: 'zcaceres', updated: '6d ago',
  },
  {
    server: {
      name: 'io.github.tailscale/tailscale-mcp',
      title: 'Tailscale',
      description: 'Manage Tailscale networks, ACLs, devices, and subnet routers through MCP',
      version: '0.3.0',
      repository: { url: 'https://github.com/tailscale/tailscale-mcp', source: 'github' },
    },
    stars: 234, installs: 1453, installed: false, tags: ['networking', 'vpn'],
    author: 'tailscale', updated: '1w ago',
  },
  {
    server: {
      name: 'io.github.browserbase/mcp-server-browserbase',
      title: 'Browserbase',
      description: 'Automate browsers in the cloud — navigate, fill forms, extract data, take screenshots',
      version: '1.1.0',
      repository: { url: 'https://github.com/browserbase/mcp-server-browserbase', source: 'github' },
    },
    stars: 1502, installs: 9123, installed: false, tags: ['browser', 'automation'],
    author: 'browserbase', updated: '3d ago',
  },
  {
    server: {
      name: 'io.github.upstash/context7-mcp',
      title: 'Context7',
      description: 'Up-to-date library docs for LLMs — fetches code examples directly from source repos',
      version: '1.0.4',
      repository: { url: 'https://github.com/upstash/context7', source: 'github' },
    },
    stars: 2103, installs: 15892, installed: true, tags: ['docs', 'context'],
    author: 'upstash', updated: '2d ago',
  },
  {
    server: {
      name: 'io.github.exa-labs/exa-mcp-server',
      title: 'Exa Search',
      description: 'Neural web search and content retrieval via Exa API — semantic search, similar links',
      version: '0.5.2',
      repository: { url: 'https://github.com/exa-labs/exa-mcp-server', source: 'github' },
    },
    stars: 678, installs: 4893, installed: false, tags: ['search', 'web', 'ai'],
    author: 'exa-labs', updated: '5d ago',
  },
];


async function fetchLiveMCPServers() {
  const res = await fetch('/api/mcp-registry', {
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const raw = data.servers || [];
  if (!raw.length) throw new Error('Empty response');
  return raw;
}

function MCPRegistry() {
  const [servers, setServers] = React.useState(MCP_SERVERS);
  const [dataSource, setDataSource] = React.useState('loading'); // 'loading' | 'live' | 'cached'
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('popular');
  const [activeTag, setActiveTag] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [limit, setLimit] = React.useState(50);

  React.useEffect(() => {
    let mounted = true;
    fetchLiveMCPServers()
      .then(live => { if (mounted) { setServers(live); setDataSource('live'); } })
      .catch(() => { if (mounted) setDataSource('cached'); });
    return () => { mounted = false; };
  }, []);

  // Reset pagination when query/sort/tag changes
  React.useEffect(() => { setLimit(50); }, [query, sort, activeTag]);

  const allTags = React.useMemo(
    () => Array.from(new Set(servers.flatMap(s => s.tags))).sort(),
    [servers]
  );

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    let result = servers.filter(s => {
      if (q && !(
        (s.server.title || '').toLowerCase().includes(q) ||
        (s.server.description || '').toLowerCase().includes(q) ||
        (s.server.name || '').toLowerCase().includes(q)
      )) return false;
      if (activeTag && !s.tags.includes(activeTag)) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (sort === 'popular') return b.installs - a.installs;
      if (sort === 'stars') return b.stars - a.stars;
      if (sort === 'name') return (a.server.title || '').localeCompare(b.server.title || '');
      return 0;
    });
  }, [servers, query, sort, activeTag]);

  if (selected) return <MCPDetail entry={selected} onBack={() => setSelected(null)} />;

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1080, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>MCP Registry</h1>
          {dataSource === 'loading' && (
            <span style={{ fontSize: 11, color: T.textMuted, padding: '2px 7px', borderRadius: 3,
              background: T.surfaceRaised, border: `1px solid ${T.border}` }}>
              Fetching live data…
            </span>
          )}
          {dataSource === 'live' && (
            <span style={{ fontSize: 11, color: T.green, padding: '2px 7px', borderRadius: 3,
              background: T.greenMuted, border: `1px solid ${T.green}44`,
              display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {Icons.check({ size: 10, color: T.green })} Live
            </span>
          )}
          {dataSource === 'cached' && (
            <span style={{ fontSize: 11, color: T.textMuted, padding: '2px 7px', borderRadius: 3,
              background: T.surfaceRaised, border: `1px solid ${T.border}` }}
              title="CORS blocked — showing cached data">
              Cached
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: T.textSecondary, margin: 0 }}>
          Browse, install, and manage MCP servers from the official registry.
        </p>
      </div>

      {/* Search + filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <Input placeholder="Search MCP servers..." value={query} onChange={e => setQuery(e.target.value)}
          icon={Icons.search({ size: 14, color: T.textMuted })} style={{ flex: 1 }} />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          fontFamily: T.font, fontSize: 13, padding: '7px 11px',
          border: `1px solid ${T.border}`, borderRadius: T.radius,
          background: T.bg, color: T.textSecondary, boxShadow: T.shadow1,
        }}>
          <option value="popular">Most installed</option>
          <option value="stars">Most stars</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Tag filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
        <button onClick={() => setActiveTag(null)} style={{
          fontSize: 12, padding: '4px 10px', borderRadius: 999,
          border: `1px solid ${!activeTag ? T.accent : T.border}`,
          background: !activeTag ? T.accent : T.bg, color: !activeTag ? '#fff' : T.textSecondary,
          cursor: 'pointer', fontFamily: T.font,
        }}>All</button>
        {allTags.map(t => {
          const active = activeTag === t;
          return (
            <button key={t} onClick={() => setActiveTag(active ? null : t)} style={{
              fontSize: 12, padding: '4px 10px', borderRadius: 999,
              border: `1px solid ${active ? T.accent : T.border}`,
              background: active ? T.accent : T.bg, color: active ? '#fff' : T.textSecondary,
              cursor: 'pointer', fontFamily: T.font,
            }}>#{t}</button>
          );
        })}
      </div>

      {/* Stats row */}
      <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>
        {filtered.length} server{filtered.length !== 1 ? 's' : ''}
        {activeTag && <> tagged <strong style={{ color: T.textSecondary }}>#{activeTag}</strong></>}
        {query && <> matching <strong style={{ color: T.textSecondary }}>"{query}"</strong></>}
      </div>

      {/* Results grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
        {filtered.slice(0, limit).map(entry => {
          const s = entry.server;
          const isOfficial = s._meta?.official;
          return (
            <Card key={s.name} hoverable onClick={() => setSelected(entry)} style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.indigo})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 16, fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
                }}>
                  {(s.title || s.name.split('/').pop() || '?')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>
                      {s.title || s.name.split('/').pop()}
                    </h3>
                    {isOfficial && (
                      <span style={{
                        fontSize: 10, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                        background: T.accentMuted, color: T.accent,
                      }}>OFFICIAL</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted, fontFamily: T.mono,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.name}
                  </div>
                </div>
                {entry.installed && (
                  <span style={{
                    fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: 600,
                    background: T.greenMuted, color: T.green, flexShrink: 0,
                  }}>INSTALLED</span>
                )}
              </div>
              <p style={{
                fontSize: 13, color: T.textSecondary, margin: '0 0 12px', lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>{s.description}</p>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 11, color: T.textMuted,
                paddingTop: 10, borderTop: `1px solid ${T.border}`,
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {Icons.star({ size: 11, color: T.amber })} {(entry.stars || 0).toLocaleString()}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    {Icons.download({ size: 11 })} {(entry.installs || 0).toLocaleString()}
                  </span>
                  <span>v{s.version}</span>
                </div>
                <span>{entry.updated}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: T.textMuted, fontSize: 14 }}>
          No MCP servers match your search.
        </div>
      )}

      {filtered.length > limit && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => setLimit(l => l + 50)} style={{
            fontFamily: T.font, fontSize: 13, padding: '8px 20px',
            border: `1px solid ${T.border}`, borderRadius: T.radius,
            background: T.surfaceRaised, color: T.textSecondary, cursor: 'pointer',
          }}>
            Load more ({filtered.length - limit} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

function MCPDetail({ entry, onBack }) {
  const s = entry.server;
  const [tab, setTab] = React.useState('readme');
  const isOfficial = s._meta?.official;

  const serverKey = s.name.split('/').pop();
  const configJSON = `{
  "mcpServers": {
    "${serverKey}": {
      "command": "npx",
      "args": ["-y", "${s.name}@${s.version}"],
      "env": {
        "API_KEY": "your-api-key-here"
      }
    }
  }
}`;

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1080, margin: '0 auto' }}>
      <div onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20,
        cursor: 'pointer', color: T.textMuted, fontSize: 13,
      }}>
        {Icons.chevLeft({ size: 14 })} MCP Registry
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.accent}, ${T.indigo})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 26, fontWeight: 600,
          boxShadow: '0 8px 20px rgba(37,99,235,0.25)',
        }}>
          {(s.title || s.name.split('/').pop() || '?')[0].toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: T.text }}>
              {s.title || s.name.split('/').pop()}
            </h1>
            {isOfficial && <Badge color={T.accent} solid>OFFICIAL</Badge>}
            <Badge color={T.textMuted}>v{s.version}</Badge>
          </div>
          <div style={{ fontSize: 12, color: T.textMuted, fontFamily: T.mono, marginBottom: 8 }}>{s.name}</div>
          <p style={{ fontSize: 14, color: T.textSecondary, margin: 0, lineHeight: 1.55 }}>{s.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Btn icon={Icons.star({ size: 14 })}>Star</Btn>
          {entry.installed ? (
            <Btn icon={Icons.check({ size: 14, color: T.green })}>Installed</Btn>
          ) : (
            <Btn variant="primary" icon={Icons.download({ size: 14, color: '#fff' })}>Install</Btn>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'flex', gap: 24, padding: '14px 16px', marginBottom: 20,
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: T.radiusLg, fontSize: 13,
      }}>
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Stars</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginTop: 2 }}>
            {(entry.stars || 0).toLocaleString()}
          </div>
        </div>
        <div style={{ width: 1, background: T.border }} />
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Installs</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginTop: 2 }}>
            {(entry.installs || 0).toLocaleString()}
          </div>
        </div>
        <div style={{ width: 1, background: T.border }} />
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Author</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginTop: 2 }}>{entry.author}</div>
        </div>
        <div style={{ width: 1, background: T.border }} />
        <div>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Updated</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: T.text, marginTop: 2 }}>{entry.updated}</div>
        </div>
        {s.repository && (
          <>
            <div style={{ width: 1, background: T.border }} />
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <a href={/^https?:\/\//.test(s.repository.url) ? s.repository.url : '#'} target="_blank" rel="noopener noreferrer" style={{
                fontSize: 13, color: T.accent, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                {Icons.git({ size: 13 })} Repository
              </a>
            </div>
          </>
        )}
      </div>

      <TabBar active={tab} onChange={setTab} tabs={[
        { id: 'readme', label: 'Overview' },
        { id: 'install', label: 'Install' },
        { id: 'versions', label: 'Versions' },
        { id: 'tags', label: 'Tags', count: entry.tags.length },
      ]} />

      <div style={{ marginTop: 18 }}>
        {tab === 'readme' && (
          <Card style={{ padding: 22, fontSize: 14, color: T.textSecondary, lineHeight: 1.7 }}>
            <h3 style={{ color: T.text, marginTop: 0, fontSize: 17 }}>
              About {s.title || s.name.split('/').pop()}
            </h3>
            <p>{s.description}</p>
            <p>This MCP server is {isOfficial
              ? 'officially maintained by the Model Context Protocol team'
              : `maintained by ${entry.author}`}. It provides structured access for MCP clients via standard tools, resources, and prompts.</p>
            {s.websiteUrl && (
              <p>
                <strong style={{ color: T.text }}>Website:</strong>{' '}
                <a href={/^https?:\/\//.test(s.websiteUrl) ? s.websiteUrl : '#'} rel="noopener noreferrer" style={{ color: T.accent }}>{s.websiteUrl}</a>
              </p>
            )}
          </Card>
        )}

        {tab === 'install' && (
          <div>
            <div style={{ marginBottom: 16, fontSize: 13, color: T.textSecondary }}>
              Add this server to your{' '}
              <code style={{ background: T.surface, padding: '2px 6px', borderRadius: 3, fontFamily: T.mono, fontSize: 12 }}>
                .mcp.json
              </code>{' '}file:
            </div>
            <Card style={{ padding: 20, background: T.surface }}>
              <SyntaxHL code={configJSON} lang="json" />
            </Card>
            <div style={{ marginTop: 16, fontSize: 13, color: T.textSecondary }}>
              Or install via CLI:
            </div>
            <Card style={{ padding: 14, marginTop: 8, background: T.surface, fontFamily: T.mono, fontSize: 13, color: T.text }}>
              $ stash mcp install {s.name}@{s.version}
            </Card>
          </div>
        )}

        {tab === 'versions' && (
          <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radiusLg, overflow: 'hidden' }}>
            {[
              { ver: s.version, date: entry.updated, note: 'Latest', isLatest: true },
              { ver: '1.4.1', date: '2w ago', note: 'Bug fixes for error handling' },
              { ver: '1.4.0', date: '1mo ago', note: 'Added search resource type' },
              { ver: '1.3.2', date: '2mo ago', note: 'Patch release' },
            ].map((v, i, arr) => (
              <div key={v.ver} style={{
                display: 'flex', padding: '12px 16px', gap: 16, alignItems: 'center',
                borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                background: v.isLatest ? T.accentMuted : T.bg,
              }}>
                <code style={{ fontSize: 13, fontFamily: T.mono, color: T.text, fontWeight: 600, minWidth: 60 }}>
                  v{v.ver}
                </code>
                {v.isLatest && <Badge color={T.green}>LATEST</Badge>}
                <span style={{ fontSize: 13, color: T.textSecondary, flex: 1 }}>{v.note}</span>
                <span style={{ fontSize: 12, color: T.textMuted }}>{v.date}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'tags' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {entry.tags.map(t => (
              <span key={t} style={{
                fontSize: 13, padding: '6px 12px', borderRadius: 999,
                background: T.surface, color: T.textSecondary,
                border: `1px solid ${T.border}`,
              }}>#{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { MCPRegistry, MCPDetail, MCP_SERVERS });
