import { useEffect, useState } from 'react';
import jsPDF from 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm';
import { getDashboard } from '../services/api';

function Bar({ heightPct, label, colorClass, title }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1">
      <div
        className={`w-full rounded-t ${colorClass} hover:opacity-90 transition-colors cursor-default`}
        style={{ height: `${Math.min(100, Math.max(5, heightPct))}%` }}
        title={title}
      />
      <span className="text-[9px] text-charcoal/40 truncate w-full text-center">{label}</span>
    </div>
  );
}

export default function History({ userId }) {
  const [data, setData] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getDashboard(userId || 'demo-user-001');
        if (mounted) setData(res);
      } catch {
        // failed to fetch history
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  const sessions = data?.session_history || [];
  
  const handleExport = () => {
    const doc = new (jsPDF as any)();

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
    sessions.forEach((s: any, i: number) => {
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
    <section id="history" className="py-24 bg-cream relative z-20 border-t border-moss/8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex items-start justify-between mb-12 flex-wrap gap-4">
          <div>
            <span className="font-mono text-xs text-moss uppercase tracking-wider block mb-3">Your Progress</span>
            <h2 className="md:text-5xl text-charcoal text-4xl font-medium tracking-tight">Session History</h2>
            <p className="text-charcoal/50 text-sm mt-2">Past reading sessions and cognitive improvement over time.</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap mt-2">
            <button
              onClick={handleExport}
              disabled={sessions.length === 0}
              className="export-btn flex items-center gap-2 bg-moss text-cream rounded-full px-5 py-2.5 text-xs font-medium hover:scale-105 transition-transform shadow-lg shadow-moss/20 disabled:opacity-50"
            >
              <span className="iconify" data-icon="solar:download-linear" />
              Export Report
            </button>
            <div className="flex items-center gap-2 bg-white border border-moss/10 rounded-full px-4 py-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-moss" />
              <span className="text-charcoal/60">{sessions.length} sessions</span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-moss/10 rounded-full px-4 py-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-clay" />
              <span className="text-charcoal/60">Avg Load: {Math.round(avgLoad)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-moss/10 rounded-[2rem] p-6 mb-8">
          <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-wider mb-4">
            Cognitive Score Over Time
          </p>
          <div className="flex items-end gap-2 h-20">
            {sessions.length > 0 ? sessions.slice(-15).map((s: any, idx: number) => {
              const dateObj = new Date(s.timestamp);
              const labelDate = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
              return (
                 <Bar 
                   key={idx} 
                   heightPct={s.cognitive_load} 
                   label={labelDate} 
                   colorClass={s.cognitive_load > 60 ? "bg-clay/50 hover:bg-clay/70" : "bg-moss/25 hover:bg-moss/50"} 
                   title={`Load: ${Math.round(s.cognitive_load)}`} 
                 />
              );
            }) : (
              <span className="text-sm text-charcoal/40">No sessions recorded yet.</span>
            )}
          </div>
        </div>

        <div className="space-y-3" id="history-list">
          {sessions.slice().reverse().map((s: any) => {
            const isOpen = expandedId === s.session_id;
            const accentBg = s.cognitive_load > 60 ? 'bg-clay/10' : 'bg-moss/8';
            const accentText = s.cognitive_load > 60 ? 'text-clay' : 'text-moss';
            const hoverBg = s.cognitive_load > 60 ? 'hover:bg-clay/[0.03]' : 'hover:bg-moss/[0.03]';
            const border = s.cognitive_load > 60 ? 'border-clay/25' : 'border-moss/10';

            return (
              <div
                key={s.session_id}
                className={`history-row rounded-[1.25rem] overflow-hidden border ${border} bg-white ${isOpen ? 'expanded' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : s.session_id)}
                  className={`w-full flex items-center justify-between px-6 py-4 text-left ${hoverBg} transition-colors`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full ${accentBg} flex items-center justify-center`}>
                      <span
                        className={`iconify ${accentText}`}
                        data-icon="solar:document-text-linear"
                        style={{ width: '.9rem', height: '.9rem' }}
                      />
                    </div>
                    <div>
                      <span className="font-medium text-sm text-charcoal">Focus Session #{s.session_id}</span>
                      <span className="text-xs text-charcoal/40 ml-3">
                        {new Date(s.timestamp).toLocaleDateString()} {new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className="text-xs text-charcoal/60 hidden sm:block">
                      Load: <strong className="text-charcoal">{Math.round(s.cognitive_load)}</strong>
                    </span>
                    <span className="text-xs text-charcoal/60 hidden sm:block">
                      Time: <strong className="text-charcoal">{Number(s.reading_time).toFixed(1)}m</strong>
                    </span>
                    <span
                      className="iconify history-chevron text-charcoal/40"
                      data-icon="solar:alt-arrow-down-linear"
                      style={{ width: '1rem', height: '1rem' }}
                    />
                  </div>
                </button>

                <div className={`history-row-body ${isOpen ? 'open' : ''}`}>
                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="bg-moss/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-charcoal/40 uppercase tracking-wider mb-1">Time</p>
                      <p className="text-lg font-medium text-charcoal">{Number(s.reading_time).toFixed(1)}m</p>
                    </div>
                    <div className="bg-clay/8 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-charcoal/40 uppercase tracking-wider mb-1">Errors</p>
                      <p className="text-lg font-medium text-clay">{s.errors}</p>
                    </div>
                    <div className="bg-moss/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-charcoal/40 uppercase tracking-wider mb-1">Pauses</p>
                      <p className="text-lg font-medium text-moss">{s.pauses}</p>
                    </div>
                    <div className="bg-moss/5 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-charcoal/40 uppercase tracking-wider mb-1">Load</p>
                      <p className="text-lg font-medium text-charcoal">{Math.round(s.cognitive_load)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-charcoal/50 leading-relaxed mb-2">
                    {s.cognitive_load > 60 
                       ? "This text posed moderate to high cognitive difficulty. More frequent pauses or error corrections were identified." 
                       : "Excellent focus. This reading session completed smoothly with well-managed cognitive load."}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

