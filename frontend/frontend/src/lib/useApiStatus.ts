import { useSyncExternalStore } from 'react';
import { API_CONFIGURED, checkHealth } from '../services/api';

export type ApiStatus = 'checking' | 'online' | 'offline' | 'unconfigured';

// One health check shared by every component that asks.
let pending: Promise<ApiStatus> | null = null;
const listeners = new Set<() => void>();
let current: ApiStatus = API_CONFIGURED ? 'checking' : 'unconfigured';

function publish(next: ApiStatus) {
  current = next;
  listeners.forEach((fn) => fn());
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

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // The first subscriber starts the check; later ones read the shared result.
  if (!pending) recheckApi();
  return () => {
    listeners.delete(onChange);
  };
}

const getSnapshot = () => current;

export function useApiStatus() {
  const status = useSyncExternalStore(subscribe, getSnapshot);
  return { status, recheck: recheckApi };
}
