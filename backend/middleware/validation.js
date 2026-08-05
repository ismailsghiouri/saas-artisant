/**
 * middleware/validation.js
 * -----------------------------------------------------------------------------
 * Validation des données entrantes avec Joi, exécutée AVANT tout accès à la
 * base de données. Objectifs :
 *   - rejeter tôt (400) les requêtes malformées, avec un message explicite ;
 *   - normaliser le payload (valeurs par défaut, champs inconnus supprimés) ;
 *   - garder les schémas de validation Mongoose (models/) comme filet de
 *     sécurité final, mais éviter de s'y fier comme unique ligne de défense.
 *
 * Les enums (catégories, statuts...) sont importés directement depuis les
 * modèles Mongoose pour n'avoir qu'une seule source de vérité.
 * -----------------------------------------------------------------------------
 */

const Joi = require('joi');
const { AppError } = require('../utils/errorHandler');
const Worker = require('../models/Worker');
const Reservation = require('../models/Reservation');
const Ad = require('../models/Ad');

// Numéro de téléphone marocain : 05/06/07XXXXXXXX ou +212 équivalent.
const moroccanPhone = /^(\+212|0)[5-7][0-9]{8}$/;

/**
 * Middleware factory générique : valide req.body contre le schéma Joi fourni.
 * En cas d'erreur, transmet une AppError 400 avec le détail des champs en
 * cause plutôt que de laisser Mongoose échouer plus loin dans le contrôleur.
 *
 * @param {Joi.ObjectSchema} schema
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false, // on remonte toutes les erreurs en une fois, pas juste la première
    stripUnknown: true, // supprime les champs non déclarés dans le schéma (defense in depth)
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message).join(' | ');
    return next(new AppError(`Données invalides : ${messages}`, 400));
  }

  req.body = value;
  next();
};

/**
 * Idem, mais valide req.query (utilisé pour les endpoints de recherche/listing).
 */
const validateQuery = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.query, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((detail) => detail.message).join(' | ');
    return next(new AppError(`Paramètres de recherche invalides : ${messages}`, 400));
  }

  req.query = value;
  next();
};

