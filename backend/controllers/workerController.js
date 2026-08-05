/**
 * controllers/workerController.js
 * -----------------------------------------------------------------------------
 * Logique métier liée aux profils artisans (role="worker") : gestion du
 * profil, disponibilité, vérification d'identité, et recherche publique
 * (matching géolocalisé pour les clients).
 *
 * L'inscription/connexion sont désormais centralisées dans routes/auth.js ;
 * "auth" (middleware/auth.js) ne fait qu'attacher le contenu décodé du token
 * (req.user = { id, email, role }) — chaque action ici charge donc le
 * document Worker courant via req.user.id avant de le modifier.
 * -----------------------------------------------------------------------------
 */

const Worker = require('../models/Worker');
const Reservation = require('../models/Reservation');
const { AppError, asyncHandler } = require('../utils/errorHandler');

/**
 * GET /api/workers/me
 */
const getMe = asyncHandler(async (req, res, next) => {
  const worker = await Worker.findById(req.user.id);
  if (!worker) return next(new AppError('Profil artisan introuvable.', 404));

  res.status(200).json({ success: true, data: worker.toSafeObject() });
});

/**
 * PUT /api/workers/me
 * PUT /api/workers/:id
 * Met à jour le profil de l'artisan connecté. Les champs sensibles (email,
 * password, verificationStatus, rating...) ne sont volontairement pas
 * modifiables via cet endpoint. La variante "/:id" n'existe que pour un usage
 * RESTful explicite (le client envoie son propre id) : elle refuse toute
 * tentative de modifier un autre profil que le sien.
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  if (req.params.id && req.params.id !== req.user.id) {
    return next(new AppError('Vous ne pouvez modifier que votre propre profil.', 403));
  }

  const worker = await Worker.findById(req.user.id);
  if (!worker) return next(new AppError('Profil artisan introuvable.', 404));

  Object.assign(worker, req.body);
  await worker.save();

  res.status(200).json({ success: true, data: worker.toSafeObject() });
});

/**
 * PATCH /api/workers/me/availability
 * Bascule rapide de la disponibilité (on/off), séparée de updateProfile car
 * c'est l'action la plus fréquente de l'artisan au quotidien.
 */
const updateAvailability = asyncHandler(async (req, res, next) => {
  const worker = await Worker.findById(req.user.id);
  if (!worker) return next(new AppError('Profil artisan introuvable.', 404));

  if (!worker.verifiedBadge) {
    return next(
      new AppError(
        'Votre profil doit être vérifié par Maalam Expert avant de pouvoir vous rendre disponible.',
        403
      )
    );
  }

  worker.isAvailable = req.body.isAvailable;
  await worker.save();

  res.status(200).json({
    success: true,
    data: { isAvailable: worker.isAvailable },
  });
});

/**
 * POST /api/workers/me/verification
 * Soumission (ou resoumission) des documents de vérification d'identité.
 * Remet automatiquement le statut à "pending" pour repasser en file de
 * validation manuelle par l'équipe Maalam Expert.
 */
const submitVerification = asyncHandler(async (req, res, next) => {
  const worker = await Worker.findById(req.user.id);
  if (!worker) return next(new AppError('Profil artisan introuvable.', 404));

  worker.documents = {
    idCardUrl: req.body.idCardUrl,
    proofOfAddressUrl: req.body.proofOfAddressUrl,
    certificationUrls: req.body.certificationUrls,
  };
  worker.verificationStatus = 'pending';
  worker.verificationRejectionReason = null;
  await worker.save();

  res.status(200).json({
    success: true,
    message: 'Documents soumis avec succès. Votre dossier est en cours de vérification.',
    data: worker.toSafeObject(),
  });
});

/**
 * GET /api/workers
 * Recherche publique d'artisans, avec filtrage par catégorie/ville et
 * recherche géospatiale optionnelle (lat/lng/radiusKm). Seuls les artisans
 * vérifiés et actifs sont exposés publiquement.
 *
 * Les query params sont déjà validés et normalisés par
 * middleware/validation.js (schemas.searchWorkers) avant d'arriver ici.
 */
