const { Stagehand } = require('@browserbasehq/stagehand');

(async () => {
  const browser = new Stagehand({ headless: false });

  await browser.goto('http://localhost:3000/hobbies');

  await browser.act('Escribir Natación en el campo hobby');
  await browser.act('Dar clic en agregar hobby');

  await browser.observe('Validar que Natación aparece en la lista');

  console.log('Hobby OK');

  await browser.close();
})();