import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import TextInput from '../components/TextInput';
import CognitivePanel from '../components/CognitivePanel';
import SimplifiedText from '../components/SimplifiedText';
import DyslexiaToggle from '../components/DyslexiaToggle';
import AudioPlayer from '../components/AudioPlayer';
import { postSimplify } from '../services/api';
import type { SimplifyResponse, UserProfile } from '../types/apiTypes';

interface SimplifierProps {
  userId: string;
  onUserIdChange: (id: string) => void;
}
const addToHistory = (newSession: any) => {
  const raw = localStorage.getItem("sessions");
  const existing = raw ? JSON.parse(raw) : [];
  const updated = [newSession, ...existing];
  localStorage.setItem("sessions", JSON.stringify(updated));
};
const Simplifier: React.FC<SimplifierProps> = ({ userId, onUserIdChange }) => {
  const [profile, setProfile] = useState<UserProfile>('default');
  const [text, setText] = useState<string>('');
  const [dyslexiaEnabled, setDyslexiaEnabled] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimplifyResponse | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) {
      setError('Please enter some text to simplify.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
  const data = await postSimplify({
    text,
    profile,
    user_id: userId,
    enable_dyslexia_support: dyslexiaEnabled,
    enable_audio: audioEnabled,
  });

  // ✅ 1) Get original cognitive score from backend analysis
  const originalScore = data.original_analysis?.cognitive_load_score ?? 0;

  // ✅ 2) Reading time from simplified text (200 words/min)
  const wordCount = (data.simplified_text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const readingTime = Math.max(1, Math.round((wordCount / 200) * 10) / 10); // minutes

  // ✅ 3) Difficulty label (simple rule)
  const difficulty =
    originalScore < 30 ? 'Easy' :
    originalScore < 60 ? 'Medium' :
    'Hard';

  // ✅ 4) Reduction percent
  const reductionPercent =
    originalScore > 0
      ? Math.round((data.cognitive_load_reduction / originalScore) * 1000) / 10
      : 0;

  // ✅ 5) Store result WITH extra fields so UI won’t show undefined
  setResult({
    ...data,
    cognitive_score: originalScore,
    reading_time: readingTime,
    difficulty,
    reduction_percent: reductionPercent,
  });
  addToHistory({
  id: Date.now(),
  date: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
  scoreBefore: originalScore,
  scoreAfter: data.cognitive_score,
  difficultyBefore: difficulty,
  difficultyAfter: difficulty,
  original: text,
  simplified: data.simplified_text,
  audioUrl: data.audio_file || undefined,
});
  
} catch (e) {
  setError('Unable to fetch simplified content. Please try again.');
} finally {
  setLoading(false);
}
  };

  return (
    <>
      <section className="card app-section app-section-centered">
        <TextInput
          text={text}
          onTextChange={setText}
          profile={profile}
          onProfileChange={setProfile}
          dyslexiaEnabled={dyslexiaEnabled}
          onDyslexiaToggle={setDyslexiaEnabled}
          audioEnabled={audioEnabled}
          onAudioToggle={setAudioEnabled}
          userId={userId}
          onUserIdChange={onUserIdChange}
          onSubmit={handleSubmit}
          loading={loading}
        />

        {error && <p className="app-error">{error}</p>}
      </section>

      <section className="app-grid">
        <div className="card">
          <CognitivePanel result={result} />
        </div>

        <div className="app-right">
          <div className="card app-reading-card">
  <div className="app-reading-header">
    <h2 className="app-reading-title">Adapted Reading View</h2>
    <DyslexiaToggle enabled={dyslexiaEnabled} onToggle={setDyslexiaEnabled} />
  </div>

  <div className="app-reading-body">
    <SimplifiedText
      simplifiedText={result?.simplified_text ?? ''}
      isolationMode={result?.isolation_mode ?? false}
      dyslexiaEnabled={dyslexiaEnabled}
    />

    {result && (
      <div style={{ marginTop: 12 }}>
        <p><b>Impact:</b> {result.impact_summary}</p>
        <p><b>Load reduction:</b> {result.cognitive_load_reduction}</p>
      </div>
    )}
  </div>
</div>
          <AnimatePresence initial={false}>
            {result && result.audio_file && audioEnabled && (
              <motion.div
                className="card app-audio-card"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <AudioPlayer src={`http://127.0.0.1:8001${result.audio_file}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </>
  );
};

export default Simplifier;
