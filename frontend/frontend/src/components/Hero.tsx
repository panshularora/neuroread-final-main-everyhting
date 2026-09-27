import { ArrowRight } from 'lucide-react';
import { ColorizedText } from '../utils/phonemeColors';

// Scores come from the backend's cognitive-load formula run on these two
// sentences (backend/app/services/cognitive_load.py).
const BEFORE = {
  text: 'Contraindications to thrombolytic therapy were identified, including a recent haemorrhagic cerebrovascular accident, necessitating careful risk stratification prior to intervention.',
  score: 84,
  label: 'High',
};
const AFTER = {
  text: 'The doctors found a reason not to give a clot-busting drug. The patient had a bleed in the brain a short time ago. So they checked the risks carefully before doing anything.',
  score: 27,
  label: 'Low',
};

function LoadMeter({ score, label, tone }: { score: number; label: string; tone: 'high' | 'low' }) {
  const bar = tone === 'high' ? 'bg-err' : 'bg-ok';
  return (
    <div className="mt-4 flex items-center gap-3 text-sm">
      <span className="font-bold text-ink">Reading load {score}/100</span>
      <span
        className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10"
        role="img"
        aria-label={`${label} reading load`}
      >
        <span className={`block h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
      </span>
      <span className={tone === 'high' ? 'font-bold text-err' : 'font-bold text-ok'}>{label}</span>
    </div>
  );
}

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
        <div>
          <p className="mb-4 text-base font-bold text-accent">For dyslexic readers, and the people who teach them</p>
          <h1 id="hero-title" className="text-4xl text-ink md:text-5xl">
            Dense text, rewritten so it is easier to read.
          </h1>
          <p className="mt-6 max-w-prose text-lg text-muted">
            Paste a paragraph and NeuroRead rewrites it in plain language, shows how hard it was to read,
            and reads it aloud with colour cues for <b className="text-ink">b</b>, <b className="text-ink">d</b>,{' '}
            <b className="text-ink">p</b> and <b className="text-ink">q</b>. Short exercises then practise the
            skills that caused trouble.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#/read"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-bold text-white shadow-card hover:bg-primary/90"
            >
              Simplify a text
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="#/practice"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-6 py-3.5 text-base font-bold text-ink hover:border-primary/40"
            >
              Practise reading skills
            </a>
          </div>
        </div>

        <figure className="rounded-3xl border border-line bg-surface p-5 shadow-raised sm:p-7">
          <figcaption className="mb-5 text-sm font-bold text-muted">Example from a hospital discharge note</figcaption>
          <div className="rounded-2xl border border-line p-4 sm:p-5">
            <p className="mb-2 text-sm font-bold text-muted">Original</p>
            <p className="text-base text-ink">{BEFORE.text}</p>
            <LoadMeter score={BEFORE.score} label={BEFORE.label} tone="high" />
          </div>
          <div className="mt-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
            <p className="mb-2 text-sm font-bold text-primary">Simplified, with letter colour cues</p>
            <p className="text-lg text-ink" style={{ lineHeight: 1.75 }}>
              <ColorizedText text={AFTER.text} />
            </p>
            <LoadMeter score={AFTER.score} label={AFTER.label} tone="low" />
          </div>
        </figure>
      </div>
    </section>
  );
}
