export default function ClockLine({ clock, visible }) {
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
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
        }}
      >
        {clock}
      </p>
    </div>
  );
}
