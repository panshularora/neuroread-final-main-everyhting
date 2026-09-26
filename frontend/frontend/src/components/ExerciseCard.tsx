import React, { useState } from 'react';
import { Check, Lightbulb, Volume2 } from 'lucide-react';
import { useAccessibilityStore } from '../stores/accessibilityStore';

// Letters that are easy to mirror get a fixed colour when letter colouring is on.
const PHONEME_COLORS: Record<string, string> = {
  b: '#2F6FB5',
  d: '#C4552B',
  p: '#7A4A9E',
  q: '#237A4B',
};

function colorizeWord(word: string, coloredLetters: boolean): React.ReactNode {
  if (!coloredLetters) return word;
  return word.split('').map((char, i) => {
    const color = PHONEME_COLORS[char.toLowerCase()];
    return color ? (
      <span key={i} style={{ color, fontWeight: 700 }}>{char}</span>
    ) : (
      <span key={i}>{char}</span>
    );
  });
}

interface ExerciseCardProps {
  exercise: {
    id: string;
    type: 'phonics' | 'spelling' | 'comprehension' | 'matching';
    prompt: string;
    options: string[];
    correct_answer: string;
    difficulty: number;
    target_skill: string;
    hint: string;
  };
  onAnswer: (answer: string) => void;
  disabled: boolean;
  feedback?: 'correct' | 'incorrect' | null;
}

export default function ExerciseCard({ exercise, onAnswer, disabled, feedback }: ExerciseCardProps) {
  const [showHint, setShowHint] = useState(false);
  const [spellingInput, setSpellingInput] = useState('');
  const { coloredLetters, ttsSpeed } = useAccessibilityStore();

  const border =
    feedback === 'correct' ? 'border-ok' : feedback === 'incorrect' ? 'border-warn' : 'border-line';

  function speakWord(text: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = ttsSpeed;
    window.speechSynthesis.speak(utterance);
  }

  function submitSpelling() {
    const value = spellingInput.trim();
    if (!value || disabled) return;
    onAnswer(value);
    setSpellingInput('');
  }

  const skill = (exercise.target_skill || '').replace(/_/g, ' ');
  const [passage, question] = exercise.prompt.split('\n\n');

  return (
    <div className={`max-w-2xl rounded-3xl border-2 bg-surface p-5 sm:p-8 ${border}`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold capitalize text-primary">{skill}</span>
        <span className="text-sm text-muted">Difficulty {Math.round(exercise.difficulty * 100)}%</span>
      </div>

      <div aria-live="polite">
        {feedback === 'correct' && (
          <p className="mb-5 flex items-center gap-2 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 font-bold text-ok">
            <Check className="h-5 w-5" aria-hidden="true" /> Correct, well done.
          </p>
        )}
        {feedback === 'incorrect' && (
          <p className="mb-5 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 font-bold text-warn">
            Not quite. Take another look at the next one.
          </p>
        )}
      </div>

      {exercise.type === 'comprehension' ? (
        <>
          <p className="mb-5 rounded-2xl bg-paper p-4 text-base">{passage}</p>
          <p className="mb-5 text-lg font-bold">{question || exercise.prompt}</p>
        </>
      ) : (
        exercise.prompt && (
          <p className="mb-6 text-lg font-bold">
            {exercise.prompt.split(' ').map((w, i, all) => (
              <span key={i}>
                {colorizeWord(w, coloredLetters)}
                {i < all.length - 1 ? ' ' : ''}
              </span>
            ))}
          </p>
        )
      )}

      {exercise.type !== 'spelling' && exercise.options.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {exercise.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              onClick={() => !disabled && onAnswer(opt)}
              disabled={disabled}
              className="rounded-2xl border-2 border-line bg-paper px-5 py-4 text-left text-lg font-bold hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {colorizeWord(opt, coloredLetters)}
            </button>
          ))}
        </div>
      )}

      {exercise.type === 'spelling' && (
        <div>
          <button
            type="button"
            onClick={() => speakWord(exercise.correct_answer)}
            className="mb-4 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-bold text-white hover:bg-accent/90"
          >
            <Volume2 className="h-5 w-5" aria-hidden="true" /> Hear the word
          </button>
          <label htmlFor={`spell-${exercise.id}`} className="mb-2 block text-sm font-bold text-muted">
            Type the word you heard
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id={`spell-${exercise.id}`}
              type="text"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              value={spellingInput}
              onChange={(e) => setSpellingInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitSpelling()}
              disabled={disabled}
              className="flex-1 rounded-xl border-2 border-line bg-paper px-4 py-3 text-lg tracking-wide focus:border-primary"
            />
            <button
              type="button"
              onClick={submitSpelling}
              disabled={disabled || !spellingInput.trim()}
              className="rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              Check
            </button>
          </div>
        </div>
      )}

      {exercise.hint && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowHint((h) => !h)}
            aria-expanded={showHint}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-ink"
          >
            <Lightbulb className="h-4 w-4" aria-hidden="true" />
            {showHint ? 'Hide hint' : 'Show a hint'}
          </button>
          {showHint && <p className="mt-2 rounded-xl bg-warn/10 px-4 py-3 text-base">{exercise.hint}</p>}
        </div>
      )}
    </div>
  );
}
