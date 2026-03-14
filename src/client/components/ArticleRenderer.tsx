import { useState, useCallback, useRef, useEffect } from 'react';
import type { CachedArticle } from '../../worker/types';
import ImageWithAttribution from './ImageWithAttribution';
import PullQuote from './PullQuote';
import Timeline from './Timeline';
import ReadNextSuggestions from './ReadNextSuggestions';
import ReadAloudControls from './ReadAloudControls';
import ComprehensionQuiz from './ComprehensionQuiz';
import '../styles/article.css';

interface ArticleRendererProps {
  data: CachedArticle;
}

function estimateReadTime(article: CachedArticle['article']): number {
  const text = [
    article.introduction,
    ...article.sections.map((s) => s.content),
    article.conclusion,
  ].join(' ');
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

function renderContent(text: string) {
  // Split into paragraphs and handle **bold**
  const paragraphs = text.split(/\n\n+/).filter(Boolean);
  return paragraphs.map((p, i) => {
    const parts = p.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </p>
    );
  });
}

export default function ArticleRenderer({ data }: ArticleRendererProps) {
  const { article, images, readingLevel } = data;
  const [activeSectionIndex, setActiveSectionIndex] = useState<number>(-999);
  const [readProgress, setReadProgress] = useState(0);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const introRef = useRef<HTMLDivElement>(null);
  const conclusionRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  const readTime = estimateReadTime(article);

  const handleSectionChange = useCallback((index: number) => {
    setActiveSectionIndex(index);
  }, []);

  // Reading progress bar
  useEffect(() => {
    function handleScroll() {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = Math.min(100, Math.max(0, (scrolled / total) * 100));
      setReadProgress(progress);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to active section
  useEffect(() => {
    if (activeSectionIndex === -999) return;

    let el: HTMLElement | null = null;
    if (activeSectionIndex === -1) el = introRef.current;
    else if (activeSectionIndex === -2) el = conclusionRef.current;
    else el = sectionRefs.current[activeSectionIndex];

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeSectionIndex]);

  const levelClass = `level-${readingLevel}`;

  // Collect all image attributions for the credits section
  const allImages: { alt: string; attribution: string }[] = [];
  if (images.hero) allImages.push(images.hero);
  images.sections.forEach((img) => {
    if (img) allImages.push(img);
  });

  // Determine where to place the pull quote (after section at ~midpoint)
  const pullQuoteAfter = Math.floor(article.sections.length / 2);

  return (
    <article ref={articleRef} className={`article-page ${levelClass}`}>
      {/* Reading progress bar */}
      <div className="reading-progress-track">
        <div
          className="reading-progress-bar"
          style={{ width: `${readProgress}%` }}
          role="progressbar"
          aria-valuenow={Math.round(readProgress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Reading progress"
        />
      </div>

      {/* Hero image */}
      <div className="article-hero">
        {images.hero ? (
          <img
            src={images.hero.thumbnailUrl}
            alt={images.hero.alt}
            width={images.hero.width}
            height={images.hero.height}
            loading="eager"
          />
        ) : (
          <div className="article-hero-placeholder">
            <span>{article.title}</span>
          </div>
        )}
      </div>

      <div className="content-container">
        {/* Meta badges */}
        <div className="article-meta">
          {article.category && (
            <span className="badge badge-category">{article.category}</span>
          )}
          <span className={`badge badge-level ${readingLevel}`}>
            {readingLevel.replace(/-/g, ' ')}
          </span>
          {article.era && <span className="badge badge-era">{article.era}</span>}
          <span className="badge badge-era">{readTime} min read</span>
        </div>

        {/* Title */}
        <header className="article-header">
          <h1 className="article-title">{article.title}</h1>
          <p className="article-subtitle">{article.subtitle}</p>
        </header>

        {/* Read Aloud */}
        <ReadAloudControls
          content={{
            introduction: article.introduction,
            sections: article.sections,
            conclusion: article.conclusion,
          }}
          readingLevel={readingLevel}
          onSectionChange={handleSectionChange}
        />

        {/* Key Facts */}
        {article.keyFacts && article.keyFacts.length > 0 && (
          <aside className="key-facts-box">
            <h3 className="key-facts-heading">Key Facts</h3>
            <ul className="key-facts-list">
              {article.keyFacts.map((fact, i) => (
                <li key={i}>{fact}</li>
              ))}
            </ul>
          </aside>
        )}

        {/* Introduction */}
        <div
          ref={introRef}
          className={`article-introduction ${activeSectionIndex === -1 ? 'reading-active' : ''}`}
        >
          {renderContent(article.introduction)}
        </div>

        {/* Sections */}
        {article.sections.map((section, i) => {
          const sectionImage = images.sections[i];
          const floatSide = i % 2 === 0 ? 'float-left' : 'float-right';

          return (
            <div key={i}>
              <section
                ref={(el) => { sectionRefs.current[i] = el; }}
                className={`article-section ${activeSectionIndex === i ? 'reading-active' : ''}`}
              >
                <h2>{section.heading}</h2>

                {sectionImage && (
                  <div className={`section-image-wrapper ${floatSide}`}>
                    <ImageWithAttribution
                      src={sectionImage.thumbnailUrl}
                      alt={sectionImage.alt}
                      attribution={sectionImage.attribution}
                      caption={section.imageCaption}
                      width={sectionImage.width}
                      height={sectionImage.height}
                    />
                  </div>
                )}

                <div className="section-content">
                  {renderContent(section.content)}
                </div>
              </section>

              {i === pullQuoteAfter && <PullQuote quote={article.pullQuote} />}

              {/* Did You Know — insert between sections */}
              {article.didYouKnow && article.didYouKnow.length > 0 && (() => {
                const spacing = Math.max(1, Math.floor(article.sections.length / article.didYouKnow.length));
                const factIndex = Math.floor(i / spacing);
                if (i % spacing === spacing - 1 && factIndex < article.didYouKnow.length) {
                  return (
                    <aside className="did-you-know">
                      <span className="did-you-know-label">Did you know?</span>
                      <p>{article.didYouKnow[factIndex]}</p>
                    </aside>
                  );
                }
                return null;
              })()}
            </div>
          );
        })}

        {/* Timeline */}
        <Timeline entries={article.timeline} />

        {/* Conclusion */}
        <div
          ref={conclusionRef}
          className={`article-conclusion ${activeSectionIndex === -2 ? 'reading-active' : ''}`}
        >
          {renderContent(article.conclusion)}
        </div>

        {/* Vocabulary */}
        {article.vocabulary && article.vocabulary.length > 0 && (
          <aside className="vocabulary-box">
            <h3 className="vocabulary-heading">Key Vocabulary</h3>
            <dl className="vocabulary-list">
              {article.vocabulary.map((v, i) => (
                <div key={i} className="vocabulary-entry">
                  <dt>{v.term}</dt>
                  <dd>{v.definition}</dd>
                </div>
              ))}
            </dl>
          </aside>
        )}

        {/* Comprehension Quiz */}
        {article.comprehension && article.comprehension.length > 0 && (
          <ComprehensionQuiz questions={article.comprehension} />
        )}

        {/* Read Next */}
        <ReadNextSuggestions slug={data.slug} readingLevel={readingLevel} />

        {/* Image Credits */}
        {allImages.length > 0 && (
          <aside className="image-credits">
            <h3>Image Credits</h3>
            <ul>
              {allImages.map((img, i) => (
                <li key={i}>{img.attribution}</li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </article>
  );
}
