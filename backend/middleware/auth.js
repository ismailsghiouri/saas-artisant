/**
 * middleware/auth.js
 * -----------------------------------------------------------------------------
 * Authentification par JSON Web Token.
 *
 * FixNow a deux populations d'utilisateurs authentifiés par mot de passe
 * (Client et Artisan), stockées dans deux collections Mongoose distinctes.
 * Le token JWT embarque donc à la fois l'id ET le rôle de l'utilisateur, ce
 * qui permet de savoir dans quel modèle chercher le compte associé sans
 * requête supplémentaire ni ambiguïté d'id entre les deux collections.
 *
 * La gestion du blog et des annonces (back-office) n'a volontairement pas de
 * modèle "Admin" dédié au stade du MVP (non demandé) : ces routes sont
 * protégées par une clé partagée simple (protectAdmin), à faire évoluer vers
 * un vrai compte admin + RBAC lorsque l'équipe interne grandira.
 * -----------------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const Artisan = require('../models/Artisan');
const Client = require('../models/Client');

/**
 * Génère un JWT signé pour un utilisateur donné.
 *
 * @param {string} id    Identifiant Mongo de l'utilisateur.
 * @param {'client'|'artisan'} role
 * @returns {string}
 */
const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Middleware factory : vérifie qu'un token JWT valide est présent, charge
 * l'utilisateur correspondant en base, et restreint optionnellement l'accès
 * à certains rôles.
 *
 * Usage :
 *   router.get('/me', protect(), controller.getMe)               // client OU artisan
 *   router.patch('/:id/accept', protect('artisan'), controller.accept)  // artisan uniquement
 *
 * @param {...('client'|'artisan')} allowedRoles  Rôles autorisés (vide = tous rôles authentifiés).
 */
const protect = (...allowedRoles) =>
  asyncHandler(async (req, res, next) => {
    // 1) Extraction du token depuis le header "Authorization: Bearer <token>".
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentification requise. Veuillez vous connecter.', 401));
    }

    // 2) Vérification de la signature et de l'expiration du token.
    //    jwt.verify lève une exception (JsonWebTokenError / TokenExpiredError)
    //    en cas de token invalide ou expiré ; elle est capturée par
    //    asyncHandler puis traduite en message clair par globalErrorHandler.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Chargement de l'utilisateur dans la collection correspondant à son rôle.
    const Model = decoded.role === 'artisan' ? Artisan : Client;
    const currentUser = await Model.findById(decoded.id);

    if (!currentUser) {
      return next(new AppError("L'utilisateur associé à ce token n'existe plus.", 401));
    }

    if (!currentUser.isActive) {
      return next(new AppError('Ce compte a été désactivé. Contactez le support FixNow.', 403));
    }

    // 4) Invalidation implicite des tokens émis avant un changement de mot de passe.
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(currentUser.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedTimestamp) {
        return next(
          new AppError('Le mot de passe a été modifié récemment. Veuillez vous reconnecter.', 401)
        );
      }
    }

    // 5) Contrôle d'accès par rôle, si la route restreint explicitement les rôles autorisés.
    if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
      return next(new AppError("Vous n'avez pas la permission d'effectuer cette action.", 403));
    }

    // On attache l'utilisateur et son rôle à la requête pour les contrôleurs suivants.
    req.user = currentUser;
    req.userRole = decoded.role;
    next();
  });

/**
 * Protection simple des routes d'administration (gestion du blog, des
 * annonces) via une clé partagée transmise dans le header "x-admin-key".
 * Volontairement minimaliste : à remplacer par un vrai compte Admin + JWT
 * dès que le back-office interne dépasse un usage occasionnel par 1-2 personnes.
 */
const protectAdmin = (req, res, next) => {
  const providedKey = req.headers['x-admin-key'];

  if (!process.env.ADMIN_API_KEY) {
    console.error('❌ ADMIN_API_KEY non configurée côté serveur : accès admin refusé par défaut.');
    return next(new AppError('Fonctionnalité administrateur indisponible.', 503));
  }

  if (!providedKey || providedKey !== process.env.ADMIN_API_KEY) {
    return next(new AppError('Accès administrateur refusé : clé invalide ou manquante.', 403));
  }

  next();
};

module.exports = { protect, protectAdmin, generateToken };
