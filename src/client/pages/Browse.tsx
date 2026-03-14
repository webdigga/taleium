import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ArticleCard from '../components/ArticleCard';

interface ArticleMeta {
  slug: string;
  reading_level: string;
  title: string;
  summary: string | null;
  category: string | null;
  hero_image_url: string | null;
}

export default function Browse() {
  const { category } = useParams<{ category?: string }>();
  const [articles, setArticles] = useState<ArticleMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = category ? `/api/browse/${category}` : '/api/browse';
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const typed = data as { articles: ArticleMeta[] };
        setArticles(typed.articles || []);
      })
      .catch(() => {
        setArticles([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [category]);

  const heading = category
    ? `Browse: ${category.charAt(0).toUpperCase() + category.slice(1)}`
    : 'Browse All Articles';

  return (
    <main className="browse-page page-container">
      <h1 className="browse-heading">{heading}</h1>

      {loading && <p className="browse-loading">Loading articles...</p>}

      {!loading && articles.length === 0 && (
        <div className="browse-empty">
          <p>No articles yet. Go generate some!</p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="articles-grid">
          {articles.map((a) => (
            <ArticleCard
              key={`${a.slug}-${a.reading_level}`}
              slug={a.slug}
              readingLevel={a.reading_level}
              title={a.title}
              summary={a.summary}
              category={a.category}
              heroImageUrl={a.hero_image_url}
            />
          ))}
        </div>
      )}
    </main>
  );
}
