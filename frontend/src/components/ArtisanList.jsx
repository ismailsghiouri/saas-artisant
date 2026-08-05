import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useArtisans } from '../hooks/useArtisans';
import { PROFESSIONS } from '../utils/helpers';
import ArtisanCard from './ArtisanCard';

// Emplacement réservé pour une future intégration publicitaire (Google
// AdSense ou régie interne via le modèle Ad) — statique pour l'instant, sans
// appel réseau, en attendant qu'un besoin réel de monétisation soit confirmé.
function AdBanner() {
  const { t } = useTranslation();
  return (
    <div className="my-8 flex items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 py-8 text-sm text-gray-400 dark:text-gray-600">
      Emplacement publicitaire
    </div>
  );
}

export default function ArtisanList() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const profession = searchParams.get('profession') || '';
  const city = searchParams.get('city') || '';
  const minRating = searchParams.get('minRating') || '';
  const query = searchParams.get('q') || '';
  const page = Number(searchParams.get('page')) || 1;
  // Position GPS optionnelle (ex. transmise par l'assistant vocal quand
  // aucune ville n'a été précisée à l'oral) : trie les résultats par
  // proximité plutôt que par note. Ignorée si une ville est aussi fournie
  // (voir diagnosticController.findMatchingArtisans pour la même priorité).
  const lat = searchParams.get('lat') || '';
  const lng = searchParams.get('lng') || '';

  const [searchInput, setSearchInput] = useState(query);

  // Recherche en temps réel : on ne renvoie le texte tapé vers l'URL/les
  // filtres qu'après une courte pause, pour éviter de re-filtrer à chaque
  // frappe.
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== query) updateParam('q', searchInput.trim());
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // L'API backend attend "category" (voir middleware/validation.js
  // schemas.searchWorkers) ; "profession" reste le nom du paramètre d'URL
  // partagé par les liens/redirections vers cette page.
  const { artisans, pagination, isLoading, error } = useArtisans({
    category: profession || undefined,
    city: city || undefined,
    minRating: minRating || undefined,
    // Comme côté diagnostic vocal, la ville explicite prime sur la position
    // GPS ambiante si les deux sont présentes.
    lat: !city && lat ? lat : undefined,
    lng: !city && lng ? lng : undefined,
    page,
    limit: 12,
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

  // Le backend filtre déjà par métier/ville/note ; la recherche texte affine
  // en plus, côté client, sur le nom et la ville de la page en cours.
  const filteredArtisans = query
    ? artisans.filter((artisan) => {
        const haystack = `${artisan.name} ${artisan.city}`.toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
    : artisans;

  const premiumArtisans = filteredArtisans.filter((artisan) => artisan.isPremium);
  const organicArtisans = filteredArtisans.filter((artisan) => !artisan.isPremium);
  const isSortedByProximity = !city && Boolean(lat) && Boolean(lng);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        <input
          type="search"
          placeholder={t('search.placeholder')}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="input-field"
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={profession}
            onChange={(e) => updateParam('profession', e.target.value)}
            className="select-field sm:w-52"
          >
            <option value="">{t('search.allProfessions')}</option>
            {PROFESSIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {t(`professions.${p.value}`)}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder={t('search.cityPlaceholder')}
            value={city}
            onChange={(e) => updateParam('city', e.target.value)}
            className="input-field sm:w-52"
          />

          <select
            value={minRating}
            onChange={(e) => updateParam('minRating', e.target.value)}
            className="select-field sm:w-52"
          >
            <option value="">{t('search.allRatings')}</option>
            <option value="4">{t('search.rating4')}</option>
            <option value="3">{t('search.rating3')}</option>
          </select>
        </div>
      </div>

      {isSortedByProximity && (
        <p className="mb-4 text-sm font-medium text-primary-700 dark:text-primary-400">
          📍 Résultats triés par proximité, selon votre position.
        </p>
      )}

      {isLoading && <p className="text-gray-500 dark:text-gray-400">{t('search.loading')}</p>}
      {error && <p className="text-red-600 dark:text-red-400">{error}</p>}

      {!isLoading && !error && filteredArtisans.length === 0 && (
        <p className="text-gray-500 dark:text-gray-400">
          {t('search.noResults')}
        </p>
      )}

      {!isLoading && !error && premiumArtisans.length > 0 && (
        <section className="mb-8">
          <h2 className="section-title mb-4 text-xl">{t('search.premium')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {premiumArtisans.map((artisan) => (
              <ArtisanCard key={artisan._id} artisan={artisan} premium />
            ))}
          </div>
        </section>
      )}

      {!isLoading && !error && premiumArtisans.length > 0 && organicArtisans.length > 0 && (
        <AdBanner />
      )}

      {!isLoading && !error && organicArtisans.length > 0 && (
        <section>
          {premiumArtisans.length > 0 && (
            <h2 className="section-title mb-4 text-xl">{t('search.others')}</h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organicArtisans.map((artisan) => (
              <ArtisanCard key={artisan._id} artisan={artisan} />
            ))}
          </div>
        </section>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            className="btn-outline"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            {t('search.prev')}
          </button>
          <span className="px-2 text-sm text-gray-500 dark:text-gray-400">
            {t('search.page')} {pagination.page} / {pagination.totalPages}
          </span>
          <button
            className="btn-outline"
            disabled={page >= pagination.totalPages}
            onClick={() => goToPage(page + 1)}
          >
            {t('search.next')}
          </button>
        </div>
      )}
    </div>
  );
}
