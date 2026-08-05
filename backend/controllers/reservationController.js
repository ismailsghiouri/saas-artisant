/**
 * controllers/reservationController.js
 * -----------------------------------------------------------------------------
 * Cœur métier de Maalam Expert : cycle de vie complet d'une demande d'intervention,
 * du dépôt par le client jusqu'à sa clôture (ou son annulation), en passant
 * par le matching géolocalisé avec les artisans (workers) disponibles.
 *
 * Flux repris du document d'architecture Maalam Expert :
 *   pending -> assigned -> in_progress -> completed
 *                       \-> cancelled (par le client ou l'artisan)
 *
 * "auth" (middleware/auth.js) n'attache que le contenu décodé du token
 * (req.user = { id, email, role }) : les actions qui ont besoin du document
 * Worker complet (vérification, localisation...) le rechargent explicitement
 * via Worker.findById(req.user.id).
 * -----------------------------------------------------------------------------
 */

const Reservation = require('../models/Reservation');
const Worker = require('../models/Worker');
const Client = require('../models/Client');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { sendReservationConfirmationEmail, sendWorkerAssignedEmail } = require('../utils/email');
const { notifyWorkerNewJob, notifyClientWorkerCancelled } = require('../utils/sms');

const MAX_WORKERS_TO_NOTIFY = 15;
const DEFAULT_MATCH_RADIUS_KM = 15;

/**
 * Recherche les artisans disponibles, vérifiés et actifs, correspondant à la
 * catégorie demandée, triés par proximité avec la demande.
 *
 * @param {Object} reservation  Document Reservation (avec location et serviceCategory).
 * @param {number} [limit]
 * @returns {Promise<Array>}
 */
const findNearbyWorkers = (reservation, limit = MAX_WORKERS_TO_NOTIFY) =>
  Worker.find({
    category: reservation.serviceCategory,
    isAvailable: true,
    verifiedBadge: true,
    status: 'active',
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
 * proximité.
 */
const createReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.create({
    ...req.body,
    client: req.user.id,
  });

  // Confirmation immédiate au client (best-effort, ne bloque pas la réponse).
  Client.findById(req.user.id)
    .then((client) => client && sendReservationConfirmationEmail(client, reservation))
    .catch((err) => console.error("Erreur lors de l'envoi de l'email de confirmation :", err.message));

  findNearbyWorkers(reservation)
    .then((workers) => {
      workers.forEach((worker) => {
        notifyWorkerNewJob(worker, reservation).catch((err) =>
          console.error(`Erreur SMS vers l'artisan ${worker._id} :`, err.message)
        );
      });
    })
    .catch((err) => console.error("Erreur lors de la recherche d'artisans à proximité :", err.message));

  res.status(201).json({
    success: true,
    message: 'Demande enregistrée. Nous recherchons un artisan disponible près de vous.',
    data: reservation,
  });
});

/**
 * POST /api/reservations/direct
 * Contact direct d'un artisan précis depuis son profil (bouton WhatsApp) :
 * contrairement à createReservation (diffusée aux artisans proches à
 * matcher), le worker est ici explicitement choisi par le client, donc la
 * réservation est créée directement au statut "assigned".
 */
const createDirectReservation = asyncHandler(async (req, res, next) => {
  const { workerId, ...rest } = req.body;

  const worker = await Worker.findById(workerId);
  if (!worker || !worker.isActive) {
    return next(new AppError('Artisan introuvable.', 404));
  }

  const reservation = await Reservation.create({
    ...rest,
    serviceCategory: worker.category,
    client: req.user.id,
    worker: worker._id,
    status: 'assigned',
  });

  sendWorkerAssignedEmail(await Client.findById(req.user.id), worker).catch((err) =>
    console.error("Erreur lors de l'envoi de l'email d'assignation :", err.message)
  );
  notifyWorkerNewJob(worker, reservation).catch((err) =>
    console.error(`Erreur SMS vers l'artisan ${worker._id} :`, err.message)
  );

  res.status(201).json({ success: true, data: reservation });
});

/**
 * GET /api/reservations/me
 * Historique des demandes du client authentifié.
 */
const getMyReservationsAsClient = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ client: req.user.id })
    .populate('worker', 'name phone category rating avatarUrl')
    .sort('-createdAt');

  res.status(200).json({ success: true, results: reservations.length, data: reservations });
});

