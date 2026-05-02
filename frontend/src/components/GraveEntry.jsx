import { useRef, useEffect } from 'react';

export default function GraveEntry({ entry, showInscription }) {
  const entryRef = useRef(null);

  useEffect(() => {
    if (showInscription && entryRef.current) {
      entryRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showInscription]);

  return (
    <div
      ref={entryRef}
      style={{ marginBottom: showInscription ? '24px' : '12px' }}
    >
      {/* Name row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
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
          <span
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '1rem',
              color: 'var(--text-primary)',
            }}
          >
            {entry.title}
          </span>
        </div>
        {entry.is_alive && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.7rem',
              color: 'var(--alive)',
            }}
          >
            [alive]
          </span>
        )}
      </div>

      {/* Inscription */}
      <div
        style={{
          opacity: showInscription ? 1 : 0,
          maxHeight: showInscription ? '200px' : '0',
          overflow: 'hidden',
          transition: 'opacity 600ms ease, max-height 600ms ease',
          paddingLeft: '2rem',
          marginTop: showInscription ? '4px' : '0',
        }}
      >
        {entry.what_was_built && (
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginBottom: '4px',
            }}
          >
            {entry.what_was_built}
          </p>
        )}
        {!entry.is_alive && entry.cause_of_death && (
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.8rem',
              color: 'var(--text-faint)',
            }}
          >
            {entry.confidence === 'low' ? '~' : ''}Died: {entry.cause_of_death}
          </p>
        )}
        {entry.source_url && (
          <a
            href={entry.source_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.7rem',
              color: 'var(--accent)',
              textDecoration: 'none',
              display: 'inline-block',
              marginTop: '4px',
            }}
          >
            source
          </a>
        )}
      </div>
    </div>
  );
}
