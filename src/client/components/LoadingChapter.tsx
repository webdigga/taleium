const stages = [
  'Reading the story so far...',
  'Imagining what happens next...',
  'Writing your chapter...',
  'Adding the finishing touches...',
];

export default function LoadingChapter() {
  return (
    <div className="loading-chapter" role="status" aria-live="polite">
      <div className="loading-book">
        <div className="book-page page-left"></div>
        <div className="book-page page-right"></div>
      </div>
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
