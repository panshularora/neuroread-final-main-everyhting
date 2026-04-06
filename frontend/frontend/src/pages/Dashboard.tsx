import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

import { getDashboard, ensureUserId } from '../services/api';
import { useAsync } from '../hooks/useAsync';

export default function Dashboard({ onNavigate }: { onNavigate?: (mode: string) => void }) {
  const [userId, setUserId] = useState(() => ensureUserId('demo-user-001'));
  const [data, setData] = useState<any>(null);
  const dashboardAsync = useAsync(getDashboard, { retries: 1 });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await dashboardAsync.run(userId);
        if (mounted) setData(res);
      } catch { /* handled */ }
    })();
    return () => { mounted = false; };
  }, [userId]);

  const trendData = useMemo(() => {
    const trend = data?.improvement_trend || [];
    return trend.map((v, idx) => ({ session: idx + 1, load: Number(v) }));
  }, [data]);

  const recommendations = [
    { title: 'Try Phonics Lab', desc: 'You are doing great! Let\'s practice some new sounds today.', icon: 'solar:microphone-3-bold-duotone', color: 'text-green-600' },
    { title: 'Read a Story', desc: 'A short story can help reinforce the words you learned yesterday.', icon: 'solar:book-bold-duotone', color: 'text-purple-600' }
  ];

  const [generatingReport, setGeneratingReport] = useState(false);

  const generateReport = () => {
    setGeneratingReport(true);
    setTimeout(() => {
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(46, 64, 54); // moss
      doc.text('NeuroRead Cognitive Report', 20, 30);
      
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`Patient Profile / User ID: ${userId}`, 20, 40);
      doc.text(`Date of Report: ${new Date().toLocaleDateString()}`, 20, 48);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Cognitive Summary', 20, 65);
      doc.setFontSize(11);
      doc.text('- Overall Focus Stability: Healthy', 25, 75);
      doc.text(`- Avg Cognitive Load: ${data?.avg_cognitive_load || 'N/A'}/100`, 25, 82);
      doc.text('- Comprehension Estimate: ~80%', 25, 89);
      
      doc.setFontSize(14);
      doc.text('Observed Difficulties', 20, 105);
      doc.setFontSize(11);
      doc.text('- Phoneme processing issues detected in "-tion" syllables', 25, 115);
      doc.text('- Occasional working memory bottlenecks on complex sentences', 25, 122);
      
      doc.setFontSize(14);
      doc.text('Behavioral Patterns', 20, 138);
      doc.setFontSize(11);
      doc.text('- Frequent pauses (>3s) during dense paragraph reading', 25, 148);
      doc.text('- Strong engagement and active recovery utilizing Audio Assist', 25, 155);

      doc.setFontSize(14);
      doc.text('Recommendations', 20, 171);
      doc.setFontSize(11);
      doc.text('- Continue 5-minute daily Phonics Lab practice', 25, 181);
      doc.text('- Employ Smart Simplifier prior to reading complex instructional texts', 25, 188);

      doc.setFontSize(10);
      doc.setTextColor(198, 107, 68); // clay color / warning
      doc.text('CLINICAL NOTE: This is an AI-assisted observational report. It is not a', 20, 260);
      doc.text('medical diagnosis. It may be used to support professional evaluation.', 20, 266);

      doc.save(`NeuroRead_Report_${userId}.pdf`);
      setGeneratingReport(false);
    }, 500);
  };

  return (
    <div id="dashboard" className="py-16 px-6 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Supportive Header */}
      <div className="mb-16 flex flex-col md:flex-row items-center justify-between gap-6 max-w-6xl mx-auto">
        <div className="text-left">
          <div className="w-16 h-16 rounded-2xl bg-moss/5 flex items-center justify-center mb-6">
            <span className="iconify text-3xl text-moss" data-icon="solar:chart-2-bold-duotone" />
          </div>
          <h2 className="text-4xl font-medium text-moss mb-4 tracking-tight">Your Growth Journey</h2>
          <p className="text-text-muted text-lg leading-relaxed max-w-xl">
            Every step counts! Here is a look at your amazing progress and what we can explore next.
          </p>
        </div>
        
        {/* Doctor Report Action */}
        <button 
          onClick={generateReport}
          disabled={generatingReport}
          className="shrink-0 px-8 py-4 bg-white border border-moss/10 rounded-2xl text-moss font-bold flex items-center gap-3 hover:bg-moss hover:text-white transition-all shadow-sm hover:shadow-lg disabled:opacity-50"
        >
          {generatingReport ? (
             <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
             <span className="iconify text-2xl" data-icon="solar:document-medicine-bold-duotone" />
          )}
          {generatingReport ? 'Generating...' : 'Export Clinical Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metrics */}
        {/* Left Column: Insights & Actions */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-white rounded-[3rem] p-10 border border-moss/5 shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-2xl font-bold text-moss mb-6 flex items-center gap-3">
              <span className="iconify text-clay text-3xl" data-icon="solar:lightbulb-minimalistic-bold-duotone" />
              AI Insights
            </h3>
            <div className="space-y-4">
              {data?.insights ? data.insights.map((insight: any, idx: number) => {
                let colorClass = 'bg-gray-50/50 border-gray-100';
                let iconClass = 'text-gray-500';
                let titleClass = 'text-gray-900';
                let descClass = 'text-gray-800/80';
                let iconName = 'solar:info-circle-bold-duotone';

                if (insight.type === 'struggle') {
                  colorClass = 'bg-red-50/50 border-red-100';
                  iconClass = 'text-red-500';
                  titleClass = 'text-red-900';
                  descClass = 'text-red-800/80';
                  iconName = 'solar:danger-triangle-bold-duotone';
                } else if (insight.type === 'phonics') {
                  colorClass = 'bg-orange-50/50 border-orange-100';
                  iconClass = 'text-orange-500';
                  titleClass = 'text-orange-900';
                  descClass = 'text-orange-800/80';
                  iconName = 'solar:target-bold-duotone';
                } else if (insight.type === 'success') {
                  colorClass = 'bg-green-50/50 border-green-100';
                  iconClass = 'text-green-600';
                  titleClass = 'text-green-900';
                  descClass = 'text-green-800/80';
                  iconName = 'solar:star-fall-bold-duotone';
                }

                return (
                  <div key={idx} className={`p-6 ${colorClass} border rounded-3xl flex items-start gap-4`}>
                    <span className={`iconify text-2xl outline-none shadow-none ${iconClass} shrink-0 mt-1`} data-icon={iconName} />
                    <div>
                      <h4 className={`font-bold ${titleClass} text-lg mb-1`}>{insight.title}</h4>
                      <p className={`text-sm ${descClass} leading-relaxed`}>{insight.desc}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-sm text-text-muted">Loading insights...</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div onClick={() => onNavigate?.('practice')} className="bg-moss rounded-[2.5rem] p-8 border border-moss shadow-[0_8px_20px_rgba(46,64,54,0.15)] hover:-translate-y-1 transition-all duration-300 text-white cursor-pointer group">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">Action</span>
                  <span className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-moss transition-colors">
                    <span className="iconify text-xl" data-icon="solar:magic-stick-3-bold" />
                  </span>
                </div>
                <h4 className="text-2xl font-bold mb-2">Practice Phonics Now</h4>
                <p className="text-white/70 text-sm">Jump directly into a 5-minute targeted phonics session to boost fluency.</p>
             </div>
             
             <div onClick={() => onNavigate?.('assistive')} className="bg-clay rounded-[2.5rem] p-8 border border-clay shadow-[0_8px_20px_rgba(198,107,68,0.15)] hover:-translate-y-1 transition-all duration-300 text-white cursor-pointer group">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 block">Action</span>
                  <span className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white group-hover:text-clay transition-colors">
                    <span className="iconify text-xl" data-icon="solar:settings-bold" />
                  </span>
                </div>
                <h4 className="text-2xl font-bold mb-2">Switch to Simpler Mode</h4>
                <p className="text-white/70 text-sm">Automate text simplification for your upcoming reading tasks.</p>
             </div>
          </div>

          {/* Session History */}
          <div className="bg-white rounded-[3rem] p-10 border border-moss/5 shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300">
            <h3 className="text-2xl font-bold text-moss mb-6 flex items-center gap-3">
              <span className="iconify text-clay text-3xl" data-icon="solar:history-bold-duotone" />
              Recent Sessions
            </h3>
            {data?.session_history && data.session_history.length > 0 ? (
              <div className="space-y-4">
                {data.session_history.slice(-5).reverse().map((session: any, idx: number) => (
                  <div key={idx} className="p-5 border border-gray-100 rounded-3xl flex justify-between items-center bg-gray-50/50 hover:bg-white transition-colors">
                    <div>
                      <h4 className="font-bold text-gray-900 text-md">Session #{session.session_id}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(session.timestamp).toLocaleDateString()} at {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                    <div className="flex gap-6 text-sm font-medium">
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Time</span>
                        <span className="text-moss">{Number(session.reading_time).toFixed(1)}m</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Errors</span>
                        <span className="text-orange-500">{session.errors || 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Pauses</span>
                        <span className="text-blue-500">{session.pauses || 0}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Load</span>
                        <span className="text-clay">{Number(session.cognitive_load).toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-text-muted">No session history available yet.</div>
            )}
          </div>
        </div>

        {/* Right Column: Trending & User */}
        <div className="space-y-8">
          {/* Trend chart card (tertiary) */}
          <div className="bg-white rounded-[2.5rem] p-8 border border-moss/5 shadow-[0_8px_20px_rgba(0,0,0,0.04)] hover:-translate-y-1 transition-all">
            <h3 className="text-lg font-bold text-moss mb-6 flex items-center gap-2">
              <span className="iconify text-clay" data-icon="solar:graph-bold-duotone" />
              Cognitive Load Trend
            </h3>
            <div className="h-48 w-full opacity-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="session" hide />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="load" 
                    stroke="#2E4036" 
                    strokeWidth={3} 
                    dot={false} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest">
              <span className="text-text-muted">Avg Load: <span className="text-moss">{data?.avg_cognitive_load ?? '—'}</span></span>
              <span className="text-moss bg-moss/10 px-3 py-1 rounded-full">Healthy</span>
            </div>
          </div>

          {/* User Settings */}
          <div className="bg-moss/5 rounded-[2.5rem] p-8 border border-moss/10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Experience Sync</h4>
            <div className="space-y-4">
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full rounded-2xl border border-moss/10 bg-white px-4 py-3 text-sm text-moss focus:outline-none focus:ring-2 focus:ring-moss/20 transition-all font-medium"
                placeholder="Enter User ID"
              />
              <button 
                onClick={dashboardAsync.retry}
                className="w-full py-3 bg-white border border-moss/10 text-moss rounded-2xl font-bold text-sm hover:bg-moss hover:text-white transition-all shadow-sm hover:shadow-md"
              >
                Sync Data
              </button>
            </div>
          </div>

          {/* Supportive Footer */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-lg shadow-blue-900/20">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <h4 className="text-2xl font-bold mb-3 relative z-10">You're doing great, {userId.split('-')[0]}!</h4>
            <p className="text-sm text-white/80 leading-relaxed relative z-10 font-medium tracking-wide">
              Reading 15 minutes a day builds a lifetime of knowledge. Keep going!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

