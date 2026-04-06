import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AccessibilityMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem('fontSize')) || 0);
  const [letterSpacing, setLetterSpacing] = useState(() => Number(localStorage.getItem('letterSpacing')) || 0);
  const [lineSpacing, setLineSpacing] = useState(() => Number(localStorage.getItem('lineSpacing')) || 1.5);
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('fontFamily') || 'default');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme-style') || 'beige');

  useEffect(() => {
    const html = document.documentElement;
    html.style.setProperty('--font-scale', fontSize.toString());
    html.style.setProperty('--letter-spacing', letterSpacing.toString());
    html.style.setProperty('--line-spacing', lineSpacing.toString());
    
    html.classList.remove('font-dyslexic');
    if (fontFamily === 'dyslexic') html.classList.add('font-dyslexic');

    // Theme application
    html.classList.remove('theme-green', 'theme-blue', 'theme-beige', 'theme-pink');
    html.classList.add(`theme-${theme}`);
    
    localStorage.setItem('fontSize', fontSize.toString());
    localStorage.setItem('letterSpacing', letterSpacing.toString());
    localStorage.setItem('lineSpacing', lineSpacing.toString());
    localStorage.setItem('fontFamily', fontFamily);
    localStorage.setItem('theme-style', theme);
  }, [fontSize, letterSpacing, lineSpacing, fontFamily, theme]);

  const themes = [
    { id: 'beige', name: 'Warm Beige', color: '#FDFBF7' },
    { id: 'green', name: 'Soft Green', color: '#F5FFFA' },
    { id: 'blue', name: 'Soft Blue', color: '#F0F8FF' },
    { id: 'pink', name: 'Soft Pink', color: '#FFF0F5' },
    { id: 'dark', name: 'Dark Mode', color: '#1A1A1A' }
  ];

  return (
    <>
      {/* Floating Trigger */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed right-6 bottom-24 z-[100] w-14 h-14 rounded-2xl bg-moss text-cream shadow-lg flex items-center justify-center border border-white/20"
      >
        <span className="iconify text-2xl" data-icon="solar:accessibility-bold-duotone" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[110]"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-[120] flex flex-col p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-medium text-moss flex items-center gap-3">
                  <span className="iconify text-clay" data-icon="solar:settings-bold-duotone" />
                  Accessibility
                </h2>
                <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full hover:bg-moss/5 flex items-center justify-center transition-colors">
                  <span className="iconify text-xl" data-icon="solar:close-circle-linear" />
                </button>
              </div>

              <div className="space-y-10">
                {/* 1. Typography Selection */}
                <section>
                  <label className="text-xs font-mono uppercase tracking-widest text-text-muted mb-4 block">Dyslexia-Friendly Font</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setFontFamily('default')}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${fontFamily === 'default' ? 'border-moss bg-moss text-white shadow-md' : 'border-moss/10 hover:border-moss/30'}`}
                    >
                      Default
                    </button>
                    <button
                      onClick={() => setFontFamily('dyslexic')}
                      className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all font-dyslexic ${fontFamily === 'dyslexic' ? 'border-clay bg-clay text-white shadow-md' : 'border-moss/10 hover:border-moss/30'}`}
                    >
                      OpenDyslexic
                    </button>
                  </div>
                </section>

                {/* 2. Range Controls */}
                <section className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-4">
                      <label className="text-xs font-mono uppercase tracking-widest text-text-muted">Text Size</label>
                      <span className="text-xs bg-clay/10 text-clay px-2 py-0.5 rounded-full">{fontSize > 0 ? `+${fontSize}` : fontSize}</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="6"
                      step="1"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-clay"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-4">
                      <label className="text-xs font-mono uppercase tracking-widest text-text-muted">Letter Spacing</label>
                      <span className="text-xs bg-moss/10 text-moss px-2 py-0.5 rounded-full">{letterSpacing > 0 ? `+${letterSpacing}` : letterSpacing}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={letterSpacing}
                      onChange={(e) => setLetterSpacing(Number(e.target.value))}
                      className="w-full accent-moss"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-4">
                      <label className="text-xs font-mono uppercase tracking-widest text-text-muted">Line Spacing</label>
                      <span className="text-xs bg-moss/10 text-moss px-2 py-0.5 rounded-full">{lineSpacing}x</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.1"
                      value={lineSpacing}
                      onChange={(e) => setLineSpacing(Number(e.target.value))}
                      className="w-full accent-moss"
                    />
                  </div>
                </section>

                {/* 3. Themes */}
                <section>
                  <label className="text-xs font-mono uppercase tracking-widest text-text-muted mb-4 block">Color Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          if (t.id === 'dark') {
                             document.documentElement.classList.add('dark');
                          } else {
                             document.documentElement.classList.remove('dark');
                          }
                          setTheme(t.id);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs transition-all ${theme === t.id ? 'border-moss bg-moss/5 scale-[1.02]' : 'border-moss/10 hover:border-moss/20'}`}
                      >
                        <div className="w-5 h-5 rounded-full border border-black/5" style={{ backgroundColor: t.color }} />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </section>

              </div>

              <div className="mt-auto pt-10 text-center">
                <button
                  onClick={() => {
                    setFontSize(0);
                    setLetterSpacing(0);
                    setLineSpacing(1.5);
                    setFontFamily('default');
                    setTheme('beige');
                    document.documentElement.classList.remove('dark');
                  }}
                  className="text-xs font-medium text-moss/40 hover:text-moss underline decoration-dotted underline-offset-4"
                >
                  Reset to Default
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessibilityMenu;
