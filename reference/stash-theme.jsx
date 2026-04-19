// Agent Stash — Theme v5 (Dark)

const T = {
  // Surfaces — layered dark tones
  bg: '#0b0d12',              // main canvas (deepest)
  surface: '#111419',          // sidebar / subtle surface
  surfaceRaised: '#161a21',    // cards, raised panels
  surfaceHover: '#1d222c',
  surfaceSunken: '#0a0c10',
  // Borders
  border: '#1f2530',
  borderLight: '#2a313e',
  borderStrong: '#363e4d',
  // Accent (indigo → cyan feels)
  accent: '#6366f1',
  accentHover: '#818cf8',
  accentMuted: 'rgba(99,102,241,0.12)',
  accentSoft: 'rgba(99,102,241,0.22)',
  accentText: '#a5b4fc',
  // Palette
  green: '#22c55e', greenMuted: 'rgba(34,197,94,0.14)',
  orange: '#f59e0b', orangeMuted: 'rgba(245,158,11,0.14)',
  red: '#ef4444', redMuted: 'rgba(239,68,68,0.14)',
  purple: '#a855f7', purpleMuted: 'rgba(168,85,247,0.14)',
  pink: '#ec4899', pinkMuted: 'rgba(236,72,153,0.14)',
  teal: '#14b8a6', tealMuted: 'rgba(20,184,166,0.14)',
  amber: '#eab308', amberMuted: 'rgba(234,179,8,0.14)',
  indigo: '#818cf8', indigoMuted: 'rgba(129,140,248,0.14)',
  // Text
  text: '#e6e8ef',
  textSecondary: '#aab1be',
  textMuted: '#6b7280',
  // Shadows — stronger, for dark UI
  shadow1: '0 1px 2px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.03)',
  shadow2: '0 2px 6px rgba(0, 0, 0, 0.4), 0 6px 20px rgba(0, 0, 0, 0.3)',
  shadow3: '0 4px 12px rgba(0, 0, 0, 0.5), 0 16px 40px rgba(0, 0, 0, 0.35)',
  shadow4: '0 12px 40px rgba(0, 0, 0, 0.6), 0 24px 70px rgba(0, 0, 0, 0.5)',
  font: '"DM Sans", -apple-system, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
  radius: 6,
  radiusSm: 4,
  radiusLg: 10,
};

