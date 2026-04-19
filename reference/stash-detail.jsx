// Agent Stash — Artifact Detail View (Light)

function ArtifactDetail({ artifact, path: artPath, onBack }) {
  const [tab, setTab] = React.useState('content');
  const [commentText, setCommentText] = React.useState('');

  const name = artifact.name || 'Unknown';
  const isSession = name.includes('2026-');
  const isAgent = (artPath || []).includes('agents');
  const isHook = name.endsWith('.json');

  const versions = [
    { ver: artifact.versions || 1, date: artifact.modified || '1h ago', author: artifact.author || 'jmagar', summary: 'Updated configuration' },
    ...(artifact.versions > 1 ? [
      { ver: (artifact.versions || 1) - 1, date: '3d ago', author: 'claude-code', summary: 'Refactored error handling' },
      { ver: (artifact.versions || 1) - 2, date: '1w ago', author: 'codex', summary: 'Initial implementation' },
    ] : []),
  ];

  const comments = [
    { author: 'claude-code', text: 'Updated retry logic — reduced backoff from 5s to 1s, max 30s cap.', time: '2h ago', isAgent: true },
    { author: 'jmagar', text: 'Can you add jitter to prevent thundering herd?', time: '1h ago' },
    { author: 'claude-code', text: 'Done — added ±20% jitter. See v' + (artifact.versions || 1) + '.', time: '45m ago', isAgent: true },
  ];

  const deployments = [
    { device: 'dookie', agent: 'claude-code', version: artifact.versions || 1, status: 'synced', lastSync: '30m ago' },
    { device: 'macbook-pro', agent: 'claude-code', version: (artifact.versions || 1) - 1, status: 'behind', lastSync: '2d ago' },
    { device: 'workstation', agent: 'codex', version: artifact.versions || 1, status: 'synced', lastSync: '1h ago' },
  ];

  const getContent = () => {
    if (isSession) return `# Session: Jellyfin Docker Deployment

Date:     April 17, 2026
Agent:    claude-code
Device:   dookie (unRAID)
Duration: 45 minutes

## Summary

Deployed Jellyfin as Docker container on unRAID with
Intel Quick Sync hardware transcoding.

## Decisions

1. Docker directly (not compose) per homelab conventions
2. GPU passthrough via /dev/dri for QSV
3. Bridge mode — 8096 (HTTP), 8920 (HTTPS)
4. /mnt/user/media mounted read-only

## Commands

  docker pull jellyfin/jellyfin:latest
  docker run -d --name jellyfin \\
    --device=/dev/dri:/dev/dri \\
    -p 8096:8096 -p 8920:8920 \\
    -v /mnt/user/appdata/jellyfin:/config \\
    -v /mnt/user/media:/media:ro \\
    --restart=unless-stopped \\
    jellyfin/jellyfin:latest

## Issues

- Permission denied on /dev/dri → --group-add video
- Library scan stuck → increased inotify watchers

## Next

- [ ] Tailscale remote access
- [ ] Hardware tone-mapping
- [ ] Add to backup-validator skill`;
    if (isAgent) return `# homelab-ops

Specialized agent for managing, maintaining, and
troubleshooting services on unRAID infrastructure.

## Capabilities

- Docker container lifecycle
- unRAID array and pool operations
- Network config (Nginx, Tailscale, DNS)
- SSL certificate management
- Backup orchestration
- Health monitoring

## Guidelines

1. Check service health before changes
2. Create session logs for all maintenance
3. Upload logs to stash after each session
4. Prefer non-destructive ops; confirm deletes
5. Follow stash://docs/plans/deployment-checklist.md

## Tools

- unraid-maintenance plugin (all tools)
- nginx-config-manager plugin (all tools)
- agent-stash MCP (deeplink resolution)`;
    if (isHook) return `{
  "hooks": [
    {
      "event": "on_file_edit",
      "pattern": "**/*.{yml,yaml}",
      "command": "yamllint $FILE"
    },
    {
      "event": "on_task_complete",
      "command": "stash upload docs/sessions/$(date +%Y-%m-%d)-session.md"
    },
    {
      "event": "on_deploy",
      "command": "stash notify --channel ops \\"$PLUGIN v$VERSION → $DEVICE\\""
    }
  ]
}`;
    return `# ${name}\n\nManaged by agent-stash.\n\n  stash view ${name}\n  stash deploy ${name} --device dookie`;
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 960, margin: '0 auto' }}>
      <div onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 20,
        cursor: 'pointer', color: T.textMuted, fontSize: 13,
      }}
        onMouseEnter={e => e.currentTarget.style.color = T.text}
        onMouseLeave={e => e.currentTarget.style.color = T.textMuted}>
        {Icons.chevLeft({ size: 14 })} Back
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: T.text }}>{name}</h1>
          <div style={{ fontSize: 13, color: T.textSecondary, display: 'flex', gap: 16, alignItems: 'center' }}>
            {artifact.modified && <span>{artifact.modified}</span>}
            {artifact.author && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Avatar name={artifact.author} size={18} /> {artifact.author}
              </span>
            )}
            {artifact.size && <span>{artifact.size}</span>}
            {artifact.versions && <span>v{artifact.versions}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn>Share</Btn>
          <Btn variant="primary">Deploy</Btn>
        </div>
      </div>

      {/* Deeplink */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '8px 12px', marginBottom: 20,
        borderRadius: T.radius, background: T.surface, border: `1px solid ${T.border}`,
        fontSize: 13,
      }}>
        <span style={{ color: T.accent, fontFamily: T.mono, fontSize: 12 }}>stash://</span>
        <span style={{ color: T.textSecondary, fontFamily: T.mono, fontSize: 12, marginLeft: 2 }}>
          {(artPath || ['stash']).slice(1).join('/')}/{name}
        </span>
        <Btn size="sm" variant="ghost" style={{ marginLeft: 'auto' }}
          icon={Icons.copy({ size: 12, color: T.textMuted })}>Copy</Btn>
      </div>

      <TabBar active={tab} onChange={setTab} tabs={[
        { id: 'content', label: 'Content' },
        { id: 'versions', label: 'History', count: versions.length },
        { id: 'comments', label: 'Discussion', count: comments.length },
        { id: 'deploy', label: 'Deployments', count: deployments.length },
      ]} />

      <div style={{ marginTop: 16 }}>
        {tab === 'content' && (
          <div style={{
            border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 14px', borderBottom: `1px solid ${T.border}`, background: T.surface,
              fontSize: 12, color: T.textMuted,
            }}>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn size="sm" variant="ghost">Edit</Btn>
                <Btn size="sm" variant="ghost">Raw</Btn>
              </div>
              <span>{isHook ? 'JSON' : 'Markdown'} · {artifact.size || '3.2 KB'}</span>
            </div>
            <pre style={{
              padding: 20, margin: 0, fontFamily: T.mono, fontSize: 13,
              color: T.text, lineHeight: 1.65, whiteSpace: 'pre-wrap',
              overflowX: 'auto', maxHeight: 500,
            }}>{getContent()}</pre>
          </div>
        )}

        {tab === 'versions' && (
          <div>
            {versions.map((v, i) => (
              <div key={v.ver} style={{
                display: 'flex', alignItems: 'center', padding: '12px 0', gap: 12,
                borderBottom: `1px solid ${T.border}`,
              }}>
                <Avatar name={v.author} size={28} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: T.text }}>v{v.ver}</span>
                  <span style={{ fontSize: 13, color: T.textMuted, marginLeft: 10 }}>{v.summary}</span>
                </div>
                <span style={{ fontSize: 12, color: T.textMuted }}>{v.author} · {v.date}</span>
                <Btn size="sm" variant="ghost">View diff</Btn>
              </div>
            ))}
          </div>
        )}

        {tab === 'comments' && (
          <div>
            {comments.map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '14px 0', borderBottom: `1px solid ${T.border}` }}>
                <Avatar name={c.author} size={28} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>{c.author}</span>
                    {c.isAgent && <span style={{ fontSize: 11, color: T.textMuted, fontStyle: 'italic' }}>agent</span>}
                    <span style={{ fontSize: 12, color: T.textMuted }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.55 }}>{c.text}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <Input placeholder="Write a comment..." value={commentText}
                onChange={e => setCommentText(e.target.value)} style={{ flex: 1 }} />
              <Btn variant="primary">Post</Btn>
            </div>
          </div>
        )}

        {tab === 'deploy' && (
          <div style={{ border: `1px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 70px 70px 80px',
              padding: '8px 14px', fontSize: 11, color: T.textMuted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 0.4, borderBottom: `1px solid ${T.border}`,
              background: T.surface,
            }}>
              <span>Device</span><span>Agent</span><span>Version</span><span>Status</span><span>Last sync</span>
            </div>
            {deployments.map((d, i) => (
              <div key={d.device} style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 70px 70px 80px',
                padding: '10px 14px', alignItems: 'center', fontSize: 13,
                borderBottom: i < deployments.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <span style={{ color: T.text, fontWeight: 500 }}>{d.device}</span>
                <span style={{ color: T.textSecondary }}>{d.agent}</span>
                <span style={{ color: T.textMuted }}>v{d.version}</span>
                <span style={{ color: d.status === 'synced' ? T.green : T.orange, fontSize: 12, fontWeight: 500 }}>{d.status}</span>
                <span style={{ color: T.textMuted, fontSize: 12 }}>{d.lastSync}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ArtifactDetail });
