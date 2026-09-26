// In development the backend usually runs on localhost:8000. A production
// build needs VITE_API_URL; without it every call fails fast with
// ApiUnavailableError instead of hitting the static host.
const envUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
export const BASE_URL = envUrl || (import.meta.env.DEV ? 'http://localhost:8000' : '');
export const API_CONFIGURED = Boolean(BASE_URL);

export const UNAVAILABLE_MESSAGE =
  "NeuroRead can't reach its server right now, so this part is paused. Reading settings still work.";

export class ApiUnavailableError extends Error {
  constructor(reason) {
    super(UNAVAILABLE_MESSAGE);
    this.name = 'ApiUnavailableError';
    this.reason = reason;
  }
}

/** A message that is safe to show a reader, whatever went wrong. */
export function friendlyError(err, fallback = 'Something went wrong. Please try again.') {
  if (err instanceof ApiUnavailableError) return err.message;
  return fallback;
}

function getStoredUserId() {
  return localStorage.getItem('user_id') || '';
}

export function ensureUserId(fallback = 'demo-user-001') {
  const existing = getStoredUserId();
  if (existing) return existing;
  localStorage.setItem('user_id', fallback);
  return fallback;
}

export function setUserId(userId) {
  if (userId) localStorage.setItem('user_id', userId);
}

async function rawFetch(path, { method = 'GET', headers, body, timeoutMs = 20000 } = {}) {
  if (!API_CONFIGURED) throw new ApiUnavailableError('not-configured');

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${BASE_URL}${path}`, { method, headers, body, signal: controller.signal });
  } catch (e) {
    throw new ApiUnavailableError(e?.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(t);
  }
}

export async function request(path, options = {}) {
  const method = options.method || 'GET';
  const res = await rawFetch(path, options);

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  // A static host answering with its index.html means there is no API behind this URL.
  if (!isJson && (res.headers.get('content-type') || '').includes('text/html')) {
    throw new ApiUnavailableError('not-an-api');
  }
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

  if (!res.ok) {
    if (res.status >= 502 && res.status <= 504) throw new ApiUnavailableError('gateway');
    const msg =
      (data && typeof data === 'object' && (data.detail || data.message)) ||
      (typeof data === 'string' && data) ||
      res.statusText;
    throw new Error(`${method} ${path} failed (${res.status}): ${msg}`);
  }
  return data;
}

export async function checkHealth() {
  const data = await request('/health', { timeoutMs: 45000 });
  return data?.status === 'ok';
}

function mapProfile(profileLabel) {
  const p = String(profileLabel || '').toLowerCase();
  if (p.includes('dyslexia')) return 'easy_read';
  if (p.includes('adhd') || p.includes('focus')) return 'focus';
  if (p.includes('technical') || p.includes('expert') || p.includes('academic')) return 'academic';
  return 'default';
}

// ─── Assistive APIs ──────────────────────────────────────────────

export async function postSimplify({ text, profile, user_id, enable_dyslexia_support, enable_audio }) {
  return simplifyText(text, profile, user_id, enable_dyslexia_support, enable_audio);
}

export async function simplifyText(text, profile, user_id, enable_dyslexia_support = true, enable_audio = false) {
  const userId = user_id || getStoredUserId();
  return request('/assistive/simplify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      profile: mapProfile(profile),
      user_id: userId || undefined,
      enable_dyslexia_support: !!enable_dyslexia_support,
      enable_audio: !!enable_audio,
    }),
  });
}

export async function rewriteText(text, mode = 'simpler') {
  return request('/assistive/rewrite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mode }),
  });
}

export async function generateVocabCard(word) {
  return request('/assistive/vocab-card', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });
}

export async function uploadDocument(file) {
  const form = new FormData();
  form.append('file', file);
  return request('/assistive/document', {
    method: 'POST',
    body: form,
  });
}

export async function askTutor(text, question, mode = 'explain') {
  return request('/assistive/tutor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, question, mode }),
  });
}

export async function fetchTTSAudio(text) {
  const res = await rawFetch('/assistive/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  return await res.blob();
}

export async function getDashboard(userId) {
  return request(`/analytics/dashboard/${encodeURIComponent(userId)}`);
}

export async function submitSessionLog(userId, readingTime, pauses, errors, difficultWordsCount = 0) {
  return request('/analytics/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, reading_time: readingTime, pauses, errors, difficult_words_count: difficultWordsCount }),
  });
}

export async function getHeatmap(text) {
  return request('/assistive/heatmap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export async function getConceptGraph(text) {
  return request('/assistive/concept-graph', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export async function getChunks(text) {
  return request('/assistive/chunk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export async function getDifficultyPrediction(userId) {
  return request(`/personalization/difficulty/${encodeURIComponent(userId)}`);
}

export async function askCompanion(text, user_action) {
  return request('/assistive/companion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, user_action }),
  });
}

export async function updatePersonalization(userId, session_metrics) {
  return request('/personalization/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, session_metrics }),
  });
}

// ─── Legacy Learning APIs (kept for backward compat) ─────────────

export async function getPhonics(word) {
  return request('/learning/phonics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });
}

export async function getLearningExercise(text, blanks = 3) {
  return request('/learning/exercise', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, blanks }),
  });
}

export async function getSpellingPractice(text, max_words = 5) {
  return request('/learning/spelling', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, max_words }),
  });
}

export async function getComprehension(text, max_questions = 3) {
  return request('/learning/comprehension', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, max_questions }),
  });
}

// ─── New Learning APIs ───────────────────────────────────────────

export async function getFlashcard(letter) {
  return request('/learning/flashcards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ letter }),
  });
}

export async function getSoundMatch(sound) {
  return request('/learning/sound-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sound }),
  });
}

export async function getBuildWord(word) {
  return request('/learning/build-word', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });
}

export async function getRhyme(word) {
  return request('/learning/rhyme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });
}

export async function getPictureMatch(word) {
  return request('/learning/picture-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });
}

export async function getLesson(userId) {
  return request(`/learning/lesson/${encodeURIComponent(userId)}`);
}

export async function getLearningProgress(userId) {
  return request(`/learning/progress/${encodeURIComponent(userId)}`);
}

export async function updateLearningProgress(userId, exercise, correct) {
  return request('/learning/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, exercise, correct }),
  });
}

export async function checkAnswer(gameType, userAnswer, correctAnswer, gameContext = null) {
  return request('/learning/check-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameType, userAnswer, correctAnswer, gameContext }),
  });
}

// ─── Adaptive learning session and practice games ────────────────

export async function startLearningSession(userId, age, sessionType = 'learning') {
  return request('/api/learning/session/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, age, session_type: sessionType }),
  });
}

export async function getSessionSkills(sessionId) {
  return request(`/api/learning/session/${encodeURIComponent(sessionId)}/skills`);
}

export async function submitSessionAnswer(sessionId, exerciseId, answer, responseTimeMs) {
  return request(`/api/learning/session/${encodeURIComponent(sessionId)}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, answer, response_time_ms: responseTimeMs }),
  });
}

export async function generatePracticeGame(gameType) {
  return request(`/api/learning/practice/generate?game_type=${encodeURIComponent(gameType)}&t=${Date.now()}`);
}

export async function checkTextDifficulty(text, userAbility = 0.0) {
  return request('/assistive/difficulty-check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, user_ability: userAbility }),
  });
}
