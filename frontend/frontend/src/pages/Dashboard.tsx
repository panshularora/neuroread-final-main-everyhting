import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import jsPDF from 'jspdf';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertTriangle, BookOpenText, Download, Info, Puzzle, RotateCw, Star, Target } from 'lucide-react';

import { getDashboard, ensureUserId, setUserId as storeUserId, friendlyError } from '../services/api';
import { useAsync } from '../hooks/useAsync';
import type { DashboardResponse as DashboardData, DashboardSession as Session } from '../types/api';

const INSIGHT_STYLE: Record<string, { Icon: typeof Info; tone: string }> = {
  struggle: { Icon: AlertTriangle, tone: 'border-err/30 bg-err/5 text-err' },
  phonics: { Icon: Target, tone: 'border-warn/30 bg-warn/5 text-warn' },
  success: { Icon: Star, tone: 'border-ok/30 bg-ok/5 text-ok' },
};

const formatMinutes = (m: number) => (m < 1 ? `${Math.max(1, Math.round(m * 60))} s` : `${m.toFixed(1)} min`);

function downloadReport(userId: string, data: DashboardData, sessions: Session[]) {
  const doc = new jsPDF();
  const totalMinutes = sessions.reduce((sum, s) => sum + Number(s.reading_time || 0), 0);
  const dist = data.difficulty_distribution || { low: 0, moderate: 0, high: 0 };
  let y = 24;
  const line = (text: string, size = 11, gap = 7) => {
    doc.setFontSize(size);
    doc.text(text, 20, y);
    y += gap;
  };

  line('NeuroRead progress report', 20, 12);
  doc.setTextColor(90, 90, 90);
  line(`Learner ID: ${userId}`);
  line(`Generated: ${new Date().toLocaleString()}`, 11, 12);
  doc.setTextColor(20, 20, 20);

  line('Summary', 14, 8);
  line(`Sessions logged: ${sessions.length}`);
  line(`Total reading time: ${formatMinutes(totalMinutes)}`);
  line(`Average reading load: ${data.avg_cognitive_load ?? 'n/a'} / 100`);
  line(`Texts by difficulty: ${dist.low} low, ${dist.moderate} moderate, ${dist.high} high`, 11, 12);

  if (data.insights?.length) {
    line('Observations', 14, 8);
    data.insights.forEach((i) => {
      const wrapped = doc.splitTextToSize(`${i.title}: ${i.desc}`, 170);
      doc.setFontSize(11);
      doc.text(wrapped, 20, y);
      y += wrapped.length * 6 + 2;
    });
    y += 4;
  }

  line('Recent sessions', 14, 8);
  sessions.slice(-10).reverse().forEach((s) => {
    line(
      `${new Date(s.timestamp).toLocaleDateString()}  load ${Math.round(s.cognitive_load)}  ` +
        `time ${formatMinutes(Number(s.reading_time))}  tutor questions ${s.pauses || 0}  words looked up ${s.errors || 0}`,
      10,
      6,
    );
  });

  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text('Generated from NeuroRead session logs. This is not a diagnosis.', 20, 285);
  doc.save(`NeuroRead_Report_${userId}.pdf`);
}

