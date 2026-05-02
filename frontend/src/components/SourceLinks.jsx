function normalizeSources(sources, fallbackUrl) {
  if (Array.isArray(sources) && sources.length > 0) return sources;
  if (fallbackUrl) {
    return [{ id: 'source', title: 'source', url: fallbackUrl, domain: '' }];
  }
  return [];
}

export default function SourceLinks({ sources, fallbackUrl }) {
  const visibleSources = normalizeSources(sources, fallbackUrl)
    .filter((source) => source?.url)
    .slice(0, 4);

  if (visibleSources.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '4px',
      }}
    >
      {visibleSources.map((source, index) => (
        <a
          key={`${source.id || source.url}-${index}`}
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.7rem',
            color: 'var(--accent)',
            textDecoration: 'none',
            overflowWrap: 'anywhere',
          }}
        >
          {source.domain || `source ${index + 1}`}
        </a>
      ))}
    </div>
  );
}
