/**
 * routes/review.js
 * -----------------------------------------------------------------------------
 * Publication d'avis (client uniquement) et consultation publique des avis
 * d'un artisan (fiche profil).
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.post('/', protect('client'), validate(schemas.createReview), reviewController.createReview);

// "/" avec ?artisan_id=X et "/artisan/:artisanId" pointent vers le même
// contrôleur (voir reviewController.getArtisanReviews), qui accepte l'id
// artisan sous les deux formes.
router.get('/', reviewController.getArtisanReviews);
router.get('/artisan/:artisanId', reviewController.getArtisanReviews);

router.put('/:id', protect('client'), validate(schemas.updateReview), reviewController.updateReview);
router.delete('/:id', protect('client'), reviewController.deleteReview);

module.exports = router;
