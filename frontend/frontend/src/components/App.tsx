import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { simplifyText, ensureUserId, setUserId } from '../services/api';

declare global {
  interface Window {
    gsap: any;
    ScrollTrigger: any;
    Iconify: any;
  }
}
import AssistiveMode from './AssistiveMode';
import Hero from './Hero';
import History from './History';
import LearningMode from './LearningMode';
import PracticeMode from './PracticeMode';
import Navbar from './Navbar';
import SimplifierModal from './SimplifierModal';
import Dashboard from '../pages/Dashboard';
import BookBackground from './BookBackground';
import AccessibilityMenu from './AccessibilityMenu';
import Onboarding from './Onboarding';
import ColorOverlay from './accessibility/ColorOverlay';
import ReadingRuler from './accessibility/ReadingRuler';
import '../styles/accessibility.css';

function safeGsap() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return null;
  try {
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  } catch {
    return null;
  }
}

function nextDifficulty(current: string) {
  const v = (current || '').toLowerCase();
  if (v === 'high') return 'Moderate';
  if (v === 'moderate') return 'Low';
  return 'Low';
}

export default function App() {
  const [mode, setMode] = useState('assistive');
  const [simplifierOpen, setSimplifierOpen] = useState(false);
  
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

  const contentRef = useRef(null);

  useEffect(() => {
    setHistorySessions([]);
  }, []);

  useEffect(() => {
    setUserId(userId);
  }, [userId]);

  useEffect(() => {
    const gs = safeGsap();
    if (!gs) return;
    const { gsap } = gs;

    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-anim', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power3.out', delay: 0.2 });
      gsap.fromTo(
        '.impact-card',
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '#impact', start: 'top 75%' } }
      );
    });

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    window.Iconify?.scan?.();
  }, [mode, simplifierOpen, historySessions.length]);

  const impactSection = useMemo(() => {
    return (
      <section id="impact" className="py-24 relative z-20 rounded-t-[3rem] -mt-10 overflow-hidden bg-white/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-20">
            <span className="font-mono text-xs text-moss uppercase tracking-wider block mb-3">Our Vision</span>
            <h2 className="md:text-5xl text-charcoal text-4xl font-medium tracking-tight max-w-2xl">
              Calm, Structured, and Personalized Learning
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="impact-card border border-moss/10 rounded-[2.5rem] p-8 md:p-10 bg-white shadow-sm transition-all hover:-translate-y-2 hover:shadow-md">
              <h3 className="font-medium text-2xl tracking-tight text-charcoal mb-4">Focus Mode</h3>
              <p className="text-charcoal/70 text-base leading-relaxed">
                Clean interfaces designed to reduce cognitive load and prioritize reading comprehension.
              </p>
            </div>
            <div className="impact-card border border-moss/10 rounded-[2.5rem] p-8 md:p-10 bg-white shadow-sm transition-all hover:-translate-y-2 hover:shadow-md">
              <h3 className="font-medium text-2xl tracking-tight text-charcoal mb-4">AI Tutor</h3>
              <p className="text-charcoal/70 text-base leading-relaxed">
                An emotionally supportive reading companion that simplifies logic on the fly.
              </p>
            </div>
            <div className="impact-card border border-moss/10 rounded-[2.5rem] p-8 md:p-10 bg-white shadow-sm transition-all hover:-translate-y-2 hover:shadow-md">
              <h3 className="font-medium text-2xl tracking-tight text-charcoal mb-4">Progress</h3>
              <p className="text-charcoal/70 text-base leading-relaxed">
                Track phonics and memory milestones with actionable daily recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }, []);

  const setModeSafe = useCallback((nextMode: string) => {
    setMode(nextMode);
    if (nextMode !== 'assistive') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const closeSimplifier = useCallback(() => {
    setSimplifierOpen(false);
    setAudioOn(false);
  }, []);

  const toggleDyslexia = useCallback(() => setDyslexiaOn((v) => !v), []);
  const toggleAudio = useCallback(() => setAudioOn((v) => !v), []);

  const runSimplifier = useCallback(async () => {
    const text = inputText.trim();
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
      setError(e?.message || 'Error reaching the API.');
    } finally {
      setLoading(false);
    }
  }, [inputText, profile, userId]);

  return (
    <div className="bg-cream text-charcoal font-sans antialiased overflow-x-hidden selection:bg-moss selection:text-cream min-h-screen">
      {/* First-time onboarding */}
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}
      <ColorOverlay />
      <ReadingRuler />
      <div className="noise-overlay" />
      <BookBackground />
      <AccessibilityMenu />

      <div className="relative z-10">
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

        <Navbar
          mode={mode}
          onModeChange={setModeSafe}
          onNavigate={(target) => {
             // Navigation is handled by mode state now
          }}
        />

        <main 
          ref={contentRef} 
          className={`transition-all duration-500 ${mode !== 'assistive' ? 'pt-32' : ''}`}
        >
          {mode === 'assistive' && (
            <>
              <Hero />
              {impactSection}
              <section id="assistive-mode-section" className="py-24 bg-white/40">
                <AssistiveMode
                  active={true}
                  onOpenSimplifier={() => setSimplifierOpen(true)}
                  onRunSimplifier={runSimplifier}
                  onSetInputText={setInputText}
                />
              </section>
              <History userId={userId} />
            </>
          )}

          {mode === 'learning' && <LearningMode active={true} />}
          {mode === 'practice' && <PracticeMode active={true} />}
          {mode === 'dashboard' && <Dashboard onNavigate={setModeSafe} />}
        </main>
      </div>
    </div>
  );
}


