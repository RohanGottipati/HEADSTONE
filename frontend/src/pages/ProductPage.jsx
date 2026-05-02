import { Link, Navigate, useParams } from 'react-router-dom';
import { useResults } from '../context/ResultsContext';
import ProductCard from '../components/ProductCard';

export default function ProductPage() {
  const { idx } = useParams();
  const { data } = useResults();

  if (!data) {
    return <Navigate to="/" replace />;
  }

  const timeline = (data.timeline || []).slice().sort((a, b) => (a.year || 0) - (b.year || 0));
  const index = Number.parseInt(idx, 10);

  if (Number.isNaN(index) || index < 0 || index >= timeline.length) {
    return <Navigate to="/products" replace />;
  }

  const entry = timeline[index];
  const prevIndex = index > 0 ? index - 1 : null;
  const nextIndex = index < timeline.length - 1 ? index + 1 : null;
  const isLast = nextIndex === null;

  return (
    <div
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '40px 24px 80px',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: '28px',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-faint)',
          }}
        >
          Page {index + 1} of {timeline.length}
        </p>
        <Link
          to="/products"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.7rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          ← Index
        </Link>
      </header>

      <ProductCard entry={entry} variant="page" />

      <nav
        style={{
          marginTop: '40px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {prevIndex !== null ? (
          <Link
            to={`/product/${prevIndex}`}
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
            ← Previous page
          </Link>
        ) : (
          <span />
        )}
        {isLast ? (
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
            → Final page: your build
          </Link>
        ) : (
          <Link
            to={`/product/${nextIndex}`}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              border: '1px solid var(--accent)',
              padding: '10px 16px',
              borderRadius: '6px',
            }}
          >
            Next page →
          </Link>
        )}
      </nav>
    </div>
  );
}
