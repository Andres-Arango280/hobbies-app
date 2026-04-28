/**
 * PRUEBAS DE CAJA BLANCA — Modelos Mongoose (lógica pura)
 *
 * Técnica: Cobertura de condiciones del schema y métodos del modelo
 * Estas pruebas validan la lógica interna de los modelos sin BD real.
 *
 * User.comparePassword:
 *   CB-USR-01: contraseña correcta → true
 *   CB-USR-02: contraseña incorrecta → false
 *
 * Lógica de procesamiento de hobbies (del servidor):
 *   CB-HOB-01: string simple → array limpio
 *   CB-HOB-02: string con espacios → trim aplicado
 *   CB-HOB-03: string con dobles comas → vacíos filtrados
 *   CB-HOB-04: string vacío → array vacío
 *
 * Lógica toggle likes/interesados/asistentes:
 *   CB-TOG-01: indexOf retorna -1 → push (agrega)
 *   CB-TOG-02: indexOf retorna >= 0 → splice (elimina)
 *   CB-TOG-03: multiple usuarios → independientes entre sí
 *
 * Lógica de generación de email automático:
 *   CB-EML-01: username normal → username@temp.com
 *   CB-EML-02: username con espacios → trim + @temp.com
 *
 * Lógica de filename de multer:
 *   CB-FIL-01: nombre sin espacios → sin cambios
 *   CB-FIL-02: nombre con espacios → reemplazados por _
 */

