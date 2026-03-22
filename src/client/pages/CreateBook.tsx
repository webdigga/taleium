import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AgeRangePicker from '../components/AgeRangePicker';
import GenrePicker from '../components/GenrePicker';
import UpgradePrompt from '../components/UpgradePrompt';

export default function CreateBook() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [ageRange, setAgeRange] = useState('6-8');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [coverQuery, setCoverQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookCount, setBookCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/books', { credentials: 'include' })
      .then((res) => res.json() as Promise<{ books: unknown[] }>)
      .then((data) => setBookCount(data.books?.length || 0))
      .catch(() => {});
  }, []);

  const isFree = user?.subscriptionStatus === 'free' || user?.subscriptionStatus === 'cancelled';
  const isPremium = !isFree;
  const atLimit = isFree && bookCount !== null && bookCount >= 1;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          ageRange,
          genre: genre || undefined,
          description: description || undefined,
          coverQuery: coverQuery || undefined,
        }),
      });
      const data = await res.json() as { error?: string; code?: string; book: { id: string } };
      if (!res.ok) throw new Error(data.error || 'Failed to create book');
      navigate(`/books/${data.book.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (atLimit) {
    return (
      <main className="create-page page-container">
        <div className="create-form">
          <h1 className="create-title">Start a new story</h1>
          <UpgradePrompt message="You've used your free book. Upgrade to Premium to create unlimited stories." />
        </div>
      </main>
    );
  }

  return (
    <main className="create-page page-container">
      <form onSubmit={handleSubmit} className="create-form">
        <h1 className="create-title">Start a new story</h1>

        {error && <div className="auth-error">{error}</div>}

        <label className="auth-field">
          <span>Story title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="The Great Adventure of..."
            required
          />
        </label>

        <label className="auth-field">
          <span>Description (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's your story about?"
            rows={2}
          />
        </label>

        <AgeRangePicker selected={ageRange} onChange={setAgeRange} />

        {isPremium && (
          <GenrePicker selected={genre} onChange={setGenre} />
        )}

        <label className="auth-field">
          <span>Cover image search (optional)</span>
          <input
            type="text"
            value={coverQuery}
            onChange={(e) => setCoverQuery(e.target.value)}
            placeholder="e.g. castle in the clouds, space adventure"
          />
          <small className="field-hint">We&apos;ll find an image from Wikimedia Commons</small>
        </label>

        <button type="submit" className="auth-submit" disabled={loading || !title.trim()}>
          {loading ? 'Creating...' : 'Create story'}
        </button>
      </form>
    </main>
  );
}
