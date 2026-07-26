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
router.get('/artisan/:artisanId', reviewController.getArtisanReviews);

module.exports = router;
