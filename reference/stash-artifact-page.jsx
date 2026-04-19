// Agent Stash — Artifact Page with content sidebar + Plate-style editor

// Sample data per artifact type
const ARTIFACT_DATA = {
  agents: [
    { name: 'homelab-ops.md', modified: '1h ago', author: 'jmagar', versions: 14, desc: 'unRAID infrastructure management',
      content: `# homelab-ops

Specialized agent for managing, maintaining, and troubleshooting services on unRAID infrastructure.

## Capabilities

- Docker container lifecycle
- unRAID array and pool operations
- Network config (Nginx, Tailscale, DNS)
- SSL certificate management
- Backup orchestration
- Health monitoring

## Guidelines

1. Always check service health before making changes
2. Create session logs for all maintenance activities
3. Upload logs to agent-stash after each session
4. Prefer non-destructive operations; confirm before deletion
5. Follow the deployment checklist at stash://docs/plans/deployment-checklist.md

## Available Tools

- All tools from the \`unraid-maintenance\` plugin
- All tools from the \`nginx-config-manager\` plugin
- \`stash://\` deeplink resolution via agent-stash MCP
- Docker CLI via bash tool
- SSH access to homelab devices` },
    { name: 'deployment-manager.md', modified: '3h ago', author: 'claude-code', versions: 9, desc: 'Docker deployment automation',
      content: `# deployment-manager

Handles all container deployments, updates, and rollbacks across the homelab.

## Capabilities

- Docker image pulling and version management
- Container health verification post-deploy
- Rollback on failed health checks
- Port conflict detection
- Volume mount validation

## Deploy Protocol

1. Pull latest image
2. Stop existing container (if upgrading)
3. Create backup of config volume
4. Start new container
5. Run health checks (30s timeout)
6. If healthy → log to stash, notify
7. If unhealthy → rollback, alert` },
    { name: 'security-reviewer.md', modified: '2d ago', author: 'jmagar', versions: 7, desc: 'Security audit and compliance',
      content: `# security-reviewer

Reviews configurations, deployments, and changes for security best practices.

## Focus Areas

- Container privilege escalation
- Exposed ports and services
- SSL/TLS configuration
- File permission audits
- Backup encryption verification
- Network segmentation` },
    { name: 'performance-tester.md', modified: '5d ago', author: 'codex', versions: 3, desc: 'Performance benchmarking',
      content: `# performance-tester

Runs performance benchmarks and generates reports on service health metrics.

## Metrics Tracked

- Container resource usage (CPU, memory, I/O)
- Network throughput between services
- Disk I/O on array and cache pools
- Transcoding performance (Plex/Jellyfin)
- Response times for web services` },
  ],
  skills: [
    { name: 'docker-compose-gen', modified: '2h ago', author: 'claude-code', versions: 4, desc: 'AI-assisted compose file generation', isFolder: true,
      content: `# docker-compose-gen

Generate Docker Compose files from natural language descriptions.

## Usage

Describe the service you want deployed and this skill will generate a production-ready docker-compose.yml with:

- Proper networking and port mapping
- Volume mounts with correct permissions
- Health checks
- Restart policies
- Resource limits
- Security best practices

## Examples

\`\`\`
"Deploy Jellyfin with GPU transcoding and a Postgres database"
"Set up a Traefik reverse proxy with Let's Encrypt"
"Create a monitoring stack with Prometheus, Grafana, and Alertmanager"
\`\`\`` },
    { name: 'ssl-cert-renewal', modified: '1d ago', author: 'jmagar', versions: 3, desc: 'Automated SSL via Lets Encrypt', isFolder: true,
      content: `# ssl-cert-renewal

Automated SSL certificate renewal via Let's Encrypt with DNS challenge support.

## Supported Providers

- Cloudflare DNS
- Route53
- DigitalOcean DNS

## Configuration

Set your DNS provider credentials in \`settings.json\`:

\`\`\`json
{
  "provider": "cloudflare",
  "email": "admin@example.com",
  "domains": ["*.home.example.com"]
}
\`\`\`` },
    { name: 'backup-validator', modified: '3d ago', author: 'codex', versions: 5, desc: 'Backup integrity validation', isFolder: true,
      content: `# backup-validator\n\nValidate backup integrity and test restore procedures.\n\n## Checks\n\n- File count verification\n- Checksum comparison\n- Test restore to temp location\n- Age verification (alert if stale)\n- Size anomaly detection` },
    { name: 'nginx-conf-gen', modified: '1w ago', author: 'jmagar', versions: 3, desc: 'Nginx reverse proxy config generator', isFolder: true,
      content: `# nginx-conf-gen\n\nGenerate Nginx reverse proxy configurations for homelab services.\n\n## Features\n\n- SSL termination with auto-cert\n- WebSocket proxy support\n- Rate limiting templates\n- Security headers\n- Gzip compression` },
    { name: 'log-analyzer', modified: '2w ago', author: 'claude-code', versions: 4, desc: 'Log parsing and anomaly detection', isFolder: true,
      content: `# log-analyzer\n\nParse and analyze logs from Docker containers and system services.\n\n## Capabilities\n\n- Pattern matching for common errors\n- Anomaly detection via frequency analysis\n- Summary report generation\n- Alert on critical patterns` },
  ],
  commands: [
    { name: 'status.md', modified: '6h ago', author: 'jmagar', versions: 5, desc: 'Check stash and agent status',
      content: `# /status

Quick overview of your stash and connected agents.

## Output

- Connected agents and their last activity
- Recent file changes
- Pending drafts
- Sync status across devices
- Storage usage` },
    { name: 'deploy.md', modified: '1d ago', author: 'claude-code', versions: 8, desc: 'Deploy artifacts to devices',
      content: `# /deploy

Deploy artifacts from your stash to one or more devices.

## Usage

\`\`\`
/deploy <artifact> --device <name>
/deploy <artifact> --all
/deploy <plugin> --agent claude-code --device dookie
\`\`\`

## Options

- \`--device\` — target specific device
- \`--all\` — deploy to all registered devices
- \`--agent\` — target specific agent
- \`--dry-run\` — preview changes without applying
- \`--force\` — skip version checks` },
    { name: 'logs.md', modified: '2d ago', author: 'jmagar', versions: 3, desc: 'View recent session logs',
      content: `# /logs\n\nView and search recent session logs.\n\n## Usage\n\n\`\`\`\n/logs              — last 10 sessions\n/logs --agent codex — filter by agent\n/logs --search dns  — search content\n\`\`\`` },
    { name: 'health-check.md', modified: '3d ago', author: 'codex', versions: 4, desc: 'Run health checks on services',
      content: `# /health-check\n\nRun health checks across your homelab services.\n\n## Checks\n\n- Docker container status\n- Port reachability\n- SSL certificate expiry\n- Disk space\n- Memory usage\n- Service response times` },
    { name: 'backup.md', modified: '5d ago', author: 'jmagar', versions: 6, desc: 'Trigger backup operations',
      content: `# /backup\n\nTrigger and manage backup operations.\n\n## Usage\n\n\`\`\`\n/backup run        — run all scheduled backups\n/backup validate   — check backup integrity\n/backup list       — show backup history\n\`\`\`` },
  ],
  hooks: [
    { name: 'hooks.json', modified: '4h ago', author: 'jmagar', versions: 11, desc: 'Core automation hooks',
      content: `{
  "hooks": [
    {
      "event": "on_file_edit",
      "pattern": "**/*.{yml,yaml}",
      "command": "yamllint $FILE",
      "description": "Lint YAML files on edit"
    },
    {
      "event": "on_task_complete",
      "command": "stash upload docs/sessions/$(date +%Y-%m-%d)-session.md",
      "description": "Auto-upload session log to stash"
    },
    {
      "event": "on_deploy",
      "command": "stash notify --channel ops \\"$PLUGIN v$VERSION → $DEVICE\\"",
      "description": "Notify on deployment"
    }
  ]
}` },
    { name: 'security-hooks.json', modified: '2d ago', author: 'claude-code', versions: 5, desc: 'Security scanning hooks',
      content: `{
  "hooks": [
    {
      "event": "on_file_edit",
      "pattern": "**/{Dockerfile,docker-compose*.yml}",
      "command": "scripts/security-scan.sh $FILE",
      "description": "Scan Docker files for vulnerabilities"
    },
    {
      "event": "on_deploy",
      "command": "scripts/port-audit.sh $DEVICE",
      "description": "Audit exposed ports after deployment"
    }
  ]
}` },
    { name: 'deploy-hooks.json', modified: '1w ago', author: 'codex', versions: 3, desc: 'Deployment lifecycle hooks',
      content: `{
  "hooks": [
    {
      "event": "pre_deploy",
      "command": "scripts/backup-config.sh $PLUGIN",
      "description": "Backup config before deploy"
    },
    {
      "event": "post_deploy",
      "command": "scripts/health-verify.sh $PLUGIN $DEVICE",
      "description": "Verify health after deploy"
    }
  ]
}` },
  ],
  sessions: [
    { name: '2026-04-17-jellyfin-docker-deploy.md', modified: '30m ago', author: 'claude-code', versions: 1, desc: 'Jellyfin Docker deployment',
      content: `# Jellyfin Docker Deployment

**Date:** April 17, 2026
**Agent:** claude-code
**Device:** dookie (unRAID)
**Duration:** 45 minutes

## Summary

Deployed Jellyfin media server as a Docker container on the unRAID server with hardware transcoding enabled via Intel Quick Sync.

## Decisions Made

1. **Container Runtime:** Used Docker directly (not docker-compose) per existing homelab conventions
2. **GPU Passthrough:** Enabled /dev/dri for Intel QSV transcoding
3. **Network:** Bridge mode with ports 8096 (HTTP) and 8920 (HTTPS)
4. **Storage:** Mounted /mnt/user/media as read-only, /mnt/user/appdata/jellyfin for config

## Commands Run

\`\`\`bash
docker pull jellyfin/jellyfin:latest
docker run -d --name jellyfin \\
  --device=/dev/dri:/dev/dri \\
  --group-add video \\
  -p 8096:8096 -p 8920:8920 \\
  -v /mnt/user/appdata/jellyfin:/config \\
  -v /mnt/user/media:/media:ro \\
  --restart=unless-stopped \\
  jellyfin/jellyfin:latest
\`\`\`

## Issues & Resolutions

- **Permission denied on /dev/dri** → Added \`--group-add video\`
- **Library scan stuck** → Increased inotify watchers via sysctl

## Next Steps

- [ ] Configure Tailscale for remote access
- [ ] Set up hardware tone-mapping
- [ ] Add to backup-validator skill` },
    { name: '2026-04-16-nginx-proxy-troubleshoot.md', modified: '1d ago', author: 'codex', versions: 2, desc: 'Nginx reverse proxy troubleshooting',
      content: `# Nginx Reverse Proxy Troubleshooting\n\n**Date:** April 16, 2026\n**Agent:** codex\n**Device:** dookie\n\n## Issue\n\n502 Bad Gateway on Sonarr after Nginx update to 1.25.4.\n\n## Root Cause\n\nUpstream keepalive timeout mismatch. Nginx default changed from 75s to 60s, but Sonarr expects 120s.\n\n## Resolution\n\nAdded \`keepalive_timeout 120s;\` to the upstream block.\nUpdated nginx-conf-gen skill to include this by default.` },
    { name: '2026-04-15-unraid-array-maintenance.md', modified: '2d ago', author: 'claude-code', versions: 1, desc: 'Scheduled array maintenance',
      content: `# unRAID Array Maintenance\n\n**Date:** April 15, 2026\n**Agent:** claude-code\n**Duration:** 2 hours\n\n## Tasks Completed\n\n- Parity check (clean — 0 errors)\n- SMART checks on all 8 drives\n- Replaced Drive 3 pre-fail warning → ordered replacement\n- Updated unRAID from 6.12.8 to 6.12.10\n- Cleared Docker image cache (recovered 34GB)` },
    { name: '2026-04-14-ssl-wildcard-setup.md', modified: '3d ago', author: 'jmagar', versions: 3, desc: 'Wildcard SSL certificate setup',
      content: `# Wildcard SSL Setup\n\n**Date:** April 14, 2026\n\n## Summary\n\nConfigured wildcard SSL cert for *.home.jmagar.dev via Cloudflare DNS challenge.\n\n## Steps\n\n1. Created Cloudflare API token with Zone:DNS:Edit\n2. Configured ssl-cert-renewal skill with token\n3. Ran initial cert generation\n4. Set up auto-renewal cron (weekly)\n5. Updated Nginx configs to use new cert path` },
  ],
  scripts: [
    { name: 'docker-cleanup.sh', modified: '2d ago', author: 'jmagar', versions: 4, desc: 'Remove unused Docker resources',
      content: `#!/bin/bash
# docker-cleanup.sh — Remove unused Docker resources
# Run weekly via cron or manually

echo "Removing stopped containers..."
docker container prune -f

echo "Removing unused images..."
docker image prune -a -f --filter "until=168h"

echo "Removing unused volumes..."
docker volume prune -f

echo "Removing unused networks..."
docker network prune -f

echo "Docker cleanup complete."
docker system df` },
    { name: 'backup-rsync.sh', modified: '5d ago', author: 'claude-code', versions: 6, desc: 'Rsync-based backup script',
      content: `#!/bin/bash
# backup-rsync.sh — Sync appdata to backup share

SOURCE="/mnt/user/appdata/"
DEST="/mnt/user/backups/appdata/$(date +%Y-%m-%d)/"

mkdir -p "$DEST"

rsync -avh --delete \\
  --exclude='*.tmp' \\
  --exclude='*/cache/*' \\
  --exclude='*/logs/*' \\
  "$SOURCE" "$DEST"

echo "Backup complete: $DEST"
du -sh "$DEST"` },
    { name: 'cert-renew.py', modified: '1w ago', author: 'codex', versions: 3, desc: 'Certificate renewal automation',
      content: `#!/usr/bin/env python3
"""cert-renew.py — Renew SSL certs via Cloudflare DNS challenge"""

import subprocess
import json
import sys

def renew_cert(domain, email, cf_token):
    cmd = [
        "certbot", "certonly",
        "--dns-cloudflare",
        "--dns-cloudflare-credentials", "/etc/letsencrypt/cloudflare.ini",
        "-d", domain,
        "--email", email,
        "--agree-tos",
        "--non-interactive"
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0

if __name__ == "__main__":
    with open("settings.json") as f:
        config = json.load(f)
    for domain in config["domains"]:
        success = renew_cert(domain, config["email"], config["cf_token"])
        status = "renewed" if success else "FAILED"
        print(f"{domain}: {status}")` },
  ],
};


