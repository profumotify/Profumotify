// Script temporaneo di debug: seconda verifica su Fragrantica - stavolta
// visitando prima la home e usando il vero campo di ricerca, invece di
// costruire l'URL a mano, per capire se il blocco/i risultati scorrelati
// del primo test dipendevano da questo. Va rimosso a fine diagnosi.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    locale: 'it-IT'
  });
  const page = await context.newPage();

  console.log('=== Visita home Fragrantica ===');
  try {
    const res = await page.goto('https://www.fragrantica.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log('Status home:', res ? res.status() : 'nessuna risposta');
    await page.waitForTimeout(2500);
    const homeHtml = await page.content();
    const cfMarkers = /challenges\.cloudflare\.com|Just a moment|__cf_chl|Access Denied|captcha/i.test(homeHtml);
    console.log('Indizi blocco anti-bot sulla home:', cfMarkers);
    console.log('Titolo home:', await page.title());

    // Cerca un vero campo di ricerca nella pagina
    const searchInputSelectors = ['input[type="search"]', 'input[name*="search" i]', 'input[placeholder*="search" i]', '#search', '.search-input'];
    let foundSelector = null;
    for (const sel of searchInputSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) { foundSelector = sel; break; }
    }
    console.log('Campo di ricerca trovato:', foundSelector || 'nessuno dei selettori comuni');
  } catch (e) {
    console.log('ERRORE home:', e.message);
  }

  await page.waitForTimeout(2000);

  console.log('\n=== Prodotto (stessa sessione, dopo aver visitato la home) ===');
  try {
    const res2 = await page.goto('https://www.fragrantica.com/perfume/Dior/Sauvage-31861.html', { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log('Status prodotto:', res2 ? res2.status() : 'nessuna risposta');
    await page.waitForTimeout(2000);
    const html2 = await page.content();
    console.log('Titolo prodotto:', await page.title());
    const cfMarkers2 = /challenges\.cloudflare\.com|Just a moment|__cf_chl|Access Denied|captcha/i.test(html2);
    console.log('Indizi blocco anti-bot sul prodotto:', cfMarkers2);
    const ogImage = html2.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    console.log('og:image:', ogImage ? ogImage[1] : 'non trovato');
    const ldMatches = [...html2.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    console.log('Blocchi JSON-LD:', ldMatches.length);
  } catch (e) {
    console.log('ERRORE prodotto:', e.message);
  }

  await browser.close();
})();
