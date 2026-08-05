/**
 * setup/jest.setup.js
 * -----------------------------------------------------------------------------
 * Cycle de vie global de la base de test : connexion une fois par fichier de
 * test, base vidée entre chaque test pour l'isolation, fermeture propre à la
 * fin. Les logs attendus (logger de requêtes, avertissements email/SMS non
 * configurés en test) sont réduits au silence pour un output lisible ;
 * console.error reste actif pour ne jamais masquer une vraie erreur.
 * -----------------------------------------------------------------------------
 */
const { connect, clearDatabase, disconnect } = require('./testDb');

beforeAll(async () => {
  await connect();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await disconnect();
  console.log.mockRestore();
  console.warn.mockRestore();
});
