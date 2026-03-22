import { useState } from 'react';
import { Link } from 'react-router-dom';
import ReadAloudControls from './ReadAloudControls';
import UpgradePrompt from './UpgradePrompt';
import StarringCast from './StarringCast';

interface CharacterMeta {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface ChapterReaderProps {
  chapters: Array<{ chapter_number: number; title: string; content: string }>;
  bookTitle: string;
  startIndex?: number;
  addChapterUrl?: string;
  atChapterLimit?: boolean;
  characters?: CharacterMeta[];
}

function findChapterCharacters(content: string, characters: CharacterMeta[]): CharacterMeta[] {
  const lower = content.toLowerCase();
  return characters.filter((c) => lower.includes(c.name.toLowerCase()));
}

function renderContent(content: string, isFirstChapter: boolean) {
  const paragraphs = content.split('\n\n');
  return paragraphs.map((para, i) => (
    <p key={i} className={i === 0 && isFirstChapter ? 'first-paragraph' : undefined}>
      {para}
    </p>
  ));
}

function ChapterDivider() {
  return (
    <div className="chapter-divider" aria-hidden="true">
      <svg width="80" height="16" viewBox="0 0 80 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 8H30" stroke="var(--color-border)" strokeWidth="1" />
        <path d="M50 8H80" stroke="var(--color-border)" strokeWidth="1" />
        <path d="M36 4L40 8L44 4" stroke="var(--color-secondary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
        <path d="M36 8L40 12L44 8" stroke="var(--color-secondary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
      </svg>
    </div>
  );
}

export default function ChapterReader({ chapters, bookTitle, startIndex = 0, addChapterUrl, atChapterLimit, characters = [] }: ChapterReaderProps) {
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

      {isFirst && characters.length > 0 && (
        <StarringCast characters={characters} />
      )}

      <div className="reader-chapter-nav-top">
        <span className="reader-page-indicator">
          Chapter {chapter.chapter_number} of {chapters.length}
        </span>
      </div>

      <ReadAloudControls chapters={[chapter]} />

      <ChapterDivider />

      <article className="reader-chapter">
        <h2 className="reader-chapter-heading">
          <span className="reader-chapter-number">Chapter {chapter.chapter_number}</span>
          {chapter.title}
        </h2>
        {(() => {
          const appearing = findChapterCharacters(chapter.content, characters);
          if (appearing.length === 0) return null;
          return (
            <div className="reader-chapter-characters">
              {appearing.map((c) => (
                <span key={c.id} className="reader-char" title={c.name}>
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt={c.name} className="reader-char-img" />
                  ) : (
                    <span className="reader-char-initial">{c.name.charAt(0).toUpperCase()}</span>
                  )}
                  <span className="reader-char-name">{c.name}</span>
                </span>
              ))}
            </div>
          );
        })()}
        <div className="reader-chapter-content">
          {renderContent(chapter.content, true)}
        </div>
      </article>

      <ChapterDivider />

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
        ) : atChapterLimit ? (
          <span />
        ) : (
          <span className="reader-end-label">The end</span>
        )}
      </div>

      {isLast && atChapterLimit && (
        <div style={{ marginTop: 'var(--space-xl)' }}>
          <UpgradePrompt message="You've reached 3 chapters on the free plan. Upgrade to keep writing this story." />
        </div>
      )}
    </div>
  );
}
