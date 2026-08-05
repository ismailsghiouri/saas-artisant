/**
 * setup/testDb.js
 * -----------------------------------------------------------------------------
 * Connexion Mongoose à l'instance MongoDB en mémoire démarrée une seule fois
 * pour toute la suite (voir globalSetup.js). Chaque fichier de test se
 * connecte/déconnecte ; le serveur mongod lui-même n'est arrêté qu'en fin de
 * suite par globalTeardown.js.
 * -----------------------------------------------------------------------------
 */
const mongoose = require('mongoose');

const connect = async () => {
  await mongoose.connect(process.env.MONGO_MEMORY_SERVER_URI);
};

const clearDatabase = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
};

const disconnect = async () => {
  await mongoose.connection.close();
};

module.exports = { connect, clearDatabase, disconnect };
