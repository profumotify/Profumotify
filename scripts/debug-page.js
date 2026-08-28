// Script temporaneo di debug: verifica se questi siti sono utilizzabili
// come nuove fonti prezzo. Per ognuno: status HTTP, eventuale blocco
// anti-bot, presenza di dati strutturati JSON-LD con un prezzo.
// Va rimosso a fine diagnosi.
const { chromium } = require('playwright');

const urls = [
  ['Marionnaud', 'https://www.marionnaud.it/versace/eros/eros-eau-de-toilette/p/BP_97337?varSel=97338'],
  ['Trovaprezzi', 'https://www.trovaprezzi.it/profumi-deodoranti/prezzi-scheda-prodotto/versace_eros_eau_de_toilette_100ml-v'],
  ['Idealo', 'https://www.idealo.it/confronta-prezzi/3753172/versace-eros-eau-de-toilette-100ml.html'],
  ['Profumeria Sabbioni (homepage)', 'https://www.profumeriasabbioni.it/']
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    locale: 'it-IT'
  });

  for (const [label, targetUrl] of urls) {
    console.log('\n=== ' + label + ' :: ' + targetUrl + ' ===');
    try {
      const page = await context.newPage();
      const res = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      console.log('Status:', res ? res.status() : 'nessuna risposta');
      console.log('URL finale:', page.url());
      await page.waitForTimeout(1800);
      const html = await page.content();
      console.log('Lunghezza HTML:', html.length);
      console.log('Titolo pagina:', await page.title());

      const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      console.log('Blocchi JSON-LD trovati:', ldMatches.length);
      ldMatches.slice(0, 3).forEach((m, i) => {
        console.log(`  JSON-LD[${i}] estratto:`, m[1].trim().replace(/\s+/g, ' ').slice(0, 400));
      });

      const cfMarkers = /challenges\.cloudflare\.com|Just a moment|__cf_chl|Access Denied|captcha/i.test(html);
      console.log('Indizi di blocco anti-bot nel body:', cfMarkers);

      const bodySnippet = html.replace(/\s+/g, ' ').slice(0, 500);
      console.log('Estratto HTML:', bodySnippet);
      await page.close();
    } catch (e) {
      console.log('ERRORE:', e.message);
    }
  }

  await browser.close();
})();
