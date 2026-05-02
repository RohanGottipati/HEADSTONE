import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'scout:lastResult';
const PLAN_STORAGE_KEY = 'scout:lastPlan';

const ResultsContext = createContext(null);

function loadFromStorage(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveToStorage(key, value) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) {
      window.sessionStorage.removeItem(key);
    } else {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // ignore quota errors
  }
}

export function ResultsProvider({ children }) {
  const [searchState, setSearchState] = useState('idle');
  const [data, setData] = useState(() => loadFromStorage(STORAGE_KEY));
  const [error, setError] = useState(null);

  const [plan, setPlan] = useState(() => loadFromStorage(PLAN_STORAGE_KEY));
  const [planState, setPlanState] = useState('idle');
  const [planError, setPlanError] = useState(null);

  useEffect(() => {
    saveToStorage(STORAGE_KEY, data);
  }, [data]);

  useEffect(() => {
    saveToStorage(PLAN_STORAGE_KEY, plan);
  }, [plan]);

  const search = useCallback(async (idea) => {
    setSearchState('loading');
    setError(null);
    setPlan(null);
    setPlanState('idle');
    setPlanError(null);

    try {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea }),
        signal: AbortSignal.timeout(195000),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setSearchState('complete');
      return result;
    } catch (err) {
      setError(err.name === 'TimeoutError' ? 'Request timed out' : err.message);
      setSearchState('error');
      return null;
    }
  }, []);

  const buildPlan = useCallback(async ({ force = false } = {}) => {
    if (!data) return null;
    if (plan && !force) return plan;

    setPlanState('loading');
    setPlanError(null);

    try {
      const response = await fetch(`${API_URL}/api/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: data.idea,
          timeline: data.timeline,
          competitors: data.competitors,
          gap: data.gap,
          clock: data.clock,
          turn_sentence: data.turn_sentence,
          research_quality: data.research_quality,
        }),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setPlan(result.plan);
      setPlanState('complete');
      return result.plan;
    } catch (err) {
      setPlanError(err.name === 'TimeoutError' ? 'Request timed out' : err.message);
      setPlanState('error');
      return null;
    }
  }, [data, plan]);

  const reset = useCallback(() => {
    setData(null);
    setSearchState('idle');
    setError(null);
    setPlan(null);
    setPlanState('idle');
    setPlanError(null);
  }, []);

  const value = useMemo(
    () => ({
      data,
      searchState,
      error,
      search,
      plan,
      planState,
      planError,
      buildPlan,
      reset,
    }),
    [data, searchState, error, search, plan, planState, planError, buildPlan, reset]
  );

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>;
}

export function useResults() {
  const ctx = useContext(ResultsContext);
  if (!ctx) {
    throw new Error('useResults must be used within ResultsProvider');
  }
  return ctx;
}
