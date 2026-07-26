/**
 * controllers/artisanController.js
 * -----------------------------------------------------------------------------
 * Logique métier liée aux comptes artisans : inscription, connexion, gestion
 * du profil, disponibilité, KYC, et recherche publique (matching géolocalisé
 * pour les clients).
 * -----------------------------------------------------------------------------
 */

const Artisan = require('../models/Artisan');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { generateToken } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/email');

/**
 * POST /api/artisans/register
 * Crée un nouveau compte artisan. Le compte est créé avec kycStatus="pending"
 * et isAvailable=false : il doit être vérifié manuellement par l'équipe
 * FixNow avant de pouvoir recevoir des demandes (voir cahier des charges,
 * user story A-01).
 */
const register = asyncHandler(async (req, res, next) => {
  const existingArtisan = await Artisan.findOne({ email: req.body.email });
  if (existingArtisan) {
    return next(new AppError('Un compte artisan existe déjà avec cet email.', 409));
  }

  const artisan = await Artisan.create(req.body);

  const token = generateToken(artisan._id, 'artisan');

  // L'échec d'envoi de l'email de bienvenue ne doit pas bloquer l'inscription.
  sendWelcomeEmail(artisan).catch((err) =>
    console.error("Erreur lors de l'envoi de l'email de bienvenue :", err.message)
  );

  res.status(201).json({
    success: true,
    message:
      'Compte artisan créé avec succès. Votre profil sera activé après vérification de vos documents.',
    token,
    data: artisan.toSafeObject(),
  });
});

/**
 * POST /api/artisans/login
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // .select('+password') car le champ est exclu par défaut dans le schéma.
  const artisan = await Artisan.findOne({ email }).select('+password');

  if (!artisan || !(await artisan.comparePassword(password))) {
    return next(new AppError('Email ou mot de passe incorrect.', 401));
  }

  if (!artisan.isActive) {
    return next(new AppError('Ce compte a été désactivé. Contactez le support FixNow.', 403));
  }

  const token = generateToken(artisan._id, 'artisan');

  res.status(200).json({
    success: true,
    token,
    data: artisan.toSafeObject(),
  });
});

/**
 * GET /api/artisans/me
 * Renvoie le profil complet de l'artisan actuellement authentifié.
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user.toSafeObject() });
});

/**
 * PUT /api/artisans/me
 * Met à jour le profil de l'artisan connecté. Les champs sensibles (email,
 * password, kycStatus, rating...) ne sont volontairement pas modifiables via
 * cet endpoint : ils passent par des routes dédiées (submitKyc) ou sont
 * calculés automatiquement (rating via les avis).
 */
const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();

  res.status(200).json({ success: true, data: req.user.toSafeObject() });
});

/**
 * PATCH /api/artisans/me/availability
 * Bascule rapide de la disponibilité (on/off), séparée de updateProfile car
 * c'est l'action la plus fréquente de l'artisan au quotidien (user story A-06).
 */
const updateAvailability = asyncHandler(async (req, res, next) => {
  if (req.user.kycStatus !== 'verified') {
    return next(
      new AppError(
        'Votre profil doit être vérifié par FixNow avant de pouvoir vous rendre disponible.',
        403
      )
    );
  }

  req.user.isAvailable = req.body.isAvailable;
  await req.user.save();

  res.status(200).json({
    success: true,
    data: { isAvailable: req.user.isAvailable },
  });
});

/**
 * POST /api/artisans/me/kyc
 * Soumission (ou resoumission) des documents de vérification d'identité.
 * Remet automatiquement le statut à "pending" pour repasser en file de
 * validation manuelle par l'équipe FixNow.
 */