/**
 * GET /api/reservations/worker/me
 * Interventions déjà assignées à l'artisan authentifié (agenda), quel que
 * soit leur statut (assigned / in_progress / completed / cancelled).
 */
const getMyReservationsAsWorker = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ worker: req.user.id })
    .populate('client', 'name phone')
    .sort('-createdAt');

  res.status(200).json({ success: true, results: reservations.length, data: reservations });
});

/**
 * GET /api/reservations/available
 * Demandes en attente ("pending") correspondant à la catégorie de l'artisan
 * authentifié et proches de sa position.
 */
const getAvailableJobsForWorker = asyncHandler(async (req, res, next) => {
  const worker = await Worker.findById(req.user.id);
  if (!worker) return next(new AppError('Profil artisan introuvable.', 404));

  if (!worker.verifiedBadge) {
    return next(new AppError('Votre profil doit être vérifié pour consulter les demandes.', 403));
  }

  const reservations = await Reservation.find({
    status: 'pending',
    serviceCategory: worker.category,
    location: {
      $near: {
        $geometry: worker.location,
        $maxDistance: (worker.serviceRadiusKm || DEFAULT_MATCH_RADIUS_KM) * 1000,
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
    .populate('client', 'name phone')
    .populate('worker', 'name phone category rating avatarUrl');

  if (!reservation) {
    return next(new AppError('Réservation introuvable.', 404));
  }

  const isOwnerClient = req.user.role === 'client' && reservation.client._id.equals(req.user.id);
  const isAssignedWorker =
    req.user.role === 'worker' && reservation.worker && reservation.worker._id.equals(req.user.id);

  if (!isOwnerClient && !isAssignedWorker) {
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
  const worker = await Worker.findById(req.user.id);
  if (!worker) return next(new AppError('Profil artisan introuvable.', 404));

  if (!worker.verifiedBadge) {
    return next(new AppError('Votre profil doit être vérifié pour accepter une demande.', 403));
  }

  const reservation = await Reservation.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { worker: req.user.id, status: 'assigned' },
    { new: true, runValidators: true }
  ).populate('client', 'name email phone');

  if (!reservation) {
    return next(
      new AppError("Cette demande a déjà été prise en charge par un autre artisan ou n'existe pas.", 409)
    );
  }

  sendWorkerAssignedEmail(reservation.client, worker).catch((err) =>
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
    { _id: req.params.id, worker: req.user.id, status: 'assigned' },
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
    { _id: req.params.id, worker: req.user.id, status: 'in_progress' },
    {
      status: 'completed',
      finalPrice,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
    },
    { new: true, runValidators: true }
  );

  if (!reservation) {
    return next(
      new AppError('Impossible de clôturer cette intervention (statut invalide ou non assignée).', 409)
    );
  }

  await Worker.findByIdAndUpdate(req.user.id, { $inc: { completedJobsCount: 1 } });

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

  if (req.user.role === 'client') {
    if (!reservation.client._id.equals(req.user.id)) {
      return next(new AppError("Vous n'avez pas accès à cette réservation.", 403));
    }
    if (!['pending', 'assigned'].includes(reservation.status)) {
      return next(new AppError('Cette intervention ne peut plus être annulée à ce stade.', 409));
    }

    reservation.status = 'cancelled';
    reservation.cancellationReason = req.body.cancellationReason || 'Annulée par le client.';
    await reservation.save();

    return res.status(200).json({ success: true, data: reservation });
  }

  // req.user.role === 'worker'
  if (!reservation.worker || !reservation.worker.equals(req.user.id)) {
    return next(new AppError("Vous n'avez pas accès à cette réservation.", 403));
  }
  if (!['assigned', 'in_progress'].includes(reservation.status)) {
    return next(new AppError('Cette intervention ne peut plus être annulée à ce stade.', 409));
  }

  reservation.status = 'pending';
  reservation.worker = null;
  reservation.cancellationReason = req.body.cancellationReason || "Annulée par l'artisan assigné.";
  await reservation.save();

  notifyClientWorkerCancelled(reservation.client).catch((err) =>
    console.error("Erreur lors de la notification SMS d'annulation :", err.message)
  );

  res.status(200).json({ success: true, data: reservation });
});

module.exports = {
  createReservation,
  createDirectReservation,
  getMyReservationsAsClient,
  getMyReservationsAsWorker,
  getAvailableJobsForWorker,
  getReservationById,
  acceptReservation,
  startReservation,
  completeReservation,
  cancelReservation,
};
