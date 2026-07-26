/**
 * config/database.js
 * -----------------------------------------------------------------------------
 * Gère la connexion à MongoDB via Mongoose.
 *
 * On centralise ici :
 *  - la logique de connexion (avec options recommandées en production),
 *  - les écouteurs d'événements Mongoose (erreurs, déconnexion),
 *  - un arrêt propre du process si la connexion initiale échoue, pour éviter
 *    de démarrer un serveur HTTP qui répondrait sans base de données valide.
 * -----------------------------------------------------------------------------
 */

const mongoose = require('mongoose');

/**
 * Établit la connexion à MongoDB en utilisant l'URI définie dans les variables
 * d'environnement (voir config/env.example).
 *
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error(
      '❌ Variable d\'environnement MONGODB_URI manquante. Vérifiez votre fichier .env.'
    );
    process.exit(1);
  }

  try {
    // Options par défaut de Mongoose 8+ sont déjà adaptées à la production ;
    // on garde néanmoins un timeout explicite de sélection de serveur pour
    // échouer rapidement si le cluster est injoignable plutôt que de bloquer
    // indéfiniment le démarrage du serveur.
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`✅ MongoDB connecté : ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Échec de connexion à MongoDB : ${error.message}`);
    process.exit(1);
  }

  // Écouteurs d'événements pour surveiller la santé de la connexion après le
  // démarrage initial (utile pour diagnostiquer des coupures réseau en prod).
  mongoose.connection.on('error', (err) => {
    console.error(`❌ Erreur MongoDB (connexion active) : ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB déconnecté. Mongoose tentera de se reconnecter automatiquement.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnecté.');
  });
};

module.exports = connectDB;
