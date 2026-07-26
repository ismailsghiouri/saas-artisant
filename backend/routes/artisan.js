/**
 * routes/artisan.js
 * -----------------------------------------------------------------------------
 * Routes relatives aux comptes artisans : inscription, connexion, gestion du
 * profil, disponibilité, KYC, et recherche publique.
 *
 * Convention : les routes "statiques" (/register, /login, /me...) sont
 * déclarées AVANT la route paramétrée "/:id", pour éviter que Express ne
 * tente de matcher "me" comme un identifiant d'artisan.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const artisanController = require('../controllers/artisanController');
const { protect } = require('../middleware/auth');
const { validate, validateQuery, schemas } = require('../middleware/validation');

const router = express.Router();

// --- Authentification ---
router.post('/register', validate(schemas.registerArtisan), artisanController.register);
router.post('/login', validate(schemas.login), artisanController.login);

// --- Profil de l'artisan connecté ---
router.get('/me', protect('artisan'), artisanController.getMe);
router.put(
  '/me',
  protect('artisan'),
  validate(schemas.updateArtisanProfile),
  artisanController.updateProfile
);
router.patch(
  '/me/availability',
  protect('artisan'),
  validate(schemas.updateAvailability),
  artisanController.updateAvailability
);
router.post(
  '/me/kyc',
  protect('artisan'),
  validate(schemas.submitKyc),
  artisanController.submitKyc
);

// --- Recherche publique (matching client) ---
router.get('/', validateQuery(schemas.searchArtisans), artisanController.getAllArtisans);
router.get('/:id', artisanController.getArtisanById);

module.exports = router;
