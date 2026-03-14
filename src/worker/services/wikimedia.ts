import type { ResolvedImage } from '../types';

const WIKIMEDIA_API = 'https://commons.wikimedia.org/w/api.php';
const HEADERS = {
  'User-Agent': 'Taleium/1.0 (https://taleium.com; hello@taleium.com)',
  'Accept': 'application/json',
};

interface WikimediaImageInfo {
  url: string;
  thumburl?: string;
  thumbwidth?: number;
  thumbheight?: number;
  width: number;
  height: number;
  extmetadata?: {
    ImageDescription?: { value: string };
    Artist?: { value: string };
    LicenseShortName?: { value: string };
    ObjectName?: { value: string };
  };
}

interface WikimediaPage {
  pageid: number;
  title: string;
  imageinfo?: WikimediaImageInfo[];
}

interface WikimediaResponse {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function simplifyQuery(query: string): string {
  // Take the first 3-4 meaningful words to broaden the search
  const words = query.split(/\s+/).filter((w) => w.length > 2);
  return words.slice(0, 3).join(' ');
}

async function fetchWikimedia(query: string): Promise<WikimediaPage[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: query,
    gsrlimit: '10',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size',
    iiurlwidth: '1200',
    format: 'json',
    origin: '*',
  });

  const response = await fetch(`${WIKIMEDIA_API}?${params.toString()}`, { headers: HEADERS });
  if (!response.ok) {
    console.error(`Wikimedia API error (${response.status}) for query: ${query}`);
    return [];
  }

  const data = (await response.json()) as WikimediaResponse;
  return data.query?.pages ? Object.values(data.query.pages) : [];
}

function filterSuitable(pages: WikimediaPage[]): WikimediaPage[] {
  return pages.filter((page) => {
    const info = page.imageinfo?.[0];
    if (!info) return false;
    const url = info.url.toLowerCase();
    if (!/\.(jpg|jpeg|png)$/.test(url)) return false;
    if (info.width < 400) return false;
    return true;
  });
}

function pageToImage(page: WikimediaPage, fallbackAlt: string): ResolvedImage {
  const info = page.imageinfo![0];
  const meta = info.extmetadata || {};
  const artist = meta.Artist ? stripHtml(meta.Artist.value) : 'Unknown';
  const licence = meta.LicenseShortName?.value || 'Unknown licence';
  const description = meta.ImageDescription
    ? stripHtml(meta.ImageDescription.value)
    : fallbackAlt;

  return {
    url: info.url,
    thumbnailUrl: info.thumburl || info.url,
    alt: description.slice(0, 200),
    attribution: `${artist}, ${licence}`,
    width: info.thumbwidth || info.width,
    height: info.thumbheight || info.height,
  };
}

export async function searchImage(query: string): Promise<ResolvedImage | null> {
  try {
    // Try the full query first
    let pages = await fetchWikimedia(query);
    let suitable = filterSuitable(pages);

    // If no results, try a simplified (shorter) query
    if (suitable.length === 0) {
      const simplified = simplifyQuery(query);
      if (simplified !== query) {
        console.log(`Retrying with simplified query: "${simplified}" (was: "${query}")`);
        pages = await fetchWikimedia(simplified);
        suitable = filterSuitable(pages);
      }
    }

    if (suitable.length === 0) {
      console.error(`No suitable images for: ${query}`);
      return null;
    }

    return pageToImage(suitable[0], query);
  } catch (err) {
    console.error(`Wikimedia fetch failed for: ${query}`, err);
    return null;
  }
}

export async function resolveArticleImages(
  heroQuery: string,
  sectionQueries: string[]
): Promise<{
  hero: ResolvedImage | null;
  sections: (ResolvedImage | null)[];
}> {
  const [hero, ...sections] = await Promise.all([
    searchImage(heroQuery),
    ...sectionQueries.map((q) => searchImage(q)),
  ]);

  return { hero, sections };
}
