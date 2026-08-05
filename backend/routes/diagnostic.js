/**
 * routes/diagnostic.js
 * -----------------------------------------------------------------------------
 * Diagnostic photo public : upload d'image (multipart) analysée par l'IA,
 * puis matching d'artisans. Multer garde le fichier en mémoire (pas d'écriture
 * disque) et limite sa taille pour éviter les abus.
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const multer = require('multer');
const diagnosticController = require('../controllers/diagnosticController');
const { AppError } = require('../utils/errorHandler');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Seules les images sont acceptées.', 400));
    }
    cb(null, true);
  },
});

/**
 * Traduit les erreurs Multer (taille, type de fichier) en réponse JSON
 * cohérente avec le reste de l'API plutôt que de laisser passer une erreur
 * brute au middleware global.
 */
const handleUpload = (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('Photo trop volumineuse (8 Mo maximum).', 400));
    }
    next(err instanceof AppError ? err : new AppError(err.message, 400));
  });
};

router.post('/', handleUpload, diagnosticController.diagnosePhoto);
router.post('/voice', diagnosticController.diagnoseVoice);

module.exports = router;
