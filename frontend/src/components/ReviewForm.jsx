import { useState } from 'react';
import { createReview } from '../utils/api';

export default function ReviewForm({ reservation, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await createReview({ reservationId: reservation._id, rating, comment });
      onSuccess?.();
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Laisser un avis</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Votre avis sur l'intervention de{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {reservation.worker?.name}
          </span>
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label-field">Note</label>
            <div className="flex gap-1 text-2xl">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={value <= rating ? 'text-accent-500' : 'text-gray-300 dark:text-gray-700'}
                  aria-label={`${value} étoiles`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-field">Commentaire (optionnel)</label>
            <textarea
              rows={3}
              maxLength={500}
              className="input-field"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre expérience avec cet artisan..."
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? 'Envoi...' : "Publier l'avis"}
          </button>
        </form>
      </div>
    </div>
  );
}
