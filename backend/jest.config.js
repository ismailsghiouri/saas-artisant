/**
 * jest.config.js
 * -----------------------------------------------------------------------------
 * Tests d'intégration (Supertest + MongoDB en mémoire) des routes principales
 * de l'API : artisans, réservations, avis, authentification JWT, validation.
 *
 * Le seuil de couverture porte volontairement sur les modules couverts par
 * ces tests (voir collectCoverageFrom) plutôt que sur tout le dépôt : les
 * contrôleurs blog/ad et les intégrations email/SMS ne font pas partie du
 * périmètre demandé et nécessiteraient des mocks dédiés hors sujet ici.
 * -----------------------------------------------------------------------------
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFiles: ['<rootDir>/__tests__/setup/env.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/jest.setup.js'],
  // Une seule instance MongoDB en mémoire pour toute la suite (voir
  // setup/globalSetup.js) plutôt qu'une par fichier de test.
  globalSetup: '<rootDir>/__tests__/setup/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/setup/globalTeardown.js',
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  collectCoverageFrom: [
    'controllers/workerController.js',
    'controllers/clientController.js',
    'controllers/reservationController.js',
    'controllers/reviewController.js',
    'middleware/auth.js',
    'middleware/validation.js',
    'models/User.js',
    'models/Worker.js',
    'models/Client.js',
    'models/Reservation.js',
    'models/Review.js',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
  testTimeout: 30000,
  verbose: true,
};
