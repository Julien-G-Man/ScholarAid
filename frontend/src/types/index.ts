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

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}
