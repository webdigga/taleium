import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PromptInput from '../components/PromptInput';
import DirectionCard from '../components/DirectionCard';
import LoadingChapter from '../components/LoadingChapter';

interface Direction {
  id: string;
  summary: string;
  preview: string;
}

export default function AddChapter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [directions, setDirections] = useState<Direction[] | null>(null);
  const [loadingDirections, setLoadingDirections] = useState(false);
  const [error, setError] = useState('');

  async function handlePromptSubmit(prompt: string) {
    setError('');
    setGenerating(true);

    try {
      const res = await fetch(`/api/books/${id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to generate chapter');
      navigate(`/books/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  async function handleGetDirections() {
    setError('');
    setLoadingDirections(true);

    try {
      const res = await fetch(`/api/books/${id}/directions`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json() as { error?: string; directions: Direction[] };
      if (!res.ok) throw new Error(data.error || 'Failed to get directions');
      setDirections(data.directions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoadingDirections(false);
    }
  }

  async function handlePickDirection(direction: Direction) {
    setError('');
    setGenerating(true);

    try {
      const res = await fetch(`/api/books/${id}/chapters/from-direction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ direction }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Failed to generate chapter');
      navigate(`/books/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <main className="add-chapter-page page-container">
        <LoadingChapter />
      </main>
    );
  }

  return (
    <main className="add-chapter-page page-container">
      <h1 className="add-chapter-title">Write the next chapter</h1>

      {error && <div className="auth-error">{error}</div>}

      <section className="prompt-section">
        <h2>Write your own direction</h2>
        <PromptInput onSubmit={handlePromptSubmit} isLoading={generating} />
      </section>

      <div className="or-divider"><span>or</span></div>

      <section className="directions-section">
        <h2>Pick a direction</h2>
        {!directions && (
          <button
            className="btn-secondary"
            onClick={handleGetDirections}
            disabled={loadingDirections}
          >
            {loadingDirections ? 'Thinking...' : 'Suggest story directions'}
          </button>
        )}
        {directions && (
          <div className="directions-grid">
            {directions.map((d) => (
              <DirectionCard
                key={d.id}
                summary={d.summary}
                preview={d.preview}
                onPick={() => handlePickDirection(d)}
                disabled={generating}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
