import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';

interface BookMeta {
  id: string;
  title: string;
  description: string | null;
  age_range: string;
  chapter_count: number;
  cover_image_url: string | null;
  cover_image_attribution: string | null;
  share_token: string | null;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [publicBooks, setPublicBooks] = useState<BookMeta[]>([]);

  useEffect(() => {
    fetch('/api/public')
      .then((res) => res.json() as Promise<{ books: BookMeta[] }>)
      .then((data) => setPublicBooks(data.books || []))
      .catch(() => {});
  }, []);

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="page-container">
          <span className="hero-eyebrow">Create &middot; Imagine &middot; Share</span>
          <h1 className="hero-title">
            Write stories together.<br />
            <span className="hero-highlight">Chapter by chapter.</span>
          </h1>
          <p className="hero-subtitle">
            A collaborative story creator for families.
            You dream up the ideas &mdash; Taleium helps bring them to life as beautiful stories.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn-primary btn-lg">Start creating</Link>
            <Link to="/browse" className="btn-secondary btn-lg">Browse stories</Link>
          </div>
        </div>
      </section>

      {publicBooks.length > 0 && (
        <section className="featured-section page-container">
          <h2 className="section-heading">Community stories</h2>
          <div className="books-grid">
            {publicBooks.slice(0, 6).map((b) => (
              <BookCard
                key={b.id}
                id={b.id}
                title={b.title}
                description={b.description}
                ageRange={b.age_range}
                chapterCount={b.chapter_count}
                coverImageUrl={b.cover_image_url}
                coverImageAttribution={b.cover_image_attribution}
                to={b.share_token ? `/shared/${b.share_token}` : undefined}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
