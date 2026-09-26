import { useCallback, useEffect, useState } from 'react';

export type Route = 'home' | 'read' | 'learn' | 'practice' | 'progress';

const ROUTES: Route[] = ['home', 'read', 'learn', 'practice', 'progress'];

// Names the components used before routing existed, plus a few aliases.
const ALIASES: Record<string, Route> = {
  assistive: 'home',
  simplify: 'read',
  learning: 'learn',
  dashboard: 'progress',
};

export function toRoute(name: string | undefined | null): Route {
  const key = (name || '').toLowerCase();
  if ((ROUTES as string[]).includes(key)) return key as Route;
  return ALIASES[key] ?? 'home';
}

function readHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0];
  return toRoute(raw);
}

export function hrefFor(route: Route) {
  return route === 'home' ? '#/' : `#/${route}`;
}

/** Tiny hash router: #/learn, #/practice, ... Back/forward and deep links work. */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(readHash);

  useEffect(() => {
    const onChange = () => setRoute(readHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((name: string) => {
    const next = hrefFor(toRoute(name));
    if (window.location.hash !== next) window.location.hash = next;
  }, []);

  return { route, navigate };
}
