// Browser globals that TypeScript's DOM library does not describe.

interface SpeechRecognitionResultEventLike extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionLike {
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  start(): void;
}

interface Window {
  // Chrome and Edge only ship the prefixed constructor.
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  // Loaded from code.iconify.design in index.html; replaces <span class="iconify"> placeholders.
  Iconify?: { scan: (root?: HTMLElement) => void };
}
