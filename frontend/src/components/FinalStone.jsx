export default function FinalStone({ visible }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 1000ms ease',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.8rem',
          color: 'var(--text-faint)',
          marginBottom: '16px',
        }}
      >
        2026
      </p>
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '2.5rem',
          color: 'var(--final)',
        }}
      >
        YOU
      </p>
    </div>
  );
}
