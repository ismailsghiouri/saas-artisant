import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  acceptReservation,
  fetchArtisanReviews,
  fetchAvailableJobs,
  fetchWorkerAnalytics,
  fetchWorkerMe,
  updateWorkerAvailability,
  updateWorkerProfile,
  upgradeWorkerToPremium,
} from '../utils/api';
import { PROFESSIONS, formatDate, formatPrice, professionLabel } from '../utils/helpers';

const PROFILE_FIELDS_FOR_COMPLETION = (worker) => [
  Boolean(worker.name),
  Boolean(worker.phone),
  Boolean(worker.city),
  Boolean(worker.description),
  Boolean(worker.category),
  worker.photos?.length > 0,
  Boolean(worker.avatarUrl),
  worker.yearsExperience > 0,
  Boolean(worker.priceEstimateRange?.min || worker.priceEstimateRange?.max),
];

function StatCard({ label, value, hint }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

function IncomingJobCard({ job, onAccept, onDismiss }) {
  const [actionError, setActionError] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);

  const handleAccept = async () => {
    setActionError('');
    setIsAccepting(true);
    try {
      await onAccept(job._id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="card p-4">
      <p className="font-semibold text-gray-900 dark:text-white">{professionLabel(job.serviceCategory)}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{job.address}</p>
      <p className="mt-1 text-xs text-gray-400">{formatDate(job.createdAt)}</p>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{job.description}</p>
      {actionError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{actionError}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={handleAccept} disabled={isAccepting} className="btn-primary">
          {isAccepting ? 'Confirmation...' : 'Confirmer'}
        </button>
        <button onClick={() => onDismiss(job._id)} className="btn-outline">
          Refuser
        </button>
        <button
          type="button"
          onClick={() => window.alert('La messagerie intégrée arrive bientôt.')}
          className="btn-ghost"
        >
          Message
        </button>
      </div>
    </div>
  );
}

function ProfileEditor({ worker, onSaved }) {
  const [form, setForm] = useState({
    name: worker.name || '',
    phone: worker.phone || '',
    city: worker.city || '',
    description: worker.description || '',
    category: worker.category || '',
  });
  const [photos, setPhotos] = useState(worker.photos || []);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [services, setServices] = useState(worker.services || []);
  const [newService, setNewService] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  const addPhoto = () => {
    if (!newPhotoUrl.trim() || photos.length >= 5) return;
    setPhotos([...photos, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
  };
  const removePhoto = (index) => setPhotos(photos.filter((_, i) => i !== index));

  const addService = () => {
    if (!newService.trim() || services.includes(newService.trim())) return;
    setServices([...services, newService.trim()]);
    setNewService('');
  };
  const removeService = (service) => setServices(services.filter((s) => s !== service));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSavedMessage('');
    setIsSaving(true);
    try {
      const updated = await updateWorkerProfile({ ...form, photos, services });
      onSaved(updated.data);
      setSavedMessage('Profil mis à jour.');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}
      {savedMessage && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/30 px-3 py-2 text-sm text-green-700 dark:text-green-300">
          {savedMessage}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label-field">Nom complet</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field">Téléphone</label>
          <input
            className="input-field"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field">Ville</label>
          <input
            className="input-field"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
        </div>
        <div>
          <label className="label-field">Métier principal</label>
          <select
            className="select-field"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {PROFESSIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label-field">Description</label>
        <textarea
          rows={3}
          maxLength={1000}
          className="input-field"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Présentez votre expérience et vos spécialités..."
        />
      </div>

      <div>
        <label className="label-field">Services proposés</label>
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <span key={service} className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
              {service}
              <button type="button" onClick={() => removeService(service)} className="ml-1.5 text-primary-500">
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className="input-field"
            placeholder="Ex : Débouchage"
            value={newService}
            onChange={(e) => setNewService(e.target.value)}
          />
          <button type="button" onClick={addService} className="btn-outline shrink-0">
            Ajouter
          </button>
        </div>
      </div>

      <div>
        <label className="label-field">Photos ({photos.length}/5)</label>
        <div className="grid grid-cols-5 gap-2">
          {photos.map((url, index) => (
            <div key={url} className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
              <img src={url} alt={`Réalisation ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {photos.length < 5 && (
          <div className="mt-2 flex gap-2">
            <input
              className="input-field"
              placeholder="URL de la photo"
              value={newPhotoUrl}
              onChange={(e) => setNewPhotoUrl(e.target.value)}
            />
            <button type="button" onClick={addPhoto} className="btn-outline shrink-0">
              Ajouter
            </button>
          </div>
        )}
      </div>

      <button type="submit" disabled={isSaving} className="btn-primary w-full sm:w-auto">
        {isSaving ? 'Enregistrement...' : 'Enregistrer le profil'}
      </button>
    </form>
  );
}

function PremiumCard({ worker, onUpgraded }) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (worker.isPremium) {
    return (
      <div className="card p-5">
        <p className="font-semibold text-gray-900 dark:text-white">🌟 Vous êtes Premium</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Votre profil est mis en avant dans les résultats de recherche.
        </p>
      </div>
    );
  }

  const handleUpgrade = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const res = await upgradeWorkerToPremium();
      onUpgraded(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-5">
      <p className="font-semibold text-gray-900 dark:text-white">Passer Premium — 50 MAD/mois</p>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Mettez votre profil en avant dans les recherches et gagnez plus de demandes.
      </p>
      {!worker.verifiedBadge && (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
          Votre profil doit d'abord être vérifié par Maalam Expert.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        onClick={handleUpgrade}
        disabled={isSubmitting || !worker.verifiedBadge}
        className="btn-accent mt-3 w-full sm:w-auto"
      >
        {isSubmitting ? 'Activation...' : 'Activer Premium'}
      </button>
      <p className="mt-2 text-xs text-gray-400">
        Paiement récurrent à venir — l'activation ci-dessus est manuelle en phase MVP.
      </p>
    </div>
  );
}

export default function WorkerDashboard() {
  const { updateUser } = useAuth();
  const [worker, setWorker] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [incomingJobs, setIncomingJobs] = useState([]);
  const [dismissedJobIds, setDismissedJobIds] = useState([]);
  const [latestReview, setLatestReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availabilityError, setAvailabilityError] = useState('');

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [meRes, analyticsRes] = await Promise.all([fetchWorkerMe(), fetchWorkerAnalytics()]);
      setWorker(meRes.data);
      setAnalytics(analyticsRes.data);

      if (meRes.data.verifiedBadge) {
        const jobsRes = await fetchAvailableJobs();
        setIncomingJobs(jobsRes.data);
      } else {
        setIncomingJobs([]);
      }

      const reviewsRes = await fetchArtisanReviews(meRes.data._id);
      setLatestReview(reviewsRes.data[0] || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const profileCompletion = useMemo(() => {
    if (!worker) return 0;
    const fields = PROFILE_FIELDS_FOR_COMPLETION(worker);
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  }, [worker]);

  const handleAcceptJob = async (jobId) => {
    await acceptReservation(jobId);
    await loadAll();
  };

  const handleDismissJob = (jobId) => setDismissedJobIds((ids) => [...ids, jobId]);

  const handleToggleAvailability = async () => {
    setAvailabilityError('');
    try {
      await updateWorkerAvailability(!worker.isAvailable);
      setWorker({ ...worker, isAvailable: !worker.isAvailable });
    } catch (err) {
      setAvailabilityError(err.message);
    }
  };

  if (isLoading) return <p className="page-container py-16 text-gray-500 dark:text-gray-400">Chargement...</p>;
  if (error) return <p className="page-container py-16 text-red-600 dark:text-red-400">{error}</p>;
  if (!worker || !analytics) return null;

  const visibleIncomingJobs = incomingJobs.filter((job) => !dismissedJobIds.includes(job._id));

  return (
    <div className="page-container space-y-8 py-10">
      <div>
        <h1 className="section-title">Tableau de bord artisan</h1>
        <p className="section-subtitle">Bonjour {worker.name.split(' ')[0]}, voici votre activité Maalam Expert.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Réservations (7j)" value={analytics.reservationsThisWeek} hint={`${analytics.totalReservations} au total`} />
        <StatCard label="Note" value={`${analytics.rating.toFixed(1)} ⭐`} hint={`${analytics.totalReviews} avis`} />
        <StatCard label="Revenu (missions terminées)" value={formatPrice(analytics.revenue)} />
        <StatCard label="Profil complété" value={`${profileCompletion}%`} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">Réservations à confirmer</h2>
        {!worker.verifiedBadge ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Votre profil doit être vérifié par Maalam Expert avant de recevoir des demandes.
          </p>
        ) : visibleIncomingJobs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucune demande en attente près de chez vous.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleIncomingJobs.map((job) => (
              <IncomingJobCard
                key={job._id}
                job={job}
                onAccept={handleAcceptJob}
                onDismiss={handleDismissJob}
              />
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">Disponibilité</h2>
        {availabilityError && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{availabilityError}</p>}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {worker.isAvailable ? 'Vous êtes actuellement disponible.' : 'Vous êtes actuellement indisponible.'}
            </p>
            <p className="text-xs text-gray-400">Zone d'intervention : {worker.serviceRadiusKm} km</p>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={!worker.verifiedBadge}
            className={worker.isAvailable ? 'btn-outline' : 'btn-primary'}
          >
            {worker.isAvailable ? 'Se rendre indisponible' : 'Se rendre disponible'}
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Un calendrier de créneaux détaillé arrive bientôt — pour l'instant, cette bascule contrôle votre visibilité en temps réel.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">Mon profil</h2>
        <ProfileEditor worker={worker} onSaved={(updated) => { setWorker(updated); updateUser(updated); }} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">Passer Premium</h2>
        <PremiumCard worker={worker} onUpgraded={setWorker} />
      </section>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-bold text-gray-900 dark:text-white">Derniers avis reçus</h2>
        {latestReview ? (
          <div>
            <span className="text-accent-500">
              {'★'.repeat(latestReview.rating)}
              {'☆'.repeat(5 - latestReview.rating)}
            </span>
            {latestReview.comment && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">"{latestReview.comment}"</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              {latestReview.client?.name || 'Client Maalam Expert'} · {formatDate(latestReview.createdAt)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Aucun avis pour le moment.</p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Messages</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          La messagerie intégrée avec vos clients arrive bientôt. En attendant, contactez-les par téléphone
          depuis vos réservations.
        </p>
      </section>
    </div>
  );
}
