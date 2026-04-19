// Agent Stash — Bazaar (Marketplaces & Plugins browser, schema-complete)

// Set window.STASH_DEMO_MODE = true before loading to show hardcoded sample data
// instead of reading from the stash-server API.
const DEMO_MODE = typeof window !== 'undefined' && window.STASH_DEMO_MODE === true;

// =============================================================================
// DATA — sample data used only when DEMO_MODE is enabled
// =============================================================================

const MARKETPLACES = [
  {
    name: 'homelab-tools',
    owner: 'jmagar',
    description: 'Core homelab management — Plex, nginx, unRAID, SSL, backups. Battle-tested on 3 devices.',
    metadata: {
      version: '3.2.0',
      maintainer: { name: 'Josh Magar', email: 'josh@jmagar.dev', url: 'https://github.com/jmagar' },
      homepage: 'https://github.com/jmagar/homelab-tools',
      repository: 'https://github.com/jmagar/homelab-tools.git',
      license: 'MIT',
      keywords: ['homelab', 'plex', 'nginx', 'unraid', 'docker', 'self-hosted'],
      category: 'infrastructure',
    },
    plugins: [
      { source: './plugins/plex-deployer' },
      { source: './plugins/nginx-config-manager' },
      { source: './plugins/unraid-maintenance' },
      { source: './plugins/ssl-cert-renewal' },
      { source: 'github:homelab-community/traefik-stack@v2.0.0' },
    ],
    stats: { plugins: 5, stars: 284, forks: 42, installs: 1834 },
    updated: '2h ago',
    featured: true,
  },
  {
    name: 'devops-essentials',
    owner: 'jmagar',
    description: 'CI/CD, observability, infrastructure-as-code. Opinionated toolchain for small teams.',
    metadata: {
      version: '1.8.3',
      maintainer: { name: 'Josh Magar', email: 'josh@jmagar.dev' },
      repository: 'https://github.com/jmagar/devops-essentials.git',
      license: 'MIT',
      keywords: ['ci-cd', 'devops', 'terraform', 'monitoring'],
      category: 'devops',
    },
    plugins: [
      { source: './plugins/docker-compose-generator' },
      { source: './plugins/backup-validator' },
      { source: './plugins/terraform-drift-detector' },
    ],
    stats: { plugins: 3, stars: 91, forks: 18, installs: 412 },
    updated: '1d ago',
  },
  {
    name: 'anthropic-official',
    owner: 'anthropic',
    description: 'Official plugins from Anthropic — reference implementations and core primitives.',
    metadata: {
      version: '1.0.0',
      maintainer: { name: 'Anthropic', url: 'https://anthropic.com' },
      repository: 'https://github.com/anthropics/claude-code-plugins.git',
      license: 'Apache-2.0',
      keywords: ['official', 'reference'],
      category: 'official',
    },
    plugins: [
      { source: './plugins/code-review' },
      { source: './plugins/test-runner' },
      { source: './plugins/doc-writer' },
    ],
    stats: { plugins: 3, stars: 8924, forks: 1203, installs: 45234 },
    updated: '3d ago',
    official: true,
  },
  {
    name: 'dataeng-kit',
    owner: 'openbridge',
    description: 'Data engineering workflows: dbt, Airflow, pipeline validators, schema diffs.',
    metadata: {
      version: '0.6.1',
      maintainer: { name: 'OpenBridge', url: 'https://openbridge.example' },
      repository: 'https://github.com/openbridge/dataeng-kit.git',
      license: 'MIT',
      keywords: ['data', 'dbt', 'airflow', 'etl'],
      category: 'data',
    },
    plugins: [
      { source: './plugins/dbt-runner' },
      { source: './plugins/airflow-dag-validator' },
    ],
    stats: { plugins: 2, stars: 156, forks: 23, installs: 612 },
    updated: '1w ago',
  },
];

