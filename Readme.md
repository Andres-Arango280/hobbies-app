# 🧪 Cypress Tests - Hobbies App

Suite completa de pruebas E2E para **Hobbies App** (Node.js + Express + MongoDB).

## 📁 Estructura de Archivos

```
cypress/
├── e2e/
│   ├── api_tests.cy.js          → Pruebas de API REST
│   ├── security_tests.cy.js     → Pruebas de Seguridad
│   ├── regression_tests.cy.js   → Pruebas de Regresión
│   ├── accessibility_tests.cy.js → Pruebas de Accesibilidad (WCAG 2.1)
│   └── ui_tests.cy.js           → Pruebas de UI
├── fixtures/
│   └── test_data.json           → Datos de prueba reutilizables
└── support/
    ├── commands.js              → Comandos personalizados
    └── e2e.js                   → Setup global
```

## 🚀 Instalación

```bash
npm install
```

## ▶️ Ejecución

```bash
# Abrir interfaz visual de Cypress
npm run cy:open

# Ejecutar TODAS las pruebas en modo headless
npm run cy:run:all

# Ejecutar por categoría
npm run cy:run:api
npm run cy:run:security
npm run cy:run:regression
npm run cy:run:accessibility
npm run cy:run:ui
```

## 📋 Descripción de Pruebas

### 🔌 api_tests.cy.js
- Registro de usuario (201, duplicados, campos vacíos)
- Login con JWT (token válido, credenciales incorrectas)
- CRUD de hobbies (GET, POST, GET/:id)
- Rutas inexistentes (404)
- Content-Type correcto

### 🔐 security_tests.cy.js
- Protección XSS en campos de formulario
- Protección NoSQL Injection (operadores MongoDB)
- Verificación de tokens JWT inválidos/manipulados
- Headers HTTP de seguridad (X-Powered-By)
- Protección de datos sensibles (passwords, secrets)
- Prueba básica de fuerza bruta

### 🔄 regression_tests.cy.js
- Flujo completo de registro no roto
- Flujo de login no roto
- CRUD de hobbies accesible
- Archivos estáticos cargando
- Content-Type correcto en todas las respuestas
- Endpoints de upload y logout operativos

### ♿ accessibility_tests.cy.js (WCAG 2.1 AA)
- Página principal sin violaciones críticas
- Inputs con labels asociados
- Imágenes con alt text
- Navegación por teclado
- Atributo lang en `<html>`
- Contraste de colores
- Mensajes de error anunciados a lectores de pantalla

### 🖥️ ui_tests.cy.js
- Carga correcta de todas las páginas
- Formularios con todos sus campos visibles
- Campo password enmascarado
- Links de navegación funcionales
- Diseño responsivo (Mobile/Tablet/Desktop)
- Mensajes de error visibles al usuario
- Menú móvil funcional

## ⚙️ Requisitos

- Node.js 18+
- La app debe estar corriendo en `http://localhost:3000`
- Para accesibilidad: `axe-core` instalado

## ⚠️ Notas Importantes

1. El `.env` del repositorio está commiteado con credenciales reales — **cambiar en producción**
2. Las pruebas de accesibilidad requieren que la app esté sirviendo HTML real
3. El JWT_SECRET actual `melos` es muy débil — se recomienda una cadena más larga y aleatoria