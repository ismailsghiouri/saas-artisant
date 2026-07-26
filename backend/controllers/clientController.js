/**
 * controllers/clientController.js
 * -----------------------------------------------------------------------------
 * Logique métier liée aux comptes clients : inscription, connexion et gestion
 * du profil personnel.
 *
 * Remarque : ce fichier n'était pas listé explicitement dans le squelette de
 * contrôleurs demandé, mais routes/client.js (auth + profil client) a besoin
 * d'une implémentation — il suit exactement le même patron que
 * artisanController.js pour rester cohérent avec le reste du projet.
 * -----------------------------------------------------------------------------
 */

const Client = require('../models/Client');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { generateToken } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/email');

/**
 * POST /api/clients/register
 */
const register = asyncHandler(async (req, res, next) => {
  const existingClient = await Client.findOne({ email: req.body.email });
  if (existingClient) {
    return next(new AppError('Un compte client existe déjà avec cet email.', 409));
  }

  const client = await Client.create(req.body);
  const token = generateToken(client._id, 'client');

  sendWelcomeEmail(client).catch((err) =>
    console.error("Erreur lors de l'envoi de l'email de bienvenue :", err.message)
  );

  res.status(201).json({
    success: true,
    message: 'Compte créé avec succès.',
    token,
    data: client.toSafeObject(),
  });
});

/**
 * POST /api/clients/login
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const client = await Client.findOne({ email }).select('+password');

  if (!client || !(await client.comparePassword(password))) {
    return next(new AppError('Email ou mot de passe incorrect.', 401));
  }

  if (!client.isActive) {
    return next(new AppError('Ce compte a été désactivé. Contactez le support FixNow.', 403));
  }

  const token = generateToken(client._id, 'client');

  res.status(200).json({
    success: true,
    token,
    data: client.toSafeObject(),
  });
});

/**
 * GET /api/clients/me
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user.toSafeObject() });
});

/**
 * PUT /api/clients/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();

  res.status(200).json({ success: true, data: req.user.toSafeObject() });
});

module.exports = { register, login, getMe, updateProfile };