const PLUGINS = [
  {
    id: 'plex-deployer',
    name: 'plex-deployer',
    version: '2.3.1',
    description: 'Automated Plex deployment, configuration, and library management for Docker hosts with hardware transcoding support.',
    marketplace: 'homelab-tools',
    author: { name: 'Josh Magar', email: 'josh@jmagar.dev', url: 'https://github.com/jmagar' },
    homepage: 'https://github.com/jmagar/homelab-tools/tree/main/plugins/plex-deployer',
    repository: 'https://github.com/jmagar/homelab-tools.git',
    license: 'MIT',
    keywords: ['plex', 'media', 'docker', 'deployment'],
    category: 'media',
    icon: '🎬',
    strict: false,
    commands: [
      { file: './commands/deploy.md', name: 'plex:deploy', desc: 'Deploy a Plex stack to a Docker host' },
      { file: './commands/update.md', name: 'plex:update', desc: 'Upgrade Plex to latest version' },
      { file: './commands/library-scan.md', name: 'plex:library-scan', desc: 'Trigger a library scan' },
      { file: './commands/transcode-check.md', name: 'plex:transcode-check', desc: 'Validate HW transcoding config' },
    ],
    agents: [
      { file: './agents/deployment-manager.md', name: 'deployment-manager', desc: 'Orchestrates rollouts with rollback on failure' },
    ],
    skills: [
      { file: './skills/docker-compose-gen/SKILL.md', name: 'docker-compose-gen' },
      { file: './skills/plex-claim-token/SKILL.md', name: 'plex-claim-token' },
      { file: './skills/hwtrans-detection/SKILL.md', name: 'hwtrans-detection' },
    ],
    hooks: {
      PreToolUse: [
        { matcher: 'Bash', hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/validate-compose.sh' }] },
      ],
      PostToolUse: [
        { matcher: 'Write', hooks: [{ type: 'command', command: '${CLAUDE_PLUGIN_ROOT}/hooks/log-deploy.sh' }] },
      ],
    },
    mcpServers: {
      'docker': { command: 'npx', args: ['-y', '@modelcontextprotocol/docker'], env: { DOCKER_HOST: 'unix:///var/run/docker.sock' } },
    },
    stats: { stars: 34, installs: 156, forks: 8, deployedOn: 3 },
    updated: '2h ago',
    status: 'published',
    files: [
      { name: '.claude-plugin/', type: 'folder', children: [{ name: 'plugin.json', type: 'file' }] },
      { name: 'agents/', type: 'folder', children: [{ name: 'deployment-manager.md', type: 'file' }] },
      { name: 'commands/', type: 'folder', children: [
        { name: 'deploy.md', type: 'file' },
        { name: 'update.md', type: 'file' },
        { name: 'library-scan.md', type: 'file' },
        { name: 'transcode-check.md', type: 'file' },
      ] },
      { name: 'skills/', type: 'folder', children: [
        { name: 'docker-compose-gen/', type: 'folder', children: [
          { name: 'SKILL.md', type: 'file' },
          { name: 'templates/', type: 'folder' },
        ] },
        { name: 'plex-claim-token/', type: 'folder' },
        { name: 'hwtrans-detection/', type: 'folder' },
      ] },
      { name: 'hooks/', type: 'folder', children: [
        { name: 'validate-compose.sh', type: 'file' },
        { name: 'log-deploy.sh', type: 'file' },
      ] },
      { name: 'scripts/', type: 'folder' },
      { name: 'README.md', type: 'file' },
      { name: 'CHANGELOG.md', type: 'file' },
    ],
  },
  {
    id: 'nginx-config-manager',
    name: 'nginx-config-manager',
    version: '1.8.0',
    description: 'Generate, validate and deploy Nginx reverse proxy configs with Let\'s Encrypt SSL cert management.',
    marketplace: 'homelab-tools',
    author: { name: 'Josh Magar' },
    license: 'MIT',
    keywords: ['nginx', 'proxy', 'ssl', 'homelab'],
    category: 'networking',
    icon: '🌐',
    commands: [
      { name: 'nginx:add-site', desc: 'Scaffold a new reverse proxy config' },
      { name: 'nginx:reload', desc: 'Validate and reload config' },
      { name: 'nginx:ssl-issue', desc: 'Request / renew a cert via Certbot' },
    ],
    agents: [{ name: 'homelab-ops', desc: 'Handles nginx + SSL workflows' }],
    skills: [
      { name: 'nginx-config-gen' },
      { name: 'ssl-cert-renewal' },
      { name: 'upstream-healthcheck' },
      { name: 'rate-limit-config' },
      { name: 'cache-tuning' },
    ],
    stats: { stars: 28, installs: 203, forks: 5, deployedOn: 2 },
    updated: '1d ago',
    status: 'published',
  },
  {
    id: 'unraid-maintenance',
    name: 'unraid-maintenance',
    version: '3.1.0',
    description: 'Scheduled maintenance, health checks, and parity reporting for unRAID servers. Runs headless.',
    marketplace: 'homelab-tools',
    author: { name: 'Josh Magar' },
    license: 'MIT',
    keywords: ['unraid', 'homelab', 'monitoring'],
    category: 'infrastructure',
    icon: '🗄️',
    commands: [
      { name: 'unraid:parity-check', desc: 'Kick off parity check' },
      { name: 'unraid:health', desc: 'Report system health' },
      { name: 'unraid:docker-audit', desc: 'Audit containers' },
    ],
    agents: [{ name: 'homelab-ops' }, { name: 'security-reviewer' }],
    skills: Array.from({ length: 7 }, (_, i) => ({ name: `skill-${i + 1}` })),
    stats: { stars: 41, installs: 312, forks: 11, deployedOn: 3 },
    updated: '3d ago',
    status: 'published',
  },
  {
    id: 'docker-compose-generator',
    name: 'docker-compose-generator',
    version: '1.2.0',
    description: 'AI-assisted Docker Compose generation with best practices, security defaults, and healthcheck scaffolding.',
    marketplace: 'devops-essentials',
    author: { name: 'Josh Magar' },
    license: 'MIT',
    keywords: ['docker', 'compose'],
    category: 'devops',
    icon: '🐳',
    commands: [{ name: 'compose:scaffold' }, { name: 'compose:lint' }, { name: 'compose:secure' }],
    agents: [{ name: 'deployment-manager' }],
    skills: [{ name: 'compose-patterns' }, { name: 'healthcheck-gen' }],
    stats: { stars: 19, installs: 89, forks: 3, deployedOn: 1 },
    updated: '5d ago',
    status: 'published',
  },
  {
    id: 'backup-validator',
    name: 'backup-validator',
    version: '0.9.2',
    description: 'Validate backup integrity, test restores in sandbox, generate compliance reports.',
    marketplace: 'devops-essentials',
    author: { name: 'Josh Magar' },
    license: 'MIT',
    keywords: ['backup', 'compliance'],
    category: 'devops',
    icon: '💾',
    commands: [{ name: 'backup:validate' }, { name: 'backup:test-restore' }],
    agents: [{ name: 'security-reviewer' }],
    skills: [{ name: 'sandbox-restore' }],
    stats: { stars: 15, installs: 67, forks: 2, deployedOn: 0 },
    updated: '1w ago',
    status: 'draft',
  },
  {
    id: 'ssl-cert-renewal',
    name: 'ssl-cert-renewal',
    version: '1.0.4',
    description: "Automated SSL renewal via Let's Encrypt with DNS-01 challenge support for wildcards.",
    marketplace: 'homelab-tools',
    author: { name: 'Josh Magar' },
    license: 'MIT',
    keywords: ['ssl', 'letsencrypt', 'tls'],
    category: 'networking',
    icon: '🔒',
    commands: [{ name: 'ssl:issue' }, { name: 'ssl:renew' }],
    agents: [{ name: 'homelab-ops' }],
    skills: [{ name: 'dns01-challenge' }, { name: 'cert-rotation' }],
    stats: { stars: 22, installs: 134, forks: 4, deployedOn: 3 },
    updated: '2w ago',
    status: 'published',
  },
  {
    id: 'code-review',
    name: 'code-review',
    version: '1.0.0',
    description: 'Official code review plugin — diff analysis, suggested refactors, security pattern checks.',
    marketplace: 'anthropic-official',
    author: { name: 'Anthropic' },
    license: 'Apache-2.0',
    keywords: ['review', 'quality'],
    category: 'official',
    icon: '✨',
    commands: [{ name: 'review:diff' }, { name: 'review:security' }],
    agents: [{ name: 'reviewer' }],
    skills: [{ name: 'diff-analysis' }, { name: 'pattern-detection' }],
    stats: { stars: 3421, installs: 18902, forks: 234, deployedOn: 1 },
    updated: '3d ago',
    status: 'published',
    official: true,
  },
];

// =============================================================================
// SCHEMA definitions for reference
// =============================================================================

const PLUGIN_SCHEMA = [
  { field: 'name', type: 'string', required: true, desc: 'Unique plugin identifier. Lowercase, hyphen-separated.' },
  { field: 'version', type: 'string', required: true, desc: 'Semantic version (x.y.z).' },
  { field: 'description', type: 'string', required: true, desc: 'Short plugin description surfaced in marketplaces.' },
  { field: 'author', type: 'object', desc: 'Object with name, email, url fields. Required for published plugins.' },
  { field: 'homepage', type: 'string', desc: 'URL to plugin homepage or docs.' },
  { field: 'repository', type: 'string', desc: 'Git URL for the plugin source.' },
  { field: 'license', type: 'string', desc: 'SPDX license identifier (MIT, Apache-2.0, etc.).' },
  { field: 'keywords', type: 'string[]', desc: 'Searchable tags for discovery.' },
  { field: 'category', type: 'string', desc: 'Primary category slug.' },
  { field: 'icon', type: 'string', desc: 'Emoji or path to icon asset.' },
  { field: 'strict', type: 'boolean', desc: 'If true, errors in plugin components fail activation loudly instead of being skipped.' },
  { field: 'commands', type: 'array | string', desc: 'Slash commands. Array of {file, name, desc} or glob pattern like "./commands/*.md".' },
  { field: 'agents', type: 'array | string', desc: 'Subagent definitions. Array or glob.' },
  { field: 'skills', type: 'array | string', desc: 'Skill definitions. Array or glob.' },
  { field: 'hooks', type: 'object | string', desc: 'Hook config object (PreToolUse, PostToolUse, etc.) or path to JSON.' },
  { field: 'mcpServers', type: 'object | string', desc: 'MCP server configs keyed by name, or path to JSON.' },
];

const MARKETPLACE_SCHEMA = [
  { field: 'name', type: 'string', required: true, desc: 'Marketplace identifier. Lowercase, hyphen-separated.' },
  { field: 'owner', type: 'object', required: true, desc: 'Object with name, email, url.' },
  { field: 'description', type: 'string', desc: 'Short description of the marketplace.' },
  { field: 'metadata', type: 'object', desc: 'version, maintainer, homepage, repository, license, keywords, category.' },
  { field: 'plugins', type: 'array', required: true, desc: 'Array of plugin entries. Each has source (path, git URL, or marketplace reference).' },
];

const PLUGIN_STRUCTURE = [
  { path: '.claude-plugin/plugin.json', desc: 'Required manifest file with plugin metadata.' },
  { path: 'agents/', desc: 'Subagent definitions (.md files with frontmatter).' },
  { path: 'commands/', desc: 'Slash commands (.md files).' },
  { path: 'skills/', desc: 'Reusable skills. Each skill is a folder containing SKILL.md.' },
  { path: 'hooks/', desc: 'Hook scripts invoked by PreToolUse, PostToolUse, etc.' },
  { path: 'scripts/', desc: 'Plugin-owned executable scripts. Not auto-registered.' },
  { path: 'bin/', desc: 'Binaries shipped with the plugin.' },
  { path: '.mcp.json', desc: 'Standalone MCP server config (alternative to inlining in plugin.json).' },
  { path: 'README.md', desc: 'Long-form documentation shown on the plugin detail page.' },
  { path: 'CHANGELOG.md', desc: 'Version history.' },
];

// =============================================================================
// CONTEXT — shared bazaar state (avoids prop drilling)
// =============================================================================

const BazaarCtx = React.createContext(null);

// =============================================================================
// BAZAAR ROOT
// =============================================================================

function Bazaar() {
  const localData = useLocalData();
  const [marketplaces, setMarketplaces] = React.useState(DEMO_MODE ? MARKETPLACES : []);
  const [plugins, setPlugins] = React.useState(DEMO_MODE ? PLUGINS : []);
  const [mainTab, setMainTab] = React.useState('bazaar'); // 'bazaar' | 'mcp'
  const [view, setView] = React.useState({ kind: 'home' });
  const [addMarketplaceOpen, setAddMarketplaceOpen] = React.useState(false);
  const [addPluginOpen, setAddPluginOpen] = React.useState(false);

  // Load real data from stash-server unless demo mode is active
  React.useEffect(() => {
    if (DEMO_MODE || localData.loading || !localData.data) return;
    const pd = localData.data.plugins || {};

    // known_marketplaces.json: { "marketplace-name": { source, installLocation, lastUpdated, autoUpdate } }
    const knownMps = pd.known_marketplaces && typeof pd.known_marketplaces === 'object' && !Array.isArray(pd.known_marketplaces)
      ? pd.known_marketplaces
      : {};

    // Index marketplace.json content by name for enrichment
    const mpContent = {};
    (pd.marketplaces || []).forEach(mp => {
      const key = mp.name || mp._dir;
      if (key) mpContent[key] = mp;
    });

    const realMarketplaces = Object.entries(knownMps).map(([name, km]) => {
      const content = mpContent[name] || {};
      const repoUrl = km.source?.repo
        ? `https://github.com/${km.source.repo}`
        : km.source?.url || '';
      return {
        name,
        owner: km.source?.repo?.split('/')[0] || content.owner?.name || name,
        description: content.description || '',
        metadata: {
          version: content.version,
          maintainer: content.owner,
          repository: repoUrl ? `${repoUrl}.git` : undefined,
          license: content.license,
          keywords: content.keywords || [],
          category: content.category,
        },
        plugins: content.plugins || [],
        stats: {
          plugins: content.plugins?.length || 0,
          stars: 0, forks: 0, installs: 0,
        },
        updated: km.lastUpdated ? new Date(km.lastUpdated).toLocaleDateString() : 'unknown',
        autoUpdate: km.autoUpdate || false,
        installLocation: km.installLocation,
      };
    });

    setMarketplaces(realMarketplaces);

    // installed_plugins.json: { version: 2, plugins: { "name@marketplace": [{ scope, installPath, version, installedAt, lastUpdated }] } }
    const installedPluginsMap = pd.installed?.plugins && typeof pd.installed.plugins === 'object'
      ? pd.installed.plugins
      : {};

    const realPlugins = Object.entries(installedPluginsMap).map(([key, installs]) => {
      const atIdx = key.lastIndexOf('@');
      const pluginName = atIdx >= 0 ? key.slice(0, atIdx) : key;
      const marketplaceName = atIdx >= 0 ? key.slice(atIdx + 1) : 'unknown';
      const install = Array.isArray(installs) ? installs[0] : installs;
      return {
        id: key,
        name: pluginName,
        marketplace: marketplaceName,
        version: install?.version || 'unknown',
        installPath: install?.installPath || '',
        installedAt: install?.installedAt || '',
        lastUpdated: install?.lastUpdated || '',
        scope: install?.scope || 'user',
        gitCommitSha: install?.gitCommitSha || '',
        description: '',
        updated: install?.lastUpdated ? new Date(install.lastUpdated).toLocaleDateString() : '',
        stats: { stars: 0, installs: 0, forks: 0, deployedOn: 0 },
        status: 'installed',
      };
    });

    setPlugins(realPlugins);
  }, [localData.data, localData.loading]);

  const goHome = () => setView({ kind: 'home' });
  const openMarketplace = (m) => setView({ kind: 'marketplace', data: m });
  const openPlugin = (p) => setView({ kind: 'plugin', data: p });

  const switchTab = (t) => { setMainTab(t); setView({ kind: 'home' }); };

  const isDetail = ['marketplace', 'plugin'].includes(view.kind);

  const ctx = React.useMemo(() => ({
    marketplaces, plugins,
    addMarketplace: (data) => setMarketplaces(prev => [...prev, data]),
    addPlugin: (data) => setPlugins(prev => [...prev, data]),
    openAddMarketplace: () => setAddMarketplaceOpen(true),
    openAddPlugin: () => setAddPluginOpen(true),
  }), [marketplaces, plugins]);

  let content;
  if (mainTab === 'mcp') {
    content = <MCPRegistry />;
  } else if (view.kind === 'marketplace') {
    content = <MarketplaceDetail marketplace={view.data} onBack={goHome} onOpenPlugin={openPlugin} />;
  } else if (view.kind === 'plugin') {
    content = <PluginDetailFull plugin={view.data} onBack={goHome} onOpenMarketplace={openMarketplace} />;
  } else if (view.kind === 'marketplaces') {
    content = <MarketplacesList onBack={goHome} onOpen={openMarketplace} />;
  } else if (view.kind === 'plugins') {
    content = <PluginsList onBack={goHome} onOpen={openPlugin} />;
  } else {
    content = <BazaarHome
      onOpenMarketplaces={() => setView({ kind: 'marketplaces' })}
      onOpenPlugins={() => setView({ kind: 'plugins' })}
      onOpenMarketplace={openMarketplace}
      onOpenPlugin={openPlugin}
      onSwitchToMcp={() => switchTab('mcp')}
    />;
  }

  return (
    <BazaarCtx.Provider value={ctx}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {!isDetail && (
          <div style={{
            borderBottom: `1px solid ${T.border}`,
            background: T.surface, flexShrink: 0,
            padding: '0 32px',
          }}>
            <div style={{ display: 'flex' }}>
              {[
                { id: 'bazaar', label: 'Marketplaces & Plugins' },
                { id: 'mcp', label: 'MCP Registry' },
              ].map(t => (
                <button key={t.id} onClick={() => switchTab(t.id)} style={{
                  padding: '11px 16px', fontSize: 13, fontFamily: T.font,
                  fontWeight: mainTab === t.id ? 500 : 400,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: mainTab === t.id ? T.text : T.textMuted,
                  borderBottom: mainTab === t.id ? `2px solid ${T.accent}` : '2px solid transparent',
                  marginBottom: -1, transition: 'color 0.12s',
                }}>{t.label}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {content}
        </div>
      </div>

      {addMarketplaceOpen && <AddMarketplaceModal onClose={() => setAddMarketplaceOpen(false)} />}
      {addPluginOpen && <AddPluginModal onClose={() => setAddPluginOpen(false)} />}
    </BazaarCtx.Provider>
  );
}

// =============================================================================
// MODAL PRIMITIVES
// =============================================================================

function Modal({ title, onClose, children, footer }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: T.surfaceRaised, border: `1px solid ${T.borderLight}`,
        borderRadius: T.radiusLg, boxShadow: T.shadow4,
        width: '100%', maxWidth: 560, maxHeight: '80vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        margin: '0 16px',
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: T.text }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted,
            padding: 4, borderRadius: T.radiusSm, display: 'flex',
          }}>{Icons.x({ size: 16 })}</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>{children}</div>
        {footer && (
          <div style={{
            padding: '12px 20px', borderTop: `1px solid ${T.border}`,
            display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0,
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// ADD MARKETPLACE MODAL
// =============================================================================

function AddMarketplaceModal({ onClose }) {
  const { addMarketplace } = React.useContext(BazaarCtx);
  const [url, setUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState(null);
  const [error, setError] = React.useState(null);

  const parseGitHub = (input) => {
    const clean = input.trim()
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/^github\.com\//, '')
      .replace(/\.git$/, '');
    const parts = clean.split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    return { owner: parts[0], repo: parts[1] };
  };

  const fetchIt = async () => {
    const parsed = parseGitHub(url);
    if (!parsed) { setError('Enter a valid GitHub URL or owner/repo'); return; }
    setLoading(true); setError(null); setPreview(null);
    const { owner, repo } = parsed;
    for (const branch of ['main', 'master']) {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/.claude-plugin/marketplace.json`
        );
        if (res.ok) {
          const data = await res.json();
          setPreview({
            ...data,
            owner: data.owner || owner,
            _sourceRepo: `${owner}/${repo}`,
            updated: 'just now',
            stats: { plugins: data.plugins?.length || 0, stars: 0, forks: 0, installs: 0 },
          });
          setLoading(false);
          return;
        }
      } catch {}
    }
    setError('Could not find .claude-plugin/marketplace.json in this repository.');
    setLoading(false);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') fetchIt(); };

  const handleAdd = () => {
    if (!preview) return;
    addMarketplace(preview);
    onClose();
  };

  return (
    <Modal title="Add Marketplace from GitHub" onClose={onClose}
      footer={<>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleAdd}
          style={{ opacity: preview ? 1 : 0.45, pointerEvents: preview ? 'auto' : 'none' }}>
          {Icons.plus({ size: 14, color: '#fff' })} Add Marketplace
        </Btn>
      </>}>
      <div>
        <p style={{ fontSize: 13, color: T.textSecondary, marginTop: 0, marginBottom: 16, lineHeight: 1.55 }}>
          Enter a GitHub repository that contains a{' '}
          <code style={{ fontFamily: T.mono, background: T.surfaceSunken, padding: '1px 5px', borderRadius: 3, fontSize: 12 }}>
            .claude-plugin/marketplace.json
          </code>{' '}file.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <Input
            placeholder="github.com/owner/repo or owner/repo"
            value={url}
            onChange={e => { setUrl(e.target.value); setError(null); }}
            icon={Icons.link({ size: 14, color: T.textMuted })}
            style={{ flex: 1 }}
          />
          <Btn onClick={fetchIt} style={{ flexShrink: 0 }}>
            {loading ? '…' : 'Fetch'}
          </Btn>
        </div>

        {error && (
          <div style={{
            padding: '10px 12px', background: T.redMuted,
            border: `1px solid ${T.red}44`, borderRadius: T.radius,
            fontSize: 13, color: T.red, marginBottom: 14,
          }}>{error}</div>
        )}

        {preview && (
          <div>
            <div style={{
              fontSize: 11, color: T.textMuted, textTransform: 'uppercase',
              letterSpacing: 0.5, marginBottom: 8, fontWeight: 600,
            }}>Preview</div>
            <Card style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                }}>{(preview.name || '?')[0].toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{preview.name}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>
                    by {typeof preview.owner === 'object' ? preview.owner.name : preview.owner}
                    {' · '}{preview.metadata?.license || 'unknown license'}
                  </div>
                </div>
              </div>
              {preview.description && (
                <p style={{ fontSize: 13, color: T.textSecondary, margin: '0 0 8px', lineHeight: 1.5 }}>
                  {preview.description}
                </p>
              )}
              <div style={{ fontSize: 12, color: T.textMuted }}>
                {preview.plugins?.length || 0} plugin{(preview.plugins?.length || 0) !== 1 ? 's' : ''}
              </div>
            </Card>

            <div style={{
              fontSize: 11, color: T.textMuted, textTransform: 'uppercase',
              letterSpacing: 0.5, marginBottom: 6, fontWeight: 600,
            }}>marketplace.json</div>
            <Card style={{ padding: 14, background: T.surfaceSunken, maxHeight: 200, overflow: 'auto' }}>
              <SyntaxHL code={JSON.stringify(preview, null, 2)} lang="json" />
            </Card>
          </div>
        )}
      </div>
    </Modal>
  );
}

// =============================================================================
// ADD PLUGIN MODAL
// =============================================================================

function AddPluginModal({ onClose }) {
  const { addPlugin } = React.useContext(BazaarCtx);
  const [url, setUrl] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [preview, setPreview] = React.useState(null);
  const [error, setError] = React.useState(null);

  const parseGitHub = (input) => {
    const clean = input.trim()
      .replace(/^https?:\/\/github\.com\//, '')
      .replace(/^github\.com\//, '')
      .replace(/\.git$/, '');
    const parts = clean.split('/');
    if (parts.length < 2 || !parts[0] || !parts[1]) return null;
    return { owner: parts[0], repo: parts[1] };
  };

  const fetchIt = async () => {
    const parsed = parseGitHub(url);
    if (!parsed) { setError('Enter a valid GitHub URL or owner/repo'); return; }
    setLoading(true); setError(null); setPreview(null);
    const { owner, repo } = parsed;
    for (const branch of ['main', 'master']) {
      try {
        const res = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/.claude-plugin/plugin.json`
        );
        if (res.ok) {
          const data = await res.json();
          setPreview({
            ...data,
            id: data.name || repo,
            marketplace: data.marketplace || `${owner}/${repo}`,
            author: data.author || { name: owner },
            stats: { stars: 0, installs: 0, forks: 0, deployedOn: 0 },
            updated: 'just now',
            status: 'published',
          });
          setLoading(false);
          return;
        }
      } catch {}
    }
    setError('Could not find .claude-plugin/plugin.json in this repository.');
    setLoading(false);
  };

  const handleAdd = () => {
    if (!preview) return;
    addPlugin(preview);
    onClose();
  };

  return (
    <Modal title="Add Plugin from GitHub" onClose={onClose}
      footer={<>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={handleAdd}
          style={{ opacity: preview ? 1 : 0.45, pointerEvents: preview ? 'auto' : 'none' }}>
          {Icons.plus({ size: 14, color: '#fff' })} Add Plugin
        </Btn>
      </>}>
      <div>
        <p style={{ fontSize: 13, color: T.textSecondary, marginTop: 0, marginBottom: 16, lineHeight: 1.55 }}>
          Enter a GitHub repository that contains a{' '}
          <code style={{ fontFamily: T.mono, background: T.surfaceSunken, padding: '1px 5px', borderRadius: 3, fontSize: 12 }}>
            .claude-plugin/plugin.json
          </code>{' '}file.
        </p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <Input
            placeholder="github.com/owner/repo or owner/repo"
            value={url}
            onChange={e => { setUrl(e.target.value); setError(null); }}
            icon={Icons.link({ size: 14, color: T.textMuted })}
            style={{ flex: 1 }}
          />
          <Btn onClick={fetchIt} style={{ flexShrink: 0 }}>
            {loading ? '…' : 'Fetch'}
          </Btn>
        </div>

        {error && (
          <div style={{
            padding: '10px 12px', background: T.redMuted,
            border: `1px solid ${T.red}44`, borderRadius: T.radius,
            fontSize: 13, color: T.red, marginBottom: 14,
          }}>{error}</div>
        )}

        {preview && (
          <div>
            <div style={{
              fontSize: 11, color: T.textMuted, textTransform: 'uppercase',
              letterSpacing: 0.5, marginBottom: 8, fontWeight: 600,
            }}>Preview</div>
            <Card style={{ padding: 16, marginBottom: 14, display: 'flex', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: T.surfaceSunken, border: `1px solid ${T.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>{preview.icon || Icons.puzzle({ size: 18, color: T.textMuted })}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{preview.name}</div>
                  {preview.version && (
                    <span style={{ fontSize: 11, color: T.textMuted }}>v{preview.version}</span>
                  )}
                </div>
                {preview.description && (
                  <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.45 }}>
                    {preview.description}
                  </div>
                )}
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
                  {preview.license || 'unknown license'}
                </div>
              </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
              {[
                { label: 'Commands', count: preview.commands?.length || 0, color: T.accent },
                { label: 'Agents',   count: preview.agents?.length || 0,   color: T.purple },
                { label: 'Skills',   count: preview.skills?.length || 0,   color: T.amber },
                { label: 'Hooks',    count: Object.keys(preview.hooks || {}).length, color: T.green },
              ].map(c => (
                <div key={c.label} style={{
                  padding: '8px 10px', background: T.surfaceRaised,
                  border: `1px solid ${T.border}`, borderRadius: T.radius, textAlign: 'center',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>{c.count}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// =============================================================================
// HOME — featured marketplaces + top plugins
// =============================================================================

function BazaarHome({ onOpenMarketplaces, onOpenPlugins, onOpenMarketplace, onOpenPlugin, onSwitchToMcp }) {
  const { marketplaces, plugins, openAddMarketplace, openAddPlugin } = React.useContext(BazaarCtx);
  const featured = [...marketplaces].sort((a, b) =>
    ((b.featured ? 1 : 0) + (b.official ? 1 : 0)) - ((a.featured ? 1 : 0) + (a.official ? 1 : 0))
  ).slice(0, 6);
  const topPlugins = [...plugins].sort((a, b) => b.stats.installs - a.stats.installs).slice(0, 4);

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {Icons.bazaar({ size: 22, color: T.accent })}
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>Bazaar</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm" icon={Icons.plus({ size: 13 })} onClick={openAddMarketplace}>
              Add Marketplace
            </Btn>
            <Btn size="sm" icon={Icons.plus({ size: 13 })} onClick={openAddPlugin}>
              Add Plugin
            </Btn>
          </div>
        </div>
        <p style={{ fontSize: 13, color: T.textSecondary, margin: 0 }}>
          Discover marketplaces — curated collections of plugins bundled with agents, skills, commands, hooks, and MCP servers.
        </p>
      </div>

      {/* How it works */}
      <Card style={{
        padding: 18, marginBottom: 24,
        background: `linear-gradient(135deg, ${T.accentMuted}, transparent)`,
        border: `1px solid ${T.accent}33`,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[
            { n: '1', t: 'Marketplaces', d: 'A marketplace.json file lists a set of plugins. Owned by a user or team, often a GitHub repo.' },
            { n: '2', t: 'Plugins', d: 'A folder with plugin.json + agents, commands, skills, hooks, MCP servers. Composable units of behavior.' },
            { n: '3', t: 'Install', d: "Pull a marketplace, then enable individual plugins. Each plugin's components register automatically." },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11, flexShrink: 0,
                background: T.accent, color: '#fff', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.n}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Featured marketplaces */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: T.text,
          display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icons.award({ size: 15, color: T.amber })} Featured marketplaces
        </h2>
        <button onClick={onOpenMarketplaces} style={{
          background: 'none', border: 'none', fontSize: 12, color: T.accentText,
          cursor: 'pointer', fontFamily: T.font,
        }}>Browse all {marketplaces.length} →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
        {featured.map(m => <MarketplaceCard key={m.name} m={m} onClick={() => onOpenMarketplace(m)} />)}
      </div>

      {/* Top plugins */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: T.text,
          display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icons.trending({ size: 15, color: T.pink })} Top plugins
        </h2>
        <button onClick={onOpenPlugins} style={{
          background: 'none', border: 'none', fontSize: 12, color: T.accentText,
          cursor: 'pointer', fontFamily: T.font,
        }}>Browse all {plugins.length} →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 28 }}>
        {topPlugins.map(p => <PluginCardCompact key={p.id} p={p} onClick={() => onOpenPlugin(p)} />)}
      </div>

      {/* MCP Registry promo */}
      <Card hoverable onClick={onSwitchToMcp} style={{
        padding: '16px 20px',
        background: `linear-gradient(135deg, ${T.tealMuted}, transparent)`,
        border: `1px solid ${T.teal}33`,
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: T.teal + '22', border: `1px solid ${T.teal}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {Icons.server({ size: 18, color: T.teal })}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 2 }}>MCP Registry</div>
          <div style={{ fontSize: 12, color: T.textSecondary }}>
            Browse the official Model Context Protocol server registry — install and manage MCP integrations.
          </div>
        </div>
        {Icons.chevRight({ size: 16, color: T.textMuted })}
      </Card>
    </div>
  );
}

// =============================================================================
// CARDS
// =============================================================================

function MarketplaceCard({ m, onClick }) {
  return (
    <Card hoverable onClick={onClick} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 15, fontWeight: 700,
          boxShadow: `0 4px 12px ${T.accent}33`,
        }}>{(m.name || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</h3>
            {m.official && <Badge color={T.accent} solid style={{ fontSize: 9 }}>OFFICIAL</Badge>}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted }}>by {typeof m.owner === 'object' ? m.owner.name : m.owner}</div>
        </div>
      </div>
      <p style={{ fontSize: 12.5, color: T.textSecondary, margin: 0, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {m.description}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: T.textMuted,
        paddingTop: 10, borderTop: `1px solid ${T.border}`, marginTop: 'auto' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {Icons.package({ size: 11 })} {m.stats.plugins}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {Icons.star({ size: 11, color: T.amber })} {m.stats.stars}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          {Icons.download({ size: 11 })} {m.stats.installs.toLocaleString()}
        </span>
        <span style={{ marginLeft: 'auto' }}>{m.updated}</span>
      </div>
    </Card>
  );
}

function PluginCardCompact({ p, onClick }) {
  return (
    <Card hoverable onClick={onClick} style={{ padding: 14, display: 'flex', gap: 12 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 8, flexShrink: 0,
        background: T.surface, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>{p.icon || Icons.puzzle({ size: 18, color: T.textMuted })}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</h3>
          <span style={{ fontSize: 11, color: T.textMuted }}>v{p.version}</span>
          {p.official && <Badge color={T.accent} solid style={{ fontSize: 9 }}>OFFICIAL</Badge>}
        </div>
        <p style={{ fontSize: 12, color: T.textSecondary, margin: '0 0 6px', lineHeight: 1.45,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {p.description}
        </p>
        <div style={{ fontSize: 11, color: T.textMuted, display: 'flex', gap: 10 }}>
          <span>★ {p.stats.stars}</span>
          <span>↓ {p.stats.installs}</span>
          <span style={{ marginLeft: 'auto' }}>{p.marketplace}</span>
        </div>
      </div>
    </Card>
  );
}

// =============================================================================
// LISTS
// =============================================================================

function MarketplacesList({ onBack, onOpen }) {
  const { marketplaces, openAddMarketplace } = React.useContext(BazaarCtx);
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    return !q ? marketplaces : marketplaces.filter(m =>
      m.name.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q)
    );
  }, [marketplaces, query]);

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1080, margin: '0 auto' }}>
      <div onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 16,
        cursor: 'pointer', color: T.textMuted, fontSize: 13,
      }}>{Icons.chevLeft({ size: 13 })} Bazaar</div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>Marketplaces</h1>
          <p style={{ fontSize: 13, color: T.textSecondary, margin: '4px 0 0' }}>
            {marketplaces.length} marketplaces · {marketplaces.reduce((a, m) => a + (m.stats?.plugins || 0), 0)} plugins total
          </p>
        </div>
        <Btn icon={Icons.plus({ size: 14 })} onClick={openAddMarketplace}>Add from GitHub</Btn>
      </div>

      <Input placeholder="Search marketplaces..." value={query} onChange={e => setQuery(e.target.value)}
        icon={Icons.search({ size: 14, color: T.textMuted })} style={{ marginBottom: 16 }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtered.map(m => <MarketplaceCard key={m.name} m={m} onClick={() => onOpen(m)} />)}
      </div>
    </div>
  );
}

function PluginsList({ onBack, onOpen }) {
  const { marketplaces, plugins, openAddPlugin } = React.useContext(BazaarCtx);
  const [query, setQuery] = React.useState('');
  const [activeMarketplace, setActiveMarketplace] = React.useState(null);
  const [sort, setSort] = React.useState('popular');

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase();
    const result = plugins.filter(p => {
      if (q && !(p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))) return false;
      if (activeMarketplace && p.marketplace !== activeMarketplace) return false;
      return true;
    });
    return result.sort((a, b) => {
      if (sort === 'popular') return b.stats.installs - a.stats.installs;
      if (sort === 'stars') return b.stats.stars - a.stats.stars;
      if (sort === 'recent') return (b.updated || b.lastUpdated || '').localeCompare(a.updated || a.lastUpdated || '');
      return a.name.localeCompare(b.name);
    });
  }, [plugins, query, activeMarketplace, sort]);

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1080, margin: '0 auto' }}>
      <div onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 16,
        cursor: 'pointer', color: T.textMuted, fontSize: 13,
      }}>{Icons.chevLeft({ size: 13 })} Bazaar</div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, color: T.text }}>Plugins</h1>
          <p style={{ fontSize: 13, color: T.textSecondary, margin: '4px 0 0' }}>
            Browse {plugins.length} plugins across {marketplaces.length} marketplaces.
          </p>
        </div>
        <Btn icon={Icons.plus({ size: 14 })} onClick={openAddPlugin}>Add from GitHub</Btn>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <Input placeholder="Search plugins..." value={query} onChange={e => setQuery(e.target.value)}
          icon={Icons.search({ size: 14, color: T.textMuted })} style={{ flex: 1 }} />
        <select value={sort} onChange={e => setSort(e.target.value)} style={{
          fontFamily: T.font, fontSize: 13, padding: '7px 11px',
          border: `1px solid ${T.border}`, borderRadius: T.radius,
          background: T.surfaceRaised, color: T.textSecondary, boxShadow: T.shadow1,
        }}>
          <option value="popular">Most installed</option>
          <option value="stars">Most stars</option>
          <option value="recent">Recently updated</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
        <Pill active={!activeMarketplace} onClick={() => setActiveMarketplace(null)}>All</Pill>
        {marketplaces.map(m => (
          <Pill key={m.name} active={activeMarketplace === m.name}
            onClick={() => setActiveMarketplace(activeMarketplace === m.name ? null : m.name)}>
            {m.name}
          </Pill>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
        {filtered.map(p => <PluginCardCompact key={p.id} p={p} onClick={() => onOpen(p)} />)}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: T.textMuted, fontSize: 14 }}>
          No plugins match your filters.
        </div>
      )}
    </div>
  );
}

