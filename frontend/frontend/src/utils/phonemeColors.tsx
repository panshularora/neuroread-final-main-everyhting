import React from 'react'

export const PHONEME_COLORS: Record<string, string> = {
  b: '#1565C0',   // deep blue — distinct from black text
  d: '#E65100',   // deep orange
  p: '#6A1B9A',   // deep purple
  q: '#2E7D32',   // deep green
  m: '#00695C',   // deep teal
  n: '#B71C1C',   // deep red
} as const

/**
 * Splits a word into letter spans, applying PHONEME_COLORS
 * to confusable letters. Used in EVERY component that renders words.
 * Research basis: implicit color-letter association reduces b/d confusion
 * faster than phonics drilling alone (Singleton & Trotter, 2005).
 */
export function colorizeWord(
  word: string,
  baseStyle?: React.CSSProperties
): React.ReactElement {
  return (
    <span style={baseStyle}>
      {word.split('').map((char, i) => {
        const lower = char.toLowerCase()
        const color = PHONEME_COLORS[lower]
        return (
          <span
            key={i}
            style={color ? { color, fontWeight: 600 } : undefined}
          >
            {char}
          </span>
        )
      })}
    </span>
  )
}

/**
 * Colorizes an entire text string, word by word.
 * Returns an array of React elements (one per word + space).
 */
export function colorizeText(text: string): React.ReactElement[] {
  const words = text.split(' ')
  return words.flatMap((word, wi) => {
    const elements: React.ReactElement[] = [
      <span key={`w-${wi}`}>{colorizeWord(word)}</span>
    ]
    if (wi < words.length - 1) {
      elements.push(<span key={`s-${wi}`}> </span>)
    }
    return elements
  })
}
