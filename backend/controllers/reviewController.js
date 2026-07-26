/**
 * controllers/reviewController.js
 * -----------------------------------------------------------------------------
 * Gestion des avis clients sur les artisans. La mise à jour de la note
 * moyenne de l'artisan (Artisan.rating) est entièrement déléguée au hook
 * post-save du modèle Review — ce contrôleur ne s'occupe que de la
 * validation métier (réservation terminée, appartenance au client, pas de
 * doublon) et de la lecture publique des avis.
 * -----------------------------------------------------------------------------
 */

const Review = require('../models/Review');
const Reservation = require('../models/Reservation');
const { AppError, asyncHandler } = require('../utils/errorHandler');

/**
 * POST /api/reviews
 * Le client note une intervention terminée (user story C-05).
 */
const createReview = asyncHandler(async (req, res, next) => {
  const { reservationId, rating, comment } = req.body;

  const reservation = await Reservation.findById(reservationId);

  if (!reservation) {
    return next(new AppError('Réservation introuvable.', 404));
  }

  if (!reservation.client.equals(req.user._id)) {
    return next(new AppError("Vous ne pouvez noter que vos propres réservations.", 403));
  }

  if (reservation.status !== 'completed') {
    return next(
      new AppError("Seule une intervention terminée peut faire l'objet d'un avis.", 409)
    );
  }

  const existingReview = await Review.findOne({ reservation: reservationId });
  if (existingReview) {
    return next(new AppError('Un avis a déjà été publié pour cette réservation.', 409));
  }

  const review = await Review.create({
    reservation: reservationId,
    client: req.user._id,
    artisan: reservation.artisan,
    rating,
    comment,
  });

  res.status(201).json({ success: true, data: review });
});

/**
 * GET /api/reviews/artisan/:artisanId
 * GET /api/artisans/:id/reviews
 * GET /api/reviews?artisan_id=X
 * Liste publique et paginée des avis d'un artisan (fiche profil). L'identifiant
 * de l'artisan peut être fourni en paramètre de route (deux formats, selon le
 * routeur qui monte ce contrôleur) ou en query string.
 */
const getArtisanReviews = asyncHandler(async (req, res, next) => {
  const artisanId = req.params.artisanId || req.params.id || req.query.artisan_id;

  if (!artisanId) {
    return next(new AppError("L'identifiant de l'artisan est requis (artisan_id).", 400));
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Number(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const filter = { artisan: artisanId };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('client', 'fullName profilePhotoUrl')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    results: reviews.length,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    data: reviews,
  });
});

/**
 * PUT /api/reviews/:id
 * Le client auteur de l'avis peut corriger sa note/commentaire. La note
 * moyenne de l'artisan est recalculée via le hook post-save du modèle
 * (voir models/Review.js), déclenché par doc.save() ci-dessous — d'où
 * l'usage explicite de save() plutôt que findByIdAndUpdate.
 */
const updateReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Avis introuvable.', 404));
  }

  if (!review.client.equals(req.user._id)) {
    return next(new AppError('Vous ne pouvez modifier que vos propres avis.', 403));
  }

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();

  res.status(200).json({ success: true, data: review });
});

/**
 * DELETE /api/reviews/:id
 * Le client auteur de l'avis peut le supprimer ; la note moyenne de
 * l'artisan est recalculée manuellement (pas de hook post-remove sur le
 * modèle, contrairement à la création).
 */
const deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(new AppError('Avis introuvable.', 404));
  }

  if (!review.client.equals(req.user._id)) {
    return next(new AppError('Vous ne pouvez supprimer que vos propres avis.', 403));
  }

  const artisanId = review.artisan;
  await review.deleteOne();
  await Review.recalculateArtisanRating(artisanId);

  res.status(204).json({ success: true, data: null });
});

module.exports = { createReview, getArtisanReviews, updateReview, deleteReview };
