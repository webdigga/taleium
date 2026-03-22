import { useState, useEffect } from 'react';

interface Character {
  id: string;
  name: string;
  appearance: string | null;
  personality: string | null;
  role: string | null;
  avatar_url: string | null;
}

interface CharacterPickerProps {
  bookId: string;
}

export default function CharacterPicker({ bookId }: CharacterPickerProps) {
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [bookCharacterIds, setBookCharacterIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/characters', { credentials: 'include' })
        .then((res) => res.json() as Promise<{ characters: Character[] }>),
      fetch(`/api/books/${bookId}/characters`, { credentials: 'include' })
        .then((res) => res.json() as Promise<{ characters: Character[] }>),
    ])
      .then(([allData, bookData]) => {
        setAllCharacters(allData.characters || []);
        setBookCharacterIds(new Set((bookData.characters || []).map((c: Character) => c.id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookId]);

  async function toggleCharacter(charId: string) {
    const next = new Set(bookCharacterIds);
    if (next.has(charId)) {
      next.delete(charId);
    } else {
      next.add(charId);
    }

    setSaving(true);
    try {
      await fetch(`/api/books/${bookId}/characters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ characterIds: [...next] }),
      });
      setBookCharacterIds(next);
    } catch {} finally {
      setSaving(false);
    }
  }

  if (loading) return null;
  if (allCharacters.length === 0) {
    return (
      <p className="char-picker-empty">
        No characters yet. <a href="/characters">Create some characters</a> to add them to your stories.
      </p>
    );
  }

  return (
    <div className="char-picker">
      <div className="char-picker-grid">
        {allCharacters.map((c) => {
          const selected = bookCharacterIds.has(c.id);
          return (
            <button
              key={c.id}
              className={`char-picker-item ${selected ? 'active' : ''}`}
              onClick={() => toggleCharacter(c.id)}
              disabled={saving}
              type="button"
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
    </div>
  );
}
