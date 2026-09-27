import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import ReadingModes from './ReadingModes';
import type { ReadingMode } from './ReadingModes';
import HeatmapView from './HeatmapView';
import { getHeatmap, getChunks, getConceptGraph } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';
import ConceptGraph from './ConceptGraph';
import type { ConceptGraphResponse, HeatmapSentence, TextChunk } from '../../types/api';

function splitWords(text: string) {
  return String(text || '').split(/(\b[\w']+\b)/g);
}

interface InteractiveReaderProps {
  text: string;
  dyslexiaStyle?: CSSProperties;
  difficultWordsSet?: Set<string>;
  onWordClick?: (word: string) => void;
  onExplainSentence?: (sentence: string) => void;
}

// The parent keys this component by text, so a new text starts from a clean state.
export default function InteractiveReader({
  text,
  dyslexiaStyle,
  difficultWordsSet,
  onWordClick,
  onExplainSentence,
}: InteractiveReaderProps) {
  const [mode, setMode] = useState<ReadingMode>('guided');
  const [activeIdx, setActiveIdx] = useState(0);

  const { run: runHeatmap } = useAsync(getHeatmap, { retries: 0 });
  const { run: runChunks } = useAsync(getChunks, { retries: 0 });
  const { run: runGraph } = useAsync(getConceptGraph, { retries: 0 });

  const [heatmap, setHeatmap] = useState<HeatmapSentence[]>([]);
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [graph, setGraph] = useState<ConceptGraphResponse | null>(null);

  useEffect(() => {
    const t = (text || '').trim();
    if (!t) return;
    // Heatmap is useful across all modes.
    (async () => {
      try {
        const res = await runHeatmap(t);
        setHeatmap(res?.heatmap || []);
      } catch {
        setHeatmap([]);
      }
    })();
  }, [text, runHeatmap]);

  useEffect(() => {
    const t = (text || '').trim();
    if (!t) return;
    if (mode === 'chunk') {
      (async () => {
        try {
          const res = await runChunks(t);
          setChunks(res?.chunks || []);
        } catch {
          setChunks([]);
        }
      })();
    }
  }, [mode, text, runChunks]);

  useEffect(() => {
    const t = (text || '').trim();
    if (!t) return;
    // The concept graph is built once per text.
    (async () => {
      try {
        const res = await runGraph(t);
        setGraph(res);
      } catch {
        setGraph(null);
      }
    })();
  }, [text, runGraph]);

  const guidedSentences = heatmap;
  const focusSentence = guidedSentences?.[activeIdx];

  const renderTextWithWordClicks = (t: string) => {
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
            className="text-sm px-3 py-1.5 rounded-full bg-white border border-line text-charcoal hover:bg-moss/10 disabled:opacity-40"
            aria-label="Previous sentence"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setActiveIdx((v) => Math.min((guidedSentences?.length || 1) - 1, v + 1))}
            disabled={mode === 'chunk' || activeIdx >= (guidedSentences?.length || 1) - 1}
            className="text-sm px-3 py-1.5 rounded-full bg-white border border-line text-charcoal hover:bg-moss/10 disabled:opacity-40"
            aria-label="Next sentence"
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
                <p className="text-xs font-medium text-charcoal/40 mb-2">{c.type}</p>
                <div className="text-sm text-charcoal/80 leading-relaxed" style={dyslexiaStyle}>
                  {renderTextWithWordClicks(c.text)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-charcoal/50">Chunking…</p>
          )}

          <div className="mt-2">
            <p className="text-xs font-medium text-charcoal/40 mb-2">Concept graph</p>
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
              <div className="text-xs font-medium text-charcoal/40 mb-2">
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

