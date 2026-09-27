import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, Volume2 } from 'lucide-react';
import type {
  DictationData,
  ErrorCorrectionData,
  FlashcardsData,
  HomophonesData,
  RhymeFinderData,
  SentenceReconstructionData,
  SyllableTappingData,
  WordChainsData,
  WordSortingData,
} from '../types/api';

// Each game gets one question and reports whether it was answered correctly.
// The parent remounts a game for every new question, so state starts fresh.
interface GameProps<T> {
  data: T;
  onComplete: (correct: boolean) => void;
}

// Browser speech synthesis: instant, works offline and needs no API key.
const speak = (text?: string) => {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
};

const choiceBtn =
  'rounded-2xl border-2 border-line bg-paper px-6 py-3 text-xl font-bold hover:border-primary hover:bg-primary/5';
const primaryBtn = 'rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50';
const textInput =
  'w-full rounded-xl border-2 border-line bg-paper px-4 py-3 text-center text-xl tracking-wide focus:border-primary sm:w-56';

function GameShell({ title, instructions, children }: { title: string; instructions: string; children: React.ReactNode }) {
  return (
    <section
      aria-labelledby="game-title"
      className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-line bg-surface p-6 text-center shadow-card sm:p-10"
    >
      <h2 id="game-title" className="text-2xl">{title}</h2>
      <p className="mb-8 mt-2 max-w-md text-lg text-muted">{instructions}</p>
      {children}
    </section>
  );
}

function BigWord({ children }: { children: React.ReactNode }) {
  return <p className="mb-8 font-display text-5xl font-bold">{children}</p>;
}

function ChainArrow() {
  return <ArrowRight className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />;
}

function ChainWord({ w }: { w: string }) {
  return <span className="rounded-xl bg-paper px-4 py-2 text-xl font-bold">{w}</span>;
}

export const DictationGame = ({ data, onComplete }: GameProps<DictationData>) => {
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!data.word) return;
    const t = setTimeout(() => speak(data.word), 300);
    return () => clearTimeout(t);
  }, [data]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onComplete(input.trim().toLowerCase() === data.word.toLowerCase());
  };

  return (
    <GameShell title="Dictation" instructions="Listen to the word, then type how it is spelled.">
      <button
        type="button"
        onClick={() => speak(data.word)}
        className="mb-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-white hover:bg-accent/90"
      >
        <Volume2 className="h-5 w-5" aria-hidden="true" /> Play the word again
      </button>
      <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
        <label htmlFor="dictation-input" className="sr-only">Your spelling</label>
        <input
          id="dictation-input"
          autoFocus
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className={textInput}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type the word"
        />
        <button type="submit" className={primaryBtn}>Check</button>
      </form>
    </GameShell>
  );
};

export const ErrorCorrectionGame = ({ data, onComplete }: GameProps<ErrorCorrectionData>) => {
  const [before, after] = data.sentence.split('____');
  return (
    <GameShell title="Fix the spelling" instructions={`Pick the correct spelling to replace "${data.incorrect}".`}>
      <p className="mb-8 rounded-2xl bg-paper px-5 py-4 text-2xl">
        {before}
        <mark className="rounded bg-err/15 px-1 text-err line-through decoration-2">{data.incorrect}</mark>
        {after}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {data.options.map((opt) => (
          <button key={opt} type="button" onClick={() => onComplete(opt === data.answer)} className={choiceBtn}>
            {opt}
          </button>
        ))}
      </div>
    </GameShell>
  );
};

export const WordSortingGame = ({ data, onComplete }: GameProps<WordSortingData>) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fails, setFails] = useState(0);
  const [wrong, setWrong] = useState(false);

  const wordObj = data.words[currentIndex];

  const handleBucket = (bucketNum: number) => {
    if (wordObj.bucket === bucketNum) {
      setWrong(false);
      if (currentIndex === data.words.length - 1) onComplete(fails === 0);
      else setCurrentIndex((c) => c + 1);
    } else {
      setFails((f) => f + 1);
      setWrong(true);
    }
  };

  return (
    <GameShell title="Word sorting" instructions="Which group does this word belong to?">
      <BigWord>{wordObj?.word}</BigWord>
      <div className="grid w-full max-w-md grid-cols-2 gap-4">
        {[data.bucket1, data.bucket2].map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => handleBucket(i + 1)}
            className="rounded-2xl border-2 border-dashed border-line bg-paper px-4 py-8 text-xl font-bold hover:border-primary hover:bg-primary/5"
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-6 min-h-[1.5em] text-sm" aria-live="polite">
        {wrong ? <span className="font-bold text-warn">Not that one. Try the other group.</span> : null}
      </p>
      <p className="text-sm text-muted">Word {currentIndex + 1} of {data.words.length}</p>
    </GameShell>
  );
};

export const SyllableTappingGame = ({ data, onComplete }: GameProps<SyllableTappingData>) => {
  return (
    <GameShell title="Syllable tapping" instructions="How many beats (syllables) does this word have?">
      <div className="mb-8 flex items-center gap-3">
        <p className="font-display text-5xl font-bold capitalize">{data.word}</p>
        <button
          type="button"
          onClick={() => speak(data.word)}
          aria-label={`Listen: ${data.word}`}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-primary hover:bg-primary/10"
        >
          <Volume2 className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Number of syllables">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onComplete(num === data.syllables)}
            className="h-16 w-16 rounded-2xl border-2 border-line bg-paper text-2xl font-bold hover:border-primary hover:bg-primary/5"
          >
            {num}
          </button>
        ))}
      </div>
    </GameShell>
  );
};

