import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="site-header">
      <nav className="page-container site-nav">
        <Link to="/" className="site-logo">
          <span className="logo-icon">T</span>
          <span className="logo-text">Taleium</span>
        </Link>
        <div className="nav-links">
          <Link to="/browse">Browse</Link>
        </div>
      </nav>
    </header>
  );
}
