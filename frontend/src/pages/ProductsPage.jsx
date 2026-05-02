import { Navigate, Link } from 'react-router-dom';
import { useResults } from '../context/ResultsContext';
import ProductCard from '../components/ProductCard';

export default function ProductsPage() {
  const { data } = useResults();

  if (!data) {
    return <Navigate to="/" replace />;
  }

  const timeline = (data.timeline || []).slice().sort((a, b) => (a.year || 0) - (b.year || 0));

  return (
    <div
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '60px 24px 100px',
      }}
    >
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
            marginBottom: '10px',
          }}
        >
          The notebook index
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2rem',
            color: 'var(--text-primary)',
            fontWeight: 500,
            lineHeight: 1.2,
            overflowWrap: 'anywhere',
          }}
        >
          Every attempt at &ldquo;{data.idea}&rdquo;
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '0.95rem',
            color: 'var(--text-secondary)',
            marginTop: '12px',
            lineHeight: 1.6,
          }}
        >
          {timeline.length} attempt{timeline.length === 1 ? '' : 's'} — ordered oldest to newest. Click any
          product to inspect it outside the notebook.
        </p>
      </header>

      {timeline.length === 0 && (
        <p
          style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            color: 'var(--text-secondary)',
          }}
        >
          No attempts were found. Try a more specific idea on the cover page.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {timeline.map((entry, i) => (
          <Link
            key={`${entry.title}-${entry.year}-${i}`}
            to={`/product/${i}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <ProductCard entry={entry} variant="card" />
          </Link>
        ))}
      </div>

      <div
        style={{
          marginTop: '60px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Link
          to="/results"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            padding: '10px 16px',
            borderRadius: '6px',
          }}
        >
          ← Back to notebook
        </Link>
        <Link
          to="/build"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--bg)',
            background: 'var(--accent)',
            textDecoration: 'none',
            padding: '10px 16px',
            borderRadius: '6px',
          }}
        >
          → Build the next chapter
        </Link>
      </div>
    </div>
  );
}
