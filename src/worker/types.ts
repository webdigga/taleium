export interface Env {
  ARTICLE_CACHE: KVNamespace;
  DB: D1Database;
  ANTHROPIC_API_KEY: string;
}

export type ReadingLevel = 'young-explorer' | 'curious-mind' | 'deep-dive';

export interface TimelineEntry {
  date: string;
  event: string;
}

export interface ArticleSection {
  heading: string;
  content: string;
  imageQuery: string;
  imageCaption: string;
}

export interface VocabularyTerm {
  term: string;
  definition: string;
}

export interface ComprehensionQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedArticle {
  title: string;
  subtitle: string;
  summary: string;
  category: string;
  era?: string;
  heroImageQuery: string;
  introduction: string;
  sections: ArticleSection[];
  pullQuote: string;
  conclusion: string;
  timeline: TimelineEntry[];
  furtherReading: string[];
  vocabulary: VocabularyTerm[];
  didYouKnow: string[];
  keyFacts: string[];
  comprehension: ComprehensionQuestion[];
}

export interface ResolvedImage {
  url: string;
  thumbnailUrl: string;
  alt: string;
  attribution: string;
  width: number;
  height: number;
}

export interface CachedArticle {
  slug: string;
  readingLevel: ReadingLevel;
  topic: string;
  generatedAt: string;
  article: GeneratedArticle;
  images: {
    hero: ResolvedImage | null;
    sections: (ResolvedImage | null)[];
  };
}

export interface ArticleMetadata {
  id: number;
  slug: string;
  reading_level: ReadingLevel;
  topic: string;
  title: string;
  summary: string | null;
  category: string | null;
  era: string | null;
  hero_image_url: string | null;
  generated_at: string;
  view_count: number;
}

export interface GenerateRequest {
  topic: string;
  readingLevel: ReadingLevel;
}
