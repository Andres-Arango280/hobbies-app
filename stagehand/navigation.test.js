const { Stagehand } = require('@browserbasehq/stagehand');

(async () => {
  const browser = new Stagehand({ headless: false });

  await browser.goto('http://localhost:3000');

  await browser.act('Ir a login');
  await browser.observe('Estoy en la página de login');

  await browser.act('Volver al home');
  await browser.observe('Estoy en home');

  console.log('Navigation OK');

  await browser.close();
})();