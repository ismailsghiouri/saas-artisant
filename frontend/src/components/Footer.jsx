import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="page-container grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link to="/" className="inline-block">
            <img src="/new-logo.png" alt="Maalam Expert" className="h-8 w-auto object-contain" />
          </Link>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('footer.description')}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{t('footer.navigation')}</h3>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link to="/recherche" className="hover:text-primary-600 dark:hover:text-primary-400">
                {t('nav.search')}
              </Link>
            </li>
            <li>
              <Link to="/mes-reservations" className="hover:text-primary-600 dark:hover:text-primary-400">
                {t('nav.bookings')}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{t('footer.trades')}</h3>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>{t('footer.plumbing')}</li>
            <li>{t('footer.electricity')}</li>
            <li>{t('footer.locksmith')}</li>
            <li>{t('footer.painting')}</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">{t('footer.contact')}</h3>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>contact@maalam-expert.ma</li>
            <li>+212 5 00 00 00 00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Maalam Expert. {t('footer.rights')}
      </div>
    </footer>
  );
}
