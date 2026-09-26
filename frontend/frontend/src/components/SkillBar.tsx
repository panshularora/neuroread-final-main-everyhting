interface SkillBarProps {
  skillName: string;
  pKnow: number; // 0.0 – 1.0
  mastered: boolean;
  delta?: number; // change since the last answer
}

export default function SkillBar({ skillName, pKnow, mastered, delta }: SkillBarProps) {
  const pct = Math.round(pKnow * 100);
  const fill = mastered ? 'bg-ok' : pKnow >= 0.4 ? 'bg-primary' : 'bg-warn';
  const displayName = (skillName || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className={`rounded-xl border px-4 py-3 ${mastered ? 'border-ok/30 bg-ok/5' : 'border-line bg-paper'}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold">{displayName}</span>
        <span className="flex items-center gap-2 text-sm">
          {delta !== undefined && delta > 0.001 && (
            <span className="rounded-full bg-ok/10 px-2 py-0.5 font-bold text-ok">+{Math.round(delta * 100)}%</span>
          )}
          <span className="font-bold tabular-nums">{pct}%</span>
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-label={`${displayName} mastery`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={`h-full rounded-full transition-[width] duration-700 ${fill}`} style={{ width: `${pct}%` }} />
      </div>
      {mastered && <p className="mt-1 text-xs font-bold text-ok">Mastered</p>}
    </div>
  );
}
