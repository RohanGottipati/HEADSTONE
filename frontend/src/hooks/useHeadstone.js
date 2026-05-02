import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useHeadstone() {
  const [state, setState] = useState('idle');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  async function search(idea) {
    setState('loading');
    setError(null);
    setData(null);

    try {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
        signal: AbortSignal.timeout(120000),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setState('complete');
    } catch (err) {
      setError(err.name === 'TimeoutError' ? 'Request timed out' : err.message);
      setState('error');
    }
  }

  return { search, state, data, error };
}
