import React, { useState } from 'react';
import { ensureUserId } from '../services/api';
import {
  DictationGame, ErrorCorrectionGame, WordSortingGame, SyllableTappingGame,
  WordChainsGame, SentenceReconstructionGame, RhymeFinderGame, FlashcardsGame, HomophonesGame
} from './PracticeGames';

const API_URL = import.meta.env.VITE_API_URL;

const PRACTICE_MODES = [
  { id: 'dictation', title: 'Dictation', icon: 'solar:pen-bold-duotone', desc: 'Hear a word and type it. Phonetic spelling counts!', color: 'text-clay', bg: 'bg-clay/10' },
  { id: 'error_correction', title: 'Error Correction', icon: 'solar:magic-stick-3-bold-duotone', desc: 'Spot the incorrectly spelled word in context.', color: 'text-moss', bg: 'bg-moss/10' },
  { id: 'word_sorting', title: 'Word Sorting', icon: 'solar:layers-bold-duotone', desc: 'Sort b and d words into their buckets.', color: 'text-blue-600', bg: 'bg-blue-50' },
  { id: 'syllable_tapping', title: 'Syllable Tapping', icon: 'solar:music-notes-bold-duotone', desc: 'Tap the number of syllables you hear.', color: 'text-purple-600', bg: 'bg-purple-50' },
  { id: 'word_chains', title: 'Word Chains', icon: 'solar:link-bold-duotone', desc: 'Change one letter at a time to build words.', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'sentence_reconstruction', title: 'Sentence Builder', icon: 'solar:text-square-bold-duotone', desc: 'Drag jumbled words into the correct order.', color: 'text-green-600', bg: 'bg-green-50' },
  { id: 'rhyme_finder', title: 'Rhyme Finder', icon: 'solar:chat-round-line-line-duotone', desc: 'Find all words that rhyme with the target.', color: 'text-pink-600', bg: 'bg-pink-50' },
  { id: 'flashcards', title: 'Speed Flashcards', icon: 'solar:bolt-bold-duotone', desc: 'Read a word in 0.5s and type it from memory.', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  { id: 'homophones', title: 'Homophone Spotter', icon: 'solar:eye-scan-bold-duotone', desc: "They're / Their / There — which one fits?", color: 'text-teal-600', bg: 'bg-teal-50' },
];

const PracticeMode = ({ active }) => {
  const [activeGame, setActiveGame] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { correct: boolean }

  const userId = ensureUserId();

  if (!active) return null;

  const startGame = async (modeId) => {
    setActiveGame(modeId);
    setLoading(true);
    setFeedback(null);
    try {
      const res = await fetch(`${API_URL}/api/learning/practice/generate?game_type=${modeId}&t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to fetch game data");
      const data = await res.json();
      setGameData(data);
    } catch (err) {
      console.error(err);
      alert("Oops! Could not load game data from the server. Make sure the backend is running!");
      setActiveGame(null);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (isCorrect) => {
    setFeedback({ correct: isCorrect });
  };

  const nextQuestion = () => {
    // Keep them in the current game mode to get a different question for the same game!
    startGame(activeGame);
  };

  if (activeGame) {
    return (
      <div key={activeGame} className="py-12 px-6 max-w-5xl mx-auto min-h-[600px]">
        <button onClick={() => { setActiveGame(null); setGameData(null); setFeedback(null); }} className="mb-10 text-clay font-bold flex items-center gap-2 hover:underline bg-white px-4 py-2 rounded-full shadow-sm w-fit">
          <span className="iconify" data-icon="solar:arrow-left-linear" /> Back to Mini-Games
        </button>
        
        {loading || !gameData ? (
          <div className="text-center py-32 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-4 border-moss border-t-transparent animate-spin mb-8" />
            <p className="text-moss font-bold text-xl tracking-tight">Generating practice data...</p>
          </div>
        ) : feedback ? (
          <div className={`max-w-xl mx-auto p-16 rounded-[3rem] text-center shadow-2xl animate-in zoom-in border-4 ${feedback.correct ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
            <i className="not-italic block"><span className={`iconify text-[80px] mb-8 ${feedback.correct ? 'text-green-500' : 'text-orange-500'}`} data-icon={feedback.correct ? "solar:check-circle-bold-duotone" : "solar:close-circle-bold-duotone"} /></i>
            <h3 className={`text-4xl font-bold mb-6 tracking-tight ${feedback.correct ? 'text-green-700' : 'text-orange-700'}`}>
              {feedback.correct ? 'Excellent Job!' : 'Not Quite!'}
            </h3>
            <p className="text-xl text-text-muted mb-10 font-medium">
              {feedback.correct ? 'You nailed that one. Ready for the next challenge?' : 'Keep practicing, you will get it next time! Play again?'}
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={nextQuestion} className="px-10 py-5 bg-moss text-white font-bold text-xl rounded-full hover:scale-105 transition-all shadow-xl">
                {feedback.correct ? 'Next Question' : 'Try Another'}
              </button>
              <button 
                onClick={() => { setActiveGame(null); setGameData(null); setFeedback(null); }} 
                className="px-8 py-5 bg-white border-2 border-moss/20 text-moss font-bold text-xl rounded-full hover:bg-moss/5 transition-all"
              >
                Menu
              </button>
            </div>
          </div>
        ) : (
          <div key={gameData?.id || Date.now()} className="animate-in fade-in slide-in-from-bottom duration-500">
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
    <div className="py-16 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16 animate-in slide-in-from-top fade-in duration-500">
        <h2 className="text-5xl font-medium text-moss mb-4 tracking-tight">Practice Engine</h2>
        <p className="text-text-muted text-xl max-w-2xl mx-auto">Evidence-based dyslexia therapy mini-games designed to rebuild reading confidence and automaticity.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {PRACTICE_MODES.map((mode, i) => (
          <div key={mode.id} onClick={() => startGame(mode.id)}
            style={{ animationDelay: `${i * 50}ms` }}
            className={`bg-white p-8 rounded-[2rem] border border-moss/10 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group animate-in zoom-in fade-in fill-mode-both`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all ${mode.bg} ${mode.color}`}>
              <span className="iconify text-4xl" data-icon={mode.icon} />
            </div>
            <h3 className="text-2xl font-bold text-charcoal mb-3 tracking-tight">{mode.title}</h3>
            <p className="text-sm text-text-muted leading-relaxed font-medium">
              {mode.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticeMode;
