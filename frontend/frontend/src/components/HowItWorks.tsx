import { BookOpenText, GraduationCap, Puzzle } from 'lucide-react';

const STEPS = [
  {
    icon: BookOpenText,
    title: 'Read with support',
    body: 'Simplify a passage, listen to it word by word, and tap a hard word for a plain definition.',
    href: '#/read',
    cta: 'Open the simplifier',
  },
  {
    icon: GraduationCap,
    title: 'Learn at the right level',
    body: 'Adaptive phonics and spelling exercises. Each answer updates an estimate of every skill and picks the next item.',
    href: '#/learn',
    cta: 'Start a lesson',
  },
  {
    icon: Puzzle,
    title: 'Practise in short games',
    body: 'Nine five-minute games for dictation, b/d sorting, syllables, rhymes and homophones.',
    href: '#/practice',
    cta: 'Pick a game',
  },
];

export default function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 id="how-title" className="text-3xl text-ink">How NeuroRead helps</h2>
      <p className="mt-3 max-w-prose text-muted">
        Reading support for the text in front of you, and practice for the skills behind it.
      </p>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex flex-col rounded-3xl border border-line bg-surface p-6 shadow-card">
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="text-sm font-bold text-muted">Step {i + 1}</span>
            </div>
            <h3 className="text-xl text-ink">{step.title}</h3>
            <p className="mt-2 flex-1 text-base text-muted">{step.body}</p>
            <a href={step.href} className="mt-5 font-bold text-primary underline underline-offset-4">
              {step.cta}
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
