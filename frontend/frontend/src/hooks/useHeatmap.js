import { useMemo } from 'react';
import { getHeatmap } from '../services/api';
import { useAsync } from './useAsync';

export function useHeatmap() {
  const asyncState = useAsync(getHeatmap, { retries: 0 });
  return asyncState;
}

