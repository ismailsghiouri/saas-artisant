/**
 * models/Worker.js
 * -----------------------------------------------------------------------------
 * Discriminator Mongoose de User (role="worker") : profil artisan (plombier,
 * électricien, menuisier...) inscrit sur la plateforme Maalam Expert.
 *
 * Remplace l'ancien modèle "Artisan" (collection dédiée) : les artisans vivent
 * désormais dans la collection "users" partagée avec les clients, différenciés
 * par le champ hérité "role".
 *
 * Points clés conservés de l'ancien modèle (nécessaires au matching géolocalisé
 * et au workflow de vérification, non listés explicitement dans le schéma
 * fonctionnel mais indispensables au reste de l'application) :
 *  - "location" (GeoJSON Point, index 2dsphere) pour les recherches $near.
 *  - "verificationStatus"/"documents" pour le workflow KYC ; "verifiedBadge" /
 *    "verifiedDate" en sont la représentation publique simplifiée.
 *  - "isAvailable" : bascule temps réel indépendante du statut de vérification.
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const User = require('./User');

// Métiers supportés au lancement du MVP.
const CATEGORIES = [
  'plombier',
  'electricien',
  'serrurier',
  'peintre',
  'menuisier',
  'climatisation',
  'electromenager',
  'macon',
  'autre',
];

const VERIFICATION_STATUSES = ['pending', 'verified', 'rejected'];
const WORKER_STATUSES = ['active', 'inactive', 'suspended'];

const workerSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Le métier principal est requis.'],
    enum: { values: CATEGORIES, message: 'Métier non reconnu : {VALUE}.' },
  },
  description: {
    type: String,
    maxlength: [1000, 'La description ne peut pas dépasser 1000 caractères.'],
    default: '',
  },
  photos: {
    type: [String], // URLs vers un stockage externe (S3/CDN)
    default: [],
  },
  services: {
    type: [String],
    default: [],
  },
  yearsExperience: {
    type: Number,
    min: [0, "Le nombre d'années d'expérience ne peut pas être négatif."],
    default: 0,
  },
  priceEstimateRange: {
    min: { type: Number, min: [0, 'Le prix minimum ne peut pas être négatif.'], default: null },
    max: { type: Number, min: [0, 'Le prix maximum ne peut pas être négatif.'], default: null },
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  totalReviews: {
    type: Number,
    min: 0,
    default: 0,
  },
  // Statut premium (mise en avant dans les résultats de recherche, badge
  // profil...). Activation manuelle en l'absence d'intégration PSP.
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumSince: {
    type: Date,
    default: null,
  },
  verifiedBadge: {
    type: Boolean,
    default: false,
  },
  verifiedDate: {
    type: Date,
    default: null,
  },
  // Statut de visibilité/modération du profil (distinct de la vérification
  // d'identité ci-dessous).
  status: {
    type: String,
    enum: { values: WORKER_STATUSES, message: 'Statut invalide : {VALUE}.' },
    default: 'active',
  },
  // Workflow de vérification d'identité (KYC), matérialisé par verifiedBadge
  // une fois "verified".
  verificationStatus: {
    type: String,
    enum: VERIFICATION_STATUSES,
    default: 'pending',
  },
  documents: {
    idCardUrl: { type: String, default: null },
    proofOfAddressUrl: { type: String, default: null },
    certificationUrls: { type: [String], default: [] },
  },
  verificationRejectionReason: {
    type: String,
    default: null,
  },
  // Bascule manuelle de disponibilité côté artisan, indépendante du statut de
  // vérification.
  isAvailable: {
    type: Boolean,
    default: false,
  },
  serviceRadiusKm: {
    type: Number,
    min: [1, "Le rayon d'intervention minimum est de 1 km."],
    max: [100, "Le rayon d'intervention maximum est de 100 km."],
    default: 10,
  },
  // Position de référence de l'artisan au format GeoJSON, utilisée pour le
  // matching géolocalisé (voir reservationController.findNearbyWorkers).
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  completedJobsCount: {
    type: Number,
    default: 0,
    min: 0,
  },
});

workerSchema.index({ location: '2dsphere' });
workerSchema.index({ category: 1, city: 1 });
workerSchema.index({ isAvailable: 1, verificationStatus: 1 });

// --- Hooks ---

/**
 * Renseigne automatiquement verifiedDate lorsque verificationStatus bascule
 * sur "verified" (et le réinitialise sinon), afin que verifiedBadge/
 * verifiedDate restent toujours cohérents avec verificationStatus.
 */
workerSchema.pre('save', function syncVerifiedBadge(next) {
  if (this.isModified('verificationStatus')) {
    this.verifiedBadge = this.verificationStatus === 'verified';
    this.verifiedDate = this.verifiedBadge ? new Date() : null;
  }
  next();
});

const Worker = User.discriminator('Worker', workerSchema, 'worker');

Worker.CATEGORIES = CATEGORIES;
Worker.VERIFICATION_STATUSES = VERIFICATION_STATUSES;
Worker.STATUSES = WORKER_STATUSES;

module.exports = Worker;
