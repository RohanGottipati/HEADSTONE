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
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(196,79,40,0.12), transparent 32%), linear-gradient(180deg, #fbf4eb 0%, #f8efe3 40%, #fefbf6 100%)',
        padding: '42px 24px 84px',
      }}
    >
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.68rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#8d7b62',
              marginBottom: '14px',
            }}
          >
            The notebook of the idea
          </p>
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 'clamp(2.1rem, 4vw, 3.6rem)',
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              color: '#1c1208',
              fontWeight: 800,
              maxWidth: '760px',
              margin: '0 auto 16px',
            }}
          >
            Flip through the documented history of “{data.idea}”
          </h1>
          <p
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '1rem',
              lineHeight: 1.8,
              color: '#6f5f49',
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
        }}
      >
        <Link
          to="/products"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.75rem',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#6f5f49',
            textDecoration: 'none',
            border: '1px solid rgba(28,18,8,0.12)',
            background: 'rgba(255,255,255,0.62)',
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
            color: '#6f5f49',
            textDecoration: 'none',
            border: '1px solid rgba(28,18,8,0.12)',
            background: 'rgba(255,255,255,0.62)',
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
            color: '#fffaf4',
            background: '#c44f28',
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