export default function Dashboard({ onNavigate }: { onNavigate?: (mode: string) => void }) {
  const [userId, setUserId] = useState(() => ensureUserId('demo-user-001'));
  const [draftId, setDraftId] = useState(userId);
  const [data, setData] = useState<DashboardData | null>(null);
  const dashboardAsync = useAsync(getDashboard, { retries: 1 });
  const runDashboard = dashboardAsync.run;

  const load = async (id: string) => {
    try {
      setData(await runDashboard(id));
    } catch {
      setData(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await runDashboard(userId);
        if (!cancelled) setData(res);
      } catch {
        if (!cancelled) setData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runDashboard, userId]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const id = draftId.trim();
    if (!id) return;
    storeUserId(id);
    if (id === userId) load(id);
    else setUserId(id);
  };

  const sessions = data?.session_history || [];
  const trendData = useMemo(
    () => (data?.improvement_trend || []).map((v, idx) => ({ session: idx + 1, load: Math.round(Number(v)) })),
    [data],
  );
  const totalMinutes = sessions.reduce((sum, s) => sum + Number(s.reading_time || 0), 0);
  const dist = data?.difficulty_distribution;

  const loading = dashboardAsync.loading && !data;
  const failed = !dashboardAsync.loading && Boolean(dashboardAsync.error);

  return (
    <div id="dashboard" className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl">Your progress</h1>
          <p className="mt-3 text-lg text-muted">
            Built from the reading sessions saved under your learner ID. Each simplified text you read counts as a session.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div>
            <label htmlFor="dashboard-user" className="mb-1 block text-sm font-bold text-muted">Learner ID</label>
            <input
              id="dashboard-user"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 sm:w-56"
            />
          </div>
          <button type="submit" className="rounded-xl border border-line bg-surface px-5 py-2.5 font-bold hover:bg-ink/5">
            Load
          </button>
        </form>
      </header>

      {loading && (
        <div role="status" aria-label="Loading your progress" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-ink/5" />
          ))}
        </div>
      )}

      {failed && (
        <div className="rounded-3xl border border-line bg-surface p-8 text-center">
          <p className="mb-4 text-lg">{friendlyError(dashboardAsync.error, "Your progress couldn't be loaded.")}</p>
          <button
            type="button"
            onClick={() => load(userId)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 font-bold text-white hover:bg-primary/90"
          >
            <RotateCw className="h-4 w-4" aria-hidden="true" /> Try again
          </button>
        </div>
      )}

      {data && sessions.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line bg-surface p-8 text-center sm:p-12">
          <BookOpenText className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
          <h2 className="text-2xl">No sessions yet</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            Simplify a text and read it through. When you close the simplifier, the session is saved here.
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.('read')}
            className="mt-6 rounded-xl bg-primary px-6 py-3 font-bold text-white hover:bg-primary/90"
          >
            Simplify a text
          </button>
        </div>
      )}

      {data && sessions.length > 0 && (
        <div className="space-y-8">
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ['Sessions', String(sessions.length)],
              ['Reading time', formatMinutes(totalMinutes)],
              ['Average reading load', `${Math.round(data.avg_cognitive_load ?? 0)} / 100`],
              ['Texts by difficulty', dist ? `${dist.low} · ${dist.moderate} · ${dist.high}` : '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-line bg-surface p-5 shadow-card">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="mt-1 font-display text-2xl font-bold tabular-nums">{value}</dd>
                {label === 'Texts by difficulty' && <dd className="text-xs text-muted">low · moderate · high</dd>}
              </div>
            ))}
          </dl>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <section aria-labelledby="trend-heading" className="rounded-3xl border border-line bg-surface p-6 lg:col-span-2">
              <h2 id="trend-heading" className="text-xl">Reading load per session</h2>
              <p className="mb-4 text-sm text-muted">Lower means the text was easier to take in. 0 to 100.</p>
              <div className="h-60 w-full text-primary" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.12} />
                    <XAxis dataKey="session" tick={{ fill: 'currentColor', fontSize: 12 }} stroke="currentColor" strokeOpacity={0.3} />
                    <YAxis domain={[0, 100]} tick={{ fill: 'currentColor', fontSize: 12 }} stroke="currentColor" strokeOpacity={0.3} />
                    <Tooltip formatter={(v) => [`${v} / 100`, 'Load']} labelFormatter={(l) => `Session ${l}`} />
                    <Line type="monotone" dataKey="load" stroke="currentColor" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="sr-only">
                Reading load by session: {trendData.map((d) => `session ${d.session}: ${d.load}`).join(', ')}.
              </p>
            </section>

            <section aria-labelledby="insights-heading" className="rounded-3xl border border-line bg-surface p-6">
              <h2 id="insights-heading" className="mb-4 text-xl">What we noticed</h2>
              <ul className="space-y-3">
                {(data.insights || []).map((insight, idx) => {
                  const style = INSIGHT_STYLE[insight.type] || { Icon: Info, tone: 'border-line bg-paper text-primary' };
                  return (
                    <li key={idx} className={`flex gap-3 rounded-2xl border p-4 ${style.tone}`}>
                      <style.Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                      <div className="text-ink">
                        <p className="font-bold">{insight.title}</p>
                        <p className="text-sm text-muted">{insight.desc}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <section aria-labelledby="sessions-heading" className="rounded-3xl border border-line bg-surface p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 id="sessions-heading" className="text-xl">Recent sessions</h2>
              <button
                type="button"
                onClick={() => downloadReport(userId, data, sessions)}
                className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 font-bold hover:bg-ink/5"
              >
                <Download className="h-4 w-4" aria-hidden="true" /> Download report (PDF)
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead className="text-sm text-muted">
                  <tr className="border-b border-line">
                    <th scope="col" className="py-2 pr-4 font-bold">Date</th>
                    <th scope="col" className="py-2 pr-4 font-bold">Reading time</th>
                    <th scope="col" className="py-2 pr-4 font-bold">Load</th>
                    <th scope="col" className="py-2 pr-4 font-bold">Tutor questions</th>
                    <th scope="col" className="py-2 font-bold">Words looked up</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {sessions.slice(-8).reverse().map((s) => (
                    <tr key={s.session_id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-4">
                        {new Date(s.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })},{' '}
                        {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 pr-4">{formatMinutes(Number(s.reading_time))}</td>
                      <td className="py-3 pr-4">{Math.round(s.cognitive_load)}</td>
                      <td className="py-3 pr-4">{s.pauses || 0}</td>
                      <td className="py-3">{s.errors || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => onNavigate?.('practice')}
              className="flex items-start gap-4 rounded-3xl bg-primary p-6 text-left text-white hover:bg-primary/90"
            >
              <Puzzle className="mt-1 h-6 w-6 shrink-0" aria-hidden="true" />
              <span>
                <span className="block font-display text-xl font-bold">Practise with a game</span>
                <span className="mt-1 block text-white/85">A one-minute round on spelling, rhymes or syllables.</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('read')}
              className="flex items-start gap-4 rounded-3xl border border-line bg-surface p-6 text-left hover:border-primary/60"
            >
              <BookOpenText className="mt-1 h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block font-display text-xl font-bold">Simplify a text</span>
                <span className="mt-1 block text-muted">Paste something you need to read and get a plainer version.</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
