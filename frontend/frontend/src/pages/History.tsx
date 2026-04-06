import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Volume2 } from 'lucide-react';

interface Session {
  id: number;
  date: string;
  scoreBefore: number;
  scoreAfter: number;
  difficultyBefore: string;
  difficultyAfter: string;
  original: string;
  simplified: string;
  audioUrl?: string;
}

const sampleData: Session[] = [
  {
    id: 1,
    date: 'Feb 27',
    scoreBefore: 78,
    scoreAfter: 42,
    difficultyBefore: 'High',
    difficultyAfter: 'Moderate',
    original: 'The complex paragraph contained multiple clauses and advanced vocabulary that made comprehension difficult.',
    simplified: 'The paragraph had many clauses and hard words that were hard to understand.',
    audioUrl: undefined,
  },
  {
    id: 2,
    date: 'Feb 26',
    scoreBefore: 65,
    scoreAfter: 35,
    difficultyBefore: 'Moderate',
    difficultyAfter: 'Low',
    original: 'This is another example of a somewhat challenging sentence structure.',
    simplified: 'This is a simpler sentence structure example.',
    audioUrl: undefined,
  },
  {
  id: 3,
  date: 'Feb 28',
  scoreBefore: 82,
  scoreAfter: 46,
  difficultyBefore: 'High',
  difficultyAfter: 'Moderate',
  original: 'The scientific article utilized complex terminology and layered explanations that made it challenging for new readers.',
  simplified: 'The article used difficult words and detailed explanations that were hard for new readers.',
  audioUrl: undefined,
},
{
  id: 4,
  date: 'Feb 28',
  scoreBefore: 74,
  scoreAfter: 39,
  difficultyBefore: 'High',
  difficultyAfter: 'Moderate',
  original: 'Understanding advanced programming concepts often requires familiarity with multiple abstract ideas and technical vocabulary.',
  simplified: 'Learning advanced programming needs knowledge of many ideas and technical words.',
  audioUrl: undefined,
},
{
  id: 5,
  date: 'Feb 28',
  scoreBefore: 69,
  scoreAfter: 34,
  difficultyBefore: 'Moderate',
  difficultyAfter: 'Low',
  original: 'The instructions contained several complicated sentences that made it difficult to quickly understand the process.',
  simplified: 'The instructions had complex sentences that made the process hard to understand quickly.',
  audioUrl: undefined,
},
{
  id: 6,
  date: 'Feb 28',
  scoreBefore: 71,
  scoreAfter: 37,
  difficultyBefore: 'Moderate',
  difficultyAfter: 'Low',
  original: 'Many students struggle when reading long paragraphs filled with unfamiliar vocabulary.',
  simplified: 'Students find it hard to read long paragraphs with unfamiliar words.',
  audioUrl: undefined,
},
{
  id: 7,
  date: 'Feb 28',
  scoreBefore: 76,
  scoreAfter: 41,
  difficultyBefore: 'High',
  difficultyAfter: 'Moderate',
  original: 'The historical passage described events using dense narrative and complex sentence structures.',
  simplified: 'The history passage used dense writing and complex sentences.',
  audioUrl: undefined,
}
];

const History: React.FC = () => {
  const [sessions] = useState<Session[]>(() => {
  const raw = localStorage.getItem("sessions");
  return raw ? JSON.parse(raw) : sampleData; // keeps your demo data until real ones exist
});
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="history-root">
      <h2 className="panel-title">History</h2>
      <p className="panel-subtitle">Past simplification sessions.</p>
      <div className="history-list">
        {sessions.map((s) => (
          <div key={s.id} className="history-item">
            <div className="history-summary" onClick={() => toggle(s.id)}>
              <div>
                <strong>Session {s.id}</strong>
                <span className="history-date">{s.date}</span>
              </div>
              <div className="history-metrics">
                <span>Score: {s.scoreBefore} → {s.scoreAfter}</span>
                <span>Difficulty: {s.difficultyBefore} → {s.difficultyAfter}</span>
              </div>
              <div className="history-expand-icon">
                {expanded.has(s.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>
            {expanded.has(s.id) && (
              <div className="history-details">
                <div className="history-section">
                  <p className="history-label">Original text</p>
                  <p className="history-text">{s.original}</p>
                </div>

                <div className="history-section">
                  <p className="history-label">Simplified version</p>
                  <p className="history-text">{s.simplified}</p>
                </div>

                <div className="history-section">
                  <p className="history-label">Cognitive improvement</p>
                  <p className="history-text">{s.scoreBefore - s.scoreAfter} points</p>
                </div>

                {s.audioUrl && (
                  <button className="history-audio-button">
                    <Volume2 size={18} /> Play audio
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
