import { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';

interface BookMeta {
  id: string;
  title: string;
  description: string | null;
  age_range: string;
  chapter_count: number;
  cover_image_url: string | null;
  cover_image_attribution: string | null;
  share_token: string | null;
}


function IconAgeRange() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="16" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="26" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M6 34C6 28.477 10.477 24 16 24H24C29.523 24 34 28.477 34 34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M16 18L14 22L12 18" stroke="var(--color-secondary)" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function IconAI() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L22 14L30 12L24 18L32 22L24 24L26 32L20 26L14 32L16 24L8 22L16 18L10 12L18 14L20 6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="var(--color-secondary-light)" />
    </svg>
  );
}

function IconReadAloud() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="12" width="10" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M18 16L26 10V30L18 24" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="var(--color-secondary-light)" />
      <path d="M30 16C32 18 32 22 30 24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M33 12C36 16 36 24 33 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EmptyBookIllustration() {
  return (
    <svg width="120" height="100" viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="empty-illustration">
      <rect x="20" y="15" width="40" height="55" rx="4" stroke="var(--color-border)" strokeWidth="2" fill="var(--color-surface-warm)" />
      <rect x="30" y="10" width="40" height="55" rx="4" stroke="var(--color-border)" strokeWidth="2" fill="var(--color-surface)" />
      <rect x="40" y="5" width="40" height="55" rx="4" stroke="var(--color-accent)" strokeWidth="2" fill="white" />
      <line x1="48" y1="20" x2="72" y2="20" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="28" x2="68" y2="28" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="48" y1="36" x2="64" y2="36" stroke="var(--color-border)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="90" cy="20" r="3" fill="var(--color-secondary)" opacity="0.6">
        <animate attributeName="opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="25" cy="75" r="2" fill="var(--color-accent)" opacity="0.4">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="4s" repeatCount="indefinite" />
      </circle>
      <circle cx="100" cy="50" r="2" fill="var(--color-secondary)" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <path d="M55 70L60 62L65 70" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [publicBooks, setPublicBooks] = useState<BookMeta[]>([]);

  useEffect(() => {
    fetch('/api/public')
      .then((res) => res.json() as Promise<{ books: BookMeta[] }>)
      .then((data) => setPublicBooks(data.books || []))
      .catch(() => {});
  }, []);

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="page-container">
          <span className="hero-eyebrow">Create &middot; Imagine &middot; Share</span>
          <h1 className="hero-title">
            Write stories together.<br />
            <span className="hero-highlight">Chapter by chapter.</span>
          </h1>
          <p className="hero-subtitle">
            A collaborative story creator for families.
            You dream up the ideas - Taleium helps bring them to life as beautiful stories.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn-primary btn-lg">Start creating</Link>
            <Link to="/browse" className="btn-secondary btn-lg">Browse stories</Link>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="page-container">
          <h2 className="section-label">How it works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">1</span>
              <h3 className="step-title">Create a story</h3>
              <p className="step-desc">Pick a title, choose an age range, and find a cover image. Your book is ready in seconds.</p>
            </div>
            <div className="step-card">
              <span className="step-number">2</span>
              <h3 className="step-title">Write together</h3>
              <p className="step-desc">Describe what happens next, or let AI suggest story directions. You choose - it writes.</p>
            </div>
            <div className="step-card">
              <span className="step-number">3</span>
              <h3 className="step-title">Share &amp; enjoy</h3>
              <p className="step-desc">Read your story aloud together, share it with grandparents, or publish for the community.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="page-container">
          <h2 className="section-label">Built for families</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon"><IconAgeRange /></div>
              <h3>Age-adapted stories</h3>
              <p>Stories adjust vocabulary and complexity for ages 3-5, 6-8, and 9-12. Every story is age-appropriate.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><IconAI /></div>
              <h3>AI-assisted, human-driven</h3>
              <p>You guide the story. AI helps with the writing. The creative decisions are always yours and your child&apos;s.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon"><IconReadAloud /></div>
              <h3>Read aloud built in</h3>
              <p>Every story has a read-aloud mode with adjustable speed - perfect for bedtime or reading practice.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="quote-section">
        <div className="page-container">
          <blockquote className="home-quote">
            <p>&ldquo;There is no greater agony than bearing an untold story inside you.&rdquo;</p>
            <cite>- Maya Angelou</cite>
          </blockquote>
        </div>
      </section>

      {publicBooks.length > 0 && (
        <section className="featured-section page-container">
          <h2 className="section-heading">Community stories</h2>
          <div className="books-grid">
            {publicBooks.slice(0, 6).map((b) => (
              <BookCard
                key={b.id}
                id={b.id}
                title={b.title}
                description={b.description}
                ageRange={b.age_range}
                chapterCount={b.chapter_count}
                coverImageUrl={b.cover_image_url}
                coverImageAttribution={b.cover_image_attribution}
                to={b.share_token ? `/shared/${b.share_token}` : undefined}
              />
            ))}
          </div>
        </section>
      )}

      <section className="bottom-cta">
        <div className="page-container">
          <EmptyBookIllustration />
          <h2>Ready to write your first story?</h2>
          <p>It only takes a minute to get started. No credit card needed.</p>
          <Link to="/signup" className="btn-primary btn-lg">Create your free account</Link>
        </div>
      </section>
    </main>
  );
}
