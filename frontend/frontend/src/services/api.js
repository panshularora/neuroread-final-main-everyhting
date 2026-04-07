export const BASE_URL = import.meta.env.VITE_API_URL;

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

async function request(path, { method = 'GET', headers, body } = {}) {
  // eslint-disable-next-line no-console
  console.debug('[api]', method, path);
  const controller = new AbortController();
  const timeoutMs = 20000;
  const t = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
  } catch (e) {
    if (e?.name === 'AbortError') {
      throw new Error(`${method} ${path} timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    throw e;
  } finally {
    clearTimeout(t);
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && (data.detail || data.message)) ||
      (typeof data === 'string' && data) ||
      res.statusText;
    throw new Error(`${method} ${path} failed (${res.status}): ${msg}`);
  }

  // eslint-disable-next-line no-console
  console.debug('[api:ok]', method, path);
  return data;
}

function mapProfile(profileLabel) {
  const p = String(profileLabel || '').toLowerCase();
  if (p.includes('dyslexia')) return 'easy_read';
  if (p.includes('adhd') || p.includes('focus')) return 'focus';
  if (p.includes('technical') || p.includes('expert') || p.includes('academic')) return 'academic';
  return 'default';
}

// ─── Assistive APIs ──────────────────────────────────────────────

export async function simplifyText(text, profile, user_id) {
  const userId = user_id || getStoredUserId();
  return request('/assistive/simplify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      profile: mapProfile(profile),
      user_id: userId || undefined,
      enable_dyslexia_support: true,
      enable_audio: false,
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
  const res = await fetch(`${BASE_URL}/assistive/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    throw new Error(`TTS failed: ${res.statusText}`);
  }
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
