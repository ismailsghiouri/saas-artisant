/**
 * middleware/auth.js
 * -----------------------------------------------------------------------------
 * Authentification par JSON Web Token.
 *
 * "auth" est volontairement sans état (stateless) : il ne fait que vérifier la
 * signature/expiration du token et attache son contenu décodé
 * ({ id, email, role }) à req.user. Il ne recharge PAS le document utilisateur
 * depuis MongoDB — les contrôleurs qui ont besoin du document complet le
 * chargent eux-mêmes via req.user.id (User.findById / Worker.findById /
 * Client.findById selon le cas).
 *
 * "requireRole" restreint ensuite l'accès à un rôle précis ('worker' ou
 * 'client'), en s'appuyant sur le rôle embarqué dans le token.
 *
 * La gestion du blog et des annonces (back-office) n'a volontairement pas de
 * modèle "Admin" dédié au stade du MVP : ces routes sont protégées par une clé
 * partagée simple (protectAdmin).
 * -----------------------------------------------------------------------------
 */

const jwt = require('jsonwebtoken');

/**
 * Génère un JWT signé pour un utilisateur donné.
 *
 * @param {{ _id: any, email: string, role: 'worker'|'client' }} user
 * @returns {string}
 */
const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

/**
 * Vérifie qu'un token JWT valide est présent dans le header
 * "Authorization: Bearer <token>" et attache son contenu décodé à req.user.
 */
const auth = (req, res, next) => {
  const token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentification requise.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré.' });
  }
};

/**
 * Middleware factory : restreint l'accès à un rôle précis. À utiliser après
 * "auth" (qui a déjà peuplé req.user).
 *
 * @param {'worker'|'client'} role
 */
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res
      .status(403)
      .json({ success: false, message: "Vous n'avez pas la permission d'effectuer cette action." });
  }
  next();
};

/**
 * Protection simple des routes d'administration (gestion du blog, des
 * annonces) via une clé partagée transmise dans le header "x-admin-key".
 */
const protectAdmin = (req, res, next) => {
  const providedKey = req.headers['x-admin-key'];

  if (!process.env.ADMIN_API_KEY) {
    console.error('❌ ADMIN_API_KEY non configurée côté serveur : accès admin refusé par défaut.');
    return res.status(503).json({ success: false, message: 'Fonctionnalité administrateur indisponible.' });
  }

  if (!providedKey || providedKey !== process.env.ADMIN_API_KEY) {
    return res
      .status(403)
      .json({ success: false, message: 'Accès administrateur refusé : clé invalide ou manquante.' });
  }

  next();
};

module.exports = { auth, requireRole, protectAdmin, generateToken };
