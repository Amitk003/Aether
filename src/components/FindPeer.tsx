function FindPeer() {
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Find Peer
      </h2>

      <div className="status-card">
        <div className="pulse-dot" />
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Listening for nearby devices
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
            No peers found yet
          </p>
        </div>
      </div>

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
