import type {
  AnswerResponse,
  ChunkResponse,
  CompanionResponse,
  ConceptGraphResponse,
  DashboardResponse,
  DifficultyCheck,
  DocumentResponse,
  FlashcardResponse,
  HeatmapResponse,
  PracticeGameData,
  PracticeGameType,
  RewriteMode,
  RewriteResponse,
  SessionLogResponse,
  SessionSkillsResponse,
  SimplifyResponse,
  StartSessionResponse,
  TutorResponse,
  VocabCard,
} from '../types/api';

// In development the backend usually runs on localhost:8000. A production
// build needs VITE_API_URL; without it every call fails fast with
// ApiUnavailableError instead of hitting the static host.
const envUrl = ((import.meta.env.VITE_API_URL as string | undefined) || '').trim().replace(/\/+$/, '');
export const BASE_URL = envUrl || (import.meta.env.DEV ? 'http://localhost:8000' : '');
export const API_CONFIGURED = Boolean(BASE_URL);

export const UNAVAILABLE_MESSAGE =
  "NeuroRead can't reach its server right now, so this part is paused. Reading settings still work.";

export type UnavailableReason = 'not-configured' | 'timeout' | 'network' | 'not-an-api' | 'gateway';

export class ApiUnavailableError extends Error {
  reason: UnavailableReason;

  constructor(reason: UnavailableReason) {
    super(UNAVAILABLE_MESSAGE);
    this.name = 'ApiUnavailableError';
    this.reason = reason;
  }
}

/** A message that is safe to show a reader, whatever went wrong. */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof ApiUnavailableError) return err.message;
  return fallback;
}

function getStoredUserId(): string {
  return localStorage.getItem('user_id') || '';
}

export function ensureUserId(fallback = 'demo-user-001'): string {
  const existing = getStoredUserId();
  if (existing) return existing;
  localStorage.setItem('user_id', fallback);
  return fallback;
}

export function setUserId(userId: string): void {
  if (userId) localStorage.setItem('user_id', userId);
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: BodyInit;
  timeoutMs?: number;
}

