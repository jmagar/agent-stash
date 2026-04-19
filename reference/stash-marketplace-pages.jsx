// Agent Stash — Marketplace Feed & Overview

// Flatten all artifact types from LocalData into a unified sorted list
function useAllArtifacts(data) {
  return React.useMemo(() => {
    if (!data) return [];
    const kindMap = {
      agents: 'agent', skills: 'skill', commands: 'command',
      hooks: 'hook', sessions: 'session', scripts: 'script',
    };
    return Object.entries(kindMap)
      .flatMap(([k, kind]) => (data[k] || []).map(a => ({ ...a, kind })))
      .sort((a, b) => (b.mtime || 0) - (a.mtime || 0));
  }, [data]);
}

function useInstalledPlugins(data) {
  return React.useMemo(() => {
    const map = data?.plugins?.installed?.plugins;
    if (!map || typeof map !== 'object') return [];
    return Object.entries(map).map(([key, installs]) => {
      const atIdx = key.lastIndexOf('@');
      const name = atIdx >= 0 ? key.slice(0, atIdx) : key;
      const marketplace = atIdx >= 0 ? key.slice(atIdx + 1) : '';
      const install = Array.isArray(installs) ? installs[0] : installs;
      return { name, marketplace, version: install?.version || '?', lastUpdated: install?.lastUpdated || '' };
    }).sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated));
  }, [data]);
}

const KIND_COLOR = {
  agent: null,   // resolved at render via T.accent
  skill: null,
  command: null,
  hook: null,
  session: null,
  script: null,
};

function kindColor(kind) {
  return { agent: T.accent, skill: T.green, command: T.orange, hook: T.purple, session: T.teal, script: T.pink }[kind] || T.textMuted;
}

function kindIcon(kind) {
  return { agent: Icons.users, skill: Icons.zap, command: Icons.terminal, hook: Icons.git, session: Icons.clock, script: Icons.code }[kind] || Icons.activity;
}

// =============================================================================
// FEED
// =============================================================================

