/**
 * controllers/reservationController.js
 * -----------------------------------------------------------------------------
 * Cœur métier de FixNow : cycle de vie complet d'une demande d'intervention,
 * du dépôt par le client jusqu'à sa clôture (ou son annulation), en passant
 * par le matching géolocalisé avec les artisans disponibles.
 *
 * Flux repris du document d'architecture FixNow :
 *   pending -> assigned -> in_progress -> completed
 *                       \-> cancelled (par le client ou l'artisan)
 *
 * Note de périmètre : l'intégration d'un vrai prestataire de paiement (ex.
 * Stripe/CMI) n'est pas demandée dans ce backend (axios n'est utilisé ici que
 * pour email/SMS) — completeReservation pose donc les bases du modèle de
 * paiement (paymentStatus) sans appeler de PSP réel. À brancher dès que le
 * choix du prestataire marocain sera arrêté.
 * -----------------------------------------------------------------------------
 */

const Reservation = require('../models/Reservation');
const Artisan = require('../models/Artisan');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { sendReservationConfirmationEmail, sendArtisanAssignedEmail } = require('../utils/email');
const { notifyArtisanNewJob, notifyClientArtisanCancelled } = require('../utils/sms');

const MAX_ARTISANS_TO_NOTIFY = 15;
const DEFAULT_MATCH_RADIUS_KM = 15;

/**
 * Recherche les artisans disponibles, vérifiés et actifs, correspondant au
 * métier demandé, triés par proximité avec la demande. Utilisée à la fois
 * pour la notification immédiate (SMS) et pour l'endpoint de navigation des
 * demandes ouvertes côté artisan.
 *
 * @param {Object} reservation  Document Reservation (avec location et serviceCategory).
 * @param {number} [limit]
 * @returns {Promise<Array>}
 */
const findNearbyArtisans = (reservation, limit = MAX_ARTISANS_TO_NOTIFY) =>
  Artisan.find({
    profession: reservation.serviceCategory,
    isAvailable: true,
    kycStatus: 'verified',
    isActive: true,
    location: {
      $near: {
        $geometry: reservation.location,
        $maxDistance: DEFAULT_MATCH_RADIUS_KM * 1000,
      },
    },
  }).limit(limit);

/**
 * POST /api/reservations
 * Crée une demande d'intervention pour le client authentifié, puis lance en
 * arrière-plan la recherche et la notification des artisans disponibles à
 * proximité. La réponse HTTP n'attend pas la fin des notifications SMS afin
 * de garder le tunnel de réservation rapide pour le client.
 */
const createReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.create({
    ...req.body,
    client: req.user._id,
  });

  // Confirmation immédiate au client (best-effort, ne bloque pas la réponse).
  sendReservationConfirmationEmail(req.user, reservation).catch((err) =>
    console.error("Erreur lors de l'envoi de l'email de confirmation :", err.message)
  );

  // Matching + notification des artisans à proximité, en arrière-plan.
  findNearbyArtisans(reservation)
    .then((artisans) => {
      artisans.forEach((artisan) => {
        notifyArtisanNewJob(artisan, reservation).catch((err) =>
          console.error(`Erreur SMS vers l'artisan ${artisan._id} :`, err.message)
        );
      });
    })
    .catch((err) => console.error('Erreur lors de la recherche d\'artisans à proximité :', err.message));

  res.status(201).json({
    success: true,
    message: 'Demande enregistrée. Nous recherchons un artisan disponible près de vous.',
    data: reservation,
  });
});

/**
 * GET /api/reservations/me
 * Historique des demandes du client authentifié (user story C-05 / support blog CTA).
 */
const getMyReservationsAsClient = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ client: req.user._id })
    .populate('artisan', 'fullName phone profession rating profilePhotoUrl')
    .sort('-createdAt');

  res.status(200).json({ success: true, results: reservations.length, data: reservations });
});

/**
 * GET /api/reservations/artisan/me
 * Interventions déjà assignées à l'artisan authentifié (agenda), quel que
 * soit leur statut (assigned / in_progress / completed / cancelled).
 */
const getMyReservationsAsArtisan = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ artisan: req.user._id })
    .populate('client', 'fullName phone')
    .sort('-createdAt');

  res.status(200).json({ success: true, results: reservations.length, data: reservations });
});

/**
 * GET /api/reservations/available
 * Demandes en attente ("pending") correspondant au métier de l'artisan
 * authentifié et proches de sa position, qu'il peut consulter pour choisir
 * d'accepter (complète le flux notifié par SMS, utile en cas de SMS manqué
 * ou de nouvel artisan passant en disponible après l'envoi initial).
 */
const getAvailableJobsForArtisan = asyncHandler(async (req, res, next) => {
  if (req.user.kycStatus !== 'verified') {
    return next(new AppError('Votre profil doit être vérifié pour consulter les demandes.', 403));
  }

  const reservations = await Reservation.find({
    status: 'pending',
    serviceCategory: req.user.profession,
    location: {
      $near: {
        $geometry: req.user.location,
        $maxDistance: (req.user.serviceRadiusKm || DEFAULT_MATCH_RADIUS_KM) * 1000,
      },
    },
  }).limit(50);

  res.status(200).json({ success: true, results: reservations.length, data: reservations });
});

/**
 * GET /api/reservations/:id
 * Accessible uniquement par le client propriétaire ou l'artisan assigné.
 */
