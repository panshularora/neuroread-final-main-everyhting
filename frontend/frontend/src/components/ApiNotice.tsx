import { CloudOff, RotateCw } from 'lucide-react';
import { useApiStatus } from '../lib/useApiStatus';

type Props = {
  /** What stops working without the server, e.g. "Practice games". */
  feature?: string;
  className?: string;
  wrapperClassName?: string;
};

export default function ApiNotice({ feature, className = '', wrapperClassName }: Props) {
  const { status, recheck } = useApiStatus();
  if (status === 'online' || status === 'checking') return null;

  const what = feature ? `${feature} need` : 'Simplifying, lessons, games and progress need';

  const notice = (
    <div
      role="status"
      className={`flex flex-wrap items-start gap-3 rounded-2xl border border-warn/30 bg-warn/10 p-4 text-ink sm:flex-nowrap sm:gap-4 sm:p-5 ${className}`}
    >
      <CloudOff className="h-6 w-6 shrink-0 text-warn" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-bold">The NeuroRead server isn't connected</p>
        <p className="mt-1 text-sm text-muted">
          {status === 'unconfigured'
            ? `${what} the server, and this copy of the site doesn't have one connected yet.`
            : `${what} the server, which isn't responding. Free servers can take a minute to wake up.`}{' '}
          Reading settings still work.
        </p>
      </div>
      {status === 'offline' && (
        <button
          type="button"
          onClick={() => recheck()}
          className="ml-9 inline-flex items-center gap-2 self-start rounded-xl sm:ml-0 border border-line bg-surface px-4 py-2 text-sm font-bold hover:bg-ink/5"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          Try again
        </button>
      )}
    </div>
  );

  return wrapperClassName ? <div className={wrapperClassName}>{notice}</div> : notice;
}
