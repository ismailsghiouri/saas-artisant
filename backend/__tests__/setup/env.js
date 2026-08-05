/**
 * setup/env.js
 * -----------------------------------------------------------------------------
 * Variables d'environnement nécessaires AVANT que server.js / middleware/auth.js
 * ne soient importés par les fichiers de test (setupFiles s'exécute avant
 * setupFilesAfterEnv et avant chaque fichier de test).
 * -----------------------------------------------------------------------------
 */
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'jest-test-secret-do-not-use-in-prod';
process.env.JWT_EXPIRES_IN = '1h';
// Coût de hachage réduit pour accélérer la création des utilisateurs de test
// (12 rounds, la valeur par défaut en prod, ralentirait inutilement la suite).
process.env.BCRYPT_SALT_ROUNDS = '4';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.ADMIN_API_KEY = 'jest-test-admin-key';
// Rate limiting désactivé en pratique pour les tests : plusieurs suites
// appellent /login et /register à répétition sur la même instance d'app
// (donc la même IP simulée par Supertest) et dépasseraient sinon la limite
// stricte prévue pour la protection anti-brute-force en production.
process.env.RATE_LIMIT_MAX_REQUESTS = '100000';
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '100000';
