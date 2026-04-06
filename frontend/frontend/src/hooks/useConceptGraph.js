import { getConceptGraph } from '../services/api';
import { useAsync } from './useAsync';

export function useConceptGraph() {
  return useAsync(getConceptGraph, { retries: 0 });
}

