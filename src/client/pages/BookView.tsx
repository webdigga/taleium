import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChapterCard from '../components/ChapterCard';
import VisibilityPicker from '../components/VisibilityPicker';
import UpgradePrompt from '../components/UpgradePrompt';
import { GENRE_LABELS } from '../components/GenrePicker';
import { exportBookAsPdf } from '../utils/exportPdf';

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  user_prompt: string | null;
}

interface Book {
  id: string;
  title: string;
  description: string | null;
  age_range: string;
  genre: string | null;
  visibility: string;
  share_token: string | null;
  cover_image_url: string | null;
  cover_image_attribution: string | null;
  chapter_count: number;
  chapters: Chapter[];
}

const AGE_LABELS: Record<string, string> = {
  '3-5': 'Ages 3-5',
  '6-8': 'Ages 6-8',
  '9-12': 'Ages 9-12',
};

export default function BookView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/books/${id}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load book');
        return res.json() as Promise<{ book: Book }>;
      })
      .then((data) => setBook(data.book))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleVisibilityChange(visibility: string) {
    const res = await fetch(`/api/books/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ visibility }),
    });
    const data = await res.json() as { book: Book };
    if (res.ok) setBook(data.book);
  }

  if (loading) {
    return (
      <main className="page-container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        Loading...
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="page-container" style={{ padding: '4rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-muted)' }}>{error || 'Story not found'}</p>
        <Link to="/dashboard" className="btn-secondary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Back to my stories
        </Link>
      </main>
    );
  }

  const isFree = user?.subscriptionStatus === 'free' || user?.subscriptionStatus === 'cancelled';
  const atChapterLimit = isFree && book.chapters.length >= 3;

  return (
    <main className="book-view page-container">
      <div className="book-header">
        {book.cover_image_url && (
          <div className="book-cover-col">
            <div className="book-cover">
              <img src={book.cover_image_url} alt={book.title} />
            </div>
            {book.cover_image_attribution && (
              <small className="image-attribution">{book.cover_image_attribution}</small>
            )}
          </div>
        )}
        <div className="book-info">
          <div className="book-badges">
            <span className={`badge badge-age age-${book.age_range}`}>{AGE_LABELS[book.age_range] || book.age_range}</span>
            {book.genre && <span className="badge badge-genre">{GENRE_LABELS[book.genre] || book.genre}</span>}
          </div>
          <h1 className="book-title">{book.title}</h1>
          {book.description && <p className="book-description">{book.description}</p>}
        </div>
      </div>

      <div className="book-actions">
        {!atChapterLimit && (
          <Link to={`/books/${id}/new-chapter`} className="btn-primary">Add chapter</Link>
        )}
        {book.chapters.length > 0 && (
          <Link to={`/books/${id}/read`} className="btn-secondary">Read story</Link>
        )}
        {!isFree && book.chapters.length > 0 && (
          <button
            className="btn-secondary"
            onClick={() => exportBookAsPdf({
              title: book.title,
              description: book.description,
              ageRange: book.age_range,
              genre: book.genre,
              chapters: book.chapters,
            })}
          >
            Download PDF
          </button>
        )}
      </div>

      {atChapterLimit && (
        <UpgradePrompt message="You've reached 3 chapters on the free plan. Upgrade to keep writing this story." />
      )}

      {book.chapters.length > 0 && (
        <section className="chapters-section">
          <h2>Chapters{isFree ? ` (${book.chapters.length}/3)` : ''}</h2>
          <div className="chapters-list">
            {book.chapters.map((ch, i) => (
              <ChapterCard
                key={ch.id}
                bookId={book.id}
                chapterNumber={ch.chapter_number}
                chapterIndex={i}
                title={ch.title}
                content={ch.content}
              />
            ))}
          </div>
        </section>
      )}

      {book.chapters.length === 0 && (
        <div className="dashboard-empty">
          <p>Your story is ready! Add the first chapter to get started.</p>
        </div>
      )}

      <section className="book-settings">
        <h2>Sharing</h2>
        <VisibilityPicker
          value={book.visibility}
          shareToken={book.share_token}
          onChange={handleVisibilityChange}
        />
      </section>
    </main>
  );
}
