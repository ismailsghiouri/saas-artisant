/**
 * server.js
 * -----------------------------------------------------------------------------
 * Point d'entrée de l'API Maalam Expert.
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

require('dns').setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');

const connectDB = require('./config/database');
const { AppError, globalErrorHandler } = require('./utils/errorHandler');

// Routeurs
const authRoutes = require('./routes/auth');
const workerRoutes = require('./routes/worker');
const clientRoutes = require('./routes/client');
const reservationRoutes = require('./routes/reservation');
const reviewRoutes = require('./routes/review');
const blogRoutes = require('./routes/blog');
const diagnosticRoutes = require('./routes/diagnostic');

const PORT = process.env.PORT || 5000;

const app = express();

// -----------------------------------------------------------------------------
// Middlewares globaux
// -----------------------------------------------------------------------------

// En-têtes de sécurité HTTP standards (X-Frame-Options, HSTS, no-sniff...).
app.use(helmet());

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

// Neutralise les payloads XSS dans req.body / req.query / req.params — doit
// être monté APRÈS le body parsing, sur lequel il s'appuie.
app.use(xss());

// Limite globale du nombre de requêtes par IP sur l'API, pour atténuer le
// scraping abusif et les abus de quota (ex. brute force, bots).
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 'fail', message: 'Trop de requêtes. Veuillez réessayer plus tard.' },
});
app.use('/api', apiLimiter);

// Limite plus stricte sur les endpoints d'authentification (login/register),
// première ligne de défense contre le brute force de mots de passe.
const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, status: 'fail', message: 'Trop de tentatives. Veuillez réessayer plus tard.' },
});
app.use(
  ['/api/auth/login', '/api/auth/signup/worker', '/api/auth/signup/client'],
  authLimiter
);

// Limite dédiée au diagnostic photo IA : endpoint public (sans authentification)
// qui déclenche un appel facturé/quota-limité côté Gemini à chaque requête.
const diagnosticLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: 'fail',
    message: 'Trop de photos envoyées. Veuillez réessayer dans quelques minutes.',
  },
});
app.use('/api/diagnose', diagnosticLimiter);

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

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/diagnose', diagnosticRoutes);

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
    console.log(`🚀 Maalam Expert API démarrée`);
    console.log(`   Environnement : ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Port          : ${PORT}`);
    console.log(`   URL locale    : http://localhost:${PORT}/api/health`);
    console.log('─────────────────────────────────────────────');
  });
};

// En environnement de test (Jest), les tests d'intégration gèrent eux-mêmes
// leur propre connexion Mongoose (base en mémoire) et invoquent l'app via
// Supertest sans socket HTTP réel : on n'exécute donc ni la connexion DB, ni
// app.listen(), ni les gestionnaires de process ci-dessous, pour permettre un
// require('./server') sans effet de bord ni port déjà utilisé.
if (process.env.NODE_ENV !== 'test') {
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
}

module.exports = app;
