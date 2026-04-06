import { useEffect, useState } from 'react';
import { askCompanion } from '../../services/api';
import { useAsync } from '../../hooks/useAsync';

export default function CompanionAvatar({ text }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState('confused');
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const companionAsync = useAsync(askCompanion, { retries: 0 });

  useEffect(() => {
    if (!open) return;
    if (!text?.trim()) {
      setMessage('Paste some text and I’ll help you read it.');
      setSuggestions([]);
    }
  }, [open, text]);

  const run = async () => {
    const t = (text || '').trim();
    if (!t) return;
    try {
      const res = await companionAsync.run(t, action);
      setMessage(res?.message || '');
      setSuggestions(res?.suggestions || []);
    } catch (e) {
      setMessage('I’m having trouble connecting to the companion service.');
      setSuggestions([]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[70]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-moss text-cream shadow-lg border border-moss/30 flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Open reading companion"
      >
        <span className="iconify" data-icon="solar:chat-round-dots-linear" style={{ width: '1.4rem', height: '1.4rem' }} />
      </button>

      {open ? (
        <div className="mt-3 w-[320px] rounded-3xl bg-white border border-moss/10 shadow-[0_25px_80px_-25px_rgba(0,0,0,0.35)] p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-charcoal">Reading Companion</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full bg-moss/8 hover:bg-moss/15 flex items-center justify-center transition-colors border border-moss/10"
              aria-label="Close companion"
            >
              <span className="iconify text-charcoal/60" data-icon="solar:close-linear" style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="flex-1 rounded-xl border border-moss/15 bg-white px-3 py-2 text-xs text-charcoal focus:outline-none focus:ring-2 focus:ring-moss/20"
            >
              <option value="confused">I’m confused</option>
              <option value="explain">Explain</option>
              <option value="simplify">Suggest simplify</option>
            </select>
            <button
              type="button"
              onClick={run}
              disabled={companionAsync.loading || !text?.trim()}
              className="px-4 py-2 rounded-xl bg-clay text-cream text-xs font-medium uppercase tracking-wide disabled:opacity-60"
            >
              {companionAsync.loading ? '…' : 'Go'}
            </button>
          </div>

          <div className="rounded-2xl bg-moss/[0.03] border border-moss/10 p-4">
            <p className="text-xs text-charcoal/70 leading-relaxed">
              {message || 'Tell me what you need help with.'}
            </p>
            {suggestions?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-3 py-1 rounded-full bg-moss/8 text-moss border border-moss/15 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

