import { useState, useEffect } from 'react';
import { getEngine } from '../hooks/useAether';
import type { Message } from '../types/db';

function Inbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const engine = getEngine();

    const unsubMsg = engine.onMessageReceived(() => {
      loadMessages();
    });

    loadMessages();

    return () => {
      unsubMsg();
    };
  }, []);

  async function loadMessages(): Promise<void> {
    try {
      const engine = getEngine();
      const all = await engine.db.messages.toArray();
      const received = all.filter((m: Message) => m.status === 'delivered' || m.senderId !== engine.getNodeId());
      setMessages(received.slice(-20).reverse());
    } catch {
      // db not ready yet
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
          Inbox
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Inbox
      </h2>

      {messages.length === 0 && (
        <div className="card-empty">
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            No messages yet.
          </p>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem', marginTop: '8px' }}>
            Messages you receive will appear here.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className="card" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              {msg.senderId.slice(0, 12)}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <p style={{ color: 'var(--text-primary)', fontSize: '0.9rem', wordBreak: 'break-word' }}>
            {msg.payload.byteLength > 0 ? '[Encrypted message]' : ''}
          </p>
          <div style={{ marginTop: '8px' }}>
            <span style={{
              fontSize: '0.7rem',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: msg.status === 'delivered' ? 'var(--accent-dim)' : 'var(--border)',
              color: msg.status === 'delivered' ? 'var(--accent)' : 'var(--text-secondary)',
            }}>
              {msg.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Inbox;
