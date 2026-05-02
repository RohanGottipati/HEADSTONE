import { useHeadstone } from './hooks/useHeadstone';
import SearchInput from './components/SearchInput';
import LoadingState from './components/LoadingState';
import GraveyardScene from './components/GraveyardScene';

export default function App() {
  const { search, state, data, error } = useHeadstone();

  if (state === 'idle' || state === 'error') {
    return (
      <div>
        <SearchInput onSearch={search} />
        {state === 'error' && (
          <div
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    );
  }

  if (state === 'loading') {
    return <LoadingState />;
  }

  if (state === 'complete' && data) {
    return <GraveyardScene data={data} />;
  }

  return null;
}
