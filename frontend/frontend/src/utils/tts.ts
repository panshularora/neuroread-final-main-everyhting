/**
 * Web Speech API wrapper for NeuroRead.
 * Provides word-level synchronization via SpeechSynthesisUtterance boundary events.
 * This is what makes TTS genuinely accessible for dyslexic readers —
 * the eye follows the highlighted word, reducing tracking load.
 */

export interface TTSOptions {
  rate?: number      // 0.5 - 1.5, default 0.85
  pitch?: number     // 0.5 - 2.0, default 1.0
  voice?: string     // voice name, optional
}

export interface TTSController {
  play: () => void
  pause: () => void
  stop: () => void
  isPlaying: boolean
}

/**
 * Speaks text and calls onWordBoundary(charIndex, wordLength) on each word.
 * Returns a controller to pause/resume/stop.
 * 
 * Usage:
 *   const ctrl = speakWithSync(text, { rate: 0.85 }, (charIndex, len) => {
 *     highlightChars(charIndex, charIndex + len)
 *   })
 */
export function speakWithSync(
  text: string,
  options: TTSOptions = {},
  onWordBoundary?: (charIndex: number, wordLength: number) => void,
  onEnd?: () => void
): TTSController {
  if (!window.speechSynthesis) {
    console.warn('Web Speech API not supported in this browser')
    return { play: () => {}, pause: () => {}, stop: () => {}, isPlaying: false }
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = options.rate ?? 0.85
  utterance.pitch = options.pitch ?? 1.0

  if (options.voice) {
    const voices = window.speechSynthesis.getVoices()
    const match = voices.find(v => v.name === options.voice)
    if (match) utterance.voice = match
  }

  let playing = false

  utterance.addEventListener('boundary', (event: SpeechSynthesisEvent) => {
    if (event.name === 'word' && onWordBoundary) {
      onWordBoundary(event.charIndex, event.charLength ?? 0)
    }
  })

  utterance.addEventListener('end', () => {
    playing = false
    onEnd?.()
  })

  utterance.addEventListener('start', () => {
    playing = true
  })

  const controller: TTSController = {
    get isPlaying() { return playing },
    play() {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      } else {
        window.speechSynthesis.speak(utterance)
      }
      playing = true
    },
    pause() {
      window.speechSynthesis.pause()
      playing = false
    },
    stop() {
      window.speechSynthesis.cancel()
      playing = false
    }
  }

  return controller
}

/**
 * Simple one-shot TTS with no sync — for short instructions and feedback.
 * Use speakWithSync for reading passages.
 */
export function speak(text: string, rate: number = 0.9): void {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.rate = rate
  window.speechSynthesis.speak(u)
}
