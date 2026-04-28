/**
 * PRUEBAS DE CAJA BLANCA — Autenticación
 *
 * Técnica: Cobertura de ramas (Branch Coverage)
 * Cada test cubre una bifurcación if/else específica del código fuente.
 *
 * POST /api/register — Ramas:
 *   CB-REG-01: !username || !password  → 400 "Faltan datos"
 *   CB-REG-02: !password solo          → 400 "Faltan datos"
 *   CB-REG-03: ambos vacíos ""         → 400 "Faltan datos"
 *   CB-REG-04: existingUser !== null   → 400 "Usuario ya existe"
 *   CB-REG-05: flujo exitoso           → 201
 *   CB-REG-06: password guardado hasheado (nunca plano)
 *   CB-REG-07: email auto-generado como username@temp.com
 *
 * POST /api/login — Ramas:
 *   CB-LOG-01: user === null           → 400 "Usuario no encontrado"
 *   CB-LOG-02: match === false         → 400 "Contraseña incorrecta"
 *   CB-LOG-03: flujo exitoso           → 200 + token JWT
 *   CB-LOG-04: JWT contiene userId correcto
 *
 * POST /api/logout:
 *   CB-OUT-01: sesión destruida        → 200
 */

jest.mock('../models/User');
jest.mock('../models/Post');
jest.mock('../models/Event');
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue(true),
    connection: { collections: {} }
  };
});

const request  = require('supertest');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const  app   = require('../app');
const User     = require('../models/User');

const JWT_SECRET = 'tu_secreto_jwt';

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// REGISTRO
// ─────────────────────────────────────────────
describe('POST /api/register — Cobertura de ramas', () => {

  test('CB-REG-01: Falta username → 400 "Faltan datos"', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ password: 'pass123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Faltan datos');
  });

  test('CB-REG-02: Falta password → 400 "Faltan datos"', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: 'andres' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Faltan datos');
  });

  test('CB-REG-03: username y password vacíos → 400 "Faltan datos"', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ username: '', password: '' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Faltan datos');
  });

  test('CB-REG-04: Usuario duplicado → 400 "Usuario ya existe"', async () => {
    User.findOne.mockResolvedValue({ username: 'andres' }); // existingUser !== null

    const res = await request(app)
      .post('/api/register')
      .send({ username: 'andres', password: 'pass123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Usuario ya existe');
  });

  test('CB-REG-05: Registro exitoso → 201 con datos del usuario', async () => {
    User.findOne.mockResolvedValue(null);                   // no hay duplicado
    const fakeUser = {
      _id: 'uid001',
      username: 'nuevoUser',
      save: jest.fn().mockResolvedValue(true)
    };
    User.mockImplementation(() => fakeUser);

    const res = await request(app)
      .post('/api/register')
      .send({ username: 'nuevoUser', password: 'password1' });

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Usuario registrado exitosamente');
    expect(res.body.user.username).toBe('nuevoUser');
  });

  test('CB-REG-06: La contraseña se hashea antes de guardar', async () => {
    User.findOne.mockResolvedValue(null);
    let capturedPassword = null;
    User.mockImplementation((data) => {
      capturedPassword = data.password;
      return {
        _id: 'uid002',
        username: data.username,
        save: jest.fn().mockResolvedValue(true)
      };
    });

    await request(app)
      .post('/api/register')
      .send({ username: 'hashTest', password: 'miClave' });

    expect(capturedPassword).not.toBe('miClave');
    const valido = await bcrypt.compare('miClave', capturedPassword);
    expect(valido).toBe(true);
  });

  test('CB-REG-07: Email se genera como username@temp.com', async () => {
    User.findOne.mockResolvedValue(null);
    let capturedEmail = null;
    User.mockImplementation((data) => {
      capturedEmail = data.email;
      return {
        _id: 'uid003',
        username: data.username,
        save: jest.fn().mockResolvedValue(true)
      };
    });

    await request(app)
      .post('/api/register')
      .send({ username: 'emailTest', password: 'clave' });

    expect(capturedEmail).toBe('emailTest@temp.com');
  });
});

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
describe('POST /api/login — Cobertura de ramas', () => {

  test('CB-LOG-01: Usuario inexistente → 400 "Usuario no encontrado"', async () => {
    User.findOne.mockResolvedValue(null);                   // rama: !user

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'noExiste', password: 'x' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Usuario no encontrado');
  });

  test('CB-LOG-02: Contraseña incorrecta → 400 "Contraseña incorrecta"', async () => {
    User.findOne.mockResolvedValue({
      _id: 'uid010',
      username: 'user1',
      comparePassword: jest.fn().mockResolvedValue(false)   // rama: !match
    });

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'user1', password: 'claveMAL' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Contraseña incorrecta');
  });

  test('CB-LOG-03: Login exitoso → 200 con token JWT válido', async () => {
    User.findOne.mockResolvedValue({
      _id: 'uid011',
      username: 'user1',
      comparePassword: jest.fn().mockResolvedValue(true)    // rama: match
    });

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'user1', password: 'clave123' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Login exitoso');
    expect(res.body).toHaveProperty('token');

    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded).toHaveProperty('userId');
  });

  test('CB-LOG-04: Token JWT contiene el userId del usuario', async () => {
    User.findOne.mockResolvedValue({
      _id: 'uid012',
      username: 'user2',
      comparePassword: jest.fn().mockResolvedValue(true)
    });

    const res = await request(app)
      .post('/api/login')
      .send({ username: 'user2', password: 'clave' });

    const decoded = jwt.verify(res.body.token, JWT_SECRET);
    expect(decoded.userId).toBe('uid012');
  });
});

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────
describe('POST /api/logout', () => {
  test('CB-OUT-01: Logout destruye sesión → 200 con mensaje', async () => {
    const res = await request(app).post('/api/logout');
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Logout exitoso');
  });
});
