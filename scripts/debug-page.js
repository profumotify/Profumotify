// Script temporaneo di debug: naviga con Playwright verso gli URL passati
// e stampa status HTTP, eventuali redirect, e un estratto dell'HTML.
// Va rimosso a fine diagnosi.
const { chromium } = require('playwright');

const urls = [
  'https://www.sensationprofumerie.it/davidoff-cool-water-intense-eau-de-parfum-P125437',
  'https://www.sensationprofumerie.it/azzaro-wanted-by-night-eau-de-parfum-P120689',
  'https://www.sensationprofumerie.it/'
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    locale: 'it-IT'
  });

  for (const targetUrl of urls) {
    console.log('\n=== ' + targetUrl + ' ===');
    try {
      const page = await context.newPage();
      const res = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      console.log('Status:', res ? res.status() : 'nessuna risposta');
      console.log('URL finale (dopo eventuali redirect):', page.url());
      const chain = [];
      let req = res ? res.request() : null;
      while (req) {
        chain.push(req.url());
        req = req.redirectedFrom();
      }
      console.log('Catena redirect:', chain.reverse().join(' -> '));
      await page.waitForTimeout(1000);
      const html = await page.content();
      console.log('Lunghezza HTML:', html.length);
      console.log('Titolo pagina:', await page.title());
      const bodySnippet = html.replace(/\s+/g, ' ').slice(0, 600);
      console.log('Estratto HTML:', bodySnippet);
      await page.close();
    } catch (e) {
      console.log('ERRORE:', e.message);
    }
  }

  await browser.close();
})();
