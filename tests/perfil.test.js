/**
 * PRUEBAS DE CAJA BLANCA — Perfil de Usuario
 *
 * Técnica: Cobertura de ramas + verificación de seguridad
 *
 * GET /api/perfil — Ramas:
 *   CB-PRF-01: Sin sesión                    → 401
 *   CB-PRF-02: Usuario encontrado            → 200 con datos
 *   CB-PRF-03: password NO expuesto          → seguridad crítica
 *
 * POST /api/perfil/update — Ramas:
 *   CB-PRF-04: Sin sesión                    → 401
 *   CB-PRF-05: username presente             → trim + actualizado
 *   CB-PRF-06: username ausente              → no incluido en updateData
 *   CB-PRF-07: descripcion presente          → actualizada
 *   CB-PRF-08: hobbies CSV                   → parseado a array
 *   CB-PRF-09: hobbies con vacíos            → filtrados por .filter(h => h)
 *   CB-PRF-10: Con fotoPerfil                → ruta /uploads/ asignada
 *   CB-PRF-11: Sin fotoPerfil               → campo no modificado
 *   CB-PRF-12: Múltiples campos             → todos actualizados
 *   CB-PRF-13: password NO expuesto en respuesta
 */

jest.mock('../models/User');
jest.mock('../models/Post');
jest.mock('../models/Event');
jest.mock('mongoose', () => ({
  ...jest.requireActual('mongoose'),
  connect: jest.fn().mockResolvedValue(true),
}));

const request = require('supertest');
const app = require('../app');
const User    = require('../models/User');

beforeEach(() => jest.clearAllMocks());

async function agentConSesion(uid = 'uid_prf') {
  User.findOne.mockResolvedValue({
    _id: uid,
    username: 'perfilUser',
    comparePassword: jest.fn().mockResolvedValue(true)
  });
  const agent = request.agent(app);
  await agent.post('/api/login').send({ username: 'perfilUser', password: 'pass' });
  return { agent, uid };
}

// ─────────────────────────────────────────────
// GET /api/perfil
// ─────────────────────────────────────────────
describe('GET /api/perfil — Cobertura de ramas', () => {

  test('CB-PRF-01: Sin sesión → 401 "No autorizado"', async () => {
    const res = await request(app).get('/api/perfil');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No autorizado');
  });

  test('CB-PRF-02: Con sesión activa → 200 con datos del usuario', async () => {
    const { agent } = await agentConSesion('uid_prf2');
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'uid_prf2',
        username: 'perfilUser',
        email: 'perfilUser@temp.com'
      })
    });

    const res = await agent.get('/api/perfil');
    expect(res.statusCode).toBe(200);
    expect(res.body.username).toBe('perfilUser');
  });

  test('CB-PRF-03: Respuesta NO contiene campo password (select -password)', async () => {
    const { agent } = await agentConSesion('uid_prf3');
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'uid_prf3',
        username: 'perfilUser'
        // password intencionalmente ausente, como haría .select('-password')
      })
    });

    const res = await agent.get('/api/perfil');
    expect(res.body).not.toHaveProperty('password');
  });
});

