// cypress.config.js — Hobbies App
// Conectado a Cypress Cloud + AI Studio

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  // ── Cypress Cloud ──────────────────────────────────────────
  projectId: 'k6wruz',   // ← reemplazar con el ID de cloud.cypress.io

  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',

    // ── Grabación y evidencia ──────────────────────────────
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',

    // ── Tiempos de espera ──────────────────────────────────
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,

    // ── Viewport por defecto ───────────────────────────────
    viewportWidth: 1280,
    viewportHeight: 720,

    // ── Reintentos en CI ───────────────────────────────────
    retries: {
      runMode: 1,    // 1 reintento automático en Jenkins
      openMode: 0
    },

    // ── Variables de entorno ───────────────────────────────
    env: {
      apiUrl: 'http://localhost:3000',
      testUserEmail: 'cypress@hobbiesapp.com',
      testUserPassword: 'CypressTest123!'
    },

    // ── Cypress AI Studio (experimental) ──────────────────
    experimentalStudio: true,        // Permite grabar pasos con AI Studio

    setupNodeEvents(on, config) {
      // Aquí se pueden agregar plugins de Cypress si se necesitan
      return config;
    }
  }
});


