// Script temporaneo di diagnosi: verifica se un sito è raggiungibile
// con un browser headless "normale" e se espone dati JSON-LD sul
// prezzo. Da rimuovere una volta finita l'indagine sui nuovi siti.
const { chromium } = require('playwright');

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Uso: node scripts/debug-page.js <url>');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    locale: 'it-IT',
    timezoneId: 'Europe/Rome'
  });
  const page = await context.newPage();
  console.log('Visito:', targetUrl);
  const res = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  console.log('HTTP status:', res ? res.status() : 'nessuna risposta');
  await page.waitForTimeout(2000);

  const html = await page.content();
  console.log('Titolo pagina:', await page.title());
  console.log('Lunghezza HTML:', html.length);

  const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  console.log(`Trovati ${ldMatches.length} blocchi JSON-LD.\n`);
  ldMatches.forEach((m, i) => {
    console.log(`--- Blocco JSON-LD #${i + 1} ---`);
    try {
      const data = JSON.parse(m[1].trim());
      console.log(JSON.stringify(data, null, 2).slice(0, 3000));
    } catch (e) {
      console.log('(non parsabile)', m[1].trim().slice(0, 300));
    }
  });

  if (ldMatches.length === 0) {
    console.log('\nPrimi 1200 caratteri HTML:');
    console.log(html.replace(/\s+/g, ' ').slice(0, 1200));
  }

  await browser.close();
})();
