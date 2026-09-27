import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import { ChevronDown, Download } from 'lucide-react';
import { getDashboard } from '../services/api';
import type { DashboardResponse } from '../types/api';

function Bar({ heightPct, label, high, title }: { heightPct: number; label: string; high: boolean; title: string }) {
  return (
    <li className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={title}>
      <span
        className={`w-full max-w-[2.5rem] rounded-t ${high ? 'bg-accent/60' : 'bg-primary/40'}`}
        style={{ height: `${Math.min(100, Math.max(5, heightPct))}%` }}
      />
      <span className="w-full truncate text-center text-xs text-muted">{label}</span>
      <span className="sr-only">{title}</span>
    </li>
  );
}

export default function History({ userId }: { userId: string }) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getDashboard(userId || 'demo-user-001');
        if (mounted) setData(res);
      } catch {
        if (mounted) setFailed(true);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  const sessions = data?.session_history || [];
  
  const handleExport = () => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(46, 64, 54);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(242, 240, 233);
    doc.setFontSize(16);
    doc.text('Neuroread — Session Report', 14, 16);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 150, 16);

    doc.setTextColor(26, 26, 26);
    doc.setFontSize(11);
    doc.text(`User ID: ${userId || 'demo-user-001'}`, 14, 35);

    let y = 50;
    sessions.forEach((s, i) => {
      if (i % 2 === 0) {
        doc.setFillColor(242, 240, 233);
        doc.rect(10, y - 5, 190, 22, 'F');
      }

      doc.setFontSize(10);
      doc.setTextColor(26, 26, 26);
      doc.text(`Session ${s.session_id}  ${new Date(s.timestamp).toLocaleDateString()}`, 14, y);
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Load: ${Math.round(s.cognitive_load)}   Time: ${Number(s.reading_time).toFixed(1)}m   Errors: ${s.errors}   Pauses: ${s.pauses}`, 14, y + 7);

      y += 26;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.setFillColor(46, 64, 54);
    doc.rect(0, 285, 210, 12, 'F');
    doc.setTextColor(242, 240, 233);
    doc.setFontSize(8);
    doc.text('Neuroread — Reading Accessibility Platform', 14, 293);

    doc.save(`neuroread-history-${userId || 'demo'}.pdf`);
  };

  const avgLoad = data?.avg_cognitive_load || 0;

  return (
    <section id="history" aria-labelledby="history-title" className="border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="history-title" className="text-3xl text-ink">Your recent sessions</h2>
            <p className="mt-2 text-muted">Each simplified passage is logged with reading time, pauses and a reading-load score.</p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={sessions.length === 0}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink hover:border-primary/40 disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download PDF report
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-line bg-surface p-6 text-base text-muted">
            {failed
              ? 'Session history is stored by the NeuroRead backend, which is not connected right now.'
              : 'No sessions yet. Simplify a passage and it will show up here.'}
          </p>
        ) : (
          <>
            <dl className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-2xl border border-line bg-surface p-4">
                <dt className="text-sm text-muted">Sessions</dt>
                <dd className="text-2xl font-bold text-ink">{sessions.length}</dd>
              </div>
              <div className="rounded-2xl border border-line bg-surface p-4">
                <dt className="text-sm text-muted">Average reading load</dt>
                <dd className="text-2xl font-bold text-ink">{Math.round(avgLoad)}</dd>
              </div>
            </dl>

            <div className="mb-6 rounded-3xl border border-line bg-surface p-5">
              <h3 className="mb-4 text-base text-ink">Reading load per session</h3>
              <ol className="flex h-28 items-end gap-2" aria-label="Reading load of the last sessions">
                {sessions.slice(-15).map((s, idx) => {
                  const d = new Date(s.timestamp);
                  return (
                    <Bar
                      key={idx}
                      heightPct={s.cognitive_load}
                      label={`${d.getMonth() + 1}/${d.getDate()}`}
                      high={s.cognitive_load > 60}
                      title={`Session ${s.session_id}: reading load ${Math.round(s.cognitive_load)}`}
                    />
                  );
                })}
              </ol>
            </div>

            <ul className="space-y-2" id="history-list">
              {sessions.slice().reverse().map((s) => {
                const isOpen = expandedId === s.session_id;
                const high = s.cognitive_load > 60;
                return (
                  <li key={s.session_id} className={`history-row overflow-hidden rounded-2xl border bg-surface ${high ? 'border-accent/30' : 'border-line'} ${isOpen ? 'expanded' : ''}`}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`session-${s.session_id}`}
                      onClick={() => setExpandedId(isOpen ? null : s.session_id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-ink/[0.03]"
                    >
                      <span>
                        <span className="block font-bold text-ink">Session {s.session_id}</span>
                        <span className="text-sm text-muted">
                          {new Date(s.timestamp).toLocaleDateString()} at{' '}
                          {new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </span>
                      <span className="flex items-center gap-5 text-sm text-muted">
                        <span className="hidden sm:inline">Load <b className="text-ink">{Math.round(s.cognitive_load)}</b></span>
                        <span className="hidden sm:inline">Time <b className="text-ink">{Number(s.reading_time).toFixed(1)} min</b></span>
                        <ChevronDown className="history-chevron h-5 w-5" aria-hidden="true" />
                      </span>
                    </button>
                    <div id={`session-${s.session_id}`} className={`history-row-body ${isOpen ? 'open' : ''}`}>
                      <dl className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          ['Time', `${Number(s.reading_time).toFixed(1)} min`],
                          ['Errors', s.errors],
                          ['Pauses', s.pauses],
                          ['Reading load', Math.round(s.cognitive_load)],
                        ].map(([k, v]) => (
                          <div key={k} className="rounded-xl bg-paper p-3">
                            <dt className="text-sm text-muted">{k}</dt>
                            <dd className="text-lg font-bold text-ink">{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <p className="text-sm text-muted">
                        {high
                          ? 'This passage was hard going: expect more pauses and corrections at this level.'
                          : 'This session went smoothly with a manageable reading load.'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
