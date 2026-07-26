/**
 * models/Ad.js
 * -----------------------------------------------------------------------------
 * Modèle prévisionnel pour les annonces publicitaires internes (ex. mise en
 * avant d'un artisan Pro, partenariat local) — fonctionnalité identifiée pour
 * une phase future et non activée dans le MVP, mais le schéma est défini dès
 * maintenant pour éviter une migration de données ultérieure.
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

const PLACEMENTS = ['home', 'blog', 'dashboard_artisan', 'dashboard_client'];

const adSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Le titre de l'annonce est requis."],
      trim: true,
      maxlength: [150, 'Le titre ne peut pas dépasser 150 caractères.'],
    },
    description: {
      type: String,
      maxlength: [300, 'La description ne peut pas dépasser 300 caractères.'],
      default: '',
    },
    imageUrl: {
      type: String,
      required: [true, "L'image de l'annonce est requise."],
    },
    targetUrl: {
      type: String,
      required: [true, 'Le lien de destination est requis.'],
    },
    advertiserName: {
      type: String,
      trim: true,
      default: null,
    },
    placement: {
      type: String,
      required: [true, "L'emplacement de diffusion est requis."],
      enum: {
        values: PLACEMENTS,
        message: 'Emplacement invalide : {VALUE}.',
      },
    },
    startDate: {
      type: Date,
      required: [true, 'La date de début est requise.'],
    },
    endDate: {
      type: Date,
      required: [true, 'La date de fin est requise.'],
      validate: {
        validator: function isAfterStart(value) {
          return value > this.startDate;
        },
        message: 'La date de fin doit être postérieure à la date de début.',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    impressionsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    clicksCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

adSchema.index({ placement: 1, isActive: 1 });

/**
 * Indique si l'annonce est actuellement diffusable (active ET dans sa
 * fenêtre de dates) — pratique pour filtrer côté API sans dupliquer la
 * logique de date dans chaque requête.
 */
adSchema.virtual('isCurrentlyRunning').get(function isCurrentlyRunning() {
  const now = new Date();
  return this.isActive && this.startDate <= now && this.endDate >= now;
});

const Ad = mongoose.model('Ad', adSchema);

Ad.PLACEMENTS = PLACEMENTS;

module.exports = Ad;
