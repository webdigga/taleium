import type { Env, Genre } from '../types';

export async function generateAvatar(
  env: Env,
  characterName: string,
  appearance?: string | null,
  personality?: string | null,
  role?: string | null,
): Promise<string> {
  const traits: string[] = [];
  if (appearance) traits.push(appearance);
  if (personality) traits.push(personality);
  if (role) traits.push(role);

  const description = traits.length > 0 ? traits.join(', ') : 'a friendly character';

  const prompt = `Children's storybook character portrait of ${characterName}: ${description}. Friendly, colourful, illustrated style, white background, suitable for children's book, digital art, warm lighting.`;

  const result = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
    prompt,
    num_steps: 20,
    width: 512,
    height: 512,
  });

  // Result is a ReadableStream of PNG bytes
  const imageBytes = new Uint8Array(await new Response(result as ReadableStream).arrayBuffer());

  const key = `avatars/${crypto.randomUUID()}.png`;
  await env.ASSETS.put(key, imageBytes, {
    httpMetadata: { contentType: 'image/png' },
  });

  return `/api/assets/${key}`;
}

const GENRE_STYLES: Record<Genre, string> = {
  'adventure': 'epic adventure scene, bold colours, dramatic lighting',
  'fantasy': 'magical fantasy scene, enchanted atmosphere, glowing elements',
  'mystery': 'mysterious atmosphere, shadows and clues, intriguing scene',
  'sci-fi': 'futuristic science fiction scene, space or technology, neon accents',
  'fairy-tale': 'classic fairy tale scene, enchanted forest or castle, magical glow',
  'animal': 'charming animal characters in a natural setting, warm and friendly',
  'funny': 'playful and humorous scene, bright colours, cartoon-like energy',
  'spooky': 'mildly spooky atmospheric scene, moonlit, mysterious but not scary',
};

export async function generateCover(
  env: Env,
  title: string,
  description?: string | null,
  genre?: Genre | null,
  coverPrompt?: string | null,
): Promise<{ url: string }> {
  const parts: string[] = [];

  if (coverPrompt) {
    parts.push(coverPrompt);
  } else {
    parts.push(title);
    if (description) parts.push(description);
  }

  if (genre && GENRE_STYLES[genre]) {
    parts.push(GENRE_STYLES[genre]);
  }

  const prompt = `Children's storybook cover illustration: ${parts.join('. ')}. Beautiful, colourful, illustrated style, suitable for a children's book cover, digital art, warm lighting, no text.`;

  const result = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
    prompt,
    num_steps: 20,
    width: 768,
    height: 512,
  });

  const imageBytes = new Uint8Array(await new Response(result as ReadableStream).arrayBuffer());

  const key = `covers/${crypto.randomUUID()}.png`;
  await env.ASSETS.put(key, imageBytes, {
    httpMetadata: { contentType: 'image/png' },
  });

  return { url: `/api/assets/${key}` };
}
