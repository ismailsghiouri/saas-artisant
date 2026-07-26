/**
 * routes/reservation.js
 * -----------------------------------------------------------------------------
 * Routes du cycle de vie d'une demande d'intervention. La plupart des actions
 * de transition de statut (accept/start/complete) sont réservées aux
 * artisans ; la création est réservée aux clients ; l'annulation et la
 * consultation par id sont ouvertes aux deux rôles (le contrôleur vérifie
 * ensuite que l'utilisateur est bien partie prenante de la réservation).
 *
 * Les routes statiques (/me, /artisan/me, /available) sont déclarées avant
 * la route paramétrée "/:id" pour éviter tout conflit de matching Express.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const reservationController = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.post(
  '/',
  protect('client'),
  validate(schemas.createReservation),
  reservationController.createReservation
);

router.get('/me', protect('client'), reservationController.getMyReservationsAsClient);
router.get('/artisan/me', protect('artisan'), reservationController.getMyReservationsAsArtisan);
router.get('/available', protect('artisan'), reservationController.getAvailableJobsForArtisan);

router.get('/:id', protect(), reservationController.getReservationById);

router.patch('/:id/accept', protect('artisan'), reservationController.acceptReservation);
router.patch('/:id/start', protect('artisan'), reservationController.startReservation);
router.patch(
  '/:id/complete',
  protect('artisan'),
  validate(schemas.completeReservation),
  reservationController.completeReservation
);
router.patch(
  '/:id/cancel',
  protect(),
  validate(schemas.cancelReservation),
  reservationController.cancelReservation
);

module.exports = router;
