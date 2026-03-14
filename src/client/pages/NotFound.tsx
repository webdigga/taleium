import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="page-container" style={{ paddingTop: '4rem', textAlign: 'center' }}>
      <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ color: 'var(--color-muted)', fontSize: '1.125rem', marginBottom: '2rem' }}>
        This page doesn't exist yet.
      </p>
      <Link to="/" className="search-button" style={{ display: 'inline-block', padding: '0.75rem 1.5rem' }}>
        Back to Home
      </Link>
    </main>
  );
}
