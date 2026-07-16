import { useState, useEffect } from 'react';
import Inbox from './components/Inbox';
import Outbox from './components/Outbox';
import FindPeer from './components/FindPeer';
import Diagnostics from './components/Diagnostics';
import Trust from './components/Trust';
import { getEngine, useAether } from './hooks/useAether';

type Tab = 'inbox' | 'outbox' | 'find' | 'trust' | 'diagnostics';

const tabs: { key: Tab; label: string }[] = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'outbox', label: 'Outbox' },
  { key: 'find', label: 'Find Peer' },
  { key: 'trust', label: 'Trust' },
  { key: 'diagnostics', label: 'Diagnostics' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('find');
  const { state } = useAether();

  useEffect(() => {
    const engine = getEngine();
    engine.initialize();
    return () => { engine.destroy(); };
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case 'inbox':
        return <Inbox />;
      case 'outbox':
        return <Outbox />;
      case 'find':
        return <FindPeer />;
      case 'trust':
        return <Trust />;
      case 'diagnostics':
        return <Diagnostics />;
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Aether</h1>
        <p style={styles.subtitle}>Offline messaging using sound and light</p>
        {state.phase !== 'idle' && (
          <span style={styles.badge}>{state.phase}</span>
        )}
      </header>

      <nav style={styles.nav}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...styles.tab,
              ...(activeTab === tab.key ? styles.tabActive : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.content}>
        {renderTab()}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'var(--bg-primary)',
  },
  header: {
    padding: '16px 20px 8px',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: '1.5rem',
    color: 'var(--accent)',
    margin: 0,
  },
  subtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-secondary)',
    margin: 0,
    flex: 1,
  },
  badge: {
    fontSize: '0.7rem',
    padding: '2px 8px',
    borderRadius: '4px',
    backgroundColor: 'var(--accent-dim)',
    color: 'var(--accent)',
    textTransform: 'uppercase',
  },
  nav: {
    display: 'flex',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg-secondary)',
  },
  tab: {
    flex: 1,
    padding: '12px 8px',
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    backgroundColor: 'transparent',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: 'var(--accent)',
    borderBottomColor: 'var(--accent)',
    backgroundColor: 'var(--bg-tertiary)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px 20px',
  },
};

export default App;
