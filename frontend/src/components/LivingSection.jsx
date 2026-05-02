import SourceLinks from './SourceLinks';

export default function LivingSection({ competitors, visible }) {
  if (!competitors || competitors.length === 0) return null;

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
          marginBottom: '16px',
        }}
      >
        still breathing
      </p>
      {competitors.map((c, i) => (
        <div
          key={i}
          style={{
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            flexWrap: 'wrap',
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              overflowWrap: 'anywhere',
            }}
          >
            {c.name}
          </span>
          {c.url && (
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent)',
                textDecoration: 'none',
                fontSize: '0.8rem',
              }}
            >
              &#8599;
            </a>
          )}
          {c.weakness && (
            <span
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                flex: '1 1 180px',
                minWidth: 0,
                overflowWrap: 'anywhere',
              }}
            >
              {c.weakness}
            </span>
          )}
          <div style={{ flexBasis: '100%', marginLeft: 0 }}>
            <SourceLinks sources={c.sources} />
          </div>
        </div>
      ))}
    </div>
  );
}
