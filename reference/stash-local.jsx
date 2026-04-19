// Agent Stash — Local ~/.claude/ data bridge
// Fetches from /api/local (served by stash-server) and patches ARTIFACT_DATA in place.

const LocalCtx = React.createContext({ data: null, loading: true, error: null });

function LocalDataProvider({ children }) {
  const [state, setState] = React.useState({ data: null, loading: true, error: null });

  React.useEffect(() => {
    const ctrl = new AbortController();
    fetch('/api/local', { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        // Patch ARTIFACT_DATA in place so ArtifactPage picks up real files
        if (window.ARTIFACT_DATA) {
          ['agents', 'skills', 'commands', 'hooks', 'sessions', 'scripts'].forEach(k => {
            if (Array.isArray(data[k]) && data[k].length > 0) {
              window.ARTIFACT_DATA[k] = data[k];
            }
          });
        }

        setState({ data, loading: false, error: null });
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        console.warn('[stash-local] /api/local unavailable:', err.message);
        setState({ data: null, loading: false, error: err.message });
      });
    return () => ctrl.abort();
  }, []);

  return <LocalCtx.Provider value={state}>{children}</LocalCtx.Provider>;
}

const useLocalData = () => React.useContext(LocalCtx);

// Status indicator shown in the top bar area
function LocalDataStatus() {
  const { loading, error, data } = useLocalData();
  if (loading) return (
    <span style={{
      fontSize: 11, color: T.textMuted, padding: '2px 8px', borderRadius: 3,
      background: T.surfaceRaised, border: `1px solid ${T.border}`,
    }}>Loading local data…</span>
  );
  if (error) return (
    <span title={`Run: cargo run --bin agent-stash -- reference/\nError: ${error}`} style={{
      fontSize: 11, color: T.orange, padding: '2px 8px', borderRadius: 3,
      background: T.orangeMuted, border: `1px solid ${T.orange}44`, cursor: 'help',
    }}>
      {Icons.server({ size: 10, color: T.orange })} stash-server offline
    </span>
  );
  const total = ['agents','skills','commands','hooks'].reduce(
    (n, k) => n + (data?.[k]?.length || 0), 0
  );
  return (
    <span style={{
      fontSize: 11, color: T.green, padding: '2px 8px', borderRadius: 3,
      background: T.greenMuted, border: `1px solid ${T.green}44`,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {Icons.check({ size: 10, color: T.green })} {total} local artifacts
    </span>
  );
}

Object.assign(window, { LocalCtx, LocalDataProvider, useLocalData, LocalDataStatus });
