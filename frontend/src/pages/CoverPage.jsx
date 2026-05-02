import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResults } from '../context/ResultsContext';
import LoadingState from '../components/LoadingState';
import BookFlip from '../components/BookFlip';

const PALETTE = {
  bg: '#fdf9f4',
  textPrimary: '#1c1208',
  textSecondary: '#7a6a54',
  accent: '#c44f28',
  onAccent: '#fdf9f4',
};

export default function CoverPage() {
  const navigate = useNavigate();
  const { search, searchState, error } = useResults();
  const [value, setValue] = useState('');
  const [submittedIdea, setSubmittedIdea] = useState('');

  const isLoading = searchState === 'loading';

  async function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    setSubmittedIdea(trimmed);
    const result = await search(trimmed);

    if (result) {
      setValue('');
      navigate('/results');
      return;
    }

    setSubmittedIdea('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  return (
    <div
      className={`cover-page${isLoading ? ' is-loading' : ''}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: PALETTE.bg,
        color: PALETTE.textPrimary,
        fontFamily: "'Manrope', sans-serif",
      }}
    >
      {/* Top nav */}
      <div
        className="cover-page__topbar"
        style={{
          padding: '28px 60px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '1.1rem' }}>🪦</span>
        <span
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontWeight: 800,
            fontSize: '0.95rem',
            color: PALETTE.textPrimary,
            letterSpacing: '-0.01em',
          }}
        >
          SCOUT
        </span>
      </div>

      {/* Main content */}
      <div
        className="cover-page__main"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          padding: '0 60px',
          gap: '60px',
        }}
      >
        {/* Left column */}
        <div className="cover-page__copy">
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(2.4rem, 4.5vw, 4rem)',
              lineHeight: 1.1,
              color: PALETTE.textPrimary,
              letterSpacing: '-0.03em',
              marginBottom: '24px',
            }}
          >
            Every idea has<br />
            a <span style={{ color: PALETTE.accent }}>history.</span>
            <br />
            <span style={{ color: PALETTE.textSecondary, fontWeight: 700 }}>
              Open yours<br />before you build.
            </span>
          </h1>

          <p
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 400,
              fontSize: '1rem',
              lineHeight: 1.7,
              color: PALETTE.textSecondary,
              maxWidth: '420px',
              marginBottom: '44px',
            }}
          >
            <strong style={{ color: PALETTE.textPrimary, fontWeight: 700 }}>
              SCOUT
            </strong>{' '}
            turns your idea into a living archive of past projects, abandoned
            attempts, active competitors, and the gap still waiting to be claimed.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="describe your idea..."
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 500,
                fontSize: '0.9rem',
                width: '300px',
                border: `1.5px solid ${PALETTE.textPrimary}`,
                borderRadius: '6px',
                background: 'transparent',
                color: PALETTE.textPrimary,
                padding: '11px 14px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontWeight: 700,
                fontSize: '0.9rem',
                padding: '11px 22px',
                border: `1.5px solid ${PALETTE.accent}`,
                borderRadius: '6px',
                background: PALETTE.accent,
                color: PALETTE.onAccent,
                cursor: isLoading ? 'wait' : 'pointer',
                opacity: isLoading ? 0.7 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {isLoading ? 'Opening...' : 'Open the archive'}
            </button>
          </div>

          {searchState === 'error' && error && !isLoading && (
            <p
              style={{
                marginTop: '20px',
                fontFamily: "'Manrope', sans-serif",
                fontSize: '0.8rem',
                color: PALETTE.accent,
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Right column — book */}
        <div
          className="cover-page__book"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div className="cover-page__book-shell">
            <BookFlip
              coverTitle={value.trim() || 'SCOUT'}
              coverSubtitle={
                value.trim()
                  ? 'Open the archive to see who built it first, what they missed, and where your chapter starts.'
                  : 'A field guide to ideas that came before yours.'
              }
            />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="cover-page__footer"
        style={{
          background: PALETTE.textPrimary,
          padding: '18px 60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1rem' }}>🪦</span>
          <span
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontWeight: 800,
              fontSize: '0.95rem',
              color: '#ffffff',
              letterSpacing: '-0.01em',
            }}
          >
            SCOUT
          </span>
        </div>
        <span
          style={{
            fontFamily: "'Manrope', sans-serif",
            fontSize: '0.78rem',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          your idea's history, before you repeat it
        </span>
      </div>

      {isLoading && <LoadingState variant="overlay" idea={submittedIdea} />}
    </div>
  );
}
