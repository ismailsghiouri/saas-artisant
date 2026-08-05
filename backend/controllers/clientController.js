/**
 * controllers/clientController.js
 * -----------------------------------------------------------------------------
 * Logique métier liée aux profils clients (role="client") : consultation et
 * mise à jour du profil personnel, gestion des artisans favoris.
 *
 * L'inscription/connexion sont centralisées dans routes/auth.js ; "auth"
 * (middleware/auth.js) n'attache que le contenu décodé du token
 * (req.user = { id, email, role }), donc chaque action charge ici le document
 * Client courant via req.user.id.
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');
const Client = require('../models/Client');
const { AppError, asyncHandler } = require('../utils/errorHandler');

/**
 * GET /api/clients/me
 * Peuple "savedWorkers" (favoris) et "reviewsPosted" (avis déjà publiés) pour
 * que le tableau de bord client n'ait besoin que de cet unique appel.
 */
const getMe = asyncHandler(async (req, res, next) => {
  const client = await Client.findById(req.user.id)
    .populate('savedWorkers', 'name category city rating totalReviews avatarUrl verifiedBadge')
    .populate({ path: 'reviewsPosted', populate: { path: 'worker', select: 'name category' } });
  if (!client) return next(new AppError('Profil client introuvable.', 404));

  res.status(200).json({ success: true, data: client.toSafeObject() });
});

/**
 * PUT /api/clients/me
 */
const updateProfile = asyncHandler(async (req, res, next) => {
  const client = await Client.findById(req.user.id);
  if (!client) return next(new AppError('Profil client introuvable.', 404));

  Object.assign(client, req.body);
  await client.save();

  res.status(200).json({ success: true, data: client.toSafeObject() });
});

/**
 * PATCH /api/clients/me/favorites/:workerId
 * Ajoute l'artisan aux favoris s'il n'y est pas déjà, l'en retire sinon
 * (toggle) — évite d'avoir deux endpoints distincts pour une action aussi
 * simple.
 */
const toggleFavorite = asyncHandler(async (req, res, next) => {
  const { workerId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(workerId)) {
    return next(new AppError('Identifiant artisan invalide.', 400));
  }

  const client = await Client.findById(req.user.id);
  if (!client) return next(new AppError('Profil client introuvable.', 404));

  const index = client.savedWorkers.findIndex((id) => id.equals(workerId));

  if (index === -1) {
    client.savedWorkers.push(workerId);
  } else {
    client.savedWorkers.splice(index, 1);
  }

  await client.save({ validateBeforeSave: false });
  await client.populate('savedWorkers', 'name category city rating totalReviews avatarUrl verifiedBadge');

  res.status(200).json({ success: true, data: client.savedWorkers });
});

/**
 * GET /api/clients/favorites
 * Liste des artisans favoris du client authentifié.
 */
const getFavorites = asyncHandler(async (req, res, next) => {
  const client = await Client.findById(req.user.id).populate(
    'savedWorkers',
    'name category city rating totalReviews avatarUrl verifiedBadge'
  );
  if (!client) return next(new AppError('Profil client introuvable.', 404));

  res.status(200).json({ success: true, results: client.savedWorkers.length, data: client.savedWorkers });
});

module.exports = { getMe, updateProfile, toggleFavorite, getFavorites };
