import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  Ear,
  Hash,
  Layers,
  Link2,
  ListOrdered,
  Music2,
  PenLine,
  SpellCheck,
  Zap,
} from 'lucide-react';
import { generatePracticeGame, friendlyError } from '../services/api';
import {
  DictationGame, ErrorCorrectionGame, WordSortingGame, SyllableTappingGame,
  WordChainsGame, SentenceReconstructionGame, RhymeFinderGame, FlashcardsGame, HomophonesGame
} from './PracticeGames';

const PRACTICE_MODES = [
  { id: 'dictation', title: 'Dictation', Icon: Ear, skill: 'Spelling', desc: 'Hear a word and type it.' },
  { id: 'error_correction', title: 'Fix the spelling', Icon: SpellCheck, skill: 'Spelling', desc: 'Spot the misspelled word in a sentence and pick the right one.' },
  { id: 'word_sorting', title: 'Word sorting', Icon: Layers, skill: 'Letter reversal', desc: 'Sort words by the letter they use, such as b or d.' },
  { id: 'syllable_tapping', title: 'Syllable tapping', Icon: Hash, skill: 'Phonological awareness', desc: 'Count the beats in a word.' },
  { id: 'word_chains', title: 'Word chains', Icon: Link2, skill: 'Phonics', desc: 'Change one letter at a time to make the next word.' },
  { id: 'sentence_reconstruction', title: 'Sentence builder', Icon: ListOrdered, skill: 'Syntax', desc: 'Put jumbled words back in order.' },
  { id: 'rhyme_finder', title: 'Rhyme finder', Icon: Music2, skill: 'Phonological awareness', desc: 'Find the word that rhymes with the target.' },
  { id: 'flashcards', title: 'Speed flashcards', Icon: Zap, skill: 'Sight words', desc: 'See a word for a moment, then type it from memory.' },
  { id: 'homophones', title: 'Homophones', Icon: ArrowRightLeft, skill: 'Vocabulary', desc: 'There, their or they’re: pick the one that fits.' },
];

// The expected answer for each game, shown after a wrong attempt.
function expectedAnswer(game: string, data: any): string | null {
  if (!data) return null;
  switch (game) {
    case 'dictation':
    case 'flashcards':
      return data.word;
    case 'error_correction':
    case 'homophones':
      return data.answer;
    case 'syllable_tapping':
      return `${data.syllables} syllable${data.syllables === 1 ? '' : 's'}`;
    case 'word_chains':
      return data.chain?.[1];
    case 'sentence_reconstruction':
      return data.words?.join(' ');
    case 'rhyme_finder':
      return data.answers?.join(', ');
    default:
      return null;
  }
}

