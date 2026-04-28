/**
 * PRUEBAS DE CAJA BLANCA — Middlewares de autenticación
 *
 * Técnica: Cobertura de condiciones (Condition Coverage)
 * Se prueba directamente la lógica interna de cada función middleware.
 *
 * ensureAuth — Ramas:
 *   CB-MID-01: req.session.userId existe     → llama next()
 *   CB-MID-02: req.session.userId no existe  → 401 "No autorizado"
 *
 * authMiddleware — Ramas:
 *   CB-MID-03: Sin header Authorization      → 401 "No hay token"
 *   CB-MID-04: Token malformado              → 401 "Token inválido"
 *   CB-MID-05: Token expirado                → 401 "Token expirado"
 *   CB-MID-06: Token OK pero userId no existe en BD → 401 "Usuario no encontrado"
 *   CB-MID-07: Token OK y usuario existe     → next() con req.user asignado
 *
 * getUserIdFromRequest — Caminos:
 *   CB-GID-01: Header con token válido       → retorna userId del payload
 *   CB-GID-02: Header con token inválido     → retorna null (catch)
 *   CB-GID-03: Sin token, sesión activa      → retorna session.userId
 *   CB-GID-04: Sin token ni sesión           → retorna null
 */

jest.mock('../models/User');
jest.mock('../models/Post');
jest.mock('../models/Event');
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  connect: jest.fn().mockResolvedValue(true),
}));

const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const { ensureAuth, authMiddleware, getUserIdFromRequest } = require('../app');

const JWT_SECRET = 'tu_secreto_jwt';

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────
// ensureAuth
// ─────────────────────────────────────────────
describe('ensureAuth — Cobertura de ramas', () => {

  test('CB-MID-01: session.userId presente → llama next()', () => {
    const req  = { session: { userId: 'abc123' } };
    const res  = {};
    const next = jest.fn();

    ensureAuth(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('CB-MID-02: session.userId ausente → 401 "No autorizado"', () => {
    const req      = { session: {} };
    const jsonMock = jest.fn();
    const res      = { status: jest.fn(() => ({ json: jsonMock })) };
    const next     = jest.fn();

    ensureAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'No autorizado' });
    expect(next).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────
// authMiddleware
// ─────────────────────────────────────────────
describe('authMiddleware — Cobertura de ramas', () => {

  test('CB-MID-03: Sin header Authorization → 401 "No hay token"', async () => {
    const req      = { header: () => undefined };
    const jsonMock = jest.fn();
    const res      = { status: jest.fn(() => ({ json: jsonMock })) };
    const next     = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'No hay token, autorización denegada' });
    expect(next).not.toHaveBeenCalled();
  });

  test('CB-MID-04: Token malformado → 401 "Token inválido"', async () => {
    const req      = { header: () => 'Bearer TOKENROTO' };
    const jsonMock = jest.fn();
    const res      = { status: jest.fn(() => ({ json: jsonMock })) };
    const next     = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Token inválido' });
  });

  test('CB-MID-05: Token expirado → 401 "Token expirado"', async () => {
    const expiredToken = jwt.sign({ userId: 'uid1' }, JWT_SECRET, { expiresIn: '-1s' });
    const req          = { header: () => `Bearer ${expiredToken}` };
    const jsonMock     = jest.fn();
    const res          = { status: jest.fn(() => ({ json: jsonMock })) };
    const next         = jest.fn();

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Token expirado' });
  });

  test('CB-MID-06: Token válido pero userId no existe en BD → 401 "Usuario no encontrado"', async () => {
    const token    = jwt.sign({ userId: 'uid_fantasma' }, JWT_SECRET, { expiresIn: '1h' });
    const req      = { header: () => `Bearer ${token}` };
    const jsonMock = jest.fn();
    const res      = { status: jest.fn(() => ({ json: jsonMock })) };
    const next     = jest.fn();

    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Usuario no encontrado' });
    expect(next).not.toHaveBeenCalled();
  });

  test('CB-MID-07: Token válido y usuario existe → llama next(), req.user asignado sin password', async () => {
    const fakeUser = { _id: 'uid999', username: 'midUser' }; // sin password (select -password)
    const token    = jwt.sign({ userId: 'uid999' }, JWT_SECRET, { expiresIn: '1h' });
    const req      = { header: () => `Bearer ${token}` };
    const res      = {};
    const next     = jest.fn();

    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });

    await authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(fakeUser);
    expect(req.user.password).toBeUndefined();
  });
});

// ─────────────────────────────────────────────
// getUserIdFromRequest
// ─────────────────────────────────────────────
describe('getUserIdFromRequest — Cobertura de caminos', () => {

  test('CB-GID-01: Header Authorization con token válido → retorna userId', async () => {
    const token = jwt.sign({ userId: 'uid_header' }, JWT_SECRET, { expiresIn: '1h' });
    const req   = { header: (h) => h === 'Authorization' ? `Bearer ${token}` : undefined, session: {} };

    const result = await getUserIdFromRequest(req);
    expect(result).toBe('uid_header');
  });

  test('CB-GID-02: Header con token inválido → retorna null (rama catch)', async () => {
    const req = { header: () => 'Bearer INVALIDO', session: {} };

    const result = await getUserIdFromRequest(req);
    expect(result).toBeNull();
  });

  test('CB-GID-03: Sin token, sesión activa → retorna session.userId', async () => {
    const req = { header: () => undefined, session: { userId: 'session_uid' } };

    const result = await getUserIdFromRequest(req);
    expect(result).toBe('session_uid');
  });

  test('CB-GID-04: Sin token ni sesión → retorna null', async () => {
    const req = { header: () => undefined, session: {} };

    const result = await getUserIdFromRequest(req);
    expect(result).toBeNull();
  });
});
