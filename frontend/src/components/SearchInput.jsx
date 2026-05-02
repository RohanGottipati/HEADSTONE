import { useState } from 'react';

export default function SearchInput({ onSearch }) {
  const [value, setValue] = useState('');

  function handleKeyDown(e) {
    if (e.key === 'Enter' && value.trim()) {
      onSearch(value.trim());
      setValue('');
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px',
      }}
    >
      <h1
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '2.5rem',
          color: 'var(--accent)',
          fontWeight: 400,
        }}
      >
        HEADSTONE
      </h1>
      <div style={{ height: '16px' }} />
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
        }}
      >
        Every idea has a history.
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
        }}
      >
        Most of it is buried.
      </p>
      <div style={{ height: '40px' }} />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="describe your idea..."
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '1rem',
          width: '100%',
          maxWidth: '480px',
          border: 'none',
          borderBottom: '1px solid var(--border)',
          background: 'transparent',
          color: 'var(--text-primary)',
          padding: '8px 0',
          outline: 'none',
        }}
      />
    </div>
  );
}
