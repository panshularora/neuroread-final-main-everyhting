import { useState, useRef } from 'react';
import { Square, Volume2 } from 'lucide-react';
import { BASE_URL, fetchTTSAudio } from '../services/api';

const ttsCache = new Map<string, string>();

interface AudioButtonProps {
  /** A ready audio file; paths starting with / are served by the backend. */
  src?: string;
  /** Text to synthesise when there is no src. */
  text?: string;
  className?: string;
}

export default function AudioButton({ src, text, className = '' }: AudioButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const performPlay = async () => {
    if (isLoading) return;
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      return;
    }

    let targetUrl = src?.startsWith('/') ? `${BASE_URL}${src}` : src;

    if (text && !targetUrl) {
      setIsLoading(true);
      try {
        if (!ttsCache.has(text)) {
          const blob = await fetchTTSAudio(text);
          ttsCache.set(text, URL.createObjectURL(blob));
        }
        targetUrl = ttsCache.get(text);
      } catch {
        setIsLoading(false);
        // Fall back to the browser's own voice when the server can't make audio.
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.85;
          utterance.onstart = () => setIsPlaying(true);
          utterance.onend = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setFailed(true);
        }
        return;
      }
      setIsLoading(false);
    }

    if (!targetUrl) return;

    try {
      const audio = new Audio(targetUrl);
      audioRef.current = audio;
      
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onerror = () => setIsPlaying(false);
      
      await audio.play();
    } catch {
      setIsPlaying(false);
      setFailed(true);
    }
  };

  if (!src && !text) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setFailed(false);
        performPlay();
      }}
      type="button"
      disabled={isLoading}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
        isPlaying ? 'border-accent bg-accent text-white' : 'border-line bg-surface text-primary hover:bg-primary/10'
      } ${isLoading ? 'cursor-wait opacity-60' : ''} ${className}`}
      aria-label={failed ? 'Audio unavailable, try again' : isPlaying ? 'Stop audio' : text ? `Listen: ${text}` : 'Play audio'}
      title={failed ? 'Audio is unavailable right now' : 'Play audio'}
    >
      {isLoading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : isPlaying ? (
        <Square className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Volume2 className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
