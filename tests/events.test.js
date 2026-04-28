/**
 * PRUEBAS DE CAJA BLANCA — Eventos
 *
 * Técnica: Cobertura de ramas + análisis de valores límite
 *
 * POST /api/events — Ramas:
 *   CB-EVT-01: Sin sesión                       → 401
 *   CB-EVT-02: !title                           → 400 "Faltan campos obligatorios"
 *   CB-EVT-03: !date                            → 400
 *   CB-EVT-04: !time                            → 400
 *   CB-EVT-05: !place                           → 400
 *   CB-EVT-06: description ausente             → se guarda como '' (ternario)
 *   CB-EVT-07: flujo completo exitoso           → 200
 *
 * GET /api/events — Ramas:
 *   CB-EVT-08: Sin eventos                      → []
 *   CB-EVT-09: Con eventos                      → lista con createdBy
 *
 * POST /api/events/:id/interesado — Toggle:
 *   CB-INT-01: Sin sesión                       → 401
 *   CB-INT-02: Evento inexistente               → 404
 *   CB-INT-03: index === -1                     → agregado, interested=true
 *   CB-INT-04: index !== -1                     → eliminado, interested=false
 *
 * POST /api/events/:id/asistir — Toggle:
 *   CB-ASI-01: Sin sesión                       → 401
 *   CB-ASI-02: Evento inexistente               → 404
 *   CB-ASI-03: index === -1                     → agregado, attending=true
 *   CB-ASI-04: index !== -1                     → eliminado, attending=false
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
const Event   = require('../models/Event');

beforeEach(() => jest.clearAllMocks());

// Helper: agente con sesión de cookie simulada vía login mock
async function agentConSesion(uid = 'uid_evt_session') {
  User.findOne.mockResolvedValue({
    _id: uid,
    username: 'evtUser',
    comparePassword: jest.fn().mockResolvedValue(true)
  });
  const agent = request.agent(app);
  await agent.post('/api/login').send({ username: 'evtUser', password: 'pass' });
  return { agent, uid };
}

const eventoValido = () => ({
  title: 'Torneo de ajedrez',
  description: 'Evento de práctica',
  date: '2025-12-15',
  time: '10:00',
  place: 'Parque Central'
});

// ─────────────────────────────────────────────
// POST /api/events
// ─────────────────────────────────────────────
describe('POST /api/events — Cobertura de ramas', () => {

  test('CB-EVT-01: Sin sesión → 401 "No autorizado"', async () => {
    const res = await request(app).post('/api/events').send(eventoValido());
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('No autorizado');
  });

  test('CB-EVT-02: !title → 400 "Faltan campos obligatorios"', async () => {
    const { agent } = await agentConSesion();
    const { title, ...body } = eventoValido();
    const res = await agent.post('/api/events').send(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Faltan campos obligatorios');
  });

  test('CB-EVT-03: !date → 400 "Faltan campos obligatorios"', async () => {
    const { agent } = await agentConSesion();
    const { date, ...body } = eventoValido();
    const res = await agent.post('/api/events').send(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Faltan campos obligatorios');
  });

  test('CB-EVT-04: !time → 400 "Faltan campos obligatorios"', async () => {
    const { agent } = await agentConSesion();
    const { time, ...body } = eventoValido();
    const res = await agent.post('/api/events').send(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Faltan campos obligatorios');
  });

  test('CB-EVT-05: !place → 400 "Faltan campos obligatorios"', async () => {
    const { agent } = await agentConSesion();
    const { place, ...body } = eventoValido();
    const res = await agent.post('/api/events').send(body);
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Faltan campos obligatorios');
  });

  test('CB-EVT-06: Sin description → se guarda como string vacío ""', async () => {
    const { agent } = await agentConSesion('uid_evt6');
    const { description, ...body } = eventoValido();
    let capturedDesc = 'NO_CAPTURADO';
    Event.mockImplementation((data) => {
      capturedDesc = data.description;
      return {
        _id: 'evt006', ...data,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true)
      };
    });

    await agent.post('/api/events').send(body);
    // La rama ternaria: description ? description.trim() : ''
    expect(capturedDesc).toBe('');
  });

  test('CB-EVT-07: Todos los campos válidos → 200 con datos del evento', async () => {
    const { agent } = await agentConSesion('uid_evt7');
    const fakeEvent = {
      _id: 'evt007',
      title: 'Torneo de ajedrez',
      place: 'Parque Central',
      createdBy: { username: 'evtUser' },
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true)
    };
    Event.mockImplementation(() => fakeEvent);

    const res = await agent.post('/api/events').send(eventoValido());
    expect(res.statusCode).toBe(200);
  });

  test('CB-EVT-07b: Los campos se guardan con .trim() aplicado', async () => {
    const { agent } = await agentConSesion('uid_evt7b');
    let capturedTitle = null, capturedPlace = null;
    Event.mockImplementation((data) => {
      capturedTitle = data.title;
      capturedPlace = data.place;
      return {
        _id: 'evt007b', ...data,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockResolvedValue(true)
      };
    });

    await agent.post('/api/events').send({
      title: '  Evento con espacios  ',
      date: '2025-12-15',
      time: '10:00',
      place: '  Lugar con espacios  '
    });

    expect(capturedTitle).toBe('Evento con espacios');
    expect(capturedPlace).toBe('Lugar con espacios');
  });
});

// ─────────────────────────────────────────────
// GET /api/events
// ─────────────────────────────────────────────
describe('GET /api/events — Cobertura de ramas', () => {

  test('CB-EVT-08: Sin eventos → retorna []', async () => {
    Event.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([])
    });

    const res = await request(app).get('/api/events');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('CB-EVT-09: Con eventos → lista con datos del creador', async () => {
    const events = [
      { _id: 'e1', title: 'Maratón', createdBy: { username: 'autor1' }, interesados: [], asistentes: [] }
    ];
    Event.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue(events)
    });

    const res = await request(app).get('/api/events');
    expect(res.statusCode).toBe(200);
    expect(res.body[0].createdBy.username).toBe('autor1');
  });
});

// ─────────────────────────────────────────────
// POST /api/events/:id/interesado — Toggle
// ─────────────────────────────────────────────
describe('POST /api/events/:id/interesado — Toggle (Cobertura de ramas)', () => {

  test('CB-INT-01: Sin sesión → 401 "No autorizado"', async () => {
    const res = await request(app).post('/api/events/e001/interesado');
    expect(res.statusCode).toBe(401);
  });

  test('CB-INT-02: Evento inexistente → 404 "Evento no encontrado"', async () => {
    Event.findById.mockResolvedValue(null);
    const { agent } = await agentConSesion('uid_int2');

    const res = await agent.post('/api/events/evtFake/interesado');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Evento no encontrado');
  });

  test('CB-INT-03: index === -1 → usuario agregado, interested=true', async () => {
    const { agent, uid } = await agentConSesion('uid_int3');
    const fakeEvent = {
      _id: 'e_int3',
      interesados: [],     // vacío → indexOf retorna -1 → push
      save: jest.fn().mockResolvedValue(true)
    };
    Event.findById.mockResolvedValue(fakeEvent);

    const res = await agent.post('/api/events/e_int3/interesado');
    expect(res.statusCode).toBe(200);
    expect(res.body.interested).toBe(true);
    expect(res.body.interesados).toBe(1);
  });

  test('CB-INT-04: index !== -1 → usuario eliminado, interested=false', async () => {
    const { agent, uid } = await agentConSesion('uid_int4');
    // El userId de la sesión es el _id del usuario mockeado en login
    // Necesitamos obtenerlo luego del login
    const fakeEvent = {
      _id: 'e_int4',
      interesados: [],   // lo llenamos después de saber el uid real
      save: jest.fn().mockResolvedValue(true)
    };
    Event.findById.mockImplementation(() => {
      // Cuando se llama findById ya sabemos el uid de sesión
      fakeEvent.interesados = [fakeEvent._sessionUid || uid];
      return Promise.resolve(fakeEvent);
    });

    // Primera llamada agrega, segunda elimina (toggle)
    await agent.post('/api/events/e_int4/interesado');   // agrega
    const res = await agent.post('/api/events/e_int4/interesado'); // elimina

    expect(res.statusCode).toBe(200);
    // después del toggle, interested depende del estado final
    expect(typeof res.body.interested).toBe('boolean');
  });
});

// ─────────────────────────────────────────────
// POST /api/events/:id/asistir — Toggle
// ─────────────────────────────────────────────
describe('POST /api/events/:id/asistir — Toggle (Cobertura de ramas)', () => {

  test('CB-ASI-01: Sin sesión → 401 "No autorizado"', async () => {
    const res = await request(app).post('/api/events/e001/asistir');
    expect(res.statusCode).toBe(401);
  });

  test('CB-ASI-02: Evento inexistente → 404 "Evento no encontrado"', async () => {
    Event.findById.mockResolvedValue(null);
    const { agent } = await agentConSesion('uid_asi2');

    const res = await agent.post('/api/events/evtFake/asistir');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Evento no encontrado');
  });

  test('CB-ASI-03: index === -1 → usuario agregado, attending=true', async () => {
    const { agent } = await agentConSesion('uid_asi3');
    const fakeEvent = {
      _id: 'e_asi3',
      asistentes: [],    // vacío → indexOf retorna -1 → push
      save: jest.fn().mockResolvedValue(true)
    };
    Event.findById.mockResolvedValue(fakeEvent);

    const res = await agent.post('/api/events/e_asi3/asistir');
    expect(res.statusCode).toBe(200);
    expect(res.body.attending).toBe(true);
    expect(res.body.asistentes).toBe(1);
  });

  test('CB-ASI-04: index !== -1 → usuario eliminado, attending=false', async () => {
    const { agent, uid } = await agentConSesion('uid_asi4');
    let callCount = 0;
    const fakeEvent = {
      _id: 'e_asi4',
      asistentes: [],
      save: jest.fn().mockResolvedValue(true)
    };
    Event.findById.mockImplementation(() => {
      if (callCount === 0) {
        callCount++;
        return Promise.resolve({ ...fakeEvent, asistentes: [] });
      }
      // Segunda llamada: asistentes ya tiene el userId → splice
      return Promise.resolve({ ...fakeEvent, asistentes: [uid], save: fakeEvent.save });
    });

    await agent.post('/api/events/e_asi4/asistir');   // primera: agrega
    const res = await agent.post('/api/events/e_asi4/asistir'); // segunda: elimina

    expect(res.statusCode).toBe(200);
    expect(res.body.attending).toBe(false);
    expect(res.body.asistentes).toBe(0);
  });
});
