import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

const THEME_KEY = 'maalam_expert_theme';

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
  `text-sm font-medium transition-all px-3.5 py-1.5 rounded-lg ${
    isActive
      ? 'bg-primary-500/10 text-primary-800 dark:text-primary-300 font-semibold'
      : 'text-gray-600 dark:text-gray-300 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
  }`;

export default function Navbar() {
  const { user, role, isAuthenticated, logout } = useAuth();
  const [isDark, setIsDark] = useDarkMode();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/80 dark:border-gray-800/80 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
      <div className="page-container flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center group">
          <img src="/new-logo.png" alt="Maalam Expert" className="h-14 sm:h-16 w-auto object-contain group-hover:opacity-90 transition-opacity" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" end className={navLinkClass}>
            {t('nav.home')}
          </NavLink>
          <NavLink to="/recherche" className={navLinkClass}>
            {t('nav.search')}
          </NavLink>
          <NavLink to="/diagnostic" className={navLinkClass}>
            {t('nav.diagnostic')}
          </NavLink>
          <NavLink to="/devenir-artisan" className={navLinkClass}>
            {t('nav.becomeArtisan')}
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/dashboard" className={navLinkClass}>
              {t('nav.dashboard')}
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/mes-reservations" className={navLinkClass}>
              {t('nav.bookings')}
            </NavLink>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <select 
            value={i18n.language.split('-')[0]} 
            onChange={changeLanguage}
            className="text-sm bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="fr">FR</option>
            <option value="en">EN</option>
            <option value="ar">AR</option>
          </select>

          <button
            onClick={() => setIsDark(!isDark)}
            aria-label={t('nav.toggleDark')}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            {isDark ? '☀️' : '🌙'}
          </button>

          {isAuthenticated ? (
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user?.name?.split(' ')[0]}{' '}
                <span className="text-xs text-gray-400">
                  ({role === 'worker' ? t('nav.worker') : t('nav.client')})
                </span>
              </span>
              <button onClick={logout} className="btn-ghost">
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <Link to="/connexion" className="btn-primary hidden sm:inline-flex">
              {t('nav.login')}
            </Link>
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
              {t('nav.home')}
            </NavLink>
            <NavLink to="/recherche" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t('nav.search')}
            </NavLink>
            <NavLink to="/diagnostic" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t('nav.diagnostic')}
            </NavLink>
            <NavLink to="/devenir-artisan" className={navLinkClass} onClick={() => setMobileOpen(false)}>
              {t('nav.becomeArtisan')}
            </NavLink>
            {isAuthenticated && (
              <NavLink to="/dashboard" className={navLinkClass} onClick={() => setMobileOpen(false)}>
                {t('nav.dashboard')}
              </NavLink>
            )}
            {isAuthenticated && (
              <NavLink
                to="/mes-reservations"
                className={navLinkClass}
                onClick={() => setMobileOpen(false)}
              >
                {t('nav.bookings')}
              </NavLink>
            )}
            {isAuthenticated ? (
              <button onClick={logout} className="btn-ghost w-full justify-center">
                {t('nav.logout')}
              </button>
            ) : (
              <Link to="/connexion" className="btn-primary w-full text-center" onClick={() => setMobileOpen(false)}>
                {t('nav.login')}
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
