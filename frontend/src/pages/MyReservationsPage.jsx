import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useReservations } from '../hooks/useReservations';
import ReviewForm from '../components/ReviewForm';
import {
  acceptReservation,
  cancelReservation,
  completeReservation,
  fetchAvailableJobs,
  startReservation,
} from '../utils/api';
import {
  RESERVATION_STATUS_LABELS,
  formatDate,
  formatPrice,
  professionLabel,
} from '../utils/helpers';

function StatusBadge({ status }) {
  const meta = RESERVATION_STATUS_LABELS[status] || RESERVATION_STATUS_LABELS.pending;
  return <span className={`badge ${meta.className}`}>{meta.label}</span>;
}

function CompleteJobModal({ reservation, onClose, onDone }) {
  const [finalPrice, setFinalPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await completeReservation(reservation._id, {
        finalPrice: Number(finalPrice),
        paymentMethod,
      });
      onDone();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
          Clôturer l'intervention
        </h2>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="label-field">Montant final (MAD)</label>
            <input
              required
              type="number"
              min="0"
              className="input-field"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">Mode de paiement</label>
            <select
              className="select-field"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Espèces</option>
              <option value="card">Carte</option>
            </select>
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Envoi...' : 'Clôturer'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ClientReservationCard({ reservation, onRefresh }) {
  const [showReview, setShowReview] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleCancel = async () => {
    setActionError('');
    try {
      await cancelReservation(reservation._id, 'Annulée par le client depuis son espace.');
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
            {professionLabel(reservation.serviceCategory)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{reservation.address}</p>
          <p className="mt-1 text-xs text-gray-400">{formatDate(reservation.createdAt)}</p>
        </div>
        <StatusBadge status={reservation.status} />
      </div>

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{reservation.description}</p>

      {reservation.artisan && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Artisan assigné : <span className="font-medium">{reservation.artisan.fullName}</span> (
          {reservation.artisan.phone})
        </p>
      )}

      {reservation.status === 'completed' && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Montant payé : {formatPrice(reservation.finalPrice)}
        </p>
      )}

      {actionError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {['pending', 'assigned'].includes(reservation.status) && (
          <button onClick={handleCancel} className="btn-outline">
            Annuler la demande
          </button>
        )}
        {reservation.status === 'completed' && (
          <button onClick={() => setShowReview(true)} className="btn-primary">
            Laisser un avis
          </button>
        )}
      </div>

      {showReview && (
        <ReviewForm
          reservation={reservation}
          onClose={() => setShowReview(false)}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}

function ArtisanReservationCard({ reservation, onRefresh }) {
  const [showComplete, setShowComplete] = useState(false);
  const [actionError, setActionError] = useState('');

  const runAction = async (action) => {
    setActionError('');
    try {
      await action();
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
            {professionLabel(reservation.serviceCategory)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{reservation.address}</p>
          <p className="mt-1 text-xs text-gray-400">{formatDate(reservation.createdAt)}</p>
        </div>
        <StatusBadge status={reservation.status} />
      </div>

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{reservation.description}</p>

      {reservation.client && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Client : <span className="font-medium">{reservation.client.fullName}</span> (
          {reservation.client.phone})
        </p>
      )}

      {actionError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{actionError}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {reservation.status === 'assigned' && (
          <>
            <button
              onClick={() => runAction(() => startReservation(reservation._id))}
              className="btn-primary"
            >
              Démarrer l'intervention
            </button>
            <button
              onClick={() =>
                runAction(() => cancelReservation(reservation._id, 'Annulée par l\'artisan.'))
              }
              className="btn-outline"
            >
              Annuler
            </button>
          </>
        )}
        {reservation.status === 'in_progress' && (
          <>
            <button onClick={() => setShowComplete(true)} className="btn-primary">
              Clôturer l'intervention
            </button>
            <button
              onClick={() =>
                runAction(() => cancelReservation(reservation._id, 'Annulée par l\'artisan.'))
              }
              className="btn-outline"
            >
              Annuler
            </button>
          </>
        )}
      </div>

      {showComplete && (
        <CompleteJobModal
          reservation={reservation}
          onClose={() => setShowComplete(false)}
          onDone={onRefresh}
        />
      )}
    </div>
  );
}

function AvailableJobsPanel({ onRefreshMine }) {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setIsLoading(true);
    fetchAvailableJobs()
      .then((res) => setJobs(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const handleAccept = async (id) => {
    try {
      await acceptReservation(id);
      load();
      onRefreshMine();
    } catch (err) {
      setError(err.message);
    }
  };

  if (isLoading) return <p className="text-gray-500 dark:text-gray-400">Chargement...</p>;
  if (error) return <p className="text-red-600 dark:text-red-400">{error}</p>;
  if (jobs.length === 0)
    return (
      <p className="text-gray-500 dark:text-gray-400">
        Aucune demande disponible près de chez vous pour le moment.
      </p>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {jobs.map((job) => (
        <div key={job._id} className="card p-5">
          <p className="font-semibold text-gray-900 dark:text-white">
            {professionLabel(job.serviceCategory)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{job.address}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{job.description}</p>
          <button onClick={() => handleAccept(job._id)} className="btn-accent mt-3 w-full">
            Accepter cette demande
          </button>
        </div>
      ))}
    </div>
  );
}

export default function MyReservationsPage() {
  const { role } = useAuth();
  const { reservations, isLoading, error, reload } = useReservations();
  const [tab, setTab] = useState('mine');

  return (
    <div className="page-container py-10">
      <h1 className="section-title">Mes réservations</h1>
      <p className="section-subtitle mb-6">
        {role === 'artisan'
          ? 'Gérez vos interventions assignées et découvrez de nouvelles demandes.'
          : 'Suivez le statut de vos demandes d\'intervention.'}
      </p>

      {role === 'artisan' && (
        <div className="mb-6 flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 text-sm font-medium sm:w-96">
          {[
            { value: 'mine', label: 'Mes missions' },
            { value: 'available', label: 'Demandes disponibles' },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 rounded-md py-1.5 transition-colors ${
                tab === t.value
                  ? 'bg-white dark:bg-gray-900 text-primary-700 dark:text-primary-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {role === 'artisan' && tab === 'available' ? (
        <AvailableJobsPanel onRefreshMine={reload} />
      ) : (
        <>
          {isLoading && <p className="text-gray-500 dark:text-gray-400">Chargement...</p>}
          {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
          {!isLoading && !error && reservations.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400">Aucune réservation pour le moment.</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {reservations.map((reservation) =>
              role === 'artisan' ? (
                <ArtisanReservationCard
                  key={reservation._id}
                  reservation={reservation}
                  onRefresh={reload}
                />
              ) : (
                <ClientReservationCard
                  key={reservation._id}
                  reservation={reservation}
                  onRefresh={reload}
                />
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
