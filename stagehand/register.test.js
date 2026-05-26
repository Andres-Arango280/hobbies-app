const { Stagehand } = require('@browserbasehq/stagehand');

(async () => {
  const browser = new Stagehand({ headless: false });

  await browser.goto('http://localhost:3000/register');

  await browser.act('Escribir nombre Santiago Cano');
  await browser.act('Escribir correo test@test.com');
  await browser.act('Escribir contraseña 123456');

  await browser.act('Dar clic en registrar');

  await browser.observe('Validar registro exitoso');

  console.log('Register OK');

  await browser.close();
})();