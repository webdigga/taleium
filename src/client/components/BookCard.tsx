import { Link } from 'react-router-dom';

interface BookCardProps {
  id: string;
  title: string;
  description: string | null;
  ageRange: string;
  chapterCount: number;
  coverImageUrl: string | null;
  coverImageAttribution: string | null;
  to?: string;
}

const AGE_LABELS: Record<string, string> = {
  '3-5': 'Ages 3\u20135',
  '6-8': 'Ages 6\u20138',
  '9-12': 'Ages 9\u201312',
};

export default function BookCard({
  id,
  title,
  description,
  ageRange,
  chapterCount,
  coverImageUrl,
  to,
}: BookCardProps) {
  return (
    <div className="book-card">
      <Link to={to || `/books/${id}`} className="book-card-link">
        <div className="book-card-cover">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="" />
          ) : (
            <div className="book-card-placeholder" />
          )}
        </div>
        <div className="book-card-body">
          <span className={`badge badge-age age-${ageRange}`}>{AGE_LABELS[ageRange] || ageRange}</span>
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
