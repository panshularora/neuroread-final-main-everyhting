import { askTutor } from '../services/api';
import { useAsync } from './useAsync';

export function useTutor() {
  return useAsync(askTutor, { retries: 0 });
}