const Icon = ({ d, size = 16, color = 'currentColor', style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
    style={{ display: 'block', flexShrink: 0, ...style }}>
    <path d={d} />
  </svg>
);

const Icons = {
  folder: (p) => <Icon {...p} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
  file: (p) => <Icon {...p} d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6" />,
  search: (p) => <Icon {...p} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  grid: (p) => <Icon {...p} d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />,
  list: (p) => <Icon {...p} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
  chevRight: (p) => <Icon {...p} d="M9 18l6-6-6-6" />,
  chevDown: (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  chevLeft: (p) => <Icon {...p} d="M15 18l-6-6 6-6" />,
  star: (p) => <Icon {...p} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  clock: (p) => <Icon {...p} d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 6v6l4 2" />,
  terminal: (p) => <Icon {...p} d="M4 17l6-5-6-5M12 19h8" />,
  box: (p) => <Icon {...p} d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />,
  zap: (p) => <Icon {...p} d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  users: (p) => <Icon {...p} d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />,
  settings: (p) => <Icon {...p} d="M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />,
  download: (p) => <Icon {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  upload: (p) => <Icon {...p} d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  link: (p) => <Icon {...p} d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />,
  git: (p) => <Icon {...p} d="M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9" />,
  comment: (p) => <Icon {...p} d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />,
  code: (p) => <Icon {...p} d="M16 18l6-6-6-6M8 6l-6 6 6 6" />,
  deploy: (p) => <Icon {...p} d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22V15.5M22 8.5L12 15.5 2 8.5" />,
  draft: (p) => <Icon {...p} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />,
  idea: (p) => <Icon {...p} d="M9 18h6M10 22h4M12 2a7 7 0 015 11.9V17H7v-3.1A7 7 0 0112 2z" />,
  home: (p) => <Icon {...p} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />,
  copy: (p) => <Icon {...p} d="M20 9h-9a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2zM5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />,
  share: (p) => <Icon {...p} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />,
  check: (p) => <Icon {...p} d="M20 6L9 17l-5-5" />,
  x: (p) => <Icon {...p} d="M18 6L6 18M6 6l12 12" />,
  eye: (p) => <Icon {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 100-6 3 3 0 000 6z" />,
  history: (p) => <Icon {...p} d="M3 3v5h5M3 8a9 9 0 1018 0 9 9 0 00-18 0zM12 7v5l3 3" />,
  server: (p) => <Icon {...p} d="M2 2h20v8H2zM2 14h20v8H2zM6 6h.01M6 18h.01" />,
  puzzle: (p) => <Icon {...p} d="M19.4 7.85c0 .32.06.65.29.88l1.57 1.57c.47.47.7 1.09.7 1.7s-.23 1.23-.7 1.7l-1.61 1.62a.98.98 0 01-.84.28c-.47-.07-.8-.48-.97-.93a2.5 2.5 0 10-3.21 3.22c.44.16.85.5.92.96a.98.98 0 01-.28.84l-1.61 1.6a2.4 2.4 0 01-1.71.71 2.4 2.4 0 01-1.7-.7l-1.57-1.57a1.03 1.03 0 00-.88-.29c-.5.07-.84.5-1.02.97a2.5 2.5 0 11-3.24-3.24c.47-.18.9-.53.97-1.02a1.03 1.03 0 00-.29-.88L2.7 13.7A2.4 2.4 0 012 12c0-.62.24-1.23.71-1.7L4.32 8.7a.98.98 0 01.83-.28c.47.07.8.48.97.93a2.5 2.5 0 103.21-3.22c-.44-.16-.85-.5-.92-.96a.98.98 0 01.28-.84l1.6-1.61a2.4 2.4 0 013.41 0l1.57 1.57c.23.23.56.34.88.29.5-.08.84-.5 1.02-.97a2.5 2.5 0 113.24 3.24c-.47.18-.9.53-.97 1.02z" />,
  bold: (p) => <Icon {...p} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6zM6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />,
  italic: (p) => <Icon {...p} d="M19 4h-9M14 20H5M15 4L9 20" />,
  heading: (p) => <Icon {...p} d="M6 4v16M18 4v16M6 12h12" />,
  listOl: (p) => <Icon {...p} d="M10 6h11M10 12h11M10 18h11M3 5l2 1V4M3 11h2l-2 2M5 18H3l2-2" />,
  quote: (p) => <Icon {...p} d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .01-1 1.03V21zM15 21c3 0 7-1 7-8V5c0-1.25-.76-2.02-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z" />,
  bell: (p) => <Icon {...p} d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />,
  activity: (p) => <Icon {...p} d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  trending: (p) => <Icon {...p} d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6" />,
  globe: (p) => <Icon {...p} d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />,
  shield: (p) => <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  fork: (p) => <Icon {...p} d="M6 3v12a3 3 0 003 3h6a3 3 0 003-3V9M6 9a3 3 0 100-6 3 3 0 000 6zM18 9a3 3 0 100-6 3 3 0 000 6zM18 21a3 3 0 100-6 3 3 0 000 6z" />,
  bazaar: (p) => <Icon {...p} d="M3 9l1-5h16l1 5M3 9v11a1 1 0 001 1h16a1 1 0 001-1V9M3 9h18M8 14h8" />,
  tag: (p) => <Icon {...p} d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" />,
  package: (p) => <Icon {...p} d="M16.5 9.4L7.5 4.21M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />,
  hash: (p) => <Icon {...p} d="M4 9h16M4 15h16M10 3L8 21M16 3l-2 18" />,
  monitor: (p) => <Icon {...p} d="M2 3h20v14H2zM8 21h8M12 17v4" />,
  layers: (p) => <Icon {...p} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
  book: (p) => <Icon {...p} d="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 006.5 22H20v-4.5M4 19.5V5a2 2 0 012-2h14v14" />,
  scroll: (p) => <Icon {...p} d="M10 2v7a2 2 0 002 2h7M10 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V10l-8-8z" />,
  award: (p) => <Icon {...p} d="M12 15a6 6 0 100-12 6 6 0 000 12zM8.21 13.89L7 23l5-3 5 3-1.21-9.12" />,
  key: (p) => <Icon {...p} d="M21 2l-9.6 9.6M15.5 7.5l3 3M10 21a5 5 0 100-10 5 5 0 000 10z" />,
};

// Shared Utilities
function SyntaxHL({ code, lang }) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = code.split('\n');
  const isJSON = lang === 'json' || code.trim().startsWith('{');
  const isMD = lang === 'md' || lang === 'markdown';

  const hlJSON = (line) => {
    line = esc(line);
    return line.replace(/("(?:[^"\\]|\\.)*")\s*:/g, (m, k) => `<span style="color:${T.accentText}">${k}</span>:`)
      .replace(/:\s*("(?:[^"\\]|\\.)*")/g, (m, v) => `: <span style="color:${T.green}">${v}</span>`)
      .replace(/:\s*(true|false|null|\d+)/g, (m, v) => `: <span style="color:${T.orange}">${v}</span>`);
  };

  const hlMarkdown = (line) => {
    line = esc(line);
    if (line.match(/^#{1,4}\s/)) return `<span style="color:${T.text};font-weight:600">${line}</span>`;
    if (line.match(/^\s*[-*]\s/)) return `<span style="color:${T.accentText}">${line.match(/^\s*[-*]/)[0]}</span>${line.slice(line.match(/^\s*[-*]/)[0].length)}`;
    if (line.match(/^\s*\d+\.\s/)) return `<span style="color:${T.accentText}">${line.match(/^\s*\d+\./)[0]}</span>${line.slice(line.match(/^\s*\d+\./)[0].length)}`;
    if (line.match(/^```/)) return `<span style="color:${T.textMuted}">${line}</span>`;
    if (line.match(/^\s*>/)) return `<span style="color:${T.purple};font-style:italic">${line}</span>`;
    let r = line.replace(/`([^`]+)`/g, `<span style="background:${T.surfaceRaised};padding:1px 4px;border-radius:3px;font-size:0.92em;color:${T.accentText}">\`$1\`</span>`);
    r = r.replace(/\*\*([^*]+)\*\*/g, `<span style="font-weight:600;color:${T.text}">**$1**</span>`);
    r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, `<span style="color:${T.accentText};text-decoration:underline">[$1]($2)</span>`);
    r = r.replace(/(stash:\/\/[^\s]+)/g, `<span style="color:${T.accentText}">$1</span>`);
    return r;
  };

  const hlBash = (line) => {
    line = esc(line);
    if (line.match(/^\s*#/)) return `<span style="color:${T.textMuted}">${line}</span>`;
    let r = line.replace(/(--[\w-]+)/g, `<span style="color:${T.accentText}">$1</span>`);
    r = r.replace(/(\$\w+)/g, `<span style="color:${T.orange}">$1</span>`);
    return r;
  };

  const hl = isJSON ? hlJSON : isMD ? hlMarkdown : hlBash;

  return (
    <div style={{ display: 'flex', fontSize: 12 }}>
      <div style={{
        paddingRight: 12, textAlign: 'right', color: T.textMuted, userSelect: 'none',
        lineHeight: 1.7, fontSize: 11, opacity: 0.6, fontFamily: T.mono, minWidth: 32,
      }}>
        {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
      </div>
      <pre style={{
        margin: 0, fontFamily: T.mono, fontSize: 12.5, lineHeight: 1.7,
        color: T.textSecondary, whiteSpace: 'pre-wrap', flex: 1, overflowX: 'auto',
      }}>
        {lines.map((line, i) => (
          <div key={i} dangerouslySetInnerHTML={{ __html: hl(line, i) || '&nbsp;' }} />
        ))}
      </pre>
    </div>
  );
}

function Badge({ children, color = T.textSecondary, style = {}, solid = false }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 500,
      padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap',
      color: solid ? '#fff' : color,
      background: solid ? color : color + '1f',
      border: solid ? 'none' : `1px solid ${color}33`,
      ...style,
    }}>{children}</span>
  );
}

function Btn({ children, variant = 'default', size = 'sm', onClick, style = {}, icon }) {
  const [h, setH] = React.useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: T.font, fontSize: size === 'sm' ? 13 : 14,
    fontWeight: 500, cursor: 'pointer', borderRadius: T.radius,
    padding: size === 'sm' ? '6px 13px' : '8px 18px',
    whiteSpace: 'nowrap', lineHeight: 1.3, transition: 'all 0.15s ease',
  };
  const variants = {
    default: {
      background: h ? T.surfaceHover : T.surfaceRaised, color: T.text,
      border: `1px solid ${h ? T.borderStrong : T.border}`,
      boxShadow: h ? T.shadow2 : T.shadow1,
    },
    primary: {
      background: h ? T.accentHover : T.accent, color: '#fff',
      border: `1px solid transparent`,
      boxShadow: h ? `0 4px 14px ${T.accent}55, 0 1px 2px ${T.accent}66` : `0 1px 3px ${T.accent}55`,
    },
    ghost: {
      background: h ? T.surfaceHover : 'transparent', color: T.textSecondary,
      border: '1px solid transparent',
    },
  };
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ ...base, ...variants[variant], ...style }}>
      {icon}{children}
    </button>
  );
}

function Input({ placeholder, value, onChange, icon, style = {}, inputRef }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: T.surfaceRaised, border: `1px solid ${focused ? T.accent + '88' : T.border}`,
      borderRadius: T.radius, padding: '7px 11px',
      boxShadow: focused ? `0 0 0 3px ${T.accent}22` : T.shadow1,
      transition: 'all 0.15s', ...style,
    }}>
      {icon}
      <input ref={inputRef} placeholder={placeholder} value={value} onChange={onChange}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          background: 'none', border: 'none', outline: 'none',
          color: T.text, fontSize: 13, fontFamily: T.font, width: '100%',
        }} />
    </div>
  );
}

