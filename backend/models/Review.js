/**
 * models/Review.js
 * -----------------------------------------------------------------------------
 * Avis laissé par un client sur un artisan à l'issue d'une intervention
 * terminée. Une réservation ne peut donner lieu qu'à un seul avis (contrainte
 * d'unicité sur "reservation").
 *
 * À chaque création d'avis, la note moyenne de l'artisan concerné est
 * recalculée automatiquement (hook post-save) afin que Worker.rating reste
 * toujours cohérent avec la collection Review, sans job de synchronisation
 * séparé.
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: [true, "L'avis doit être associé à une réservation."],
      unique: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, "L'avis doit être associé à un client."],
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      required: [true, "L'avis doit être associé à un artisan."],
    },
    rating: {
      type: Number,
      required: [true, 'La note est requise.'],
      min: [1, 'La note minimale est 1.'],
      max: [5, 'La note maximale est 5.'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Le commentaire ne peut pas dépasser 500 caractères.'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ worker: 1, createdAt: -1 });

/**
 * Recalcule la note moyenne et le nombre d'avis d'un artisan à partir de
 * l'ensemble de ses avis en base. Exposée en méthode statique pour pouvoir
 * être appelée aussi bien après création que suppression d'un avis.
 *
 * @param {mongoose.Types.ObjectId} workerId
 */
reviewSchema.statics.recalculateWorkerRating = async function recalculateWorkerRating(workerId) {
  const Worker = mongoose.model('Worker');

  const stats = await this.aggregate([
    { $match: { worker: workerId } },
    {
      $group: {
        _id: '$worker',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Worker.findByIdAndUpdate(workerId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].count,
    });
  } else {
    // Plus aucun avis pour cet artisan (cas d'une suppression) : on remet à zéro.
    await Worker.findByIdAndUpdate(workerId, {
      rating: 0,
      totalReviews: 0,
    });
  }
};

reviewSchema.post('save', async function updateWorkerRatingAfterSave(doc) {
  await doc.constructor.recalculateWorkerRating(doc.worker);
});

module.exports = mongoose.model('Review', reviewSchema);
