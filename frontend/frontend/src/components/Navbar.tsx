import { BookOpenText, ChartLine, GraduationCap, Puzzle, SlidersHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Logo from './Logo';
import { hrefFor } from '../lib/useHashRoute';
import type { Route } from '../lib/useHashRoute';

type NavItem = { route: Route; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { route: 'home', label: 'Read', icon: BookOpenText },
  { route: 'learn', label: 'Learn', icon: GraduationCap },
  { route: 'practice', label: 'Practice', icon: Puzzle },
  { route: 'progress', label: 'Progress', icon: ChartLine },
];

function isActive(item: NavItem, route: Route) {
  return item.route === route || (item.route === 'home' && route === 'read');
}

export default function Navbar({
  route,
  onOpenSettings,
}: {
  route: Route;
  onOpenSettings: () => void;
}) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#/" className="flex items-center gap-2.5 rounded-lg text-primary" aria-label="NeuroRead home">
            <Logo className="h-8 w-8" />
            <span className="font-display text-xl font-semibold text-ink">NeuroRead</span>
          </a>

          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item, route);
                return (
                  <li key={item.route}>
                    <a
                      href={hrefFor(item.route)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-base font-bold transition-colors ${
                        active ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-ink/5 hover:text-ink'
                      }`}
                    >
                      <item.icon className="h-5 w-5" aria-hidden="true" />
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-bold text-ink hover:border-primary/40"
          >
            <SlidersHorizontal className="h-5 w-5 text-primary" aria-hidden="true" />
            <span className="hidden sm:inline">Reading settings</span>
            <span className="sm:hidden">Settings</span>
          </button>
        </div>
      </header>

      {/* Phones get a bottom tab bar: reachable with a thumb, always visible. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item, route);
            return (
              <li key={item.route}>
                <a
                  href={hrefFor(item.route)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 text-xs font-bold ${
                    active ? 'text-primary' : 'text-muted'
                  }`}
                >
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full ${active ? 'bg-primary/15' : ''}`}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
