import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <nav className="page-container site-nav">
        <Link to="/" className="site-logo">
          <span className="logo-icon">T</span>
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
            <Link to="/login">Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
