/**
 * routes/client.js
 * -----------------------------------------------------------------------------
 * Routes relatives aux comptes clients : inscription, connexion et gestion
 * du profil personnel.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const clientController = require('../controllers/clientController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

router.post('/register', validate(schemas.registerClient), clientController.register);
router.post('/login', validate(schemas.login), clientController.login);

router.get('/me', protect('client'), clientController.getMe);
router.put(
  '/me',
  protect('client'),
  validate(schemas.updateClientProfile),
  clientController.updateProfile
);

module.exports = router;
