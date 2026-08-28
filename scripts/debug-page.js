// Script temporaneo di diagnosi: stampa i blocchi JSON-LD grezzi di una
// pagina Notino, per capire come rappresentano le diverse confezioni
// (es. 10ml vs 105ml) prima di scrivere la logica di selezione taglia
// in check-prices.js. Da rimuovere una volta capita la struttura.
const { chromium } = require('playwright');

const URL = process.argv[2];
if (!URL) {
  console.error('Uso: node scripts/debug-page.js <url>');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    locale: 'it-IT'
  });
  const page = await context.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(1500);
  const html = await page.content();

  const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  console.log(`Trovati ${ldMatches.length} blocchi JSON-LD.\n`);
  ldMatches.forEach((m, i) => {
    console.log(`--- Blocco JSON-LD #${i + 1} ---`);
    try {
      const data = JSON.parse(m[1].trim());
      console.log(JSON.stringify(data, null, 2).slice(0, 4000));
    } catch (e) {
      console.log('(non parsabile come JSON)', m[1].trim().slice(0, 500));
    }
    console.log('');
  });

  await browser.close();
})();
