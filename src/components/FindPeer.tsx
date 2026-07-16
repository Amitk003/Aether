import { useState, useEffect } from 'react';
import { getEngine } from '../hooks/useAether';

function FindPeer() {
  const [isScanning, setIsScanning] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);

  useEffect(() => {
    const engine = getEngine();

    const unsubPeer = engine.onPeerDiscovered((peerId) => {
      setPeers((prev) => {
        if (prev.includes(peerId)) return prev;
        return [...prev, peerId];
      });
    });

    return () => {
      unsubPeer();
    };
  }, []);

  const handleToggle = async () => {
    const engine = getEngine();
    if (isScanning) {
      engine.stopDiscovery();
      setIsScanning(false);
    } else {
      await engine.startDiscovery();
      setIsScanning(true);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Find Peer
      </h2>

      <button
        onClick={handleToggle}
        className={isScanning ? 'btn-danger' : 'btn-primary'}
        style={{ width: '100%', marginBottom: '16px' }}
      >
        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
      </button>

      <div className="status-card">
        {isScanning && <div className="pulse-dot" />}
        <div style={{ flex: 1 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isScanning ? 'Listening for nearby devices' : 'Scanning stopped'}
          </p>
          {peers.length > 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
              {peers.length} peer{peers.length !== 1 ? 's' : ''} found
            </p>
          )}
          {peers.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
              No peers found yet
            </p>
          )}
        </div>
      </div>

      {peers.length > 0 && (
        <div className="card">
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
            Discovered Peers
          </p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {peers.map((peerId) => (
              <li
                key={peerId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.85rem',
                }}
              >
                <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {peerId.slice(0, 12)}
                </span>
                <button
                  className="btn-primary"
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                  onClick={async () => {
                    const engine = getEngine();
                    await engine.syncWithPeer(peerId);
                  }}
                >
                  Sync
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          How to connect
        </p>
        <ol style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li>Make sure both devices have the app open</li>
          <li>Keep the devices near each other</li>
          <li>Wait for the app to detect the other device</li>
          <li>Align the screens when prompted</li>
        </ol>
      </div>
    </div>
  );
}

export default FindPeer;
