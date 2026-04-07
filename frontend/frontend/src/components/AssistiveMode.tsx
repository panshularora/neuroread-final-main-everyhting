import { useState, useRef, useEffect } from 'react';
import { uploadDocument } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import Tesseract from 'tesseract.js';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import { colorizeText } from '../utils/phonemeColors.tsx';
import { speakWithSync } from '../utils/tts';


const API_URL = import.meta.env.VITE_API_URL;

export default function AssistiveMode({ active, onOpenSimplifier, onRunSimplifier, onSetInputText }) {
  const [docResult, setDocResult] = useState(null);
  const [docError, setDocError] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const uploadAsync = useAsync(uploadDocument, { retries: 0 });
  
  // Camera & OCR States
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [activeTab, setActiveTab] = useState('raw'); // 'raw', 'simplified', 'audio'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);

  // Accessibility additions

  const [difficultyResult, setDifficultyResult] = useState(null);
  const [checkingDifficulty, setCheckingDifficulty] = useState(false);
  const [highlightedCharRange, setHighlightedCharRange] = useState(null);
  const [simplifiedText, setSimplifiedText] = useState('');
  const ttsControllerRef = useRef(null);
  const accessibility = useAccessibilityStore();

  // Web Speech API
  const speakText = (text) => {
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
  const checkDifficulty = async (textToCheck) => {
    const text = textToCheck || simplifiedText;
    if (!text || !text.trim()) return;
    setCheckingDifficulty(true);
    try {
      const res = await fetch(`${API_URL}/assistive/difficulty-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), user_ability: 0.0 }),
      });
      const data = await res.json();
      setDifficultyResult(data);
    } catch (err) {
      console.error('Difficulty check failed:', err);
    } finally {
      setCheckingDifficulty(false);
    }
  };

  // TTS with word-level sync
  const startReadingAloud = (text) => {
    if (ttsControllerRef.current) ttsControllerRef.current.stop();
    setHighlightedCharRange(null);

    const words = text.split(' ');
    let charPos = 0;
    const wordOffsets = words.map(w => {
      const start = charPos;
      charPos += w.length + 1;
      return { start, end: start + w.length };
    });

    const ctrl = speakWithSync(
      text,
      { rate: accessibility.ttsSpeed },
      (charIndex) => {
        const wordIdx = wordOffsets.findIndex(
          w => charIndex >= w.start && charIndex < w.end
        );
        if (wordIdx >= 0) setHighlightedCharRange(wordOffsets[wordIdx]);
      },
      () => setHighlightedCharRange(null)
    );
    ttsControllerRef.current = ctrl;
    ctrl.play();
    setIsSpeaking(true);
  };

  // Keyword Extraction (Basic NLP Logic)
  const extractKeywords = (text) => {
    const stopWords = ["the", "is", "and", "a", "to", "of", "in", "it", "that", "with", "as", "for"];
    const words = text.toLowerCase().replace(/[^\w\s]/g, "").split(" ");
    const freq = {};
    words.forEach(word => {
      if (!stopWords.includes(word) && word.length > 3) {
        freq[word] = (freq[word] || 0) + 1;
      }
    });
    return Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 5);
  };

  const renderHighlightedText = (text, keywords) => {
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
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      setDocError('Error opening camera: ' + err.message);
      setCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setStream(null);
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
      window.speechSynthesis.cancel();
      if (ttsControllerRef.current) ttsControllerRef.current.stop();
    };
  }, []);

  const captureAndScan = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    
    stopCamera();
    handleOcrExtraction(dataUrl);
  };

  const handleOcrExtraction = async (imageSource) => {
    setOcrLoading(true);
    setDocError('');
    try {
      const result = await Tesseract.recognize(imageSource, 'eng');
      const rawText = result.data.text;
      const extractedKw = extractKeywords(rawText);
      const simplified = "Simulated Simplified Version: " + rawText.split('. ').slice(0, 3).join('. ');
      setSimplifiedText(simplified);
      setDocResult({
        raw_text: rawText,
        simplified_text: simplified,
        metrics: { cognitive_load: 'Requires Review' },
        keywords: extractedKw
      });
      setActiveTab('raw');
    } catch (err) {
      setDocError('OCR Failed: ' + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocError('');
    setDocResult(null);

    if (file.type.startsWith('image/')) {
      handleOcrExtraction(file);
    } else {
      setOcrLoading(true);
      try {
        const res = await uploadAsync.run(file);
        const st = res.simplified_text || "Document loaded.";
        setSimplifiedText(st);
        setDocResult({
          raw_text: st,
          simplified_text: st,
          metrics: res.metrics || { cognitive_load: 'N/A' },
          keywords: res.keywords || extractKeywords(st)
        });
        setActiveTab('simplified');
      } catch (err) {
        setDocError(err?.message || 'Failed to upload document.');
      } finally {
        setOcrLoading(false);
      }
    }
    e.target.value = '';
  };

  const runDemo = () => {
    const demoText = "The patient presented with acute myocardial infarction requiring immediate percutaneous coronary intervention. Contraindications to thrombolytic therapy were identified including recent hemorrhagic cerebrovascular accident within the preceding 3 months and current anticoagulation with warfarin maintaining an INR of 3.2, necessitating careful risk stratification prior to procedural intervention.";
    
    onOpenSimplifier();
    
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
              onRunSimplifier();
            }, 500);
          }
        }, interval);
      }, 300);
    }, 300);
  };

  return (
    <div
      id="content-assistive"
      className={`col-start-1 row-start-1 transition-all duration-700 ease-spring ${
        active ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 translate-y-8 pointer-events-none z-0'
      }`}
      style={{ position: 'relative' }}
    >

      <div className="mb-12 text-center max-w-2xl mx-auto">
        <span className="font-mono text-xs text-clay uppercase tracking-wider mb-4 block">System 01</span>
        <h2 className="font-medium text-4xl tracking-tight text-charcoal mb-4">Assistive Mode</h2>
        <p className="text-charcoal/70 text-sm md:text-base leading-relaxed">
          For adults and complex text. <span className="italic text-moss text-lg">Enhance comprehension</span>{' '}
          and reduce cognitive load with real-time semantic manipulation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* System Feedback Layer */}
        <div className="md:col-span-2 bg-gradient-to-r from-moss/10 to-transparent border-l-4 border-moss p-6 rounded-2xl flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-bottom flex-wrap md:flex-nowrap">
          <span className="iconify text-3xl text-moss mt-1 shrink-0" data-icon="solar:hand-stars-bold-duotone" />
          <div className="flex-1">
            <h3 className="font-bold text-moss text-xl mb-1">Welcome back!</h3>
            <p className="text-sm text-moss/70 leading-relaxed mb-4">
              I noticed you struggled with long sentences yesterday. Let's try breaking things down more simply today.
            </p>
            <div className="flex gap-3">
              <button onClick={onOpenSimplifier} className="px-4 py-2 bg-moss text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5">
                Open Simplifier
              </button>
              <button onClick={() => document.querySelector('a[href="#modes"]')?.click()} className="px-4 py-2 bg-white text-moss text-xs font-bold uppercase tracking-wider rounded-xl border border-moss/10 hover:bg-moss/5 transition-all">
                Practice Phonics
              </button>
            </div>
          </div>
        </div>

        {/* Card 0 — Demo Mode */}
        <div className="md:col-span-2 bg-clay text-white rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-clay/10 transition-all hover:scale-[1.01] group relative overflow-hidden">
          <div className="flex flex-col gap-2 relative z-10 text-left w-full">
            <span className="font-mono text-[10px] text-white/60 uppercase tracking-widest">Interactive Experience</span>
            <h3 className="font-medium text-3xl tracking-tight">Experience Neuroread</h3>
            <p className="text-white/70 text-base max-w-md leading-relaxed">Watch our AI tutor bridge the gap between complex medical jargon and clear understanding in real-time.</p>
          </div>
          <button 
            onClick={runDemo}
            className="shrink-0 px-10 py-4 rounded-2xl bg-white text-clay font-bold hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center gap-3 group-hover:bg-cream"
          >
            <span className="iconify text-xl" data-icon="solar:magic-stick-3-bold" />
            Try Live Demo
          </button>
          
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-black/5 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Smart Simplifier card */}
        <div
          onClick={onOpenSimplifier}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onOpenSimplifier();
          }}
          className="clickable-card border border-moss/5 rounded-[3rem] p-10 bg-white flex flex-col transition-all duration-500 hover:shadow-2xl hover:border-moss/20 group relative"
        >
          <div className="w-16 h-16 rounded-2xl bg-moss/5 flex items-center justify-center mb-8 border border-moss/5 group-hover:scale-110 transition-transform group-hover:bg-moss group-hover:text-white">
            <span className="iconify text-3xl" data-icon="solar:magic-stick-3-linear" />
          </div>
          <h3 className="font-medium text-2xl tracking-tight text-moss mb-4">Smart Simplifier</h3>
          <p className="text-sm text-text-muted leading-relaxed max-w-sm">
            Instantly translate dense professional text into clear, structured insights. Reduces cognitive strain for better long-form reading.
          </p>
          <div className="mt-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-clay group-hover:translate-x-2 transition-transform">
            Start Simplifying <span className="iconify" data-icon="solar:arrow-right-linear" />
          </div>
        </div>

        {/* Document Upload */}
        <div className="clickable-card border border-moss/10 rounded-[2rem] p-8 md:p-10 bg-white flex flex-col transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_-15px_rgba(46,64,54,0.15)] group relative">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div>
              <h3 className="font-medium text-2xl tracking-tight text-charcoal mb-2">Document Upload</h3>
              <p className="text-sm text-charcoal/60 leading-relaxed max-w-2xl">
                Upload a PDF, DOCX, or TXT. We'll extract text, simplify it, and compute cognitive load.
              </p>
            </div>
            <label className="px-6 py-3 rounded-full bg-moss text-cream text-xs font-medium uppercase tracking-wide cursor-pointer hover:scale-105 transition-transform">
              {uploadAsync.loading ? 'Uploading…' : 'Upload document'}
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                disabled={uploadAsync.loading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setDocError('');
                  setDocResult(null);
                  try {
                    const res = await uploadAsync.run(file);
                    setDocResult(res);
                  } catch (err) {
                    setDocError(err?.message || 'Failed to upload document.');
                  } finally {
                    e.target.value = '';
                  }
                }}
              />
            </label>
          </div>

          <div className="open-badge mt-4">
            <span className="iconify" data-icon="solar:arrow-right-linear" style={{ width: '.7rem', height: '.7rem' }} />
            Open Tool
          </div>

          {docError ? (
            <p className="mt-4 text-sm text-red-600">{docError}</p>
          ) : null}

          {docResult ? (
            <div className="mt-6 flex flex-col gap-6">
              <div className="rounded-2xl bg-moss/[0.03] border border-moss/10 p-5">
                <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-3">Simplified Document</p>
                <div className="text-sm text-charcoal/80 leading-relaxed whitespace-pre-wrap">
                  {docResult.simplified_text}
                </div>
              </div>
              <div className="rounded-2xl bg-white border border-moss/10 p-5">
                <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-3">Metrics</p>
                <div className="text-sm text-charcoal/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Cognitive load</span>
                    <span className="font-medium text-charcoal">{docResult?.metrics?.cognitive_load ?? '—'}</span>
                  </div>
                </div>

                {Array.isArray(docResult.keywords) && docResult.keywords.length ? (
                  <div className="mt-5">
                    <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-2">Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {docResult.keywords.map((k) => (
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
              </div>
            </div>
          ) : null}
        </div>

        {/* OCR Scan Text Module */}
        <div className="md:col-span-2 clickable-card border border-moss/10 rounded-[2rem] p-8 md:p-10 bg-white flex flex-col transition-all duration-300 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] group relative">
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-clay/5 flex items-center justify-center border border-clay/5 text-clay shrink-0">
                <span className="iconify text-3xl" data-icon="solar:camera-bold" />
              </div>
              <div>
                <h3 className="font-medium text-2xl tracking-tight text-charcoal mb-2">Live Text Scanner</h3>
                <p className="text-sm text-charcoal/60 leading-relaxed max-w-xl">
                  Use your camera to scan a page, or upload an image. We'll immediately extract the text and provide simplification and read-aloud options.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={cameraOpen ? stopCamera : startCamera}
                disabled={ocrLoading}
                className={`px-6 py-4 rounded-xl font-bold tracking-wide transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 ${cameraOpen ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-clay text-white hover:bg-clay/90 hover:scale-105 hover:shadow-lg'}`}
              >
                <span className="iconify text-xl" data-icon={cameraOpen ? "solar:close-circle-bold" : "solar:camera-line-duotone"} /> 
                {cameraOpen ? 'Cancel' : 'Open Camera'}
              </button>
              
              <input ref={fileInputRef} type="file" accept="image/*,.pdf,.docx,.txt" className="hidden" disabled={ocrLoading || uploadAsync.loading} onChange={handleFileChange} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading || uploadAsync.loading || cameraOpen}
                className="px-6 py-4 rounded-xl bg-moss/5 text-moss border border-moss/10 font-bold tracking-wide hover:bg-moss/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <span className="iconify text-xl" data-icon="solar:gallery-upload-bold-duotone" /> 
                Upload Image
              </button>
            </div>
          </div>

          {/* Camera Viewport */}
          {cameraOpen && (
            <div className="mt-8 bg-black rounded-[2rem] overflow-hidden relative w-full max-w-3xl mx-auto shadow-2xl animate-in fade-in zoom-in-95">
              <video ref={videoRef} autoPlay playsInline className="w-full h-80 object-cover opacity-80" />
              <div className="absolute inset-0 border-4 border-white/20 border-dashed m-12 rounded-xl pointer-events-none" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <button onClick={captureAndScan} className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_0_0_4px_rgba(255,255,255,0.4)] hover:scale-110 transition-transform text-charcoal">
                   <span className="iconify text-3xl" data-icon="solar:camera-minimalistic-bold" />
                </button>
              </div>
            </div>
          )}

          {/* Extracting State */}
          {ocrLoading && (
            <div className="mt-8 p-12 bg-moss/5 rounded-[2rem] border border-moss/10 flex flex-col items-center justify-center animate-pulse">
              <span className="iconify text-4xl text-moss mb-4 animate-spin" data-icon="solar:restart-bold" />
              <h4 className="text-xl font-bold text-moss">Extracting Text...</h4>
              <p className="text-sm text-moss/60 mt-2">Running layout analysis and language detection</p>
            </div>
          )}

          {/* Results Flow */}
          {docResult && !ocrLoading && (
            <div className="mt-8 border-t border-moss/10 pt-8 w-full animate-in slide-in-from-bottom-4">
              
              {/* Tab Header */}
              <div className="flex gap-2 p-1 bg-moss/5 rounded-2xl w-fit mb-6">
                <button onClick={() => setActiveTab('raw')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'raw' ? 'bg-white shadow-sm text-moss' : 'text-moss/60 hover:text-moss'}`}>Raw Text</button>
                <button onClick={() => setActiveTab('simplified')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'simplified' ? 'bg-white shadow-sm text-moss' : 'text-moss/60 hover:text-moss'}`}>Simplified</button>
                <button onClick={() => setActiveTab('audio')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex border border-transparent items-center gap-2 ${activeTab === 'audio' ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-sm' : 'text-moss/60 hover:text-orange-600'}`}>
                   <span className="iconify" data-icon="solar:music-note-3-bold" /> Audio & NLP
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'raw' && (
                <div className="bg-moss/5 border border-moss/10 rounded-2xl p-6">
                  <div className="text-sm text-charcoal/80 leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {renderHighlightedText(docResult.raw_text, docResult.keywords)}
                  </div>
                </div>
              )}

              {activeTab === 'simplified' && (
                <div className="bg-white border border-moss/20 shadow-inner rounded-2xl p-6 relative">
                  <span className="absolute top-4 right-4 text-[10px] font-bold text-moss/50 uppercase tracking-widest bg-moss/5 px-2 py-1 rounded">Optimized for Dyslexia</span>

                  {/* ── Accessibility-aware simplified text rendering ── */}
                  <div
                    style={{
                      fontFamily: accessibility.font === 'opendyslexic'
                        ? 'OpenDyslexic, sans-serif' : 'inherit',
                      fontSize: accessibility.fontSize,
                      lineHeight: accessibility.lineHeight,
                      letterSpacing: `${accessibility.letterSpacing}em`,
                      wordSpacing: `${accessibility.wordSpacing}em`,
                      maxHeight: '16rem',
                      overflowY: 'auto',
                    }}
                  >
                    {colorizeText(docResult.simplified_text || '')}
                  </div>

                  {/* Difficulty check UI */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button
                      onClick={() => checkDifficulty(docResult.simplified_text)}
                      disabled={checkingDifficulty}
                      style={{
                        fontSize: 13, padding: '6px 14px', borderRadius: 8,
                        background: '#2d6a4f', color: '#fff', border: 'none',
                        cursor: 'pointer', opacity: checkingDifficulty ? 0.6 : 1
                      }}
                    >
                      {checkingDifficulty ? 'Checking…' : 'Check difficulty'}
                    </button>
                    <button
                      onClick={() => startReadingAloud(docResult.simplified_text || '')}
                      style={{
                        fontSize: 13, padding: '6px 14px', borderRadius: 8,
                        background: '#E65100', color: '#fff', border: 'none', cursor: 'pointer'
                      }}
                    >
                      ▶ Read aloud
                    </button>
                  </div>

                  {difficultyResult && (
                    <div style={{
                      marginTop: 10, padding: '10px 14px', borderRadius: 10,
                      background: difficultyResult.should_simplify ? '#fff3e0' : '#e8f5e9',
                      border: `1px solid ${difficultyResult.should_simplify ? '#ffcc80' : '#a5d6a7'}`,
                      fontSize: 13,
                    }}>
                      <span style={{ fontWeight: 600 }}>{difficultyResult.grade_label}</span>
                      {' — '}
                      {difficultyResult.recommendation}
                      {difficultyResult.should_simplify && (
                        <span style={{ marginLeft: 8, color: '#e65100', fontWeight: 600 }}>
                          → Simplification recommended
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'audio' && (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 border border-orange-100 rounded-2xl p-8 text-center max-w-xl">
                  <h3 className="text-xl font-bold text-orange-900 mb-6">Audio Playback Console</h3>
                  
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <button onClick={stopSpeech} className="w-12 h-12 rounded-full bg-white text-orange-500 shadow-sm flex items-center justify-center hover:scale-105 transition-transform"><span className="iconify text-xl" data-icon="solar:stop-bold" /></button>
                    
                    {!isSpeaking ? (
                      <button onClick={() => speakText(docResult.simplified_text || docResult.raw_text)} className="w-16 h-16 rounded-full bg-orange-500 text-white shadow-md flex items-center justify-center hover:scale-105 transition-transform">
                        <span className="iconify text-3xl" data-icon="solar:play-bold" />
                      </button>
                    ) : (
                      <button onClick={pauseSpeech} className="w-16 h-16 rounded-full bg-orange-600 text-white shadow-md flex items-center justify-center hover:scale-105 transition-transform outline outline-4 outline-orange-500/30">
                        <span className="iconify text-3xl" data-icon="solar:pause-bold" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-orange-500/60 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" /> Using Native Web Speech Engine
                  </p>
                </div>
              )}

              {/* Action Flow Pipeline */}
              <div className="mt-6 flex flex-wrap gap-4 pt-6 border-t border-moss/10">
                <button 
                  onClick={() => {
                    onSetInputText(docResult.raw_text);
                    onOpenSimplifier();
                  }}
                  className="px-6 py-3 bg-moss text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:-translate-y-1 transition-all shadow-sm"
                >
                  <span className="iconify text-lg" data-icon="solar:magic-stick-3-bold" /> Further Simplify
                </button>
                <button 
                  onClick={() => setActiveTab('audio')}
                  className="px-6 py-3 bg-white border border-moss/20 text-moss rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-moss/5 transition-all"
                >
                  <span className="iconify text-lg" data-icon="solar:volume-loud-bold" /> Listen Aloud
                </button>
                <button 
                  onClick={() => alert(`Sending to Practice Mode...\nText: ${docResult.simplified_text?.slice(0,25)}...`)}
                  className="px-6 py-3 bg-white border border-moss/20 text-clay rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:border-clay/50 transition-all ml-auto"
                >
                  Create Practice Quiz <span className="iconify text-lg" data-icon="solar:arrow-right-linear" />
                </button>
              </div>

            </div>
          )}
        </div>


      </div>
    </div>
  );
}
