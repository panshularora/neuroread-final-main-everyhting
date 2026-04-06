import React, { useState, useEffect, useRef } from 'react';
import SkillBar from './SkillBar';

interface Skill {
  name: string;
  display_name: string;
  p_know: number;
  mastered: boolean;
}

interface BKTParams {
  p_transit: number;
  p_slip: number;
  p_guess: number;
}

interface SkillUpdate {
  skill_name: string;
  p_know_before: number;
  p_know_after: number;
  mastered: boolean;
  delta: number;
  bkt_params?: BKTParams;
}

interface IRTUpdate {
  ability_before: number;
  ability_after: number;
  zpd_zone: string;
  zpd_label: string;
}

interface SM2Update {
  next_review_days: number;
  next_review_label: string;
  easiness_factor: number;
}

interface BKTLiveDisplayProps {
  skills: Skill[];
  lastSkillUpdate?: SkillUpdate | null;
  lastIRTUpdate?: IRTUpdate | null;
  lastSM2Update?: SM2Update | null;
  sessionId?: string;
}

export default function BKTLiveDisplay({
  skills,
  lastSkillUpdate,
  lastIRTUpdate,
  lastSM2Update,
  sessionId,
}: BKTLiveDisplayProps) {
  const [judgeMode, setJudgeMode] = useState(false);
  const [keysPressed, setKeysPressed] = useState<Set<string>>(new Set());
  const prevSkillRef = useRef<Record<string, number>>({});

  // J+K shortcut for judge mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const newKeys = new Set(keysPressed);
      newKeys.add(e.key.toLowerCase());
      setKeysPressed(newKeys);

      if (newKeys.has('j') && newKeys.has('k')) {
        setJudgeMode((prev) => !prev);
        setKeysPressed(new Set());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const newKeys = new Set(keysPressed);
      newKeys.delete(e.key.toLowerCase());
      setKeysPressed(newKeys);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keysPressed]);

  // Track skill deltas
  const skillDeltas: Record<string, number> = {};
  if (lastSkillUpdate) {
    skillDeltas[lastSkillUpdate.skill_name] =
      lastSkillUpdate.p_know_after - lastSkillUpdate.p_know_before;
  }

  const zpdColors: Record<string, string> = {
    too_easy: '#4CAF50',
    zone_of_proximal_development: '#2196F3',
    too_hard: '#F44336',
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      border: '1px solid rgba(0,0,0,0.07)',
      padding: 20,
      position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#2E4036' }}>
            🧠 Live Skill Tracker
          </h3>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: '#999' }}>
            Bayesian Knowledge Tracing • Updates in real-time
          </p>
        </div>
        {judgeMode && (
          <span style={{
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.12em', padding: '3px 8px', borderRadius: 6,
            background: '#FF1744', color: '#fff',
          }}>
            JUDGE MODE
          </span>
        )}
      </div>

      {/* BKT update flash when last update arrives */}
      {lastSkillUpdate && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: 'rgba(33,150,243,0.06)', border: '1px solid rgba(33,150,243,0.2)',
          fontSize: 13,
        }}>
          <span style={{ fontWeight: 600, color: '#1565C0' }}>
            P(know) updated:
          </span>{' '}
          <span style={{ color: '#444' }}>
            {(lastSkillUpdate.p_know_before * 100).toFixed(1)}%
            {' → '}
            <span style={{ color: lastSkillUpdate.delta > 0 ? '#4CAF50' : '#F44336', fontWeight: 700 }}>
              {(lastSkillUpdate.p_know_after * 100).toFixed(1)}%
            </span>
          </span>
          {lastSkillUpdate.bkt_params && (
            <span style={{ color: '#999', fontSize: 11, marginLeft: 8 }}>
              after {lastSkillUpdate.delta >= 0 ? 'correct' : 'incorrect'} answer
            </span>
          )}
        </div>
      )}

      {/* Skill bars */}
      <div>
        {skills.map((skill) => (
          <SkillBar
            key={skill.name}
            skillName={skill.display_name || skill.name}
            pKnow={skill.p_know}
            mastered={skill.mastered}
            delta={skillDeltas[skill.name]}
          />
        ))}
        {skills.length === 0 && (
          <p style={{ color: '#bbb', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
            Answer exercises to see skill progress here.
          </p>
        )}
      </div>

      {/* Judge Mode Panel */}
      {judgeMode && (
        <div style={{
          marginTop: 16,
          padding: 16,
          background: '#0D1117',
          borderRadius: 14,
          color: '#00FF88',
          fontFamily: 'monospace',
          fontSize: 12,
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#FF1744' }}>
            ⚡ JUDGE MODE — RAW ML STATE
          </p>

          {/* BKT parameters */}
          {lastSkillUpdate?.bkt_params && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ color: '#FFD700', margin: '0 0 4px', fontWeight: 600 }}>BKT Parameters:</p>
              <pre style={{ margin: 0, color: '#00FF88', fontSize: 11 }}>
{JSON.stringify({
  P_transit: lastSkillUpdate.bkt_params.p_transit,
  P_slip: lastSkillUpdate.bkt_params.p_slip,
  P_guess: lastSkillUpdate.bkt_params.p_guess,
}, null, 2)}
              </pre>
            </div>
          )}

          {/* IRT state */}
          {lastIRTUpdate && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ color: '#FFD700', margin: '0 0 4px', fontWeight: 600 }}>IRT Ability:</p>
              <div>
                <span style={{ color: '#aaa' }}>θ: </span>
                <span style={{ color: '#00FF88' }}>
                  {lastIRTUpdate.ability_before.toFixed(3)} → {lastIRTUpdate.ability_after.toFixed(3)}
                </span>
              </div>
              <div>
                <span style={{ color: '#aaa' }}>ZPD Zone: </span>
                <span style={{ color: zpdColors[lastIRTUpdate.zpd_zone] || '#fff' }}>
                  {lastIRTUpdate.zpd_label}
                </span>
              </div>
            </div>
          )}

          {/* SM-2 schedule */}
          {lastSM2Update && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ color: '#FFD700', margin: '0 0 4px', fontWeight: 600 }}>SM-2 Schedule:</p>
              <pre style={{ margin: 0, color: '#00FF88', fontSize: 11 }}>
{JSON.stringify({
  next_review: lastSM2Update.next_review_label,
  interval_days: lastSM2Update.next_review_days,
  easiness_factor: lastSM2Update.easiness_factor,
}, null, 2)}
              </pre>
            </div>
          )}

          {/* Skills JSON */}
          <div>
            <p style={{ color: '#FFD700', margin: '0 0 4px', fontWeight: 600 }}>BKT State (all skills):</p>
            <pre style={{ margin: 0, color: '#00FF88', fontSize: 10, maxHeight: 200, overflowY: 'auto' }}>
{JSON.stringify(
  Object.fromEntries(skills.map(s => [s.name, { p_know: s.p_know, mastered: s.mastered }])),
  null, 2
)}
            </pre>
          </div>

          <p style={{ margin: '12px 0 0', color: '#666', fontSize: 10 }}>
            Press J+K again to close • Session: {sessionId || 'none'}
          </p>
        </div>
      )}

      {/* Hint to activate judge mode */}
      {!judgeMode && (
        <p style={{ textAlign: 'center', fontSize: 10, color: '#ccc', marginTop: 12 }}>
          Press J+K for Judge Mode
        </p>
      )}
    </div>
  );
}
