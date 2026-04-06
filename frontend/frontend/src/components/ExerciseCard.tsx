import React, { useState, useRef } from 'react';
import { useAccessibilityStore } from '../stores/accessibilityStore';

// Phoneme colors matching backend
const PHONEME_COLORS: Record<string, string | null> = {
  b: '#4A90D9',
  d: '#E8734A',
  p: '#9B59B6',
  q: '#27AE60',
  n: null,
  u: null,
};

interface Token { char: string; color: string | null }
interface WordAnnotation { word: string; tokens: Token[] }

function colorizeWord(word: string, coloredLetters: boolean): React.ReactNode {
  if (!coloredLetters) return word;
  return word.split('').map((char, i) => {
    const color = PHONEME_COLORS[char.toLowerCase()] ?? null;
    return color
      ? <span key={i} style={{ color, fontWeight: 700 }}>{char}</span>
      : <span key={i}>{char}</span>;
  });
}

interface ExerciseCardProps {
  exercise: {
    id: string;
    type: 'phonics' | 'spelling' | 'comprehension' | 'matching';
    prompt: string;
    options: string[];
    correct_answer: string;
    difficulty: number;
    target_skill: string;
    hint: string;
  };
  onAnswer: (answer: string) => void;
  disabled: boolean;
  feedback?: 'correct' | 'incorrect' | null;
}

