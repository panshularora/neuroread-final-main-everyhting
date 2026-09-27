import { useCallback, useRef, useState } from 'react';

export function useAsync<Args extends unknown[], Result>(
  asyncFn: (...args: Args) => Promise<Result>,
  { retries = 0 }: { retries?: number } = {},
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const lastArgsRef = useRef<Args | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<Result> => {
      lastArgsRef.current = args;
      setLoading(true);
      setError(null);

      for (let attempt = 0; ; attempt += 1) {
        try {
          const result = await asyncFn(...args);
          setLoading(false);
          return result;
        } catch (e) {
          if (attempt >= retries) {
            setLoading(false);
            setError(e);
            throw e;
          }
        }
      }
    },
    [asyncFn, retries],
  );

  const retry = useCallback(async (): Promise<Result | null> => {
    if (!lastArgsRef.current) return null;
    return run(...lastArgsRef.current);
  }, [run]);

  return { run, retry, loading, error, setError };
}
