import { useEffect, useState } from 'react';
import { fetchArtisanById, fetchArtisanReviews } from '../utils/api';
import { formatDate, formatPrice, initials, professionLabel } from '../utils/helpers';
import ReservationForm from './ReservationForm';

function ReviewItem({ review }) {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 py-4 last:border-0">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900 dark:text-white">
          {review.client?.fullName || 'Client FixNow'}
        </span>
        <span className="text-accent-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
      </div>
      {review.comment && (
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
      )}
      <p className="mt-1 text-xs text-gray-400">{formatDate(review.createdAt)}</p>
    </div>
  );
}

export default function ArtisanDetail({ artisanId }) {
  const [artisan, setArtisan] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReservationForm, setShowReservationForm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([fetchArtisanById(artisanId), fetchArtisanReviews(artisanId)])
      .then(([artisanRes, reviewsRes]) => {
        if (cancelled) return;
        setArtisan(artisanRes.data);
        setReviews(reviewsRes.data);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setIsLoading(false));

    return () => {
      cancelled = true;
    };
  }, [artisanId]);

  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Chargement du profil...</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (!artisan) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-6">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 dark:bg-primary-900/40 text-2xl font-bold text-primary-700 dark:text-primary-300">
              {artisan.profilePhotoUrl ? (
                <img src={artisan.profilePhotoUrl} alt={artisan.fullName} className="h-full w-full object-cover" />
              ) : (
                initials(artisan.fullName)
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{artisan.fullName}</h1>
                {artisan.isPremium && (
                  <span className="badge bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
                    Premium
                  </span>
                )}
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {professionLabel(artisan.profession)} · {artisan.city}
              </p>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 text-accent-500">
                  ★ <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {artisan.rating?.average?.toFixed(1) ?? '0.0'}
                  </span>
                  <span className="text-gray-400">({artisan.rating?.count || 0} avis)</span>
                </span>
                <span className="text-gray-400">·</span>
                <span className="text-gray-500 dark:text-gray-400">
                  {artisan.completedJobsCount || 0} interventions réalisées
                </span>
              </div>
            </div>
          </div>

          {artisan.bio && (
            <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{artisan.bio}</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="stat-tile">
              <p className="text-xs text-gray-400">Expérience</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {artisan.experienceYears || 0} ans
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-xs text-gray-400">Tarif horaire</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatPrice(artisan.hourlyRate)}
              </p>
            </div>
            <div className="stat-tile">
              <p className="text-xs text-gray-400">Zone d'intervention</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {artisan.serviceRadiusKm} km
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">
            Avis clients ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Aucun avis pour le moment.</p>
          ) : (
            reviews.map((review) => <ReviewItem key={review._id} review={review} />)
          )}
        </div>
      </div>

      <div className="lg:col-span-1">
        <div className="card sticky top-24 p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Besoin d'une intervention ?</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Votre demande sera transmise aux artisans {professionLabel(artisan.profession).toLowerCase()}
            {' '}disponibles près de chez vous, dont potentiellement {artisan.fullName}.
          </p>
          <button onClick={() => setShowReservationForm(true)} className="btn-accent mt-4 w-full">
            Demander une intervention
          </button>
        </div>
      </div>

      {showReservationForm && (
        <ReservationForm
          defaultServiceCategory={artisan.profession}
          onClose={() => setShowReservationForm(false)}
        />
      )}
    </div>
  );
}