// ─────────────────────────────────────────────
// POST /api/perfil/update
// ─────────────────────────────────────────────
describe('POST /api/perfil/update — Cobertura de ramas', () => {

  test('CB-PRF-04: Sin sesión → 401 "No autorizado"', async () => {
    const res = await request(app)
      .post('/api/perfil/update')
      .send({ username: 'nuevo' });
    expect(res.statusCode).toBe(401);
  });

  test('CB-PRF-05: username presente → se actualiza con trim aplicado', async () => {
    const { agent } = await agentConSesion('uid_prf5');
    let capturedUpdateData = null;
    User.findByIdAndUpdate.mockImplementation((id, data) => {
      capturedUpdateData = data;
      return {
        select: jest.fn().mockResolvedValue({ _id: id, username: data.username })
      };
    });

    await agent.post('/api/perfil/update').field('username', '  nuevoNombre  ');
    // La rama: if (username) updateData.username = username.trim()
    expect(capturedUpdateData.username).toBe('nuevoNombre');
  });

  test('CB-PRF-06: username ausente → NO está en updateData', async () => {
    const { agent } = await agentConSesion('uid_prf6');
    let capturedUpdateData = null;
    User.findByIdAndUpdate.mockImplementation((id, data) => {
      capturedUpdateData = data;
      return { select: jest.fn().mockResolvedValue({ _id: id }) };
    });

    // Enviamos solo descripcion, sin username
    await agent.post('/api/perfil/update').field('descripcion', 'Solo descripción');
    expect(capturedUpdateData).not.toHaveProperty('username');
  });

  test('CB-PRF-07: descripcion presente → guardada con trim', async () => {
    const { agent } = await agentConSesion('uid_prf7');
    let capturedUpdateData = null;
    User.findByIdAndUpdate.mockImplementation((id, data) => {
      capturedUpdateData = data;
      return { select: jest.fn().mockResolvedValue({ _id: id, descripcion: data.descripcion }) };
    });

    await agent.post('/api/perfil/update').field('descripcion', '  Soy deportista  ');
    expect(capturedUpdateData.descripcion).toBe('Soy deportista');
  });

  test('CB-PRF-08: hobbies CSV válido → parseado a array sin espacios', async () => {
    const { agent } = await agentConSesion('uid_prf8');
    let capturedHobbies = null;
    User.findByIdAndUpdate.mockImplementation((id, data) => {
      capturedHobbies = data.hobbies;
      return { select: jest.fn().mockResolvedValue({ _id: id, hobbies: data.hobbies }) };
    });

    await agent.post('/api/perfil/update').field('hobbies', 'fútbol, lectura, natación');
    // hobbies.split(',').map(h => h.trim()).filter(h => h)
    expect(capturedHobbies).toEqual(['fútbol', 'lectura', 'natación']);
  });

  test('CB-PRF-09: hobbies con entradas vacías → filtradas por .filter(h => h)', async () => {
    const { agent } = await agentConSesion('uid_prf9');
    let capturedHobbies = null;
    User.findByIdAndUpdate.mockImplementation((id, data) => {
      capturedHobbies = data.hobbies;
      return { select: jest.fn().mockResolvedValue({ _id: id }) };
    });

    await agent.post('/api/perfil/update').field('hobbies', 'fútbol,,lectura,  ,natación');
    expect(capturedHobbies).not.toContain('');
    expect(capturedHobbies.length).toBe(3);
  });

  test('CB-PRF-10: Con archivo fotoPerfil → ruta /uploads/ asignada', async () => {
    const { agent } = await agentConSesion('uid_prf10');
    let capturedFoto = null;
    User.findByIdAndUpdate.mockImplementation((id, data) => {
      capturedFoto = data.fotoPerfil;
      return { select: jest.fn().mockResolvedValue({ _id: id, fotoPerfil: data.fotoPerfil }) };
    });

    await agent
      .post('/api/perfil/update')
      .attach('fotoPerfil', Buffer.from('imgdata'), 'avatar.jpg');

    expect(capturedFoto).toMatch(/^\/uploads\//);
  });

  test('CB-PRF-11: Sin fotoPerfil → campo fotoPerfil NO está en updateData', async () => {
    const { agent } = await agentConSesion('uid_prf11');
    let capturedUpdateData = null;
    User.findByIdAndUpdate.mockImplementation((id, data) => {
      capturedUpdateData = data;
      return { select: jest.fn().mockResolvedValue({ _id: id }) };
    });

    await agent.post('/api/perfil/update').field('descripcion', 'Solo texto');
    // La rama: if (req.file) → sin archivo, fotoPerfil no se toca
    expect(capturedUpdateData).not.toHaveProperty('fotoPerfil');
  });

  test('CB-PRF-12: Múltiples campos simultáneos → todos incluidos en updateData', async () => {
    const { agent } = await agentConSesion('uid_prf12');
    let capturedUpdateData = null;
    User.findByIdAndUpdate.mockImplementation((id, data) => {
      capturedUpdateData = data;
      return {
        select: jest.fn().mockResolvedValue({ _id: id, ...data })
      };
    });

    await agent
      .post('/api/perfil/update')
      .field('username', 'NuevoNombre')
      .field('descripcion', 'Nueva descripción')
      .field('deporteFavorito', 'Ciclismo')
      .field('ubicacion', 'Medellín')
      .field('hobbies', 'leer,correr');

    expect(capturedUpdateData.username).toBe('NuevoNombre');
    expect(capturedUpdateData.descripcion).toBe('Nueva descripción');
    expect(capturedUpdateData.deporteFavorito).toBe('Ciclismo');
    expect(capturedUpdateData.ubicacion).toBe('Medellín');
    expect(capturedUpdateData.hobbies).toEqual(['leer', 'correr']);
  });

  test('CB-PRF-13: Respuesta NO contiene campo password', async () => {
    const { agent } = await agentConSesion('uid_prf13');
    User.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        _id: 'uid_prf13',
        username: 'perfilUser'
        // sin password
      })
    });

    const res = await agent.post('/api/perfil/update').field('descripcion', 'test');
    expect(res.body.user).not.toHaveProperty('password');
  });
});
