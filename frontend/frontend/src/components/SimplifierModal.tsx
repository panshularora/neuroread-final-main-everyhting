import { useEffect, useMemo, useRef, useState } from 'react';
import { rewriteText, generateVocabCard, askTutor, fetchTTSAudio, submitSessionLog } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import InteractiveReader from './reading/InteractiveReader';
import CompanionAvatar from './reading/CompanionAvatar';

export default function SimplifierModal({
  open,
  onClose,
  userId,
  onUserIdChange,
  profile,
  onProfileChange,
  inputText,
  onInputTextChange,
  dyslexiaOn,
  onToggleDyslexia,
  audioOn,
  onToggleAudio,
  simplifiedText,
  loading,
  metrics,
  error,
  onRunSimplifier,
}) {
  const overlayRef = useRef(null);
  const raw = metrics?.raw || null;

  const [rewriteMode, setRewriteMode] = useState('simpler');
  const [rewrites, setRewrites] = useState([]);
  const [vocabCard, setVocabCard] = useState(null);
  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorMode, setTutorMode] = useState('explain');
  const [tutorMessages, setTutorMessages] = useState<any[]>([]);
  const [ttsUrl, setTtsUrl] = useState('');

  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [pausesCount, setPausesCount] = useState(0);
  const [errorsCount, setErrorsCount] = useState(0);

  const rewriteAsync = useAsync(rewriteText, { retries: 1 });
  const vocabAsync = useAsync(generateVocabCard, { retries: 1 });
  const tutorAsync = useAsync(askTutor, { retries: 0 });
  const ttsAsync = useAsync(fetchTTSAudio, { retries: 0 });

  useEffect(() => {
    if (open && simplifiedText) {
      if (!sessionStartTime) {
         setSessionStartTime(Date.now());
      }
    }
    if (!open && sessionStartTime) {
       const timeSeconds = (Date.now() - sessionStartTime) / 1000;
       const readingTimeMinutes = timeSeconds / 60;
       const diffWords = difficultWordsSet?.size || 0;
       submitSessionLog(userId, readingTimeMinutes, pausesCount, errorsCount, diffWords).catch(console.error);

       setSessionStartTime(null);
       setPausesCount(0);
       setErrorsCount(0);
    }
  }, [open, simplifiedText, sessionStartTime, userId, pausesCount, errorsCount]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') onRunSimplifier();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, onRunSimplifier]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    window.Iconify?.scan?.();
  }, [open, simplifiedText, metrics]);

  useEffect(() => {
    if (!open) return;
    setRewrites([]);
    setVocabCard(null);
    setTutorMessages([]);
    setTutorQuestion('');
    setTtsUrl('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (!audioOn) {
      setTtsUrl('');
      return;
    }
    const txt = (simplifiedText || '').trim();
    if (!txt) return;

    let cancelled = false;
    (async () => {
      try {
        const blob = await ttsAsync.run(txt);
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setTtsUrl(url);
      } catch {
        if (!cancelled) setTtsUrl('');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, audioOn, simplifiedText]);

  const dyslexiaStyle = useMemo(() => {
    if (!dyslexiaOn) return undefined;
    return { letterSpacing: '.06em', lineHeight: '2.2', wordSpacing: '.18em' };
  }, [dyslexiaOn]);

  const difficultWordsSet = useMemo(() => {
    const list = raw?.simplified_analysis?.difficult_words || raw?.original_analysis?.difficult_words || [];
    const set = new Set();
    for (const item of list) {
      const w = item?.word;
      if (w) set.add(String(w).toLowerCase());
    }
    return set;
  }, [raw]);

  const renderedSimplified = useMemo(() => {
    const txt = simplifiedText || '';
    if (!txt) return null;
    if (!difficultWordsSet.size) return txt;

    const parts = txt.split(/(\b[\w']+\b)/g);
    return parts.map((p, idx) => {
      const key = p && /\b[\w']+\b/.test(p) ? p.toLowerCase() : null;
      if (key && difficultWordsSet.has(key)) {
        return (
          <button
            key={`${idx}-${p}`}
            type="button"
            onClick={async () => {
              try {
                const card = await vocabAsync.run(p);
                setVocabCard(card);
              } catch {
                setVocabCard({ word: p, definition: 'Unable to fetch card.', simple_definition: '', example_sentence: '', synonyms: [] });
              }
            }}
            className="px-1 rounded-md bg-clay/10 hover:bg-clay/20 border border-clay/20 text-charcoal/80 transition-colors"
            title="Click for vocabulary card"
          >
            {p}
          </button>
        );
      }
      return <span key={`${idx}-t`}>{p}</span>;
    });
  }, [simplifiedText, difficultWordsSet, vocabAsync]);

  const explainSentence = async (sentence) => {
    const q = `Explain this sentence in simple terms:\n\n${sentence}`;
    setTutorMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', content: q },
    ]);
    try {
      const resp = await tutorAsync.run(sentence, q, 'explain');
      setTutorMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: resp?.answer || 'No answer returned.',
          suggested: resp?.suggested_questions || [],
        },
      ]);
    } catch {
      setTutorMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: 'Tutor is unavailable right now. Please try again.' },
      ]);
    }
  };

  const scoreBadgeClass = (() => {
    const diff = (metrics?.difficulty || 'PENDING').toLowerCase();
    const bc = {
      high: 'bg-red-50 text-red-600 border-red-200',
      moderate: 'bg-clay/10 text-clay border-clay/20',
      low: 'bg-moss/10 text-moss border-moss/20',
      pending: 'bg-charcoal/8 text-charcoal/50 border border-charcoal/10',
    };
    const base = 'text-xs font-medium px-3 py-1 rounded-full border';
    return `${base} ${bc[diff] || bc.moderate}`;
  })();

  if (!open) return null;

  return (
    <div
      id="simplifier-modal"
      ref={overlayRef}
      className="flex"
      onMouseDown={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="modal-box">
        <div className="flex items-center justify-between px-8 pt-7 pb-5 border-b border-moss/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-moss flex items-center justify-center">
              <span
                className="iconify text-cream"
                data-icon="solar:magic-stick-3-linear"
                style={{ width: '1.1rem', height: '1.1rem' }}
              />
            </div>
            <div>
              <h2 className="font-medium text-lg text-charcoal leading-none">Smart Simplifier</h2>
              <p className="text-xs text-charcoal/50 mt-0.5">AI-powered cognitive load reduction</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-moss/8 hover:bg-moss/15 flex items-center justify-center transition-colors border border-moss/10"
            aria-label="Close simplifier"
          >
            <span className="iconify text-charcoal/60" data-icon="solar:close-linear" style={{ width: '1.1rem', height: '1.1rem' }} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
          <div className="lg:col-span-3 p-6 md:p-8 border-r border-moss/10">
            <h3 className="font-medium text-base text-charcoal mb-1">Text Simplifier</h3>
            <p className="text-xs text-charcoal/50 mb-5">
              Paste or type text to analyse and simplify according to your reading profile.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="text-[10px] font-medium text-charcoal/50 uppercase tracking-wider block mb-1.5">
                  User ID
                </label>
                <input
                  value={userId}
                  onChange={(e) => onUserIdChange(e.target.value)}
                  type="text"
                  className="w-full rounded-xl border border-moss/15 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-moss/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-charcoal/50 uppercase tracking-wider block mb-1.5">
                  Reading Profile
                </label>
                <select
                  value={profile}
                  onChange={(e) => onProfileChange(e.target.value)}
                  className="w-full rounded-xl border border-moss/15 bg-white px-4 py-2.5 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-moss/20 appearance-none"
                >
                  <option>Default</option>
                  <option>Dyslexia Support</option>
                  <option>ADHD Mode</option>
                  <option>Technical Expert</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-charcoal/40 mb-5">Used to fetch your long-term cognitive progress.</p>

            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-medium text-charcoal/50 uppercase tracking-wider block">
                Text to Simplify
              </label>
            </div>
            <div className="relative group">
              <textarea
                value={inputText}
                onChange={(e) => onInputTextChange(e.target.value)}
                rows={9}
                placeholder={'Paste or type text that may be cognitively demanding...\nPress Ctrl/⌘ + Enter to simplify.'}
                className="w-full rounded-xl border border-moss/15 bg-white px-4 py-3 pb-12 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-moss/20 placeholder-charcoal/30 resize-y leading-relaxed"
              />
              <button 
                type="button"
                onClick={() => {
                  try {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    if (SpeechRecognition) {
                       const recognition = new SpeechRecognition();
                       recognition.onstart = () => {};
                       recognition.onresult = (event) => {
                         const transcript = event.results[0][0].transcript;
                         onInputTextChange(inputText ? inputText + ' ' + transcript : transcript);
                       };
                       recognition.start();
                    } else {
                       alert('Speech recognition is not supported in this browser.');
                    }
                  } catch (e) {
                     console.error(e);
                  }
                }}
                className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white shadow-sm border border-moss/10 hover:bg-clay hover:text-white hover:border-clay flex items-center justify-center text-moss transition-all group-focus-within:shadow-md"
                title="Dictate text via microphone"
              >
                <span className="iconify text-xl" data-icon="solar:microphone-3-bold-duotone" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleDyslexia}
                  className={`px-4 py-2 rounded-full border border-moss/20 text-xs font-medium text-charcoal hover:bg-moss hover:text-cream transition-all ${
                    dyslexiaOn ? 'bg-moss text-cream' : ''
                  }`}
                >
                  Dyslexia mode
                </button>
                <button
                  type="button"
                  onClick={onToggleAudio}
                  className={`px-4 py-2 rounded-full border border-moss/20 text-xs font-medium text-charcoal hover:bg-moss hover:text-cream transition-all flex items-center gap-2 ${
                    audioOn ? 'bg-moss text-cream' : ''
                  }`}
                >
                  <div className={`wave-bars ${audioOn ? 'playing' : ''}`}>
                    <div className="wave-bar bar1" />
                    <div className="wave-bar bar2" />
                    <div className="wave-bar bar3" />
                    <div className="wave-bar bar4" />
                    <div className="wave-bar bar5" />
                  </div>
                  Audio mode
                </button>
              </div>

              <button
                type="button"
                onClick={onRunSimplifier}
                disabled={loading}
                className="magnetic-btn px-6 py-2.5 rounded-full bg-clay text-cream text-xs font-medium uppercase tracking-wide disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-cream border-t-transparent rounded-full animate-spin" />
                    Analysing...
                  </span>
                ) : (
                  <span>Simplify text</span>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-medium text-charcoal/50 uppercase tracking-wider">
                  Rewrite mode
                </label>
                <select
                  value={rewriteMode}
                  onChange={(e) => setRewriteMode(e.target.value)}
                  className="rounded-xl border border-moss/15 bg-white px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-moss/20"
                >
                  <option value="simpler">Simpler</option>
                  <option value="academic">Academic</option>
                  <option value="child_friendly">Child friendly</option>
                </select>
              </div>

              <button
                type="button"
                disabled={rewriteAsync.loading || loading || !inputText?.trim()}
                onClick={async () => {
                  try {
                    const resp = await rewriteAsync.run(inputText, rewriteMode);
                    setRewrites(resp?.rewrites || []);
                  } catch {
                    setRewrites([]);
                  }
                }}
                className="px-5 py-2.5 rounded-full bg-moss text-cream text-xs font-medium uppercase tracking-wide disabled:opacity-60"
              >
                {rewriteAsync.loading ? 'Rewriting…' : 'Rewrite'}
              </button>
            </div>

            <div className="mt-6 border border-moss/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-moss/8">
                <h4 className="text-xs font-medium text-charcoal uppercase tracking-wider">Adapted Reading View</h4>
                <button
                  type="button"
                  onClick={onToggleDyslexia}
                  className={`text-[10px] px-3 py-1 rounded-full bg-moss/8 text-moss font-medium hover:bg-moss hover:text-cream transition-all ${
                    dyslexiaOn ? 'bg-moss text-cream' : ''
                  }`}
                >
                  Dyslexia Mode
                </button>
              </div>
              <div className="px-5 py-4 bg-white">
                <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-3">Simplified Content</p>
                {loading ? (
                  <div className="min-h-[80px] rounded-xl bg-moss/6 border border-moss/10 px-5 py-4">
                    <div className="shimmer w-full" />
                    <div className="shimmer w-4/5" />
                    <div className="shimmer w-3/5" />
                  </div>
                ) : error ? (
                  <div className="min-h-[80px] rounded-xl bg-moss/6 border border-moss/10 px-5 py-4 text-sm text-charcoal/70 leading-relaxed italic">
                    {error}
                  </div>
                ) : simplifiedText ? (
                  <div className="rounded-xl bg-moss/6 border border-moss/10 px-5 py-4">
                    <InteractiveReader
                      text={simplifiedText}
                      dyslexiaStyle={dyslexiaStyle}
                      difficultWordsSet={difficultWordsSet}
                      onWordClick={async (word: any) => {
                        setErrorsCount(e => e + 1);
                        try {
                          const card = await vocabAsync.run(word);
                          setVocabCard(card);
                        } catch {
                          setVocabCard({ word, definition: 'Unable to fetch card.', simple_definition: '', example_sentence: '', synonyms: [] });
                        }
                      }}
                      onExplainSentence={explainSentence}
                    />
                  </div>
                ) : (
                  <div className="min-h-[80px] rounded-xl bg-moss/6 border border-moss/10 px-5 py-4 text-sm text-charcoal/70 leading-relaxed italic" style={dyslexiaStyle}>
                    Simplified text will appear here once you run an analysis.
                  </div>
                )}
              </div>
            </div>

            {rewrites?.length ? (
              <div className="mt-5 border border-moss/10 rounded-2xl bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-medium text-charcoal uppercase tracking-wider">Rewrite Suggestions</h4>
                  <button
                    type="button"
                    onClick={() => setRewrites([])}
                    className="text-[10px] px-3 py-1 rounded-full bg-moss/8 text-moss font-medium hover:bg-moss hover:text-cream transition-all"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-4">
                  {rewrites.map((r, i) => (
                    <div key={`${i}-${r.original || ''}`} className="rounded-xl border border-moss/10 bg-moss/[0.03] p-4">
                      <p className="text-[11px] font-medium text-charcoal/50 uppercase tracking-wider mb-1">Original</p>
                      <p className="text-sm text-charcoal/70 leading-relaxed">{r.original}</p>
                      <p className="text-[11px] font-medium text-charcoal/50 uppercase tracking-wider mt-3 mb-1">Rewritten</p>
                      <p className="text-sm text-charcoal leading-relaxed">{r.rewritten}</p>
                      <p className="text-xs text-charcoal/60 mt-2">{r.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2 p-6 md:p-8 bg-moss/[0.03]">
            <h3 className="font-medium text-base text-charcoal mb-1">Cognitive Load Overview</h3>
            <div className="w-12 h-px bg-moss/20 mb-5" />

            {audioOn ? (
              <div className="rounded-2xl bg-white border border-moss/10 p-5 mb-4">
                <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-3">Audio (TTS)</p>
                {ttsAsync.loading ? (
                  <p className="text-xs text-charcoal/50">Generating audio…</p>
                ) : ttsUrl ? (
                  <audio controls src={ttsUrl} className="w-full" />
                ) : (
                  <p className="text-xs text-charcoal/50">Audio is unavailable for this text right now.</p>
                )}
              </div>
            ) : null}

            <div className="rounded-2xl bg-white border border-moss/10 p-5 mb-4">
              <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-3">Cognitive Score</p>
              <div className="flex items-center justify-between">
                <div className={scoreBadgeClass}>{(metrics?.difficulty || 'PENDING').toUpperCase?.() || 'PENDING'}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-medium text-charcoal">{metrics?.originalScore ?? '—'}</span>
                  <span className="text-sm text-charcoal/40">/ 100</span>
                </div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-moss/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-moss transition-all duration-1000"
                  style={{ width: `${metrics?.originalScore ?? 0}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="rounded-2xl bg-clay/8 border border-clay/15 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="iconify text-charcoal/60" data-icon="solar:clock-circle-linear" style={{ width: '1rem', height: '1rem' }} />
                  <span className="text-[10px] font-medium text-charcoal/50 uppercase tracking-wider">Reading Time</span>
                </div>
                <p className="text-xl font-medium text-charcoal mt-1">{metrics?.readingTime ?? '—'}</p>
                <div className="w-6 h-0.5 bg-charcoal/20 mt-2 rounded-full" />
              </div>
              <div className="rounded-2xl bg-clay/8 border border-clay/15 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="iconify text-charcoal/60" data-icon="solar:graph-linear" style={{ width: '1rem', height: '1rem' }} />
                  <span className="text-[10px] font-medium text-charcoal/50 uppercase tracking-wider">Difficulty</span>
                </div>
                <p className="text-xl font-medium text-charcoal mt-1">{metrics?.difficulty ?? '—'}</p>
                <div className="w-6 h-0.5 bg-charcoal/20 mt-2 rounded-full" />
              </div>
            </div>

            <div className="rounded-2xl bg-clay/8 border border-clay/15 p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="iconify text-charcoal/60" data-icon="solar:bolt-linear" style={{ width: '1rem', height: '1rem' }} />
                <span className="text-[10px] font-medium text-charcoal/50 uppercase tracking-wider">Reduction</span>
              </div>
              <p className="text-xl font-medium text-charcoal mt-1">{metrics?.reduction != null ? `${metrics.reduction}%` : '—'}</p>
              <div className="w-6 h-0.5 bg-charcoal/20 mt-2 rounded-full" />
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-moss font-medium">Cognitive Load Intensity</p>
                <span className="text-[11px] text-charcoal/40">{metrics?.intensity != null ? `${metrics.intensity} / 100` : '—'}</span>
              </div>
              <div className="h-2 rounded-full bg-moss/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-moss/60 to-clay transition-all duration-1000"
                  style={{ width: `${metrics?.intensity ?? 0}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-moss/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="iconify text-moss" data-icon="solar:lightbulb-linear" style={{ width: '1.1rem', height: '1.1rem' }} />
                <h4 className="text-sm font-medium text-charcoal">Impact Summary</h4>
              </div>
              <p className="text-xs text-charcoal/60 leading-relaxed">
                {metrics?.impactSummary ||
                  'Run a simplification to see the cognitive impact analysis and personalised recommendations.'}
              </p>
            </div>

            {metrics?.keywords?.length ? (
              <div className="mt-4">
                <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-2">Key Terms Detected</p>
                <div className="flex flex-wrap gap-2">
                  {metrics.keywords.map((k) => (
                    <span
                      key={k}
                      className="text-[11px] px-3 py-1 rounded-full bg-moss/8 text-moss border border-moss/15 font-medium"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl bg-white border border-moss/10 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="iconify text-moss" data-icon="solar:chat-round-dots-linear" style={{ width: '1.1rem', height: '1.1rem' }} />
                <h4 className="text-sm font-medium text-charcoal">AI Reading Tutor</h4>
              </div>

              <div className="space-y-3 max-h-52 overflow-auto pr-1">
                {tutorMessages.length ? (
                  tutorMessages.map((m) => (
                    <div key={m.id} className={`text-xs leading-relaxed ${m.role === 'user' ? 'text-charcoal' : 'text-charcoal/70'}`}>
                      <span className="font-medium">{m.role === 'user' ? 'You' : 'Tutor'}: </span>
                      {m.content}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-charcoal/50">Ask a question about the text you’re reading.</p>
                )}
              </div>

              <div className="flex items-center gap-2 mt-4">
                <select
                  value={tutorMode}
                  onChange={(e) => setTutorMode(e.target.value)}
                  className="rounded-xl border border-moss/15 bg-white px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-moss/20"
                >
                  <option value="explain">Explain</option>
                  <option value="summarize">Summarize</option>
                  <option value="example">Example</option>
                </select>
                <input
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  placeholder="Ask a question…"
                  className="flex-1 rounded-xl border border-moss/15 bg-white px-4 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-moss/20"
                />
              </div>

              <button
                type="button"
                disabled={tutorAsync.loading || !tutorQuestion.trim() || !inputText.trim()}
                onClick={async () => {
                  const q = tutorQuestion.trim();
                  if (!q) return;
                  setPausesCount(p => p + 1);
                  setTutorQuestion('');
                  setTutorMessages((prev) => [
                    ...prev,
                    { id: `u-${Date.now()}`, role: 'user', content: q },
                  ]);
                  try {
                    const resp = await tutorAsync.run(inputText, q, tutorMode);
                    setTutorMessages((prev) => [
                      ...prev,
                      {
                        id: `a-${Date.now()}`,
                        role: 'assistant',
                        content: resp?.answer || 'No answer returned.',
                        suggested: resp?.suggested_questions || [],
                      },
                    ]);
                  } catch {
                    setTutorMessages((prev) => [
                      ...prev,
                      { id: `a-${Date.now()}`, role: 'assistant', content: 'Tutor is unavailable right now. Please try again.' },
                    ]);
                  }
                }}
                className="mt-3 w-full px-4 py-2.5 rounded-xl bg-clay text-cream text-xs font-medium uppercase tracking-wide disabled:opacity-60"
              >
                {tutorAsync.loading ? 'Thinking…' : 'Ask Tutor'}
              </button>

              {tutorMessages.length ? (
                <div className="mt-3">
                  {(() => {
                    const last = tutorMessages[tutorMessages.length - 1];
                    const suggested = last?.suggested || [];
                    if (!suggested.length) return null;
                    return (
                      <div>
                        <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-2">Suggested follow-ups</p>
                        <div className="flex flex-wrap gap-2">
                          {suggested.map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setTutorQuestion(q)}
                              className="text-[11px] px-3 py-1 rounded-full bg-moss/8 text-moss border border-moss/15 font-medium hover:bg-moss hover:text-cream transition-all"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {vocabCard ? (
        <div
          className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-6"
          onMouseDown={() => setVocabCard(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white border border-moss/10 shadow-[0_25px_80px_-25px_rgba(0,0,0,0.35)] p-6"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-charcoal">{vocabCard.word}</h3>
              <button
                type="button"
                onClick={() => setVocabCard(null)}
                className="w-9 h-9 rounded-full bg-moss/8 hover:bg-moss/15 flex items-center justify-center transition-colors border border-moss/10"
                aria-label="Close vocabulary card"
              >
                <span className="iconify text-charcoal/60" data-icon="solar:close-linear" style={{ width: '1.1rem', height: '1.1rem' }} />
              </button>
            </div>

            <p className="text-xs text-charcoal/50 mb-1">Definition</p>
            <p className="text-sm text-charcoal/80 leading-relaxed">{vocabCard.definition}</p>

            <p className="text-xs text-charcoal/50 mt-4 mb-1">Simple definition</p>
            <p className="text-sm text-charcoal/80 leading-relaxed">{vocabCard.simple_definition}</p>

            <p className="text-xs text-charcoal/50 mt-4 mb-1">Example</p>
            <p className="text-sm text-charcoal/80 leading-relaxed">{vocabCard.example_sentence}</p>

            {Array.isArray(vocabCard.synonyms) && vocabCard.synonyms.length ? (
              <div className="mt-4">
                <p className="text-xs text-charcoal/50 mb-2">Synonyms</p>
                <div className="flex flex-wrap gap-2">
                  {vocabCard.synonyms.slice(0, 10).map((s) => (
                    <span key={s} className="text-[11px] px-3 py-1 rounded-full bg-clay/10 text-charcoal/70 border border-clay/20 font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <CompanionAvatar text={inputText || simplifiedText} />
    </div>
  );
}

