import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AgeRangePicker from '../components/AgeRangePicker';
import GenrePicker from '../components/GenrePicker';
import UpgradePrompt from '../components/UpgradePrompt';

interface Character {
  id: string;
  name: string;
  avatar_url: string | null;
}

export default function CreateBook() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [ageRange, setAgeRange] = useState('6-8');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [coverPrompt, setCoverPrompt] = useState('');
  const [selectedCharIds, setSelectedCharIds] = useState<Set<string>>(new Set());
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookCount, setBookCount] = useState<number | null>(null);

  const isFree = user?.subscriptionStatus === 'free' || user?.subscriptionStatus === 'cancelled';
  const isPremium = !isFree;
  const atLimit = isFree && bookCount !== null && bookCount >= 1;

  useEffect(() => {
    fetch('/api/books', { credentials: 'include' })
      .then((res) => res.json() as Promise<{ books: unknown[] }>)
      .then((data) => setBookCount(data.books?.length || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isPremium) return;
    fetch('/api/characters', { credentials: 'include' })
      .then((res) => res.json() as Promise<{ characters: Character[] }>)
      .then((data) => setCharacters(data.characters || []))
      .catch(() => {});
  }, [isPremium]);

  function toggleCharacter(id: string) {
    setSelectedCharIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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
          coverPrompt: coverPrompt || undefined,
        }),
      });
      const data = await res.json() as { error?: string; code?: string; book: { id: string } };
      if (!res.ok) throw new Error(data.error || 'Failed to create book');

      // Link selected characters to the book
      if (selectedCharIds.size > 0) {
        await fetch(`/api/books/${data.book.id}/characters`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ characterIds: [...selectedCharIds] }),
        });
      }

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

        {isPremium && characters.length > 0 && (
          <fieldset className="genre-picker">
            <legend className="genre-picker-legend">Characters <span className="premium-badge">Premium</span></legend>
            <div className="char-picker-grid">
              {characters.map((c) => {
                const selected = selectedCharIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`char-picker-item ${selected ? 'active' : ''}`}
                    onClick={() => toggleCharacter(c.id)}
                  >
                    <div className="char-picker-avatar">
                      {c.avatar_url ? (
                        <img src={c.avatar_url} alt={c.name} />
                      ) : (
                        <span className="char-picker-initial">{c.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="char-picker-name">{c.name}</span>
                    {selected && <span className="char-picker-check" aria-label="Selected">&#10003;</span>}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <label className="auth-field">
          <span>Describe your cover image (optional)</span>
          <input
            type="text"
            value={coverPrompt}
            onChange={(e) => setCoverPrompt(e.target.value)}
            placeholder="e.g. a castle in the clouds, a spaceship flying through stars"
          />
          <small className="field-hint">We&apos;ll generate a cover illustration for you. Leave blank to generate from your title.</small>
        </label>

        <button type="submit" className="auth-submit" disabled={loading || !title.trim()}>
          {loading ? 'Creating...' : 'Create story'}
        </button>
      </form>
    </main>
  );
}
