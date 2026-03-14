import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface ArticleMeta {
  slug: string;
  reading_level: string;
  title: string;
  summary: string | null;
  hero_image_url: string | null;
}

interface ReadNextSuggestionsProps {
  slug: string;
  readingLevel: string;
}

export default function ReadNextSuggestions({ slug, readingLevel }: ReadNextSuggestionsProps) {
  const [existing, setExisting] = useState<ArticleMeta[]>([]);

  useEffect(() => {
    fetch(`/api/suggestions/${slug}/${readingLevel}`)
      .then((res) => res.json())
      .then((data) => {
        const typed = data as { existing: ArticleMeta[] };
        setExisting(typed.existing || []);
      })
      .catch(() => {});
  }, [slug, readingLevel]);

  if (existing.length === 0) return null;

  return (
    <section className="read-next">
      <h2>Read Next</h2>
      <div className="read-next-grid">
        {existing.map((a) => (
          <Link
            key={a.slug}
            to={`/${a.slug}/${a.reading_level}`}
            className="read-next-link"
          >
            {a.hero_image_url && (
              <img
                src={a.hero_image_url}
                alt=""
                className="read-next-thumb"
                loading="lazy"
              />
            )}
            <div className="read-next-body">
              <span className="read-next-title">{a.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
