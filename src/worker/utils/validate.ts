import type { GeneratedArticle, ReadingLevel } from '../types';

const VALID_LEVELS: ReadingLevel[] = ['young-explorer', 'curious-mind', 'deep-dive'];

export function isValidReadingLevel(level: string): level is ReadingLevel {
  return VALID_LEVELS.includes(level as ReadingLevel);
}

export function validateArticleJSON(data: unknown): data is GeneratedArticle {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  const requiredStrings = ['title', 'subtitle', 'summary', 'category', 'heroImageQuery', 'introduction', 'pullQuote', 'conclusion'];
  for (const key of requiredStrings) {
    if (typeof obj[key] !== 'string' || (obj[key] as string).length === 0) {
      return false;
    }
  }

  if (!Array.isArray(obj.sections) || obj.sections.length === 0) return false;
  for (const section of obj.sections) {
    if (
      typeof section.heading !== 'string' ||
      typeof section.content !== 'string' ||
      typeof section.imageQuery !== 'string' ||
      typeof section.imageCaption !== 'string'
    ) {
      return false;
    }
  }

  if (!Array.isArray(obj.timeline)) return false;
  if (!Array.isArray(obj.furtherReading)) return false;

  // New educational fields — default to empty arrays if missing (backwards compat with cached articles)
  if (obj.vocabulary !== undefined && !Array.isArray(obj.vocabulary)) return false;
  if (obj.didYouKnow !== undefined && !Array.isArray(obj.didYouKnow)) return false;
  if (obj.keyFacts !== undefined && !Array.isArray(obj.keyFacts)) return false;
  if (obj.comprehension !== undefined && !Array.isArray(obj.comprehension)) return false;

  // Ensure defaults for missing fields
  if (!obj.vocabulary) (obj as Record<string, unknown>).vocabulary = [];
  if (!obj.didYouKnow) (obj as Record<string, unknown>).didYouKnow = [];
  if (!obj.keyFacts) (obj as Record<string, unknown>).keyFacts = [];
  if (!obj.comprehension) (obj as Record<string, unknown>).comprehension = [];

  return true;
}

export function sanitiseClaudeResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}
