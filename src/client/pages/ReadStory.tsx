import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChapterReader from '../components/ChapterReader';

interface Chapter {
  chapter_number: number;
  title: string;
  content: string;
}

interface Book {
  title: string;
  chapters: Chapter[];
}

interface CharacterMeta {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function ReadStory() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const startChapter = parseInt(searchParams.get('ch') || '0', 10);
  const [book, setBook] = useState<Book | null>(null);
  const [bookCharacters, setBookCharacters] = useState<CharacterMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/books/${id}`, { credentials: 'include' })
        .then((res) => res.json() as Promise<{ book: Book }>),
      fetch(`/api/books/${id}/characters`, { credentials: 'include' })
        .then((res) => res.ok ? res.json() as Promise<{ characters: CharacterMeta[] }> : { characters: [] })
        .catch(() => ({ characters: [] as CharacterMeta[] })),
    ])
      .then(([bookData, charData]) => {
        setBook(bookData.book);
        setBookCharacters(charData.characters);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="page-container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        Loading...
      </main>
    );
  }

  const { user } = useAuth();
  const isFree = user?.subscriptionStatus === 'free' || user?.subscriptionStatus === 'cancelled';
  const atChapterLimit = isFree && book && book.chapters.length >= 3;

  if (!book) {
    return (
      <main className="page-container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        Story not found
      </main>
    );
  }

  return (
    <main className="read-page content-container">
      <ChapterReader chapters={book.chapters} bookTitle={book.title} startIndex={startChapter} addChapterUrl={atChapterLimit ? undefined : `/books/${id}/new-chapter`} atChapterLimit={!!atChapterLimit} characters={bookCharacters} />
      <div className="read-actions">
        <Link to={`/books/${id}`} className="btn-secondary">Back to story</Link>
      </div>
    </main>
  );
}
