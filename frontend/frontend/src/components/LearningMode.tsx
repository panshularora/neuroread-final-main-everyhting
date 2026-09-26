import { useState, useEffect, useCallback, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { BookOpen, Library, Pause, Play, RotateCcw, Target, Volume2 } from 'lucide-react';
import ExerciseCard from './ExerciseCard';
import BKTLiveDisplay from './BKTLiveDisplay';
import {
  getFlashcard,
  ensureUserId,
  startLearningSession,
  getSessionSkills,
  submitSessionAnswer,
  friendlyError,
} from '../services/api';
import AudioButton from './AudioButton';

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

type SubMode = 'adaptive' | 'read-along' | 'phonics' | 'stories';

const SUB_MODES: { id: SubMode; name: string; Icon: typeof Target }[] = [
  { id: 'adaptive', name: 'Adaptive practice', Icon: Target },
  { id: 'read-along', name: 'Read along', Icon: BookOpen },
  { id: 'phonics', name: 'Phonics lab', Icon: Volume2 },
  { id: 'stories', name: 'Stories', Icon: Library },
];

export default function LearningMode({ active }: { active: boolean }) {
  const [subMode, setSubMode] = useState<SubMode>('adaptive');
  const [selectedStoryId, setSelectedStoryId] = useState('story-1');
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const userId = ensureUserId();

  if (!active) return null;

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  const onTabKey = (e: KeyboardEvent, idx: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = SUB_MODES[(idx + delta + SUB_MODES.length) % SUB_MODES.length];
    setSubMode(next.id);
    tabRefs.current[next.id]?.focus();
  };

  return (
    <div id="content-learning" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl">Learn at your own pace</h1>
        <p className="mt-3 text-lg text-muted">
          Short exercises that adjust to how you are doing, stories to read along with, and a phonics lab for letter
          sounds.
        </p>
      </header>

      <div role="tablist" aria-label="Learning activities" className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {SUB_MODES.map((m, idx) => {
          const selected = subMode === m.id;
          return (
            <button
              key={m.id}
              ref={(el) => { tabRefs.current[m.id] = el; }}
              role="tab"
              id={`tab-${m.id}`}
              aria-selected={selected}
              aria-controls="learning-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => setSubMode(m.id)}
              onKeyDown={(e) => onTabKey(e, idx)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 font-bold sm:px-4 ${
                selected ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink hover:border-primary/50'
              }`}
            >
              <m.Icon className="h-5 w-5" aria-hidden="true" />
              {m.name}
            </button>
          );
        })}
      </div>

      <div
        id="learning-panel"
        role="tabpanel"
        aria-labelledby={`tab-${subMode}`}
        className="min-h-[480px] rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-8"
      >
        {subMode === 'adaptive' && <AdaptiveLearningSection userId={userId} />}
        {subMode === 'read-along' && (
          <ReadAlongSection userId={userId} selectedStoryId={selectedStoryId} onSelectStory={setSelectedStoryId} />
        )}
        {subMode === 'phonics' && <PhonicsLabSection userId={userId} />}
        {subMode === 'stories' && (
          <StoryModeSection
            userId={userId}
            selectedStoryId={selectedStoryId}
            onSelectStory={(id) => {
              setSelectedStoryId(id);
              setSubMode('read-along');
            }}
          />
        )}
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
  const [loadError, setLoadError] = useState('');

  const age = parseInt(localStorage.getItem('neuroread-user-age') || '8', 10);

  // Start session on mount
  useEffect(() => {
    startSession();
  }, []);

  async function startSession() {
    setLoading(true);
    setLoadError('');
    try {
      const data = await startLearningSession(userId, age, 'learning');
      setSessionId(data.session_id);
      setCurrentExercise(data.first_exercise);
    } catch (err) {
      setLoadError(friendlyError(err, "Your session couldn't be started. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  async function loadSkills() {
    if (!sessionId) return;
    try {
      const data = await getSessionSkills(sessionId);
      setSkills(data.skills || []);
      if (data.session_stats) setStats(data.session_stats);
    } catch {
      // The skills panel keeps its last values; the exercise flow is unaffected.
    }
  }

  async function handleAnswer(answer: string) {
    if (!sessionId || !currentExercise || answerDisabled) return;
    setAnswerDisabled(true);

    const startTime = Date.now();
    try {
      const data = await submitSessionAnswer(sessionId, currentExercise.id, answer, Date.now() - startTime);

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
      setLoadError(friendlyError(err, "Your answer couldn't be checked. Please try again."));
      setAnswerDisabled(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20" role="status">
        <div className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="font-bold text-primary">Starting your session…</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl">Adaptive practice</h2>
          <p className="text-muted">Each answer updates your skill estimates, and the next exercise is picked to match.</p>
        </div>
        <dl className="flex gap-3 text-sm">
          <div className="rounded-xl bg-paper px-4 py-2">
            <dt className="text-muted">Correct</dt>
            <dd className="text-lg font-bold tabular-nums">
              {stats.correct}/{stats.total}
            </dd>
          </div>
          <div className="rounded-xl bg-paper px-4 py-2">
            <dt className="text-muted">Streak</dt>
            <dd className="text-lg font-bold tabular-nums">{stats.streak}</dd>
          </div>
          <div className="rounded-xl bg-paper px-4 py-2">
            <dt className="text-muted">Best</dt>
            <dd className="text-lg font-bold tabular-nums">{stats.longest_streak}</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Exercise area */}
        <div className="lg:col-span-3">
          {loadError && (
            <p role="alert" className="mb-4 rounded-2xl border border-err/30 bg-err/5 p-4 text-base text-err">
              {loadError}
            </p>
          )}
          {explanation && (
            <p
              className={`mb-4 rounded-2xl border px-4 py-3 font-bold ${
                feedback === 'correct' ? 'border-ok/40 bg-ok/10' : 'border-warn/40 bg-warn/10'
              }`}
            >
              {explanation}
            </p>
          )}

          {currentExercise ? (
            <ExerciseCard
              exercise={currentExercise}
              onAnswer={handleAnswer}
              disabled={answerDisabled}
              feedback={feedback}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center">
              <p className="mb-5 text-base text-muted">
                {loadError ? 'The first exercise could not be loaded.' : 'No exercise loaded yet.'}
              </p>
              <button
                type="button"
                onClick={startSession}
                className="rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90"
              >
                {loadError ? 'Try again' : 'Start session'}
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

function ReadAlongSection({ selectedStoryId, onSelectStory }: { userId: string, selectedStoryId: string, onSelectStory: (id: string) => void }) {
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

  const reset = () => { setIsPlaying(false); setCurrentWordIdx(-1); };

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="text-2xl">{story.title}</h2>
      <p className="mb-6 text-muted">Press play and follow the highlighted word. {story.trains}.</p>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="story-select" className="mb-1 block text-sm font-bold text-muted">Story</label>
          <select
            id="story-select"
            value={selectedStoryId}
            onChange={(e) => { onSelectStory(e.target.value); reset(); }}
            className="rounded-xl border border-line bg-paper px-3 py-2.5"
          >
            {STORIES.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="speed-select" className="mb-1 block text-sm font-bold text-muted">Speed</label>
          <select
            id="speed-select"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="rounded-xl border border-line bg-paper px-3 py-2.5"
          >
            <option value={600}>Slow</option>
            <option value={400}>Normal</option>
            <option value={250}>Fast</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => { if (currentWordIdx === -1) setCurrentWordIdx(0); setIsPlaying(!isPlaying); }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white hover:bg-primary/90"
        >
          {isPlaying ? <Pause className="h-5 w-5" aria-hidden="true" /> : <Play className="h-5 w-5" aria-hidden="true" />}
          {isPlaying ? 'Pause' : currentWordIdx > 0 ? 'Resume' : 'Play'}
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 font-bold hover:bg-ink/5"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" /> Start over
        </button>
      </div>

      <p className="min-h-[220px] rounded-2xl bg-paper p-6 text-2xl sm:p-10" style={{ lineHeight: 2.1 }}>
        {words.map((word, idx) => (
          <span key={idx}>
            <span
              className={`rounded-md px-1 ${
                currentWordIdx === idx ? 'bg-accent/20 text-accent underline decoration-2 underline-offset-8' : ''
              }`}
            >
              {word}
            </span>{' '}
          </span>
        ))}
      </p>
    </div>
  );
}

function PhonicsLabSection({ userId: _userId }: { userId: string }) {
  const [letterIdx, setLetterIdx] = useState(0);
  const [flashcard, setFlashcard] = useState<any>(null);
  const [failed, setFailed] = useState('');
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const fetchFlashcard = useCallback(async (idx: number) => {
    setFailed('');
    setFlashcard(null);
    try {
      const res = await getFlashcard(LETTERS[idx]);
      setFlashcard(res?.data || res);
    } catch (err) {
      setFailed(friendlyError(err, "This letter card couldn't be loaded."));
    }
  }, []);

  useEffect(() => { fetchFlashcard(letterIdx); }, [letterIdx, fetchFlashcard]);

  const letter = flashcard?.letter || LETTERS[letterIdx];

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
      <div>
        <h2 className="text-2xl">Phonics lab</h2>
        <p className="mb-6 text-muted">Pick a letter to hear its sound and see example words.</p>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-7" role="group" aria-label="Letters">
          {LETTERS.map((l, idx) => (
            <button
              key={l}
              type="button"
              onClick={() => setLetterIdx(idx)}
              aria-pressed={letterIdx === idx}
              aria-label={`Letter ${l}`}
              className={`flex aspect-square items-center justify-center rounded-xl border text-lg font-bold ${
                letterIdx === idx ? 'border-primary bg-primary text-white' : 'border-line bg-paper hover:border-primary/50'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-3xl bg-paper p-6 sm:p-10" aria-live="polite">
        {flashcard ? (
          <div className="w-full space-y-6 text-center">
            <div className="flex items-center justify-center gap-4">
              <span className="font-display text-8xl font-bold text-primary">{letter}</span>
              <AudioButton text={letter} className="h-12 w-12" />
            </div>
            <div className="space-y-4 rounded-2xl border border-line bg-surface p-6">
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-bold">{flashcard.sound}</span>
                <AudioButton text={flashcard.sound} />
              </div>
              {flashcard.mnemonic && <p className="text-muted">{flashcard.mnemonic}</p>}
              <ul className="flex flex-wrap justify-center gap-2 pt-2">
                {(flashcard.examples || []).map((word: string) => (
                  <li key={word} className="flex items-center gap-1 rounded-xl bg-primary/10 py-1 pl-4 pr-1 font-bold text-primary">
                    {word}
                    <AudioButton text={word} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : failed ? (
          <div className="text-center">
            <span className="font-display text-8xl font-bold text-primary/40">{LETTERS[letterIdx]}</span>
            <p className="mt-4 text-muted">{failed}</p>
            <button
              type="button"
              onClick={() => fetchFlashcard(letterIdx)}
              className="mt-4 rounded-xl border border-line bg-surface px-4 py-2 font-bold hover:bg-ink/5"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center" role="status" aria-label="Loading letter card">
            <div className="mb-4 h-24 w-24 animate-pulse rounded-full bg-ink/10" />
            <div className="h-4 w-48 animate-pulse rounded bg-ink/10" />
          </div>
        )}
      </div>
    </div>
  );
}

function StoryModeSection({ selectedStoryId, onSelectStory }: { userId: string, selectedStoryId: string, onSelectStory: (id: string) => void }) {
  return (
    <div>
      <h2 className="text-2xl">Stories</h2>
      <p className="mb-6 max-w-2xl text-muted">
        Twenty short stories, each written to practise one skill. Pick one to open it in Read along.
      </p>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {STORIES.map((story) => (
          <li key={story.id}>
            <button
              type="button"
              onClick={() => onSelectStory(story.id)}
              aria-current={story.id === selectedStoryId ? 'true' : undefined}
              className="h-full w-full rounded-2xl border border-line bg-paper p-5 text-left hover:border-primary/60 hover:bg-primary/5"
            >
              <span className="block font-display text-lg font-bold">{story.title}</span>
              <span className="mt-2 flex flex-wrap gap-2">
                {story.tags.map(tag => (
                  <span key={tag.label} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary">
                    {tag.label}
                  </span>
                ))}
              </span>
              <span className="mt-3 line-clamp-2 block text-muted">{story.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
