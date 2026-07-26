/**
 * models/Artisan.js
 * -----------------------------------------------------------------------------
 * Schéma Mongoose représentant un artisan partenaire (plombier, électricien,
 * serrurier, etc.) inscrit sur la plateforme FixNow.
 *
 * Points clés :
 *  - Le mot de passe est haché automatiquement avant sauvegarde (bcryptjs) et
 *    n'est jamais renvoyé par défaut dans les requêtes (select: false).
 *  - "location" est un champ GeoJSON Point indexé en 2dsphere, ce qui permet
 *    les recherches géospatiales ($near, $geoWithin) pour le matching client.
 *  - "kycStatus" matérialise le processus de vérification d'identité décrit
 *    dans le cahier des charges (aucun artisan actif tant que non vérifié).
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Liste des métiers supportés au lancement du MVP. Centralisée ici pour être
// réutilisée par les validations (Joi) sans dupliquer la source de vérité.
const PROFESSIONS = [
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

const KYC_STATUSES = ['pending', 'verified', 'rejected'];

const artisanSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Le nom complet est requis.'],
      trim: true,
      minlength: [2, 'Le nom complet doit contenir au moins 2 caractères.'],
      maxlength: [100, 'Le nom complet ne peut pas dépasser 100 caractères.'],
    },
    email: {
      type: String,
      required: [true, "L'email est requis."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Adresse email invalide.'],
    },
    password: {
      type: String,
      required: [true, 'Le mot de passe est requis.'],
      minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères.'],
      select: false,
    },
    phone: {
      type: String,
      required: [true, 'Le numéro de téléphone est requis.'],
      // Formats acceptés : 06XXXXXXXX, 07XXXXXXXX, 05XXXXXXXX ou +212 équivalent.
      match: [/^(\+212|0)[5-7][0-9]{8}$/, 'Numéro de téléphone marocain invalide.'],
    },
    profession: {
      type: String,
      required: [true, 'Le métier principal est requis.'],
      enum: {
        values: PROFESSIONS,
        message: 'Métier non reconnu : {VALUE}.',
      },
    },
    servicesOffered: {
      type: [String],
      default: [],
    },
    city: {
      type: String,
      required: [true, 'La ville est requise.'],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
      default: null,
    },
    // Position de référence de l'artisan au format GeoJSON, utilisée pour le
    // matching géolocalisé (voir reservationController.findNearbyArtisans).
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
    serviceRadiusKm: {
      type: Number,
      min: [1, 'Le rayon d\'intervention minimum est de 1 km.'],
      max: [100, 'Le rayon d\'intervention maximum est de 100 km.'],
      default: 10,
    },
    bio: {
      type: String,
      maxlength: [1000, 'La bio ne peut pas dépasser 1000 caractères.'],
      default: '',
    },
    experienceYears: {
      type: Number,
      min: [0, "Le nombre d'années d'expérience ne peut pas être négatif."],
      default: 0,
    },
    hourlyRate: {
      type: Number,
      min: [0, 'Le tarif horaire ne peut pas être négatif.'],
      default: null,
    },
    profilePhotoUrl: {
      type: String,
      default: null,
    },
    // Documents justificatifs pour la vérification KYC (URLs vers un stockage
    // externe type S3 ; l'upload de fichiers en lui-même est hors périmètre
    // de ce backend et sera géré par un service dédié).
    documents: {
      idCardUrl: { type: String, default: null },
      proofOfAddressUrl: { type: String, default: null },
      certificationUrls: { type: [String], default: [] },
    },
    kycStatus: {
      type: String,
      enum: KYC_STATUSES,
      default: 'pending',
    },
    kycRejectionReason: {
      type: String,
      default: null,
    },
    // Bascule manuelle de disponibilité côté artisan (indépendante du KYC).
    isAvailable: {
      type: Boolean,
      default: false,
    },
    // Permet de désactiver un compte (suspension) sans le supprimer.
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    completedJobsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    role: {
      type: String,
      default: 'artisan',
      immutable: true,
    },
    // Sert à invalider les anciens tokens JWT émis avant un changement de mot
    // de passe (vérification optionnelle côté middleware d'authentification).
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // ajoute createdAt / updatedAt automatiquement
  }
);

// --- Index ---
artisanSchema.index({ location: '2dsphere' });
artisanSchema.index({ profession: 1, city: 1 });
artisanSchema.index({ isAvailable: 1, kycStatus: 1 });

// --- Hooks ---

/**
 * Hache le mot de passe avant chaque sauvegarde, uniquement s'il a été
 * modifié (évite de re-hacher un hash existant lors d'une simple mise à
 * jour de profil qui ne touche pas au mot de passe).
 */
artisanSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  try {
    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, saltRounds);

    // On ne met à jour passwordChangedAt que pour un document existant
    // (pas à la création du compte).
    if (!this.isNew) {
      this.passwordChangedAt = new Date(Date.now() - 1000);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// --- Méthodes d'instance ---

/**
 * Compare un mot de passe en clair (saisi par l'utilisateur) avec le hash
 * stocké en base.
 * @param {string} candidatePassword
 * @returns {Promise<boolean>}
 */
artisanSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Retourne une version "sûre" du document, sans le mot de passe ni les
 * champs internes Mongoose — à utiliser dans toutes les réponses API.
 */
artisanSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

const Artisan = mongoose.model('Artisan', artisanSchema);

// Exposé pour être réutilisé par les schémas de validation Joi sans dupliquer
// la liste des métiers.
Artisan.PROFESSIONS = PROFESSIONS;
Artisan.KYC_STATUSES = KYC_STATUSES;

module.exports = Artisan;