const schemas = {
  // --- Authentification (routes/auth.js) ---
  signupWorker: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(72).required(),
    phone: Joi.string().pattern(moroccanPhone).required().messages({
      'string.pattern.base': 'Numéro de téléphone marocain invalide.',
    }),
    city: Joi.string().trim().allow('', null),
    category: Joi.string()
      .valid(...Worker.CATEGORIES)
      .required(),
    years_experience: Joi.number().min(0).default(0),
  }),

  signupClient: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(72).required(),
    phone: Joi.string().pattern(moroccanPhone).required().messages({
      'string.pattern.base': 'Numéro de téléphone marocain invalide.',
    }),
    city: Joi.string().trim().allow('', null),
    address: Joi.string().trim().allow('', null),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // --- Worker ---
  updateWorkerProfile: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    phone: Joi.string().pattern(moroccanPhone).messages({
      'string.pattern.base': 'Numéro de téléphone marocain invalide.',
    }),
    category: Joi.string().valid(...Worker.CATEGORIES),
    services: Joi.array().items(Joi.string().trim()),
    city: Joi.string().trim(),
    description: Joi.string().max(1000).allow('', null),
    photos: Joi.array().items(Joi.string().uri()),
    yearsExperience: Joi.number().min(0),
    priceEstimateRange: Joi.object({
      min: Joi.number().min(0).allow(null),
      max: Joi.number().min(0).allow(null),
    }),
    serviceRadiusKm: Joi.number().min(1).max(100),
    avatarUrl: Joi.string().uri().allow(null),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required(),
    }),
  }).min(1),

  updateAvailability: Joi.object({
    isAvailable: Joi.boolean().required(),
  }),

  submitVerification: Joi.object({
    idCardUrl: Joi.string().uri().required(),
    proofOfAddressUrl: Joi.string().uri().required(),
    certificationUrls: Joi.array().items(Joi.string().uri()).default([]),
  }),

  searchWorkers: Joi.object({
    category: Joi.string().valid(...Worker.CATEGORIES),
    city: Joi.string().trim(),
    lat: Joi.number().min(-90).max(90),
    lng: Joi.number().min(-180).max(180),
    radiusKm: Joi.number().min(1).max(100).default(15),
    minRating: Joi.number().min(0).max(5),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  }).with('lat', 'lng').with('lng', 'lat'),

  // --- Client ---
  updateClientProfile: Joi.object({
    name: Joi.string().trim().min(2).max(100),
    phone: Joi.string().pattern(moroccanPhone).messages({
      'string.pattern.base': 'Numéro de téléphone marocain invalide.',
    }),
    city: Joi.string().trim().allow('', null),
    address: Joi.string().trim().allow('', null),
    avatarUrl: Joi.string().uri().allow(null),
  }).min(1),

  // --- Réservation ---
  createReservation: Joi.object({
    serviceCategory: Joi.string()
      .valid(...Worker.CATEGORIES)
      .required(),
    description: Joi.string().trim().min(5).max(1000).required(),
    photos: Joi.array().items(Joi.string().uri()).default([]),
    address: Joi.string().trim().required(),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
        'array.length': 'Les coordonnées doivent être [longitude, latitude].',
      }),
    }).required(),
    urgency: Joi.string()
      .valid(...Reservation.URGENCY_LEVELS)
      .default('today'),
    scheduledAt: Joi.date().iso().greater('now').when('urgency', {
      is: 'scheduled',
      then: Joi.required(),
      otherwise: Joi.forbidden(),
    }),
    estimatedPrice: Joi.number().min(0).allow(null),
  }),

  // Contact direct d'un artisan précis depuis son profil (bouton WhatsApp) :
  // contrairement à createReservation (diffusée aux artisans proches), le
  // worker est ici explicitement choisi par le client.
  createDirectReservation: Joi.object({
    workerId: Joi.string().hex().length(24).required(),
    description: Joi.string().trim().min(5).max(1000).required(),
    address: Joi.string().trim().required(),
    location: Joi.object({
      coordinates: Joi.array().items(Joi.number()).length(2).required().messages({
        'array.length': 'Les coordonnées doivent être [longitude, latitude].',
      }),
    }).required(),
    urgency: Joi.string()
      .valid(...Reservation.URGENCY_LEVELS)
      .default('today'),
  }),

  completeReservation: Joi.object({
    finalPrice: Joi.number().min(0).required(),
    paymentMethod: Joi.string()
      .valid(...Reservation.PAYMENT_METHODS)
      .required(),
  }),

  cancelReservation: Joi.object({
    cancellationReason: Joi.string().trim().max(500).allow('', null),
  }),

  // --- Avis ---
  createReview: Joi.object({
    reservationId: Joi.string().hex().length(24).required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().trim().max(500).allow('', null),
  }),

  updateReview: Joi.object({
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string().trim().max(500).allow('', null),
  }).min(1),

  // --- Blog ---
  createBlogPost: Joi.object({
    title: Joi.string().trim().max(200).required(),
    slug: Joi.string()
      .trim()
      .lowercase()
      .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .required()
      .messages({
        'string.pattern.base':
          'Le slug ne doit contenir que des lettres minuscules, chiffres et tirets.',
      }),
    excerpt: Joi.string().max(300).allow('', null),
    content: Joi.string().required(),
    coverImageUrl: Joi.string().uri().allow(null),
    category: Joi.string().trim().required(),
    tags: Joi.array().items(Joi.string().trim()).default([]),
    city: Joi.string().trim().allow('', null),
    authorName: Joi.string().trim().allow('', null),
    status: Joi.string().valid('draft', 'published').default('draft'),
    seoTitle: Joi.string().max(70).allow('', null),
    seoDescription: Joi.string().max(160).allow('', null),
  }),

  updateBlogPost: Joi.object({
    title: Joi.string().trim().max(200),
    excerpt: Joi.string().max(300).allow('', null),
    content: Joi.string(),
    coverImageUrl: Joi.string().uri().allow(null),
    category: Joi.string().trim(),
    tags: Joi.array().items(Joi.string().trim()),
    city: Joi.string().trim().allow('', null),
    status: Joi.string().valid('draft', 'published'),
    seoTitle: Joi.string().max(70).allow('', null),
    seoDescription: Joi.string().max(160).allow('', null),
  }).min(1),

  // --- Annonces (Ad) ---
  createAd: Joi.object({
    title: Joi.string().trim().max(150).required(),
    description: Joi.string().max(300).allow('', null),
    imageUrl: Joi.string().uri().required(),
    targetUrl: Joi.string().uri().required(),
    advertiserName: Joi.string().trim().allow('', null),
    placement: Joi.string()
      .valid(...Ad.PLACEMENTS)
      .required(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  }),
};

module.exports = { validate, validateQuery, schemas };
