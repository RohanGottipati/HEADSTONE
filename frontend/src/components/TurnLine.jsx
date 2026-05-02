export default function TurnLine({ sentence, visible }) {
  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 600ms ease',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.5rem',
          color: 'var(--turn)',
        }}
      >
        {sentence}
      </p>
    </div>
  );
}
