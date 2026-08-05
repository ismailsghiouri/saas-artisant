/**
 * routes/worker.js
 * -----------------------------------------------------------------------------
 * Routes relatives aux profils artisans : gestion du profil, disponibilité,
 * vérification d'identité, réservations, analytics, et recherche publique.
 * L'inscription/connexion vivent désormais dans routes/auth.js.
 *
 * Convention : les routes "statiques" (/me, /reservations, /analytics,
 * /upgrade-premium, /top-rated...) sont déclarées AVANT la route paramétrée
 * "/:id", pour éviter qu'Express ne tente de matcher un segment statique
 * comme un identifiant d'artisan.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const workerController = require('../controllers/workerController');
const reviewController = require('../controllers/reviewController');
const reservationController = require('../controllers/reservationController');
const { auth, requireRole } = require('../middleware/auth');
const { validate, validateQuery, schemas } = require('../middleware/validation');

const router = express.Router();

// --- Profil de l'artisan connecté ---
router.get('/me', auth, requireRole('worker'), workerController.getMe);
router.put(
  '/me',
  auth,
  requireRole('worker'),
  validate(schemas.updateWorkerProfile),
  workerController.updateProfile
);
router.patch(
  '/me/availability',
  auth,
  requireRole('worker'),
  validate(schemas.updateAvailability),
  workerController.updateAvailability
);
router.post(
  '/me/verification',
  auth,
  requireRole('worker'),
  validate(schemas.submitVerification),
  workerController.submitVerification
);

// --- Réservations, statut premium et indicateurs d'activité ---
router.get('/reservations', auth, requireRole('worker'), reservationController.getMyReservationsAsWorker);
router.put('/upgrade-premium', auth, requireRole('worker'), workerController.upgradeToPremium);
router.get('/analytics', auth, requireRole('worker'), workerController.getAnalytics);

// --- Recherche publique (matching client) ---
// "/top-rated" est déclarée avant "/:id" pour éviter qu'Express ne
// l'interprète comme un identifiant d'artisan.
router.get('/top-rated', workerController.getTopRated);
router.get('/', validateQuery(schemas.searchWorkers), workerController.getAllWorkers);
router.get('/:id', workerController.getWorkerById);
router.get('/:id/reviews', reviewController.getWorkerReviews);

// --- Modification RESTful explicite par id (réservée au titulaire) ---
router.put(
  '/:id',
  auth,
  requireRole('worker'),
  validate(schemas.updateWorkerProfile),
  workerController.updateProfile
);

module.exports = router;
