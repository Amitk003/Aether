function FindPeer() {
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Find Peer
      </h2>

      <div style={styles.statusCard}>
        <div style={styles.statusDot} />
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Listening for nearby devices
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>
            No peers found yet
          </p>
        </div>
      </div>

      <div style={styles.helpCard}>
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

const styles: Record<string, React.CSSProperties> = {
  statusCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    marginBottom: '12px',
  },
  statusDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent)',
    opacity: 0.5,
    animation: 'pulse 2s infinite',
  },
  helpCard: {
    padding: '16px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
};

export default FindPeer;
