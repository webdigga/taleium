import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import ReadingLevelPicker from '../components/ReadingLevelPicker';
import ArticleCard from '../components/ArticleCard';
import LoadingArticle from '../components/LoadingArticle';

type ReadingLevel = 'young-explorer' | 'curious-mind' | 'deep-dive';

interface ArticleMeta {
  slug: string;
  reading_level: string;
  title: string;
  summary: string | null;
  category: string | null;
  hero_image_url: string | null;
}

const TOPIC_SUGGESTIONS = [
  'How Volcanoes Work',
  'The Water Cycle',
  'Why Do We Dream?',
  'The Roman Empire',
  'Dinosaurs',
  'The Solar System',
  'How Electricity Works',
  'Why is the Sky Blue?',
  'Ancient Egypt',
  'Photosynthesis',
];

export default function Home() {
  const navigate = useNavigate();
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>('curious-mind');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingTopic, setLoadingTopic] = useState('');
  const [recentArticles, setRecentArticles] = useState<ArticleMeta[]>([]);

  useEffect(() => {
    fetch('/api/browse')
      .then((res) => res.json())
      .then((data) => {
        const typed = data as { articles: ArticleMeta[] };
        setRecentArticles(typed.articles || []);
      })
      .catch(() => {});
  }, []);

  async function handleSearch(topic: string) {
    setIsLoading(true);
    setError(null);
    setLoadingTopic(topic);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, readingLevel }),
      });

      const data = (await res.json()) as { error?: string; slug?: string };

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      navigate(`/${data.slug}/${readingLevel}`);
    } catch {
      setError('Failed to connect. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
      setLoadingTopic('');
    }
  }

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="page-container">
          <span className="hero-eyebrow">Learn &middot; Read &middot; Understand</span>
          <h1 className="hero-title">
            Any topic. Any reading level.<br />
            <span className="hero-highlight">Instantly.</span>
          </h1>
          <p className="hero-subtitle">
            Illustrated articles matched to your ability.
            Type a topic and get a lesson ready to read, share, or print.
          </p>

          <div className="search-section">
            <ReadingLevelPicker selected={readingLevel} onChange={setReadingLevel} />
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          {!isLoading && (
            <div className="hero-topics">
              {TOPIC_SUGGESTIONS.map((topic) => (
                <button
                  key={topic}
                  className="hero-topic-chip"
                  onClick={() => handleSearch(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {isLoading && (
        <section className="page-container">
          <LoadingArticle topic={loadingTopic} readingLevel={readingLevel} />
        </section>
      )}

      {!isLoading && recentArticles.length > 0 && (
        <section className="featured-section page-container">
          <h2 className="section-heading">Recently Published</h2>
          <div className="articles-grid">
            {recentArticles.map((a) => (
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
        </section>
      )}
    </main>
  );
}