export default function ExerciseCard({ exercise, onAnswer, disabled, feedback }: ExerciseCardProps) {
  const [showHint, setShowHint] = useState(false);
  const [spellingInput, setSpellingInput] = useState('');
  const accessibility = useAccessibilityStore();

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 24,
    padding: 32,
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    border: feedback === 'correct'
      ? '2px solid #4CAF50'
      : feedback === 'incorrect'
      ? '2px solid #FF9800'
      : '2px solid rgba(0,0,0,0.05)',
    fontFamily: accessibility.font === 'opendyslexic'
      ? 'OpenDyslexic, sans-serif'
      : accessibility.font === 'arial'
      ? 'Arial, sans-serif'
      : 'inherit',
    fontSize: `${accessibility.fontSize}px`,
    lineHeight: accessibility.lineHeight,
    letterSpacing: `${accessibility.letterSpacing}em`,
    animation: feedback === 'correct'
      ? 'correctPulse 0.6s ease'
      : feedback === 'incorrect'
      ? 'gentleShake 0.5s ease'
      : 'none',
    maxWidth: 600,
  };

  function speakWord(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = accessibility.ttsSpeed;
      window.speechSynthesis.speak(utterance);
    }
  }

  function renderPrompt() {
    if (!exercise.prompt) return null;
    // Render with phoneme coloring if enabled
    if (accessibility.coloredLetters) {
      const words = exercise.prompt.split(' ');
      return (
        <p className="a11y-text-content" style={{ fontSize: 'inherit', marginBottom: 24, fontWeight: 500, lineHeight: 1.7 }}>
          {words.map((w, i) => (
            <span key={i}>{colorizeWord(w, true)}{i < words.length - 1 ? ' ' : ''}</span>
          ))}
        </p>
      );
    }
    return <p style={{ marginBottom: 24, fontWeight: 500, lineHeight: 1.7 }}>{exercise.prompt}</p>;
  }

  function renderMultipleChoice() {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: exercise.options.length <= 2 ? '1fr 1fr' : '1fr 1fr', gap: 12 }}>
        {exercise.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !disabled && onAnswer(opt)}
            disabled={disabled}
            style={{
              padding: '16px 20px',
              borderRadius: 14,
              border: '2px solid rgba(46,64,54,0.1)',
              background: '#f9f9f9',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontSize: '1em',
              fontWeight: 600,
              fontFamily: 'inherit',
              letterSpacing: 'inherit',
              transition: 'all 0.15s ease',
              color: '#2E4036',
            }}
            onMouseEnter={(e) => {
              if (!disabled) (e.currentTarget as HTMLButtonElement).style.background = '#e8f5e9';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#f9f9f9';
            }}
          >
            {accessibility.coloredLetters ? colorizeWord(opt, true) : opt}
          </button>
        ))}
      </div>
    );
  }

  function renderSpelling() {
    return (
      <div>
        {/* Audio play button */}
        <button
          onClick={() => speakWord(exercise.correct_answer)}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 20px', borderRadius: 14, border: 'none',
            background: '#E65100', color: '#fff', cursor: 'pointer',
            fontSize: '1em', fontWeight: 700, fontFamily: 'inherit',
            marginBottom: 16,
          }}
        >
          🔊 Hear the word
        </button>
        <input
          type="text"
          placeholder="Type the word here..."
          value={spellingInput}
          onChange={(e) => setSpellingInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && spellingInput.trim() && !disabled) {
              onAnswer(spellingInput.trim());
            }
          }}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '14px 18px',
            borderRadius: 14,
            border: '2px solid rgba(46,64,54,0.15)',
            fontSize: '1.1em',
            fontFamily: 'inherit',
            letterSpacing: '0.05em',
            outline: 'none',
            marginBottom: 12,
          }}
        />
        <button
          onClick={() => { if (spellingInput.trim() && !disabled) { onAnswer(spellingInput.trim()); setSpellingInput(''); } }}
          disabled={disabled || !spellingInput.trim()}
          style={{
            padding: '12px 28px', borderRadius: 14, border: 'none',
            background: '#2d6a4f', color: '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '1em', fontWeight: 700, fontFamily: 'inherit',
            opacity: disabled || !spellingInput.trim() ? 0.5 : 1,
          }}
        >
          Submit →
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      {/* Skill badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.1em', color: '#2d6a4f',
          background: 'rgba(45,106,79,0.08)', padding: '4px 10px', borderRadius: 20,
        }}>
          {(exercise.target_skill || '').replace(/_/g, ' ')}
        </span>
        <span style={{
          fontSize: 11, color: '#999', fontWeight: 600,
        }}>
          Difficulty: {Math.round(exercise.difficulty * 100)}%
        </span>
      </div>

      {/* Feedback banner */}
      {feedback === 'correct' && (
        <div style={{
          padding: '10px 16px', borderRadius: 10, background: 'rgba(76,175,80,0.1)',
          border: '1px solid #4CAF50', color: '#2e7d32', fontWeight: 600,
          marginBottom: 16, fontSize: '0.95em',
        }}>
          ✓ Correct! Well done! 🎉
        </div>
      )}
      {feedback === 'incorrect' && (
        <div style={{
          padding: '10px 16px', borderRadius: 10, background: 'rgba(255,152,0,0.08)',
          border: '1px solid #FF9800', color: '#e65100', fontWeight: 600,
          marginBottom: 16, fontSize: '0.95em',
        }}>
          Not quite — take another look and try again!
        </div>
      )}

      {/* Exercise prompt */}
      {exercise.type === 'comprehension' ? (
        <div>
          <div style={{ background: '#f5f5f5', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <p style={{ fontSize: '0.95em', lineHeight: 1.8, color: '#444', fontFamily: 'inherit' }}>
              {exercise.prompt.split('\n\n')[0]}
            </p>
          </div>
          <p style={{ fontWeight: 600, marginBottom: 20 }}>
            {exercise.prompt.split('\n\n')[1] || exercise.prompt}
          </p>
        </div>
      ) : (
        renderPrompt()
      )}

      {/* Exercise body */}
      {(exercise.type === 'phonics' || exercise.type === 'comprehension' || exercise.type === 'matching') && exercise.options.length > 0
        ? renderMultipleChoice()
        : exercise.type === 'spelling'
        ? renderSpelling()
        : null
      }

      {/* Hint */}
      <div style={{ marginTop: 16 }}>
        <button
          onClick={() => setShowHint(h => !h)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#999', fontSize: '0.85em', fontWeight: 600,
          }}
        >
          {showHint ? '▾ Hide hint' : '💡 Need a hint?'}
        </button>
        {showHint && (
          <div style={{
            marginTop: 8, padding: '10px 14px', borderRadius: 10,
            background: 'rgba(255,193,7,0.1)', border: '1px solid rgba(255,193,7,0.3)',
            fontSize: '0.9em', color: '#795548', lineHeight: 1.6,
          }}>
            {exercise.hint}
          </div>
        )}
      </div>
    </div>
  );
}
