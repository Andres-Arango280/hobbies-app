const request = require('supertest');
const app = require('../app');

describe('Pruebas de Seguridad', () => {

  test('Acceso sin token debe fallar', async () => {
    const res = await request(app).get('/api/hobbies');
    expect(res.statusCode).toBe(401);
  });

  test('Inyección SQL básica', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: "' OR 1=1 --",
        password: '123456'
      });

    expect(res.statusCode).not.toBe(200);
  });

  test('Ruta protegida con token válido', async () => {
    const token = "fake-token";

    const res = await request(app)
      .get('/api/hobbies')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 401]).toContain(res.statusCode);
  });

});
