import { useState, useEffect, useRef } from 'react';

export function useNarrativeReveal(data) {
  const [revealed, setRevealed] = useState({
    graveNames: false,
    inscriptions: [],
    turnLine: false,
    living: false,
    gap: false,
    clock: false,
    finalStone: false,
  });

  const timersRef = useRef([]);

  useEffect(() => {
    if (!data) return;

    const timelineLength = data.timeline?.length || 0;
    const inscriptions = new Array(timelineLength).fill(false);
    const timers = [];

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timers.push(id);
    };

    // t=200ms: graveNames
    schedule(() => {
      setRevealed((prev) => ({ ...prev, graveNames: true }));
    }, 200);

    // t=1400ms + (i * 800ms): each inscription
    for (let i = 0; i < timelineLength; i++) {
      schedule(() => {
        setRevealed((prev) => {
          const next = [...prev.inscriptions];
          next[i] = true;
          return { ...prev, inscriptions: next };
        });
      }, 1400 + i * 800);
    }

    // Last inscription time
    const lastInscriptionTime = 1400 + timelineLength * 800;

    // t = lastInscription + 2000ms: turnLine (THE 2 SECOND SILENCE)
    schedule(() => {
      setRevealed((prev) => ({ ...prev, turnLine: true }));
    }, lastInscriptionTime + 2000);

    // t = lastInscription + 2600ms: living
    schedule(() => {
      setRevealed((prev) => ({ ...prev, living: true }));
    }, lastInscriptionTime + 2600);

    // t = lastInscription + 3400ms: gap
    schedule(() => {
      setRevealed((prev) => ({ ...prev, gap: true }));
    }, lastInscriptionTime + 3400);

    // t = lastInscription + 4600ms: clock
    schedule(() => {
      setRevealed((prev) => ({ ...prev, clock: true }));
    }, lastInscriptionTime + 4600);

    // t = lastInscription + 6100ms: finalStone (1500ms after clock)
    schedule(() => {
      setRevealed((prev) => ({ ...prev, finalStone: true }));
    }, lastInscriptionTime + 6100);

    timersRef.current = timers;

    // Initialize inscriptions array
    setRevealed((prev) => ({ ...prev, inscriptions }));

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [data]);

  return revealed;
}