// Plate-style toolbar
function PlateToolbar({ isEditing, onToggleEdit }) {
  const ToolBtn = ({ children, title, active }) => {
    const [h, setH] = React.useState(false);
    return (
      <button title={title} style={{
        width: 30, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active ? T.accentMuted : h ? T.surfaceHover : 'transparent',
        border: 'none', borderRadius: 4, cursor: 'pointer',
        color: active ? T.accent : T.textSecondary, fontSize: 13,
        transition: 'all 0.1s',
      }}
        onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
        {children}
      </button>
    );
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '4px 8px', gap: 1,
      borderBottom: `1px solid ${T.border}`, background: T.surface,
    }}>
      <Btn size="sm" variant={isEditing ? 'primary' : 'ghost'} onClick={onToggleEdit}
        style={{ marginRight: 8, fontSize: 12 }}>
        {isEditing ? 'Editing' : 'Edit'}
      </Btn>
      <div style={{ width: 1, height: 20, background: T.border, margin: '0 6px' }} />
      <ToolBtn title="Heading">{Icons.heading({ size: 14 })}</ToolBtn>
      <ToolBtn title="Bold">{Icons.bold({ size: 14 })}</ToolBtn>
      <ToolBtn title="Italic">{Icons.italic({ size: 14 })}</ToolBtn>
      <ToolBtn title="Code">{Icons.code({ size: 14 })}</ToolBtn>
      <ToolBtn title="Quote">{Icons.quote({ size: 14 })}</ToolBtn>
      <ToolBtn title="List">{Icons.listOl({ size: 14 })}</ToolBtn>
      <div style={{ width: 1, height: 20, background: T.border, margin: '0 6px' }} />
      <ToolBtn title="Link">{Icons.link({ size: 14 })}</ToolBtn>
      <div style={{ flex: 1 }} />
      <Btn size="sm" variant="ghost" icon={Icons.copy({ size: 12, color: T.textMuted })} style={{ fontSize: 12 }}>
        Copy
      </Btn>
      <Btn size="sm" variant="ghost" icon={Icons.share({ size: 12, color: T.textMuted })} style={{ fontSize: 12 }}>
        Share
      </Btn>
    </div>
  );
}

