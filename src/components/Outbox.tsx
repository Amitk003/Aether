import { useState, useEffect } from 'react';
import { getEngine } from '../hooks/useAether';
import type { Message } from '../types/db';

function Outbox() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientId, setRecipientId] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages(): Promise<void> {
    try {
      const engine = getEngine();
      const all = await engine.db.messages.toArray();
      const sent = all.filter((m: Message) => m.senderId === engine.getNodeId());
      setMessages(sent.slice(-20).reverse());
    } catch {
      // db not ready yet
    } finally {
      setLoading(false);
    }
  }

  const handleSend = async () => {
    if (!recipientId.trim() || !text.trim() || sending) return;
    setSending(true);
    try {
      const engine = getEngine();
      await engine.sendMessage(recipientId.trim(), text.trim());
      setText('');
      await loadMessages();
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: 'var(--text-primary)' }}>
        Outbox
      </h2>

      <div className="card" style={{ marginBottom: '16px' }}>
        <input
          placeholder="Recipient Node ID"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          style={inputStyle}
        />
        <textarea
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'none', marginTop: '8px' }}
        />
        <button
          onClick={handleSend}
          disabled={sending || !recipientId.trim() || !text.trim()}
          className="btn-primary"
          style={{ width: '100%', marginTop: '12px', opacity: sending || !recipientId.trim() || !text.trim() ? 0.5 : 1 }}
        >
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>

      {loading && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading...</p>
      )}

      {!loading && messages.length === 0 && (
        <div className="card-empty">
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            No sent messages.
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className="card" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              to: <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>
                {msg.recipientId.slice(0, 12)}
              </span>
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </span>
          </div>
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  backgroundColor: 'var(--bg-tertiary)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  fontSize: '0.85rem',
  boxSizing: 'border-box',
};

export default Outbox;
