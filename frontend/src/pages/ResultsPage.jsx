import { Navigate, Link } from 'react-router-dom';
import { useResults } from '../context/ResultsContext';
import BookFlip from '../components/BookFlip';
import LoadingState from '../components/LoadingState';

export default function ResultsPage() {
  const { data, searchState } = useResults();

  if (searchState === 'loading') {
    return <LoadingState />;
  }

  if (!data) {
    return <Navigate to="/" replace />;
  }

  const timeline = (data.timeline || []).slice().sort((a, b) => (a.year || 0) - (b.year || 0));
  const years = timeline.map((entry) => entry.year).filter(Boolean);
  const span = years.length ? `${Math.min(...years)} — ${Math.max(...years)}` : 'Unmapped';

  return (
    <div
      className="notebook-page"
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at 50% 18%, rgba(200,168,74,0.1), transparent 42%), linear-gradient(180deg, #0e0c0a 0%, #130d07 52%, #090706 100%)',
        padding: '42px 24px 84px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="desk-surface notebook-page__desk" aria-hidden="true" />
      <div className="candle-light" aria-hidden="true" />
      <div style={{ maxWidth: '1120px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.68rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(200,168,74,0.48)',
              marginBottom: '14px',
            }}
          >
            The notebook of the idea
          </p>
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 'clamp(2.1rem, 4vw, 3.6rem)',
              lineHeight: 1.04,
              letterSpacing: 0,
              color: '#f4e7ce',
              fontWeight: 800,
              maxWidth: '760px',
              margin: '0 auto 16px',
              overflowWrap: 'anywhere',
            }}
          >
            The Idea Archive
          </h1>
          <p
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '1rem',
              lineHeight: 1.8,
              color: 'rgba(245,234,214,0.62)',
              maxWidth: '760px',
              margin: '0 auto',
            }}
          >
            {timeline.length} documented attempt{timeline.length === 1 ? '' : 's'} across {span}. Each page
            shows what shipped, what made it different, why it survived or failed, and what it left
            behind for the next builder.
          </p>
        </header>

        <BookFlip data={data} variant="story" autoOpen />
      </div>

      <div
        style={{
          maxWidth: '900px',
          margin: '0 auto',
          padding: '34px 24px 0',
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Link
          to="/products"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            background: 'rgba(20,14,6,0.62)',
            padding: '10px 16px',
            borderRadius: '999px',
          }}
        >
          → See the raw index
        </Link>
        <Link
          to="/"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            background: 'rgba(20,14,6,0.62)',
            padding: '10px 16px',
            borderRadius: '999px',
          }}
        >
          ← New search
        </Link>
        <Link
          to="/build"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#20170d',
            background: 'var(--accent)',
            textDecoration: 'none',
            padding: '10px 16px',
            borderRadius: '999px',
          }}
        >
          → Build the next chapter
        </Link>
      </div>
    </div>
  );
}
