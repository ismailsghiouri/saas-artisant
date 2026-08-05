/**
 * routes/auth.js
 * -----------------------------------------------------------------------------
 * Point d'entrée unique pour l'authentification des deux rôles Maalam Expert
 * (artisan/"worker" et client), qui partagent désormais la même collection
 * "users" (voir models/User.js + discriminators Worker/Client).
 *
 *   POST /api/auth/signup/worker
 *   POST /api/auth/signup/client
 *   POST /api/auth/login
 *   GET  /api/auth/me
 *   POST /api/auth/logout
 *
 * Le token JWT embarque { id, email, role } : les routes métier (workers,
 * clients, reservations...) s'appuient sur "auth" + "requireRole('worker'|
 * 'client')" (middleware/auth.js) pour l'autorisation, sans dépendre de ce
 * fichier.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Worker = require('../models/Worker');
const Client = require('../models/Client');
const { auth, generateToken } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { sendWelcomeEmail } = require('../utils/email');

const router = express.Router();

/**
 * Ne renvoie que les champs publics nécessaires au frontend juste après
 * signup/login, conformément au contrat attendu par le client (id/role/name/
 * email) — le profil complet est disponible via GET /api/auth/me.
 */
const toAuthPayload = (user) => ({
  id: user._id,
  role: user.role,
  name: user.name,
  email: user.email,
});

/**
 * POST /api/auth/signup/worker
 * Crée un compte artisan. Le profil est créé non vérifié (verificationStatus
 * = "pending", isAvailable = false) : il doit être vérifié manuellement par
 * l'équipe Maalam Expert avant de pouvoir recevoir des demandes.
 */
router.post(
  '/signup/worker',
  validate(schemas.signupWorker),
  asyncHandler(async (req, res, next) => {
    const { years_experience: yearsExperience, ...rest } = req.body;

    const existing = await User.findOne({ email: rest.email });
    if (existing) {
      return next(new AppError('Un compte existe déjà avec cet email.', 409));
    }

    const worker = await Worker.create({ ...rest, yearsExperience });
    const token = generateToken(worker);

    sendWelcomeEmail(worker).catch((err) =>
      console.error("Erreur lors de l'envoi de l'email de bienvenue :", err.message)
    );

    res.status(201).json({
      success: true,
      message:
        'Compte artisan créé avec succès. Votre profil sera activé après vérification de vos documents.',
      token,
      user: toAuthPayload(worker),
    });
  })
);

/**
 * POST /api/auth/signup/client
 */
router.post(
  '/signup/client',
  validate(schemas.signupClient),
  asyncHandler(async (req, res, next) => {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) {
      return next(new AppError('Un compte existe déjà avec cet email.', 409));
    }

    const client = await Client.create(req.body);
    const token = generateToken(client);

    sendWelcomeEmail(client).catch((err) =>
      console.error("Erreur lors de l'envoi de l'email de bienvenue :", err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès.',
      token,
      user: toAuthPayload(client),
    });
  })
);

/**
 * POST /api/auth/login
 * Commun aux deux rôles : l'utilisateur est retrouvé par email seul, son rôle
 * étant porté par le document lui-même (discriminator).
 */
router.post(
  '/login',
  validate(schemas.login),
  asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // .select('+password') car le champ est exclu par défaut dans le schéma.
    const user = await User.findOne({ email }).select('+password');

    // Un compte créé via Google n'a pas de mot de passe local (voir
    // models/User.js) : comparePassword planterait sur un hash undefined.
    if (!user || !user.password || !(await user.comparePassword(password))) {
      return next(new AppError('Email ou mot de passe incorrect.', 401));
    }

    if (!user.isActive) {
      return next(new AppError('Ce compte a été désactivé. Contactez le support Maalam Expert.', 403));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: toAuthPayload(user),
    });
  })
);

/**
 * POST /api/auth/google
 * Connexion/inscription via Google. L'échange OAuth avec Google est
 * entièrement délégué à Supabase Auth (voir frontend/src/utils/supabase.js) :
 * le frontend transmet ici l'access_token de session Supabase obtenu après le
 * redirect, qu'on vérifie directement auprès de Supabase (GET /auth/v1/user)
 * avant de retrouver/créer l'utilisateur Maalam Expert et d'émettre notre
 * propre JWT applicatif — le reste de l'app n'a besoin de rien savoir de
 * Supabase.
 *
 * Un compte Google est toujours créé côté "client" par défaut : un artisan a
 * besoin de renseigner ville/métier/expérience, que Google ne fournit pas, et
 * passe donc par le formulaire d'inscription classique.
 */
router.post(
  '/google',
  asyncHandler(async (req, res, next) => {
    const { access_token: accessToken } = req.body;
    if (!accessToken) {
      return next(new AppError('Token Google manquant.', 400));
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error('❌ SUPABASE_URL/SUPABASE_ANON_KEY non configurées côté serveur.');
      return next(new AppError('La connexion Google n\'est pas disponible pour le moment.', 503));
    }

    let supabaseUser;
    try {
      const { data } = await axios.get(`${process.env.SUPABASE_URL}/auth/v1/user`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: process.env.SUPABASE_ANON_KEY,
        },
      });
      supabaseUser = data;
    } catch (err) {
      return next(new AppError('Session Google invalide ou expirée.', 401));
    }

    const email = supabaseUser.email;
    if (!email) {
      return next(new AppError("Impossible de récupérer l'email du compte Google.", 400));
    }

    let user = await User.findOne({ email });

    if (!user) {
      const metadata = supabaseUser.user_metadata || {};
      user = await Client.create({
        name: metadata.full_name || metadata.name || email.split('@')[0],
        email,
        role: 'client',
        authProvider: 'google',
        googleId: supabaseUser.id,
        avatarUrl: metadata.avatar_url || metadata.picture || null,
        isVerified: true,
      });
    } else if (!user.googleId) {
      // Compte existant (créé en email/mot de passe) dont l'email correspond :
      // on relie simplement le compte Google, sans toucher au mot de passe.
      user.googleId = supabaseUser.id;
      user.isVerified = true;
      await user.save({ validateBeforeSave: false });
    }

    if (!user.isActive) {
      return next(new AppError('Ce compte a été désactivé. Contactez le support Maalam Expert.', 403));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: toAuthPayload(user),
    });
  })
);

/**
 * GET /api/auth/me
 * Profil complet de l'utilisateur authentifié (artisan ou client), rôle
 * inclus. Interroger le modèle de base "User" suffit : Mongoose hydrate
 * automatiquement le bon discriminator (Worker/Client) selon le rôle stocké.
 */
router.get(
  '/me',
  auth,
  asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError("L'utilisateur associé à ce token n'existe plus.", 401));
    }

    res.status(200).json({ success: true, data: user.toSafeObject() });
  })
);

/**
 * POST /api/auth/logout
 * L'authentification étant un JWT sans état côté serveur (pas de session ni
 * de liste de révocation), la déconnexion consiste à faire supprimer le token
 * côté client ; cet endpoint ne fait que confirmer l'opération.
 */
router.post('/logout', auth, (req, res) => {
  res.status(200).json({ status: 'logged_out' });
});

module.exports = router;
