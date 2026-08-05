/**
 * models/Reservation.js
 * -----------------------------------------------------------------------------
 * Représente une demande d'intervention (booking) émise par un client, depuis
 * sa création jusqu'à sa clôture (ou son annulation).
 *
 * Le cycle de vie suit le flux décrit dans le document d'architecture Maalam Expert :
 *   pending -> assigned -> in_progress -> completed
 *                                       -> cancelled (à tout moment avant completed)
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const URGENCY_LEVELS = ['immediate', 'today', 'scheduled'];
const STATUSES = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
const PAYMENT_METHODS = ['cash', 'card'];
const PAYMENT_STATUSES = ['pending', 'paid', 'refunded', 'failed'];

const reservationSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'La réservation doit être associée à un client.'],
    },
    // Nul tant qu'aucun artisan n'a accepté la demande.
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Worker',
      default: null,
    },
    serviceCategory: {
      type: String,
      required: [true, 'La catégorie de service est requise.'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Une description du problème est requise.'],
      maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères.'],
    },
    photos: {
      type: [String], // URLs vers un stockage externe (S3/CDN)
      default: [],
    },
    address: {
      type: String,
      required: [true, "L'adresse d'intervention est requise."],
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'La localisation géographique est requise.'],
      },
    },
    urgency: {
      type: String,
      enum: {
        values: URGENCY_LEVELS,
        message: "Niveau d'urgence invalide : {VALUE}.",
      },
      default: 'today',
    },
    // Renseigné uniquement si urgency === 'scheduled'.
    scheduledAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: STATUSES,
        message: 'Statut de réservation invalide : {VALUE}.',
      },
      default: 'pending',
    },
    estimatedPrice: {
      type: Number,
      min: [0, "L'estimation de prix ne peut pas être négative."],
      default: null,
    },
    finalPrice: {
      type: Number,
      min: [0, 'Le montant final ne peut pas être négatif.'],
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: 'pending',
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    // Historique des transitions de statut, utile pour l'audit et le support.
    statusHistory: [
      {
        status: { type: String, enum: STATUSES },
        changedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// --- Index ---
reservationSchema.index({ location: '2dsphere' });
reservationSchema.index({ client: 1, createdAt: -1 });
reservationSchema.index({ worker: 1, status: 1 });
reservationSchema.index({ status: 1, urgency: 1 });

// --- Hooks ---

/**
 * Ajoute automatiquement une entrée à l'historique des statuts à chaque
 * changement, afin de conserver une traçabilité complète de la réservation
 * sans avoir à le gérer manuellement dans chaque contrôleur.
 */
reservationSchema.pre('save', function trackStatusHistory(next) {
  if (this.isModified('status') || this.isNew) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

const Reservation = mongoose.model('Reservation', reservationSchema);

Reservation.URGENCY_LEVELS = URGENCY_LEVELS;
Reservation.STATUSES = STATUSES;
Reservation.PAYMENT_METHODS = PAYMENT_METHODS;

module.exports = Reservation;
