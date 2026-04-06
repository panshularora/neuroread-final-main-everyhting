import { motion, AnimatePresence } from 'framer-motion'
import { useAccessibilityStore } from '../../stores/accessibilityStore'

/**
 * Slide-out accessibility panel.
 * Triggered by the accessibility button (gear icon) in the top bar.
 * Does NOT replace any existing settings UI — it adds on top.
 */

const OVERLAY_OPTIONS = [
  { key: 'none',     label: 'Off',      color: 'transparent', border: '1px solid #ccc' },
  { key: 'cream',   label: 'Cream',    color: '#FFF8E7' },
  { key: 'yellow',   label: 'Yellow',   color: '#FFFACD' },
  { key: 'blue',     label: 'Blue',     color: '#E8F4FD' },
  { key: 'pink',     label: 'Pink',     color: '#FCE4EC' },
  { key: 'mint',     label: 'Mint',     color: '#98FB98' },
  { key: 'rose',     label: 'Rose',     color: '#FFB6C1' },
  { key: 'lavender', label: 'Lavender', color: '#E6BEFF' },
  { key: 'peach',    label: 'Peach',    color: '#FFDAB9' },
  { key: 'lime',     label: 'Lime',     color: '#C8FF96' },
]

const FONT_OPTIONS = [
  { key: 'system',      label: 'System font' },
  { key: 'opendyslexic', label: 'OpenDyslexic' },
  { key: 'arial',       label: 'Arial' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function AccessibilityPanel({ isOpen, onClose }: Props) {
  const store = useAccessibilityStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
              zIndex: 10000,
            }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 320,
              background: '#fff', zIndex: 10001, overflowY: 'auto',
              padding: '1.5rem', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>Reading settings</h2>
              <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Font */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 8 }}>Font</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {FONT_OPTIONS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => store.setFont(f.key as any)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, border: 'none',
                      background: store.font === f.key ? '#2d6a4f' : '#f0f0f0',
                      color: store.font === f.key ? '#fff' : '#333',
                      cursor: 'pointer', fontSize: 13, fontWeight: 500,
                      fontFamily: f.key === 'opendyslexic' ? 'OpenDyslexic, sans-serif' : 'inherit',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Font size */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 8 }}>
                Text size — {store.fontSize}px
              </label>
              <input
                type="range" min={14} max={24} step={1}
                value={store.fontSize}
                onChange={e => store.setFontSize(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </section>

            {/* Line height */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 8 }}>
                Line spacing — {store.lineHeight.toFixed(1)}
              </label>
              <input
                type="range" min={1.5} max={2.2} step={0.1}
                value={store.lineHeight}
                onChange={e => store.setLineHeight(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </section>

            {/* Letter spacing */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 8 }}>
                Letter spacing — {store.letterSpacing.toFixed(2)}em
              </label>
              <input
                type="range" min={0} max={0.2} step={0.01}
                value={store.letterSpacing}
                onChange={e => store.setLetterSpacing(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </section>

            {/* Color overlay */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 8 }}>
                Color overlay
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {OVERLAY_OPTIONS.map(o => (
                  <button
                    key={o.key}
                    onClick={() => store.setColorOverlay(o.key as any)}
                    title={o.label}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: o.color || 'transparent',
                      border: store.colorOverlay === o.key
                        ? '2.5px solid #2d6a4f'
                        : (o.border || '1.5px solid #ddd'),
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
              {store.colorOverlay !== 'none' && (
                <>
                  <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 4 }}>
                    Opacity — {Math.round(store.overlayOpacity * 100)}%
                  </label>
                  <input
                    type="range" min={0.05} max={0.25} step={0.01}
                    value={store.overlayOpacity}
                    onChange={e => store.setOverlayOpacity(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </>
              )}
            </section>

            {/* Reading ruler */}
            <section style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, color: '#666' }}>Reading ruler</label>
                <button
                  onClick={() => store.setRulerEnabled(!store.rulerEnabled)}
                  style={{
                    padding: '4px 14px', borderRadius: 20, border: 'none',
                    background: store.rulerEnabled ? '#2d6a4f' : '#e0e0e0',
                    color: store.rulerEnabled ? '#fff' : '#555',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  {store.rulerEnabled ? 'On' : 'Off'}
                </button>
              </div>
            </section>

            {/* TTS speed */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 8 }}>
                Reading speed — {store.ttsSpeed.toFixed(1)}×
              </label>
              <input
                type="range" min={0.5} max={1.5} step={0.1}
                value={store.ttsSpeed}
                onChange={e => store.setTtsSpeed(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </section>

            {/* Reading chunks */}
            <section style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: 13, color: '#666', display: 'block', marginBottom: 8 }}>
                Reading chunks
              </label>
              {(['sentence', 'two-sentences', 'paragraph'] as const).map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="chunksize"
                    checked={store.chunkSize === c}
                    onChange={() => store.setChunkSize(c)}
                  />
                  <span style={{ fontSize: 14 }}>
                    {c === 'sentence' ? 'One sentence at a time'
                      : c === 'two-sentences' ? 'Two sentences at a time'
                      : 'Full paragraph'}
                  </span>
                </label>
              ))}
            </section>

            {/* Colored letters toggle */}
            <section style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: 13, color: '#666', display: 'block' }}>b/d/p/q letter colors</label>
                  <span style={{ fontSize: 11, color: '#999' }}>Helps distinguish similar letters</span>
                </div>
                <button
                  onClick={() => store.setColoredLetters(!store.coloredLetters)}
                  style={{
                    padding: '4px 14px', borderRadius: 20, border: 'none',
                    background: store.coloredLetters ? '#2d6a4f' : '#e0e0e0',
                    color: store.coloredLetters ? '#fff' : '#555',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  {store.coloredLetters ? 'On' : 'Off'}
                </button>
              </div>
              {store.coloredLetters && (
                <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                  {[['b','#4A90D9'],['d','#E8734A'],['p','#9B59B6'],['q','#27AE60']].map(([letter, color]) => (
                    <span key={letter} style={{ fontWeight: 700, color: color as string, fontSize: 16 }}>{letter}</span>
                  ))}
                </div>
              )}
            </section>

            {/* Chunk reading toggle */}
            <section style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: 13, color: '#666', display: 'block' }}>Chunk reading</label>
                  <span style={{ fontSize: 11, color: '#999' }}>One sentence at a time</span>
                </div>
                <button
                  onClick={() => store.setChunkReading(!store.chunkReading)}
                  style={{
                    padding: '4px 14px', borderRadius: 20, border: 'none',
                    background: store.chunkReading ? '#2d6a4f' : '#e0e0e0',
                    color: store.chunkReading ? '#fff' : '#555',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  {store.chunkReading ? 'On' : 'Off'}
                </button>
              </div>
            </section>

            {/* Dark mode toggle */}
            <section style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 13, color: '#666' }}>Dark mode</label>
                <button
                  onClick={() => store.setDarkMode(!store.darkMode)}
                  style={{
                    padding: '4px 14px', borderRadius: 20, border: 'none',
                    background: store.darkMode ? '#2d6a4f' : '#e0e0e0',
                    color: store.darkMode ? '#fff' : '#555',
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  {store.darkMode ? 'On' : 'Off'}
                </button>
              </div>
            </section>

            {/* Reset to defaults */}
            <section style={{ paddingTop: '1rem', borderTop: '1px solid #f0f0f0' }}>
              <button
                onClick={() => store.resetToDefaults()}
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  border: '1px solid #ddd', background: '#f9f9f9',
                  color: '#666', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                ↩ Reset to defaults
              </button>
            </section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
