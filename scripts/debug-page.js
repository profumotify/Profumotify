// Script temporaneo di debug: recupera immagini reali per i 4 profumi
// aggiunti dall'utente (Hamidi Divine Cherry, Al Haramain Amber Oud
// Aqua Dubai, Lattafa His Confession, Al Wataniah Thurath). Va rimosso
// a fine diagnosi.
const { chromium } = require('playwright');

function flattenJsonLd(data, out = []) {
  if (!data) return out;
  if (Array.isArray(data)) { data.forEach(d => flattenJsonLd(d, out)); return out; }
  out.push(data);
  if (data['@graph']) flattenJsonLd(data['@graph'], out);
  if (data.mainEntity) flattenJsonLd(data.mainEntity, out);
  return out;
}

const urls = [
  ['Hamidi Divine Cherry (sito ufficiale)', 'https://www.hamidi.us/products/the-lost-paradise-divine-cherry'],
  ['Al Haramain Amber Oud Aqua Dubai (Notino IT)', 'https://www.notino.it/al-haramain/amber-oud-aqua-dubai-estratto-profumato-unisex/'],
  ['Lattafa His Confession (Notino IT)', 'https://www.notino.it/lattafa/his-confession-eau-de-parfum-per-uomo/'],
  ['Al Wataniah Thurath (Notino ES, solo per foto)', 'https://www.notino.es/al-wataniah/thurath-eau-de-parfum-unisex/']
];

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    locale: 'it-IT'
  });

  for (const [label, url] of urls) {
    console.log('\n=== ' + label + ' :: ' + url + ' ===');
    try {
      const page = await context.newPage();
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      console.log('Status:', res ? res.status() : 'nessuna risposta');
      await page.waitForTimeout(1800);
      const html = await page.content();
      console.log('Titolo pagina:', await page.title());

      const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      console.log('og:image:', ogImage ? ogImage[1] : 'non trovato');

      const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      for (const m of ldMatches) {
        try {
          const data = JSON.parse(m[1].trim());
          const nodes = flattenJsonLd(data);
          for (const item of nodes) {
            if (item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
              offers.forEach(o => console.log('Offer:', o.name || '(senza nome)', '-', o.price, o.priceCurrency));
            }
            if (item.image) console.log('JSON-LD image:', Array.isArray(item.image) ? item.image[0] : (item.image.url || item.image));
            if (item.name) console.log('JSON-LD name:', item.name);
          }
        } catch {}
      }
      await page.close();
    } catch (e) {
      console.log('ERRORE:', e.message);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  await browser.close();
})();
