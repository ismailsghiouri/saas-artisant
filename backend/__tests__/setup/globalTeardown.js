/**
 * setup/globalTeardown.js
 * -----------------------------------------------------------------------------
 * Arrête l'instance MongoDB en mémoire démarrée par globalSetup.js, une fois
 * que tous les fichiers de test ont terminé.
 * -----------------------------------------------------------------------------
 */
module.exports = async function globalTeardown() {
  const instance = global.__MAALEM_MONGO_INSTANCE__;
  if (instance) {
    await instance.stop();
  }
};