const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────
// comparePassword (método del modelo User)
// ─────────────────────────────────────────────
describe('User.comparePassword — Cobertura de ramas', () => {

  // Simulamos el método tal como está definido en el modelo:
  // userSchema.methods.comparePassword = async function(password) {
  //   return await bcrypt.compare(password, this.password);
  // }
  async function comparePassword(inputPassword, storedHash) {
    return await bcrypt.compare(inputPassword, storedHash);
  }

  test('CB-USR-01: Contraseña correcta → retorna true', async () => {
    const hash = await bcrypt.hash('miClave123', 10);
    const result = await comparePassword('miClave123', hash);
    expect(result).toBe(true);
  });

  test('CB-USR-02: Contraseña incorrecta → retorna false', async () => {
    const hash = await bcrypt.hash('miClave123', 10);
    const result = await comparePassword('otraClave', hash);
    expect(result).toBe(false);
  });

  test('CB-USR-03: String vacío como contraseña → retorna false', async () => {
    const hash = await bcrypt.hash('miClave123', 10);
    const result = await comparePassword('', hash);
    expect(result).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Lógica de procesamiento de hobbies
// (copiada textualmente de server.js línea 220)
// ─────────────────────────────────────────────
describe('Procesamiento de hobbies — Cobertura de ramas', () => {

  // Función extraída del código fuente:
  function procesarHobbies(hobbiesStr) {
    if (!hobbiesStr) return null;
    return hobbiesStr.split(',').map(h => h.trim()).filter(h => h);
  }

  test('CB-HOB-01: String simple → array limpio', () => {
    expect(procesarHobbies('fútbol,lectura,natación'))
      .toEqual(['fútbol', 'lectura', 'natación']);
  });

  test('CB-HOB-02: String con espacios alrededor → trim aplicado', () => {
    expect(procesarHobbies('  fútbol , lectura , natación  '))
      .toEqual(['fútbol', 'lectura', 'natación']);
  });

  test('CB-HOB-03: Dobles comas → vacíos filtrados por .filter(h => h)', () => {
    const result = procesarHobbies('fútbol,,lectura,  ,natación');
    expect(result).not.toContain('');
    expect(result.length).toBe(3);
  });

  test('CB-HOB-04: Valor falsy → retorna null (rama !hobbiesStr)', () => {
    expect(procesarHobbies(null)).toBeNull();
    expect(procesarHobbies(undefined)).toBeNull();
    expect(procesarHobbies('')).toBeNull();
  });

  test('CB-HOB-05: Un solo hobby sin comas → array de un elemento', () => {
    expect(procesarHobbies('fútbol')).toEqual(['fútbol']);
  });
});

// ─────────────────────────────────────────────
// Lógica de toggle (likes / interesados / asistentes)
// (código de server.js líneas 290-298, 388-393, 412-417)
// ─────────────────────────────────────────────
describe('Lógica de toggle (likes/interesados/asistentes) — Cobertura de ramas', () => {

  // Función extraída del código fuente (idéntica para los tres casos):
  function toggleUsuario(lista, userId) {
    const index = lista.indexOf(userId);
    if (index === -1) {
      lista.push(userId);          // rama: no existe → agrega
    } else {
      lista.splice(index, 1);      // rama: existe → elimina
    }
    return { lista, liked: index === -1 };
  }

  test('CB-TOG-01: Lista vacía (index === -1) → push, liked=true', () => {
    const lista = [];
    const { liked } = toggleUsuario(lista, 'user1');
    expect(lista).toContain('user1');
    expect(lista.length).toBe(1);
    expect(liked).toBe(true);
  });

  test('CB-TOG-02: Usuario ya existe (index !== -1) → splice, liked=false', () => {
    const lista = ['user1'];
    const { liked } = toggleUsuario(lista, 'user1');
    expect(lista).not.toContain('user1');
    expect(lista.length).toBe(0);
    expect(liked).toBe(false);
  });

  test('CB-TOG-03: Otros usuarios no son afectados al hacer toggle', () => {
    const lista = ['user2', 'user3'];
    toggleUsuario(lista, 'user2');
    expect(lista).not.toContain('user2');
    expect(lista).toContain('user3');
    expect(lista.length).toBe(1);
  });

  test('CB-TOG-04: Toggle doble → vuelve al estado original (idempotente doble)', () => {
    const lista = [];
    toggleUsuario(lista, 'user1'); // agrega
    toggleUsuario(lista, 'user1'); // elimina
    expect(lista.length).toBe(0);
  });

  test('CB-TOG-05: Múltiples usuarios en lista → solo el correcto se elimina', () => {
    const lista = ['user1', 'user2', 'user3'];
    toggleUsuario(lista, 'user2');
    expect(lista).toEqual(['user1', 'user3']);
    expect(lista.length).toBe(2);
  });
});

// ─────────────────────────────────────────────
// Generación automática de email
// (código de server.js línea 146)
// ─────────────────────────────────────────────
describe('Generación de email automático — Cobertura de ramas', () => {

  function generarEmail(username) {
    return `${username.trim()}@temp.com`;
  }

  test('CB-EML-01: Username simple → username@temp.com', () => {
    expect(generarEmail('andres')).toBe('andres@temp.com');
  });

  test('CB-EML-02: Username con espacios → trim + @temp.com', () => {
    expect(generarEmail('  andres  ')).toBe('andres@temp.com');
  });

  test('CB-EML-03: Username con mayúsculas → se respetan', () => {
    expect(generarEmail('AndresA')).toBe('AndresA@temp.com');
  });
});

// ─────────────────────────────────────────────
// Lógica del filename de multer
// (código de server.js línea 61)
// ─────────────────────────────────────────────
describe('Multer filename — Cobertura de ramas (replace de espacios)', () => {

  // Función extraída textualmente del código:
  function generarFilename(originalname) {
    return Date.now() + '-' + originalname.replace(/\s+/g, '_');
  }

  test('CB-FIL-01: Nombre sin espacios → no cambia el nombre base', () => {
    const result = generarFilename('foto.jpg');
    expect(result).toMatch(/^\d+-foto\.jpg$/);
  });

  test('CB-FIL-02: Nombre con espacios → reemplazados por _', () => {
    const result = generarFilename('mi foto de perfil.jpg');
    expect(result).toMatch(/^\d+-mi_foto_de_perfil\.jpg$/);
  });

  test('CB-FIL-03: Nombre con múltiples espacios consecutivos → reemplazados por _ único', () => {
    const result = generarFilename('foto   doble.jpg');
    expect(result).toContain('foto_doble.jpg');
  });

  test('CB-FIL-04: El filename incluye timestamp como prefijo numérico', () => {
    const before = Date.now();
    const result = generarFilename('test.jpg');
    const after  = Date.now();
    const ts = parseInt(result.split('-')[0]);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});
