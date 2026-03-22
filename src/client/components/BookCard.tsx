import { Link } from 'react-router-dom';
import { GENRE_LABELS } from './GenrePicker';

interface BookCardProps {
  id: string;
  title: string;
  description: string | null;
  ageRange: string;
  genre?: string | null;
  chapterCount: number;
  coverImageUrl: string | null;
  coverImageAttribution: string | null;
  to?: string;
}

const AGE_LABELS: Record<string, string> = {
  '3-5': 'Ages 3-5',
  '6-8': 'Ages 6-8',
  '9-12': 'Ages 9-12',
};

function BookPlaceholder({ title }: { title: string }) {
  return (
    <div className="book-card-placeholder">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="6" width="16" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
        <rect x="14" y="4" width="16" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.2" />
        <line x1="18" y1="12" x2="26" y2="12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.2" />
        <line x1="18" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.15" />
      </svg>
      <span className="placeholder-title">{title}</span>
    </div>
  );
}

export default function BookCard({
  id,
  title,
  description,
  ageRange,
  genre,
  chapterCount,
  coverImageUrl,
  to,
}: BookCardProps) {
  return (
    <div className="book-card">
      <Link to={to || `/books/${id}`} className="book-card-link">
        <div className="book-card-cover">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="" loading="lazy" />
          ) : (
            <BookPlaceholder title={title} />
          )}
        </div>
        <div className="book-card-body">
          <div className="book-card-badges">
            <span className={`badge badge-age age-${ageRange}`}>{AGE_LABELS[ageRange] || ageRange}</span>
            {genre && <span className="badge badge-genre">{GENRE_LABELS[genre] || genre}</span>}
          </div>
          <h3 className="book-card-title">{title}</h3>
          {description && <p className="book-card-desc">{description}</p>}
          <span className="book-card-chapters">
            {chapterCount === 0 ? 'No chapters yet' : `${chapterCount} chapter${chapterCount !== 1 ? 's' : ''}`}
          </span>
        </div>
      </Link>
    </div>
  );
}
