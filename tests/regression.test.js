const request = require('supertest');
const app = require('../app');

describe('Pruebas de Regresión', () => {

  test('Login sigue funcionando', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        email: 'test@test.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(200);
  });

  test('Registro sigue funcionando', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        email: 'nuevo@test.com',
        password: '123456'
      });

    expect(res.statusCode).toBe(201);
  });

  test('Crear hobby sigue funcionando', async () => {
    const res = await request(app)
      .post('/api/hobbies')
      .send({
        name: 'Leer',
        description: 'Lectura diaria'
      });

    expect(res.statusCode).toBe(201);
  });

});
