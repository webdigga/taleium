import { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';

interface BookMeta {
  id: string;
  title: string;
  description: string | null;
  age_range: string;
  genre: string | null;
  chapter_count: number;
  cover_image_url: string | null;
  cover_image_attribution: string | null;
  share_token: string | null;
}

export default function Browse() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public')
      .then((res) => res.json() as Promise<{ books: BookMeta[] }>)
      .then((data) => setBooks(data.books || []))
      .catch(() => setBooks([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="browse-page page-container">
      <h1 className="browse-heading">Community Stories</h1>

      {loading && <p className="browse-loading">Loading stories...</p>}

      {!loading && books.length === 0 && (
        <div className="browse-empty">
          <p>No public stories yet. Be the first to share one!</p>
        </div>
      )}

      {!loading && books.length > 0 && (
        <div className="books-grid">
          {books.map((b) => (
            <BookCard
              key={b.id}
              id={b.id}
              title={b.title}
              description={b.description}
              ageRange={b.age_range}
              genre={b.genre}
              chapterCount={b.chapter_count}
              coverImageUrl={b.cover_image_url}
              coverImageAttribution={b.cover_image_attribution}
              to={b.share_token ? `/shared/${b.share_token}` : undefined}
            />
          ))}
        </div>
      )}
    </main>
  );
}
