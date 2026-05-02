import { useRef, useEffect } from 'react';
import SourceLinks from './SourceLinks';

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
              overflowWrap: 'anywhere',
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
              overflowWrap: 'anywhere',
            }}
          >
            {entry.confidence === 'low' ? '~' : ''}Died: {entry.cause_of_death}
          </p>
        )}
        <SourceLinks sources={entry.sources} fallbackUrl={entry.source_url} />
      </div>
    </div>
  );
}