// Main artifact page with sidebar
function ArtifactPage({ type, onOpenArtifact }) {
  const items = ARTIFACT_DATA[type] || [];
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const [isEditing, setIsEditing] = React.useState(false);
  React.useEffect(() => { setSelectedIdx(0); setIsEditing(false); }, [type]);
  const selected = items[selectedIdx];

  const typeLabel = { agents: 'Agents', skills: 'Skills', commands: 'Commands', hooks: 'Hooks', sessions: 'Sessions', scripts: 'Scripts' };
  const isJSON = selected?.name?.endsWith('.json') || selected?.name?.endsWith('.sh') || selected?.name?.endsWith('.py');
  const lang = selected?.name?.endsWith('.json') ? 'json' : selected?.name?.endsWith('.sh') ? 'bash' : selected?.name?.endsWith('.py') ? 'python' : 'md';

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Content sidebar — artifact list */}
      <div style={{
        width: 260, flexShrink: 0, borderRight: `1px solid ${T.border}`,
        display: 'flex', flexDirection: 'column', background: T.surface,
      }}>
        <div style={{
          padding: '14px 16px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{typeLabel[type] || type}</span>
          <Btn size="sm" variant="ghost" icon={Icons.plus({ size: 14, color: T.textMuted })} style={{ padding: '4px 6px' }} />
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {items.map((item, i) => (
            <div key={item.name} onClick={() => setSelectedIdx(i)} style={{
              padding: '10px 16px', cursor: 'pointer',
              background: selectedIdx === i ? T.bg : 'transparent',
              borderLeft: selectedIdx === i ? `2px solid ${T.accent}` : '2px solid transparent',
              borderBottom: `1px solid ${T.border}`,
              transition: 'all 0.08s',
            }}
              onMouseEnter={e => { if (selectedIdx !== i) e.currentTarget.style.background = T.surfaceHover; }}
              onMouseLeave={e => { if (selectedIdx !== i) e.currentTarget.style.background = 'transparent'; }}>
              <div style={{ fontSize: 13, fontWeight: selectedIdx === i ? 500 : 400, color: T.text, marginBottom: 2 }}>
                {item.name.replace('.md', '').replace('.json', '')}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.4 }}>{item.desc}</div>
              <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4, display: 'flex', gap: 8 }}>
                <span>{item.author}</span>
                <span>{item.modified}</span>
                {item.versions > 1 && <span>v{item.versions}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Content area — Plate-style editor */}
      {selected && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{
            padding: '16px 24px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: T.text }}>{selected.name}</h2>
                {selected.versions > 1 && <span style={{ fontSize: 12, color: T.textMuted }}>v{selected.versions}</span>}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 3, display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Avatar name={selected.author} size={16} /> {selected.author}
                </span>
                <span>{selected.modified}</span>
                <span style={{ fontFamily: T.mono, fontSize: 11, color: T.accent }}>
                  stash://{type}/{selected.name}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn icon={Icons.history({ size: 14 })}>History</Btn>
              <Btn variant="primary" icon={Icons.deploy({ size: 14, color: '#fff' })}>Deploy</Btn>
            </div>
          </div>

          {/* Plate toolbar */}
          <PlateToolbar isEditing={isEditing} onToggleEdit={() => setIsEditing(!isEditing)} />

          {/* Content */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {isEditing ? (
              <textarea
                defaultValue={selected.content}
                style={{
                  width: '100%', height: '100%', background: T.bg, color: T.text,
                  border: 'none', outline: 'none', resize: 'none', padding: '20px 24px',
                  fontFamily: T.mono, fontSize: '13px', lineHeight: 1.6,
                }}
              />
            ) : (
              <div style={{ padding: '20px 24px' }}>
                <SyntaxHL code={selected.content} lang={lang} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ArtifactPage, PlateToolbar, ARTIFACT_DATA });
