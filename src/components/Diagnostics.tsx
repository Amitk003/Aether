function Diagnostics() {
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Diagnostics
      </h2>

      <div style={styles.section}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          Audio
        </p>
        <div style={styles.row}>
          <span style={{ color: 'var(--text-secondary)' }}>Microphone</span>
          <span style={{ color: 'var(--text-secondary)' }}>Not connected</span>
        </div>
        <div style={styles.row}>
          <span style={{ color: 'var(--text-secondary)' }}>Speaker</span>
          <span style={{ color: 'var(--text-secondary)' }}>Not connected</span>
        </div>
      </div>

      <div style={styles.section}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          Camera
        </p>
        <div style={styles.row}>
          <span style={{ color: 'var(--text-secondary)' }}>Status</span>
          <span style={{ color: 'var(--text-secondary)' }}>Not connected</span>
        </div>
      </div>

      <div style={styles.section}>
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          Storage
        </p>
        <div style={styles.row}>
          <span style={{ color: 'var(--text-secondary)' }}>Database</span>
          <span style={{ color: 'var(--success)' }}>Ready</span>
        </div>
        <div style={styles.row}>
          <span style={{ color: 'var(--text-secondary)' }}>Messages stored</span>
          <span style={{ color: 'var(--text-secondary)' }}>0</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: {
    padding: '12px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    marginBottom: '10px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    fontSize: '0.85rem',
  },
};

export default Diagnostics;
