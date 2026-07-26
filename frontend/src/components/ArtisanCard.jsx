import { Link } from 'react-router-dom';
import { initials, professionLabel } from '../utils/helpers';

function StarRating({ average = 0, count = 0 }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-accent-500">★</span>
      <span className="font-semibold text-gray-800 dark:text-gray-100">{average.toFixed(1)}</span>
      <span className="text-gray-400">({count})</span>
    </div>
  );
}

export default function ArtisanCard({ artisan }) {
  return (
    <Link to={`/artisans/${artisan._id}`} className="card-hover flex flex-col p-5">
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
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-gray-900 dark:text-white">
              {artisan.fullName}
            </h3>
            {artisan.isPremium && (
              <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
                Premium
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {professionLabel(artisan.profession)} · {artisan.city}
          </p>
          <div className="mt-1">
            <StarRating average={artisan.rating?.average} count={artisan.rating?.count} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span
          className={`badge ${
            artisan.isAvailable
              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {artisan.isAvailable ? 'Disponible' : 'Indisponible'}
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          {artisan.completedJobsCount || 0} interventions
        </span>
      </div>
    </Link>
  );
}
