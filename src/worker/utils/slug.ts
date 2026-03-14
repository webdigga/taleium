export function topicToSlug(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