function Avatar({ name, size = 24 }) {
  if (!name) name = '?';
  const hue = (name.charCodeAt(0) * 47 + (name.charCodeAt(1) || 0) * 13) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: size, flexShrink: 0,
      background: `oklch(0.32 0.08 ${hue})`, color: `oklch(0.82 0.12 ${hue})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 600,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
    }}>{name[0].toUpperCase()}</div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${T.border}` }}>
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)} style={{
          padding: '10px 16px', fontSize: 13, fontWeight: active === tab.id ? 500 : 400,
          fontFamily: T.font, cursor: 'pointer', border: 'none', background: 'none',
          color: active === tab.id ? T.text : T.textMuted,
          borderBottom: active === tab.id ? `2px solid ${T.accent}` : '2px solid transparent',
          marginBottom: -1, transition: 'color 0.12s',
        }}>
          {tab.label}
          {tab.count != null && (
            <span style={{ fontSize: 11, color: T.textMuted, marginLeft: 5 }}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function Breadcrumb({ items, onNavigate }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14 }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: T.textMuted, fontSize: 12 }}>/</span>}
          <span onClick={() => onNavigate && onNavigate(item, i)} style={{
            color: i === items.length - 1 ? T.text : T.textMuted,
            cursor: i < items.length - 1 ? 'pointer' : 'default',
            fontWeight: i === items.length - 1 ? 500 : 400,
          }}>{item}</span>
        </React.Fragment>
      ))}
    </div>
  );
}

