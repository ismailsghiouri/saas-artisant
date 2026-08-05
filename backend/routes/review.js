/**
 * routes/review.js
 * -----------------------------------------------------------------------------
 * Publication d'avis (client uniquement) et consultation publique des avis
 * d'un artisan (fiche profil).
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const reviewController = require('../controllers/reviewController');
const { auth, requireRole } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.post('/', auth, requireRole('client'), validate(schemas.createReview), reviewController.createReview);

// "/" avec ?worker_id=X et "/worker/:workerId" pointent vers le même
// contrôleur (voir reviewController.getWorkerReviews), qui accepte l'id
// artisan sous les deux formes.
router.get('/', reviewController.getWorkerReviews);
router.get('/worker/:workerId', reviewController.getWorkerReviews);

router.put('/:id', auth, requireRole('client'), validate(schemas.updateReview), reviewController.updateReview);
router.delete('/:id', auth, requireRole('client'), reviewController.deleteReview);

module.exports = router;
