const request = require('supertest');
const app = require('../app');

describe('Pruebas de Regresión', () => {
  test('Login sigue funcionando', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'testUser', password: '123456' });
    expect([200, 400]).toContain(res.statusCode);
  });

  test('Registro sigue funcionando', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'nuevoUser123', password: '123456' });
    expect(res.statusCode).toBe(201);
  });

  test('Crear hobby sigue funcionando', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ caption: 'Leer' });
    expect([200, 401]).toContain(res.statusCode);
  });
});