import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SourceLinks from './SourceLinks';

const monoLabel = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.62rem',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
  marginBottom: '4px',
};

const bodyText = {
  fontFamily: "'IBM Plex Sans', sans-serif",
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.55,
  overflowWrap: 'anywhere',
};

function MiniBullets({ items, color }) {
  if (!items || items.length === 0) return null;
  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            ...bodyText,
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            marginBottom: '4px',
          }}
        >
          <span
            style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: color,
              marginTop: '8px',
              flexShrink: 0,
            }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NarrativeParagraph({ heading, text, accent = false }) {
  if (!text) return null;
  return (
    <div
      style={{
        marginBottom: '10px',
        borderLeft: accent ? '2px solid var(--accent)' : 'none',
        paddingLeft: accent ? '12px' : 0,
      }}
    >
      <p style={monoLabel}>{heading}</p>
      <p style={bodyText}>{text}</p>
    </div>
  );
}

function ArcSection({ items }) {
  const arc = Array.isArray(items)
    ? items.filter((item) => item && item.event).slice(0, 4)
    : [];
  if (!arc.length) return null;

  return (
    <div style={{ marginBottom: '10px' }}>
      <p style={monoLabel}>The arc</p>
      <div style={{ display: 'grid', gap: '5px' }}>
        {arc.map((item, i) => (
          <div
            key={`${item.year || 'unknown'}-${i}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '52px 1fr',
              gap: '8px',
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
            <span style={bodyText}>{item.event}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GraveEntry({ entry, showInscription, index }) {
  const entryRef = useRef(null);

  useEffect(() => {
    if (showInscription && entryRef.current) {
      entryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showInscription]);

  const detailLink = typeof index === 'number' ? `/product/${index}` : null;

  return (
    <div
      ref={entryRef}
      style={{ marginBottom: showInscription ? '24px' : '12px' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 }}>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.8rem',
              color: 'var(--text-faint)',
            }}
          >
            {entry.year}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.8rem',
              color: 'var(--text-faint)',
            }}
          >
            &middot;
          </span>
          {detailLink ? (
            <Link
              to={detailLink}
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '1rem',
                color: 'var(--text-primary)',
                overflowWrap: 'anywhere',
                textDecoration: 'none',
                borderBottom: '1px dotted var(--text-faint)',
              }}
            >
              {entry.title}
            </Link>
          ) : (
            <span
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '1rem',
                color: 'var(--text-primary)',
                overflowWrap: 'anywhere',
              }}
            >
              {entry.title}
            </span>
          )}
        </div>
        {entry.is_alive && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.7rem',
              color: 'var(--alive)',
              flex: '0 0 auto',
            }}
          >
            [alive]
          </span>
        )}
      </div>

      <div
        style={{
          opacity: showInscription ? 1 : 0,
          maxHeight: showInscription ? '1200px' : '0',
          overflow: 'hidden',
          transition: 'opacity 600ms ease, max-height 900ms ease',
          paddingLeft: '2rem',
          marginTop: showInscription ? '8px' : '0',
        }}
      >
        {entry.what_was_built && (
          <div style={{ marginBottom: '10px' }}>
            <p style={monoLabel}>What it was</p>
            <p style={bodyText}>{entry.what_was_built}</p>
          </div>
        )}

        <ArcSection items={entry.evolution_timeline} />

        {entry.did_right && entry.did_right.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <p style={monoLabel}>Got right</p>
            <MiniBullets items={entry.did_right} color="var(--alive)" />
          </div>
        )}

        {entry.did_wrong && entry.did_wrong.length > 0 && (
          <div style={{ marginBottom: '10px' }}>
            <p style={monoLabel}>Got wrong</p>
            <MiniBullets items={entry.did_wrong} color="#a85050" />
          </div>
        )}

        <NarrativeParagraph heading="What worked" text={entry.did_well} />
        <NarrativeParagraph heading="What failed" text={entry.did_poorly} />
        <NarrativeParagraph heading="What it lacked" text={entry.project_lacks} />

        {!entry.is_alive && entry.cause_of_death && (
          <p style={{ ...bodyText, color: 'var(--text-faint)', marginBottom: '8px' }}>
            {entry.confidence === 'low' ? '~' : ''}Died: {entry.cause_of_death}
          </p>
        )}

        <SourceLinks sources={entry.sources} fallbackUrl={entry.source_url} />

        <NarrativeParagraph heading="Learn from this" text={entry.avoid_mistakes} accent />
        <NarrativeParagraph heading="What could have changed" text={entry.improvement_suggestions} />

        {detailLink && (
          <Link
            to={detailLink}
            style={{
              display: 'inline-block',
              marginTop: '10px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.65rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              textDecoration: 'none',
            }}
          >
            Read this page →
          </Link>
        )}
      </div>
    </div>
  );
}
