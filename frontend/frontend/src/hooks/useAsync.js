import { useCallback, useRef, useState } from 'react';

export function useAsync(asyncFn, { retries = 0 } = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastArgsRef = useRef(null);

  const run = useCallback(
    async (...args) => {
      lastArgsRef.current = args;
      setLoading(true);
      setError(null);

      let attempt = 0;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        try {
          const result = await asyncFn(...args);
          setLoading(false);
          return result;
        } catch (e) {
          attempt += 1;
          if (attempt > retries) {
            setLoading(false);
            setError(e);
            throw e;
          }
        }
      }
    },
    [asyncFn, retries]
  );

  const retry = useCallback(async () => {
    if (!lastArgsRef.current) return null;
    return run(...lastArgsRef.current);
  }, [run]);

  return { run, retry, loading, error, setError };
}

