import type { Env } from '../types';

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
