import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createReservation } from '../utils/api';
import { PROFESSIONS, URGENCY_LEVELS } from '../utils/helpers';

const initialForm = (defaultServiceCategory) => ({
  serviceCategory: defaultServiceCategory || PROFESSIONS[0].value,
  description: '',
  address: '',
  urgency: 'today',
  scheduledAt: '',
  estimatedPrice: '',
});

export default function ReservationForm({ defaultServiceCategory, onClose, onSuccess }) {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(() => initialForm(defaultServiceCategory));
  const [coordinates, setCoordinates] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleLocate = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas disponible sur ce navigateur.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates([position.coords.longitude, position.coords.latitude]);
      },
      () => setLocationError("Impossible d'obtenir votre position. Autorisez la géolocalisation.")
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!coordinates) {
      setError('Merci de partager votre position pour que les artisans puissent vous localiser.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createReservation({
        serviceCategory: form.serviceCategory,
        description: form.description,
        address: form.address,
        location: { coordinates },
        urgency: form.urgency,
        scheduledAt: form.urgency === 'scheduled' ? form.scheduledAt : undefined,
        estimatedPrice: form.estimatedPrice ? Number(form.estimatedPrice) : undefined,
      });
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated && role !== 'client') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-700 dark:text-gray-300">
            Seuls les comptes clients peuvent demander une intervention. Connectez-vous avec un
            compte client pour continuer.
          </p>
          <button className="btn-primary mt-4 w-full" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
          <p className="text-gray-700 dark:text-gray-300">
            Connectez-vous à votre compte client pour demander une intervention.
          </p>
          <div className="mt-4 flex gap-2">
            <button className="btn-outline flex-1" onClick={onClose}>
              Annuler
            </button>
            <button
              className="btn-primary flex-1"
              onClick={() => {
                onClose();
                navigate('/');
              }}
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Demander une intervention</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className="space-y-4 text-center">
            <p className="text-green-600 dark:text-green-400">
              Votre demande a bien été enregistrée ! Nous recherchons un artisan disponible près de
              chez vous.
            </p>
            <button className="btn-primary w-full" onClick={onClose}>
              Fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="label-field">Métier recherché</label>
              <select
                className="select-field"
                value={form.serviceCategory}
                onChange={(e) => setForm({ ...form, serviceCategory: e.target.value })}
              >
                {PROFESSIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-field">Description du problème</label>
              <textarea
                required
                minLength={5}
                maxLength={1000}
                rows={3}
                className="input-field"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex : fuite d'eau sous l'évier de la cuisine..."
              />
            </div>

            <div>
              <label className="label-field">Adresse d'intervention</label>
              <input
                required
                className="input-field"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div>
              <button type="button" onClick={handleLocate} className="btn-outline w-full">
                {coordinates ? 'Position enregistrée ✓' : 'Utiliser ma position actuelle'}
              </button>
              {locationError && <p className="mt-1 text-xs text-red-600">{locationError}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-field">Urgence</label>
                <select
                  className="select-field"
                  value={form.urgency}
                  onChange={(e) => setForm({ ...form, urgency: e.target.value })}
                >
                  {URGENCY_LEVELS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label-field">Budget estimé (MAD)</label>
                <input
                  type="number"
                  min="0"
                  className="input-field"
                  value={form.estimatedPrice}
                  onChange={(e) => setForm({ ...form, estimatedPrice: e.target.value })}
                />
              </div>
            </div>

            {form.urgency === 'scheduled' && (
              <div>
                <label className="label-field">Date planifiée</label>
                <input
                  required
                  type="datetime-local"
                  className="input-field"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                />
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-accent w-full">
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
