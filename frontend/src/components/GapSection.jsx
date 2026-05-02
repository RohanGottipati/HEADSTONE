export default function GapSection({ gap, visible }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 600ms ease',
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.7rem',
          color: 'var(--text-faint)',
          fontVariant: 'small-caps',
          marginBottom: '12px',
        }}
      >
        the gap
      </p>
      <div
        style={{
          borderLeft: '2px solid var(--accent)',
          paddingLeft: '1.5rem',
        }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '1rem',
            color: 'var(--text-primary)',
            lineHeight: 1.7,
          }}
        >
          {gap}
        </p>
      </div>
    </div>
  );
}
