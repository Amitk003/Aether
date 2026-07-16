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
        <p className="card-section-title">Node Identity</p>
        <div className="section-row">
          <span className="section-label">Node ID</span>
          <span className="section-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            {nodeId}
          </span>
        </div>
        <div className="section-row">
          <span className="section-label">Phase</span>
          <span className="section-value" style={{ color: state.phase === 'idle' ? 'var(--text-secondary)' : 'var(--accent)' }}>
            {state.phase}
          </span>
        </div>
      </div>

      <div className="card">
        <p className="card-section-title">Module Status</p>
        <div className="section-row">
          <span className="section-label">Database</span>
          <StatusBadge ok={d.dbReady} />
        </div>
        <div className="section-row">
          <span className="section-label">Crypto Keys</span>
          <StatusBadge ok={d.cryptoReady} />
        </div>
        <div className="section-row">
          <span className="section-label">Microphone</span>
          <StatusBadge ok={d.micPermission} />
        </div>
        <div className="section-row">
          <span className="section-label">Camera</span>
          <StatusBadge ok={d.cameraPermission} />
        </div>
      </div>

      <div className="card">
        <p className="card-section-title">Statistics</p>
        <div className="section-row">
          <span className="section-label">Messages Sent</span>
          <span className="section-value">{d.totalMessagesSent}</span>
        </div>
        <div className="section-row">
          <span className="section-label">Messages Received</span>
          <span className="section-value">{d.totalMessagesReceived}</span>
        </div>
        <div className="section-row">
          <span className="section-label">Peers Encountered</span>
          <span className="section-value">{d.peersEncountered}</span>
        </div>
        <div className="section-row">
          <span className="section-label">Pending Outbox</span>
          <span className="section-value">{state.pendingMessages}</span>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span className={'status-badge' + (ok ? ' status-badge-ok' : '')}>
      {ok ? 'OK' : 'N/A'}
    </span>
  );
}

export default Diagnostics;
