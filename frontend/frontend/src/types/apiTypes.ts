// Request payload for /simplify
export interface SimplifyRequest {
  text: string;
  profile: UserProfile;
  user_id?: string;                 // optional (backend allows None)
  level?: number | null;            // optional
  enable_dyslexia_support?: boolean; 
  enable_audio?: boolean;
}
// Allowed reading profiles
export type UserProfile = 'default' | 'focus' | 'easy_read' | 'academic';

// Response from /simplify endpoint
export interface SimplifyResponse {
  auto_selected_level: number;
  profile_used: string;
  overload_warning: string | null;
  isolation_mode: boolean;
  original_analysis: any;
  simplified_text: string;
  dyslexia_optimized_text: string | null;
  audio_mode: any;
  simplified_analysis: any;
  cognitive_load_reduction: number;
  impact_summary: string;
  audio_file: string;

  // ✅ Frontend-derived (not from backend)
  cognitive_score?: number;
  reading_time?: number;
  difficulty?: string;
  reduction_percent?: number;
}
// Response from /progress/{user_id}
export interface ProgressResponse {
  total_sessions: number;
  average_cognitive_score: number;
  last_score: number;
  preferred_level: string;
}

