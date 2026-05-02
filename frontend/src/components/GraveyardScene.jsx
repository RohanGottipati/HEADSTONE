import { useRef, useEffect } from 'react';
import { useNarrativeReveal } from '../hooks/useNarrativeReveal';
import GraveNames from './GraveNames';
import TurnLine from './TurnLine';
import LivingSection from './LivingSection';
import GapSection from './GapSection';
import ClockLine from './ClockLine';
import FinalStone from './FinalStone';
import ResearchQuality from './ResearchQuality';

export default function GraveyardScene({ data }) {
  const revealed = useNarrativeReveal(data);
  const sortedTimeline = (data.timeline || [])
    .slice()
    .sort((a, b) => (a.year || 0) - (b.year || 0));

  const turnRef = useRef(null);
  const livingRef = useRef(null);
  const gapRef = useRef(null);
  const clockRef = useRef(null);
  const finalRef = useRef(null);

  useEffect(() => {
    if (revealed.turnLine && turnRef.current) {
      turnRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [revealed.turnLine]);

  useEffect(() => {
    if (revealed.living && livingRef.current) {
      livingRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [revealed.living]);

  useEffect(() => {
    if (revealed.gap && gapRef.current) {
      gapRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [revealed.gap]);

  useEffect(() => {
    if (revealed.clock && clockRef.current) {
      clockRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [revealed.clock]);

  useEffect(() => {
    if (revealed.finalStone && finalRef.current) {
      finalRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [revealed.finalStone]);

  return (
    <div
      style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '80px 24px',
      }}
    >
      <GraveNames
        timeline={sortedTimeline}
        showNames={revealed.graveNames}
        inscriptions={revealed.inscriptions}
      />

      <div style={{ height: '80px' }} />

      <div ref={turnRef}>
        <TurnLine sentence={data.turn_sentence} visible={revealed.turnLine} patternConfidence={data.pattern_confidence} />
      </div>

      <div style={{ height: '40px' }} />

      <ResearchQuality quality={data.research_quality} visible={revealed.turnLine} />

      <div style={{ height: '60px' }} />

      <div ref={livingRef}>
        <LivingSection competitors={data.competitors} visible={revealed.living} />
      </div>

      <div style={{ height: '60px' }} />

      <div ref={gapRef}>
        <GapSection gap={data.gap} visible={revealed.gap} />
      </div>

      <div style={{ height: '40px' }} />

      <div ref={clockRef}>
        <ClockLine clock={data.clock} visible={revealed.clock} />
      </div>

      <div style={{ height: '120px' }} />

      <div ref={finalRef}>
        <FinalStone visible={revealed.finalStone} />
      </div>
    </div>
  );
}
