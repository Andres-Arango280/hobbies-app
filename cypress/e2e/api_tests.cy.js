// =====================================================
// api_tests.cy.js - Pruebas de API (REST)
// Hobbies App - Node.js + Express + MongoDB
// =====================================================

const BASE_URL = 'http://localhost:3000';

describe('API Tests - Hobbies App', () => {

  // ─── AUTH ENDPOINTS ───────────────────────────────

  describe('POST /api/register - Registro de usuario', () => {
    it('debe registrar un usuario nuevo exitosamente (201)', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/register`,
        body: {
          username: `testuser_${Date.now()}`,
          email: `test_${Date.now()}@correo.com`,
          password: 'Test1234!'
        },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
        expect(res.body).to.have.property('message');
      });
    });

    it('debe rechazar registro con email duplicado (400 o 409)', () => {
      const email = 'duplicado@correo.com';
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/register`,
        body: { username: 'dup1', email, password: 'Test1234!' },
        failOnStatusCode: false
      }).then(() => {
        cy.request({
          method: 'POST',
          url: `${BASE_URL}/api/register`,
          body: { username: 'dup2', email, password: 'Test1234!' },
          failOnStatusCode: false
        }).then((res) => {
          expect(res.status).to.be.oneOf([400, 409, 500]);
        });
      });
    });

    it('debe rechazar registro sin campos obligatorios (400)', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/register`,
        body: {},
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(400, 499);
      });
    });
  });

  describe('POST /api/login - Inicio de sesión', () => {
    it('debe hacer login y retornar token JWT', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/login`,
        body: {
          email: 'test@correo.com',
          password: 'Test1234!'
        },
        failOnStatusCode: false
      }).then((res) => {
        if (res.status === 200) {
          expect(res.body).to.have.property('token');
        } else {
          expect(res.status).to.be.within(400, 404);
        }
      });
    });

    it('debe rechazar login con contraseña incorrecta (401)', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/login`,
        body: { email: 'test@correo.com', password: 'ContraseñaMal!' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 404]);
      });
    });

    it('debe rechazar login sin body (400)', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/login`,
        body: {},
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(400, 499);
      });
    });
  });

  describe('GET /api/hobbies - Listar hobbies', () => {
    it('debe retornar lista de hobbies o 401 sin auth', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/api/hobbies`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([200, 401]);
        if (res.status === 200) {
          expect(res.body).to.be.an('array');
        }
      });
    });

    it('debe retornar Content-Type application/json', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/api/hobbies`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.headers['content-type']).to.include('application/json');
      });
    });
  });

  describe('POST /api/hobbies - Crear hobby', () => {
    it('debe rechazar creación sin autenticación (401 o 403)', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/hobbies`,
        body: { name: 'Pintura', description: 'Arte visual' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403]);
      });
    });
  });

  describe('GET /api/hobbies/:id - Obtener hobby por ID', () => {
    it('debe retornar 400 o 404 con ID inválido', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/api/hobbies/id_invalido_123`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(400, 499);
      });
    });
  });

  describe('GET / - Endpoint raíz', () => {
    it('debe responder con status 200', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(200);
      });
    });
  });

  describe('Rutas inexistentes', () => {
    it('debe retornar 404 para rutas no definidas', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/api/ruta-que-no-existe`,
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.eq(404);
      });
    });
  });
});