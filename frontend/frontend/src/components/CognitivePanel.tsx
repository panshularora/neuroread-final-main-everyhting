import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BarChart2, Zap, Lightbulb } from 'lucide-react';
import type { SimplifyResponse } from '../types/apiTypes';

interface CognitivePanelProps {
  result: SimplifyResponse | null;
}

const getIntensityColor = (score: number | null) => {
  if (score === null) return '#6b7280';
  if (score < 34) return '#10b981';
  if (score < 67) return '#f59e0b';
  return '#ef4444';
};

const getIntensityLabel = (score: number | null) => {
  if (score === null) return 'Pending';
  if (score < 34) return 'Low';
  if (score < 67) return 'Medium';
  return 'High';
};

const CognitivePanel: React.FC<CognitivePanelProps> = ({ result }) => {
  const score = result?.cognitive_score ?? null;
  const width = score !== null ? `${Math.min(Math.max(score, 0), 100)}%` : '0%';
  const intensity = getIntensityLabel(score);

  return (
    <div className="cog-root" aria-label="Cognitive overview">
      <div className="cog-container">
        <div className="cog-header">
          <div className="cog-header-content">
            <h2 className="cog-title">Cognitive Load Overview</h2>
          
          </div>
        </div>

        <div className="cog-score-section">
          <div className="score-box">
            <div className="score-label-wrapper">
              <span className="score-label">Cognitive Score</span>
              <span className="score-intensity" data-intensity={intensity}>
                {intensity}
              </span>
            </div>
            <div className="score-display">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={score ?? 'no-score'}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="score-number"
                >
                  {score !== null ? score : '–'}
                </motion.span>
              </AnimatePresence>
              <span className="score-max">/ 100</span>
            </div>
          </div>

          <div className="metrics-row">
            <div className="metric-card">
              <Clock size={20} className="metric-icon" />
              <div className="metric-content">
                <span className="metric-label">Reading Time</span>
                <span className="metric-value">
                  {result ? `${result.reading_time} min` : '—'}
                </span>
              </div>
            </div>
            <div className="metric-card">
              <BarChart2 size={20} className="metric-icon" />
              <div className="metric-content">
                <span className="metric-label">Difficulty</span>
                <span className="metric-value">{result ? result.difficulty : '—'}</span>
              </div>
            </div>
            <div className="metric-card">
              <Zap size={20} className="metric-icon" />
              <div className="metric-content">
                <span className="metric-label">Reduction</span>
                <span className="metric-value">
                  {result ? `${result.reduction_percent}%` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="cog-progress-section">
          <div className="progress-track-label">
            <span className="progress-label">Cognitive Load Intensity</span>
            <motion.span
              className="progress-percentage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              {score !== null ? `${score}%` : '—'}
            </motion.span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill"
              style={{
                backgroundColor: getIntensityColor(score),
              }}
              initial={{ width: 0 }}
              animate={{ width }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              layoutId="progressBar"
            />
          </div>
        </div>

        <div className="cog-impact-section">
          <div className="impact-header">
            <Lightbulb size={20} className="impact-icon" />
            <h3 className="impact-title">Impact Summary</h3>
          </div>
          <p className="impact-body">
            {result
              ? result.impact_summary
              : 'Run an analysis to view cognitive impact.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CognitivePanel;

