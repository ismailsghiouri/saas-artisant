import { Link } from 'react-router-dom';
import { initials, professionLabel } from '../utils/helpers';

function StarRating({ average = 0, count = 0 }) {
  const rounded = Math.round(average);
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="tracking-tight text-accent-500">
        {'★'.repeat(rounded)}
        <span className="text-gray-300 dark:text-gray-700">{'★'.repeat(5 - rounded)}</span>
      </span>
      <span className="font-semibold text-gray-800 dark:text-gray-100">{average.toFixed(1)}</span>
      <span className="text-gray-400">({count} avis)</span>
    </div>
  );
}

export default function ArtisanCard({ artisan, premium = false }) {
  const isVerified = artisan.kycStatus === 'verified';

  return (
    <Link
      to={`/artisans/${artisan._id}`}
      className={`card-hover relative flex flex-col p-5 ${
        premium ? 'ring-2 ring-accent-400 dark:ring-accent-500' : ''
      }`}
    >
      {premium && (
        <span className="badge absolute -top-2.5 left-4 bg-accent-500 text-white shadow-sm">
          🌟 Premium
        </span>
      )}

      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/40 text-lg font-bold text-primary-700 dark:text-primary-300">
          {artisan.profilePhotoUrl ? (
            <img
              src={artisan.profilePhotoUrl}
              alt={artisan.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            initials(artisan.fullName)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900 dark:text-white">
            {artisan.fullName}
          </h3>
          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
            {professionLabel(artisan.profession)}
          </p>
          <div className="mt-1">
            <StarRating average={artisan.rating?.average} count={artisan.rating?.count} />
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-300">
        <span className="truncate">📍 {artisan.city}</span>
        {artisan.phone && <span className="truncate">📞 {artisan.phone}</span>}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {isVerified && (
          <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            ✅ Vérifié
          </span>
        )}
        {artisan.isAvailable && (
          <span className="badge bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
            ⚡ Rapide
          </span>
        )}
        <span className="ml-auto text-gray-500 dark:text-gray-400">
          {artisan.completedJobsCount || 0} interventions
        </span>
      </div>
    </Link>
  );
}
