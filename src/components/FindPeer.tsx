import { useState, useEffect } from 'react';
import { getEngine, useAether } from '../hooks/useAether';
import QrDisplay from './QrDisplay';
import QrScanner from './QrScanner';

function FindPeer() {
  const { state } = useAether();
  const [isScanning, setIsScanning] = useState(false);
  const [peers, setPeers] = useState<string[]>([]);

  const [syncPeerId, setSyncPeerId] = useState<string | null>(null);
  const [syncStep, setSyncStep] = useState<'handshake' | 'payload'>('handshake');
  const [ownHandshakeData, setOwnHandshakeData] = useState('');

  const [outgoingQrData, setOutgoingQrData] = useState<string | null>(null);
  const [outgoingChunkInfo, setOutgoingChunkInfo] = useState('');
  const [incomingProgress, setIncomingProgress] = useState('Waiting to scan...');

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

  const handleStartSync = async (peerId: string) => {
    const engine = getEngine();
    engine.stopDiscovery();
    setIsScanning(false);

    setSyncPeerId(peerId);
    setSyncStep('handshake');
    setOutgoingQrData(null);
    setIncomingProgress('Scan peer handshake QR...');

    const handshake = await engine.getHandshakePayload();
    setOwnHandshakeData(handshake);

      engine.optical.setOnChunk((received, total, progress) => {
        setIncomingProgress('Scanning payload chunks: ' + received + '/' + total + ' (' + Math.round(progress * 100) + '%)');
        engine.trackChunkReceived();
      });

    engine.optical.setOnReceiveComplete(async (payloadBytes: Uint8Array) => {
      try {
        setIncomingProgress('Reconstructing and decrypting messages...');
        await engine.processIncomingPayload(peerId, payloadBytes);
        engine.trackTransferComplete();
        alert('Sync completed successfully!');
      } catch (err: any) {
        alert('Sync processing failed: ' + err.message);
      } finally {
        handleCancelSync();
      }
    });

    engine.setPhase('transferring');
    engine.optical.startReceiving();
  };

  const handleScan = async (scannedText: string) => {
    const engine = getEngine();

    if (syncStep === 'handshake') {
      try {
        const peerHandshake = await engine.registerPeerHandshake(scannedText);

        setSyncStep('payload');
        setIncomingProgress('Handshake OK. Align screens for payload transfer...');

        const outPayload = engine.generateOutgoingPayload(peerHandshake.seenMessageIds);

        engine.optical.setOnFrame((qrData, chunk) => {
          setOutgoingQrData(qrData);
          setOutgoingChunkInfo('Sending chunk ' + (chunk.index + 1) + '/' + chunk.total);
          engine.trackChunkSent();
        });

        engine.optical.startSending(outPayload);
      } catch (err: any) {
        console.error('Handshake scan error:', err);
      }
    } else {
      engine.optical.submitFrame(scannedText);
    }
  };

  const handleCancelSync = () => {
    const engine = getEngine();
    engine.optical.stopAll();
    engine.setPhase('idle');
    setSyncPeerId(null);
    setOutgoingQrData(null);
    setOutgoingChunkInfo('');
    setIncomingProgress('Waiting to scan...');
  };

  if (state.phase === 'transferring' && syncPeerId) {
    return (
      <div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
          Syncing with {syncPeerId.slice(0, 12)}
        </h2>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>

          <div style={{ textAlign: 'center', width: '100%' }}>
            <span style={{ backgroundColor: 'var(--accent-dim)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>
              Step: {syncStep === 'handshake' ? '1. Swap Handshakes' : '2. Transfer Payloads'}
            </span>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '10px' }}>
              {syncStep === 'handshake'
                ? 'Align screens to swap Node identities and handshake credentials.'
                : 'Exchanging encrypted pending messages.'}
            </p>
          </div>

          <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
              Your Screen (Show to peer)
            </p>
            {syncStep === 'handshake' ? (
              <QrDisplay data={ownHandshakeData} label="Your Identity Handshake" />
            ) : outgoingQrData ? (
              <QrDisplay data={outgoingQrData} label={outgoingChunkInfo || 'Sending payload...'} />
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {outgoingChunkInfo || 'Preparing payload...'}
              </p>
            )}
          </div>

          <div className="card" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
              Your Camera (Scan peer screen)
            </p>
            <div style={{ width: '100%', maxWidth: '280px' }}>
              <QrScanner active={true} onScan={handleScan} />
            </div>
            <p style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500, marginTop: '12px', textAlign: 'center' }}>
              {incomingProgress}
            </p>
          </div>

          <button onClick={handleCancelSync} className="btn-danger" style={{ width: '100%' }}>
            Cancel Sync
          </button>
        </div>
      </div>
    );
  }

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
                  onClick={() => handleStartSync(peerId)}
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
          <li>Align the screens when prompted to scan</li>
        </ol>
      </div>
    </div>
  );
}

export default FindPeer;
