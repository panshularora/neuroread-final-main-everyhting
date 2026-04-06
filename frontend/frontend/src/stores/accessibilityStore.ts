import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type FontOption = 'system' | 'opendyslexic' | 'arial'
type OverlayColor = 'none'|'cream'|'yellow'|'blue'|'pink'|'mint'|'rose'|'lavender'|'peach'|'lime'
type ChunkSize = 'sentence' | 'two-sentences' | 'paragraph'

interface AccessibilityStore {
  font: FontOption
  fontSize: number
  lineHeight: number
  letterSpacing: number
  wordSpacing: number
  colorOverlay: OverlayColor
  overlayOpacity: number
  rulerEnabled: boolean
  ttsEnabled: boolean
  ttsSpeed: number
  chunkSize: ChunkSize
  coloredLetters: boolean  // b/d/p/q coloring
  chunkReading: boolean    // show one sentence at a time
  darkMode: boolean

  setFont: (v: FontOption) => void
  setFontSize: (v: number) => void
  setLineHeight: (v: number) => void
  setLetterSpacing: (v: number) => void
  setWordSpacing: (v: number) => void
  setColorOverlay: (v: OverlayColor) => void
  setOverlayOpacity: (v: number) => void
  setRulerEnabled: (v: boolean) => void
  setTtsEnabled: (v: boolean) => void
  setTtsSpeed: (v: number) => void
  setChunkSize: (v: ChunkSize) => void
  setColoredLetters: (v: boolean) => void
  setChunkReading: (v: boolean) => void
  setDarkMode: (v: boolean) => void
  resetToDefaults: () => void
}

export const useAccessibilityStore = create<AccessibilityStore>()(
  persist(
    (set) => ({
      font: 'system',
      fontSize: 18,
      lineHeight: 1.8,
      letterSpacing: 0.12,
      wordSpacing: 0.16,
      colorOverlay: 'none',
      overlayOpacity: 0.10,
      rulerEnabled: false,
      ttsEnabled: true,
      ttsSpeed: 0.85,
      chunkSize: 'sentence',
      coloredLetters: false,
      chunkReading: false,
      darkMode: false,

      setFont: (v) => set({ font: v }),
      setFontSize: (v) => set({ fontSize: v }),
      setLineHeight: (v) => set({ lineHeight: v }),
      setLetterSpacing: (v) => set({ letterSpacing: v }),
      setWordSpacing: (v) => set({ wordSpacing: v }),
      setColorOverlay: (v) => set({ colorOverlay: v }),
      setOverlayOpacity: (v) => set({ overlayOpacity: v }),
      setRulerEnabled: (v) => set({ rulerEnabled: v }),
      setTtsEnabled: (v) => set({ ttsEnabled: v }),
      setTtsSpeed: (v) => set({ ttsSpeed: v }),
      setChunkSize: (v) => set({ chunkSize: v }),
      setColoredLetters: (v) => set({ coloredLetters: v }),
      setChunkReading: (v) => set({ chunkReading: v }),
      setDarkMode: (v) => set({ darkMode: v }),
      resetToDefaults: () => set({
        font: 'system',
        fontSize: 18,
        lineHeight: 1.8,
        letterSpacing: 0.12,
        wordSpacing: 0.16,
        colorOverlay: 'none',
        overlayOpacity: 0.10,
        rulerEnabled: false,
        ttsEnabled: true,
        ttsSpeed: 0.85,
        chunkSize: 'sentence',
        coloredLetters: false,
        chunkReading: false,
        darkMode: false,
      }),
    }),
    { name: 'neuroread-accessibility' }
  )
)
