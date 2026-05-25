// =====================================================
// e2e.js - Setup global de Cypress
// =====================================================

import './commands';

// Suprimir errores no capturados del frontend de prueba
Cypress.on('uncaught:exception', (err) => {
  // Evitar que errores del app rompan las pruebas de Cypress
  console.warn('Uncaught exception:', err.message);
  return false;
});

// Log de cada prueba que inicia
beforeEach(() => {
  cy.log(`🧪 Iniciando: ${Cypress.currentTest.title}`);
});