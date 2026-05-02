export default function LoadingState({ variant = 'screen', idea = '' }) {
  const isOverlay = variant === 'overlay';

  return (
    <div className={`loading-state ${isOverlay ? 'loading-state--overlay' : 'loading-state--screen'}`}>
      <div className="loading-state__veil" />

      <div className="loading-state__panel">
        <p className="loading-state__eyebrow">Opening the archive</p>
        <h2 className="loading-state__title">Searching the graveyard...</h2>

        {idea ? <p className="loading-state__idea">{idea}</p> : null}

        <p className="loading-state__copy">
          Digging through old launches, abandoned builds, and live competitors to find the
          pattern underneath.
        </p>

        <div className="loading-state__meter" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}
