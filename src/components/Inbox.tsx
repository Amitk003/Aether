function Inbox() {
  const messages: { id: string; from: string; preview: string; time: string }[] = [];

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Inbox
      </h2>

      {messages.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ color: 'var(--text-secondary)' }}>No messages yet</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Messages will appear here when received
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {messages.map((msg) => (
            <div key={msg.id} style={styles.message}>
              <div style={styles.messageHeader}>
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

const styles: Record<string, React.CSSProperties> = {
  empty: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  message: {
    padding: '12px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
};

export default Inbox;
