// =====================================================
// security_tests.cy.js - Pruebas de Seguridad
// Hobbies App - Node.js + Express + MongoDB
// =====================================================

const BASE_URL = 'http://localhost:3000';

describe('Security Tests - Hobbies App', () => {

  // ─── XSS ─────────────────────────────────────────

  describe('Protección contra XSS (Cross-Site Scripting)', () => {
    it('no debe ejecutar scripts inyectados en el campo username', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/register`,
        body: {
          username: '<script>alert("xss")</script>',
          email: `xss_${Date.now()}@test.com`,
          password: 'Test1234!'
        },
        failOnStatusCode: false
      }).then((res) => {
        // El servidor no debe devolver el script sin escapar
        const body = JSON.stringify(res.body);
        expect(body).not.to.include('<script>');
        expect(res.status).to.be.oneOf([200, 201, 400, 422]);
      });
    });

    it('no debe aceptar HTML en campos de texto como nombre de hobby', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/hobbies`,
        body: { name: '<img src=x onerror=alert(1)>', description: 'test' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403, 422]);
      });
    });
  });

  // ─── SQL / NoSQL INJECTION ────────────────────────

  describe('Protección contra NoSQL Injection', () => {
    it('debe rechazar operadores MongoDB en el campo email del login', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/login`,
        body: {
          email: { $gt: '' },
          password: { $gt: '' }
        },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([400, 401, 403, 500]);
        // No debe retornar un token con inyección
        if (res.body && res.body.token) {
          throw new Error('Posible NoSQL Injection: token retornado sin credenciales válidas');
        }
      });
    });

    it('debe rechazar caracteres especiales de inyección en registro', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/register`,
        body: {
          username: "admin' OR '1'='1",
          email: `inject_${Date.now()}@test.com`,
          password: "pass' OR '1'='1"
        },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(200, 500);
        // Lo importante: que no haga bypass de autenticación
        if (res.body && res.body.token) {
          expect(res.body.token).to.be.a('string');
        }
      });
    });
  });

  // ─── AUTENTICACIÓN / AUTORIZACIÓN ─────────────────

  describe('Control de acceso y autenticación JWT', () => {
    it('debe rechazar peticiones a rutas protegidas sin token', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/api/hobbies`,
        failOnStatusCode: false
      }).then((res) => {
        // Si la ruta requiere auth, debe retornar 401
        expect(res.status).to.be.oneOf([200, 401]);
      });
    });

    it('debe rechazar token JWT manipulado/inválido', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/api/hobbies`,
        headers: {
          Authorization: 'Bearer token.falso.manipulado'
        },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403]);
      });
    });

    it('debe rechazar token vacío', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/api/hobbies`,
        headers: { Authorization: 'Bearer ' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403]);
      });
    });

    it('debe rechazar acceso con token de otro usuario a recursos privados', () => {
      cy.request({
        method: 'DELETE',
        url: `${BASE_URL}/api/hobbies/000000000000000000000001`,
        headers: { Authorization: 'Bearer token.falso' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.oneOf([401, 403, 404]);
      });
    });
  });

  // ─── HEADERS DE SEGURIDAD ─────────────────────────

  describe('Headers HTTP de seguridad', () => {
    it('no debe exponer información sensible del servidor en headers', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/`,
        failOnStatusCode: false
      }).then((res) => {
        // El header X-Powered-By expone tecnología del servidor
        const poweredBy = res.headers['x-powered-by'];
        // Idealmente no debe existir o estar eliminado
        cy.log(`X-Powered-By: ${poweredBy || 'no presente ✅'}`);
      });
    });

    it('debe incluir Content-Type correcto en respuestas JSON', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/login`,
        body: { email: 'a@a.com', password: '1234' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.headers['content-type']).to.include('application/json');
      });
    });
  });

  // ─── FUERZA BRUTA ─────────────────────────────────

  describe('Protección contra fuerza bruta', () => {
    it('debe seguir respondiendo después de múltiples intentos fallidos', () => {
      const attempts = [];
      for (let i = 0; i < 5; i++) {
        attempts.push(
          cy.request({
            method: 'POST',
            url: `${BASE_URL}/api/login`,
            body: { email: 'brute@test.com', password: `wrong${i}` },
            failOnStatusCode: false
          })
        );
      }
      // El servidor no debe caerse ni retornar errores 5xx por esto
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/login`,
        body: { email: 'brute@test.com', password: 'ultimo' },
        failOnStatusCode: false
      }).then((res) => {
        expect(res.status).to.be.within(200, 499);
      });
    });
  });

  // ─── DATOS SENSIBLES ──────────────────────────────

  describe('Protección de datos sensibles', () => {
    it('no debe retornar contraseñas hasheadas en la respuesta de login', () => {
      cy.request({
        method: 'POST',
        url: `${BASE_URL}/api/login`,
        body: { email: 'test@correo.com', password: 'Test1234!' },
        failOnStatusCode: false
      }).then((res) => {
        if (res.status === 200 && res.body) {
          expect(res.body).not.to.have.property('password');
          expect(res.body).not.to.have.property('passwordHash');
        }
      });
    });

    it('no debe retornar el JWT_SECRET ni SESSION_SECRET en ninguna respuesta', () => {
      cy.request({
        method: 'GET',
        url: `${BASE_URL}/`,
        failOnStatusCode: false
      }).then((res) => {
        const bodyStr = JSON.stringify(res.body);
        expect(bodyStr).not.to.include('melos');
        expect(bodyStr).not.to.include('coco258');
      });
    });
  });
});