function Outbox() {
  const messages: { id: string; to: string; preview: string; status: string; time: string }[] = [];

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Outbox
      </h2>

      {messages.length === 0 ? (
        <div className="card-empty">
          <p style={{ color: 'var(--text-secondary)' }}>No outgoing messages</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Messages you send will be queued here
          </p>
        </div>
      ) : (
        <div className="list-stack">
          {messages.map((msg) => (
            <div key={msg.id} className="card">
              <div className="flex-row-between">
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>To: {msg.to}</span>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: msg.status === 'pending' ? 'var(--accent-dim)' : 'var(--bg-tertiary)',
                  color: msg.status === 'pending' ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                  {msg.status}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                {msg.preview}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {msg.time}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Outbox;
