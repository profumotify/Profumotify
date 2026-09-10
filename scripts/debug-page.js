// Script temporaneo di debug: seconda ricerca foto per Hamidi Divine
// Cherry (l'og:image di hamidi.us era sbagliata, un'immagine promo
// generica) e nuovo tentativo su Lattafa His Confession (Notino aveva
// dato 403 intermittente). Va rimosso a fine diagnosi.
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
  ['Hamidi Divine Cherry (hamidi.ae)', 'https://hamidi.ae/products/divine-cherry-the-lost-paradise-parfum-100ml'],
  ['Hamidi Divine Cherry (intenseoud.com)', 'https://www.intenseoud.com/products/divine-cherry-edp-spray-100ml-3-4-oz-by-hamidi-indulge-in-the-sweetness-of-this-enchanting-fragrance'],
  ['Lattafa His Confession (Notino IT retry)', 'https://www.notino.it/lattafa/his-confession-eau-de-parfum-per-uomo/']
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
