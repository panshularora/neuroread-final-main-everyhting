export type ReadingMode = 'guided' | 'focus' | 'chunk';

const modes: { id: ReadingMode; label: string }[] = [
  { id: 'guided', label: 'Guided' },
  { id: 'focus', label: 'Focus' },
  { id: 'chunk', label: 'Chunk' },
];

export default function ReadingModes({ mode, onChange }: { mode: ReadingMode; onChange: (mode: ReadingMode) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-labelledby="reading-mode-label">
      <p id="reading-mode-label" className="text-sm font-bold text-muted mr-2">Reading mode</p>
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          aria-pressed={mode === m.id}
          className={`text-sm px-3 py-1.5 rounded-full border transition-all font-medium ${
            mode === m.id
              ? 'bg-moss text-cream border-moss'
              : 'bg-white text-charcoal border-line hover:bg-moss/10'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

