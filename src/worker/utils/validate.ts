import type { AgeRange, Visibility, Genre } from '../types';

const VALID_AGE_RANGES: AgeRange[] = ['3-5', '6-8', '9-12'];
const VALID_VISIBILITIES: Visibility[] = ['private', 'public', 'link'];
const VALID_GENRES: Genre[] = ['adventure', 'fantasy', 'mystery', 'sci-fi', 'fairy-tale', 'animal', 'funny', 'spooky'];

export function isValidAgeRange(value: string): value is AgeRange {
  return VALID_AGE_RANGES.includes(value as AgeRange);
}

export function isValidVisibility(value: string): value is Visibility {
  return VALID_VISIBILITIES.includes(value as Visibility);
}

export function isValidGenre(value: string): value is Genre {
  return VALID_GENRES.includes(value as Genre);
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
