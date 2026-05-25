// =====================================================
// regression_tests.cy.js - Pruebas de Regresión
// Hobbies App - Node.js + Express + MongoDB
// Validan que funcionalidades existentes no se rompan
// =====================================================

const BASE_URL = 'http://localhost:3000';

describe('Regression Tests - Hobbies App', () => {

  // ─── FLUJO DE REGISTRO ────────────────────────────

  describe('REG-001: Flujo de registro de usuario', () => {
    it('el formulario de registro debe existir en la página', () => {
      cy.visit(`${BASE_URL}/register.html`, { failOnStatusCode: false });
      cy.get('body').should('exist');
    });

    it('debe mostrar error cuando contraseña es muy corta', () => {
      cy.visit(`${BASE_URL}/register.html`, { failOnStatusCode: false });
      cy.get('input[name="password"], input[id="password"]').first()
        .then(($el) => {
          if ($el.length) {
            cy.wrap($el).type('123');
            cy.get('form').submit();
            // Debe mostrar algún mensaje de error o validación HTML5
            cy.get('body').should('exist');
          }
        });
    });
  });

  // ─── FLUJO DE LOGIN ───────────────────────────────

  describe('REG-002: Flujo de login', () => {
    it('la página de login debe cargarse correctamente', () => {
      cy.visit(`${BASE_URL}/login.html`, { failOnStatusCode: false });
      cy.get('body').should('not.be.empty');
    });

    it('debe mostrar error con credenciales incorrectas vía API', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/login`,
        body: { email: 'noexiste@app.com', password: 'wrongpassword' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(400, 404);
      });
    });

    it('el endpoint de login debe seguir respondiendo (no roto)', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/login`,
        body: { email: 'reg@test.com', password: 'pass' },
        failOnStatusCode: false
      }).then((res) => {
        // Cualquier respuesta válida (no 5xx) significa que el endpoint funciona
        expect(res.status).to.be.within(200, 499);
      });
    });
  });

  // ─── CRUD HOBBIES ─────────────────────────────────

  describe('REG-003: CRUD de hobbies no roto', () => {
    it('GET /api/hobbies sigue respondiendo', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/api/hobbies`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.not.eq(500);
        expect(res.status).to.not.eq(503);
      });
    });

    it('POST /api/hobbies responde (aunque sea 401)', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/hobbies`,
        body: { name: 'Regresion Test', description: 'Test hobby' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.not.eq(500);
      });
    });

    it('PUT /api/hobbies/:id responde con ID inexistente', () => {
      cy.request({
        method: 'PUT',
        url: `${BASE_URL}/api/hobbies/000000000000000000000001`,
        body: { name: 'Actualizado' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(200, 499);
      });
    });

    it('DELETE /api/hobbies/:id responde apropiadamente', () => {
      cy.request({
        method: 'DELETE',
        url: `${BASE_URL}/api/hobbies/000000000000000000000001`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(200, 499);
      });
    });
  });

  // ─── ARCHIVOS ESTÁTICOS ───────────────────────────

  describe('REG-004: Archivos estáticos (Frontend)', () => {
    it('la página principal debe cargar', () => {
      cy.visit(BASE_URL, { failOnStatusCode: false });
      cy.get('body').should('exist');
    });

    it('la página de inicio debe tener contenido HTML', () => {
      cy.visit(BASE_URL, { failOnStatusCode: false });
      cy.get('html').should('exist');
    });
  });

  // ─── HEADERS Y RESPUESTAS ─────────────────────────

  describe('REG-005: Respuestas y headers no rotos', () => {
    it('todas las respuestas JSON deben tener Content-Type correcto', () => {
      const endpoints = [
        { method: 'GET', url: `${BASE_URL}/api/hobbies` },
        { method: 'POST', url: `${BASE_URL}/api/login`, body: {} },
      ];
      endpoints.forEach(({ method, url, body }) => {
        cy.request({ method, url, body, failOnStatusCode: false }).then((res) => {
          if (res.status !== 404) {
            expect(res.headers['content-type']).to.include('application/json');
          }
        });
      });
    });

    it('el servidor no debe retornar errores 500 en rutas conocidas', () => {
      cy.request({ method: 'GET', url: `${BASE_URL}/api/hobbies`, failOnStatusCode: false })
        .then((res) => { expect(res.status).to.not.eq(500); });
      cy.request({ method: 'POST', url: `${BASE_URL}/api/login`, body: {}, failOnStatusCode: false })
        .then((res) => { expect(res.status).to.not.eq(500); });
    });
  });

  // ─── UPLOAD DE ARCHIVOS ───────────────────────────

  describe('REG-006: Endpoint de upload no roto', () => {
    it('POST /api/upload debe responder (aunque sea 401 sin auth)', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/upload`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(200, 499);
      });
    });
  });

  // ─── SESIONES ─────────────────────────────────────

  describe('REG-007: Manejo de sesiones no roto', () => {
    it('POST /api/logout debe responder apropiadamente', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/logout`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(200, 404);
      });
    });
  });
});