/**
 * setup/fixtures.js
 * -----------------------------------------------------------------------------
 * Fabriques de données de test : payloads valides par défaut (surchargeables)
 * et création directe en base (via les modèles Mongoose, hors HTTP) pour ne
 * pas consommer le rate limiting des routes d'authentification pendant les
 * tests d'autres domaines (réservations, avis...).
 * -----------------------------------------------------------------------------
 */
const Client = require('../../models/Client');
const Worker = require('../../models/Worker');
const { generateToken } = require('../../middleware/auth');

let counter = 0;
const uniqueEmail = (prefix) => `${prefix}-${Date.now()}-${counter++}@example.com`;

const validClientPayload = (overrides = {}) => ({
  name: 'Sara Bennis',
  email: uniqueEmail('client'),
  password: 'Password123!',
  phone: '0612345678',
  city: 'Casablanca',
  ...overrides,
});

const validWorkerPayload = (overrides = {}) => ({
  name: 'Youssef El Amrani',
  email: uniqueEmail('worker'),
  password: 'Password123!',
  phone: '0687654321',
  category: 'plombier',
  city: 'Casablanca',
  ...overrides,
});

/** Crée un client directement en base (hors HTTP) et retourne le document + un token JWT valide. */
const createClient = async (overrides = {}) => {
  const client = await Client.create(validClientPayload(overrides));
  return { client, token: generateToken(client) };
};

/** Crée un artisan vérifié et disponible par défaut (prêt à recevoir des réservations). */
const createWorker = async (overrides = {}) => {
  const worker = await Worker.create(
    validWorkerPayload({
      verificationStatus: 'verified',
      isAvailable: true,
      location: { type: 'Point', coordinates: [-7.5898, 33.5731] },
      ...overrides,
    })
  );
  return { worker, token: generateToken(worker) };
};

const validReservationPayload = (overrides = {}) => ({
  serviceCategory: 'plombier',
  description: "Fuite d'eau sous l'évier de la cuisine.",
  address: '12 rue des Fleurs, Casablanca',
  location: { coordinates: [-7.5898, 33.5731] },
  urgency: 'today',
  ...overrides,
});

module.exports = {
  validClientPayload,
  validWorkerPayload,
  validReservationPayload,
  createClient,
  createWorker,
};
