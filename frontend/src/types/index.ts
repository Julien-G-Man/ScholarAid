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
  is_staff: boolean;
  is_superuser: boolean;
  profile?: UserProfile;
}

// ─── Admin API ─────────────────────────────────────────────────────────────

export interface AdminStats {
  platform: {
    total_users: number;
    new_users_this_week: number;
    total_scholarships: number;
    newsletter_subscribers: number;
    total_contact_messages: number;
    unread_messages: number;
  };
  ai: {
    total_sessions: number;
    in_progress: number;
    submitted: number;
    reviewed: number;
    archived: number;
    avg_score: number;
    total_chat_messages: number;
    sessions_this_week: number;
  };
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  is_active: boolean;
  is_staff: boolean;
  sessions_total: number;
  sessions_reviewed: number;
  avg_score: number | null;
  questions_asked: number;
  last_active: string | null;
}

// ─── Messaging ─────────────────────────────────────────────────────────────

export interface Message {
  id: number;
  content: string;
  sender_id: number;
  sender_name: string;      // 'Support' when coming from admin
  is_mine: boolean;
  is_broadcast: boolean;
  is_read: boolean;
  from_user_id?: number | null;   // populated on admin socket for user→admin msgs
  from_username?: string | null;
  from_name?: string | null;
  created_at: string;
}

export interface AdminConversation {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  unread: number;
  last_message: { content: string; created_at: string; is_mine: boolean } | null;
}

export interface AdminUserDetail {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
    is_active: boolean;
    is_staff: boolean;
    profile: {
      institution: string;
      field_of_study: string;
      country: string;
      bio: string;
    };
  };
  sessions: Array<{
    id: number;
    scholarship_id: number;
    scholarship_name: string;
    status: 'in_progress' | 'submitted' | 'reviewed' | 'archived';
    notes: string;
    created_at: string;
    updated_at: string;
    feedback: {
      overall_score: number;
      structure_feedback: string;
      clarity_feedback: string;
      relevance_feedback: string;
      persuasiveness_feedback: string;
      grammar_feedback: string;
      strengths: string;
      improvements: string;
      next_steps: string;
      reviewed_at: string;
    } | null;
    chat_messages: Array<{
      id: number;
      role: 'user' | 'ai';
      content: string;
      created_at: string;
    }>;
  }>;
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

