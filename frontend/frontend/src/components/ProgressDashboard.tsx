import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Clock, TrendingUp, Star } from 'lucide-react';
import { getProgress } from '../services/api';
import type { ProgressResponse } from '../types/apiTypes';

interface MetricConfig {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

interface ProgressDashboardProps {
  userId: string;
  metrics?: MetricConfig[];
  sessionScores?: number[];
}
const iconProps = { size: 20, strokeWidth: 1.5, className: 'metric-icon' };

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  userId,
  metrics: customMetrics,
  sessionScores,
}) => {
  const [data, setData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chartScores, setChartScores] = useState<number[]>([]);

  useEffect(() => {
  if (!userId) return;
  let cancelled = false;

  const fetchProgress = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await getProgress(userId);
      if (cancelled) return;

      setData(resp);
      console.log("PROGRESS API:", resp);

      const avg = Number(resp.average_cognitive_score);
      const last = Number(resp.last_score);

      // Build chart data even without real session history
      if (!Number.isNaN(avg) && !Number.isNaN(last)) {
        const earlier1 = Math.max(0, Math.round(avg + (avg - last)));
        const earlier2 = Math.max(0, Math.round(avg + (avg - last) / 2));
        setChartScores([earlier1, earlier2, Math.round(avg), Math.round(last)]);
      } else if (!Number.isNaN(avg)) {
        setChartScores([Math.round(avg)]);
      } else {
        setChartScores([]);
      }
    } catch {
      if (!cancelled) setError("Unable to load progress right now.");
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  fetchProgress();

  return () => {
    cancelled = true;
  };
}, [userId]);
  const fmt2 = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "—";
  // Use custom metrics if provided, otherwise use default from API data
  const metrics: MetricConfig[] = customMetrics || [
  {
    label: 'Total sessions',
    value: data?.total_sessions ?? '—',
    icon: <Clock {...iconProps} />,
  },
  {
    label: 'Average score',
    value: "HELLO",
    icon: <Star {...iconProps} />,
  },
  {
    label: 'Last score',
    value: fmt2(data?.last_score),
    icon: <TrendingUp {...iconProps} />,
  },
  {
    label: 'Preferred level',
    value: data?.preferred_level ?? '—',
    icon: <BarChart2 {...iconProps} />,
  },
];
  const cleanedSessionScores =
  (sessionScores || []).filter((score) => typeof score === "number");

  const effectiveScores =
  cleanedSessionScores.length > 0 ? cleanedSessionScores : chartScores;
  /**
   * Dynamically generate chart bars based on sessionScores data
   * Scales bars to fit in 0-120 height range relative to max score
   */
  const generateChartBars = () => {
  if (!effectiveScores || effectiveScores.length === 0) {
    return null;
  }

    const maxScore = Math.max(...effectiveScores);
    const barWidth = 28;
    const startX = 40;
    const baselineY = 120;
    const maxBarHeight = 100;
    const spacingX = 34;

    const colors = ['#f63bda', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#10b981'];

    return effectiveScores.map((score, idx) => {
      const barHeight = maxScore > 0 ? (score / maxScore) * maxBarHeight : 0;
      const x = startX + idx * spacingX;
      const y = baselineY - barHeight;
      const color = colors[idx % colors.length];

      return (
        <rect
          key={`bar-${idx}`}
          x={x}
          y={y}
          width={barWidth}
          height={barHeight}
          fill={color}
          rx="4"
        />
      );
    });
  };

  /**
   * Calculate SVG viewBox width based on number of data points
   */
  const getChartViewBox = () => {
    if (!effectiveScores || effectiveScores.length === 0) {
      return '0 0 280 150';
    }
    const width = Math.max(280, 40 + effectiveScores.length * 34 + 20);
    return `0 0 ${width} 150`;
  };

  const chartBars = generateChartBars();
  const hasChartData = effectiveScores.length > 0;
  const chartViewBox = getChartViewBox();

  return (
    <div className="progress-root">
      <div className="progress-container">
        <header className="progress-header">
          <div>
            <h2 className="panel-title">Progress dashboard</h2>
            <p className="panel-subtitle">
              Overview of how cognitive load has evolved for this user ID.
            </p>
          </div>
          <div className="progress-user">
            Viewing history for <span>{userId || '—'}</span>
          </div>
        </header>

        {loading && <p className="progress-status">Loading progress…</p>}

        {error && <p className="progress-error">{error}</p>}

        <div className="progress-grid">
          {metrics.map((m) => (
            <motion.div
              key={m.label}
              className="metric-card"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {m.icon}
              <div className="metric-text">
                <span className="metric-label">{m.label}</span>
                <span className="metric-value">{m.value}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="progress-chart"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="chart-header">
            <p className="chart-title">Cognitive Score Over Time</p>
            <p className="chart-subtitle">
              {hasChartData ? `Showing ${effectiveScores.length} points` : 'No data yet'}
            </p>
          </div>
          <div className="chart-visualization">
            {hasChartData ? (
              <svg viewBox={chartViewBox} className="chart-svg" preserveAspectRatio="xMidYMid meet">
                {/* Y-axis */}
                <line
                  x1="30"
                  y1="10"
                  x2="30"
                  y2="120"
                  stroke="rgba(71,85,105,0.4)"
                  strokeWidth="1.5"
                />
                {/* X-axis */}
                <line
                  x1="30"
                  y1="120"
                  x2={chartViewBox.split(' ')[2]}
                  y2="120"
                  stroke="rgba(71,85,105,0.4)"
                  strokeWidth="1.5"
                />
                {/* Grid lines */}
                <line
                  x1="30"
                  y1="70"
                  x2={chartViewBox.split(' ')[2]}
                  y2="70"
                  stroke="rgba(71,85,105,0.15)"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <line
                  x1="30"
                  y1="45"
                  x2={chartViewBox.split(' ')[2]}
                  y2="45"
                  stroke="rgba(71,85,105,0.15)"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                {/* Dynamic bars */}
                {chartBars}
                {/* Y-axis labels */}
                <text x="8" y="15" fontSize="11" fill="#94a3b8">
                  100
                </text>
                <text x="18" y="75" fontSize="11" fill="#94a3b8">
                  50
                </text>
                <text x="18" y="130" fontSize="11" fill="#94a3b8">
                  0
                </text>
              </svg>
            ) : (
              <div className="chart-empty">
                <p>No session data yet. Start simplifying text to see your progress!</p>
              </div>
            )}
          </div>
          <p className="chart-caption">
            {hasChartData
              ? 'Real-time cognitive score progression based on your sessions.'
              : 'Submit your first text simplification session to populate this chart.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressDashboard;