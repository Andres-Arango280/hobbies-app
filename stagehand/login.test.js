const { Stagehand } = require('@browserbasehq/stagehand');

(async () => {
  const browser = new Stagehand({ headless: false });

  await browser.goto('http://localhost:3000/login');

  await browser.act('Escribir el correo test@test.com');
  await browser.act('Escribir la contraseña 123456');

  await browser.act('Dar clic en iniciar sesión');

  await browser.observe('Validar que el usuario entró correctamente');

  console.log('Login OK');

  await browser.close();
})();