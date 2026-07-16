function Inbox() {
  const messages: { id: string; from: string; preview: string; time: string }[] = [];

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Inbox
      </h2>

      {messages.length === 0 ? (
        <div className="card-empty">
          <p style={{ color: 'var(--text-secondary)' }}>No messages yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Messages will appear here when received
          </p>
        </div>
      ) : (
        <div className="list-stack">
          {messages.map((msg) => (
            <div key={msg.id} className="card">
              <div className="flex-row-between">
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{msg.from}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{msg.time}</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '4px' }}>
                {msg.preview}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Inbox;