function MarketplaceFeed() {
  const { data, loading } = useLocalData();
  const allArtifacts = useAllArtifacts(data);
  const installedPlugins = useInstalledPlugins(data);

  const activityStats = [
    { label: 'Agents',   value: data?.agents?.length || 0 },
    { label: 'Skills',   value: data?.skills?.length || 0 },
    { label: 'Commands', value: data?.commands?.length || 0 },
    { label: 'Hooks',    value: data?.hooks?.length || 0 },
    { label: 'Plugins',  value: installedPlugins.length },
  ];

  const events = allArtifacts.slice(0, 12);

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>Feed</h1>
        <p style={{ fontSize: 13, color: T.textSecondary, margin: '4px 0 0' }}>
          Recent activity across your local artifacts and installed plugins.
        </p>
      </div>

      {loading ? (
        <div style={{ color: T.textMuted, fontSize: 13, padding: 40, textAlign: 'center' }}>
          Loading…
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
          {/* Timeline */}
          <div>
            {events.length === 0 ? (
              <div style={{ color: T.textMuted, fontSize: 13 }}>
                No artifacts found. Add agents, skills, or commands to ~/.claude/.
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: 4 }}>
                <div style={{
                  position: 'absolute', left: 15, top: 14, bottom: 14, width: 2,
                  background: `linear-gradient(to bottom, ${T.border}, ${T.border} 50%, transparent)`,
                }} />
                {events.map((a, i) => {
                  const color = kindColor(a.kind);
                  const Ic = kindIcon(a.kind);
                  return (
                    <div key={i} style={{ position: 'relative', display: 'flex', gap: 14, marginBottom: 14 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 16, flexShrink: 0, zIndex: 1,
                        background: color + '18', border: `1.5px solid ${color}55`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: T.shadow1,
                      }}>
                        {Ic({ size: 14, color })}
                      </div>
                      <Card style={{ flex: 1, padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                          <Avatar name={a.author || 'jmagar'} size={20} />
                          <strong style={{ fontSize: 13, color: T.text }}>{a.author || 'jmagar'}</strong>
                          <span style={{ fontSize: 13, color: T.textSecondary }}>
                            modified <strong style={{ color: T.text }}>{a.name.replace(/\.md$/, '')}</strong>
                          </span>
                          <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 'auto' }}>{a.modified}</span>
                        </div>
                        {a.desc && (
                          <div style={{
                            fontSize: 13, color: T.textSecondary, marginTop: 8,
                            padding: '8px 10px', background: T.surface, borderRadius: T.radiusSm,
                            borderLeft: `3px solid ${color}55`,
                          }}>{a.desc}</div>
                        )}
                        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 8,
                          display: 'flex', alignItems: 'center', gap: 4 }}>
                          {Ic({ size: 10, color: T.textMuted })} {a.kind}
                        </div>
                      </Card>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {installedPlugins.length > 0 && (
              <Card style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  {Icons.puzzle({ size: 14, color: T.purple })}
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>Installed plugins</h3>
                </div>
                {installedPlugins.slice(0, 5).map((p, i) => (
                  <div key={p.name} style={{
                    padding: '8px 0',
                    borderBottom: i < Math.min(installedPlugins.length, 5) - 1 ? `1px solid ${T.border}` : 'none',
                  }}>
                    <div style={{ fontSize: 12, color: T.text, fontWeight: 500, marginBottom: 2,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, display: 'flex', justifyContent: 'space-between' }}>
                      <span>v{p.version}</span>
                      <span>{p.marketplace}</span>
                    </div>
                  </div>
                ))}
              </Card>
            )}

            <Card style={{ padding: 16 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: '0 0 10px' }}>Your local artifacts</h3>
              <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.8 }}>
                {activityStats.map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{s.label}</span><strong style={{ color: T.text }}>{s.value}</strong>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// OVERVIEW (HUB)
// =============================================================================

function MarketplaceOverview({ onNav }) {
  const { data, loading } = useLocalData();
  const allArtifacts = useAllArtifacts(data);
  const installedPlugins = useInstalledPlugins(data);

  const stats = [
    { label: 'Agents',   value: data?.agents?.length || 0,   color: T.accent,  icon: Icons.users },
    { label: 'Skills',   value: data?.skills?.length || 0,   color: T.green,   icon: Icons.zap },
    { label: 'Commands', value: data?.commands?.length || 0, color: T.orange,  icon: Icons.terminal },
    { label: 'Plugins',  value: installedPlugins.length,     color: T.purple,  icon: Icons.puzzle },
  ];

  // Bin artifact modification timestamps into 14 daily buckets
  const activity = React.useMemo(() => {
    const bins = new Array(14).fill(0);
    const now = Math.floor(Date.now() / 1000);
    allArtifacts.forEach(a => {
      const daysAgo = Math.floor((now - (a.mtime || 0)) / 86400);
      if (daysAgo >= 0 && daysAgo < 14) bins[13 - daysAgo]++;
    });
    return bins;
  }, [allArtifacts]);

  const maxAct = Math.max(...activity, 1);
  const recent = allArtifacts.slice(0, 5);
  const topThree = allArtifacts.slice(0, 3);

  if (loading) return (
    <div style={{ padding: 40, color: T.textMuted, fontSize: 13, textAlign: 'center' }}>Loading…</div>
  );

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>Overview</h1>
        <p style={{ fontSize: 13, color: T.textSecondary, margin: '4px 0 0' }}>
          Your local artifacts and installed plugins at a glance.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {stats.map(s => (
          <Card key={s.label} style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.color }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, background: s.color + '18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {s.icon({ size: 14, color: s.color })}
              </div>
              <span style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase',
                letterSpacing: 0.5, fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 600, color: T.text, lineHeight: 1 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* 14-day activity chart */}
        <Card style={{ padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>Activity (14d)</h3>
            <span style={{ fontSize: 12, color: T.textMuted }}>
              {activity.reduce((a, b) => a + b, 0)} modifications
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
            {activity.map((v, i) => (
              <div key={i} style={{
                flex: 1, height: `${(v / maxAct) * 100}%`,
                background: `linear-gradient(to top, ${T.accent}, ${T.indigo})`,
                borderRadius: '3px 3px 0 0', minHeight: v > 0 ? 3 : 0,
                opacity: v > 0 ? (0.4 + (v / maxAct) * 0.6) : 0.1,
              }} title={`${v} modification${v !== 1 ? 's' : ''}`} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: T.textMuted }}>
            <span>14d ago</span><span>today</span>
          </div>
        </Card>

        {/* Recently modified */}
        <Card style={{ padding: 18 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 12px' }}>Recently modified</h3>
          {topThree.length === 0 ? (
            <div style={{ fontSize: 12, color: T.textMuted }}>No artifacts found.</div>
          ) : topThree.map((a, i) => (
            <div key={a.name} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 0', borderBottom: i < topThree.length - 1 ? `1px solid ${T.border}` : 'none',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                background: T.accentMuted, color: T.accent,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>{i + 1}</div>
              <span style={{ flex: 1, fontSize: 13, color: T.text, fontWeight: 500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {a.name.replace(/\.md$/, '')}
              </span>
              <span style={{ fontSize: 11, color: T.textMuted }}>{a.kind}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Recent activity table */}
      {recent.length > 0 ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>Recent activity</h3>
            <span onClick={() => onNav && onNav('feed')} style={{ fontSize: 12, color: T.accent, cursor: 'pointer' }}>
              View feed →
            </span>
          </div>
          {recent.map((a, i) => {
            const color = kindColor(a.kind);
            const Ic = kindIcon(a.kind);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                borderBottom: i < recent.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {Ic({ size: 13, color })}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: T.text, fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.name.replace(/\.md$/, '')}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>v{a.versions || 1} · {a.kind}</div>
                </div>
                <Badge color={color}>Modified</Badge>
                <span style={{ fontSize: 11, color: T.textMuted, width: 60, textAlign: 'right' }}>{a.modified}</span>
              </div>
            );
          })}
        </Card>
      ) : (
        <Card style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ color: T.textMuted, fontSize: 13 }}>
            No artifacts found. Ensure stash-server can read your ~/.claude directory.
          </div>
        </Card>
      )}
    </div>
  );
}

Object.assign(window, { MarketplaceFeed, MarketplaceOverview });
