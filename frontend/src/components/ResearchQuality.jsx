export default function ResearchQuality({ quality, visible }) {
  if (!quality) return null;

  const evidenceCount = quality.evidence_count || 0;
  const domainCount = quality.distinct_domains || 0;
  const missing = Array.isArray(quality.missing_categories)
    ? quality.missing_categories.map((category) => category.replace(/_/g, ' '))
    : [];

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 600ms ease',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 0',
      }}
    >
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.7rem',
          color: 'var(--text-faint)',
          overflowWrap: 'anywhere',
          lineHeight: 1.6,
        }}
      >
        evidence: {evidenceCount} sources / {domainCount} domains
        {missing.length > 0 ? ` - missing ${missing.join(', ')}` : ''}
      </p>
      {quality.coverage_note && (
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginTop: '4px',
            lineHeight: 1.5,
            overflowWrap: 'anywhere',
          }}
        >
          {quality.coverage_note}
        </p>
      )}
    </div>
  );
}
