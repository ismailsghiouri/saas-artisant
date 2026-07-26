import { useSearchParams } from 'react-router-dom';
import { useArtisans } from '../hooks/useArtisans';
import { PROFESSIONS } from '../utils/helpers';
import ArtisanCard from './ArtisanCard';

export default function ArtisanList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const profession = searchParams.get('profession') || '';
  const city = searchParams.get('city') || '';
  const minRating = searchParams.get('minRating') || '';
  const page = Number(searchParams.get('page')) || 1;

  const { artisans, pagination, isLoading, error } = useArtisans({
    profession: profession || undefined,
    city: city || undefined,
    minRating: minRating || undefined,
    page,
    limit: 9,
  });

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const goToPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:flex-row sm:items-center">
        <select
          value={profession}
          onChange={(e) => updateParam('profession', e.target.value)}
          className="select-field sm:w-52"
        >
          <option value="">Tous les métiers</option>
          {PROFESSIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Ville"
          value={city}
          onChange={(e) => updateParam('city', e.target.value)}
          className="input-field sm:w-52"
        />

        <select
          value={minRating}
          onChange={(e) => updateParam('minRating', e.target.value)}
          className="select-field sm:w-52"
        >
          <option value="">Toutes les notes</option>
          <option value="4">4★ et plus</option>
          <option value="3">3★ et plus</option>
        </select>
      </div>

      {isLoading && <p className="text-gray-500 dark:text-gray-400">Chargement des artisans...</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {!isLoading && !error && artisans.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          Aucun artisan ne correspond à votre recherche pour le moment.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {artisans.map((artisan) => (
          <ArtisanCard key={artisan._id} artisan={artisan} />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            className="btn-outline"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Précédent
          </button>
          <span className="px-2 text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="btn-outline"
            disabled={page >= pagination.totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