async function rawFetch(path: string, { method = 'GET', headers, body, timeoutMs = 20000 }: RequestOptions = {}) {
  if (!API_CONFIGURED) throw new ApiUnavailableError('not-configured');

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${BASE_URL}${path}`, { method, headers, body, signal: controller.signal });
  } catch (e) {
    throw new ApiUnavailableError(e instanceof DOMException && e.name === 'AbortError' ? 'timeout' : 'network');
  } finally {
    clearTimeout(t);
  }
}

function errorDetail(data: unknown): string | null {
  if (data && typeof data === 'object') {
    const { detail, message } = data as { detail?: unknown; message?: unknown };
    const found = detail || message;
    if (found) return typeof found === 'string' ? found : JSON.stringify(found);
  }
  return typeof data === 'string' && data ? data : null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method || 'GET';
  const res = await rawFetch(path, options);

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  // A static host answering with its index.html means there is no API behind this URL.
  if (!isJson && contentType.includes('text/html')) {
    throw new ApiUnavailableError('not-an-api');
  }
  const data: unknown = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '');

  if (!res.ok) {
    if (res.status >= 502 && res.status <= 504) throw new ApiUnavailableError('gateway');
    throw new Error(`${method} ${path} failed (${res.status}): ${errorDetail(data) || res.statusText}`);
  }
  return data as T;
}

function postJson<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function checkHealth(): Promise<boolean> {
  const data = await request<{ status?: string } | null>('/health', { timeoutMs: 45000 });
  return data?.status === 'ok';
}

function mapProfile(profileLabel: string | undefined): string {
  const p = String(profileLabel || '').toLowerCase();
  if (p.includes('dyslexia')) return 'easy_read';
  if (p.includes('adhd') || p.includes('focus')) return 'focus';
  if (p.includes('technical') || p.includes('expert') || p.includes('academic')) return 'academic';
  return 'default';
}

// ─── Assistive APIs ──────────────────────────────────────────────

export async function simplifyText(
  text: string,
  profile?: string,
  user_id?: string,
  enable_dyslexia_support = true,
  enable_audio = false,
): Promise<SimplifyResponse> {
  const userId = user_id || getStoredUserId();
  return postJson('/assistive/simplify', {
    text,
    profile: mapProfile(profile),
    user_id: userId || undefined,
    enable_dyslexia_support: !!enable_dyslexia_support,
    enable_audio: !!enable_audio,
  });
}

export async function rewriteText(text: string, mode: RewriteMode = 'simpler'): Promise<RewriteResponse> {
  return postJson('/assistive/rewrite', { text, mode });
}

export async function generateVocabCard(word: string): Promise<VocabCard> {
  return postJson('/assistive/vocab-card', { word });
}

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  const form = new FormData();
  form.append('file', file);
  return request('/assistive/document', {
    method: 'POST',
    body: form,
  });
}

export type TutorMode = 'explain' | 'summarize' | 'example';

export async function askTutor(text: string, question: string, mode: TutorMode = 'explain'): Promise<TutorResponse> {
  return postJson('/assistive/tutor', { text, question, mode });
}

export async function fetchTTSAudio(text: string): Promise<Blob> {
  const res = await rawFetch('/assistive/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`TTS failed: ${res.status}`);
  return await res.blob();
}

export async function getDashboard(userId: string): Promise<DashboardResponse> {
  return request(`/analytics/dashboard/${encodeURIComponent(userId)}`);
}

export async function submitSessionLog(
  userId: string,
  readingTime: number,
  pauses: number,
  errors: number,
  difficultWordsCount = 0,
): Promise<SessionLogResponse> {
  return postJson('/analytics/session', {
    user_id: userId,
    reading_time: readingTime,
    pauses,
    errors,
    difficult_words_count: difficultWordsCount,
  });
}

export async function getHeatmap(text: string): Promise<HeatmapResponse> {
  return postJson('/assistive/heatmap', { text });
}

export async function getConceptGraph(text: string): Promise<ConceptGraphResponse> {
  return postJson('/assistive/concept-graph', { text });
}

export async function getChunks(text: string): Promise<ChunkResponse> {
  return postJson('/assistive/chunk', { text });
}

export async function askCompanion(text: string, user_action: string): Promise<CompanionResponse> {
  return postJson('/assistive/companion', { text, user_action });
}

// ─── Letter flashcards ───────────────────────────────────────────

export async function getFlashcard(letter: string): Promise<FlashcardResponse> {
  return postJson('/learning/flashcards', { letter });
}

// ─── Adaptive learning session and practice games ────────────────

export async function startLearningSession(
  userId: string,
  age: number,
  sessionType = 'learning',
): Promise<StartSessionResponse> {
  return postJson('/api/learning/session/start', { user_id: userId, age, session_type: sessionType });
}

export async function getSessionSkills(sessionId: string): Promise<SessionSkillsResponse> {
  return request(`/api/learning/session/${encodeURIComponent(sessionId)}/skills`);
}

export async function submitSessionAnswer(
  sessionId: string,
  exerciseId: string,
  answer: string,
  responseTimeMs: number,
): Promise<AnswerResponse> {
  return postJson(`/api/learning/session/${encodeURIComponent(sessionId)}/answer`, {
    exercise_id: exerciseId,
    answer,
    response_time_ms: responseTimeMs,
  });
}

export async function generatePracticeGame<G extends PracticeGameType>(gameType: G): Promise<PracticeGameData[G]> {
  return request(`/api/learning/practice/generate?game_type=${encodeURIComponent(gameType)}&t=${Date.now()}`);
}

export async function checkTextDifficulty(text: string, userAbility = 0.0): Promise<DifficultyCheck> {
  return postJson('/assistive/difficulty-check', { text, user_ability: userAbility });
}
