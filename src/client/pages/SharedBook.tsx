import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChapterReader from '../components/ChapterReader';

interface Chapter {
  chapter_number: number;
  title: string;
  content: string;
}

interface Book {
  title: string;
  description: string | null;
  age_range: string;
  chapters: Chapter[];
}

interface CharacterMeta {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function SharedBook() {
  const { token } = useParams<{ token: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [bookCharacters, setBookCharacters] = useState<CharacterMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/shared/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json() as Promise<{ book: Book; characters?: CharacterMeta[] }>;
      })
      .then((data) => {
        setBook(data.book);
        setBookCharacters(data.characters || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <main className="page-container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        Loading...
      </main>
    );
  }

  if (!book) {
    return (
      <main className="page-container" style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-muted)' }}>
        Story not found or is no longer shared.
      </main>
    );
  }

  return (
    <main className="shared-page content-container">
      <ChapterReader chapters={book.chapters} bookTitle={book.title} characters={bookCharacters} />
    </main>
  );
}
