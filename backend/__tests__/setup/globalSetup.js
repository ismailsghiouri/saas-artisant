/**
 * setup/globalSetup.js
 * -----------------------------------------------------------------------------
 * Démarre UNE seule instance MongoDB en mémoire pour toute la suite de tests
 * (au lieu d'une instance par fichier de test) : plus rapide, et évite les
 * dépassements du délai de démarrage par défaut (10s) quand plusieurs
 * instances mongod sont lancées coup sur coup.
 *
 * L'URI est transmise aux fichiers de test via une variable d'environnement :
 * Jest exécute globalSetup dans le process principal avant de forker les
 * workers, qui héritent donc de process.env à ce moment-là.
 * -----------------------------------------------------------------------------
 */
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function globalSetup() {
  const instance = await MongoMemoryServer.create({
    instance: { launchTimeout: 60000 },
  });

  global.__MAALEM_MONGO_INSTANCE__ = instance;
  process.env.MONGO_MEMORY_SERVER_URI = instance.getUri('maalam-expert-test');
};