const getAllWorkers = asyncHandler(async (req, res) => {
  const { category, city, lat, lng, radiusKm, minRating, page, limit } = req.query;

  const filter = { verifiedBadge: true, status: 'active', isActive: true };

  if (category) filter.category = category;
  if (city) filter.city = new RegExp(`^${city}$`, 'i');
  if (minRating !== undefined) filter.rating = { $gte: minRating };

  // Recherche géospatiale : $near trie nativement les résultats par distance
  // croissante, ce qui correspond exactement au besoin de matching Maalam Expert.
  if (lat !== undefined && lng !== undefined) {
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000, // conversion km -> mètres
      },
    };
  }

  const skip = (page - 1) * limit;

  // countDocuments() passe par un pipeline d'agrégation, où $near/$nearSphere
  // sont interdits (ils exigent un curseur triable, voir MongoDB
  // Location5626500) — contrairement à find(), qui les supporte très bien.
  // On construit donc un filtre de comptage équivalent avec $geoWithin
  // (rayon en radians = km / rayon terrestre moyen), compatible agrégation.
  let countFilter = filter;
  if (filter.location?.$near) {
    const { $geometry, $maxDistance } = filter.location.$near;
    countFilter = {
      ...filter,
      location: {
        $geoWithin: {
          $centerSphere: [$geometry.coordinates, $maxDistance / 1000 / 6378.1],
        },
      },
    };
  }

  const [workers, total] = await Promise.all([
    Worker.find(filter)
      .select('-password -documents -verificationRejectionReason')
      .skip(skip)
      .limit(limit),
    Worker.countDocuments(countFilter),
  ]);

  res.status(200).json({
    success: true,
    results: workers.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    data: workers,
  });
});

/**
 * GET /api/workers/:id
 * Détail public d'un profil artisan.
 */
const getWorkerById = asyncHandler(async (req, res, next) => {
  const worker = await Worker.findById(req.params.id).select(
    '-password -documents -verificationRejectionReason'
  );

  if (!worker || !worker.isActive) {
    return next(new AppError('Artisan introuvable.', 404));
  }

  res.status(200).json({ success: true, data: worker });
});

/**
 * GET /api/workers/top-rated
 * Classement des artisans les mieux notés (mise en avant page d'accueil /
 * recherche), parmi les profils vérifiés et actifs ayant reçu au moins un
 * avis.
 */
const getTopRated = asyncHandler(async (req, res) => {
  const limit = Math.min(50, Number(req.query.limit) || 10);

  const workers = await Worker.find({
    verifiedBadge: true,
    status: 'active',
    isActive: true,
    totalReviews: { $gt: 0 },
  })
    .select('-password -documents -verificationRejectionReason')
    .sort('-rating -totalReviews')
    .limit(limit);

  res.status(200).json({ success: true, results: workers.length, data: workers });
});

/**
 * PUT /api/workers/upgrade-premium
 * Active le statut premium de l'artisan authentifié (toujours sur son propre
 * profil, identifié par le token — aucun id n'est nécessaire dans l'URL). Il
 * doit par ailleurs être vérifié pour éviter de mettre en avant un profil non
 * contrôlé.
 */
const upgradeToPremium = asyncHandler(async (req, res, next) => {
  const worker = await Worker.findById(req.user.id);
  if (!worker) return next(new AppError('Profil artisan introuvable.', 404));

  if (!worker.verifiedBadge) {
    return next(
      new AppError('Votre profil doit être vérifié par Maalam Expert avant de passer premium.', 403)
    );
  }

  worker.isPremium = true;
  worker.premiumSince = new Date();
  await worker.save();

  res.status(200).json({
    success: true,
    message: 'Statut premium activé avec succès.',
    data: worker.toSafeObject(),
  });
});

/**
 * GET /api/workers/analytics
 * Indicateurs d'activité pour le tableau de bord artisan : volume de
 * réservations (total et 7 derniers jours), revenu cumulé des interventions
 * terminées, et rappel des indicateurs de profil (note, avis, statut premium).
 */
const getAnalytics = asyncHandler(async (req, res, next) => {
  const worker = await Worker.findById(req.user.id);
  if (!worker) return next(new AppError('Profil artisan introuvable.', 404));

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalCount, weekCount, revenueAgg] = await Promise.all([
    Reservation.countDocuments({ worker: worker._id }),
    Reservation.countDocuments({ worker: worker._id, createdAt: { $gte: oneWeekAgo } }),
    Reservation.aggregate([
      { $match: { worker: worker._id, status: 'completed' } },
      { $group: { _id: null, revenue: { $sum: '$finalPrice' } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalReservations: totalCount,
      reservationsThisWeek: weekCount,
      completedJobsCount: worker.completedJobsCount,
      revenue: revenueAgg[0]?.revenue || 0,
      rating: worker.rating,
      totalReviews: worker.totalReviews,
      isPremium: worker.isPremium,
      verifiedBadge: worker.verifiedBadge,
    },
  });
});

module.exports = {
  getMe,
  updateProfile,
  updateAvailability,
  submitVerification,
  getAllWorkers,
  getWorkerById,
  getTopRated,
  upgradeToPremium,
  getAnalytics,
};
