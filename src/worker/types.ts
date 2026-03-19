export interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
  RESEND_API_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_ID: string;
  NOTIFY_EMAIL: string;
}

export type AgeRange = '3-5' | '6-8' | '9-12';

export type Visibility = 'private' | 'public' | 'link';

export type SubscriptionStatus = 'free' | 'active' | 'past_due' | 'cancelled';

export interface User {
  id: string;
  email: string;
  display_name: string;
  subscription_status: SubscriptionStatus;
  stripe_customer_id: string | null;
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

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: number;
  created_at: string;
  updated_at: string;
}

// Free tier limits
export const FREE_BOOK_LIMIT = 1;
export const FREE_CHAPTER_LIMIT = 3;
