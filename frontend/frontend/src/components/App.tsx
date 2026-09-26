import { useCallback, useEffect, useRef, useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { simplifyText, ensureUserId, setUserId, friendlyError } from '../services/api';
import { useHashRoute } from '../lib/useHashRoute';
import type { Route } from '../lib/useHashRoute';

declare global {
  interface Window {
    Iconify: any;
  }
}
import AssistiveMode from './AssistiveMode';
import ApiNotice from './ApiNotice';
import Hero from './Hero';
import HowItWorks from './HowItWorks';
import History from './History';
import LearningMode from './LearningMode';
import PracticeMode from './PracticeMode';
import Navbar from './Navbar';
import SimplifierModal from './SimplifierModal';
import Dashboard from '../pages/Dashboard';
import AccessibilityMenu from './AccessibilityMenu';
import Onboarding from './Onboarding';
import ColorOverlay from './accessibility/ColorOverlay';
import ReadingRuler from './accessibility/ReadingRuler';
import '../styles/accessibility.css';

const TITLES: Record<Route, string> = {
  home: 'NeuroRead · Reading support for dyslexic readers',
  read: 'Simplify a text · NeuroRead',
  learn: 'Learn · NeuroRead',
  practice: 'Practice · NeuroRead',
  progress: 'Progress · NeuroRead',
};

function nextDifficulty(current: string) {
  const v = (current || '').toLowerCase();
  if (v === 'high') return 'Moderate';
  if (v === 'moderate') return 'Low';
  return 'Low';
}

export default function App() {
  const { route, navigate } = useHashRoute();
  const simplifierOpen = route === 'read';
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  // Onboarding gate
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('neuroread-onboarding-done')
  );

  const [userId, setUserIdState] = useState(() => ensureUserId('demo-user-001'));
  const [profile, setProfile] = useState('Default');
  const [inputText, setInputText] = useState('');

  const [dyslexiaOn, setDyslexiaOn] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState<any>(null);
  const [simplifiedText, setSimplifiedText] = useState('');

  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [historySessions, setHistorySessions] = useState<any[]>([]);

  useEffect(() => {
    setHistorySessions([]);
  }, []);

  useEffect(() => {
    setUserId(userId);
  }, [userId]);

  const mainRef = useRef<HTMLElement>(null);
  const firstRender = useRef(true);

  // On a route change: new title, back to the top, and focus the main region
  // so screen readers announce the new page.
  useEffect(() => {
    document.title = TITLES[route];
    if (route === 'read') return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [route]);

  useEffect(() => {
    window.Iconify?.scan?.();
  }, [route, historySessions.length]);

  const closeSimplifier = useCallback(() => {
    navigate('home');
    setAudioOn(false);
  }, [navigate]);

  const toggleDyslexia = useCallback(() => setDyslexiaOn((v) => !v), []);
  const toggleAudio = useCallback(() => setAudioOn((v) => !v), []);

  // `override` lets the demo pass its text directly instead of waiting for state.
  const runSimplifier = useCallback(async (override?: unknown) => {
    const text = (typeof override === 'string' ? override : inputText).trim();
    if (!text) {
      setError('Please enter some text to simplify.');
      return;
    }

    setError('');
    setLoading(true);
    setSimplifiedText('');
    setMetrics(null);

    try {
      const data = await simplifyText(text, profile, userId);
      if (data?.status === 'error') throw new Error(data.message || 'simplify failed');
      const adapted = {
        simplifiedText: data.simplified_text ?? '',
        originalScore: Math.round(data.original_analysis?.cognitive_load_score ?? 0),
        readingTime: `${Math.max(1, Math.round(data.original_analysis?.estimated_reading_time_minutes ?? 0))} min`,
        difficulty: (data.original_analysis?.cognitive_load_score >= 70 ? 'High' : data.original_analysis?.cognitive_load_score >= 40 ? 'Moderate' : 'Low'),
        reduction: data.cognitive_load_reduction ?? 0,
        intensity: Math.round(data.simplified_analysis?.cognitive_load_score ?? 0),
        impactSummary: data.impact_summary ?? '',
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        raw: data,
      };

      setSimplifiedText(adapted.simplifiedText || '');
      setMetrics(adapted as any);

      setHistorySessions((prev) => {
        const live = {
          id: `live-${Date.now()}`,
          title: `Focus Session ${prev.length + 1}`,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          originalScore: adapted.originalScore,
          simplifiedScore: adapted.intensity,
          reduction: adapted.reduction,
          difficultyFrom: adapted.difficulty,
          difficultyTo: nextDifficulty(adapted.difficulty),
          summary: adapted.impactSummary,
          keywords: adapted.keywords,
          accent: 'clay',
          isNew: true,
        };
        return [live, ...prev];
      });
    } catch (e: any) {
      setError(friendlyError(e, "That text couldn't be simplified. Try a shorter passage or try again in a moment."));
    } finally {
      setLoading(false);
    }
  }, [inputText, profile, userId]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-paper text-ink">
        <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); mainRef.current?.focus(); }}>
          Skip to content
        </a>

        {showOnboarding && (
          <Onboarding
            onComplete={(_age, startAt) => {
              setShowOnboarding(false);
              if (startAt) navigate(startAt);
            }}
          />
        )}
        <ColorOverlay />
        <ReadingRuler />
        <AccessibilityMenu open={settingsOpen} onClose={() => setSettingsOpen(false)} />

        <SimplifierModal
          open={simplifierOpen}
          onClose={closeSimplifier}
          userId={userId}
          onUserIdChange={(id: string) => setUserIdState(id)}
          profile={profile}
          onProfileChange={setProfile}
          inputText={inputText}
          onInputTextChange={setInputText}
          dyslexiaOn={dyslexiaOn}
          onToggleDyslexia={toggleDyslexia}
          audioOn={audioOn}
          onToggleAudio={toggleAudio}
          simplifiedText={simplifiedText}
          loading={loading}
          metrics={metrics}
          error={error}
          onRunSimplifier={runSimplifier}
        />

        <Navbar route={route} onOpenSettings={() => setSettingsOpen(true)} />

        <main id="main" ref={mainRef} tabIndex={-1} className="pb-24 outline-none md:pb-0">
          <ApiNotice wrapperClassName="mx-auto max-w-6xl px-4 pt-6 sm:px-6" />
          {(route === 'home' || route === 'read') && (
            <>
              <Hero />
              <section id="assistive-mode-section" className="py-16">
                <AssistiveMode
                  active={true}
                  onOpenSimplifier={() => navigate('read')}
                  onRunSimplifier={runSimplifier}
                  onSetInputText={setInputText}
                  onNavigate={navigate}
                />
              </section>
              <HowItWorks />
              <History userId={userId} />
            </>
          )}

          {route === 'learn' && <LearningMode active={true} />}
          {route === 'practice' && <PracticeMode active={true} />}
          {route === 'progress' && <Dashboard onNavigate={navigate} />}
        </main>

        <footer className="border-t border-line pb-24 md:pb-0">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>NeuroRead, built by Panshul Arora and Naman Rai.</p>
            <a
              href="https://github.com/panshularora/NEUROREAD"
              className="font-bold text-primary underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              Source on GitHub
            </a>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