const PracticeMode = ({ active }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameData, setGameData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean } | null>(null);
  const [loadError, setLoadError] = useState('');
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const feedbackRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (feedback) feedbackRef.current?.focus();
  }, [feedback]);

  if (!active) return null;

  const startGame = async (modeId: string) => {
    setActiveGame(modeId);
    setLoading(true);
    setFeedback(null);
    setLoadError('');
    try {
      setGameData(await generatePracticeGame(modeId));
    } catch (err) {
      setLoadError(friendlyError(err, "That game couldn't be loaded. Please try again."));
      setActiveGame(null);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (isCorrect: boolean) => {
    setFeedback({ correct: isCorrect });
    setScore((s) => ({ correct: s.correct + (isCorrect ? 1 : 0), total: s.total + 1 }));
  };

  const backToMenu = () => {
    setActiveGame(null);
    setGameData(null);
    setFeedback(null);
  };

  if (activeGame) {
    const mode = PRACTICE_MODES.find((m) => m.id === activeGame);
    const answer = expectedAnswer(activeGame, gameData);
    return (
      <div key={activeGame} className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={backToMenu}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2 font-bold hover:bg-ink/5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All games
          </button>
          {score.total > 0 && (
            <p className="text-sm text-muted">
              This session: <strong className="text-ink tabular-nums">{score.correct} of {score.total}</strong> correct
            </p>
          )}
        </div>

        {loading || !gameData ? (
          <div className="flex flex-col items-center py-24 text-center" role="status">
            <div className="mb-6 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="font-bold text-primary">Getting a {mode?.title.toLowerCase()} question…</p>
          </div>
        ) : feedback ? (
          <div
            className={`mx-auto max-w-xl rounded-3xl border-2 p-8 text-center sm:p-12 ${
              feedback.correct ? 'border-ok/40 bg-ok/5' : 'border-warn/40 bg-warn/5'
            }`}
          >
            {feedback.correct ? (
              <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-ok" aria-hidden="true" />
            ) : (
              <PenLine className="mx-auto mb-4 h-14 w-14 text-warn" aria-hidden="true" />
            )}
            <h2 ref={feedbackRef} tabIndex={-1} className="mb-3 text-3xl outline-none">
              {feedback.correct ? 'That’s right' : 'Not this time'}
            </h2>
            <p className="mb-8 text-lg text-muted">
              {feedback.correct ? (
                'Nicely done. Want another one?'
              ) : answer ? (
                <>
                  The answer was <strong className="text-ink">{answer}</strong>. Mistakes are part of practice.
                </>
              ) : (
                'Mistakes are part of practice. Try another one.'
              )}
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => startGame(activeGame)}
                className="rounded-xl bg-primary px-8 py-3 text-lg font-bold text-white hover:bg-primary/90"
              >
                Next question
              </button>
              <button
                type="button"
                onClick={backToMenu}
                className="rounded-xl border border-line bg-surface px-8 py-3 text-lg font-bold hover:bg-ink/5"
              >
                Choose another game
              </button>
            </div>
          </div>
        ) : (
          <div key={gameData?.id || JSON.stringify(gameData).slice(0, 40)}>
            {activeGame === 'dictation' && <DictationGame data={gameData} onComplete={handleComplete} />}
            {activeGame === 'error_correction' && <ErrorCorrectionGame data={gameData} onComplete={handleComplete} />}
            {activeGame === 'word_sorting' && <WordSortingGame data={gameData} onComplete={handleComplete} />}
            {activeGame === 'syllable_tapping' && <SyllableTappingGame data={gameData} onComplete={handleComplete} />}
            {activeGame === 'word_chains' && <WordChainsGame data={gameData} onComplete={handleComplete} />}
            {activeGame === 'sentence_reconstruction' && <SentenceReconstructionGame data={gameData} onComplete={handleComplete} />}
            {activeGame === 'rhyme_finder' && <RhymeFinderGame data={gameData} onComplete={handleComplete} />}
            {activeGame === 'flashcards' && <FlashcardsGame data={gameData} onComplete={handleComplete} />}
            {activeGame === 'homophones' && <HomophonesGame data={gameData} onComplete={handleComplete} />}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl">Practice</h1>
        <p className="mt-3 text-lg text-muted">
          Nine short games, each aimed at a skill that dyslexic readers often find hard. A round takes about a minute.
        </p>
      </header>

      {loadError && (
        <p role="alert" className="mb-8 rounded-2xl border border-err/30 bg-err/5 p-4 text-base text-err">
          {loadError}
        </p>
      )}

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PRACTICE_MODES.map((mode) => (
          <li key={mode.id}>
            <button
              type="button"
              onClick={() => startGame(mode.id)}
              className="group flex h-full w-full flex-col rounded-3xl border border-line bg-surface p-6 text-left shadow-card hover:border-primary/60"
            >
              {/* Title comes first in the DOM so it leads the button's accessible name. */}
              <span className="order-2 font-display text-xl font-bold group-hover:text-primary">{mode.title}</span>
              <span className="order-3 mt-1 text-base text-muted">{mode.desc}</span>
              <span className="order-1 mb-4 flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <mode.Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="rounded-full bg-paper px-3 py-1 text-sm text-muted">{mode.skill}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PracticeMode;
