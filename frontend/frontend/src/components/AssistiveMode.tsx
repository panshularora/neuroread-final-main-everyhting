import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Camera, FileText, ImageUp, Play, Square, Pause, WandSparkles, Loader2 } from 'lucide-react';
import { uploadDocument, simplifyText, checkTextDifficulty, friendlyError } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import Tesseract from 'tesseract.js';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import { ColorizedText } from '../utils/phonemeColors.tsx';
import { speakWithSync } from '../utils/tts';
import type { TTSController } from '../utils/tts';
import type { DifficultyCheck } from '../types/api';

interface AssistiveModeProps {
  onOpenSimplifier: () => void;
  onRunSimplifier: (text: string) => void;
  onSetInputText: (text: string) => void;
}

/** Text taken from an uploaded document or a scanned page. */
interface DocResult {
  raw_text: string;
  simplified_text: string;
  keywords: string[];
  note?: string;
}

type DocTab = 'raw' | 'simplified' | 'audio';

export default function AssistiveMode({ onOpenSimplifier, onRunSimplifier, onSetInputText }: AssistiveModeProps) {
  const [docResult, setDocResult] = useState<DocResult | null>(null);
  const [docError, setDocError] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const uploadAsync = useAsync(uploadDocument, { retries: 0 });
  
  // Camera & OCR States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DocTab>('raw');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);

  const [difficultyResult, setDifficultyResult] = useState<DifficultyCheck | null>(null);
  const [checkingDifficulty, setCheckingDifficulty] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState('');
  const ttsControllerRef = useRef<TTSController | null>(null);
  const accessibility = useAccessibilityStore();

  // Web Speech API
  const speakText = (text: string) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.lang = "en-US";
    utterance.onend = () => setIsSpeaking(false);
    
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };
  
  const pauseSpeech = () => { window.speechSynthesis.pause(); setIsSpeaking(false); };
  const stopSpeech = () => { window.speechSynthesis.cancel(); setIsSpeaking(false); };

  // Difficulty check
  const checkDifficulty = async (textToCheck?: string) => {
    const text = textToCheck || simplifiedText;
    if (!text || !text.trim()) return;
    setCheckingDifficulty(true);
    try {
      setDifficultyResult(await checkTextDifficulty(text.trim(), 0.0));
    } catch (err) {
      setDocError(friendlyError(err, "Couldn't check the difficulty of this text."));
    } finally {
      setCheckingDifficulty(false);
    }
  };

  const startReadingAloud = (text: string) => {
    ttsControllerRef.current?.stop();
    const ctrl = speakWithSync(text, { rate: accessibility.ttsSpeed });
    ttsControllerRef.current = ctrl;
    ctrl.play();
    setIsSpeaking(true);
  };

  // Keyword Extraction (Basic NLP Logic)
  const extractKeywords = (text: string) => {
    const stopWords = ["the", "is", "and", "a", "to", "of", "in", "it", "that", "with", "as", "for"];
    const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(" ");
    const freq: Record<string, number> = {};
    words.forEach(word => {
      if (!stopWords.includes(word) && word.length > 3) {
        freq[word] = (freq[word] || 0) + 1;
      }
    });
    return Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 5);
  };

  const renderHighlightedText = (text: string, keywords: string[]) => {
    if (!highlightMode || !keywords?.length || !text) return text;
    const regex = new RegExp(`\\b(${keywords.join('|')})\\b`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => {
      if (keywords.some(k => k.toLowerCase() === part.toLowerCase())) {
        return <mark key={i} className="bg-orange-200 text-orange-900 px-1 rounded-sm cursor-help shadow-sm font-bold" title="Important Concept">{part}</mark>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Camera Logic
  const startCamera = async () => {
    setCameraOpen(true);
    setDocResult(null);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setDocError("The camera couldn't be opened. Check that this site is allowed to use it.");
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  };

  // Release the camera and any speech when leaving the page.
  useEffect(() => {
    const tts = ttsControllerRef;
    const stream = streamRef;
    return () => {
      stream.current?.getTracks().forEach(t => t.stop());
      window.speechSynthesis.cancel();
      tts.current?.stop();
    };
  }, []);

  const captureAndScan = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    
    stopCamera();
    handleOcrExtraction(dataUrl);
  };

  const handleOcrExtraction = async (imageSource: string | File) => {
    setOcrLoading(true);
    setDocError('');
    try {
      const result = await Tesseract.recognize(imageSource, 'eng');
      const rawText = result.data.text.trim();
      if (!rawText) {
        setDocError('No text was found in that image. Try a sharper, well-lit photo.');
        return;
      }
      let simplified = rawText;
      let note = '';
      try {
        const data = await simplifyText(rawText, 'Default');
        simplified = data?.simplified_text || rawText;
      } catch {
        note = 'The text was read from the image, but the simplifier is not reachable, so it is shown unchanged.';
      }
      setSimplifiedText(simplified);
      setDocResult({
        raw_text: rawText,
        simplified_text: simplified,
        keywords: extractKeywords(rawText),
        note,
      });
      setActiveTab('simplified');
    } catch {
      setDocError("Couldn't read text from that image. Try a sharper, well-lit photo.");
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    setDocError('');
    setDocResult(null);

    if (file.type.startsWith('image/')) {
      handleOcrExtraction(file);
    } else {
      setOcrLoading(true);
      try {
        const res = await uploadAsync.run(file);
        const st = res.simplified_text || res.original_text || '';
        setSimplifiedText(st);
        setDocResult({
          raw_text: res.original_text || st,
          simplified_text: st,
          keywords: res.keywords || extractKeywords(st)
        });
        setActiveTab('simplified');
      } catch (err) {
        setDocError(friendlyError(err, "That file couldn't be read. PDF, DOCX and TXT files work best."));
      } finally {
        setOcrLoading(false);
      }
    }
    input.value = '';
  };

  const runDemo = () => {
    const demoText = "The patient presented with acute myocardial infarction requiring immediate percutaneous coronary intervention. Contraindications to thrombolytic therapy were identified including recent hemorrhagic cerebrovascular accident within the preceding 3 months and current anticoagulation with warfarin maintaining an INR of 3.2, necessitating careful risk stratification prior to procedural intervention.";
    
    onOpenSimplifier();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSetInputText(demoText);
      onRunSimplifier(demoText);
      return;
    }

    setTimeout(() => {
      onSetInputText('');
      
      setTimeout(() => {
        let charIndex = 0;
        const totalDuration = 1500;
        const interval = totalDuration / demoText.length;
        
        const typingInterval = setInterval(() => {
          if (charIndex <= demoText.length) {
            onSetInputText(demoText.substring(0, charIndex));
            charIndex++;
          } else {
            clearInterval(typingInterval);
            setTimeout(() => {
              onRunSimplifier(demoText);
            }, 500);
          }
        }, interval);
      }, 300);
    }, 300);
  };

  const tabs: { id: DocTab; label: string }[] = [
    { id: 'raw', label: 'Original' },
    { id: 'simplified', label: 'Simplified' },
    { id: 'audio', label: 'Listen' },
  ];
  const busy = ocrLoading || uploadAsync.loading;

  return (
    <div id="content-assistive" className="mx-auto max-w-6xl px-4 sm:px-6">
      <h2 className="text-3xl text-ink">Reading tools</h2>
      <p className="mt-3 max-w-prose text-muted">
        Start from text you already have: paste it, upload a document, or take a photo of a page.
      </p>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col rounded-3xl border border-primary/25 bg-primary/5 p-6 lg:row-span-2">
          <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-white">
            <WandSparkles className="h-6 w-6" aria-hidden="true" />
          </span>
          <h3 className="text-2xl text-ink">Simplify a passage</h3>
          <p className="mt-2 text-base text-muted">
            Paste up to a few paragraphs. You get a plainer version, a reading-load score before and after,
            the key terms, and a tutor you can ask about any sentence.
          </p>
          <div className="mt-auto flex flex-col gap-3 pt-6 sm:flex-row lg:flex-col">
            <button
              type="button"
              onClick={onOpenSimplifier}
              className="rounded-xl bg-primary px-5 py-3 text-base font-bold text-white hover:bg-primary/90"
            >
              Open the simplifier
            </button>
            <button
              type="button"
              onClick={runDemo}
              className="rounded-xl border border-primary/30 bg-surface px-5 py-3 text-base font-bold text-primary hover:border-primary"
            >
              Try it with a medical example
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6 shadow-card lg:col-span-2">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <FileText className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-xl text-ink">Upload a document</h3>
                <p className="mt-1 text-base text-muted">PDF, Word or plain text. The text is extracted and simplified on the server.</p>
              </div>
            </div>
            <label className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-paper px-5 py-3 font-bold text-ink hover:border-primary/40 focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 ${busy ? 'opacity-60' : ''}`}>
              {uploadAsync.loading ? 'Uploading…' : 'Choose a file'}
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="sr-only"
                disabled={busy}
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-surface p-6 shadow-card lg:col-span-2">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                <Camera className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-xl text-ink">Scan a printed page</h3>
                <p className="mt-1 text-base text-muted">Use the camera or a photo. Text recognition runs in your browser.</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                type="button"
                onClick={cameraOpen ? stopCamera : startCamera}
                disabled={ocrLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-3 font-bold text-ink hover:border-primary/40 disabled:opacity-60"
              >
                <Camera className="h-5 w-5" aria-hidden="true" />
                {cameraOpen ? 'Close camera' : 'Use camera'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" disabled={busy} onChange={handleFileChange} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy || cameraOpen}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-4 py-3 font-bold text-ink hover:border-primary/40 disabled:opacity-60"
              >
                <ImageUp className="h-5 w-5" aria-hidden="true" />
                Upload a photo
              </button>
            </div>
          </div>

          {cameraOpen && (
            <div className="relative mt-6 overflow-hidden rounded-2xl bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="h-72 w-full object-cover" aria-label="Camera preview" />
              <button
                type="button"
                onClick={captureAndScan}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-5 py-3 font-bold text-ink shadow-raised"
              >
                Capture and read
              </button>
            </div>
          )}
        </div>
      </div>

      <div aria-live="polite">
        {docError && (
          <p role="alert" className="mt-6 rounded-2xl border border-err/30 bg-err/5 p-4 text-base text-err">
            {docError}
          </p>
        )}

        {busy && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-line bg-surface p-5 text-base text-muted">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            {ocrLoading && !uploadAsync.loading ? 'Reading text from the image…' : 'Extracting and simplifying the document…'}
          </div>
        )}
      </div>

      {docResult && !busy && (
        <section aria-label="Extracted text" className="mt-6 rounded-3xl border border-line bg-surface p-5 shadow-card sm:p-6">
          {docResult.note && <p className="mb-4 rounded-xl bg-warn/10 p-3 text-sm text-warn">{docResult.note}</p>}
          <div role="tablist" aria-label="Text view" className="mb-5 inline-flex rounded-xl border border-line bg-paper p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`doc-tab-${t.id}`}
                aria-selected={activeTab === t.id}
                aria-controls={`doc-panel-${t.id}`}
                onClick={() => setActiveTab(t.id)}
                className={`rounded-lg px-4 py-2 text-sm font-bold ${activeTab === t.id ? 'bg-surface text-primary shadow-card' : 'text-muted hover:text-ink'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'raw' && (
            <div role="tabpanel" id="doc-panel-raw" aria-labelledby="doc-tab-raw">
              <label className="mb-3 flex items-center gap-2 text-sm font-bold text-muted">
                <input type="checkbox" checked={highlightMode} onChange={(e) => setHighlightMode(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--c-primary))]" />
                Highlight key terms
              </label>
              <div className="max-h-72 max-w-prose overflow-y-auto whitespace-pre-wrap text-base text-ink">
                {renderHighlightedText(docResult.raw_text, docResult.keywords)}
              </div>
            </div>
          )}

          {activeTab === 'simplified' && (
            <div role="tabpanel" id="doc-panel-simplified" aria-labelledby="doc-tab-simplified">
              <div
                className="max-h-72 max-w-prose overflow-y-auto text-ink"
                style={{
                  fontFamily: accessibility.font === 'opendyslexic' ? 'OpenDyslexic, sans-serif' : undefined,
                  fontSize: accessibility.fontSize,
                  lineHeight: accessibility.lineHeight,
                  letterSpacing: `${accessibility.letterSpacing}em`,
                  wordSpacing: `${accessibility.wordSpacing}em`,
                }}
              >
                <ColorizedText text={docResult.simplified_text || ''} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startReadingAloud(docResult.simplified_text || '')}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
                >
                  <Play className="h-4 w-4" aria-hidden="true" /> Read aloud
                </button>
                <button
                  type="button"
                  onClick={() => checkDifficulty(docResult.simplified_text)}
                  disabled={checkingDifficulty}
                  className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-bold text-ink hover:border-primary/40 disabled:opacity-60"
                >
                  {checkingDifficulty ? 'Checking…' : 'Check difficulty'}
                </button>
              </div>
              {difficultyResult && (
                <p className={`mt-3 rounded-xl p-3 text-sm ${difficultyResult.should_simplify ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok'}`}>
                  <b>{difficultyResult.grade_label}</b>
                  {difficultyResult.recommendation ? ` · ${difficultyResult.recommendation}` : ''}
                  {difficultyResult.should_simplify ? ' Simplifying it further is recommended.' : ''}
                </p>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div role="tabpanel" id="doc-panel-audio" aria-labelledby="doc-tab-audio" className="flex flex-wrap items-center gap-3">
              {!isSpeaking ? (
                <button type="button" onClick={() => speakText(docResult.simplified_text || docResult.raw_text)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white hover:bg-primary/90">
                  <Play className="h-5 w-5" aria-hidden="true" /> Play
                </button>
              ) : (
                <button type="button" onClick={pauseSpeech} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white hover:bg-primary/90">
                  <Pause className="h-5 w-5" aria-hidden="true" /> Pause
                </button>
              )}
              <button type="button" onClick={stopSpeech} className="inline-flex items-center gap-2 rounded-xl border border-line bg-paper px-5 py-3 font-bold text-ink">
                <Square className="h-4 w-4" aria-hidden="true" /> Stop
              </button>
              <p className="w-full text-sm text-muted">Uses your browser&apos;s built-in voice.</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5">
            <button
              type="button"
              onClick={() => {
                onSetInputText(docResult.raw_text);
                onOpenSimplifier();
              }}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90"
            >
              Open in the simplifier
            </button>
            <a href="#/practice" className="rounded-xl border border-line bg-paper px-5 py-3 text-sm font-bold text-ink hover:border-primary/40">
              Go to practice games
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
