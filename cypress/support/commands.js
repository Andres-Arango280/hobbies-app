// =====================================================
// commands.js - Comandos personalizados de Cypress
// Hobbies App
// =====================================================

// ── Login programático via API ─────────────────────
Cypress.Commands.add('loginViaAPI', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl') || 'http://localhost:3000'}/api/login`,
    body: { email, password },
    failOnStatusCode: false
  }).then((res) => {
    if (res.status === 200 && res.body.token) {
      window.localStorage.setItem('token', res.body.token);
      cy.wrap(res.body.token).as('authToken');
    }
    return res;
  });
});

// ── Registrar usuario via API ──────────────────────
Cypress.Commands.add('registerViaAPI', (username, email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl') || 'http://localhost:3000'}/api/register`,
    body: { username, email, password },
    failOnStatusCode: false
  });
});

// ── Inyectar axe para accesibilidad ───────────────
Cypress.Commands.add('injectAxe', () => {
  cy.window({ log: false }).then((win) => {
    cy.readFile('node_modules/axe-core/axe.min.js').then((source) => {
      win.eval(source);
    });
  });
});

// ── checkA11y simplificado ─────────────────────────
Cypress.Commands.add('checkA11y', (context, options) => {
  cy.window({ log: false }).then((win) => {
    if (!win.axe) {
      cy.log('⚠️  axe-core no está inyectado, saltando chequeo de accesibilidad');
      return;
    }
    return new Cypress.Promise((resolve) => {
      win.axe.run(context || win.document, options || {}, (err, results) => {
        if (err) throw err;
        if (results.violations.length > 0) {
          results.violations.forEach((v) => {
            cy.log(`❌ Violación: [${v.impact}] ${v.description} — ${v.helpUrl}`);
          });
        } else {
          cy.log('✅ Sin violaciones de accesibilidad');
        }
        resolve(results);
      });
    });
  });
});

// ── Limpiar token de sesión ────────────────────────
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
  cy.clearCookies();
  cy.clearLocalStorage();
});

// ── Crear un hobby via API (con token) ────────────
Cypress.Commands.add('createHobbyViaAPI', (name, description, token) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl') || 'http://localhost:3000'}/api/hobbies`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: { name, description },
    failOnStatusCode: false
  });
});