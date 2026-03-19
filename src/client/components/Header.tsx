import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-svg">
      <rect x="3" y="5" width="18" height="22" rx="2.5" fill="var(--color-accent)" />
      <rect x="9" y="3" width="18" height="22" rx="2.5" fill="white" stroke="var(--color-accent)" strokeWidth="1.5" />
      <line x1="14" y1="10" x2="22" y2="10" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="14" y1="14" x2="20" y2="14" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <line x1="14" y1="18" x2="18" y2="18" stroke="var(--color-accent)" strokeWidth="1.2" strokeLinecap="round" opacity="0.3" />
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
