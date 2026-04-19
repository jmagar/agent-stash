// Agent Stash — Agent CLI Panel (Light)

function AgentCLI({ isOpen, onToggle }) {
  const [input, setInput] = React.useState('');
  const [lines, setLines] = React.useState([
    { type: 'sys', text: 'agent-stash v0.4.0 · dookie.local' },
    { type: 'sys', text: 'watching ~/projects ~/.claude ~/.codex' },
    { type: 'sys', text: 'agents: claude-code codex gemini' },
    { type: 'br' },
    { type: 'agent', agent: 'claude-code', text: 'session complete — jellyfin docker deploy on dookie' },
    { type: 'sub', text: 'uploaded docs/sessions/2026-04-17-jellyfin-docker-deploy.md' },
    { type: 'sub', text: 'updated agents/homelab-ops.md → v14' },
    { type: 'br' },
    { type: 'agent', agent: 'codex', text: 'resolved stash://skills/nginx-conf-gen/SKILL.md' },
    { type: 'br' },
    { type: 'user', text: 'check stash://docs/plans/deployment-checklist.md' },
    { type: 'agent', agent: 'claude-code', text: 'resolving deeplink...' },
    { type: 'sub', text: 'view docs/plans/deployment-checklist.md' },
    { type: 'agent', agent: 'claude-code', text: 'loaded. 12 items, 8 done. work through remaining 4?' },
    { type: 'br' },
    { type: 'event', text: 'draft: "GPU passthrough config" on plex-deployer (codex)' },
    { type: 'event', text: 'claude-code approved draft — "tested on dookie"' },
    { type: 'br' },
    { type: 'agent', agent: 'gemini', text: 'synced skills/docker-compose-gen macbook-pro → stash v3→v4' },
    { type: 'sub', text: '+12 -3 lines (health check templates)' },
  ]);

  const scrollRef = React.useRef(null);
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLines(prev => [...prev, { type: 'br' }, { type: 'user', text: input }, { type: 'sys', text: '...' }]);
    const cmd = input;
    setTimeout(() => {
      setLines(prev => {
        const next = [...prev];
        next[next.length - 1] = { type: 'agent', agent: 'claude-code', text: `ack: "${cmd}"` };
        return next;
      });
    }, 600);
    setInput('');
  };

  if (!isOpen) return null;

  const agentColors = { 'claude-code': T.accent, 'codex': T.green, 'gemini': T.purple };

  return (
    <div style={{
      width: 380, borderLeft: `1px solid ${T.border}`, background: T.surface,
      display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px', borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: T.text }}>Activity</span>
        <button onClick={onToggle} style={{
          background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 2,
        }}>{Icons.x({ size: 14 })}</button>
      </div>

      <div ref={scrollRef} style={{
        flex: 1, overflow: 'auto', padding: '8px 14px', fontFamily: T.mono, fontSize: 11.5, lineHeight: 1.65,
      }}>
        {lines.map((line, i) => {
          if (line.type === 'br') return <div key={i} style={{ height: 8 }} />;
          if (line.type === 'sys') return <div key={i} style={{ color: T.textMuted }}>{line.text}</div>;
          if (line.type === 'event') return <div key={i} style={{ color: T.textSecondary }}>· {line.text}</div>;
          if (line.type === 'sub') return <div key={i} style={{ color: T.textMuted, paddingLeft: 14 }}>→ {line.text}</div>;
          if (line.type === 'user') return (
            <div key={i}><span style={{ color: T.accent, fontWeight: 600 }}>$ </span><span style={{ color: T.text }}>{line.text}</span></div>
          );
          if (line.type === 'agent') {
            return (
              <div key={i}>
                <span style={{ color: agentColors[line.agent] || T.text, fontWeight: 500 }}>{line.agent}</span>
                <span style={{ color: T.textSecondary }}> {line.text}</span>
              </div>
            );
          }
          return null;
        })}
      </div>

      <form onSubmit={handleSubmit} style={{
        borderTop: `1px solid ${T.border}`, padding: '10px 14px', display: 'flex', gap: 6,
        background: T.bg,
      }}>
        <span style={{ color: T.accent, fontFamily: T.mono, fontSize: 12, lineHeight: '26px', fontWeight: 600 }}>$</span>
        <input value={input} onChange={e => setInput(e.target.value)}
          placeholder="stash deploy ..."
          style={{
            flex: 1, background: 'none', border: 'none', outline: 'none',
            color: T.text, fontFamily: T.mono, fontSize: 12,
          }} />
      </form>
    </div>
  );
}

Object.assign(window, { AgentCLI });
