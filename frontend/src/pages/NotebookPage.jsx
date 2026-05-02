import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useResults } from '../context/ResultsContext';
import BookFlip from '../components/BookFlip';
import LoadingState from '../components/LoadingState';

const STORAGE_NOTES_KEY = 'headstone:planNotes';

function loadNotes(idea) {
  if (typeof window === 'undefined') return '';
  try {
    return window.sessionStorage.getItem(`${STORAGE_NOTES_KEY}:${idea}`) || '';
  } catch {
    return '';
  }
}

function saveNotes(idea, notes) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`${STORAGE_NOTES_KEY}:${idea}`, notes);
  } catch {
    // ignore storage quota errors
  }
}

function getSpan(timeline) {
  const years = timeline.map((entry) => entry.year).filter(Boolean);
  return years.length ? `${Math.min(...years)} — ${Math.max(...years)}` : 'Unmapped';
}

function getRouteMeta({ pathname, data, timeline, productIndex, plan }) {
  const span = getSpan(timeline);
  const entry = typeof productIndex === 'number' ? timeline[productIndex] : null;

  if (pathname === '/products') {
    return {
      eyebrow: 'The notebook index',
      title: `Every attempt at "${data.idea}"`,
      body: `${timeline.length} attempt${timeline.length === 1 ? '' : 's'} across ${span}. The notebook opens to the index, and each entry jumps to its page in the archive.`,
    };
  }

  if (pathname === '/build') {
    return {
      eyebrow: 'The next chapter',
      title: plan?.headline || `Your build of "${data.idea}"`,
      body:
        plan?.positioning ||
        'The notebook opens to the build plan, using the archive as constraints for what to borrow, what to avoid, and what to ship first.',
    };
  }

  if (entry) {
    return {
      eyebrow: `Notebook page ${productIndex + 1} of ${timeline.length}`,
      title: entry.title || `Attempt ${productIndex + 1}`,
      body:
        entry.what_was_built ||
        'This route opens the notebook directly to the selected attempt in the archive.',
    };
  }

  return {
    eyebrow: 'The notebook of the idea',
    title: `Flip through the documented history of "${data.idea}"`,
    body: `${timeline.length} documented attempt${timeline.length === 1 ? '' : 's'} across ${span}. Each page shows what shipped, what made it different, why it survived or failed, and what it left behind for the next builder.`,
  };
}

function BuildTools({ data, plan, planState, planError, buildPlan }) {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (data?.idea) {
      setNotes(loadNotes(data.idea));
    }
  }, [data?.idea]);

  function handleNotesChange(event) {
    const next = event.target.value;
    setNotes(next);
    if (data?.idea) saveNotes(data.idea, next);
  }

  const isLoading = planState === 'loading';

  return (
    <section
      style={{
        maxWidth: '900px',
        margin: '30px auto 0',
        padding: '0 4px',
      }}
    >
      <div
        style={{
          border: '1px solid rgba(28,18,8,0.12)',
          borderRadius: '18px',
          background: 'rgba(255,255,255,0.62)',
          boxShadow: '0 18px 50px rgba(28,18,8,0.08)',
          padding: '22px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.66rem',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#8d7b62',
                marginBottom: '8px',
              }}
            >
              Iteration desk
            </p>
            <h2
              style={{
                fontFamily: "'Manrope', sans-serif",
                fontSize: '1.15rem',
                color: '#1c1208',
                fontWeight: 800,
                lineHeight: 1.2,
              }}
            >
              Notes and redraft controls
            </h2>
          </div>

          <button
            type="button"
            onClick={() => buildPlan({ force: Boolean(plan) })}
            disabled={isLoading}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.7rem',
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#fffaf4',
              background: '#c44f28',
              border: 'none',
              borderRadius: '999px',
              padding: '10px 14px',
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.62 : 1,
            }}
          >
            {isLoading ? 'Drafting...' : plan ? 'Re-draft plan' : 'Draft plan'}
          </button>
        </div>

        {planState === 'error' && (
          <p
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '0.9rem',
              color: '#8f3323',
              lineHeight: 1.6,
              marginBottom: '14px',
            }}
          >
            The planner could not finish this draft{planError ? `: ${planError}` : '.'}
          </p>
        )}

        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Edit, rewrite, or add your own ideas here. This stays in your browser."
          rows={6}
          style={{
            width: '100%',
            background: '#fffdf9',
            color: '#1c1208',
            border: '1px solid rgba(28,18,8,0.14)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.86rem',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </div>
    </section>
  );
}

export default function NotebookPage() {
  const { data, searchState, plan, planState, planError, buildPlan } = useResults();
  const location = useLocation();
  const navigate = useNavigate();
  const { idx } = useParams();

  const timeline = useMemo(
    () => (data?.timeline || []).slice().sort((a, b) => (a.year || 0) - (b.year || 0)),
    [data]
  );

  const isProductRoute = location.pathname.startsWith('/product/');
  const productIndex = isProductRoute ? Number.parseInt(idx, 10) : null;

  let targetPageId = 'history';
  if (location.pathname === '/products') {
    targetPageId = 'index';
  } else if (location.pathname === '/build') {
    targetPageId = 'build';
  } else if (isProductRoute) {
    targetPageId = `attempt-${productIndex}`;
  }

  useEffect(() => {
    if (targetPageId === 'build' && data && !plan && planState === 'idle') {
      buildPlan();
    }
  }, [buildPlan, data, plan, planState, targetPageId]);

  if (searchState === 'loading') {
    return <LoadingState />;
  }

  if (!data) {
    return <Navigate to="/" replace />;
  }

  if (
    isProductRoute &&
    (Number.isNaN(productIndex) || productIndex < 0 || productIndex >= timeline.length)
  ) {
    return <Navigate to="/products" replace />;
  }

  const meta = getRouteMeta({
    pathname: location.pathname,
    data,
    timeline,
    productIndex: isProductRoute ? productIndex : null,
    plan,
  });

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
            {meta.eyebrow}
          </p>
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: 'clamp(2.1rem, 4vw, 3.6rem)',
              lineHeight: 1.04,
              letterSpacing: 0,
              color: '#1c1208',
              fontWeight: 800,
              maxWidth: '820px',
              margin: '0 auto 16px',
              overflowWrap: 'anywhere',
            }}
          >
            {meta.title}
          </h1>
          <p
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: '1rem',
              lineHeight: 1.8,
              color: '#6f5f49',
              maxWidth: '780px',
              margin: '0 auto',
              overflowWrap: 'anywhere',
            }}
          >
            {meta.body}
          </p>
        </header>

        <BookFlip
          data={data}
          variant="story"
          targetPageId={targetPageId}
          plan={plan}
          planState={planState}
          planError={planError}
          onNavigate={navigate}
        />

        {location.pathname === '/build' && (
          <BuildTools
            data={data}
            plan={plan}
            planState={planState}
            planError={planError}
            buildPlan={buildPlan}
          />
        )}
      </div>
    </div>
  );
}
