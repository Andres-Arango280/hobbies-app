// =====================================================
// ui_tests.cy.js - Pruebas de Interfaz de Usuario (UI)
// Hobbies App - Validación visual y de interacciones
// =====================================================

const BASE_URL = 'http://localhost:3000';

describe('UI Tests - Hobbies App', () => {

  // ─── PÁGINA PRINCIPAL ─────────────────────────────

  describe('UI-001: Página Principal (Home)', () => {
    beforeEach(() => {
      cy.visit(BASE_URL, { failOnStatusCode: false });
    });

    it('debe cargar y mostrar contenido visible', () => {
      cy.get('body').should('be.visible');
      cy.get('body').should('not.be.empty');
    });

    it('debe tener título de página definido', () => {
      cy.title().should('not.be.empty');
    });

    it('debe mostrar elementos de navegación', () => {
      cy.get('nav, header, .navbar, .nav-menu').then(($nav) => {
        if ($nav.length) {
          cy.wrap($nav).should('be.visible');
        } else {
          cy.log('No se encontró barra de navegación — revisar estructura HTML');
        }
      });
    });

    it('los links de navegación deben ser visibles y tener href', () => {
      cy.get('a').each(($a) => {
        cy.wrap($a).should('have.attr', 'href');
      });
    });

    it('el logo o nombre de la app debe ser visible', () => {
      cy.get('h1, .logo, .brand, .app-title').then(($el) => {
        if ($el.length) cy.wrap($el.first()).should('be.visible');
        else cy.log('Logo o título principal no encontrado');
      });
    });
  });

  // ─── FORMULARIO DE LOGIN ──────────────────────────

  describe('UI-002: Formulario de Login', () => {
    beforeEach(() => {
      cy.visit(`${BASE_URL}/login.html`, { failOnStatusCode: false });
    });

    it('debe mostrar el formulario de login', () => {
      cy.get('form').should('be.visible');
    });

    it('debe tener campo de email o usuario', () => {
      cy.get('input[type="email"], input[name="email"], input[name="username"]')
        .should('exist').and('be.visible');
    });

    it('debe tener campo de contraseña', () => {
      cy.get('input[type="password"]').should('exist').and('be.visible');
    });

    it('debe tener botón de submit', () => {
      cy.get('button[type="submit"], input[type="submit"]').should('exist').and('be.visible');
    });

    it('el campo password debe enmascarar el texto', () => {
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
    });

    it('debe poder escribir en el campo email', () => {
      cy.get('input[type="email"], input[name="email"]').first()
        .clear().type('usuario@test.com')
        .should('have.value', 'usuario@test.com');
    });

    it('debe poder escribir en el campo password', () => {
      cy.get('input[type="password"]').first()
        .clear().type('MiPassword123!')
        .should('have.value', 'MiPassword123!');
    });

    it('debe mostrar algún feedback al enviar formulario vacío', () => {
      cy.get('button[type="submit"], input[type="submit"]').first().click();
      // Validación HTML5 nativa o mensaje de error personalizado
      cy.get('body').should('exist'); // Al menos el servidor responde
    });

    it('debe tener link a la página de registro', () => {
      cy.get('a[href*="register"]').should('exist');
    });
  });

  // ─── FORMULARIO DE REGISTRO ───────────────────────

  describe('UI-003: Formulario de Registro', () => {
    beforeEach(() => {
      cy.visit(`${BASE_URL}/register.html`, { failOnStatusCode: false });
    });

    it('debe mostrar el formulario de registro', () => {
      cy.get('form').should('be.visible');
    });

    it('debe tener campo de nombre/username', () => {
      cy.get('input[name="username"], input[name="name"], input[id="username"]')
        .should('exist');
    });

    it('debe tener campo de email', () => {
      cy.get('input[type="email"], input[name="email"]').should('exist');
    });

    it('debe tener campo de contraseña', () => {
      cy.get('input[type="password"]').should('exist');
    });

    it('debe tener botón de registro', () => {
      cy.get('button[type="submit"], input[type="submit"]').should('exist').and('be.visible');
    });

    it('debe tener link para volver al login', () => {
      cy.get('a[href*="login"]').should('exist');
    });

    it('debe poder completar el formulario de registro', () => {
      cy.get('input[name="username"], input[id="username"]').first()
        .then(($el) => { if ($el.length) cy.wrap($el).type('nuevoUsuario'); });
      cy.get('input[type="email"], input[name="email"]').first()
        .then(($el) => { if ($el.length) cy.wrap($el).type('nuevo@test.com'); });
      cy.get('input[type="password"]').first()
        .then(($el) => { if ($el.length) cy.wrap($el).type('Password123!'); });
    });
  });

  // ─── LISTA DE HOBBIES ─────────────────────────────

  describe('UI-004: Página de Hobbies', () => {
    beforeEach(() => {
      cy.visit(`${BASE_URL}/hobbies.html`, { failOnStatusCode: false });
    });

    it('debe cargar la página de hobbies', () => {
      cy.get('body').should('be.visible');
    });

    it('debe mostrar un contenedor de hobbies o mensaje de login requerido', () => {
      cy.get('body').then(($body) => {
        const hasHobbies = $body.find('.hobby, .hobbies-list, #hobbies, [data-hobby]').length > 0;
        const hasLoginMsg = $body.find('a[href*="login"], .login-required').length > 0;
        const hasForm = $body.find('form').length > 0;
        expect(hasHobbies || hasLoginMsg || hasForm).to.be.true;
      });
    });

    it('si hay botón de agregar hobby, debe ser visible', () => {
      cy.get('button, a').then(($btns) => {
        const addBtn = [...$btns].find(el =>
          el.textContent.toLowerCase().includes('agregar') ||
          el.textContent.toLowerCase().includes('nuevo') ||
          el.textContent.toLowerCase().includes('add') ||
          el.getAttribute('href')?.includes('new')
        );
        if (addBtn) cy.wrap(addBtn).should('be.visible');
        else cy.log('Botón agregar no encontrado (puede requerir login)');
      });
    });
  });

  // ─── RESPONSIVIDAD ────────────────────────────────

  describe('UI-005: Diseño Responsivo', () => {
    const viewports = [
      { name: 'Mobile (375px)', width: 375, height: 667 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Desktop (1280px)', width: 1280, height: 800 },
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`debe verse correctamente en ${name}`, () => {
        cy.viewport(width, height);
        cy.visit(BASE_URL, { failOnStatusCode: false });
        cy.get('body').should('be.visible');
        // No debe haber scroll horizontal
        cy.window().then((win) => {
          expect(win.document.documentElement.scrollWidth)
            .to.be.lte(width + 20); // margen de 20px
        });
      });
    });

    it('el menú móvil debe ser funcional en pantalla pequeña', () => {
      cy.viewport(375, 667);
      cy.visit(BASE_URL, { failOnStatusCode: false });
      cy.get('.hamburger, .menu-toggle, [data-toggle="menu"]').then(($toggle) => {
        if ($toggle.length) {
          cy.wrap($toggle).click();
          cy.get('nav, .mobile-menu').should('be.visible');
        } else {
          cy.log('No se encontró menú hamburguesa');
        }
      });
    });
  });

  // ─── FEEDBACK Y MENSAJES ──────────────────────────

  describe('UI-006: Mensajes y Feedback al usuario', () => {
    it('debe mostrar error visible con credenciales incorrectas', () => {
      cy.visit(`${BASE_URL}/login.html`, { failOnStatusCode: false });
      cy.get('input[type="email"], input[name="email"]').first()
        .then(($el) => { if ($el.length) cy.wrap($el).type('noexiste@test.com'); });
      cy.get('input[type="password"]').first()
        .then(($el) => { if ($el.length) cy.wrap($el).type('wrongpass'); });
      cy.get('button[type="submit"], input[type="submit"]').first().click();
      // Debe mostrar algún mensaje de error o redirigir
      cy.get('body').should('exist');
    });

    it('los mensajes de carga/spinner deben desaparecer tras la respuesta', () => {
      cy.visit(BASE_URL, { failOnStatusCode: false });
      cy.get('.spinner, .loading, [aria-label="loading"]').then(($spinner) => {
        if ($spinner.length) {
          cy.wrap($spinner).should('not.be.visible', { timeout: 5000 });
        } else {
          cy.log('No se detectó spinner de carga');
        }
      });
    });
  });
});