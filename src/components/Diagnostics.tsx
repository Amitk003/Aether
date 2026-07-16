import { useState, useEffect, useRef } from 'react';
import { useAether, getEngine } from '../hooks/useAether';

const SPECTRUM_HEIGHT = 80;
const SPECTRUM_BARS = 48;

function Diagnostics() {
  const { state } = useAether();
  const engine = getEngine();

  const [spectrum, setSpectrum] = useState<Float32Array | null>(null);
  const [predictability, setPredictability] = useState<Record<string, number>>({});
  const animRef = useRef<number>(0);

  useEffect(() => {
    function poll() {
      const s = engine.getSpectrumData();
      if (s) setSpectrum(s);
      const p = engine.routing.getAllPredictability();
      setPredictability(p);
      animRef.current = requestAnimationFrame(poll);
    }
    animRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

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
        <p className="card-section-title">Message Statistics</p>
        <div className="section-row">
          <span className="section-label">Sent</span>
          <span className="section-value">{d.totalMessagesSent}</span>
        </div>
        <div className="section-row">
          <span className="section-label">Received</span>
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

      <div className="card">
        <p className="card-section-title">QR Transfer Stats</p>
        <div className="section-row">
          <span className="section-label">Chunks Sent</span>
          <span className="section-value">{d.chunksSent}</span>
        </div>
        <div className="section-row">
          <span className="section-label">Chunks Received</span>
          <span className="section-value">{d.chunksReceived}</span>
        </div>
        <div className="section-row">
          <span className="section-label">Transfers Complete</span>
          <span className="section-value">{d.transfersCompleted}</span>
        </div>
      </div>

      {spectrum && (
        <div className="card">
          <p className="card-section-title">Audio Spectrum</p>
          <SpectrumChart data={spectrum} />
        </div>
      )}

      {Object.keys(predictability).length > 0 && (
        <div className="card">
          <p className="card-section-title">Routing Predictability</p>
          {Object.entries(predictability)
            .sort(([, a], [, b]) => b - a)
            .map(([peerId, prob]) => (
              <div key={peerId} className="section-row">
                <span className="section-label" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                  {peerId.slice(0, 12)}
                </span>
                <span className="section-value" style={{ color: prob > 0.5 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {prob.toFixed(3)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function getColorForBar(value: number): string {
  if (value < 0.25) return 'rgba(0, 200, 255, 0.3)';
  if (value < 0.5) return 'rgba(0, 200, 255, 0.5)';
  if (value < 0.75) return 'rgba(0, 200, 255, 0.7)';
  return 'rgba(0, 200, 255, 0.9)';
}

function SpectrumChart({ data }: { data: Float32Array }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const step = Math.floor(data.length / SPECTRUM_BARS);
    const barW = w / SPECTRUM_BARS;

    for (let i = 0; i < SPECTRUM_BARS; i++) {
      let sum = 0;
      let count = 0;
      for (let j = i * step; j < (i + 1) * step && j < data.length; j++) {
        sum += data[j];
        count++;
      }
      const avg = count > 0 ? sum / count : -100;
      const normalized = Math.min(1, Math.max(0, (avg + 100) / 80));
      const barH = normalized * h;

      ctx.fillStyle = getColorForBar(normalized);
      ctx.fillRect(i * barW, h - barH, barW - 1, barH);
    }
  }, [data]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={SPECTRUM_HEIGHT}
      style={{ width: '100%', height: SPECTRUM_HEIGHT + 'px', borderRadius: '6px', backgroundColor: 'var(--bg-tertiary)' }}
    />
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
