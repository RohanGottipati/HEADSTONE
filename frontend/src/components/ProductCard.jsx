import SourceLinks from './SourceLinks';

const STATUS_LABEL = {
  won: 'Won',
  placed: 'Placed',
  shipped: 'Shipped',
  abandoned: 'Abandoned',
  unknown: 'Unknown',
};

const monoLabel = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.65rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
  marginBottom: '8px',
};

const sectionGap = { marginTop: '20px' };

function StatusPill({ entry }) {
  const isAlive = Boolean(entry.is_alive);
  const label = isAlive ? 'Alive' : STATUS_LABEL[entry.how_far] || 'Unknown';
  const color = isAlive ? 'var(--alive)' : 'var(--text-secondary)';

  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.65rem',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color,
        border: `1px solid ${color}`,
        padding: '2px 8px',
        borderRadius: '999px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

function BulletList({ items, accent }) {
  if (!items || items.length === 0) return null;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            marginBottom: '6px',
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            lineHeight: 1.55,
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: accent,
              marginTop: '8px',
              flexShrink: 0,
            }}
          />
          <span style={{ overflowWrap: 'anywhere' }}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NarrativeSection({ label, text, accent = false }) {
  if (!text) return null;
  return (
    <section
      style={{
        ...sectionGap,
        borderLeft: accent ? '2px solid var(--accent)' : 'none',
        paddingLeft: accent ? '14px' : 0,
      }}
    >
      <p style={monoLabel}>{label}</p>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.95rem',
          color: accent ? 'var(--text-primary)' : 'var(--text-secondary)',
          lineHeight: 1.65,
          overflowWrap: 'anywhere',
        }}
      >
        {text}
      </p>
    </section>
  );
}

function ArcSection({ items }) {
  const arc = Array.isArray(items)
    ? items.filter((item) => item && item.event).slice(0, 4)
    : [];
  if (!arc.length) return null;

  return (
    <section style={sectionGap}>
      <p style={monoLabel}>Project arc</p>
      <div style={{ display: 'grid', gap: '8px' }}>
        {arc.map((item, index) => (
          <div
            key={`${item.year || 'unknown'}-${index}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr',
              gap: '12px',
              alignItems: 'baseline',
            }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.72rem',
                color: 'var(--accent)',
              }}
            >
              {item.year || '—'}
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                overflowWrap: 'anywhere',
              }}
            >
              {item.event}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ProductCard({ entry, variant = 'card' }) {
  if (!entry) return null;

  const isPage = variant === 'page';

  return (
    <article
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: isPage ? '40px 36px' : '28px 24px',
        boxShadow: isPage ? '0 24px 60px rgba(0,0,0,0.45)' : 'none',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              color: 'var(--text-faint)',
              letterSpacing: '0.18em',
              marginBottom: '6px',
            }}
          >
            {entry.year || '—'}
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isPage ? '2.25rem' : '1.5rem',
              color: 'var(--text-primary)',
              fontWeight: 500,
              lineHeight: 1.15,
              overflowWrap: 'anywhere',
            }}
          >
            {entry.title}
          </h2>
          {entry.what_made_it_different && (
            <p
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '0.9rem',
                color: 'var(--accent)',
                marginTop: '8px',
                fontStyle: 'italic',
                overflowWrap: 'anywhere',
              }}
            >
              {entry.what_made_it_different}
            </p>
          )}
        </div>
        <StatusPill entry={entry} />
      </header>

      {entry.what_was_built && (
        <section style={sectionGap}>
          <p style={monoLabel}>What it was</p>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '1rem',
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              overflowWrap: 'anywhere',
            }}
          >
            {entry.what_was_built}
          </p>
        </section>
      )}

      {isPage && <ArcSection items={entry.evolution_timeline} />}

      {entry.did_right && entry.did_right.length > 0 && (
        <section style={sectionGap}>
          <p style={monoLabel}>What they got right</p>
          <BulletList items={entry.did_right} accent="var(--alive)" />
        </section>
      )}

      {entry.did_wrong && entry.did_wrong.length > 0 && (
        <section style={sectionGap}>
          <p style={monoLabel}>What they got wrong</p>
          <BulletList items={entry.did_wrong} accent="#a85050" />
        </section>
      )}

      {isPage && (
        <>
          <NarrativeSection label="What worked" text={entry.did_well} />
          <NarrativeSection label="Failure detail" text={entry.did_poorly} />
          <NarrativeSection label="What it lacked" text={entry.project_lacks} />
        </>
      )}

      {!entry.is_alive && entry.cause_of_death && (
        <section style={sectionGap}>
          <p style={monoLabel}>Cause of death</p>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              overflowWrap: 'anywhere',
            }}
          >
            {entry.confidence === 'low' ? '~ ' : ''}
            {entry.cause_of_death}
          </p>
        </section>
      )}

      {isPage && (
        <>
          <NarrativeSection label="What to avoid" text={entry.avoid_mistakes} accent />
          <NarrativeSection label="What could have changed" text={entry.improvement_suggestions} />
        </>
      )}

      {entry.lesson && (
        <section
          style={{
            ...sectionGap,
            borderLeft: '2px solid var(--accent)',
            paddingLeft: '14px',
          }}
        >
          <p style={monoLabel}>Lesson left behind</p>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.05rem',
              color: 'var(--accent)',
              lineHeight: 1.5,
              fontStyle: 'italic',
              overflowWrap: 'anywhere',
            }}
          >
            {entry.lesson}
          </p>
        </section>
      )}

      {(entry.sources?.length > 0 || entry.source_url) && (
        <section style={sectionGap}>
          <p style={monoLabel}>Sources</p>
          <SourceLinks sources={entry.sources} fallbackUrl={entry.source_url} />
        </section>
      )}
    </article>
  );
}
