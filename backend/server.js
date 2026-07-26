/**
 * server.js
 * -----------------------------------------------------------------------------
 * Point d'entrée de l'API FixNow.
 *
 * Responsabilités :
 *   1. Charger les variables d'environnement (.env).
 *   2. Se connecter à MongoDB avant d'accepter la moindre requête.
 *   3. Configurer les middlewares globaux (CORS, parsing JSON, logs).
 *   4. Monter les routeurs par domaine métier sous /api/*.
 *   5. Gérer les routes inconnues (404) et les erreurs (middleware global).
 *   6. Démarrer le serveur HTTP et gérer l'arrêt propre (SIGINT/SIGTERM).
 * -----------------------------------------------------------------------------
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const connectDB = require('./config/database');
const { AppError, globalErrorHandler } = require('./utils/errorHandler');

// Routeurs
const artisanRoutes = require('./routes/artisan');
const clientRoutes = require('./routes/client');
const reservationRoutes = require('./routes/reservation');
const reviewRoutes = require('./routes/review');
const blogRoutes = require('./routes/blog');

const PORT = process.env.PORT || 5000;

const app = express();

// -----------------------------------------------------------------------------
// Middlewares globaux
// -----------------------------------------------------------------------------

// CORS : autorise le(s) frontend(s) déclarés dans CLIENT_URL (séparés par des
// virgules si plusieurs environnements/domaines doivent être autorisés).
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Parsing du corps des requêtes JSON, avec une limite raisonnable pour éviter
// les payloads abusifs (ex. photos encodées en base64 mal utilisées).
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger de requêtes minimaliste (méthode, chemin, statut, durée). Suffisant
// pour le MVP ; à remplacer par un logger structuré (ex. pino) si le volume
// de logs en production le justifie.
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${durationMs}ms`
    );
  });
  next();
});

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

// Vérification de santé (utilisée par les outils de monitoring / load balancer).
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    uptimeSeconds: process.uptime(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/artisans', artisanRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blog', blogRoutes);

// Toute route non reconnue jusqu'ici est une 404 explicite plutôt qu'un
// comportement par défaut d'Express (page HTML générique).
app.all('*', (req, res, next) => {
  next(new AppError(`Route introuvable : ${req.originalUrl}`, 404));
});

// Middleware d'erreur global — DOIT être monté en dernier.
app.use(globalErrorHandler);

// -----------------------------------------------------------------------------
// Démarrage du serveur
// -----------------------------------------------------------------------------

let server;

const startServer = async () => {
  await connectDB();

  server = app.listen(PORT, () => {
    console.log('─────────────────────────────────────────────');
    console.log(`🚀 FixNow API démarrée`);
    console.log(`   Environnement : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Port          : ${PORT}`);
    console.log(`   URL locale    : http://localhost:${PORT}/api/health`);
    console.log('─────────────────────────────────────────────');
  });
};

startServer();

/**
 * Capture les rejets de promesses non gérés (ex. erreur async oubliée) pour
 * arrêter le process proprement plutôt que de laisser l'application dans un
 * état instable et silencieux.
 */
process.on('unhandledRejection', (err) => {
  console.error('💥 REJET DE PROMESSE NON GÉRÉ ! Arrêt du serveur...');
  console.error(err.name, err.message);
  server?.close(() => process.exit(1));
});

/**
 * Arrêt propre sur signal du système d'exploitation ou de l'orchestrateur
 * (ex. Railway/Render lors d'un redéploiement) : on cesse d'accepter de
 * nouvelles connexions, on laisse les requêtes en cours se terminer, puis on
 * ferme la connexion MongoDB avant de quitter le process.
 */
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} reçu. Arrêt propre du serveur en cours...`);
  server?.close(async () => {
    await mongoose.connection.close();
    console.log('✅ Connexions HTTP et MongoDB fermées. Arrêt du process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;
