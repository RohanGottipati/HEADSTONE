import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useResults } from '../context/ResultsContext';
import LoadingState from '../components/LoadingState';

export default function CoverPage() {
  const navigate = useNavigate();
  const { search, searchState, error } = useResults();
  const [value, setValue] = useState('');
  const [submittedIdea, setSubmittedIdea] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  const isLoading = searchState === 'loading';

  async function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;

    setSubmittedIdea(trimmed);
    setIsOpening(true);
    const result = await search(trimmed);

    if (result) {
      setValue('');
      navigate('/results');
      return;
    }

    setSubmittedIdea('');
    setIsOpening(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  return (
    <div className={`cover-page${isLoading ? ' is-loading' : ''}`}>
      <div className="desk-surface" aria-hidden="true" />
      <div className="candle-light" aria-hidden="true" />

      <header className="cover-page__topbar">
        <Link className="cover-page__brand" to="/">
          <span className="cover-page__brand-mark" aria-hidden="true" />
          <span>SCOUT</span>
        </Link>
        <span className="cover-page__tag">The idea biography</span>
      </header>

      <main className="cover-page__stage">
        <section className="cover-page__copy" aria-label="Intro">
          <p className="cover-page__eyebrow">Every idea has a history</p>
          <h1>
            Open yours before you build.
          </h1>
          <p>
            SCOUT turns a hackathon idea into a living archive of past attempts,
            abandoned repos, active competitors, repeated failure patterns, and
            the gap still waiting to be claimed.
          </p>
        </section>

        <section className="cover-page__book-shell" aria-label="Search the archive">
          <div className={`closed-book${isOpening ? ' opening' : ''}`}>
            <div className="book-spine-el" aria-hidden="true" />
            <div className="book-cover-front">
              <div className="cover-title">SCOUT</div>
              <div className="cover-divider" />
              <div className="cover-subtitle">The idea biography</div>

              <div className="cover-input-area">
                <label className="cover-prompt" htmlFor="idea-input">
                  What idea are you building?
                </label>
                <input
                  id="idea-input"
                  className="cover-input"
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  placeholder="mental health journaling app"
                  autoComplete="off"
                  autoFocus
                />
                <button
                  className="cover-open-btn"
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !value.trim()}
                >
                  {isLoading ? 'Opening' : 'Open'}
                </button>
              </div>

              <div className="cover-idea-display">
                {value.trim() || 'The graveyard of your idea, finally visible.'}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="cover-page__footer">
        <span>Devpost, GitHub, Product Hunt, and web signals</span>
        <span>your name belongs on the final page</span>
      </footer>

      {isLoading && <LoadingState variant="overlay" idea={submittedIdea} />}

      {searchState === 'error' && error && !isLoading && (
        <div className="cover-page__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
