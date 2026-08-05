/**
 * routes/client.js
 * -----------------------------------------------------------------------------
 * Routes relatives aux profils clients : consultation et mise à jour du
 * profil personnel, réservations, favoris. L'inscription/connexion vivent
 * désormais dans routes/auth.js.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const clientController = require('../controllers/clientController');
const reservationController = require('../controllers/reservationController');
const { auth, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.get('/me', auth, requireRole('client'), clientController.getMe);
router.put(
  '/me',
  auth,
  requireRole('client'),
  validate(schemas.updateClientProfile),
  clientController.updateProfile
);
router.patch(
  '/me/favorites/:workerId',
  auth,
  requireRole('client'),
  clientController.toggleFavorite
);

router.get('/reservations', auth, requireRole('client'), reservationController.getMyReservationsAsClient);
router.get('/favorites', auth, requireRole('client'), clientController.getFavorites);

module.exports = router;
