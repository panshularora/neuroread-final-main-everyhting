import { useEffect, useState } from 'react';
import { API_CONFIGURED, checkHealth } from '../services/api';

export type ApiStatus = 'checking' | 'online' | 'offline' | 'unconfigured';

// One health check shared by every component that asks.
let pending: Promise<ApiStatus> | null = null;
const listeners = new Set<(s: ApiStatus) => void>();
let current: ApiStatus = API_CONFIGURED ? 'checking' : 'unconfigured';

function publish(next: ApiStatus) {
  current = next;
  listeners.forEach((fn) => fn(next));
}

export function recheckApi(): Promise<ApiStatus> {
  if (!API_CONFIGURED) return Promise.resolve('unconfigured');
  publish('checking');
  pending = checkHealth()
    .then((ok) => (ok ? 'online' : 'offline') as ApiStatus)
    .catch(() => 'offline' as ApiStatus)
    .then((s) => {
      publish(s);
      return s;
    });
  return pending;
}

export function useApiStatus() {
  const [status, setStatus] = useState<ApiStatus>(current);

  useEffect(() => {
    listeners.add(setStatus);
    if (!pending) recheckApi();
    else setStatus(current);
    return () => {
      listeners.delete(setStatus);
    };
  }, []);

  return { status, recheck: recheckApi };
}
