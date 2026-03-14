import { Link } from 'react-router-dom';

interface ArticleCardProps {
  slug: string;
  readingLevel: string;
  title: string;
  summary: string | null;
  category: string | null;
  heroImageUrl: string | null;
}

export default function ArticleCard({
  slug,
  readingLevel,
  title,
  summary,
  category,
  heroImageUrl,
}: ArticleCardProps) {
  return (
    <article className="article-card">
      <Link to={`/${slug}/${readingLevel}`} className="article-card-link">
        <div className="article-card-image">
          {heroImageUrl ? (
            <img src={heroImageUrl} alt="" loading="lazy" />
          ) : (
            <div className="article-card-placeholder" />
          )}
        </div>
        <div className="article-card-body">
          {category && <span className="badge badge-category">{category}</span>}
          <h3 className="article-card-title">{title}</h3>
          {summary && <p className="article-card-summary">{summary}</p>}
          <span className={`badge badge-level ${readingLevel}`}>
            {readingLevel.replace('-', ' ')}
          </span>
        </div>
      </Link>
    </article>
  );
}
