/**
 * utils/gemini.js
 * -----------------------------------------------------------------------------
 * Analyse un problème (photo OU description vocale/texte) via l'API Gemini
 * (Google AI Studio, niveau gratuit) et le classe parmi les métiers supportés
 * par la plateforme, avec un court diagnostic en français.
 *
 * On utilise l'API REST directement (via axios, déjà une dépendance du
 * projet) plutôt qu'un SDK, pour ne pas ajouter de dépendance supplémentaire
 * pour de simples appels HTTP.
 * -----------------------------------------------------------------------------
 */

const axios = require('axios');
const { AppError } = require('./errorHandler');
const Worker = require('../models/Worker');

// gemini-2.0-flash n'a plus de quota gratuit alloué sur les nouveaux projets
// Google AI Studio (constaté en usage réel) : gemini-2.5-flash est le modèle
// par défaut le plus fiable pour rester sur le niveau gratuit.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const URGENCY_LEVELS = ['faible', 'moderee', 'elevee'];

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    category: { type: 'string', enum: Worker.CATEGORIES },
    diagnosis: { type: 'string' },
    urgency: { type: 'string', enum: URGENCY_LEVELS },
    city: { type: 'string' },
  },
  required: ['category', 'diagnosis', 'urgency'],
};

const PHOTO_PROMPT = `Tu es un expert du bâtiment qui aide à orienter un client vers le bon artisan à partir d'une photo.
Analyse la photo fournie et identifie le problème visible (fuite d'eau, panne électrique, serrure cassée, peinture à refaire, meuble/bois abîmé, climatisation, électroménager en panne, maçonnerie, ou autre).
Réponds uniquement avec le JSON demandé :
- "category" : le métier le plus adapté parmi ${Worker.CATEGORIES.join(', ')}.
- "diagnosis" : une description courte (1 à 2 phrases, en français) du problème visible, à destination du client.
- "urgency" : "faible", "moderee" ou "elevee" selon le degré d'urgence apparent de l'intervention.
- "city" : renvoie toujours une chaîne vide "" (une photo ne permet pas de déterminer une ville).
Si la photo ne montre pas de problème clairement identifiable, choisis la catégorie la plus plausible et explique-le dans "diagnosis".`;

const textPrompt = (transcript) => `Tu es un expert du bâtiment qui aide à orienter un client vers le bon artisan à partir d'une description parlée (transcrite depuis la voix, potentiellement en français, anglais ou arabe).
Description du client : "${transcript}"
Réponds uniquement avec le JSON demandé :
- "category" : le métier le plus adapté parmi ${Worker.CATEGORIES.join(', ')}.
- "diagnosis" : une reformulation courte (1 à 2 phrases, en français) du problème décrit, à destination du client.
- "urgency" : "faible", "moderee" ou "elevee" selon le degré d'urgence exprimé.
- "city" : le nom de la ville marocaine mentionnée explicitement par le client (ex. "Tanger", "Casablanca"), normalisé avec une majuscule initiale. Si aucune ville n'est mentionnée, renvoie une chaîne vide "".
Si la description ne permet pas d'identifier clairement un métier, choisis la catégorie la plus plausible et explique-le dans "diagnosis".`;

/**
 * Envoie les `parts` (texte et/ou image) à Gemini et retourne le JSON validé
 * conforme à RESPONSE_SCHEMA. Partagé par la classification photo et texte.
 */
const callGemini = async (parts) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AppError("Le diagnostic IA n'est pas configuré (clé API manquante).", 503);
  }

  let response;
  try {
    response = await axios.post(
      GEMINI_URL,
      {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      },
      { params: { key: apiKey }, timeout: 20000 }
    );
  } catch (err) {
    const message = err.response?.data?.error?.message || err.message;
    throw new AppError(`Analyse IA impossible : ${message}`, 502);
  }

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new AppError("L'IA n'a pas pu analyser cette demande. Réessayez.", 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new AppError("Réponse de l'IA invalide. Réessayez.", 502);
  }

  if (!Worker.CATEGORIES.includes(parsed.category)) {
    parsed.category = 'autre';
  }
  if (!URGENCY_LEVELS.includes(parsed.urgency)) {
    parsed.urgency = 'moderee';
  }
  if (typeof parsed.city !== 'string') {
    parsed.city = '';
  }

  return parsed;
};

/**
 * @param {string} base64Data  Contenu de l'image encodé en base64 (sans préfixe data:URI).
 * @param {string} mimeType    Type MIME de l'image (ex. "image/jpeg").
 * @returns {Promise<{category: string, diagnosis: string, urgency: string, city: string}>}
 */
const classifyProblemPhoto = (base64Data, mimeType) =>
  callGemini([{ text: PHOTO_PROMPT }, { inline_data: { mime_type: mimeType, data: base64Data } }]);

/**
 * @param {string} transcript  Texte transcrit depuis la voix du client (Web Speech API).
 * @returns {Promise<{category: string, diagnosis: string, urgency: string, city: string}>}
 */
const classifyProblemText = (transcript) => callGemini([{ text: textPrompt(transcript) }]);

module.exports = { classifyProblemPhoto, classifyProblemText };
