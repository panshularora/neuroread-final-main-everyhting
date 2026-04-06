import { useEffect, useMemo, useState } from 'react';
import ReadingModes from './ReadingModes';
import HeatmapView from './HeatmapView';
import { getHeatmap, getChunks, getConceptGraph } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import ConceptGraph from './ConceptGraph';

function splitWords(text) {
  return String(text || '').split(/(\b[\w']+\b)/g);
}

export default function InteractiveReader({
  text,
  dyslexiaStyle,
  difficultWordsSet,
  onWordClick,
  onExplainSentence,
}) {
  const [mode, setMode] = useState('guided');
  const [activeIdx, setActiveIdx] = useState(0);

  const heatmapAsync = useAsync(getHeatmap, { retries: 0 });
  const chunksAsync = useAsync(getChunks, { retries: 0 });
  const graphAsync = useAsync(getConceptGraph, { retries: 0 });

  const [heatmap, setHeatmap] = useState([]);
  const [chunks, setChunks] = useState([]);
  const [graph, setGraph] = useState(null);

  useEffect(() => {
    setActiveIdx(0);
    setHeatmap([]);
    setChunks([]);
    setGraph(null);
  }, [text]);

  useEffect(() => {
    const t = (text || '').trim();
    if (!t) return;
    // Heatmap is useful across all modes.
    (async () => {
      try {
        const res = await heatmapAsync.run(t);
        setHeatmap(res?.heatmap || []);
      } catch {
        setHeatmap([]);
      }
    })();
  }, [text]);

  useEffect(() => {
    const t = (text || '').trim();
    if (!t) return;
    if (mode === 'chunk') {
      (async () => {
        try {
          const res = await chunksAsync.run(t);
          setChunks(res?.chunks || []);
        } catch {
          setChunks([]);
        }
      })();
    }
  }, [mode, text]);

  useEffect(() => {
    const t = (text || '').trim();
    if (!t) return;
    // Build concept graph lazily once.
    if (graph) return;
    (async () => {
      try {
        const res = await graphAsync.run(t);
        setGraph(res);
      } catch {
        setGraph(null);
      }
    })();
  }, [text]);

  const guidedSentences = heatmap;
  const focusSentence = guidedSentences?.[activeIdx];

  const renderTextWithWordClicks = (t) => {
    const parts = splitWords(t);
    return parts.map((p, idx) => {
      const key = p && /\b[\w']+\b/.test(p) ? p.toLowerCase() : null;
      if (key && difficultWordsSet?.has?.(key)) {
        return (
          <button
            key={`${idx}-${p}`}
            type="button"
            onClick={() => onWordClick?.(p)}
            className="px-1 rounded-md bg-clay/10 hover:bg-clay/20 border border-clay/20 text-charcoal/80 transition-colors"
            title="Click for vocabulary card"
          >
            {p}
          </button>
        );
      }
      return <span key={`${idx}-t`}>{p}</span>;
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <ReadingModes mode={mode} onChange={setMode} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveIdx((v) => Math.max(0, v - 1))}
            disabled={activeIdx <= 0 || mode === 'chunk'}
            className="text-[10px] px-3 py-1 rounded-full bg-white border border-moss/15 text-charcoal/60 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setActiveIdx((v) => Math.min((guidedSentences?.length || 1) - 1, v + 1))}
            disabled={mode === 'chunk' || activeIdx >= (guidedSentences?.length || 1) - 1}
            className="text-[10px] px-3 py-1 rounded-full bg-white border border-moss/15 text-charcoal/60 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {mode === 'chunk' ? (
        <div className="space-y-3">
          {chunks?.length ? (
            chunks.map((c, idx) => (
              <div key={`${idx}-${c.type}`} className="rounded-xl border border-moss/10 bg-white p-4">
                <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-2">{c.type}</p>
                <div className="text-sm text-charcoal/80 leading-relaxed" style={dyslexiaStyle}>
                  {renderTextWithWordClicks(c.text)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-charcoal/50">Chunking…</p>
          )}

          <div className="mt-2">
            <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-2">Concept graph</p>
            <ConceptGraph graph={graph} height={240} />
          </div>
        </div>
      ) : mode === 'focus' ? (
        <div className="rounded-xl bg-white border border-moss/10 px-5 py-4" style={dyslexiaStyle}>
          {focusSentence ? (
            <button
              type="button"
              onClick={() => onExplainSentence?.(focusSentence.sentence)}
              className="text-left w-full"
            >
              <div className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-2">
                Focus sentence • {focusSentence.difficulty} ({focusSentence.score}/100)
              </div>
              <div className="text-sm text-charcoal/80 leading-relaxed">
                {renderTextWithWordClicks(focusSentence.sentence)}
              </div>
            </button>
          ) : (
            <p className="text-sm text-charcoal/60">No sentences to display.</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <HeatmapView
            sentences={guidedSentences}
            activeIndex={activeIdx}
            onSentenceClick={(idx, s) => {
              setActiveIdx(idx);
              onExplainSentence?.(s.sentence);
            }}
          />
        </div>
      )}
    </div>
  );
}

