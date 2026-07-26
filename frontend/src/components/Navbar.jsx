import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';

const THEME_KEY = 'fixnow_theme';

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  return [isDark, setIsDark];
}

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? 'text-primary-600 dark:text-primary-400'
      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
  }`;

export default function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const [isDark, setIsDark] = useDarkMode();
  const [showLogin, setShowLogin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur">
      <div className="page-container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-primary-700 dark:text-primary-400">
          <span className="text-accent-500">Fix</span>Now
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            Accueil
          </NavLink>
          <NavLink to="/recherche" className={navLinkClass}>
            Trouver un artisan
          </NavLink>
          <NavLink to="/blog" className={navLinkClass}>
            Blog
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/mes-reservations" className={navLinkClass}>
              Mes réservations
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label="Basculer le mode sombre"
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.fullName?.split(' ')[0]}{' '}
                <span className="text-xs text-gray-400">
                  ({role === 'artisan' ? 'artisan' : 'client'})
                </span>
              </span>
              <button onClick={logout} className="btn-ghost">
                Déconnexion
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)} className="btn-primary hidden sm:inline-flex">
              Connexion
            </button>
          )}

          <button
            className="p-2 text-gray-500 md:hidden"
            aria-label="Ouvrir le menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            ☰
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-gray-200 dark:border-gray-800 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Accueil
            </NavLink>
            <NavLink to="/recherche" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Trouver un artisan
            </NavLink>
            <NavLink to="/blog" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              Blog
            </NavLink>
            {isAuthenticated && (
              <NavLink
                to="/mes-reservations"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                Mes réservations
              </NavLink>
            )}
            {isAuthenticated ? (
              <button onClick={logout} className="btn-ghost w-full justify-center">
                Déconnexion
              </button>
            ) : (
              <button onClick={() => setShowLogin(true)} className="btn-primary w-full">
                Connexion
              </button>
            )}
          </div>
        </nav>
      )}

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </header>
  );
}
