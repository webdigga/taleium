import { Link } from 'react-router-dom';

interface CharacterMeta {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface ChapterCardProps {
  bookId: string;
  chapterNumber: number;
  chapterIndex: number;
  title: string;
  content: string;
  characters?: CharacterMeta[];
}

function findChapterCharacters(content: string, characters: CharacterMeta[]): CharacterMeta[] {
  const lower = content.toLowerCase();
  return characters.filter((c) => lower.includes(c.name.toLowerCase()));
}

export default function ChapterCard({ bookId, chapterNumber, chapterIndex, title, content, characters }: ChapterCardProps) {
  const preview = content.split('\n\n')[0]?.slice(0, 120) + '...';
  const appearing = characters ? findChapterCharacters(content, characters) : [];

  return (
    <Link to={`/books/${bookId}/read?ch=${chapterIndex}`} className="chapter-card">
      <span className="chapter-number">Chapter {chapterNumber}</span>
      <h3 className="chapter-title">{title}</h3>
      <p className="chapter-preview">{preview}</p>
      {appearing.length > 0 && (
        <div className="chapter-characters">
          {appearing.map((c) => (
            <span key={c.id} className="chapter-char-avatar" title={c.name}>
              {c.avatar_url ? (
                <img src={c.avatar_url} alt={c.name} />
              ) : (
                <span className="chapter-char-initial">{c.name.charAt(0).toUpperCase()}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
