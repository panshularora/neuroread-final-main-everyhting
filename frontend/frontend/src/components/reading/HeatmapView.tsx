import type { HeatmapSentence } from '../../types/api';

function bgForDifficulty(diff: string) {
  const d = String(diff || '').toLowerCase();
  if (d === 'high') return 'bg-red-500/15 border-red-500/25';
  if (d === 'moderate') return 'bg-yellow-400/20 border-yellow-500/25';
  return 'bg-green-500/15 border-green-500/25';
}

interface HeatmapViewProps {
  sentences: HeatmapSentence[];
  activeIndex: number;
  onSentenceClick?: (idx: number, sentence: HeatmapSentence) => void;
}

export default function HeatmapView({ sentences, activeIndex, onSentenceClick }: HeatmapViewProps) {
  if (!sentences?.length) return null;

  return (
    <div className="space-y-2">
      {sentences.map((s, idx) => {
        const isActive = idx === activeIndex;
        return (
          <button
            key={`${idx}-${s.start}-${s.end}`}
            type="button"
            onClick={() => onSentenceClick?.(idx, s)}
            className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
              bgForDifficulty(s.difficulty)
            } ${isActive ? 'ring-2 ring-moss/25' : 'hover:bg-moss/5'}`}
            title={`Score: ${s.score}`}
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-xs font-medium text-charcoal/50">
                {s.difficulty} • {s.score}/100
              </span>
              <span className="text-xs text-charcoal/40">
                {idx + 1}/{sentences.length}
              </span>
            </div>
            <p className="text-sm text-charcoal/80 leading-relaxed">{s.sentence}</p>
          </button>
        );
      })}
    </div>
  );
}

