/** The NeuroRead mark: an N whose diagonal is the page of an open book. */
export default function Logo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4.5 8.5v17" />
      <path d="M27.5 8.5v17" />
      <path d="M9 26.5V5.5l14 21" />
      <path d="M23 26.5V9.5c-2.5-2.4-5.8-2.8-8.6-1.2" />
    </svg>
  );
}
