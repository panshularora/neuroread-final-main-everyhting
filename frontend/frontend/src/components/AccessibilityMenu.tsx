import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAccessibilityStore } from '../stores/accessibilityStore';

const THEMES = [
  { id: 'beige', name: 'Warm paper', color: '#FAF7F0' },
  { id: 'green', name: 'Soft green', color: '#F1F7F0' },
  { id: 'blue', name: 'Soft blue', color: '#EEF4F8' },
  { id: 'pink', name: 'Soft rose', color: '#FAF0F0' },
  { id: 'dark', name: 'Dark', color: '#1A1F21' },
];

const OVERLAYS = [
  { id: 'none', name: 'None' },
  { id: 'yellow', name: 'Yellow' },
  { id: 'blue', name: 'Blue' },
  { id: 'peach', name: 'Peach' },
  { id: 'mint', name: 'Mint' },
  { id: 'lavender', name: 'Lavender' },
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-6 first:border-0 first:pt-0">
      <h3 className="mb-4 text-base">{title}</h3>
      {children}
    </section>
  );
}

function Choice({ pressed, onClick, children, className = '' }: { pressed: boolean; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold ${
        pressed ? 'border-primary bg-primary/10 text-primary' : 'border-line hover:border-primary/40'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-bold">{label}</span>
        {hint && <span id={`${id}-hint`} className="block text-sm text-muted">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onClick={() => onChange(!checked)}
        className={`relative mt-1 h-7 w-12 shrink-0 rounded-full border-2 ${checked ? 'border-primary bg-primary' : 'border-line bg-ink/10'}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

const AccessibilityMenu = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('fontSize')) || 0);
  const [letterSpacing, setLetterSpacing] = useState(() => Number(localStorage.getItem('letterSpacing')) || 0);
  const [lineSpacing, setLineSpacing] = useState(() => Number(localStorage.getItem('lineSpacing')) || 1.6);
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'default');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme-style') || 'beige');
  const a11y = useAccessibilityStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty('--font-scale', fontSize.toString());
    html.style.setProperty('--letter-spacing', letterSpacing.toString());
    html.style.setProperty('--line-spacing', lineSpacing.toString());
    html.classList.toggle('font-dyslexic', fontFamily === 'dyslexic');
    html.classList.remove('theme-green', 'theme-blue', 'theme-beige', 'theme-pink', 'dark');
    html.classList.add(theme === 'dark' ? 'dark' : `theme-${theme}`);

    localStorage.setItem('fontSize', fontSize.toString());
    localStorage.setItem('letterSpacing', letterSpacing.toString());
    localStorage.setItem('lineSpacing', lineSpacing.toString());
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('theme-style', theme);
  }, [fontSize, letterSpacing, lineSpacing, fontFamily, theme]);

  // Focus the panel on open, keep Tab inside it, close on Escape, and hand focus back afterwards.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>('button, input, select, [tabindex]:not([tabindex="-1"])');
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [open, onClose]);

  const reset = () => {
    setFontSize(0);
    setLetterSpacing(0);
    setLineSpacing(1.6);
    setFontFamily('default');
    setTheme('beige');
    a11y.setRulerEnabled(false);
    a11y.setColorOverlay('none');
    a11y.setColoredLetters(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-ink/40"
            aria-hidden="true"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-0 right-0 top-0 z-[120] flex w-full max-w-sm flex-col overflow-y-auto border-l border-line bg-surface shadow-raised"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-6 py-4">
              <h2 id="settings-title" className="text-xl">Reading settings</h2>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label="Close reading settings"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line hover:bg-ink/5"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-6 px-6 py-6">
              <Section title="Font">
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Font">
                  <Choice pressed={fontFamily === 'default'} onClick={() => setFontFamily('default')}>
                    Atkinson Hyperlegible
                  </Choice>
                  <Choice pressed={fontFamily === 'dyslexic'} onClick={() => setFontFamily('dyslexic')} className="font-dyslexic">
                    OpenDyslexic
                  </Choice>
                </div>
              </Section>

              <Section title="Spacing and size">
                <div className="space-y-5">
                  {[
                    { id: 'set-size', label: 'Text size', value: fontSize, set: setFontSize, min: -2, max: 6, step: 1, text: fontSize > 0 ? `+${fontSize}` : `${fontSize}` },
                    { id: 'set-letter', label: 'Letter spacing', value: letterSpacing, set: setLetterSpacing, min: 0, max: 10, step: 1, text: letterSpacing > 0 ? `+${letterSpacing}` : '0' },
                    { id: 'set-line', label: 'Line spacing', value: lineSpacing, set: setLineSpacing, min: 1.2, max: 2.6, step: 0.1, text: `${lineSpacing.toFixed(1)}×` },
                  ].map((r) => (
                    <div key={r.id}>
                      <div className="mb-2 flex justify-between">
                        <label htmlFor={r.id} className="font-bold">{r.label}</label>
                        <span className="rounded-full bg-primary/10 px-2 text-sm font-bold tabular-nums text-primary">{r.text}</span>
                      </div>
                      <input
                        id={r.id}
                        type="range"
                        min={r.min}
                        max={r.max}
                        step={r.step}
                        value={r.value}
                        aria-valuetext={r.text}
                        onChange={(e) => r.set(Number(e.target.value))}
                        className="w-full accent-[rgb(var(--c-primary))]"
                      />
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Colours">
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Page colour">
                  {THEMES.map((t) => (
                    <Choice key={t.id} pressed={theme === t.id} onClick={() => setTheme(t.id)} className="flex items-center gap-2 text-left">
                      <span className="h-5 w-5 shrink-0 rounded-full border border-ink/20" style={{ backgroundColor: t.color }} />
                      {t.name}
                    </Choice>
                  ))}
                </div>
                <p id="overlay-label" className="mb-2 mt-5 font-bold">Tinted overlay</p>
                <div className="flex flex-wrap gap-2" role="group" aria-labelledby="overlay-label">
                  {OVERLAYS.map((o) => (
                    <Choice key={o.id} pressed={a11y.colorOverlay === o.id} onClick={() => a11y.setColorOverlay(o.id)}>
                      {o.name}
                    </Choice>
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted">Some readers find a coloured tint reduces visual stress.</p>
              </Section>

              <Section title="Reading aids">
                <Toggle
                  id="set-ruler"
                  label="Reading ruler"
                  hint="A band that marks your line. Drag its top edge, or press Alt + arrow keys."
                  checked={a11y.rulerEnabled}
                  onChange={a11y.setRulerEnabled}
                />
                <Toggle
                  id="set-letters"
                  label="Colour b, d, p and q"
                  hint="Gives easily mirrored letters their own colour in exercises."
                  checked={a11y.coloredLetters}
                  onChange={a11y.setColoredLetters}
                />
              </Section>
            </div>

            <div className="border-t border-line px-6 py-4">
              <button type="button" onClick={reset} className="font-bold text-muted underline underline-offset-4 hover:text-ink">
                Reset all settings
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccessibilityMenu;
