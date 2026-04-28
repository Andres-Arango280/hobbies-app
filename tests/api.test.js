const request = require('supertest');
const app = require('../app');

describe('API Hobbies', () => {

  test('GET /api/hobbies - debería retornar lista', async () => {
    const res = await request(app).get('/api/hobbies');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeInstanceOf(Array);
  });

  test('POST /api/hobbies - crear hobby', async () => {
    const res = await request(app)
      .post('/api/hobbies')
      .send({
        name: 'Fútbol',
        description: 'Deporte en equipo'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe('Fútbol');
  });

  test('PUT /api/hobbies/:id - actualizar hobby', async () => {
    const res = await request(app)
      .put('/api/hobbies/1')
      .send({
        name: 'Fútbol actualizado'
      });

    expect(res.statusCode).toBe(200);
  });

  test('DELETE /api/hobbies/:id - eliminar hobby', async () => {
    const res = await request(app)
      .delete('/api/hobbies/1');

    expect(res.statusCode).toBe(200);
  });

});
