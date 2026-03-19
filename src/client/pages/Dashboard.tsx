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

function EmptyShelf() {
  return (
    <div className="dashboard-empty">
      <svg width="140" height="110" viewBox="0 0 140 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-illustration">
        <rect x="25" y="20" width="28" height="50" rx="4" stroke="var(--color-border)" strokeWidth="2" fill="var(--color-surface-warm)" transform="rotate(-6 25 20)" />
        <rect x="50" y="16" width="28" height="54" rx="4" stroke="var(--color-border)" strokeWidth="2" fill="var(--color-surface)" transform="rotate(2 50 16)" />
        <rect x="78" y="18" width="28" height="52" rx="4" stroke="var(--color-accent)" strokeWidth="2" fill="white" strokeDasharray="4 3" transform="rotate(-2 78 18)" />
        <text x="92" y="48" textAnchor="middle" fontSize="18" fill="var(--color-accent)" fontFamily="var(--font-heading)" opacity="0.7">?</text>
        <line x1="15" y1="80" x2="125" y2="80" stroke="var(--color-border)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="120" cy="25" r="3" fill="var(--color-secondary)" opacity="0.5">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="20" cy="90" r="2" fill="var(--color-accent)" opacity="0.3">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
      <h2 className="empty-title">Your bookshelf is empty</h2>
      <p className="empty-desc">Every great story starts with a single idea. Create your first one and see where imagination takes you.</p>
      <Link to="/create" className="btn-primary btn-lg">
        Create your first story
      </Link>
    </div>
  );
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
        {books.length > 0 && <Link to="/create" className="btn-primary">New Story</Link>}
      </div>

      {loading && <p className="browse-loading">Loading your stories...</p>}

      {!loading && books.length === 0 && <EmptyShelf />}

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
