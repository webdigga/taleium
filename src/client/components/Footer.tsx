import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="site-footer">
      <div className="page-container footer-inner">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <p className="footer-brand">Taleium</p>
            <p className="footer-tagline">Stories created together, one chapter at a time.</p>
          </div>
          <div className="footer-links-col">
            <h4 className="footer-links-heading">Explore</h4>
            <Link to="/browse">Browse stories</Link>
            {user ? (
              <Link to="/dashboard">My stories</Link>
            ) : (
              <Link to="/signup">Create an account</Link>
            )}
          </div>
          <div className="footer-links-col">
            <h4 className="footer-links-heading">Product</h4>
            {!user && <Link to="/login">Sign in</Link>}
            <Link to="/browse">Community</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">&copy; {new Date().getFullYear()} Taleium. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