const getReservationById = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('client', 'fullName phone')
    .populate('artisan', 'fullName phone profession rating profilePhotoUrl');

  if (!reservation) {
    return next(new AppError('Réservation introuvable.', 404));
  }

  const isOwnerClient = req.userRole === 'client' && reservation.client._id.equals(req.user._id);
  const isAssignedArtisan =
    req.userRole === 'artisan' && reservation.artisan && reservation.artisan._id.equals(req.user._id);

  if (!isOwnerClient && !isAssignedArtisan) {
    return next(new AppError("Vous n'avez pas accès à cette réservation.", 403));
  }

  res.status(200).json({ success: true, data: reservation });
});

/**
 * PATCH /api/reservations/:id/accept
 * Un artisan disponible et vérifié accepte une demande encore "pending".
 * Utilise une mise à jour atomique conditionnelle (findOneAndUpdate avec
 * status: 'pending' dans le filtre) pour éviter une situation de course où
 * deux artisans accepteraient la même demande simultanément.
 */
const acceptReservation = asyncHandler(async (req, res, next) => {
  if (req.user.kycStatus !== 'verified') {
    return next(new AppError('Votre profil doit être vérifié pour accepter une demande.', 403));
  }

  const reservation = await Reservation.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { artisan: req.user._id, status: 'assigned' },
    { new: true, runValidators: true }
  ).populate('client', 'fullName email phone');

  if (!reservation) {
    return next(
      new AppError('Cette demande a déjà été prise en charge par un autre artisan ou n\'existe pas.', 409)
    );
  }

  sendArtisanAssignedEmail(reservation.client, req.user).catch((err) =>
    console.error("Erreur lors de l'envoi de l'email d'assignation :", err.message)
  );

  res.status(200).json({ success: true, data: reservation });
});

/**
 * PATCH /api/reservations/:id/start
 * L'artisan assigné démarre l'intervention (arrivée sur place).
 */
const startReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findOneAndUpdate(
    { _id: req.params.id, artisan: req.user._id, status: 'assigned' },
    { status: 'in_progress' },
    { new: true, runValidators: true }
  );

  if (!reservation) {
    return next(
      new AppError('Impossible de démarrer cette intervention (statut invalide ou non assignée).', 409)
    );
  }

  res.status(200).json({ success: true, data: reservation });
});

/**
 * PATCH /api/reservations/:id/complete
 * Clôture l'intervention : montant final, mode de paiement, et mise à jour
 * du compteur d'interventions terminées de l'artisan.
 */
const completeReservation = asyncHandler(async (req, res, next) => {
  const { finalPrice, paymentMethod } = req.body;

  const reservation = await Reservation.findOneAndUpdate(
    { _id: req.params.id, artisan: req.user._id, status: 'in_progress' },
    {
      status: 'completed',
      finalPrice,
      paymentMethod,
      // Le règlement en espèces est considéré comme réglé immédiatement ;
      // un paiement carte reste "pending" jusqu'à confirmation du PSP
      // (intégration future — voir note de périmètre en tête de fichier).
      paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
    },
    { new: true, runValidators: true }
  );

  if (!reservation) {
    return next(
      new AppError('Impossible de clôturer cette intervention (statut invalide ou non assignée).', 409)
    );
  }

  await Artisan.findByIdAndUpdate(req.user._id, { $inc: { completedJobsCount: 1 } });

  res.status(200).json({ success: true, data: reservation });
});

/**
 * PATCH /api/reservations/:id/cancel
 * - Le client peut annuler tant que l'intervention n'est pas encore
 *   "in_progress" ou "completed".
 * - L'artisan assigné peut annuler une intervention "assigned" ou
 *   "in_progress" ; la demande repasse alors en "pending" (sans artisan) afin
 *   d'être reproposée automatiquement à d'autres artisans, et le client est
 *   notifié par SMS.
 */
const cancelReservation = asyncHandler(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id).populate('client', 'phone');

  if (!reservation) {
    return next(new AppError('Réservation introuvable.', 404));
  }

  if (req.userRole === 'client') {
    if (!reservation.client._id.equals(req.user._id)) {
      return next(new AppError("Vous n'avez pas accès à cette réservation.", 403));
    }
    if (!['pending', 'assigned'].includes(reservation.status)) {
      return next(
        new AppError('Cette intervention ne peut plus être annulée à ce stade.', 409)
      );
    }

    reservation.status = 'cancelled';
    reservation.cancellationReason = req.body.cancellationReason || 'Annulée par le client.';
    await reservation.save();

    return res.status(200).json({ success: true, data: reservation });
  }

  // req.userRole === 'artisan'
  if (!reservation.artisan || !reservation.artisan.equals(req.user._id)) {
    return next(new AppError("Vous n'avez pas accès à cette réservation.", 403));
  }
  if (!['assigned', 'in_progress'].includes(reservation.status)) {
    return next(new AppError('Cette intervention ne peut plus être annulée à ce stade.', 409));
  }

  reservation.status = 'pending';
  reservation.artisan = null;
  reservation.cancellationReason = req.body.cancellationReason || 'Annulée par l\'artisan assigné.';
  await reservation.save();

  notifyClientArtisanCancelled(reservation.client).catch((err) =>
    console.error("Erreur lors de la notification SMS d'annulation :", err.message)
  );

  res.status(200).json({ success: true, data: reservation });
});

module.exports = {
  createReservation,
  getMyReservationsAsClient,
  getMyReservationsAsArtisan,
  getAvailableJobsForArtisan,
  getReservationById,
  acceptReservation,
  startReservation,
  completeReservation,
  cancelReservation,
};
