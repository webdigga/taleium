import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
      <path d="M14 6C11.5 4.5 8 4 5 5V22C8 21 11.5 21.5 14 23C16.5 21.5 20 21 23 22V5C20 4 16.5 4.5 14 6Z" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinejoin="round" fill="rgba(226, 114, 91, 0.15)" />
      <line x1="14" y1="6" x2="14" y2="23" stroke="var(--color-accent)" strokeWidth="1.5" />
      <circle cx="21" cy="3" r="1.5" fill="var(--color-secondary)" opacity="0.9" />
      <circle cx="23.5" cy="6" r="0.8" fill="var(--color-secondary)" opacity="0.5" />
    </svg>
  );
}

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <nav className="page-container site-nav">
        <Link to="/" className="site-logo">
          <LogoMark />
          <span className="logo-text">Taleium</span>
        </Link>
        <div className="nav-links">
          <Link to="/browse">Browse</Link>
          {user ? (
            <>
              <Link to="/dashboard">My Stories</Link>
              <Link to="/account">Account</Link>
              <button onClick={logout} className="nav-logout">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/signup" className="nav-cta">Get started</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