export const WordChainsGame = ({ data, onComplete }: GameProps<WordChainsData>) => {
  const [input, setInput] = useState('');

  // The learner fills in the second word of the chain.
  const targetWord = data.chain[1];
  const rest = data.chain.slice(2);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onComplete(input.trim().toLowerCase() === targetWord.toLowerCase());
  };

  return (
    <GameShell title="Word chains" instructions="Change one letter to get from the first word to the next.">
      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <ChainWord w={data.chain[0]} />
          <ChainArrow />
          <label htmlFor="chain-input" className="sr-only">Missing word</label>
          <input
            id="chain-input"
            autoFocus
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="w-28 rounded-xl border-2 border-primary/50 bg-paper px-3 py-2 text-center text-xl font-bold focus:border-primary"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="?"
          />
          {rest.map((w) => (
            <React.Fragment key={w}>
              <ChainArrow />
              <ChainWord w={w} />
            </React.Fragment>
          ))}
        </div>
        <button type="submit" className={primaryBtn}>Check</button>
      </form>
    </GameShell>
  );
};

export const SentenceReconstructionGame = ({ data, onComplete }: GameProps<SentenceReconstructionData>) => {
  const [pool, setPool] = useState<string[]>(() => [...data.words].sort(() => Math.random() - 0.5));
  const [assembled, setAssembled] = useState<string[]>([]);

  const selectWord = (word: string, idx: number) => {
    setAssembled([...assembled, word]);
    const p = [...pool];
    p.splice(idx, 1);
    setPool(p);
  };

  const removeWord = (word: string, idx: number) => {
    setPool([...pool, word]);
    const a = [...assembled];
    a.splice(idx, 1);
    setAssembled(a);
  };

  return (
    <GameShell title="Sentence builder" instructions="Tap the words in order to build the sentence. Tap a placed word to take it back.">
      <div
        className="mb-6 flex min-h-[72px] w-full max-w-xl flex-wrap justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-paper p-4"
        aria-label="Your sentence"
        aria-live="polite"
      >
        {assembled.length === 0 && <span className="self-center text-muted">Your sentence appears here</span>}
        {assembled.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => removeWord(w, i)}
            aria-label={`Remove ${w}`}
            className="rounded-xl bg-primary px-4 py-2 text-lg font-bold text-white hover:bg-primary/85"
          >
            {w}
          </button>
        ))}
      </div>
      <div className="mb-8 flex max-w-xl flex-wrap justify-center gap-2" aria-label="Words to use">
        {pool.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => selectWord(w, i)}
            className="rounded-xl border-2 border-line bg-paper px-4 py-2 text-lg font-bold hover:border-primary"
          >
            {w}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={pool.length > 0}
        onClick={() => onComplete(assembled.join(' ') === data.words.join(' '))}
        className={primaryBtn}
      >
        Check sentence
      </button>
    </GameShell>
  );
};

export const RhymeFinderGame = ({ data, onComplete }: GameProps<RhymeFinderData>) => {
  return (
    <GameShell title="Rhyme finder" instructions="Pick a word that rhymes with:">
      <BigWord>{data.target}</BigWord>
      <div className="flex max-w-md flex-wrap justify-center gap-3">
        {data.options.map((opt) => (
          <button key={opt} type="button" onClick={() => onComplete(data.answers.includes(opt))} className={choiceBtn}>
            {opt}
          </button>
        ))}
      </div>
    </GameShell>
  );
};

export const FlashcardsGame = ({ data, onComplete }: GameProps<FlashcardsData>) => {
  const [showWord, setShowWord] = useState(true);
  const [input, setInput] = useState('');

  // The word is shown briefly, then hidden so it has to be typed from memory.
  useEffect(() => {
    if (!showWord) return;
    const t = setTimeout(() => setShowWord(false), 800);
    return () => clearTimeout(t);
  }, [showWord]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onComplete(input.trim().toLowerCase() === data.word.toLowerCase());
  };

  return (
    <GameShell title="Speed flashcards" instructions={showWord ? 'Look closely…' : 'Type the word you just saw.'}>
      <div className="flex min-h-[96px] items-center justify-center">
        {showWord ? (
          <p className="font-display text-6xl font-bold">{data.word}</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full flex-col items-center gap-3 sm:flex-row">
            <label htmlFor="flash-input" className="sr-only">The word you saw</label>
            <input
              id="flash-input"
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className={textInput}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className={primaryBtn}>Check</button>
          </form>
        )}
      </div>
      {!showWord && (
        <button type="button" onClick={() => setShowWord(true)} className="mt-6 text-sm font-bold text-muted underline underline-offset-4 hover:text-ink">
          Show it again
        </button>
      )}
    </GameShell>
  );
};

export const HomophonesGame = ({ data, onComplete }: GameProps<HomophonesData>) => {
  return (
    <GameShell title="Homophones" instructions="Which word fits the gap?">
      <p className="mb-8 max-w-xl text-2xl">
        {data.sentence.split('____').map((part, i, arr) => (
          <React.Fragment key={`${part}-${i}`}>
            {part}
            {i < arr.length - 1 && (
              <span className="mx-2 inline-block w-16 border-b-4 border-primary/50 align-baseline" aria-label="gap" />
            )}
          </React.Fragment>
        ))}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {data.options.map((opt) => (
          <button key={opt} type="button" onClick={() => onComplete(opt === data.answer)} className={choiceBtn}>
            {opt}
          </button>
        ))}
      </div>
    </GameShell>
  );
};
