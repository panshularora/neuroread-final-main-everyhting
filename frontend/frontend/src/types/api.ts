// Response shapes of the NeuroRead FastAPI backend, as used by the frontend.

export interface DifficultWord {
  word: string;
  start: number;
  end: number;
}

export interface SentenceScore {
  sentence: string;
  score: number;
  difficulty_label: string;
}

export interface TextAnalysis {
  readability_score: number;
  avg_sentence_length: number;
  complex_word_ratio: number;
  cognitive_load_score: number;
  difficulty_label: string;
  estimated_reading_time_minutes: number;
  difficult_words: DifficultWord[];
  sentence_heatmap: SentenceScore[];
}

export interface SimplifyResponse {
  status: 'success' | 'error';
  message?: string;
  simplified_text?: string;
  bullet_points?: string[];
  definitions?: Record<string, string>;
  step_by_step_explanation?: string[];
  original_analysis?: TextAnalysis;
  simplified_analysis?: TextAnalysis;
  cognitive_load_reduction?: number;
  impact_summary?: string;
  keywords?: string[];
}

export type RewriteMode = 'simpler' | 'academic' | 'child_friendly';

export interface RewriteItem {
  original: string;
  rewritten: string;
  explanation: string;
}

export interface RewriteResponse {
  rewrites: RewriteItem[];
}

export interface VocabCard {
  word: string;
  definition: string;
  simple_definition: string;
  example_sentence: string;
  synonyms: string[];
  difficulty_score: number;
}

export interface TutorResponse {
  answer: string;
  suggested_questions: string[];
  confidence_score: number;
}

export interface DocumentResponse {
  original_text: string;
  simplified_text: string;
  metrics: {
    cognitive_load: number;
    analysis: TextAnalysis;
  };
  keywords: string[];
}

export interface HeatmapSentence {
  sentence: string;
  score: number;
  difficulty: 'Low' | 'Medium' | 'High' | string;
  start: number;
  end: number;
}

export interface HeatmapResponse {
  heatmap: HeatmapSentence[];
}

export interface ConceptNode {
  id: string;
  type: string;
}

export interface ConceptEdge {
  source: string;
  target: string;
  relation: string;
}

export interface ConceptGraphResponse {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface TextChunk {
  text: string;
  type: string;
}

export interface ChunkResponse {
  chunks: TextChunk[];
}

export interface CompanionResponse {
  message: string;
  suggestions: string[];
}

export interface DifficultyCheck {
  fk_grade: number;
  irt_difficulty: number;
  user_ability: number;
  avg_sentence_length: number;
  grade_label: string;
  should_simplify: boolean;
  recommendation: string;
  sentence_count: number;
  word_count: number;
}

export interface SessionLogResponse {
  status: string;
  session_id: number;
  cognitive_load: number;
}

export interface DashboardSession {
  session_id: number;
  cognitive_load: number;
  reading_time: number;
  difficult_words_count: number;
  pauses: number;
  errors: number;
  timestamp: string;
}

export interface DashboardInsight {
  type: string;
  title: string;
  desc: string;
}

export interface DashboardResponse {
  avg_cognitive_load: number;
  improvement_trend: number[];
  session_history: DashboardSession[];
  difficulty_distribution: { low: number; moderate: number; high: number };
  insights: DashboardInsight[];
}

export interface FlashcardExample {
  word: string;
  audioUrl: string;
}

export interface FlashcardResponse {
  status: string;
  data: {
    letter: string;
    letterLower: string;
    sound: string;
    examples: string[];
    exampleDetails: FlashcardExample[];
    mnemonic: string;
    audioUrl: string;
    soundAudioUrl: string;
  };
  meta: {
    difficulty: string;
    level: number;
    totalLetters: number;
    letterIndex: number;
  };
}

// ─── Adaptive learning session ───────────────────────────────────

export interface Exercise {
  id: string;
  type: 'phonics' | 'spelling' | 'comprehension' | 'matching';
  prompt: string;
  options: string[];
  correct_answer: string;
  difficulty: number;
  target_skill: string;
  hint?: string;
}

export interface SessionStats {
  correct: number;
  total: number;
  streak: number;
  longest_streak: number;
}

export interface StartSessionResponse {
  session_id: string;
  first_exercise: Exercise;
  session_type: string;
}

export interface SkillState {
  name: string;
  display_name: string;
  p_know: number;
  mastered: boolean;
  sm2: {
    repetitions: number;
    easiness: number;
    last_interval: number;
    next_due: string | null;
    last_review: string | null;
  };
}

export interface SessionSkillsResponse {
  skills: SkillState[];
  irt_ability: number;
  session_stats: SessionStats;
}

export interface SkillUpdate {
  skill_name: string;
  p_know_before: number;
  p_know_after: number;
  mastered: boolean;
  delta: number;
  bkt_params: { p_transit: number; p_slip: number; p_guess: number };
}

export interface AnswerResponse {
  correct: boolean;
  explanation: string;
  next_exercise: Exercise;
  skill_update: SkillUpdate;
  sm2_update: {
    next_review_days: number;
    next_review_label: string;
    easiness_factor: number;
  };
  irt_update: {
    ability_before: number;
    ability_after: number;
    zpd_zone: string;
    zpd_label: string;
  };
  session_stats: SessionStats;
}

// ─── Practice games ──────────────────────────────────────────────

export interface DictationData { id: string; word: string }
export interface ErrorCorrectionData { id: string; sentence: string; incorrect: string; options: string[]; answer: string }
export interface WordSortingData {
  id: string;
  bucket1: string;
  bucket2: string;
  words: { word: string; bucket: 1 | 2 }[];
}
export interface SyllableTappingData { id: string; word: string; syllables: number }
export interface WordChainsData { id: string; chain: string[] }
export interface SentenceReconstructionData { id: string; words: string[] }
export interface RhymeFinderData { id: string; target: string; options: string[]; answers: string[] }
export interface FlashcardsData { id: string; word: string }
export interface HomophonesData { id: string; sentence: string; options: string[]; answer: string }

export interface PracticeGameData {
  dictation: DictationData;
  error_correction: ErrorCorrectionData;
  word_sorting: WordSortingData;
  syllable_tapping: SyllableTappingData;
  word_chains: WordChainsData;
  sentence_reconstruction: SentenceReconstructionData;
  rhyme_finder: RhymeFinderData;
  flashcards: FlashcardsData;
  homophones: HomophonesData;
}

export type PracticeGameType = keyof PracticeGameData;
