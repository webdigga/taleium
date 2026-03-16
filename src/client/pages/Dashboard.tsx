import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BookCard from '../components/BookCard';

interface BookMeta {
  id: string;
  title: string;
  description: string | null;
  age_range: string;
  chapter_count: number;
  cover_image_url: string | null;
  cover_image_attribution: string | null;
}

export default function Dashboard() {
  const [books, setBooks] = useState<BookMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/books', { credentials: 'include' })
      .then((res) => res.json() as Promise<{ books: BookMeta[] }>)
      .then((data) => setBooks(data.books || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="dashboard-page page-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Stories</h1>
        <Link to="/create" className="btn-primary">New Story</Link>
      </div>

      {loading && <p className="browse-loading">Loading your stories...</p>}

      {!loading && books.length === 0 && (
        <div className="dashboard-empty">
          <p>You haven&apos;t created any stories yet.</p>
          <Link to="/create" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
            Create your first story
          </Link>
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
              chapterCount={b.chapter_count}
              coverImageUrl={b.cover_image_url}
              coverImageAttribution={b.cover_image_attribution}
            />
          ))}
        </div>
      )}
    </main>
  );
}
