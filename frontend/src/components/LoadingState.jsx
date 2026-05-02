export default function LoadingState() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          animation: 'pulse-loading 2s ease-in-out infinite',
        }}
      >
        searching the graveyard...
      </p>
    </div>
  );
}
