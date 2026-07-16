import { useAether } from '../hooks/useAether';
import { getEngine } from '../hooks/useAether';

function Diagnostics() {
  const { state } = useAether();
  const engine = getEngine();

  const d = state.diagnostics;
  const nodeId = engine.getNodeId();

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Diagnostics
      </h2>

      <div className="card">
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          Node Identity
        </p>
        <div style={rowStyle}>
          <span style={labelStyle}>Node ID</span>
          <span style={{ ...valueStyle, fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {nodeId}
          </span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Phase</span>
          <span style={{ ...valueStyle, color: state.phase === 'idle' ? 'var(--text-secondary)' : 'var(--accent)' }}>
            {state.phase}
          </span>
        </div>
      </div>

      <div className="card">
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          Module Status
        </p>
        <div style={rowStyle}>
          <span style={labelStyle}>Database</span>
          <StatusBadge ok={d.dbReady} />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Crypto Keys</span>
          <StatusBadge ok={d.cryptoReady} />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Microphone</span>
          <StatusBadge ok={d.micPermission} />
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Camera</span>
          <StatusBadge ok={d.cameraPermission} />
        </div>
      </div>

      <div className="card">
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          Statistics
        </p>
        <div style={rowStyle}>
          <span style={labelStyle}>Messages Sent</span>
          <span style={valueStyle}>{d.totalMessagesSent}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Messages Received</span>
          <span style={valueStyle}>{d.totalMessagesReceived}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Peers Encountered</span>
          <span style={valueStyle}>{d.peersEncountered}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Pending Outbox</span>
          <span style={valueStyle}>{state.pendingMessages}</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span style={{
      fontSize: '0.7rem',
      padding: '2px 8px',
      borderRadius: '4px',
      backgroundColor: ok ? 'var(--accent-dim)' : 'var(--border)',
      color: ok ? 'var(--accent)' : 'var(--text-secondary)',
    }}>
      {ok ? 'OK' : 'N/A'}
    </span>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  borderBottom: '1px solid var(--border)',
  fontSize: '0.85rem',
};

const labelStyle: React.CSSProperties = {
  color: 'var(--text-secondary)',
};

const valueStyle: React.CSSProperties = {
  color: 'var(--text-primary)',
  fontWeight: 500,
};

export default Diagnostics;
