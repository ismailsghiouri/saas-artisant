import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import ReviewForm from '../components/ReviewForm';
import {
  cancelReservation,
  deleteReview,
  fetchClientMe,
  fetchMyReservationsAsClient,
  toggleFavoriteWorker,
  updateClientProfile,
  updateReview,
} from '../utils/api';
import { RESERVATION_STATUS_LABELS, formatDate, professionLabel } from '../utils/helpers';

const ACTIVE_STATUSES = ['pending', 'assigned', 'in_progress'];

function StatCard({ label, value }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function ReservationCard({ reservation, onRefresh }) {
  const { t } = useTranslation();
  const [showReview, setShowReview] = useState(false);
  const [actionError, setActionError] = useState('');
  const meta = RESERVATION_STATUS_LABELS[reservation.status] || RESERVATION_STATUS_LABELS.pending;

  const handleCancel = async () => {
    setActionError('');
    try {
      await cancelReservation(reservation._id, 'Annulée depuis le tableau de bord.');
      onRefresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900 dark:text-white">
            {reservation.worker?.name || t('clientDash.artisanToConfirm')} — {professionLabel(reservation.serviceCategory)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(reservation.createdAt)}</p>
        </div>
        <span className={`badge ${meta.className}`}>{meta.label}</span>
      </div>

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{reservation.description}</p>
      {actionError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {ACTIVE_STATUSES.includes(reservation.status) && reservation.status !== 'in_progress' && (
          <button onClick={handleCancel} className="btn-outline">
            {t('clientDash.cancel')}
          </button>
        )}
        <button
          type="button"
          onClick={() => window.alert('La messagerie intégrée arrive bientôt.')}
          className="btn-ghost"
        >
          {t('clientDash.message')}
        </button>
        {reservation.status === 'completed' && (
          <button onClick={() => setShowReview(true)} className="btn-primary">
            {t('clientDash.leaveReview')}
          </button>
        )}
      </div>

      {showReview && (
        <ReviewForm reservation={reservation} onClose={() => setShowReview(false)} onSuccess={onRefresh} />
      )}
    </div>
  );
}

function FavoriteCard({ worker, onRemoved }) {
  const { t } = useTranslation();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      await toggleFavoriteWorker(worker._id);
      onRemoved(worker._id);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="card p-4">
      <p className="font-semibold text-gray-900 dark:text-white">{worker.name}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {professionLabel(worker.category)} · {worker.city}
      </p>
      <p className="mt-1 text-sm text-accent-500">
        ★ {worker.rating?.toFixed(1) ?? '0.0'} <span className="text-gray-400">({worker.totalReviews || 0})</span>
      </p>
      <div className="mt-3 flex gap-2">
        <Link to={`/artisans/${worker._id}`} className="btn-primary flex-1 text-center">
          {t('clientDash.book')}
        </Link>
        <button onClick={handleRemove} disabled={isRemoving} className="btn-outline">
          {t('clientDash.remove')}
        </button>
      </div>
    </div>
  );
}

function PostedReviewCard({ review, onChanged }) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await updateReview(review._id, { rating, comment });
      setIsEditing(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await deleteReview(review._id);
      onChanged();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-4">
      <p className="font-semibold text-gray-900 dark:text-white">{review.worker?.name || 'Artisan'}</p>
      {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {isEditing ? (
        <div className="mt-2 space-y-2">
          <div className="flex gap-1 text-xl">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={value <= rating ? 'text-accent-500' : 'text-gray-300 dark:text-gray-700'}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            maxLength={500}
            className="input-field"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={isSubmitting} className="btn-primary">
              {t('clientDash.save')}
            </button>
            <button onClick={() => setIsEditing(false)} className="btn-ghost">
              {t('clientDash.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className="text-accent-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
          {review.comment && <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>}
          <div className="mt-2 flex gap-2">
            <button onClick={() => setIsEditing(true)} className="btn-outline">
              {t('clientDash.edit')}
            </button>
            <button onClick={handleDelete} disabled={isSubmitting} className="btn-ghost text-red-600 dark:text-red-400">
              {t('clientDash.delete')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [client, setClient] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileForm, setProfileForm] = useState(null);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [meRes, reservationsRes] = await Promise.all([
        fetchClientMe(),
        fetchMyReservationsAsClient(),
      ]);
      setClient(meRes.data);
      setProfileForm({
        name: meRes.data.name || '',
        phone: meRes.data.phone || '',
        city: meRes.data.city || '',
        address: meRes.data.address || '',
      });
      setReservations(reservationsRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const stats = useMemo(() => {
    if (!client) return null;
    return {
      activeCount: reservations.filter((r) => ACTIVE_STATUSES.includes(r.status)).length,
      favoritesCount: client.savedWorkers?.length || 0,
      reviewsCount: client.reviewsPosted?.length || 0,
    };
  }, [client, reservations]);

  const handleRemoveFavorite = (workerId) =>
    setClient((prev) => ({
      ...prev,
      savedWorkers: prev.savedWorkers.filter((w) => w._id !== workerId),
    }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaved('');
    setIsSavingProfile(true);
    try {
      const res = await updateClientProfile(profileForm);
      setClient((prev) => ({ ...prev, ...res.data }));
      updateUser(res.data);
      setProfileSaved('Profil mis à jour.');
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) return <p className="page-container py-16 text-gray-500 dark:text-gray-400">Chargement...</p>;
  if (error) return <p className="page-container py-16 text-red-600 dark:text-red-400">{error}</p>;
  if (!client) return null;

  return (
    <div className="page-container space-y-8 py-10">
      <div>
        <h1 className="section-title">{t('clientDash.title')}</h1>
        <p className="section-subtitle">{t('clientDash.subtitle', { name: client.name.split(' ')[0] })}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label={t('clientDash.activeReservations')} value={stats.activeCount} />
        <StatCard label={t('clientDash.favoriteArtisans')} value={stats.favoritesCount} />
        <StatCard label={t('clientDash.reviewsPosted')} value={stats.reviewsCount} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{t('clientDash.myReservations')}</h2>
        {reservations.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('clientDash.noReservations')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reservations.map((reservation) => (
              <ReservationCard key={reservation._id} reservation={reservation} onRefresh={loadAll} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{t('clientDash.myFavorites')}</h2>
        {!client.savedWorkers || client.savedWorkers.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('clientDash.noFavorites')}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {client.savedWorkers.map((worker) => (
              <FavoriteCard key={worker._id} worker={worker} onRemoved={handleRemoveFavorite} />
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{t('clientDash.myProfile')}</h2>
        {profileError && (
          <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {profileError}
          </div>
        )}
        {profileSaved && (
          <div className="mb-3 rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm text-green-700 dark:text-green-300">
            {profileSaved}
          </div>
        )}
        <form onSubmit={handleSaveProfile} className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label-field">{t('clientDash.fullName')}</label>
            <input
              className="input-field"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">{t('clientDash.phone')}</label>
            <input
              className="input-field"
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">{t('clientDash.city')}</label>
            <input
              className="input-field"
              value={profileForm.city}
              onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
            />
          </div>
          <div>
            <label className="label-field">{t('clientDash.address')}</label>
            <input
              className="input-field"
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
            />
          </div>
          <button type="submit" disabled={isSavingProfile} className="btn-primary sm:col-span-2 sm:w-auto">
            {isSavingProfile ? t('clientDash.saving') : t('clientDash.save')}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">{t('clientDash.reviewsSection')}</h2>
        {!client.reviewsPosted || client.reviewsPosted.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('clientDash.noReviews')}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {client.reviewsPosted.map((review) => (
              <PostedReviewCard key={review._id} review={review} onChanged={loadAll} />
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{t('clientDash.messagesSection')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('clientDash.messagesText')}
        </p>
      </section>
    </div>
  );
}
