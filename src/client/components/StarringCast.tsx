interface CharacterMeta {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface StarringCastProps {
  characters: CharacterMeta[];
}

export default function StarringCast({ characters }: StarringCastProps) {
  if (characters.length === 0) return null;

  return (
    <div className="starring-cast">
      <span className="starring-label">Starring</span>
      <div className="starring-characters">
        {characters.map((c) => (
          <div key={c.id} className="starring-character">
            <div className="starring-avatar">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt={c.name} />
              ) : (
                <span className="starring-initial">{c.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className="starring-name">{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