function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 12, padding: '4px 10px', borderRadius: 999,
      border: `1px solid ${active ? T.accent : T.border}`,
      background: active ? T.accent : T.surfaceRaised,
      color: active ? '#fff' : T.textSecondary,
      cursor: 'pointer', fontFamily: T.font, transition: 'all 0.12s',
    }}>{children}</button>
  );
}

// =============================================================================
// MARKETPLACE DETAIL
// =============================================================================

function MarketplaceDetail({ marketplace: m, onBack, onOpenPlugin }) {
  const { plugins } = React.useContext(BazaarCtx);
  const [tab, setTab] = React.useState('plugins');
  const includedPlugins = plugins.filter(p => p.marketplace === m.name);

  const manifestJSON = JSON.stringify({
    name: m.name,
    owner: m.metadata?.maintainer
      ? { name: m.metadata.maintainer.name, ...(m.metadata.maintainer.email ? { email: m.metadata.maintainer.email } : {}), ...(m.metadata.maintainer.url ? { url: m.metadata.maintainer.url } : {}) }
      : (typeof m.owner === 'string' ? { name: m.owner } : m.owner),
    description: m.description,
    metadata: m.metadata ? {
      version: m.metadata.version,
      license: m.metadata.license,
      keywords: m.metadata.keywords,
      category: m.metadata.category,
      ...(m.metadata.homepage ? { homepage: m.metadata.homepage } : {}),
      ...(m.metadata.repository ? { repository: m.metadata.repository } : {}),
    } : {},
    plugins: m.plugins || [],
  }, null, 2);

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1080, margin: '0 auto' }}>
      <div onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 16,
        cursor: 'pointer', color: T.textMuted, fontSize: 13,
      }}>{Icons.chevLeft({ size: 13 })} Bazaar</div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 18 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 12, flexShrink: 0,
          background: `linear-gradient(135deg, ${T.accent}, ${T.purple})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 26, fontWeight: 700,
          boxShadow: `0 8px 24px ${T.accent}44`,
        }}>{(m.name || '?')[0].toUpperCase()}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: T.text }}>{m.name}</h1>
            {m.official && <Badge color={T.accent} solid>OFFICIAL</Badge>}
            {m.metadata?.version && <Badge color={T.textMuted}>v{m.metadata.version}</Badge>}
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 8 }}>
            by <span style={{ color: T.accentText }}>
              {typeof m.owner === 'object' ? m.owner.name : m.owner}
            </span>
            {m.metadata?.license && <>{' · '}{m.metadata.license}</>}
            {m.metadata?.category && <>{' · '}{m.metadata.category}</>}
          </div>
          <p style={{ fontSize: 14, color: T.textSecondary, margin: 0, lineHeight: 1.55 }}>{m.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Btn icon={Icons.star({ size: 14 })}>Star</Btn>
          <Btn icon={Icons.fork({ size: 14 })}>Fork</Btn>
          <Btn variant="primary" icon={Icons.download({ size: 14, color: '#fff' })}>Add marketplace</Btn>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 24, padding: '14px 18px', marginBottom: 20,
        background: T.surfaceRaised, border: `1px solid ${T.border}`,
        borderRadius: T.radiusLg,
      }}>
        <Stat label="Plugins" value={m.stats?.plugins || 0} />
        <Divider />
        <Stat label="Stars" value={(m.stats?.stars || 0).toLocaleString()} />
        <Divider />
        <Stat label="Forks" value={m.stats?.forks || 0} />
        <Divider />
        <Stat label="Installs" value={(m.stats?.installs || 0).toLocaleString()} />
        <Divider />
        <Stat label="Updated" value={m.updated} />
      </div>

      <TabBar active={tab} onChange={setTab} tabs={[
        { id: 'plugins', label: 'Plugins', count: includedPlugins.length },
        { id: 'manifest', label: 'marketplace.json' },
        { id: 'schema', label: 'Schema' },
        { id: 'install', label: 'Install' },
        ...(m.metadata?.keywords ? [{ id: 'keywords', label: 'Keywords', count: m.metadata.keywords.length }] : []),
      ]} />

      <div style={{ marginTop: 18 }}>
        {tab === 'plugins' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {includedPlugins.map(p => <PluginCardCompact key={p.id} p={p} onClick={() => onOpenPlugin(p)} />)}
            {(m.plugins || []).filter(src => {
              const s = src.source;
              if (typeof s === 'string') return !s.startsWith('./');
              // Real marketplace.json format: source is an object {source, url/repo}
              return s?.source !== 'local' && s?.source !== 'path';
            }).map((ref, i) => {
              const s = ref.source;
              const display = typeof s === 'string' ? s : s?.url || s?.repo || JSON.stringify(s);
              return (
                <Card key={i} style={{ padding: 14, opacity: 0.7 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4,
                    display: 'flex', alignItems: 'center', gap: 4 }}>
                    {Icons.link({ size: 11 })} {ref.name || 'External reference'}
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 12, color: T.accentText, wordBreak: 'break-all' }}>
                    {display}
                  </div>
                  {ref.description && (
                    <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 4 }}>{ref.description}</div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {tab === 'manifest' && (
          <div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 6 }}>
              {Icons.file({ size: 12 })} <code style={{ fontFamily: T.mono, color: T.accentText }}>marketplace.json</code>
              <span>— root of marketplace repository</span>
            </div>
            <Card style={{ padding: 18, background: T.surfaceSunken }}>
              <SyntaxHL code={manifestJSON} lang="json" />
            </Card>
          </div>
        )}

        {tab === 'schema' && (
          <div>
            <p style={{ fontSize: 13, color: T.textSecondary, margin: '0 0 16px' }}>
              A marketplace is a JSON file that enumerates plugins. All marketplaces in the Bazaar follow this schema.
            </p>
            <Card style={{ padding: 20 }}>
              <DefList items={MARKETPLACE_SCHEMA} />
            </Card>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 10,
              display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: T.red }}>*</span> required field
            </div>
          </div>
        )}

        {tab === 'install' && (
          <div>
            <p style={{ fontSize: 13, color: T.textSecondary, margin: '0 0 14px' }}>
              Adding a marketplace makes all its plugins available to install.
            </p>
            <Card style={{ padding: 18, background: T.surfaceSunken, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, fontFamily: T.mono }}># Add this marketplace</div>
              <SyntaxHL code={`stash marketplace add ${typeof m.owner === 'object' ? m.owner.name : m.owner}/${m.name}\nstash marketplace add ${m.metadata?.repository || 'git@github.com:' + (typeof m.owner === 'object' ? m.owner.name : m.owner) + '/' + m.name + '.git'}`} lang="bash" />
            </Card>
            <Card style={{ padding: 18, background: T.surfaceSunken }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, fontFamily: T.mono }}># Then install individual plugins</div>
              <SyntaxHL code={`stash plugin install ${m.name}/plex-deployer\nstash plugin install ${m.name}/nginx-config-manager --agent claude-code`} lang="bash" />
            </Card>
          </div>
        )}

        {tab === 'keywords' && m.metadata?.keywords && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {m.metadata.keywords.map(k => (
              <span key={k} style={{
                fontSize: 13, padding: '6px 12px', borderRadius: 999,
                background: T.surfaceRaised, color: T.textSecondary,
                border: `1px solid ${T.border}`,
                display: 'inline-flex', alignItems: 'center', gap: 5,
              }}>{Icons.hash({ size: 11, color: T.textMuted })}{k}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const Stat = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    <div style={{ fontSize: 16, fontWeight: 600, color: T.text, marginTop: 2 }}>{value}</div>
  </div>
);
const Divider = () => <div style={{ width: 1, background: T.border }} />;

// =============================================================================
// PLUGIN DETAIL (full, schema-complete)
// =============================================================================

function PluginDetailFull({ plugin: p, onBack, onOpenMarketplace }) {
  const { marketplaces } = React.useContext(BazaarCtx);
  const [tab, setTab] = React.useState('overview');

  const pluginJSON = JSON.stringify({
    name: p.name,
    version: p.version,
    description: p.description,
    ...(p.author ? { author: p.author } : {}),
    ...(p.homepage ? { homepage: p.homepage } : {}),
    ...(p.repository ? { repository: p.repository } : {}),
    ...(p.license ? { license: p.license } : {}),
    ...(p.keywords ? { keywords: p.keywords } : {}),
    ...(p.category ? { category: p.category } : {}),
    ...(p.icon ? { icon: p.icon } : {}),
    ...(p.strict !== undefined ? { strict: p.strict } : {}),
    ...(p.commands ? { commands: p.commands.map(c => ({ ...(c.file ? { file: c.file } : {}), ...(c.name ? { name: c.name } : {}), ...(c.desc ? { desc: c.desc } : {}) })) } : {}),
    ...(p.agents ? { agents: p.agents.map(a => ({ ...(a.file ? { file: a.file } : {}), ...(a.name ? { name: a.name } : {}), ...(a.desc ? { desc: a.desc } : {}) })) } : {}),
    ...(p.skills ? { skills: p.skills.map(s => ({ ...(s.file ? { file: s.file } : {}), ...(s.name ? { name: s.name } : {}) })) } : {}),
    ...(p.hooks ? { hooks: p.hooks } : {}),
    ...(p.mcpServers ? { mcpServers: p.mcpServers } : {}),
  }, null, 2);

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1080, margin: '0 auto' }}>
      <div onClick={onBack} style={{
        display: 'inline-flex', alignItems: 'center', gap: 5, marginBottom: 16,
        cursor: 'pointer', color: T.textMuted, fontSize: 13,
      }}>{Icons.chevLeft({ size: 13 })} Bazaar</div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 18 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 14, flexShrink: 0,
          background: T.surfaceRaised, border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 30,
        }}>{p.icon || Icons.puzzle({ size: 28, color: T.textMuted })}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: T.text }}>{p.name}</h1>
            <Badge color={T.textMuted}>v{p.version}</Badge>
            {p.status === 'draft' && <Badge color={T.orange}>Draft</Badge>}
            {p.official && <Badge color={T.accent} solid>OFFICIAL</Badge>}
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 8 }}>
            in{' '}
            <span onClick={() => {
              const mkt = marketplaces.find(m => m.name === p.marketplace);
              if (mkt) onOpenMarketplace(mkt);
            }} style={{ color: T.accentText, cursor: 'pointer', textDecoration: 'underline' }}>
              {p.marketplace}
            </span>
            {p.license && <>{' · '}{p.license}</>}
            {p.category && <>{' · '}{p.category}</>}
          </div>
          <p style={{ fontSize: 14, color: T.textSecondary, margin: 0, lineHeight: 1.55 }}>{p.description}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Btn icon={Icons.star({ size: 14 })}>Star</Btn>
          <Btn icon={Icons.share({ size: 14 })}>Share</Btn>
          <Btn variant="primary" icon={Icons.download({ size: 14, color: '#fff' })}>Install</Btn>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 24, padding: '14px 18px', marginBottom: 20,
        background: T.surfaceRaised, border: `1px solid ${T.border}`,
        borderRadius: T.radiusLg,
      }}>
        <Stat label="Stars" value={p.stats.stars} />
        <Divider />
        <Stat label="Installs" value={p.stats.installs} />
        <Divider />
        <Stat label="Forks" value={p.stats.forks} />
        <Divider />
        <Stat label="Deployed on" value={`${p.stats.deployedOn} devices`} />
        <Divider />
        <Stat label="Updated" value={p.updated} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        <ComponentChip icon={Icons.terminal} color={T.accent} label="Commands" count={p.commands?.length || 0} />
        <ComponentChip icon={Icons.users} color={T.purple} label="Agents" count={p.agents?.length || 0} />
        <ComponentChip icon={Icons.zap} color={T.amber} label="Skills" count={p.skills?.length || 0} />
        <ComponentChip icon={Icons.git} color={T.green} label="Hooks" count={Object.values(p.hooks || {}).flat().length} />
        <ComponentChip icon={Icons.server} color={T.teal} label="MCP servers" count={Object.keys(p.mcpServers || {}).length} />
      </div>

      <TabBar active={tab} onChange={setTab} tabs={[
        { id: 'overview', label: 'Overview' },
        { id: 'manifest', label: 'plugin.json' },
        { id: 'structure', label: 'Structure' },
        { id: 'schema', label: 'Schema' },
        { id: 'components', label: 'Components' },
        { id: 'install', label: 'Install' },
      ]} />

      <div style={{ marginTop: 18 }}>
        {tab === 'overview' && <PluginOverview p={p} />}
        {tab === 'manifest' && (
          <div>
            <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 6 }}>
              {Icons.file({ size: 12 })} <code style={{ fontFamily: T.mono, color: T.accentText }}>.claude-plugin/plugin.json</code>
            </div>
            <Card style={{ padding: 18, background: T.surfaceSunken }}>
              <SyntaxHL code={pluginJSON} lang="json" />
            </Card>
          </div>
        )}
        {tab === 'structure' && <PluginStructure p={p} />}
        {tab === 'schema' && (
          <div>
            <p style={{ fontSize: 13, color: T.textSecondary, margin: '0 0 16px' }}>
              Complete field reference for <code style={{ fontFamily: T.mono, color: T.accentText, background: T.surfaceRaised, padding: '1px 6px', borderRadius: 3 }}>plugin.json</code>.
              Anchored in the root at <code style={{ fontFamily: T.mono, color: T.accentText }}>.claude-plugin/plugin.json</code>.
            </p>
            <Card style={{ padding: 20, marginBottom: 16 }}>
              <DefList items={PLUGIN_SCHEMA} />
            </Card>
            <div style={{ fontSize: 12, color: T.textMuted,
              display: 'flex', alignItems: 'center', gap: 4, marginBottom: 20 }}>
              <span style={{ color: T.red }}>*</span> required field
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: '0 0 10px' }}>Directory conventions</h3>
            <Card style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '10px 16px', fontSize: 13 }}>
                {PLUGIN_STRUCTURE.map((item, i) => (
                  <React.Fragment key={i}>
                    <code style={{ fontFamily: T.mono, color: T.accentText, fontSize: 12.5 }}>{item.path}</code>
                    <span style={{ color: T.textSecondary, lineHeight: 1.55 }}>{item.desc}</span>
                  </React.Fragment>
                ))}
              </div>
            </Card>
          </div>
        )}
        {tab === 'components' && <PluginComponents p={p} />}
        {tab === 'install' && <PluginInstall p={p} />}
      </div>
    </div>
  );
}

function ComponentChip({ icon, color, label, count }) {
  return (
    <div style={{
      padding: '10px 12px', background: T.surfaceRaised,
      border: `1px solid ${T.border}`, borderRadius: T.radius,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        background: color + '22', border: `1px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon({ size: 14, color })}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: T.text, lineHeight: 1.2 }}>{count}</div>
      </div>
    </div>
  );
}

