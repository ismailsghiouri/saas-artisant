/**
 * routes/reservation.js
 * -----------------------------------------------------------------------------
 * Routes du cycle de vie d'une demande d'intervention. La plupart des actions
 * de transition de statut (accept/start/complete) sont réservées aux
 * artisans ; la création est réservée aux clients ; l'annulation et la
 * consultation par id sont ouvertes aux deux rôles (le contrôleur vérifie
 * ensuite que l'utilisateur est bien partie prenante de la réservation).
 *
 * Le listing "mes réservations" vit désormais sous l'espace propre à chaque
 * rôle : GET /api/clients/reservations et GET /api/workers/reservations
 * (voir routes/client.js et routes/worker.js).
 *
 * La route statique "/available" est déclarée avant la route paramétrée
 * "/:id" pour éviter tout conflit de matching Express.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const reservationController = require('../controllers/reservationController');
const { auth, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.post(
  '/',
  auth,
  requireRole('client'),
  validate(schemas.createReservation),
  reservationController.createReservation
);

router.post(
  '/direct',
  auth,
  requireRole('client'),
  validate(schemas.createDirectReservation),
  reservationController.createDirectReservation
);

router.get(
  '/available',
  auth,
  requireRole('worker'),
  reservationController.getAvailableJobsForWorker
);

router.get('/:id', auth, reservationController.getReservationById);

router.patch('/:id/accept', auth, requireRole('worker'), reservationController.acceptReservation);
router.patch('/:id/start', auth, requireRole('worker'), reservationController.startReservation);
router.patch(
  '/:id/complete',
  auth,
  requireRole('worker'),
  validate(schemas.completeReservation),
  reservationController.completeReservation
);
router.patch(
  '/:id/cancel',
  auth,
  validate(schemas.cancelReservation),
  reservationController.cancelReservation
);

// Alias REST (PUT/DELETE) équivalents aux routes PATCH ci-dessus, pour les
// clients HTTP qui attendent ces verbes sur des actions de transition
// d'état plutôt que des PATCH sémantiques.
router.put('/:id/confirm', auth, requireRole('worker'), reservationController.acceptReservation);
router.put(
  '/:id/complete',
  auth,
  requireRole('worker'),
  validate(schemas.completeReservation),
  reservationController.completeReservation
);
router.delete(
  '/:id',
  auth,
  validate(schemas.cancelReservation),
  reservationController.cancelReservation
);

module.exports = router;