const submitKyc = asyncHandler(async (req, res) => {
  req.user.documents = {
    idCardUrl: req.body.idCardUrl,
    proofOfAddressUrl: req.body.proofOfAddressUrl,
    certificationUrls: req.body.certificationUrls,
  };
  req.user.kycStatus = 'pending';
  req.user.kycRejectionReason = null;
  await req.user.save();

  res.status(200).json({
    success: true,
    message: 'Documents soumis avec succès. Votre dossier est en cours de vérification.',
    data: req.user.toSafeObject(),
  });
});

/**
 * GET /api/artisans
 * Recherche publique d'artisans, avec filtrage par métier/ville et recherche
 * géospatiale optionnelle (lat/lng/radiusKm). Seuls les artisans vérifiés et
 * actifs sont exposés publiquement.
 *
 * Les query params sont déjà validés et normalisés par
 * middleware/validation.js (schemas.searchArtisans) avant d'arriver ici.
 */
const getAllArtisans = asyncHandler(async (req, res) => {
  const { profession, city, lat, lng, radiusKm, minRating, page, limit } = req.query;

  const filter = { kycStatus: 'verified', isActive: true };

  if (profession) filter.profession = profession;
  if (city) filter.city = new RegExp(`^${city}$`, 'i');
  if (minRating !== undefined) filter['rating.average'] = { $gte: minRating };

  // Recherche géospatiale : $near trie nativement les résultats par distance
  // croissante, ce qui correspond exactement au besoin de matching FixNow.
  if (lat !== undefined && lng !== undefined) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000, // conversion km -> mètres
      },
    };
  }

  const skip = (page - 1) * limit;

  const [artisans, total] = await Promise.all([
    Artisan.find(filter)
      .select('-password -documents -kycRejectionReason')
      .skip(skip)
      .limit(limit),
    Artisan.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    results: artisans.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    data: artisans,
  });
});

/**
 * GET /api/artisans/:id
 * Détail public d'un profil artisan (fiche consultée par un client avant/
 * après mise en relation).
 */
const getArtisanById = asyncHandler(async (req, res, next) => {
  const artisan = await Artisan.findById(req.params.id).select(
    '-password -documents -kycRejectionReason'
  );

  if (!artisan || !artisan.isActive) {
    return next(new AppError('Artisan introuvable.', 404));
  }

  res.status(200).json({ success: true, data: artisan });
});

/**
 * GET /api/artisans/top-rated
 * Classement des artisans les mieux notés (mise en avant page d'accueil /
 * recherche), parmi les profils vérifiés et actifs ayant reçu au moins un
 * avis. Le nombre d'avis sert de départage à note égale.
 */
const getTopRated = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 10);

  const artisans = await Artisan.find({
    kycStatus: 'verified',
    isActive: true,
    'rating.count': { $gt: 0 },
  })
    .select('-password -documents -kycRejectionReason')
    .sort('-rating.average -rating.count')
    .limit(limit);

  res.status(200).json({ success: true, results: artisans.length, data: artisans });
});

/**
 * POST /api/artisans/:id/upgrade-premium
 * Active le statut premium de l'artisan authentifié. Réservé au titulaire du
 * profil (un artisan ne peut pas activer le premium d'un autre compte) ; il
 * doit par ailleurs être vérifié (KYC) pour éviter de mettre en avant un
 * profil non contrôlé.
 */
const upgradeToPremium = asyncHandler(async (req, res, next) => {
  if (req.params.id !== String(req.user._id)) {
    return next(new AppError("Vous ne pouvez activer le premium que sur votre propre profil.", 403));
  }

  if (req.user.kycStatus !== 'verified') {
    return next(
      new AppError('Votre profil doit être vérifié par FixNow avant de passer premium.', 403)
    );
  }

  req.user.isPremium = true;
  req.user.premiumSince = new Date();
  await req.user.save();

  res.status(200).json({
    success: true,
    message: 'Statut premium activé avec succès.',
    data: req.user.toSafeObject(),
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updateAvailability,
  submitKyc,
  getAllArtisans,
  getArtisanById,
  getTopRated,
  upgradeToPremium,
};
