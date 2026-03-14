import type { GeneratedArticle, ReadingLevel } from '../types';
import { sanitiseClaudeResponse, validateArticleJSON } from '../utils/validate';

const SYSTEM_PROMPT = `You are Taleium, an educational article writer. Create engaging, factually accurate articles tailored to a reading level. Respond with valid JSON only — no markdown, no preamble.`;

function buildUserPrompt(topic: string, readingLevel: ReadingLevel): string {
  const levelGuide: Record<ReadingLevel, string> = {
    'young-explorer': 'Ages 6-9. Simple words, short sentences, fun analogies. ~600 words across 3-4 sections.',
    'curious-mind': 'Ages 10-13. Some technical terms with inline explanations, narrative style. ~900 words across 4-5 sections.',
    'deep-dive': 'Adult. Full depth, reference sources, sophisticated vocabulary. ~1500 words across 4-6 sections.',
  };

  return `Write an article about "${topic}" for reading level: ${readingLevel} (${levelGuide[readingLevel]})

Return JSON:
{
  "title": "string",
  "subtitle": "one-line subtitle",
  "summary": "meta description, max 160 chars",
  "category": "history|science|nature|geography|technology|food|health|arts|sport|space|maths|language",
  "era": "optional era/period or null",
  "heroImageQuery": "Wikimedia Commons search query for hero image",
  "introduction": "opening paragraph",
  "sections": [{"heading":"string","content":"paragraphs separated by \\n\\n, **bold** ok","imageQuery":"Wikimedia Commons search query","imageCaption":"caption"}],
  "pullQuote": "compelling quote or key fact",
  "conclusion": "closing paragraph",
  "timeline": [{"date":"string","event":"string"}],
  "furtherReading": ["topic1","topic2","topic3"],
  "vocabulary": [{"term":"string","definition":"level-appropriate definition"}],
  "didYouKnow": ["surprising fact 1","surprising fact 2"],
  "keyFacts": ["takeaway 1","takeaway 2","takeaway 3"],
  "comprehension": [{"question":"string","options":["A","B","C","D"],"correctIndex":0,"explanation":"why correct"}]
}

Rules:
- Factually accurate, engaging narrative style
- imageQuery values must be specific for Wikimedia Commons (e.g. "Bayeux Tapestry Battle of Hastings")
- timeline: 4-8 entries. furtherReading: 3 topics
- vocabulary: 4-6 key terms. didYouKnow: 2-3 facts. keyFacts: 3-5 takeaways
- comprehension: 3-4 questions, 4 options each, plausible distractors
- All content appropriate for the reading level
- JSON only, no text outside the object`;
}

export async function generateArticle(
  topic: string,
  readingLevel: ReadingLevel,
  apiKey: string
): Promise<GeneratedArticle> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 5000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserPrompt(topic, readingLevel),
        },
      ],
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
  if (!textBlock) {
    throw new Error('No text content in Claude response');
  }

  const cleaned = sanitiseClaudeResponse(textBlock.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Failed to parse Claude response as JSON');
  }

  if (!validateArticleJSON(parsed)) {
    throw new Error('Claude response does not match expected article structure');
  }

  return parsed;
}
