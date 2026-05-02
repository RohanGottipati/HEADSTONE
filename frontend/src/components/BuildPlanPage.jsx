function getBestFeatures(data) {
  const competitorFeatures = (data.competitors || []).map((comp) => ({
    name: comp.name,
    feature: `Parity baseline for ${comp.name}: solve their core use case, then improve on this weakness: ${comp.weakness || 'unknown weakness'}.`,
  }));

  const recurring = data.turn_sentence
    ? `Retention guardrail: design around this recurring failure pattern from day one - ${data.turn_sentence}`
    : 'Retention guardrail: instrument activation and retention from week one.';

  return [
    { name: 'Core value loop', feature: recurring },
    ...competitorFeatures.slice(0, 3),
    {
      name: 'Trust + evidence layer',
      feature: 'Make outcomes visible to users with clear progress signals and source-backed explanations.',
    },
  ];
}

function getMistakesToAvoid(data) {
  const failedEntries = (data.timeline || []).filter((entry) => !entry.is_alive);
  const reasons = failedEntries.map((entry) => entry.cause_of_death).filter(Boolean);

  if (reasons.length === 0) {
    return ['Do not ship blind: set up retention, engagement, and conversion instrumentation before launch.'];
  }

  return Array.from(new Set(reasons)).slice(0, 5);
}

function buildIterativePlan(data) {
  const mistakes = getMistakesToAvoid(data);
  const features = getBestFeatures(data);

  return [
    {
      phase: 'Phase 1 - Problem and wedge',
      objective: 'Build the smallest version that proves users return without manual nudging.',
      checklist: [
        'Define one primary persona and one painful workflow to replace.',
        'Ship an onboarding flow that demonstrates value in under five minutes.',
        `Capture activation and 7-day retention as hard metrics.`,
        `Anti-mistake constraint: ${mistakes[0] || 'avoid building features with no retention proof.'}`,
      ],
    },
    {
      phase: 'Phase 2 - Feature parity plus one leap',
      objective: 'Match category expectations, then exceed them on one differentiator.',
      checklist: [
        ...features.slice(0, 3).map((item) => item.feature),
        `Set explicit kill criteria for weak features so scope stays tight.`,
      ],
    },
    {
      phase: 'Phase 3 - Scale and durability',
      objective: 'Turn an interesting product into a durable business.',
      checklist: [
        'Design retention loops (notifications, recurring tasks, collaborative hooks).',
        'Build monetization only after repeat usage is stable.',
        `Run monthly failure reviews against historical mistakes: ${mistakes.slice(1, 3).join(' | ') || 'no additional mistakes found.'}`,
      ],
    },
  ];
}

export default function BuildPlanPage({ data, pageNumber, totalPages, onPrevious, onRestart }) {
  const plan = buildIterativePlan(data);
  const mistakes = getMistakesToAvoid(data);
  const features = getBestFeatures(data);

  return (
    <div style={{ minHeight: '100vh', padding: '32px 18px', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '880px' }}>
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: '18px',
            background: 'linear-gradient(180deg, #12100d 0%, #0b0b0b 100%)',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          }}
        >
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            FINAL PAGE {pageNumber} / {totalPages}
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: 'var(--accent)', fontSize: '2.1rem', marginBottom: '8px' }}>
            Your Next Chapter: Iterative Build Plan
          </h1>
          <p style={{ color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: '18px' }}>
            {data.gap || 'Use this page to define the exact market gap your product should claim.'}
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '22px' }}>
            Timing signal: {data.clock || 'Timing signal unavailable.'}
          </p>

          <section style={{ marginBottom: '20px' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Best Features To Include
            </p>
            <div style={{ display: 'grid', gap: '10px' }}>
              {features.map((item, idx) => (
                <div key={`${item.name}-${idx}`} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '10px 12px' }}>
                  <p style={{ color: 'var(--accent)', marginBottom: '4px' }}>{item.name}</p>
                  <p style={{ color: 'var(--text-primary)', lineHeight: 1.6 }}>{item.feature}</p>
                </div>
              ))}
            </div>
          </section>

          <section style={{ marginBottom: '20px' }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Mistakes To Avoid
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              {mistakes.map((mistake, idx) => (
                <p key={`${mistake}-${idx}`} style={{ color: 'var(--text-primary)', borderLeft: '2px solid #5e2a2a', paddingLeft: '10px' }}>
                  {mistake}
                </p>
              ))}
            </div>
          </section>

          <section>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Full Build Plan (Iterate This Weekly)
            </p>
            <div style={{ display: 'grid', gap: '12px' }}>
              {plan.map((phase) => (
                <article key={phase.phase} style={{ border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}>
                  <h3 style={{ color: 'var(--accent)', marginBottom: '4px' }}>{phase.phase}</h3>
                  <p style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>{phase.objective}</p>
                  {phase.checklist.map((line, idx) => (
                    <p key={`${line}-${idx}`} style={{ color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      - {line}
                    </p>
                  ))}
                </article>
              ))}
            </div>
          </section>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', gap: '12px' }}>
          <button
            onClick={onPrevious}
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              background: 'transparent',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            Previous page
          </button>
          <button
            onClick={onRestart}
            style={{
              border: '1px solid var(--accent)',
              color: 'var(--accent)',
              background: 'transparent',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: 'pointer',
            }}
          >
            Start another story
          </button>
        </div>
      </div>
    </div>
  );
}
