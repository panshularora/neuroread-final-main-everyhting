import { useEffect, useMemo, useState } from 'react';

export default function Navbar({ mode, onModeChange, onNavigate }: { mode: string, onModeChange: (m: string) => void, onNavigate?: (target: string) => void }) {
  const [scrolled, setScrolled] = useState(false);


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);



  const isTransparent = !scrolled && mode === 'assistive';

  const className = useMemo(() => {
    const base = 'fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 rounded-full px-8 py-3.5 flex items-center justify-between w-[95%] max-w-6xl';
    if (isTransparent) return `${base} bg-transparent text-white`;
    return `${base} bg-white/95 backdrop-blur-[16px] text-moss border border-black/10 shadow-md translate-y-2`;
  }, [isTransparent]);

  const getLinkClass = (linkMode: string) => {
    const base = 'transition-all duration-300';
    const hover = isTransparent ? 'hover:text-white' : 'hover:text-moss';
    const active = mode === linkMode ? (isTransparent ? 'text-white' : 'text-moss') : '';
    return `${base} ${hover} ${active}`;
  };

  return (
    <nav id="navbar" className={className}>
      <div className="flex items-center">
        <a 
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onModeChange('assistive');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex items-center gap-3 uppercase text-sm font-medium tracking-[0.5em] hover:opacity-80 transition-opacity cursor-pointer flex-shrink-0 ${isTransparent ? "text-white" : "text-moss"}`}
        >
          <img src="/neuroread_logo.png" alt="Neuroread Logo" className={`h-8 w-auto object-contain transition-all duration-500 ${isTransparent ? "brightness-0 invert" : ""}`} />
          <span className="hidden sm:inline">N e u r o r e a d</span>
        </a>
      </div>

      <div className="flex items-center gap-6">


        <div className={`hidden md:flex items-center gap-8 font-medium text-xs tracking-[0.2em] uppercase transition-colors duration-500 ${isTransparent ? "text-white/80" : "text-moss/60"}`}>
          <a
            href="#assistive-mode-section"
            onClick={(e) => {
              e.preventDefault();
              onModeChange('assistive');
              setTimeout(() => {
                const el = document.getElementById('assistive-mode-section');
                if (el) {
                  const y = el.getBoundingClientRect().top + window.scrollY - 140; // Offset for fixed navbar + padding
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }, 100);
              onNavigate?.('modes');
            }}
            className={getLinkClass('assistive')}
          >
            ASSIST
          </a>
          <a
            href="#modes"
            onClick={(e) => {
              e.preventDefault();
              onModeChange('learning');
              onNavigate?.('modes');
            }}
            className={getLinkClass('learning')}
          >
            LEARNING
          </a>
          <a
            href="#modes"
            onClick={(e) => {
              e.preventDefault();
              onModeChange('practice');
              onNavigate?.('modes');
            }}
            className={getLinkClass('practice')}
          >
            PRACTICE
          </a>
          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              onModeChange('dashboard');
              onNavigate?.('dashboard');
            }}
            className={getLinkClass('dashboard')}
          >
            DASHBOARD
          </a>
        </div>
      </div>
    </nav>
  );
}

