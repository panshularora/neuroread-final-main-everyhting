import { useEffect, useRef, useState } from 'react';
import { BookOpenText, Check, GraduationCap, Puzzle } from 'lucide-react';
import type { Route } from '../lib/useHashRoute';
import Logo from './Logo';

const DIFFICULTIES = ['Reading words aloud', 'Spelling', 'Understanding long texts', 'All of these'];

interface OnboardingProps {
  onComplete: (userAge: number, startAt?: Route) => void;
}

type Recommendation = { route: Route; label: string; reason: string; Icon: typeof BookOpenText };

export function recommendStart(age: number, difficulties: string[]): Recommendation {
  const wantsReview = difficulties.includes('All of these');
  const wantsReading = difficulties.includes('Reading words aloud') || difficulties.includes('Spelling');
  const wantsUnderstanding = difficulties.includes('Understanding long texts');

  const learn: Recommendation = {
    route: 'learn',
    label: 'Learn',
    reason: 'Guided exercises that adapt to your level, plus stories to read along with.',
    Icon: GraduationCap,
  };
  const practice: Recommendation = {
    route: 'practice',
    label: 'Practice',
    reason: 'Short games that build confidence with the words you find tricky.',
    Icon: Puzzle,
  };
  const read: Recommendation = {
    route: 'home',
    label: 'Reading tools',
    reason: 'Simplify hard texts, hear them read aloud and look up words as you go.',
    Icon: BookOpenText,
  };

  if (age <= 14) return wantsReading || wantsReview ? learn : practice;
  if (wantsUnderstanding) return read;
  if (wantsReview) return practice;
  return learn;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [age, setAge] = useState(10);
  const [isParentTeacher, setIsParentTeacher] = useState(false);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  function toggleDifficulty(d: string) {
    setDifficulties((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  const effectiveAge = isParentTeacher ? 30 : age;

  function finish(startAt?: Route) {
    localStorage.setItem('neuroread-onboarding-done', 'true');
    localStorage.setItem('neuroread-user-age', String(effectiveAge));
    onComplete(effectiveAge, startAt);
  }

  const recommended = recommendStart(age, difficulties);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-ink/60 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-raised sm:p-10"
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="flex items-center gap-2 font-display text-lg font-bold text-primary">
            <Logo className="h-7 w-7" /> NeuroRead
          </span>
          <p className="text-sm text-muted">Step {step} of 2</p>
        </div>

        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setStep(2);
            }}
          >
            <h2 id="onboarding-title" ref={headingRef} tabIndex={-1} className="text-2xl outline-none">
              Welcome. Two quick questions.
            </h2>
            <p className="mb-8 mt-2 text-muted">We use the answers to suggest where to start. Nothing leaves your browser.</p>

            <label htmlFor="onboarding-age" className="mb-2 block font-bold">
              How old are you? {!isParentTeacher && <span className="text-primary tabular-nums">{age}</span>}
            </label>
            {!isParentTeacher && (
              <input
                id="onboarding-age"
                type="range"
                min={5}
                max={80}
                value={age}
                aria-valuetext={`${age} years`}
                onChange={(e) => setAge(Number(e.target.value))}
                className="mb-3 w-full accent-[rgb(var(--c-primary))]"
              />
            )}
            <label className="mb-8 flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isParentTeacher}
                onChange={(e) => setIsParentTeacher(e.target.checked)}
                className="h-5 w-5 accent-[rgb(var(--c-primary))]"
              />
              <span>I'm a parent or teacher</span>
            </label>

            <fieldset className="mb-8">
              <legend className="mb-3 font-bold">
                What's hardest? <span className="font-normal text-muted">Pick any that apply.</span>
              </legend>
              <div className="flex flex-col gap-2">
                {DIFFICULTIES.map((d) => {
                  const on = difficulties.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleDifficulty(d)}
                      className={`flex items-center justify-between rounded-xl border-2 px-4 py-3 text-left ${
                        on ? 'border-primary bg-primary/5 font-bold text-primary' : 'border-line hover:border-primary/40'
                      }`}
                    >
                      {d}
                      {on && <Check className="h-5 w-5" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => finish()}
                className="rounded-xl px-5 py-3 font-bold text-muted hover:bg-ink/5 hover:text-ink"
              >
                Skip
              </button>
              <button type="submit" className="flex-1 rounded-xl bg-primary py-3 text-lg font-bold text-white hover:bg-primary/90">
                Next
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div>
            <h2 id="onboarding-title" ref={headingRef} tabIndex={-1} className="text-2xl outline-none">
              We suggest starting here
            </h2>
            <div className="my-6 flex gap-4 rounded-2xl border-2 border-primary bg-primary/5 p-5">
              <recommended.Icon className="mt-1 h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="font-display text-xl font-bold">{recommended.label}</p>
                <p className="mt-1 text-muted">{recommended.reason}</p>
              </div>
            </div>
            <p className="mb-8 text-sm text-muted">
              Everything is one tap away in the menu, and you can change text size, spacing and colours under Reading
              settings.
            </p>
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-xl border border-line px-6 py-3 font-bold hover:bg-ink/5"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => finish(recommended.route)}
                className="flex-1 rounded-xl bg-primary py-3 text-lg font-bold text-white hover:bg-primary/90"
              >
                Start with {recommended.label}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
