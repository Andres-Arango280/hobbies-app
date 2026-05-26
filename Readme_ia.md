# Pruebas con IA usando Stagehand y DeepEval

## Proyecto

Repositorio del proyecto:

* [https://github.com/Andres-Arango280/hobbies-app](https://github.com/Andres-Arango280/hobbies-app)

---

# Introducción

En este proyecto se implementan pruebas automatizadas utilizando herramientas modernas basadas en Inteligencia Artificial:

1. **Stagehand** → Para automatización inteligente de pruebas E2E.
2. **DeepEval** → Para evaluación automática de calidad usando IA.

Estas herramientas permiten realizar pruebas más avanzadas que los frameworks tradicionales porque utilizan modelos de IA para interpretar comportamientos, validar respuestas y automatizar flujos complejos.

---

# ¿Qué es Stagehand?

Stagehand es una librería de automatización moderna basada en IA que facilita las pruebas End-to-End (E2E).

Combina:

* Navegación web automatizada
* Inteligencia Artificial
* Interpretación semántica
* Automatización inteligente

A diferencia de herramientas tradicionales como Selenium o Cypress, Stagehand puede interpretar instrucciones en lenguaje natural.

## Características principales

* Automatización inteligente
* Integración con IA
* Detección dinámica de elementos
* Menos dependencia de selectores CSS
* Pruebas más robustas
* Mejor mantenimiento del código

---

# Instalación de Stagehand

## 1. Instalar Node.js

Verificar instalación:

```bash
node -v
npm -v
```

---

## 2. Instalar dependencias

Dentro del proyecto ejecutar:

```bash
npm install
```

---

## 3. Instalar Stagehand

```bash
npm install @browserbasehq/stagehand
```

---

# Estructura recomendada

```bash
stagehand/
│
├── tests/
│   ├── login.test.js
│   ├── hobbies.test.js
│   └── navigation.test.js
│
└── config/
    └── stagehand.config.js
```

---

# Configuración básica de Stagehand

## Archivo: `stagehand.config.js`

```js
module.exports = {
  headless: false,
  timeout: 30000,
  baseUrl: 'http://localhost:3000'
};
```

---

# Ejemplo de prueba con Stagehand

## Login automático

Archivo:

```bash
stagehand/tests/login.test.js
```

Código:

```js
const { Stagehand } = require('@browserbasehq/stagehand');

(async () => {
  const browser = new Stagehand();

  await browser.goto('http://localhost:3000/login');

  await browser.act('Escribir el correo test@test.com');

  await browser.act('Escribir la contraseña 123456');

  await browser.act('Dar clic en iniciar sesión');

  await browser.observe('Validar que ingresó correctamente');

  console.log('Login exitoso');

  await browser.close();
})();
```

---

# Explicación del test

El test realiza automáticamente:

1. Apertura del navegador.
2. Navegación al login.
3. Escritura del correo.
4. Escritura de contraseña.
5. Clic en el botón.
6. Validación del acceso.
7. Cierre del navegador.

La ventaja principal es que Stagehand utiliza IA para interpretar las instrucciones en lenguaje natural.

---

# Ejemplo: prueba de creación de hobby

Archivo:

```bash
stagehand/tests/hobbies.test.js
```

Código:

```js
const { Stagehand } = require('@browserbasehq/stagehand');

(async () => {
  const browser = new Stagehand();

  await browser.goto('http://localhost:3000/hobbies');

  await browser.act('Escribir Natación en el formulario');

  await browser.act('Dar clic en agregar hobby');

  await browser.observe('Validar que el hobby Natación aparece en pantalla');

  console.log('Hobby agregado correctamente');

  await browser.close();
})();
```

---

# Beneficios de usar IA en pruebas

* Menor mantenimiento
* Automatización inteligente
* Detección dinámica de errores
* Mayor velocidad de desarrollo
* Mejor cobertura de pruebas
* Simulación más cercana al comportamiento humano

---

# ¿Qué es DeepEval?

DeepEval es un framework de evaluación basado en Inteligencia Artificial.

Se utiliza principalmente para:

* Evaluar respuestas de IA
* Medir calidad
* Validar precisión
* Analizar resultados automáticos
* Crear métricas inteligentes

También puede utilizarse para evaluar flujos automatizados y validar comportamientos dentro de aplicaciones.

---

# Instalación de DeepEval

## Instalar Python

Verificar:

```bash
python --version
```

---

## Crear entorno virtual

```bash
python -m venv venv
```

Activar:

### Windows

```bash
venv\Scripts\activate
```

### Linux/Mac

```bash
source venv/bin/activate
```

---

## Instalar DeepEval

```bash
pip install deepeval
```

---

# Estructura recomendada para DeepEval

```bash
deepeval/
│
├── tests/
│   ├── quality_test.py
│   ├── validation_test.py
│   └── ui_test.py
│
└── reports/
```

---

# Ejemplo básico con DeepEval

Archivo:

```bash
deepeval/tests/quality_test.py
```

Código:

```python
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric
from deepeval import assert_test

metric = AnswerRelevancyMetric(threshold=0.7)


test_case = LLMTestCase(
    input="Agregar hobby",
    actual_output="El hobby fue agregado correctamente"
)

assert_test(test_case, [metric])
```

---

# Explicación del test

Este test:

1. Define una entrada.
2. Evalúa la salida.
3. Utiliza IA para medir relevancia.
4. Valida automáticamente el resultado.

DeepEval permite generar métricas inteligentes sobre calidad y precisión.

---

# Ejemplo de validación de interfaz

```python
from deepeval.test_case import LLMTestCase
from deepeval.metrics import GEval
from deepeval import assert_test

metric = GEval(
    name="UI Validation",
    criteria="La interfaz debe mostrar correctamente el hobby agregado",
    evaluation_params=["actual_output"]
)


test_case = LLMTestCase(
    input="Agregar hobby",
    actual_output="El hobby Natación aparece correctamente en pantalla"
)

assert_test(test_case, [metric])
```

---

# Integración con el proyecto hobbies-app

Las pruebas implementadas permiten validar:

* Inicio de sesión
* Registro de usuarios
* Creación de hobbies
* Navegación
* Validaciones visuales
* Flujo general de la aplicación

---

# Ventajas de DeepEval

* Evaluación automática
* Uso de IA
* Métricas inteligentes
* Detección de inconsistencias
* Validaciones avanzadas
* Reportes automáticos

---

# Diferencias entre Cypress, Stagehand y DeepEval

| Herramienta | Tipo                    | Uso principal              |
| ----------- | ----------------------- | -------------------------- |
| Cypress     | Testing E2E tradicional | Automatización web         |
| Stagehand   | Testing E2E con IA      | Automatización inteligente |
| DeepEval    | Evaluación con IA       | Validación y métricas      |

---

# Ejecución de pruebas

## Ejecutar Stagehand

```bash
node stagehand/tests/login.test.js
```

---

## Ejecutar DeepEval

```bash
python deepeval/tests/quality_test.py
```

---

# Buenas prácticas

* Mantener pruebas organizadas.
* Separar configuraciones.
* Usar datos de prueba.
* Validar errores y excepciones.
* Automatizar ejecución.
* Implementar CI/CD.

---

# Conclusiones

La integración de herramientas basadas en Inteligencia Artificial mejora significativamente la automatización de pruebas.

Stagehand permite realizar pruebas inteligentes sobre interfaces web mediante instrucciones semánticas y automatización moderna.

DeepEval complementa el proceso mediante evaluación automática y métricas inteligentes basadas en IA.

Estas herramientas representan una evolución frente a frameworks tradicionales porque reducen mantenimiento, aumentan cobertura y permiten validaciones más avanzadas.

---

# Referencias

* [https://github.com/browserbase/stagehand](https://github.com/browserbase/stagehand)
* [https://www.deepeval.com/](https://www.deepeval.com/)
* [https://github.com/confident-ai/deepeval](https://github.com/confident-ai/deepeval)
* [https://docs.cypress.io/](https://docs.cypress.io/)
