import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import UpgradePrompt from '../components/UpgradePrompt';

interface Character {
  id: string;
  name: string;
  appearance: string | null;
  personality: string | null;
  role: string | null;
  avatar_url: string | null;
}

function CharacterAvatar({ character, generating }: { character: Character; generating?: boolean }) {
  if (character.avatar_url) {
    return <img src={character.avatar_url} alt={character.name} className="char-avatar-img" />;
  }
  return (
    <div className={`char-avatar-placeholder${generating ? ' generating' : ''}`}>
      <span>{generating ? '...' : character.name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function Characters() {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [appearance, setAppearance] = useState('');
  const [personality, setPersonality] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [pendingAvatarIds, setPendingAvatarIds] = useState<Set<string>>(new Set());
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isFree = user?.subscriptionStatus === 'free' || user?.subscriptionStatus === 'cancelled';

  const pollForAvatars = useCallback(async (ids: Set<string>) => {
    if (ids.size === 0) return;
    try {
      const res = await fetch('/api/characters', { credentials: 'include' });
      const data = await res.json() as { characters: Character[] };
      const updated = data.characters || [];
      setCharacters(updated);

      const stillPending = new Set<string>();
      for (const id of ids) {
        const c = updated.find((ch) => ch.id === id);
        if (c && !c.avatar_url) stillPending.add(id);
      }
      setPendingAvatarIds(stillPending);
      if (stillPending.size === 0 && pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (pendingAvatarIds.size > 0 && !pollTimerRef.current) {
      pollTimerRef.current = setInterval(() => pollForAvatars(pendingAvatarIds), 3000);
    }
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [pendingAvatarIds, pollForAvatars]);

  useEffect(() => {
    if (isFree) { setLoading(false); return; }
    fetch('/api/characters', { credentials: 'include' })
      .then((res) => res.json() as Promise<{ characters: Character[] }>)
      .then((data) => setCharacters(data.characters || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isFree]);

  function resetForm() {
    setName('');
    setAppearance('');
    setPersonality('');
    setRole('');
    setEditingId(null);
    setShowForm(false);
    setError('');
  }

  function startEdit(c: Character) {
    setName(c.name);
    setAppearance(c.appearance || '');
    setPersonality(c.personality || '');
    setRole(c.role || '');
    setEditingId(c.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const body = {
        name,
        appearance: appearance || undefined,
        personality: personality || undefined,
        role: role || undefined,
      };

      if (editingId) {
        const res = await fetch(`/api/characters/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to update character');
        const data = await res.json() as { character: Character };
        setCharacters((prev) => prev.map((c) => c.id === editingId ? data.character : c));
      } else {
        const res = await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('Failed to create character');
        const data = await res.json() as { character: Character };
        setCharacters((prev) => [...prev, data.character]);
        setPendingAvatarIds((prev) => new Set([...prev, data.character.id]));
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/characters/${id}`, { method: 'DELETE', credentials: 'include' });
      setCharacters((prev) => prev.filter((c) => c.id !== id));
    } catch {}
  }

  async function handleRegenerate(id: string) {
    setRegeneratingId(id);
    try {
      const res = await fetch(`/api/characters/${id}/regenerate-avatar`, {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json() as { character: Character };
        setCharacters((prev) => prev.map((c) => c.id === id ? data.character : c));
      }
    } catch {} finally {
      setRegeneratingId(null);
    }
  }

  if (isFree) {
    return (
      <main className="characters-page page-container">
        <h1 className="characters-title">Characters</h1>
        <UpgradePrompt message="Character profiles are a Premium feature. Upgrade to create reusable characters with custom avatars." />
      </main>
    );
  }

  return (
    <main className="characters-page page-container">
      <div className="characters-header">
        <h1 className="characters-title">Characters</h1>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>New Character</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="char-form">
          <h2 className="char-form-title">{editingId ? 'Edit Character' : 'Create Character'}</h2>

          {error && <div className="auth-error">{error}</div>}

          <label className="auth-field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sparkle, Captain Fox"
              required
            />
          </label>

          <label className="auth-field">
            <span>Appearance (optional)</span>
            <input
              type="text"
              value={appearance}
              onChange={(e) => setAppearance(e.target.value)}
              placeholder="e.g. tiny purple dragon with golden wings"
            />
            <small className="field-hint">This is also used to generate their avatar</small>
          </label>

          <label className="auth-field">
            <span>Personality (optional)</span>
            <input
              type="text"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="e.g. brave but shy, loves puzzles"
            />
          </label>

          <label className="auth-field">
            <span>Role (optional)</span>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. the main hero, the wise mentor"
            />
          </label>

          <div className="char-form-actions">
            <button type="submit" className="btn-primary" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      )}

      {loading && <p className="browse-loading">Loading characters...</p>}

      {!loading && characters.length === 0 && !showForm && (
        <div className="characters-empty">
          <p>You haven't created any characters yet. Characters you create here can be added to any of your stories.</p>
        </div>
      )}

      {!loading && characters.length > 0 && (
        <div className="characters-grid">
          {characters.map((c) => {
            const isPending = pendingAvatarIds.has(c.id);
            const isRegenerating = regeneratingId === c.id;
            return (
              <div key={c.id} className="char-card">
                <div className="char-card-avatar">
                  <CharacterAvatar character={c} generating={isPending} />
                </div>
                <div className="char-card-info">
                  <h3 className="char-card-name">{c.name}</h3>
                  {c.role && <p className="char-card-role">{c.role}</p>}
                  {c.appearance && <p className="char-card-detail">{c.appearance}</p>}
                  {c.personality && <p className="char-card-detail">{c.personality}</p>}
                </div>
                <div className="char-card-actions">
                  <button className="char-action-btn" onClick={() => startEdit(c)} title="Edit">Edit</button>
                  {isPending ? (
                    <span className="char-action-btn" style={{ cursor: 'default' }}>Generating avatar...</span>
                  ) : (
                    <button
                      className="char-action-btn"
                      onClick={() => handleRegenerate(c.id)}
                      disabled={isRegenerating}
                    >
                      {isRegenerating ? 'Generating...' : c.avatar_url ? 'New avatar' : 'Generate avatar'}
                    </button>
                  )}
                  <button className="char-action-btn char-action-delete" onClick={() => handleDelete(c.id)} title="Delete">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
