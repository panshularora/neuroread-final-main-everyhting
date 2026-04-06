import React from 'react';

interface SkillBarProps {
  skillName: string;
  pKnow: number;       // 0.0 – 1.0
  mastered: boolean;
  delta?: number;      // optional change (positive = improvement)
}

export default function SkillBar({ skillName, pKnow, mastered, delta }: SkillBarProps) {
  const pct = Math.round(pKnow * 100);

  // Color gradient: low → #FFB347 (amber), high → #4CAF50 (green)
  function barColor(p: number) {
    if (p >= 0.85) return '#4CAF50';  // mastered green
    if (p >= 0.6)  return '#8BC34A';  // good light green
    if (p >= 0.4)  return '#FFC107';  // okay amber
    return '#FFB347';                  // low orange
  }

  const displayName = (skillName || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="skill-bar-container" style={{
      marginBottom: 12,
      padding: '10px 14px',
      background: mastered ? 'rgba(76,175,80,0.06)' : 'rgba(0,0,0,0.02)',
      borderRadius: 12,
      border: mastered ? '1px solid rgba(76,175,80,0.2)' : '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#2E4036' }}>
          {displayName}
          {mastered && <span style={{ marginLeft: 6 }} title="Mastered!">⭐</span>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {delta !== undefined && delta > 0.001 && (
            <span
              className="skill-delta-animation"
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#4CAF50',
                background: 'rgba(76,175,80,0.12)',
                padding: '2px 7px',
                borderRadius: 20,
                animation: 'deltaFadeIn 0.5s ease',
              }}
            >
              +{Math.round(delta * 100)}%
            </span>
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: barColor(pKnow) }}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 8,
        background: 'rgba(0,0,0,0.07)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, #FFB347, ${barColor(pKnow)})`,
            borderRadius: 8,
            transition: 'width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>

      {mastered && (
        <div style={{ marginTop: 4, fontSize: 11, color: '#4CAF50', fontWeight: 600 }}>
          ✓ Mastered
        </div>
      )}
    </div>
  );
}
