import React, { useState, useEffect, useCallback } from 'react';
import ExerciseCard from './ExerciseCard';
import BKTLiveDisplay from './BKTLiveDisplay';
import {
  getPhonics,
  getFlashcard,
  getSoundMatch,
  getBuildWord,
  getRhyme,
  getPictureMatch,
  getComprehension,
  getLesson,
  getLearningProgress,
  updateLearningProgress,
  ensureUserId,
  checkAnswer,
} from '../services/api';
import AudioButton from './AudioButton';

const API_URL = import.meta.env.VITE_API_URL;

interface Exercise {
  id: string;
  type: 'phonics' | 'spelling' | 'comprehension' | 'matching';
  prompt: string;
  options: string[];
  correct_answer: string;
  difficulty: number;
  target_skill: string;
  hint: string;
}

interface Skill {
  name: string;
  display_name: string;
  p_know: number;
  mastered: boolean;
}

export default function LearningMode({ active }: { active: boolean }) {
  const [subMode, setSubMode] = useState<'adaptive' | 'read-along' | 'phonics' | 'stories'>('adaptive');
  const [selectedStoryId, setSelectedStoryId] = useState('story-1');
  const userId = ensureUserId();

  if (!active) return null;

  const subModes = [
    { id: 'adaptive', name: 'Adaptive AI', icon: 'solar:magic-stick-3-bold-duotone', color: 'bg-moss/10 text-moss' },
    { id: 'read-along', name: 'Read Along', icon: 'solar:music-note-bold-duotone', color: 'bg-blue-50 text-blue-600' },
    { id: 'phonics', name: 'Phonics Lab', icon: 'solar:microphone-3-bold-duotone', color: 'bg-green-50 text-green-600' },
    { id: 'stories', name: 'Story Mode', icon: 'solar:book-bold-duotone', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div id="content-learning" className="py-12 px-6 max-w-7xl mx-auto min-h-[80vh] animate-in fade-in duration-700">
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <h2 className="text-4xl font-medium text-moss mb-4 tracking-tight">Learning Adventure</h2>
        <p className="text-text-muted text-lg leading-relaxed">
          Welcome to your reading space. Choose an activity below to start building your skills at your own pace.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mb-16">
        {subModes.map((m) => (
          <button
            key={m.id}
            onClick={() => setSubMode(m.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 border ${
              subMode === m.id
                ? 'bg-white border-moss shadow-md scale-105 text-moss'
                : 'bg-white/50 border-moss/10 text-text-muted hover:bg-white hover:border-moss/30'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl ${m.color} flex items-center justify-center`}>
              <span className="iconify text-xl" data-icon={m.icon} />
            </div>
            <span className="font-medium">{m.name}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-moss/5 min-h-[500px] relative overflow-hidden transition-all duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-moss/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-clay/5 rounded-full -ml-32 -mb-32 blur-3xl opacity-50" />

        <div className="relative z-10">
          {subMode === 'adaptive' && <AdaptiveLearningSection userId={userId} />}
          {subMode === 'read-along' && <ReadAlongSection userId={userId} selectedStoryId={selectedStoryId} onSelectStory={setSelectedStoryId} />}
          {subMode === 'phonics' && <PhonicsLabSection userId={userId} />}
          {subMode === 'stories' && <StoryModeSection userId={userId} selectedStoryId={selectedStoryId} onSelectStory={(id) => { setSelectedStoryId(id); setSubMode('read-along'); }} />}
        </div>
      </div>
    </div>
  );
}

/* ── ADAPTIVE LEARNING SECTION (BKT/IRT wired) ─────────────────────────────── */
function AdaptiveLearningSection({ userId }: { userId: string }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSkillUpdate, setLastSkillUpdate] = useState<any>(null);
  const [lastIRTUpdate, setLastIRTUpdate] = useState<any>(null);
  const [lastSM2Update, setLastSM2Update] = useState<any>(null);
  const [stats, setStats] = useState({ correct: 0, total: 0, streak: 0, longest_streak: 0 });
  const [answerDisabled, setAnswerDisabled] = useState(false);

  const age = parseInt(localStorage.getItem('neuroread-user-age') || '8', 10);

  // Start session on mount
  useEffect(() => {
    startSession();
  }, []);

  async function startSession() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/learning/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, age, session_type: 'learning' }),
      });
      const data = await res.json();
      setSessionId(data.session_id);
      setCurrentExercise(data.first_exercise);
    } catch (err) {
      console.error('Could not start learning session:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSkills() {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API_URL}/api/learning/session/${sessionId}/skills`);
      const data = await res.json();
      setSkills(data.skills || []);
      if (data.session_stats) setStats(data.session_stats);
    } catch (err) {
      console.error('Could not load skills:', err);
    }
  }

  async function handleAnswer(answer: string) {
    if (!sessionId || !currentExercise || answerDisabled) return;
    setAnswerDisabled(true);

    const startTime = Date.now();
    try {
      const res = await fetch(`${API_URL}/api/learning/session/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise_id: currentExercise.id,
          answer,
          response_time_ms: Date.now() - startTime,
        }),
      });
      const data = await res.json();

      setFeedback(data.correct ? 'correct' : 'incorrect');
      setExplanation(data.explanation);
      setLastSkillUpdate(data.skill_update);
      setLastIRTUpdate(data.irt_update);
      setLastSM2Update(data.sm2_update);
      if (data.session_stats) setStats(data.session_stats);

      // Refresh skills panel
      await loadSkills();

      // Auto-advance after 3 seconds
      setTimeout(() => {
        setFeedback(null);
        setExplanation('');
        setCurrentExercise(data.next_exercise);
        setAnswerDisabled(false);
      }, 3000);
    } catch (err) {
      console.error('Answer submission failed:', err);
      setAnswerDisabled(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-full border-4 border-moss border-t-transparent animate-spin mb-6" />
        <p className="text-moss font-medium">Starting your learning session...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-medium text-moss">Adaptive Learning</h3>
          <p className="text-sm text-text-muted">AI-powered exercises that adapt to your level in real-time</p>
        </div>
        {stats.streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-100 rounded-full">
            <span className="text-lg">🔥</span>
            <span className="font-bold text-orange-600 text-sm">{stats.streak} in a row!</span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="px-4 py-2 bg-moss/5 rounded-xl">
          <span className="text-xs text-moss/60 font-medium uppercase">Correct</span>
          <div className="font-bold text-moss">{stats.correct}/{stats.total}</div>
        </div>
        <div className="px-4 py-2 bg-clay/5 rounded-xl">
          <span className="text-xs text-clay/60 font-medium uppercase">Best Streak</span>
          <div className="font-bold text-clay">{stats.longest_streak} 🔥</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Exercise area */}
        <div className="lg:col-span-3">
          {explanation && (
            <div style={{
              padding: '12px 16px', borderRadius: 12, marginBottom: 16,
              background: feedback === 'correct' ? 'rgba(76,175,80,0.08)' : 'rgba(255,152,0,0.08)',
              border: `1px solid ${feedback === 'correct' ? '#4CAF50' : '#FF9800'}`,
              fontWeight: 600, fontSize: 14,
            }}>
              {explanation}
            </div>
          )}

          {currentExercise ? (
            <ExerciseCard
              exercise={currentExercise}
              onAnswer={handleAnswer}
              disabled={answerDisabled}
              feedback={feedback}
            />
          ) : (
            <div className="text-center py-16">
              <p className="text-moss/50 mb-4">No exercise loaded yet.</p>
              <button onClick={startSession} className="px-6 py-3 bg-moss text-white rounded-xl font-bold">
                Start Session
              </button>
            </div>
          )}
        </div>

        {/* Skills sidebar */}
        <div className="lg:col-span-2">
          <BKTLiveDisplay
            skills={skills}
            lastSkillUpdate={lastSkillUpdate}
            lastIRTUpdate={lastIRTUpdate}
            lastSM2Update={lastSM2Update}
            sessionId={sessionId || undefined}
          />
        </div>
      </div>
    </div>
  );
}

/* ──────────────── SUB-SECTIONS (unchanged classic modes) ──────────────── */

const STORIES = [
  {
    id: 'story-1', title: "The Big Red Bed",
    tags: [{ label: 'b/d confusion', type: 'red' }, { label: 'phonics', type: 'green' }],
    trains: "Trains: b/d confusion",
    text: "Ben had a big red bed. He did not like the dark. He kept a dog by his bed. The dog did not bark at night. Ben felt safe. He slept well."
  },
  {
    id: 'story-2', title: "Dan and the Drum",
    tags: [{ label: 'b/d confusion', type: 'red' }, { label: 'phonics', type: 'green' }],
    trains: "Trains: b/d confusion",
    text: "Dan had a drum. He beat it every day. His dad did not mind. His dog ran away from the sound. Dan played a tune. Dad clapped his hands."
  },
  {
    id: 'story-3', title: "The Map and the Path",
    tags: [{ label: 'phonics', type: 'green' }],
    trains: "Trains: Phonics — short vowels",
    text: "Sam had a map. The path was flat. He sat on a rock. A cat ran past. Sam got up fast. He found the hut at last."
  },
  {
    id: 'story-4', title: "The Hot Sun",
    tags: [{ label: 'phonics', type: 'green' }],
    trains: "Trains: Phonics — short vowels",
    text: "It was hot. Tom sat on a log. He got a red cup. He drank cold milk. The sun went down. Tom ran back home."
  },
  {
    id: 'story-5', title: "The Night Light",
    tags: [{ label: 'phonics', type: 'green' }, { label: 'fluency', type: 'pink' }],
    trains: "Trains: Phonics — vowel teams",
    text: "Each night, Lily switched on her light. The bright glow made her room feel right. She could read and write and think. Sleep came slowly, soft and sweet."
  },
  {
    id: 'story-6', title: "The Rain Train",
    tags: [{ label: 'phonics', type: 'green' }],
    trains: "Trains: Phonics — vowel teams",
    text: "The train came in the rain. Jane got on with a cane. She had a bag of grain. The rain did not stop. The train was late. Jane did not complain."
  },
  {
    id: 'story-7', title: "The Park",
    tags: [{ label: 'sight words', type: 'blue' }],
    trains: "Trains: Sight words",
    text: "I went to the park. I could see many children. They were running around. Some of them had a ball. I sat down on the grass. It was a good day."
  },
  {
    id: 'story-8', title: "A Cold Morning",
    tags: [{ label: 'sight words', type: 'blue' }],
    trains: "Trains: Sight words",
    text: "Every morning was cold. She would get up early. She always made her own breakfast. Then she walked to the bus. People on the bus were quiet. She liked that."
  },
  {
    id: 'story-9', title: "First Day of School",
    tags: [{ label: 'sequencing', type: 'purple' }, { label: 'emotion', type: 'white' }],
    trains: "Trains: Sequencing",
    text: "First, Mia woke up early. Next, she put on her new shoes. Then, she ate toast. After that, her mum took her to school. Finally, she met her teacher. She smiled."
  },
  {
    id: 'story-10', title: "Making a Sandwich",
    tags: [{ label: 'sequencing', type: 'purple' }],
    trains: "Trains: Sequencing",
    text: "First, get two pieces of bread. Next, spread butter on both. Then, add cheese and ham. After that, press them together. Finally, cut it in half. Now it is ready to eat."
  },
  {
    id: 'story-11', title: "The Shy Fox",
    tags: [{ label: 'comprehension', type: 'orange' }, { label: 'emotion', type: 'white' }],
    trains: "Trains: Comprehension — inference",
    text: "The fox sat behind the bush. She watched the other animals play. She wanted to join them. But her legs would not move. One rabbit waved at her. She wagged her tail."
  },
  {
    id: 'story-12', title: "The Old Boat",
    tags: [{ label: 'comprehension', type: 'orange' }],
    trains: "Trains: Comprehension — inference",
    text: "The old man rowed slowly. His arms were tired. The fish were not biting. He looked at the sky. Dark clouds were coming. He turned the boat around."
  },
  {
    id: 'story-13', title: "Words That Help",
    tags: [{ label: 'vocabulary', type: 'greenish' }],
    trains: "Trains: Vocabulary — antonyms",
    text: "Some days feel heavy. Other days feel light. Some news is sad. Other news is glad. Some paths are long. Others are short. Every word has an opposite. That is what makes language rich."
  },
  {
    id: 'story-14', title: "Big and Small",
    tags: [{ label: 'vocabulary', type: 'greenish' }, { label: 'fluency', type: 'pink' }],
    trains: "Trains: Vocabulary — size/degree words",
    text: "An ant is tiny. A cat is small. A dog is medium. A horse is large. An elephant is enormous. A whale is gigantic. Each word tells you just how big something is."
  },
  {
    id: 'story-15', title: "The Brave Girl",
    tags: [{ label: 'fluency', type: 'pink' }, { label: 'emotion', type: 'white' }],
    trains: "Trains: Fluency — repeated reading",
    text: "Anya was afraid of the dark. She was afraid of loud sounds. She was afraid of big dogs. But one day she was afraid and she went anyway. That is what brave means."
  },
  {
    id: 'story-16', title: "The Lost Mitten",
    tags: [{ label: 'fluency', type: 'pink' }],
    trains: "Trains: Fluency — phrasing",
    text: "One cold morning, / Maya lost her mitten. / She looked under the chair. / She looked behind the door. / She looked inside her bag. / It was in her pocket / all along."
  },
  {
    id: 'story-17', title: "Why Kai Was Late",
    tags: [{ label: 'comprehension', type: 'orange' }, { label: 'sequencing', type: 'purple' }],
    trains: "Trains: Comprehension — cause and effect",
    text: "Kai missed the bus because he slept in. He slept in because he stayed up too late. He stayed up too late because he could not stop reading. His book was just too good."
  },
  {
    id: 'story-18', title: "The Kind Word",
    tags: [{ label: 'emotion', type: 'white' }, { label: 'comprehension', type: 'orange' }],
    trains: "Trains: Emotion / self-regulation",
    text: "Leo felt left out at lunch. No one sat with him. He wanted to cry but did not. Instead, he said hi to a new girl. She smiled. They both felt better."
  },
  {
    id: 'story-19', title: "My Brain Is Different",
    tags: [{ label: 'emotion', type: 'white' }],
    trains: "Trains: Self-awareness / confidence",
    text: "Some words mix up in my head. Letters flip and spin. Reading takes me longer. But I notice things others miss. I think in pictures. My brain works differently. Different is not wrong."
  },
  {
    id: 'story-20', title: "The Spelling Bee",
    tags: [{ label: 'vocabulary', type: 'greenish' }, { label: 'comprehension', type: 'orange' }],
    trains: "Trains: Metacognition / spelling strategies",
    text: "Before the spelling bee, Rosa made a plan. She broke each word into parts. She said it slowly. She pictured it. She wrote it in the air. When her name was called, she was ready."
  }
];

function ReadAlongSection({ userId, selectedStoryId, onSelectStory }: { userId: string, selectedStoryId: string, onSelectStory: (id: string) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIdx, setCurrentWordIdx] = useState(-1);
  const [speed, setSpeed] = useState(400);

  const story = STORIES.find(s => s.id === selectedStoryId) || STORIES[0];
  const words = story.text.split(' ');

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentWordIdx(prev => {
          if (prev >= words.length - 1) { setIsPlaying(false); return -1; }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, words.length, speed]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h3 className="text-3xl font-medium text-moss">{story.title}</h3>
            <select 
              value={selectedStoryId} 
              onChange={(e) => { onSelectStory(e.target.value); setIsPlaying(false); setCurrentWordIdx(-1); }}
              className="bg-moss/5 border border-moss/10 rounded-xl px-3 py-1.5 text-sm font-medium text-moss focus:outline-none focus:ring-2 focus:ring-moss/20"
            >
              {STORIES.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
          <p className="text-text-muted text-sm italic">Press play to start!</p>
        </div>
        <div className="flex items-center gap-4 bg-moss/5 p-2 rounded-2xl border border-moss/10">
          <div className="flex flex-col items-end px-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-moss/40">Speed</span>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-moss focus:outline-none">
              <option value={600}>Slow</option>
              <option value={400}>Normal</option>
              <option value={250}>Fast</option>
            </select>
          </div>
          <button onClick={() => { if (currentWordIdx === -1) setCurrentWordIdx(0); setIsPlaying(!isPlaying); }}
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${isPlaying ? 'bg-clay text-white shadow-lg' : 'bg-moss text-white hover:scale-105'}`}>
            <span className="iconify text-2xl" data-icon={isPlaying ? 'solar:pause-bold' : 'solar:play-bold'} />
          </button>
        </div>
      </div>

      <div className="bg-blue-50/30 p-12 rounded-[3.5rem] border border-blue-100 shadow-inner mb-8 leading-[2.5] min-h-[300px]">
        <div className="flex flex-wrap gap-x-2 gap-y-1">
          {words.map((word, idx) => (
            <span
              key={idx}
              style={{
                display: 'inline-block',
                scale: currentWordIdx === idx ? '1.2' : '1',
                color: currentWordIdx === idx ? '#C66B44' : '#2E4036',
                backgroundColor: currentWordIdx === idx ? 'rgba(198,107,68,0.1)' : 'transparent',
                transition: 'all 0.15s ease',
              }}
              className="text-2xl font-medium px-2 py-1 rounded-lg cursor-pointer hover:bg-moss/5"
            >
              {word}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={() => { setIsPlaying(false); setCurrentWordIdx(-1); }}
          className="text-xs font-bold uppercase tracking-widest text-clay hover:underline">
          Reset Story
        </button>
      </div>
    </div>
  );
}

function PhonicsLabSection({ userId }: { userId: string }) {
  const [letterIdx, setLetterIdx] = useState(0);
  const [flashcard, setFlashcard] = useState<any>(null);
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const fetchFlashcard = useCallback(async (idx: number) => {
    try {
      const res = await getFlashcard(LETTERS[idx]);
      setFlashcard(res?.data || res);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => { fetchFlashcard(letterIdx); }, [letterIdx, fetchFlashcard]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h3 className="text-3xl font-medium text-moss mb-6">Phonics Lab</h3>
          <p className="text-text-muted mb-10 leading-relaxed">Explore letters and their sounds with visual and auditory feedback.</p>
          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-moss/40">Alphabet Explorer</h4>
            <div className="grid grid-cols-6 gap-2">
              {LETTERS.map((l, idx) => (
                <button key={l} onClick={() => setLetterIdx(idx)}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center font-bold text-lg transition-all border ${
                    letterIdx === idx ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-moss/10 text-moss/60 hover:border-moss/30'
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-green-50/50 rounded-[3rem] p-10 border border-green-100 flex flex-col items-center justify-center min-h-[400px]">
          {flashcard ? (
            <div className="text-center space-y-8 w-full">
              <div className="relative inline-block">
                <span className="text-9xl font-bold text-green-700 block">{flashcard.letter || LETTERS[letterIdx]}</span>
                <div className="absolute -top-4 -right-8">
                  <AudioButton text={flashcard.letter || LETTERS[letterIdx]} className="bg-white text-green-600 w-12 h-12 shadow-sm" />
                </div>
              </div>
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-green-100 w-full space-y-4">
                <div className="flex items-center justify-center gap-4">
                  <span className="text-3xl font-medium text-moss">{flashcard.sound}</span>
                  <AudioButton text={flashcard.sound} className="bg-green-50 text-green-600" />
                </div>
                <p className="text-text-muted italic">"{flashcard.mnemonic}"</p>
                <div className="pt-4 flex flex-wrap justify-center gap-3">
                  {(flashcard.examples || []).map((word: string) => (
                    <div key={word} className="px-4 py-2 bg-green-50 rounded-xl text-green-700 font-medium flex items-center gap-2">
                      {word}
                      <AudioButton text={word} className="w-6 h-6 bg-white text-green-600 scale-75" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-24 h-24 bg-green-100 rounded-full mb-4" />
              <div className="w-48 h-4 bg-green-100 rounded" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



function StoryModeSection({ userId, selectedStoryId, onSelectStory }: { userId: string, selectedStoryId: string, onSelectStory: (id: string) => void }) {
  const getTagColor = (type: string) => {
    switch (type) {
      case 'red': return 'bg-[#f4ebe6] text-[#b4412f]';
      case 'green': return 'bg-[#e0f1e8] text-[#1e6144]';
      case 'pink': return 'bg-[#f8e5ee] text-[#8e295e]';
      case 'blue': return 'bg-[#e5eff8] text-[#295e8e]';
      case 'purple': return 'bg-[#eae4f9] text-[#4b3096]';
      case 'orange': return 'bg-[#faebd7] text-[#9b5110]';
      case 'greenish': return 'bg-[#e5f8e5] text-[#298e29]';
      case 'white': default: return 'bg-[#f4f4f4] text-[#444]';
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-12 text-center">
      <div className="w-20 h-20 rounded-full bg-moss/5 text-moss flex items-center justify-center mx-auto mb-8">
        <span className="iconify text-4xl" data-icon="solar:book-bold-duotone" />
      </div>
      <h3 className="text-3xl font-medium text-moss mb-4">Adaptive Stories</h3>
      <p className="text-text-muted max-w-xl mx-auto mb-10">Stories that adjust to your reading level, providing just the right amount of challenge.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {STORIES.map((story, index) => (
          <div 
            key={story.id}
            onClick={() => onSelectStory(story.id)}
            className="p-6 bg-white border border-moss/10 rounded-2xl relative overflow-hidden group hover:scale-[1.01] hover:bg-moss/5 transition-all cursor-pointer shadow-sm shadow-moss/5"
          >
            <div className="flex justify-between items-start mb-4">
              <h4 className="text-xl font-bold text-moss leading-tight pr-8 tracking-tight">{story.title}</h4>
              <span className="text-moss/40 text-sm font-semibold">#{index + 1}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {story.tags.map(tag => (
                <span key={tag.label} className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wide ${getTagColor(tag.type)}`}>
                  {tag.label}
                </span>
              ))}
            </div>
            <p className="text-xs font-medium text-moss/60 mb-3">{story.trains}</p>
            <p className="text-sm text-text-muted leading-relaxed max-w-sm" style={{ letterSpacing: '0.01em' }}>
              {story.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
