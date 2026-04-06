import React, { useState, useEffect } from 'react';

// Using browser speech synthesis for robustness and speed
const speak = (text) => {
  if (window.speechSynthesis) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85; // slightly slower for dictation
    window.speechSynthesis.speak(u);
  }
};

export const DictationGame = ({ data, onComplete }) => {
  const [input, setInput] = useState('');
  
  useEffect(() => {
    if (data?.word) setTimeout(() => speak(data.word), 300);
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onComplete(input.trim().toLowerCase() === data.word.toLowerCase());
  };

  return (
    <div className="p-8 text-center bg-white rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center border border-moss/10 shadow-sm">
      <h3 className="text-2xl font-bold text-moss mb-4">Dictation Game</h3>
      <button 
        type="button" 
        onClick={() => speak(data?.word)}
        className="w-16 h-16 rounded-full bg-clay/20 text-clay flex items-center justify-center hover:scale-110 hover:bg-clay/30 transition-all mb-6"
      >
        <i className="not-italic flex"><span className="iconify text-3xl" data-icon="solar:volume-up-bold-duotone" /></i>
      </button>
      <p className="mb-4 font-medium text-charcoal/60">Listen carefully and spell the word.</p>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input 
          autoFocus
          className="border-2 border-moss/20 rounded-full px-6 py-3 text-xl focus:border-moss outline-none w-48 text-center"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type here..."
        />
        <button type="submit" className="px-6 py-3 bg-moss text-white font-bold rounded-full hover:bg-moss-dark transition-colors">
          Check
        </button>
      </form>
    </div>
  );
};

export const ErrorCorrectionGame = ({ data, onComplete }) => {
  if (!data) return null;
  return (
    <div className="p-8 text-center bg-white rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center border border-moss/10 shadow-sm">
      <h3 className="text-2xl font-bold text-moss mb-4">Fix the Error</h3>
      <p className="mb-8 font-medium text-2xl px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
        {data.sentence.replace('____', `[ ${data.incorrect} ]`)}
      </p>
      <p className="mb-4 text-sm text-charcoal/50">Select the correct spelling to replace "{data.incorrect}":</p>
      <div className="flex gap-4 flex-wrap justify-center">
        {data.options.map(opt => (
          <button 
            key={opt}
            onClick={() => onComplete(opt === data.answer)}
            className="px-6 py-3 bg-moss/10 text-moss font-bold rounded-full hover:bg-moss hover:text-white transition-colors"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export const WordSortingGame = ({ data, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fails, setFails] = useState(0);

  if (!data) return null;
  const wordObj = data.words[currentIndex];

  const handleBucket = (bucketNum) => {
    if (wordObj.bucket === bucketNum) {
      if (currentIndex === data.words.length - 1) {
        onComplete(fails === 0);
      } else {
        setCurrentIndex(c => c + 1);
      }
    } else {
      setFails(f => f + 1);
      // Give a little visual feedback, but simple enough to just retry
    }
  };

  return (
    <div className="p-8 text-center bg-white rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center border border-blue-100 shadow-sm">
      <h3 className="text-2xl font-bold text-blue-600 mb-2">Word Sorting Game</h3>
      <p className="mb-8 text-charcoal/60">Where does this word belong?</p>
      
      <div className="text-5xl font-bold text-charcoal mb-10 py-4 px-12 bg-blue-50 rounded-2xl border-2 border-blue-200">
        {wordObj?.word}
      </div>

      <div className="flex gap-6 justify-center w-full max-w-md">
        <button onClick={() => handleBucket(1)} className="flex-1 py-8 bg-white border-2 border-dashed border-blue-300 rounded-2xl hover:bg-blue-50 transition-colors font-bold text-blue-800 flex flex-col items-center gap-2">
           <i className="not-italic"><span className="iconify text-3xl" data-icon="solar:box-minimalistic-bold-duotone" /></i>
           {data.bucket1}
        </button>
        <button onClick={() => handleBucket(2)} className="flex-1 py-8 bg-white border-2 border-dashed border-purple-300 rounded-2xl hover:bg-purple-50 transition-colors font-bold text-purple-800 flex flex-col items-center gap-2">
           <i className="not-italic"><span className="iconify text-3xl" data-icon="solar:box-minimalistic-bold-duotone" /></i>
           {data.bucket2}
        </button>
      </div>
      <p className="mt-6 text-xs text-charcoal/40">Word {currentIndex + 1} of {data.words.length}</p>
    </div>
  );
};

export const SyllableTappingGame = ({ data, onComplete }) => {
  if (!data) return null;
  return (
    <div className="p-8 text-center bg-white rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center border border-purple-100 shadow-sm">
      <h3 className="text-2xl font-bold text-purple-600 mb-2">Syllable Tapping</h3>
      <p className="mb-8 font-medium text-charcoal/60">How many syllables (beats) in this word?</p>
      <div className="text-5xl font-bold text-charcoal mb-10 capitalize tracking-wide">{data.word}</div>
      <div className="flex gap-4 justify-center">
        {[1, 2, 3, 4, 5].map(num => (
          <button 
            key={num}
            onClick={() => onComplete(num === data.syllables)} 
            className="w-16 h-16 rounded-full bg-purple-100 text-purple-700 font-bold text-2xl hover:bg-purple-600 hover:text-white transition-all shadow-sm"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};

export const WordChainsGame = ({ data, onComplete }) => {
  const [input, setInput] = useState('');
  if (!data) return null;

  // Let's ask them to fill in the second word of the chain
  const targetWord = data.chain[1];

  const handleSubmit = (e) => {
    e.preventDefault();
    onComplete(input.trim().toLowerCase() === targetWord.toLowerCase());
  };

  return (
    <div className="p-8 text-center bg-white rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center border border-orange-100 shadow-sm">
      <h3 className="text-2xl font-bold text-orange-500 mb-4">Word Chains</h3>
      <p className="mb-8 text-charcoal/60 font-medium">Change one letter at a time to complete the chain.</p>
      
      <div className="flex items-center gap-4 justify-center mb-8">
        <div className="px-4 py-2 bg-gray-100 rounded-lg font-bold">{data.chain[0]}</div>
        <i className="not-italic flex"><span className="iconify text-orange-300" data-icon="solar:arrow-right-linear" /></i>
        <form onSubmit={handleSubmit}>
          <input 
            autoFocus
            className="px-4 py-2 bg-orange-50 border-2 border-orange-200 rounded-lg font-bold text-center w-24 outline-none focus:border-orange-500"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="???"
          />
        </form>
        <i className="not-italic flex"><span className="iconify text-orange-300" data-icon="solar:arrow-right-linear" /></i>
        <div className="px-4 py-2 bg-gray-100 rounded-lg font-bold">{data.chain[2]}</div>
        {(data.chain.length > 3) && (
           <>
            <i className="not-italic flex"><span className="iconify text-orange-300" data-icon="solar:arrow-right-linear" /></i>
            <div className="px-4 py-2 bg-gray-100 rounded-lg font-bold">{data.chain[3]}</div>
           </>
        )}
      </div>
      <button onClick={handleSubmit} className="px-6 py-2 bg-orange-500 text-white font-bold rounded-full hover:bg-orange-600 transition-colors">Submit</button>
    </div>
  );
};

export const SentenceReconstructionGame = ({ data, onComplete }) => {
  const [pool, setPool] = useState<any[]>([]);
  const [assembled, setAssembled] = useState<any[]>([]);

  useEffect(() => {
    if (data?.words) {
      setPool([...data.words].sort(() => Math.random() - 0.5));
    }
  }, [data]);

  const selectWord = (word, idx) => {
    setAssembled([...assembled, word]);
    const p = [...pool];
    p.splice(idx, 1);
    setPool(p);
  };

  const removeWord = (word, idx) => {
    const p = [...pool, word];
    setPool(p);
    const a = [...assembled];
    a.splice(idx, 1);
    setAssembled(a);
  };

  const handleCheck = () => {
    onComplete(assembled.join(' ') === data.words.join(' '));
  };

  if (!data) return null;

  return (
    <div className="p-8 text-center bg-white rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center border border-green-100 shadow-sm w-full">
      <h3 className="text-2xl font-bold text-green-600 mb-4">Sentence Builder</h3>
      <p className="mb-6 font-medium text-charcoal/60">Tap the words in the correct order to build a sentence.</p>
      
      <div className="min-h-[60px] w-full max-w-xl bg-green-50/50 rounded-2xl border-2 border-dashed border-green-200 p-4 flex flex-wrap gap-2 justify-center mb-6">
        {assembled.map((w, i) => (
          <button key={i} onClick={() => removeWord(w, i)} className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-sm font-bold text-lg hover:bg-red-500 transition-colors">
            {w}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-8 max-w-xl">
        {pool.map((w, i) => (
          <button key={i} onClick={() => selectWord(w, i)} className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg shadow-sm font-bold text-lg text-charcoal hover:border-green-400 hover:text-green-600 transition-colors">
            {w}
          </button>
        ))}
      </div>

      <button disabled={pool.length > 0} onClick={handleCheck} className="px-8 py-3 bg-green-600 text-white font-bold rounded-full disabled:opacity-50 hover:bg-green-700 transition-colors">
        Check Sentence
      </button>
    </div>
  );
};

export const RhymeFinderGame = ({ data, onComplete }) => {
  if (!data) return null;
  return (
    <div className="p-8 text-center bg-white rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center border border-pink-100 shadow-sm">
      <h3 className="text-2xl font-bold text-pink-600 mb-2">Rhyme Finder</h3>
      <p className="mb-8 font-medium text-charcoal/60">Find a word that rhymes with:</p>
      <div className="text-5xl font-bold text-charcoal mb-8">{data.target}</div>
      <div className="flex flex-wrap gap-4 justify-center max-w-md">
        {data.options.map((opt) => (
          <button 
            key={opt}
            onClick={() => onComplete(data.answers.includes(opt))} 
            className="px-6 py-3 bg-pink-50 border-2 border-pink-200 text-pink-700 font-bold rounded-xl hover:bg-pink-500 hover:text-white transition-all hover:-translate-y-1"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export const FlashcardsGame = ({ data, onComplete }) => {
  const [showWord, setShowWord] = useState(true);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!data) return;
    setShowWord(true);
    setInput('');
    const t = setTimeout(() => {
      setShowWord(false);
    }, 800); // Give them 0.8s
    return () => clearTimeout(t);
  }, [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onComplete(input.trim().toLowerCase() === data.word.toLowerCase());
  };

  return (
    <div className="p-8 text-center bg-white rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center border border-yellow-100 shadow-sm">
      <h3 className="text-2xl font-bold text-yellow-600 mb-2">Speed Flashcards</h3>
      <p className="mb-8 font-medium text-charcoal/60">{showWord ? 'Look quickly!' : 'Type what you saw.'}</p>
      
      {showWord ? (
        <div className="text-6xl font-bold text-charcoal mb-8 h-20 animate-in zoom-in spin-in-2">{data?.word}</div>
      ) : (
        <div className="h-20 mb-8 flex items-center justify-center">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input 
              autoFocus
              className="border-2 border-yellow-300 rounded-full px-6 py-3 text-xl focus:border-yellow-500 outline-none w-48 text-center"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="???"
            />
            <button type="submit" className="px-6 py-3 bg-yellow-500 text-white font-bold rounded-full hover:bg-yellow-600 transition-colors">
              Check
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export const HomophonesGame = ({ data, onComplete }) => {
  if (!data) return null;
  return (
    <div className="p-8 text-center bg-white rounded-[2rem] min-h-[300px] flex flex-col items-center justify-center border border-teal-100 shadow-sm">
      <h3 className="text-2xl font-bold text-teal-600 mb-4">Homophone Spotter</h3>
      <p className="mb-8 font-medium text-2xl text-charcoal max-w-xl leading-relaxed">
        {data.sentence.split('____').map((part, i, arr) => (
          <React.Fragment key={`${part}-${i}`}>
            <span>{part}</span>
            {i < arr.length - 1 && <span className="inline-block border-b-4 border-teal-300 w-16 mx-2" />}
          </React.Fragment>
        ))}
      </p>
      
      <div className="flex gap-4 justify-center">
        {data.options.map(opt => (
          <button 
            key={opt}
            onClick={() => onComplete(opt === data.answer)} 
            className="px-8 py-4 bg-teal-50 border-2 border-teal-200 text-teal-700 font-bold rounded-2xl text-xl hover:bg-teal-500 hover:text-white transition-all hover:scale-105"
          >
            <span>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
