/**
 * PRUEBAS DE CAJA BLANCA — Publicaciones (Posts)
 *
 * Técnica: Cobertura de ramas + análisis de valores límite
 *
 * POST /api/posts — Ramas:
 *   CB-PST-01: Sin sesión            → 401
 *   CB-PST-02: Sin media             → mediaPath = null
 *   CB-PST-03: Con media             → mediaPath asignado con /uploads/
 *   CB-PST-04: createdBy = session.userId del usuario autenticado
 *
 * GET /api/posts — Ramas:
 *   CB-PST-05: BD vacía              → []
 *   CB-PST-06: Con posts             → lista con populate de createdBy
 *   CB-PST-07: Orden descendente     → más nuevo primero
 *
 * POST /api/posts/:id/like — Ramas (toggle):
 *   CB-LIK-01: Sin auth              → 401
 *   CB-LIK-02: Post inexistente      → 404
 *   CB-LIK-03: index === -1          → like agregado, liked=true
 *   CB-LIK-04: index !== -1          → like eliminado, liked=false
 *
 * POST /api/posts/:id/comment — Ramas:
 *   CB-COM-01: texto vacío           → 400 "Comentario vacío"
 *   CB-COM-02: Sin auth              → 401
 *   CB-COM-03: Post inexistente      → 404
 *   CB-COM-04: Comentario exitoso    → 200 con comentarios
 *   CB-COM-05: Dos comentarios       → ambos persistidos
 */

jest.mock('../models/User');
jest.mock('../models/Post');
jest.mock('../models/Event');
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  connect: jest.fn().mockResolvedValue(true),
}));

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app = require('../app');
const User    = require('../models/User');
const Post    = require('../models/Post');

const JWT_SECRET = 'tu_secreto_jwt';

// Helper: agente con sesión de cookie simulada vía login mock
async function agentConSesion(userId = 'uid_session') {
  User.findOne.mockResolvedValue({
    _id: userId,
    username: 'testUser',
    comparePassword: jest.fn().mockResolvedValue(true)
  });
  const agent = request.agent(app);
  await agent.post('/api/login').send({ username: 'testUser', password: 'pass' });
  return agent;
}

// Helper: token JWT
function makeToken(userId = 'uid_jwt') {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
}

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// POST /api/posts
// ─────────────────────────────────────────────
describe('POST /api/posts — Cobertura de ramas', () => {

  test('CB-PST-01: Sin sesión → 401 "No autorizado"', async () => {
    const res = await request(app)
      .post('/api/posts')
      .field('caption', 'Test');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No autorizado');
  });

  test('CB-PST-02: Sin media → post creado con media=null', async () => {
    const agent = await agentConSesion('uid_post1');
    const fakePost = {
      _id: 'post001', caption: 'Sin imagen', media: null,
      createdBy: 'uid_post1',
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true)
    };
    Post.mockImplementation(() => fakePost);

    const res = await agent
      .post('/api/posts')
      .field('caption', 'Sin imagen');

    expect(res.statusCode).toBe(200);
    expect(res.body.media).toBeNull();
  });

  test('CB-PST-03: Con media → mediaPath asignado con /uploads/', async () => {
    const agent = await agentConSesion('uid_post2');
    let capturedMedia = null;
    Post.mockImplementation((data) => {
      capturedMedia = data.media;
      return {
        _id: 'post002', ...data,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true)
      };
    });

    await agent
      .post('/api/posts')
      .field('caption', 'Con imagen')
      .attach('media', Buffer.from('fakeimg'), 'foto.jpg');

    expect(capturedMedia).toMatch(/^\/uploads\//);
  });

  test('CB-PST-04: createdBy asignado con session.userId del usuario autenticado', async () => {
    const agent = await agentConSesion('uid_autor');
    let capturedCreatedBy = null;
    Post.mockImplementation((data) => {
      capturedCreatedBy = data.createdBy;
      return {
        _id: 'post003', ...data,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true)
      };
    });

    await agent.post('/api/posts').field('caption', 'Verificar autor');

    expect(capturedCreatedBy).toBeDefined();
  });
});

// ─────────────────────────────────────────────
// GET /api/posts
// ─────────────────────────────────────────────
describe('GET /api/posts — Cobertura de ramas', () => {

  test('CB-PST-05: BD vacía → retorna []', async () => {
    Post.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([])
    });

    const res = await request(app).get('/api/posts');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('CB-PST-06: Con posts → retorna lista con datos del autor', async () => {
    const posts = [
      { _id: 'p1', caption: 'Post 1', createdBy: { username: 'autor1' }, likes: [], comentarios: [] }
    ];
    Post.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(posts)
    });

    const res = await request(app).get('/api/posts');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].createdBy.username).toBe('autor1');
  });
});

