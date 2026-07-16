function App() {
  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--accent)' }}>
        Aether
      </h1>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
        Offline messaging using sound and light
      </p>
    </div>
  );
}

export default App;