function PluginOverview({ p }) {
  const mdBody = `# ${p.name}

${p.description}

## What's included

- **${p.commands?.length || 0} commands** — invoked via slash commands in the agent shell.
- **${p.agents?.length || 0} agents** — specialized subagents activated by context.
- **${p.skills?.length || 0} skills** — reusable procedural knowledge.
- **${Object.values(p.hooks || {}).flat().length} hooks** — wrap tool calls for validation, logging, gating.
${p.mcpServers ? `- **${Object.keys(p.mcpServers).length} MCP servers** — bundled external capabilities.` : ''}

## Quick install

\`\`\`
stash plugin install ${p.marketplace}/${p.name}
\`\`\`

## Repository

See [${p.homepage || p.repository || p.marketplace}](stash://marketplace/${p.marketplace}) for source and contribution guidelines.
`;

  return (
    <Card style={{ padding: 24, background: T.surfaceRaised }}>
      <SyntaxHL code={mdBody} lang="md" />
    </Card>
  );
}

function PluginStructure({ p }) {
  const defaultTree = [
    { name: '.claude-plugin/', type: 'folder', children: [{ name: 'plugin.json', type: 'file' }] },
    { name: 'commands/', type: 'folder' },
    { name: 'agents/', type: 'folder' },
    { name: 'skills/', type: 'folder' },
    { name: 'hooks/', type: 'folder' },
    { name: 'README.md', type: 'file' },
  ];
  const tree = p.files || defaultTree;

  return (
    <div>
      <p style={{ fontSize: 13, color: T.textSecondary, margin: '0 0 14px' }}>
        How the plugin is laid out on disk. <code style={{ fontFamily: T.mono, color: T.accentText, background: T.surfaceRaised, padding: '1px 5px', borderRadius: 3 }}>.claude-plugin/plugin.json</code> is the entry point.
      </p>
      <Card style={{ padding: 18, background: T.surfaceSunken }}>
        <FileTree nodes={tree} depth={0} />
      </Card>
    </div>
  );
}

