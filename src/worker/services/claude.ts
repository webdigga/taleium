import type { AgeRange, Genre, GeneratedChapter, StoryDirection, Chapter } from '../types';
import { sanitiseClaudeResponse } from '../utils/validate';

const SYSTEM_PROMPT = `You are Taleium, a collaborative family story creator. You help parents and children write stories together, chapter by chapter. You write engaging, age-appropriate prose. Always use British English spelling (colour, favourite, realised, centre, etc.). Respond with valid JSON only - no markdown, no preamble.`;

const WORD_TARGETS: Record<AgeRange, string> = {
  '3-5': '150-250 words. Very simple vocabulary, short sentences, repetition for emphasis. Fun, playful tone.',
  '6-8': '250-400 words. Clear vocabulary with occasional interesting words. Adventure and wonder. Dialogue encouraged.',
  '9-12': '400-600 words. Richer vocabulary, more complex sentences. Deeper emotions and themes. Plot twists welcome.',
};

const GENRE_PROMPTS: Record<Genre, string> = {
  'adventure': 'Action-packed adventure with brave heroes, exciting quests, and thrilling escapes.',
  'fantasy': 'Magical fantasy with enchanted worlds, mythical creatures, and wondrous powers.',
  'mystery': 'Intriguing mystery with clues to follow, puzzles to solve, and surprising reveals.',
  'sci-fi': 'Science fiction with futuristic technology, space exploration, or inventions gone wild.',
  'fairy-tale': 'Classic fairy-tale style with enchantment, moral lessons, and "once upon a time" magic.',
  'animal': 'Animal story with charming animal characters who have distinct personalities and go on journeys.',
  'funny': 'Humorous and silly with jokes, wordplay, absurd situations, and laugh-out-loud moments.',
  'spooky': 'Mildly spooky and atmospheric with mysterious settings and gentle thrills (never truly scary).',
};

function buildStoryContext(chapters: Chapter[], bookTitle: string): string {
  if (chapters.length === 0) return 'This is the first chapter of the story.';

  const parts: string[] = [`The story "${bookTitle}" so far:`];

  if (chapters.length === 1) {
    parts.push(`Chapter 1 "${chapters[0].title}": ${chapters[0].content}`);
  } else {
    // Full first chapter
    parts.push(`Chapter 1 "${chapters[0].title}": ${chapters[0].content}`);

    // Middle chapters: title + excerpt
    for (let i = 1; i < chapters.length - 1; i++) {
      const excerpt = chapters[i].content.slice(0, 100) + '...';
      parts.push(`Chapter ${chapters[i].chapter_number} "${chapters[i].title}": ${excerpt}`);
    }

    // Full last chapter
    const last = chapters[chapters.length - 1];
    parts.push(`Chapter ${last.chapter_number} "${last.title}": ${last.content}`);
  }

  return parts.join('\n\n');
}

export async function generateChapter(
  bookTitle: string,
  ageRange: AgeRange,
  chapters: Chapter[],
  userPrompt: string,
  apiKey: string,
  genre?: Genre | null,
): Promise<GeneratedChapter> {
  const chapterNumber = chapters.length + 1;
  const storyContext = buildStoryContext(chapters, bookTitle);
  const genreLine = genre ? `\nGenre: ${GENRE_PROMPTS[genre]}` : '';

  const prompt = `Write chapter ${chapterNumber} of a story for ages ${ageRange}.

Target: ${WORD_TARGETS[ageRange]}${genreLine}

${storyContext}

The reader's idea for this chapter: "${userPrompt}"

Return JSON:
{
  "title": "chapter title",
  "content": "the full chapter text, with paragraph breaks as \\n\\n"
}

Rules:
- Continue naturally from the previous chapter (if any)
- Match the established tone, characters, and setting${genre ? '\n- Stay true to the genre style throughout' : ''}
- End the chapter at a natural pause point that invites continuation
- Age-appropriate language and themes
- JSON only, no text outside the object`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const result = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = result.content.find((block) => block.type === 'text');
  if (!textBlock) throw new Error('No text content in Claude response');

  const cleaned = sanitiseClaudeResponse(textBlock.text);
  const parsed = JSON.parse(cleaned) as { title?: string; content?: string };

  if (!parsed.title || !parsed.content) {
    throw new Error('Claude response missing title or content');
  }

  return { title: parsed.title, content: parsed.content };
}

export async function generateDirections(
  bookTitle: string,
  ageRange: AgeRange,
  chapters: Chapter[],
  apiKey: string,
  genre?: Genre | null,
): Promise<StoryDirection[]> {
  const chapterNumber = chapters.length + 1;
  const storyContext = buildStoryContext(chapters, bookTitle);
  const genreLine = genre ? `\nGenre: ${GENRE_PROMPTS[genre]}` : '';

  const prompt = `Suggest 3 different directions for chapter ${chapterNumber} of a story for ages ${ageRange}.${genreLine}

${storyContext}

Return JSON:
{
  "directions": [
    { "id": "a", "summary": "short 5-8 word summary", "preview": "1-2 sentence preview of what could happen" },
    { "id": "b", "summary": "short 5-8 word summary", "preview": "1-2 sentence preview of what could happen" },
    { "id": "c", "summary": "short 5-8 word summary", "preview": "1-2 sentence preview of what could happen" }
  ]
}

Rules:
- Each direction should be meaningfully different (different events, tones, or character choices)${genre ? '\n- All directions should fit within the genre' : ''}
- Previews should excite the reader without being too long
- Age-appropriate suggestions
- JSON only, no text outside the object`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const result = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = result.content.find((block) => block.type === 'text');
  if (!textBlock) throw new Error('No text content in Claude response');

  const cleaned = sanitiseClaudeResponse(textBlock.text);
  const parsed = JSON.parse(cleaned) as { directions?: StoryDirection[] };

  if (!Array.isArray(parsed.directions) || parsed.directions.length === 0) {
    throw new Error('Claude response missing directions');
  }

  return parsed.directions;
}
