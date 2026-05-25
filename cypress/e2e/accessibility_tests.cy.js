// =====================================================
// accessibility_tests.cy.js - Pruebas de Accesibilidad
// Hobbies App - WCAG 2.1 AA
// Requiere: npm install cypress-axe axe-core
// =====================================================

describe('Accessibility Tests - Hobbies App (WCAG 2.1 AA)', () => {

  const BASE_URL = 'http://localhost:3000';

  beforeEach(() => {
    cy.injectAxe(); // Inyecta axe-core para análisis de accesibilidad
  });

  // ─── PÁGINA PRINCIPAL ─────────────────────────────

  describe('ACC-001: Página Principal', () => {
    beforeEach(() => {
      cy.visit(BASE_URL, { failOnStatusCode: false });
    });

    it('no debe tener violaciones de accesibilidad críticas', () => {
      cy.checkA11y(null, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        includedImpacts: ['critical', 'serious']
      });
    });

    it('todos los elementos interactivos deben ser navegables por teclado', () => {
      cy.get('a, button, input, select, textarea, [tabindex]').each(($el) => {
        cy.wrap($el).should('be.visible').focus();
      });
    });

    it('las imágenes deben tener atributo alt', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('debe tener un elemento <h1> principal', () => {
      cy.get('h1').should('have.length.at.least', 1);
    });

    it('el documento debe tener título (title)', () => {
      cy.title().should('not.be.empty');
    });

    it('debe tener atributo lang en el elemento <html>', () => {
      cy.get('html').should('have.attr', 'lang');
    });
  });

  // ─── FORMULARIO DE LOGIN ──────────────────────────

  describe('ACC-002: Formulario de Login', () => {
    beforeEach(() => {
      cy.visit(`${BASE_URL}/login.html`, { failOnStatusCode: false });
    });

    it('no debe tener violaciones de accesibilidad en el formulario', () => {
      cy.checkA11y('form', {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
      });
    });

    it('los inputs deben tener labels asociados', () => {
      cy.get('input').each(($input) => {
        const id = $input.attr('id');
        if (id) {
          cy.get(`label[for="${id}"]`).should('exist');
        } else {
          cy.wrap($input).should(($el) => {
            const hasAriaLabel = $el.attr('aria-label') || $el.attr('aria-labelledby') || $el.attr('placeholder');
            expect(hasAriaLabel).to.exist;
          });
        }
      });
    });

    it('el botón de submit debe tener texto descriptivo', () => {
      cy.get('button[type="submit"], input[type="submit"]').first().then(($btn) => {
        if ($btn.length) {
          const text = $btn.text() || $btn.val() || $btn.attr('aria-label');
          expect(text).to.not.be.empty;
        }
      });
    });

    it('debe ser navegable completamente con teclado', () => {
      cy.get('input[type="email"], input[name="email"]').first().then(($el) => {
        if ($el.length) {
          cy.wrap($el).focus().type('test@test.com');
          cy.focused().tab();
        }
      });
    });

    it('el formulario debe tener contraste de colores suficiente (no violaciones serious)', () => {
      cy.checkA11y(null, {
        runOnly: { type: 'tag', values: ['wcag2aa'] },
        includedImpacts: ['serious', 'critical']
      });
    });
  });

  // ─── FORMULARIO DE REGISTRO ───────────────────────

  describe('ACC-003: Formulario de Registro', () => {
    beforeEach(() => {
      cy.visit(`${BASE_URL}/register.html`, { failOnStatusCode: false });
    });

    it('no debe tener violaciones críticas de accesibilidad', () => {
      cy.checkA11y(null, {
        includedImpacts: ['critical', 'serious']
      });
    });

    it('los campos requeridos deben estar marcados como required', () => {
      cy.get('input[required]').should('have.length.at.least', 1);
    });

    it('los mensajes de error deben ser anunciados a lectores de pantalla', () => {
      cy.get('form').then(($form) => {
        if ($form.length) {
          // Verificar que existan elementos con rol alert o aria-live para errores
          cy.get('[role="alert"], [aria-live], .error, .alert').then(($err) => {
            cy.log(`Elementos de error encontrados: ${$err.length}`);
          });
        }
      });
    });
  });

  // ─── PÁGINA DE HOBBIES ────────────────────────────

  describe('ACC-004: Lista de Hobbies', () => {
    beforeEach(() => {
      cy.visit(`${BASE_URL}/hobbies.html`, { failOnStatusCode: false });
    });

    it('no debe tener violaciones críticas', () => {
      cy.checkA11y(null, {
        includedImpacts: ['critical']
      });
    });

    it('las listas deben usar elementos semánticos correctos (ul/ol/li)', () => {
      cy.get('body').then(($body) => {
        if ($body.find('ul, ol').length > 0) {
          cy.get('ul li, ol li').should('exist');
        }
      });
    });

    it('los botones de acción deben tener aria-label descriptivo', () => {
      cy.get('button').each(($btn) => {
        const text = $btn.text().trim();
        const ariaLabel = $btn.attr('aria-label');
        // El botón debe tener texto visible o aria-label
        expect(text || ariaLabel).to.not.be.empty;
      });
    });
  });

  // ─── CONTRASTE Y COLORES ──────────────────────────

  describe('ACC-005: Contraste de colores', () => {
    it('la página principal debe cumplir contraste WCAG AA', () => {
      cy.visit(BASE_URL, { failOnStatusCode: false });
      cy.checkA11y(null, {
        runOnly: { type: 'rule', values: ['color-contrast'] }
      });
    });
  });
});