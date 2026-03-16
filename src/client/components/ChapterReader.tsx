import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReadAloudControls from './ReadAloudControls';

interface ChapterReaderProps {
  chapters: Array<{ chapter_number: number; title: string; content: string }>;
  bookTitle: string;
  startIndex?: number;
  addChapterUrl?: string;
}

function renderContent(content: string) {
  return content.split('\n\n').map((para, i) => <p key={i}>{para}</p>);
}

export default function ChapterReader({ chapters, bookTitle, startIndex = 0, addChapterUrl }: ChapterReaderProps) {
  const safeStart = Math.max(0, Math.min(startIndex, chapters.length - 1));
  const [currentIndex, setCurrentIndex] = useState(safeStart);

  if (chapters.length === 0) {
    return (
      <div className="chapter-reader">
        <h1 className="reader-title">{bookTitle}</h1>
        <p style={{ textAlign: 'center', color: 'var(--color-muted)' }}>No chapters yet.</p>
      </div>
    );
  }

  const chapter = chapters[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === chapters.length - 1;

  function goTo(index: number) {
    window.speechSynthesis.cancel();
    setCurrentIndex(index);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="chapter-reader">
      <h1 className="reader-title">{bookTitle}</h1>

      <div className="reader-chapter-nav-top">
        <span className="reader-page-indicator">
          Chapter {chapter.chapter_number} of {chapters.length}
        </span>
      </div>

      <ReadAloudControls chapters={[chapter]} />

      <section className="reader-chapter">
        <h2 className="reader-chapter-heading">
          <span className="reader-chapter-number">Chapter {chapter.chapter_number}</span>
          {chapter.title}
        </h2>
        <div className="reader-chapter-content">
          {renderContent(chapter.content)}
        </div>
      </section>

      <div className="reader-chapter-nav">
        {!isFirst ? (
          <button className="btn-secondary" onClick={() => goTo(currentIndex - 1)}>
            Previous chapter
          </button>
        ) : (
          <span />
        )}
        {!isLast ? (
          <button className="btn-primary" onClick={() => goTo(currentIndex + 1)}>
            Next chapter
          </button>
        ) : addChapterUrl ? (
          <Link to={addChapterUrl} className="btn-primary">Continue the story</Link>
        ) : (
          <span className="reader-end-label">The end</span>
        )}
      </div>
    </div>
  );
}
