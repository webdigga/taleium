import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MobileNav() {
  const { user } = useAuth();

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    if (user) {
      root.classList.add('has-mobile-nav');
    } else {
      root.classList.remove('has-mobile-nav');
    }
    return () => root.classList.remove('has-mobile-nav');
  }, [user]);

  if (!user) return null;

  return (
    <nav className="mobile-nav">
      <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
        </svg>
        <span>Stories</span>
      </NavLink>
      <NavLink to="/create" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
        <span>Create</span>
      </NavLink>
      <NavLink to="/browse" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
        </svg>
        <span>Browse</span>
      </NavLink>
      <NavLink to="/account" className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span>Account</span>
      </NavLink>
    </nav>
  );
}
