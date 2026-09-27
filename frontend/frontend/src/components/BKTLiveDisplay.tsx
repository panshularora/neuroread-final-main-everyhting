import SkillBar from './SkillBar';
import type { AnswerResponse, SkillState } from '../types/api';

interface BKTLiveDisplayProps {
  skills: SkillState[];
  lastSkillUpdate?: AnswerResponse['skill_update'] | null;
  lastIRTUpdate?: AnswerResponse['irt_update'] | null;
  lastSM2Update?: AnswerResponse['sm2_update'] | null;
  sessionId?: string;
}

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

export default function BKTLiveDisplay({
  skills,
  lastSkillUpdate,
  lastIRTUpdate,
  lastSM2Update,
  sessionId,
}: BKTLiveDisplayProps) {
  const skillDeltas: Record<string, number> = {};
  if (lastSkillUpdate) {
    skillDeltas[lastSkillUpdate.skill_name] = lastSkillUpdate.p_know_after - lastSkillUpdate.p_know_before;
  }

  return (
    <section aria-labelledby="skills-heading" className="rounded-3xl border border-line bg-surface p-5">
      <h3 id="skills-heading" className="text-lg">Skills</h3>
      <p className="mb-4 text-sm text-muted">
        Estimated chance you already know each skill, updated after every answer.
      </p>

      {lastSkillUpdate && (
        <p className="mb-4 rounded-xl bg-primary/5 px-4 py-3 text-sm" aria-live="polite">
          {lastSkillUpdate.skill_name.replace(/_/g, ' ')}: {pct(lastSkillUpdate.p_know_before)} to{' '}
          <strong className={lastSkillUpdate.delta >= 0 ? 'text-ok' : 'text-err'}>
            {pct(lastSkillUpdate.p_know_after)}
          </strong>
        </p>
      )}

      <div className="space-y-3">
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
          <p className="rounded-xl border border-dashed border-line px-4 py-6 text-center text-sm text-muted">
            Answer an exercise to see your skills here.
          </p>
        )}
      </div>

      {(lastSkillUpdate || lastIRTUpdate || lastSM2Update) && (
        <details className="mt-5 rounded-xl border border-line bg-paper px-4 py-3 text-sm">
          <summary className="cursor-pointer font-bold">Model details</summary>
          <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 tabular-nums">
            {lastSkillUpdate?.bkt_params && (
              <>
                <dt className="text-muted">BKT transit / slip / guess</dt>
                <dd>
                  {lastSkillUpdate.bkt_params.p_transit} / {lastSkillUpdate.bkt_params.p_slip} /{' '}
                  {lastSkillUpdate.bkt_params.p_guess}
                </dd>
              </>
            )}
            {lastIRTUpdate && (
              <>
                <dt className="text-muted">IRT ability (θ)</dt>
                <dd>
                  {lastIRTUpdate.ability_before.toFixed(3)} → {lastIRTUpdate.ability_after.toFixed(3)}
                </dd>
                <dt className="text-muted">Difficulty zone</dt>
                <dd>{lastIRTUpdate.zpd_label}</dd>
              </>
            )}
            {lastSM2Update && (
              <>
                <dt className="text-muted">SM-2 next review</dt>
                <dd>
                  {lastSM2Update.next_review_label} (EF {lastSM2Update.easiness_factor})
                </dd>
              </>
            )}
            {sessionId && (
              <>
                <dt className="text-muted">Session</dt>
                <dd className="break-all">{sessionId}</dd>
              </>
            )}
          </dl>
        </details>
      )}
    </section>
  );
}
