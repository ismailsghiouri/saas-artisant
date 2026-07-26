/**
 * utils/errorHandler.js
 * -----------------------------------------------------------------------------
 * Gestion centralisée des erreurs pour toute l'API :
 *
 *  - AppError       : classe d'erreur "opérationnelle" (attendue), porteuse
 *                      d'un statusCode HTTP explicite (ex. 404, 409...).
 *  - asyncHandler   : wrapper évitant les try/catch répétés dans chaque
 *                      contrôleur asynchrone ; transmet toute exception au
 *                      middleware d'erreur global via next(err).
 *  - globalErrorHandler : middleware Express à monter en tout dernier, qui
 *                      traduit les erreurs Mongoose/JWT connues en réponses
 *                      JSON cohérentes et masque les détails techniques des
 *                      erreurs non opérationnelles en production.
 * -----------------------------------------------------------------------------
 */

/**
 * Erreur "métier" attendue (ex. ressource introuvable, droits insuffisants).
 * On la distingue des bugs/erreurs inattendues via le flag isOperational,
 * utilisé par globalErrorHandler pour décider quel message renvoyer au client.
 */
class AppError extends Error {
  /**
   * @param {string} message  Message destiné à être affiché au client.
   * @param {number} statusCode  Code HTTP (400, 401, 403, 404, 409, 422...).
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Enveloppe une fonction de contrôleur asynchrone pour transmettre
 * automatiquement toute erreur rejetée au middleware d'erreur Express,
 * sans avoir à écrire de bloc try/catch dans chaque route.
 *
 * @param {Function} fn  Fonction async (req, res, next) => {...}
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Traduit une erreur de type "CastError" Mongoose (ex. ObjectId invalide
 * dans l'URL) en AppError lisible pour le client.
 */
const handleCastErrorDB = (err) =>
  new AppError(`Identifiant invalide pour le champ "${err.path}" : ${err.value}.`, 400);

/**
 * Traduit une erreur d'index unique MongoDB (code 11000) — par exemple un
 * email déjà utilisé lors d'une inscription.
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'champ';
  const value = err.keyValue ? err.keyValue[field] : '';
  return new AppError(`La valeur "${value}" existe déjà pour le champ "${field}".`, 409);
};

/**
 * Traduit les erreurs de validation de schéma Mongoose (required, min, max,
 * enum, match...) en un message unique et lisible.
 */
const handleValidationErrorDB = (err) => {
  const messages = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Données invalides : ${messages.join(' ')}`, 400);
};

const handleJWTError = () =>
  new AppError('Token invalide. Veuillez vous reconnecter.', 401);

const handleJWTExpiredError = () =>
  new AppError('Votre session a expiré. Veuillez vous reconnecter.', 401);

/**
 * Middleware d'erreur global Express. Doit être monté APRÈS toutes les
 * routes dans server.js (Express le reconnaît à sa signature à 4 arguments).
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  let error = err;
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';

  // On normalise certaines erreurs "techniques" connues en AppError
  // opérationnelles, pour renvoyer un message clair plutôt qu'une erreur 500
  // générique lorsque la cause est en réalité une entrée utilisateur invalide.
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = handleJWTError();
  if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Log complet côté serveur (utile en dev ; en prod, à brancher sur un
  // outil de monitoring type Sentry — voir document d'architecture).
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 ERREUR :', err);
  } else if (!error.isOperational) {
    // En production, on log quand même les erreurs non prévues pour pouvoir
    // les investiguer, sans jamais exposer leur détail au client.
    console.error('💥 ERREUR NON OPÉRATIONNELLE :', err);
  }

  res.status(error.statusCode).json({
    success: false,
    status: error.status,
    message: error.isOperational
      ? error.message
      : 'Une erreur interne est survenue. Veuillez réessayer plus tard.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { AppError, asyncHandler, globalErrorHandler };
