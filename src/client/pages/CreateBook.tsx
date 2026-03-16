import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AgeRangePicker from '../components/AgeRangePicker';

export default function CreateBook() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [ageRange, setAgeRange] = useState('6-8');
  const [description, setDescription] = useState('');
  const [coverQuery, setCoverQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          description: description || undefined,
          coverQuery: coverQuery || undefined,
        }),
      });
      const data = await res.json() as { error?: string; book: { id: string } };
      if (!res.ok) throw new Error(data.error || 'Failed to create book');
      navigate(`/books/${data.book.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
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
