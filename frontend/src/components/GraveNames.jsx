import { useRef, useEffect } from 'react';
import GraveEntry from './GraveEntry';

export default function GraveNames({ timeline, showNames, inscriptions }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (showNames && listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showNames]);

  return (
    <div
      ref={listRef}
      style={{
        opacity: showNames ? 1 : 0,
        transition: 'opacity 600ms ease',
      }}
    >
      {(timeline || []).map((entry, i) => (
        <GraveEntry
          key={i}
          entry={entry}
          index={i}
          showInscription={inscriptions[i] || false}
        />
      ))}
    </div>
  );
}
