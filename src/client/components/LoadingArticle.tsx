interface LoadingArticleProps {
  topic: string;
  readingLevel: string;
}

const levelLabels: Record<string, string> = {
  'young-explorer': 'Young Explorer',
  'curious-mind': 'Curious Mind',
  'deep-dive': 'Deep Dive',
};

const stages = [
  'Researching your topic...',
  'Writing for your reading level...',
  'Finding illustrations...',
  'Building your article...',
];

export default function LoadingArticle({ topic, readingLevel }: LoadingArticleProps) {
  return (
    <div className="loading-article" role="status" aria-live="polite">
      <div className="loading-book">
        <div className="book-page page-left"></div>
        <div className="book-page page-right"></div>
      </div>
      <h2 className="loading-topic">{topic}</h2>
      <p className="loading-level">{levelLabels[readingLevel] || readingLevel}</p>
      <div className="loading-stages">
        {stages.map((stage, i) => (
          <p key={i} className="loading-stage" style={{ animationDelay: `${i * 4}s` }}>
            {stage}
          </p>
        ))}
      </div>
    </div>
  );
}
