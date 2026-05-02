function sectionTitle(label) {
  return (
    <p
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--text-secondary)',
        marginBottom: '6px',
      }}
    >
      {label}
    </p>
  );
}

function buildRightMove(entry) {
  if (entry.is_alive) {
    return 'Built something that sustained real demand long enough to still exist.';
  }
  if (entry.how_far === 'won' || entry.how_far === 'placed') {
    return 'Executed well enough early to earn strong initial validation.';
  }
  if (entry.what_was_built) {
    return 'Shipped a concrete product instead of staying at idea stage.';
  }
  return 'Validated the space by proving users cared about this problem.';
}

function buildWrongMove(entry) {
  if (entry.is_alive) {
    return 'No confirmed fatal mistake yet, but long-term defensibility is still unknown.';
  }
  return entry.cause_of_death || 'No public record of why this attempt stalled.';
}

function buildLesson(entry) {
  if (entry.is_alive) {
    return 'Differentiation matters after launch; surviving products keep evolving distribution and retention.';
  }
  return 'The project reached a visible build milestone but failed at durability after launch.';
}

function metadataPill(label, value) {
  return (
    <span
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.7rem',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '999px',
        padding: '4px 10px',
      }}
    >
      {label}: {value}
    </span>
  );
}

export default function StoryBookPage({
  entry,
  pageNumber,
  totalPages,
  onPrevious,
  onNext,
}) {
  return (
    <div style={{ minHeight: '100vh', padding: '32px 18px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '780px' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '18px',
            background: 'linear-gradient(180deg, #111111 0%, #0b0b0b 100%)',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              PAGE {pageNumber} / {totalPages}
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {metadataPill('Year', entry.year || 'Unknown')}
              {metadataPill('Status', entry.is_alive ? 'Alive' : 'Ended')}
              {metadataPill('How far', entry.how_far || 'unknown')}
            </div>
          </div>

          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--accent)', marginBottom: '10px' }}>
            {entry.title || 'Unknown Product'}
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-primary)', lineHeight: 1.65, marginBottom: '22px' }}>
            {entry.what_was_built || 'No reliable public description available for this attempt.'}
          </p>

          <div style={{ display: 'grid', gap: '14px' }}>
            <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
              {sectionTitle('What they did right')}
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{buildRightMove(entry)}</p>
            </section>
            <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
              {sectionTitle('What they did wrong')}
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{buildWrongMove(entry)}</p>
            </section>
            <section style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '14px' }}>
              {sectionTitle('Lesson left behind')}
              <p style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{buildLesson(entry)}</p>
            </section>
          </div>

          <div style={{ marginTop: '18px' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Evidence
            </p>
            {entry.source_url ? (
              <a href={entry.source_url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', overflowWrap: 'anywhere' }}>
                {entry.source_url}
              </a>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No public source URL captured for this entry.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', gap: '12px' }}>
          <button
            onClick={onPrevious}
            disabled={!onPrevious}
            style={{
              border: '1px solid var(--border)',
              color: onPrevious ? 'var(--text-primary)' : 'var(--text-faint)',
              background: 'transparent',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: onPrevious ? 'pointer' : 'not-allowed',
            }}
          >
            Previous page
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            style={{
              border: '1px solid var(--accent)',
              color: onNext ? 'var(--accent)' : 'var(--text-faint)',
              background: 'transparent',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: onNext ? 'pointer' : 'not-allowed',
            }}
          >
            Turn page
          </button>
        </div>
      </div>
    </div>
  );
}
