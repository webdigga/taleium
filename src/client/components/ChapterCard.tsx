import { Link } from 'react-router-dom';

interface ChapterCardProps {
  bookId: string;
  chapterNumber: number;
  chapterIndex: number;
  title: string;
  content: string;
}

export default function ChapterCard({ bookId, chapterNumber, chapterIndex, title, content }: ChapterCardProps) {
  const preview = content.split('\n\n')[0]?.slice(0, 120) + '...';

  return (
    <Link to={`/books/${bookId}/read?ch=${chapterIndex}`} className="chapter-card">
      <span className="chapter-number">Chapter {chapterNumber}</span>
      <h3 className="chapter-title">{title}</h3>
      <p className="chapter-preview">{preview}</p>
    </Link>
  );
}
