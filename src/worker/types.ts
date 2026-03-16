export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

export type AgeRange = '3-5' | '6-8' | '9-12';

export type Visibility = 'private' | 'public' | 'link';

export interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  age_range: AgeRange;
  visibility: Visibility;
  share_token: string | null;
  cover_image_url: string | null;
  cover_image_attribution: string | null;
  chapter_count: number;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  content: string;
  user_prompt: string | null;
  created_at: string;
}

export interface BookWithChapters extends Book {
  chapters: Chapter[];
}

export interface GeneratedChapter {
  title: string;
  content: string;
}

export interface StoryDirection {
  id: string;
  summary: string;
  preview: string;
}

export interface ResolvedImage {
  url: string;
  thumbnailUrl: string;
  alt: string;
  attribution: string;
  width: number;
  height: number;
}