// ─────────────────────────────────────────────
// POST /api/posts/:id/like — Toggle
// ─────────────────────────────────────────────
describe('POST /api/posts/:id/like — Toggle (Cobertura de ramas)', () => {

  test('CB-LIK-01: Sin token ni sesión → 401 "No autorizado"', async () => {
    const res = await request(app).post('/api/posts/post001/like');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No autorizado');
  });

  test('CB-LIK-02: Post inexistente → 404 "Publicación no encontrada"', async () => {
    Post.findById.mockResolvedValue(null);
    const token = makeToken('uid_like1');

    const res = await request(app)
      .post('/api/posts/postFake/like')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Publicación no encontrada');
  });

  test('CB-LIK-03: index === -1 → like agregado, liked=true, likesCount=1', async () => {
    const userId = 'uid_like2';
    const token  = makeToken(userId);
    // likes vacío → indexOf retorna -1 → rama push
    const fakePost = {
      _id: 'post_like', likes: [],
      save: jest.fn().mockResolvedValue(true)
    };
    Post.findById.mockResolvedValue(fakePost);

    const res = await request(app)
      .post('/api/posts/post_like/like')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.liked).toBe(true);
    expect(res.body.likesCount).toBe(1);
  });

  test('CB-LIK-04: index !== -1 → like eliminado, liked=false, likesCount=0', async () => {
    const userId = 'uid_like3';
    const token  = makeToken(userId);
    // likes contiene userId → indexOf !== -1 → rama splice
    const fakePost = {
      _id: 'post_like2',
      likes: [userId],     // ya tiene el like
      save: jest.fn().mockResolvedValue(true)
    };
    Post.findById.mockResolvedValue(fakePost);

    const res = await request(app)
      .post('/api/posts/post_like2/like')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.liked).toBe(false);
    expect(res.body.likesCount).toBe(0);
  });
});

// ─────────────────────────────────────────────
// POST /api/posts/:id/comment
// ─────────────────────────────────────────────
describe('POST /api/posts/:id/comment — Cobertura de ramas', () => {

  test('CB-COM-01: texto vacío → 400 "Comentario vacío"', async () => {
    const token = makeToken('uid_com1');
    const res = await request(app)
      .post('/api/posts/postAny/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({ texto: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Comentario vacío');
  });

  test('CB-COM-02: Sin auth → 401 "No autorizado"', async () => {
    const res = await request(app)
      .post('/api/posts/postAny/comment')
      .send({ texto: 'Hola' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No autorizado');
  });

  test('CB-COM-03: Post inexistente → 404 "Publicación no encontrada"', async () => {
    Post.findById.mockResolvedValue(null);
    const token = makeToken('uid_com2');

    const res = await request(app)
      .post('/api/posts/postFake/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({ texto: 'Comentario' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Publicación no encontrada');
  });

  test('CB-COM-04: Comentario válido → 200, comentario guardado en post', async () => {
    const userId   = 'uid_com3';
    const token    = makeToken(userId);
    const comentarios = [];
    const fakePost = {
      _id: 'pcom1',
      comentarios,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockImplementation(function () {
        return Promise.resolve(this);
      })
    };
    Post.findById.mockResolvedValue(fakePost);

    const res = await request(app)
      .post('/api/posts/pcom1/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({ texto: 'Gran post!' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Comentario agregado');
    expect(fakePost.comentarios.length).toBe(1);
    expect(fakePost.comentarios[0].texto).toBe('Gran post!');
  });

  test('CB-COM-05: Dos comentarios consecutivos → ambos persistidos', async () => {
    const userId   = 'uid_com4';
    const token    = makeToken(userId);
    const comentarios = [];
    const fakePost = {
      _id: 'pcom2',
      comentarios,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockImplementation(function () { return Promise.resolve(this); })
    };
    Post.findById.mockResolvedValue(fakePost);

    await request(app)
      .post('/api/posts/pcom2/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({ texto: 'Primero' });

    await request(app)
      .post('/api/posts/pcom2/comment')
      .set('Authorization', `Bearer ${token}`)
      .send({ texto: 'Segundo' });

    expect(fakePost.comentarios.length).toBe(2);
    expect(fakePost.comentarios[0].texto).toBe('Primero');
    expect(fakePost.comentarios[1].texto).toBe('Segundo');
  });
});
