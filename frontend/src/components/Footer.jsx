import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="page-container grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="text-lg font-extrabold text-primary-700 dark:text-primary-400">
            <span className="text-accent-500">Fix</span>Now
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Trouvez un artisan de confiance près de chez vous, disponible immédiatement.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Navigation</h3>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link to="/recherche" className="hover:text-primary-600 dark:hover:text-primary-400">
                Trouver un artisan
              </Link>
            </li>
            <li>
              <Link to="/blog" className="hover:text-primary-600 dark:hover:text-primary-400">
                Blog
              </Link>
            </li>
            <li>
              <Link to="/mes-reservations" className="hover:text-primary-600 dark:hover:text-primary-400">
                Mes réservations
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Métiers</h3>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>Plomberie</li>
            <li>Électricité</li>
            <li>Serrurerie</li>
            <li>Peinture</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Contact</h3>
          <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
            <li>contact@fixnow.ma</li>
            <li>+212 5 00 00 00 00</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} FixNow. Tous droits réservés.
      </div>
    </footer>
  );
}
