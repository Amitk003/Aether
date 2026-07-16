function Diagnostics() {
  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Diagnostics
      </h2>

      <div className="section-card">
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          Audio
        </p>
        <div className="section-row">
          <span style={{ color: 'var(--text-secondary)' }}>Microphone</span>
          <span style={{ color: 'var(--text-secondary)' }}>Not connected</span>
        </div>
        <div className="section-row">
          <span style={{ color: 'var(--text-secondary)' }}>Speaker</span>
          <span style={{ color: 'var(--text-secondary)' }}>Not connected</span>
        </div>
      </div>

      <div className="section-card">
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          Camera
        </p>
        <div className="section-row">
          <span style={{ color: 'var(--text-secondary)' }}>Status</span>
          <span style={{ color: 'var(--text-secondary)' }}>Not connected</span>
        </div>
      </div>

      <div className="section-card">
        <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '8px' }}>
          Storage
        </p>
        <div className="section-row">
          <span style={{ color: 'var(--text-secondary)' }}>Database</span>
          <span style={{ color: 'var(--success)' }}>Ready</span>
        </div>
        <div className="section-row">
          <span style={{ color: 'var(--text-secondary)' }}>Messages stored</span>
          <span style={{ color: 'var(--text-secondary)' }}>0</span>
        </div>
      </div>
    </div>
  );
}

export default Diagnostics;
