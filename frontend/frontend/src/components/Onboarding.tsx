import React, { useState } from 'react';

const DIFFICULTIES = ['Reading words aloud', 'Spelling', 'Understanding long texts', 'All of these'];

interface OnboardingProps {
  onComplete: (userAge: number) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [age, setAge] = useState(10);
  const [isParentTeacher, setIsParentTeacher] = useState(false);
  const [difficulties, setDifficulties] = useState<string[]>([]);

  function toggleDifficulty(d: string) {
    setDifficulties(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  }

  function getRecommendedMode(): { mode: string; label: string; reason: string } {
    const wantsReview = difficulties.includes('All of these');
    const wantsReading = difficulties.includes('Reading words aloud') || difficulties.includes('Spelling');
    const wantsUnderstanding = difficulties.includes('Understanding long texts');

    if (age <= 14) {
      // Barrier: Redirect younger users to Learning or Practice
      if (wantsReading || wantsReview) {
        return {
          mode: 'learning',
          label: 'Learning Mode',
          reason: 'Level up your reading skills with fun, guided exercises tailored to your age.',
        };
      }
      return {
        mode: 'practice',
        label: 'Practice Mode',
        reason: 'The best way to build confidence and master the words you find tricky.',
      };
    }

    if (age >= 15 && wantsUnderstanding) {
      return {
        mode: 'assistive',
        label: 'Assistive Mode',
        reason: 'Simplifies complex text and reads it aloud with word-by-word highlighting.',
      };
    }
    
    if (wantsReview) {
      return {
        mode: 'practice',
        label: 'Practice Mode',
        reason: 'Reviews skills that need reinforcement based on your schedule.',
      };
    }
    
    return {
      mode: 'learning',
      label: 'Learning Mode',
      reason: 'A great starting point for building core reading skills.',
    };
  }

  function handleComplete() {
    localStorage.setItem('neuroread-onboarding-done', 'true');
    localStorage.setItem('neuroread-user-age', String(isParentTeacher ? 30 : age));
    onComplete(isParentTeacher ? 30 : age);
  }

  const recommended = getRecommendedMode();

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: '#fff', borderRadius: 28, padding: 40, maxWidth: 600, width: '100%',
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
      }}>
        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1, 2].map(n => (
            <div key={n} style={{
              height: 4, flex: 1, borderRadius: 4,
              background: n <= (step === 3 ? 2 : 1) ? '#2E4036' : '#e0e0e0',
              transition: 'background 0.3s ease',
            }} />
          ))}
        </div>

        {/* ── STEP 1: Age & Difficulty ─────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 style={{ margin: '8px 0 8px', fontSize: 24, fontWeight: 700, color: '#2E4036' }}>
              Let's set up your reading preferences
            </h2>
            <p style={{ color: '#666', marginBottom: 32 }}>
              This takes about 2 minutes and helps us personalise your experience.
            </p>

            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, color: '#2E4036' }}>
              How old are you? {!isParentTeacher && <span style={{ color: '#2d6a4f' }}>{age}</span>}
            </label>
            {!isParentTeacher && (
              <input
                type="range" min={5} max={80} value={age}
                onChange={e => setAge(Number(e.target.value))}
                style={{ width: '100%', marginBottom: 12, accentColor: '#2d6a4f' }}
              />
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isParentTeacher}
                onChange={e => setIsParentTeacher(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#2d6a4f' }}
              />
              <span style={{ color: '#666', fontSize: 14 }}>I'm a parent or teacher</span>
            </label>

            <label style={{ display: 'block', fontWeight: 600, marginBottom: 12, color: '#2E4036' }}>
              What's hardest for you? <span style={{ fontWeight: 400, color: '#999' }}>(select all that apply)</span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => toggleDifficulty(d)}
                  style={{
                    padding: '12px 16px', borderRadius: 12, textAlign: 'left',
                    border: difficulties.includes(d) ? '2px solid #2d6a4f' : '2px solid #e0e0e0',
                    background: difficulties.includes(d) ? 'rgba(45,106,79,0.06)' : '#fff',
                    cursor: 'pointer', fontWeight: difficulties.includes(d) ? 600 : 400,
                    color: difficulties.includes(d) ? '#2d6a4f' : '#444',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {difficulties.includes(d) ? '✓ ' : ''}{d}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(3)}
              style={{
                width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                background: '#2E4036', color: '#fff', fontSize: 16, fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Next
            </button>
          </div>
        )}



        {/* ── STEP 3: Mode Recommendation ──────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ margin: '8px 0 8px', fontSize: 24, fontWeight: 700, color: '#2E4036' }}>
              You're ready!
            </h2>
            <p style={{ color: '#666', marginBottom: 24 }}>
              Based on your profile, we recommend starting with:
            </p>

            <div style={{
              padding: 24, borderRadius: 16, marginBottom: 28,
              background: 'rgba(45,106,79,0.06)', border: '2px solid #2d6a4f',
            }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>
                {recommended.mode === 'learning' ? '📖' : recommended.mode === 'assistive' ? '🔍' : '🔁'}
              </div>
              <h3 style={{ margin: '8px 0 8px', fontSize: 20, fontWeight: 700, color: '#2E4036' }}>
                {recommended.label}
              </h3>
              <p style={{ margin: 0, color: '#555', lineHeight: 1.6 }}>
                {recommended.reason}
              </p>
            </div>

            <p style={{ color: '#888', fontSize: 13, marginBottom: 24 }}>
              You can switch between modes anytime from the navigation bar.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1, padding: 14, borderRadius: 14, border: '2px solid #e0e0e0',
                  background: '#fff', color: '#666', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                style={{
                  flex: 2, padding: '16px', borderRadius: 16, border: 'none',
                  background: '#2E4036',
                  color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(46,64,54,0.2)',
                  letterSpacing: '0.02em',
                }}
              >
                Let's go
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