function Card({ children, style = {}, hoverable = false, onClick }) {
  const [h, setH] = React.useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => hoverable && setH(true)} onMouseLeave={() => hoverable && setH(false)}
      style={{
        background: T.surfaceRaised, border: `1px solid ${h ? T.borderLight : T.border}`,
        borderRadius: T.radiusLg, boxShadow: h ? T.shadow3 : T.shadow1,
        transition: 'all 0.15s ease',
        transform: h ? 'translateY(-1px)' : 'none',
        cursor: hoverable ? 'pointer' : 'default',
        ...style,
      }}>
      {children}
    </div>
  );
}

function StashLogo({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="7" fill={T.accent} />
      <rect x="8" y="10" width="16" height="3" rx="1.5" fill="#fff" opacity="0.95" />
      <rect x="8" y="14.5" width="16" height="3" rx="1.5" fill="#fff" opacity="0.65" />
      <rect x="8" y="19" width="16" height="3" rx="1.5" fill="#fff" opacity="0.35" />
    </svg>
  );
}

const TimeAgo = ({ date }) => <span style={{ fontSize: 12, color: T.textMuted }}>{date}</span>;

// Simple definition list for schema docs
function DefList({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 90px 1fr', gap: '8px 14px', fontSize: 13 }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <div style={{ fontFamily: T.mono, fontSize: 12.5, color: T.accentText, paddingTop: 1 }}>
            {item.field}
            {item.required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}
          </div>
          <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.textMuted, paddingTop: 2 }}>{item.type}</div>
          <div style={{ color: T.textSecondary, lineHeight: 1.55 }}>{item.desc}</div>
        </React.Fragment>
      ))}
    </div>
  );
}

Object.assign(window, {
  T, Icons, Icon, Badge, Btn, Input, Avatar, TabBar, Breadcrumb, TimeAgo,
  SyntaxHL, StashLogo, Card, DefList,
});
