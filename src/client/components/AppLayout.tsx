import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import InstallPrompt from './InstallPrompt';
import type { ReactNode } from 'react';

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

export default function AppLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      {/* Top bar */}
      <header className="app-header">
        <nav className="page-container app-header-inner">
          <Link to="/dashboard" className="site-logo">
            <LogoMark />
            <span className="logo-text">Taleium</span>
          </Link>
          <div className="app-header-nav">
            <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'app-nav-link active' : 'app-nav-link'}>My Stories</NavLink>
            <NavLink to="/browse" className={({ isActive }) => isActive ? 'app-nav-link active' : 'app-nav-link'}>Browse</NavLink>
            <NavLink to="/account" className={({ isActive }) => isActive ? 'app-nav-link active' : 'app-nav-link'}>Account</NavLink>
            <button onClick={logout} className="nav-logout">Sign out</button>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="app-main">
        {children || <Outlet />}
      </main>

      {/* Mobile bottom nav */}
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

      <InstallPrompt />
    </div>
  );
}
