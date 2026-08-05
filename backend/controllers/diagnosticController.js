/**
 * controllers/diagnosticController.js
 * -----------------------------------------------------------------------------
 * Diagnostic IA : le client envoie une photo OU une description vocale
 * (transcrite côté navigateur) du problème, l'IA (Gemini) l'analyse et la
 * plateforme propose des artisans vérifiés à proximité pour la catégorie
 * détectée. Endpoints publics (pas d'authentification requise) : pensés comme
 * un outil d'accroche avant la prise de contact.
 * -----------------------------------------------------------------------------
 */

const Worker = require('../models/Worker');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { classifyProblemPhoto, classifyProblemText } = require('../utils/gemini');

const MAX_ARTISANS = 6;
const DEFAULT_MATCH_RADIUS_KM = 20;

/**
 * Recherche les artisans vérifiés/disponibles pour la catégorie détectée.
 * Ordre de priorité pour la localisation (un client peut donner les deux —
 * ville prononcée + position GPS ambiante — et les deux ne coïncident pas
 * forcément, ex. "un plombier à Tanger" alors que le client est à Rabat) :
 *   1. `city` explicite (intention clairement énoncée par le client) ;
 *   2. `lat`/`lng` (position GPS ambiante, triée par proximité) ;
 *   3. à défaut, tri par note décroissante.
 */
const findMatchingArtisans = (category, { lat, lng, city } = {}) => {
  const baseFilter = {
    category,
    isAvailable: true,
    verifiedBadge: true,
    status: 'active',
    isActive: true,
  };

  if (city) {
    return Worker.find({ ...baseFilter, city: new RegExp(`^${city}$`, 'i') })
      .select('-password -documents -verificationRejectionReason')
      .sort('-rating -totalReviews')
      .limit(MAX_ARTISANS);
  }

  if (lat && lng) {
    return Worker.find({
      ...baseFilter,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
          $maxDistance: DEFAULT_MATCH_RADIUS_KM * 1000,
        },
      },
    })
      .select('-password -documents -verificationRejectionReason')
      .limit(MAX_ARTISANS);
  }

  return Worker.find(baseFilter)
    .select('-password -documents -verificationRejectionReason')
    .sort('-rating -totalReviews')
    .limit(MAX_ARTISANS);
};

/**
 * POST /api/diagnose
 * multipart/form-data : "photo" (fichier image), "lat"/"lng" (optionnels).
 */
const diagnosePhoto = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('Aucune photo reçue.', 400));
  }

  const { lat, lng } = req.body;
  const base64Data = req.file.buffer.toString('base64');

  const { category, diagnosis, urgency } = await classifyProblemPhoto(base64Data, req.file.mimetype);
  const artisans = await findMatchingArtisans(category, { lat, lng });

  res.status(200).json({
    success: true,
    data: { category, diagnosis, urgency, artisans },
  });
});

/**
 * POST /api/diagnose/voice
 * JSON : "transcript" (texte transcrit côté navigateur via Web Speech API),
 * "lat"/"lng" (position GPS optionnelle, capturée par le navigateur). La
 * ville, elle, est déduite du transcript par l'IA (ex. "un électricien à
 * Tanger") — voir findMatchingArtisans pour l'ordre de priorité entre les deux.
 */
const diagnoseVoice = asyncHandler(async (req, res, next) => {
  const { transcript, lat, lng } = req.body;
  if (!transcript || !transcript.trim()) {
    return next(new AppError('Aucune description reçue.', 400));
  }

  const { category, diagnosis, urgency, city } = await classifyProblemText(transcript.trim());
  console.log(
    `🎤 Diagnostic vocal — transcript: "${transcript.trim()}" → catégorie: ${category}, ville: ${city || '(aucune)'}`
  );
  const artisans = await findMatchingArtisans(category, { lat, lng, city });

  res.status(200).json({
    success: true,
    data: { category, diagnosis, urgency, city, artisans },
  });
});

module.exports = { diagnosePhoto, diagnoseVoice };
