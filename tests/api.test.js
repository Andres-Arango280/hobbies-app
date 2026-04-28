const request = require('supertest');
const app = require('../app');

describe('API Hobbies', () => {
  test('GET /api/posts - debería retornar lista', async () => {
    const res = await request(app).get('/api/posts');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  test('POST /api/posts - crear post', async () => {
    const res = await request(app)
      .post('/api/posts')
      .send({ caption: 'Mi primer post' });
    expect([200, 401]).toContain(res.statusCode);
  });

  test('PUT /api/posts - ruta no implementada', async () => {
    const res = await request(app)
      .put('/api/posts/1')
      .send({ caption: 'actualizado' });
    expect([200, 404, 401]).toContain(res.statusCode);
  });

  test('DELETE /api/posts - ruta no implementada', async () => {
    const res = await request(app)
      .delete('/api/posts/1');
    expect([200, 404, 401]).toContain(res.statusCode);
  });
});