export interface Scholarship {
  id: number;
  name: string;
  provider: string;
  institution: string | null;
  level: string | null;
  description: string;
  eligibility: string | null;
  essay_prompt: string | null;
  deadline: string | null;
  link: string | null;
  logo_url: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface UserProfile {
  bio: string;
  institution: string;
  field_of_study: string;
  country: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: UserProfile;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

// ─── AI Prep & Review ──────────────────────────────────────────────────────

export interface ApplicationGuide {
  id: number;
  scholarship: number;
  category: 'overview' | 'requirements' | 'essay_tips' | 'common_mistakes' | 'standing_out';
  content: string;  // Markdown
  created_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'ai';
  content: string;
  created_at: string;
}

export interface EssayFeedback {
  id: number;
  overall_score: number;  // 0-100
  structure_feedback: string;
  clarity_feedback: string;
  relevance_feedback: string;
  persuasiveness_feedback: string;
  grammar_feedback: string;
  strengths: string;  // JSON string
  improvements: string;  // JSON string
  next_steps: string;
  reviewed_at: string;
}

export interface AIReviewSession {
  id: number;
  scholarship: number;
  status: 'in_progress' | 'submitted' | 'reviewed' | 'archived';
  notes: string;
  feedback?: EssayFeedback;
  chat_messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

