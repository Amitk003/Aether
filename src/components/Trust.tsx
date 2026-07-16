import { useState, useEffect } from 'react';
import { getEngine } from '../hooks/useAether';
import { computeFingerprint } from '../utils/crypto';
import QrDisplay from './QrDisplay';
import QrScanner from './QrScanner';
import type { Node } from '../types/db';

type PeerEntry = Node & { fingerprint: string };

function Trust() {
  const [ownFingerprint, setOwnFingerprint] = useState('');
  const [peers, setPeers] = useState<PeerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanMode, setScanMode] = useState(false);
  const [scanResult, setScanResult] = useState<{ nodeId: string; fingerprint: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(): Promise<void> {
    try {
      const engine = getEngine();
      const fp = await engine.getFingerprint();
      setOwnFingerprint(fp);

      const all = await engine.getAllPeers();
      const entries: PeerEntry[] = [];
      for (const node of all) {
        const f = await computeFingerprint(node.publicKey);
        entries.push({ ...node, fingerprint: f });
      }
      entries.sort((a, b) => b.lastSeen - a.lastSeen);
      setPeers(entries);
    } catch {
      // not ready
    } finally {
      setLoading(false);
    }
  }

  const handleScanResult = async (scannedText: string) => {
    try {
      const data = JSON.parse(scannedText);
      if (!data.nodeId || !data.fingerprint) {
        alert('Invalid fingerprint QR code');
        return;
      }
      setScanResult({ nodeId: data.nodeId, fingerprint: data.fingerprint });
    } catch {
      alert('Invalid fingerprint QR format');
    }
  };

  const handleTrustAction = async (peerId: string, status: 'trusted' | 'untrusted' | 'blocked') => {
    const engine = getEngine();
    await engine.setTrustStatus(peerId, status);
    await loadData();
  };

  if (scanMode) {
    return (
      <div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
          Verify Fingerprint
        </h2>
        <QrScanner active={true} onScan={handleScanResult} />
        {scanResult && (
          <div className="card" style={{ marginTop: '12px' }}>
            <div className="section-row">
              <span className="section-label">Node ID</span>
              <span className="section-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {scanResult.nodeId.slice(0, 16)}
              </span>
            </div>
            <div className="section-row">
              <span className="section-label">Fingerprint</span>
              <span className="section-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--accent)' }}>
                {scanResult.fingerprint}
              </span>
            </div>
            {peers.find((p) => p.fingerprint === scanResult.fingerprint) ? (
              <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginTop: '8px' }}>
                Fingerprint matches known peer. You can mark them as trusted.
              </p>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '8px' }}>
                This fingerprint does not match any known peer.
              </p>
            )}
            <button
              onClick={() => setScanMode(false)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              Done
            </button>
          </div>
        )}
        <button
          onClick={() => { setScanMode(false); setScanResult(null); }}
          className="btn-danger"
          style={{ width: '100%', marginTop: '12px' }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Web of Trust
      </h2>

      <div className="card" style={{ textAlign: 'center' }}>
        <p className="card-section-title">Your Identity Fingerprint</p>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '12px' }}>
          Share this QR with peers to verify your identity out of band.
        </p>
        {ownFingerprint && (
          <>
            <QrDisplay
              data={JSON.stringify({ nodeId: getEngine().getNodeId(), fingerprint: ownFingerprint })}
              label="Your Fingerprint QR"
            />
            <p style={{ color: 'var(--accent)', fontFamily: 'monospace', fontSize: '0.8rem', marginTop: '8px' }}>
              {ownFingerprint}
            </p>
          </>
        )}
      </div>

      <button
        onClick={() => setScanMode(true)}
        className="btn-primary"
        style={{ width: '100%', marginBottom: '16px' }}
      >
        Scan Peer Fingerprint
      </button>

      {loading && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading peers...</p>
      )}

      {!loading && peers.length === 0 && (
        <div className="card-empty">
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            No peers known yet. Discover peers to build your trust network.
          </p>
        </div>
      )}

      {peers.map((peer) => (
        <div key={peer.id} className="card" style={{ marginBottom: '8px' }}>
          <div className="section-row">
            <span className="section-label">Node ID</span>
            <span className="section-value" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {peer.id.slice(0, 16)}
            </span>
          </div>
          <div className="section-row">
            <span className="section-label">Fingerprint</span>
            <span className="section-value" style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--accent)' }}>
              {peer.fingerprint}
            </span>
          </div>
          <div className="section-row">
            <span className="section-label">Trust Status</span>
            <span className="section-value">
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: peer.trustStatus === 'trusted' ? 'var(--accent-dim)' :
                  peer.trustStatus === 'blocked' ? 'rgba(255, 107, 107, 0.15)' : 'var(--border)',
                color: peer.trustStatus === 'trusted' ? 'var(--accent)' :
                  peer.trustStatus === 'blocked' ? 'var(--error)' : 'var(--text-secondary)',
              }}>
                {peer.trustStatus}
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {peer.trustStatus !== 'trusted' && (
              <button
                onClick={() => handleTrustAction(peer.id, 'trusted')}
                className="btn-primary"
                style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
              >
                Trust
              </button>
            )}
            {peer.trustStatus !== 'blocked' && (
              <button
                onClick={() => handleTrustAction(peer.id, 'blocked')}
                className="btn-danger"
                style={{ flex: 1, fontSize: '0.75rem', padding: '6px' }}
              >
                Block
              </button>
            )}
            {peer.trustStatus !== 'untrusted' && (
              <button
                onClick={() => handleTrustAction(peer.id, 'untrusted')}
                style={{
                  flex: 1, fontSize: '0.75rem', padding: '6px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default Trust;
