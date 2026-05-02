import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useResults } from '../context/ResultsContext';

const STORAGE_NOTES_KEY = 'headstone:planNotes';

const sectionTitle = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '0.7rem',
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--text-faint)',
  marginBottom: '14px',
};

const cardBase = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '24px',
};

function loadNotes(idea) {
  if (typeof window === 'undefined') return '';
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_NOTES_KEY}:${idea}`);
    return raw || '';
  } catch {
    return '';
  }
}

function saveNotes(idea, notes) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(`${STORAGE_NOTES_KEY}:${idea}`, notes);
  } catch {
    // ignore
  }
}

function PlanSection({ title, children }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <p style={sectionTitle}>{title}</p>
      {children}
    </section>
  );
}

function BorrowList({ items }) {
  if (!items || items.length === 0) return <Empty text="No clear winners to borrow from yet." />;
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {items.map((item, i) => (
        <div key={i} style={cardBase}>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '1rem',
              color: 'var(--text-primary)',
              fontWeight: 500,
              marginBottom: '6px',
              overflowWrap: 'anywhere',
            }}
          >
            {item.feature}
          </p>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              overflowWrap: 'anywhere',
            }}
          >
            {item.why}
          </p>
          {item.source && (
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                color: 'var(--alive)',
                marginTop: '10px',
                overflowWrap: 'anywhere',
              }}
            >
              from {item.source}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function AvoidList({ items }) {
  if (!items || items.length === 0)
    return <Empty text="No clear failure modes were extracted from past attempts." />;
  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            ...cardBase,
            borderLeft: '3px solid #a85050',
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '1rem',
              color: 'var(--text-primary)',
              fontWeight: 500,
              marginBottom: '6px',
              overflowWrap: 'anywhere',
            }}
          >
            {item.mistake}
          </p>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              overflowWrap: 'anywhere',
            }}
          >
            {item.why}
          </p>
          {item.source && (
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.7rem',
                letterSpacing: '0.1em',
                color: '#a85050',
                marginTop: '10px',
                overflowWrap: 'anywhere',
              }}
            >
              killed {item.source}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function MvpBlock({ mvp }) {
  if (!mvp) return null;
  const empty =
    !mvp.summary &&
    (!mvp.must_have_features || mvp.must_have_features.length === 0) &&
    (!mvp.explicitly_not_in_mvp || mvp.explicitly_not_in_mvp.length === 0) &&
    !mvp.first_user_test;
  if (empty) return <Empty text="MVP plan unavailable." />;
  return (
    <div style={cardBase}>
      {mvp.summary && (
        <p
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '1.25rem',
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            marginBottom: '20px',
            overflowWrap: 'anywhere',
          }}
        >
          {mvp.summary}
        </p>
      )}
      {mvp.must_have_features && mvp.must_have_features.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ ...sectionTitle, marginBottom: '8px' }}>Must-have features</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {mvp.must_have_features.map((feature, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.95rem',
                  color: 'var(--text-primary)',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border)',
                  overflowWrap: 'anywhere',
                }}
              >
                <span style={{ color: 'var(--accent)', marginRight: '10px' }}>+</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
      {mvp.explicitly_not_in_mvp && mvp.explicitly_not_in_mvp.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ ...sectionTitle, marginBottom: '8px' }}>Defer (not in MVP)</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {mvp.explicitly_not_in_mvp.map((feature, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  padding: '6px 0',
                  textDecoration: 'line-through',
                  textDecorationColor: 'var(--text-faint)',
                  overflowWrap: 'anywhere',
                }}
              >
                <span style={{ color: 'var(--text-faint)', marginRight: '10px' }}>×</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
      {mvp.first_user_test && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: '16px',
            marginTop: '12px',
          }}
        >
          <p style={{ ...sectionTitle, marginBottom: '8px' }}>First user test</p>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              lineHeight: 1.55,
              overflowWrap: 'anywhere',
            }}
          >
            {mvp.first_user_test}
          </p>
        </div>
      )}
    </div>
  );
}

function V1Features({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            ...cardBase,
            padding: '16px 20px',
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              fontWeight: 500,
              marginBottom: '4px',
              overflowWrap: 'anywhere',
            }}
          >
            {item.feature}
          </p>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              overflowWrap: 'anywhere',
            }}
          >
            {item.why}
          </p>
          {item.inspired_by && (
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '0.7rem',
                color: 'var(--text-faint)',
                marginTop: '8px',
                overflowWrap: 'anywhere',
              }}
            >
              inspired by {item.inspired_by}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Risks({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            ...cardBase,
            padding: '14px 18px',
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              fontWeight: 500,
              marginBottom: '4px',
              overflowWrap: 'anywhere',
            }}
          >
            {item.risk}
          </p>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
              overflowWrap: 'anywhere',
            }}
          >
            {item.mitigation}
          </p>
        </div>
      ))}
    </div>
  );
}

function NextSteps({ steps }) {
  if (!steps || steps.length === 0) return null;
  return (
    <ol style={{ listStyle: 'none', counterReset: 'step', padding: 0, margin: 0 }}>
      {steps.map((step, i) => (
        <li
          key={i}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            padding: '14px 0',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.6rem',
              color: 'var(--accent)',
              lineHeight: 1,
              minWidth: '32px',
            }}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              lineHeight: 1.5,
              overflowWrap: 'anywhere',
            }}
          >
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Empty({ text }) {
  return (
    <p
      style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        fontSize: '0.9rem',
        color: 'var(--text-faint)',
        fontStyle: 'italic',
      }}
    >
      {text}
    </p>
  );
}

export default function BuildPlanPage() {
  const { data, plan, planState, planError, buildPlan } = useResults();
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (data?.idea) {
      setNotes(loadNotes(data.idea));
    }
  }, [data?.idea]);

  useEffect(() => {
    if (data && !plan && planState === 'idle') {
      buildPlan();
    }
  }, [data, plan, planState, buildPlan]);

  function handleNotesChange(e) {
    const next = e.target.value;
    setNotes(next);
    if (data?.idea) saveNotes(data.idea, next);
  }

  if (!data) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      style={{
        maxWidth: '760px',
        margin: '0 auto',
        padding: '60px 24px 100px',
      }}
    >
      <header style={{ marginBottom: '40px' }}>
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
          The next chapter
        </p>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '2.4rem',
            color: 'var(--text-primary)',
            fontWeight: 500,
            lineHeight: 1.15,
            overflowWrap: 'anywhere',
          }}
        >
          {plan?.headline || `Your build of "${data.idea}"`}
        </h1>
        {plan?.positioning && (
          <p
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              marginTop: '14px',
              lineHeight: 1.6,
              overflowWrap: 'anywhere',
            }}
          >
            {plan.positioning}
          </p>
        )}
      </header>

      {planState === 'loading' && !plan && (
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            color: 'var(--text-secondary)',
            animation: 'pulse-loading 2s ease-in-out infinite',
            marginBottom: '40px',
          }}
        >
          drafting your build plan...
        </p>
      )}

      {planState === 'error' && (
        <div
          style={{
            ...cardBase,
            borderColor: '#a85050',
            marginBottom: '40px',
          }}
        >
          <p style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
            We couldn&rsquo;t draft a plan ({planError || 'unknown error'}).
          </p>
          <button
            onClick={buildPlan}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bg)',
              background: 'var(--accent)',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {plan && (
        <>
          <PlanSection title="Borrow from the winners">
            <BorrowList items={plan.borrow_from_winners} />
          </PlanSection>

          <PlanSection title="Mistakes you must not repeat">
            <AvoidList items={plan.avoid_from_losers} />
          </PlanSection>

          <PlanSection title="MVP — the smallest thing worth shipping">
            <MvpBlock mvp={plan.mvp} />
          </PlanSection>

          {plan.v1_features && plan.v1_features.length > 0 && (
            <PlanSection title="V1 — what you add once the MVP works">
              <V1Features items={plan.v1_features} />
            </PlanSection>
          )}

          {plan.moat && (
            <PlanSection title="Moat">
              <p
                style={{
                  ...cardBase,
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.6,
                  borderLeft: '3px solid var(--accent)',
                  overflowWrap: 'anywhere',
                }}
              >
                {plan.moat}
              </p>
            </PlanSection>
          )}

          {plan.risks && plan.risks.length > 0 && (
            <PlanSection title="Risks & mitigations">
              <Risks items={plan.risks} />
            </PlanSection>
          )}

          {plan.next_three_steps && plan.next_three_steps.length > 0 && (
            <PlanSection title="Next 3 steps this week">
              <NextSteps steps={plan.next_three_steps} />
            </PlanSection>
          )}
        </>
      )}

      <PlanSection title="Your iteration notes">
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Edit, rewrite, or add your own ideas here. This stays in your browser."
          rows={8}
          style={{
            width: '100%',
            background: 'var(--surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '0.9rem',
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </PlanSection>

      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          gap: '12px',
          justifyContent: 'space-between',
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
            color: 'var(--text-secondary)',
            textDecoration: 'none',
            border: '1px solid var(--border)',
            padding: '10px 16px',
            borderRadius: '6px',
          }}
        >
          ← Back to products
        </Link>
        {plan && (
          <button
            onClick={() => buildPlan({ force: true })}
            disabled={planState === 'loading'}
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.75rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--bg)',
              background: 'var(--accent)',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: planState === 'loading' ? 'wait' : 'pointer',
              opacity: planState === 'loading' ? 0.6 : 1,
            }}
          >
            {planState === 'loading' ? 'Re-drafting...' : 'Re-draft plan'}
          </button>
        )}
      </div>
    </div>
  );
}
