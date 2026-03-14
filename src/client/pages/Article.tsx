import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { CachedArticle } from '../../worker/types';
import ArticleRenderer from '../components/ArticleRenderer';
import LoadingArticle from '../components/LoadingArticle';

function hasImages(data: CachedArticle): boolean {
  if (data.images.hero) return true;
  return data.images.sections.some((img) => img !== null);
}

export default function Article() {
  const { slug, level } = useParams<{ slug: string; level: string }>();
  const [article, setArticle] = useState<CachedArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!slug || !level) return;

    setLoading(true);
    setError(null);
    setArticle(null);

    fetch(`/api/article/${slug}/${level}`)
      .then((res) => {
        if (!res.ok) throw new Error('Article not found');
        return res.json();
      })
      .then((data) => {
        const typed = data as CachedArticle;
        setArticle(typed);
        document.title = `${typed.article.title} | Taleium`;

        // If images aren't resolved yet, refetch after a delay
        if (!hasImages(typed)) {
          retryRef.current = setTimeout(() => {
            fetch(`/api/article/${slug}/${level}`)
              .then((res) => res.json())
              .then((refreshed) => {
                const r = refreshed as CachedArticle;
                if (hasImages(r)) {
                  setArticle(r);
                }
              })
              .catch(() => {});
          }, 10000);
        }
      })
      .catch(() => {
        setError('Article not found. It may not have been generated yet.');
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current);
    };
  }, [slug, level]);

  if (loading) {
    return (
      <main className="page-container" style={{ paddingTop: '2rem' }}>
        <LoadingArticle topic={slug?.replace(/-/g, ' ') || ''} readingLevel={level || 'curious-mind'} />
      </main>
    );
  }

  if (error || !article) {
    return (
      <main className="page-container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Article Not Found</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '2rem' }}>{error}</p>
        <Link to="/" className="search-button" style={{ display: 'inline-block', padding: '0.75rem 1.5rem' }}>
          Generate an Article
        </Link>
      </main>
    );
  }

  return <ArticleRenderer data={article} />;
}