function FileTree({ nodes, depth }) {
  return (
    <div style={{ fontFamily: T.mono, fontSize: 12.5, lineHeight: 1.8 }}>
      {nodes.map((n, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: depth * 16 }}>
            {n.type === 'folder'
              ? Icons.folder({ size: 13, color: T.accentText })
              : Icons.file({ size: 13, color: T.textMuted })}
            <span style={{ color: n.type === 'folder' ? T.text : T.textSecondary,
              fontWeight: n.type === 'folder' ? 500 : 400 }}>{n.name}</span>
            {n.type === 'file' && n.name === 'plugin.json' && (
              <span style={{ fontSize: 10, color: T.amber, marginLeft: 4, fontFamily: T.font }}>manifest</span>
            )}
          </div>
          {n.children && <FileTree nodes={n.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

function PluginComponents({ p }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {p.commands && p.commands.length > 0 && (
        <ComponentSection title="Commands" icon={Icons.terminal} color={T.accent}
          items={p.commands.map(c => ({ primary: `/${c.name || '?'}`, secondary: c.desc, tertiary: c.file }))} />
      )}
      {p.agents && p.agents.length > 0 && (
        <ComponentSection title="Agents" icon={Icons.users} color={T.purple}
          items={p.agents.map(a => ({ primary: a.name || '?', secondary: a.desc, tertiary: a.file }))} />
      )}
      {p.skills && p.skills.length > 0 && (
        <ComponentSection title="Skills" icon={Icons.zap} color={T.amber}
          items={p.skills.map(s => ({ primary: s.name || '?', secondary: null, tertiary: s.file }))} />
      )}
      {p.hooks && Object.keys(p.hooks).length > 0 && (
        <ComponentSection title="Hooks" icon={Icons.git} color={T.green}
          items={Object.entries(p.hooks).flatMap(([event, matchers]) =>
            matchers.map(m => ({
              primary: event,
              secondary: `matcher: ${m.matcher}`,
              tertiary: m.hooks?.[0]?.command,
            }))
          )} />
      )}
      {p.mcpServers && Object.keys(p.mcpServers).length > 0 && (
        <ComponentSection title="MCP servers" icon={Icons.server} color={T.teal}
          items={Object.entries(p.mcpServers).map(([name, cfg]) => ({
            primary: name,
            secondary: `${cfg.command} ${(cfg.args || []).join(' ')}`,
            tertiary: cfg.env ? `env: ${Object.keys(cfg.env).join(', ')}` : null,
          }))} />
      )}
    </div>
  );
}

function ComponentSection({ title, icon, color, items }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 5,
          background: color + '22', border: `1px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon({ size: 13, color })}</div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: T.text, margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 11, color: T.textMuted }}>({items.length})</span>
      </div>
      <Card style={{ overflow: 'hidden' }}>
        {items.map((it, i) => (
          <div key={i} style={{
            padding: '10px 14px',
            borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : 'none',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: T.mono, fontSize: 12.5, color: T.accentText, fontWeight: 500 }}>
                {it.primary}
              </div>
              {it.secondary && (
                <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>{it.secondary}</div>
              )}
            </div>
            {it.tertiary && (
              <code style={{ fontFamily: T.mono, fontSize: 11, color: T.textMuted,
                background: T.surfaceSunken, padding: '2px 6px', borderRadius: 3,
                maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {it.tertiary}
              </code>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

function PluginInstall({ p }) {
  return (
    <div>
      <p style={{ fontSize: 13, color: T.textSecondary, margin: '0 0 14px' }}>
        Install {p.name} into your stash. The plugin's components register automatically.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase',
            letterSpacing: 0.5, marginBottom: 10, fontWeight: 600 }}>From marketplace</div>
          <Card style={{ padding: 12, background: T.surfaceSunken, marginBottom: 0 }}>
            <SyntaxHL code={`stash plugin install ${p.marketplace}/${p.name}`} lang="bash" />
          </Card>
        </Card>
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase',
            letterSpacing: 0.5, marginBottom: 10, fontWeight: 600 }}>Pin a version</div>
          <Card style={{ padding: 12, background: T.surfaceSunken, marginBottom: 0 }}>
            <SyntaxHL code={`stash plugin install ${p.marketplace}/${p.name}@${p.version}`} lang="bash" />
          </Card>
        </Card>
      </div>
      <Card style={{ padding: 18, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase',
          letterSpacing: 0.5, marginBottom: 10, fontWeight: 600 }}>Deploy to agents</div>
        <Card style={{ padding: 12, background: T.surfaceSunken }}>
          <SyntaxHL code={`# Enable for a specific agent
stash plugin enable ${p.name} --agent claude-code

# Enable everywhere
stash plugin enable ${p.name} --all

# Scope to a device
stash plugin enable ${p.name} --device dookie`} lang="bash" />
        </Card>
      </Card>
      {p.mcpServers && Object.keys(p.mcpServers).length > 0 && (
        <Card style={{ padding: 18,
          background: `linear-gradient(135deg, ${T.tealMuted}, transparent)`,
          border: `1px solid ${T.teal}33` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            {Icons.server({ size: 14, color: T.teal })}
            <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Requires MCP setup</div>
          </div>
          <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5 }}>
            This plugin includes {Object.keys(p.mcpServers).length} MCP server(s). You may need to provide environment variables like API keys on install.
          </div>
        </Card>
      )}
    </div>
  );
}

Object.assign(window, {
  Bazaar, BazaarHome, MarketplacesList, PluginsList,
  MarketplaceDetail, PluginDetailFull,
  MARKETPLACES, PLUGINS, PLUGIN_SCHEMA, MARKETPLACE_SCHEMA, PLUGIN_STRUCTURE,
});
