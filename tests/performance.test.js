const request = require('supertest');
const app = require('../app');

describe('Pruebas de Rendimiento', () => {

  test('Respuesta rápida (<2s)', async () => {
    const start = Date.now();

    const res = await request(app).get('/api/hobbies');

    const end = Date.now();
    const time = end - start;

    expect(res.statusCode).toBe(200);
    expect(time).toBeLessThan(2000);
  });

  test('Múltiples solicitudes', async () => {
    const requests = [];

    for (let i = 0; i < 20; i++) {
      requests.push(request(app).get('/api/hobbies'));
    }

    const responses = await Promise.all(requests);

    responses.forEach(res => {
      expect(res.statusCode).toBe(200);
    });
  });

});
