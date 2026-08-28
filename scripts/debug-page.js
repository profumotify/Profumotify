// Script temporaneo di debug: recupera l'immagine prodotto reale da
// Parfumo per G. Bellini Deep (id45), unica scheda ancora senza foto.
// Va rimosso a fine diagnosi.
const { chromium } = require('playwright');

const urls = [
  ['id45 Deep (G. Bellini) - Parfumo', 'https://www.parfumo.com/Perfumes/g-bellini/deep-eau-de-parfum']
];

function flattenJsonLd(data, out = []) {
  if (!data) return out;
  if (Array.isArray(data)) { data.forEach(d => flattenJsonLd(d, out)); return out; }
  out.push(data);
  if (data['@graph']) flattenJsonLd(data['@graph'], out);
  if (data.mainEntity) flattenJsonLd(data.mainEntity, out);
  return out;
}

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
      await page.waitForTimeout(1800);
      const html = await page.content();
      console.log('Titolo pagina:', await page.title());

      const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
      console.log('og:image:', ogImage ? ogImage[1] : 'non trovato');

      const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
      let foundLdImage = null;
      let foundName = null;
      for (const m of ldMatches) {
        try {
          const data = JSON.parse(m[1].trim());
          const nodes = flattenJsonLd(data);
          for (const item of nodes) {
            if (item.image && !foundLdImage) {
              foundLdImage = Array.isArray(item.image) ? item.image[0] : (item.image.url || item.image);
            }
            if (item.name && !foundName) foundName = item.name;
          }
        } catch {}
      }
      console.log('JSON-LD image:', foundLdImage || 'non trovato');
      console.log('JSON-LD name:', foundName || 'non trovato');

      // Cerca anche eventuale indicazione di concentrazione (EDT/EDP) nel testo visibile
      const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      const concMatch = text.match(/Eau de (Toilette|Parfum|Cologne)/i);
      console.log('Concentrazione trovata nel testo:', concMatch ? concMatch[0] : 'non trovata');

      await page.close();
    } catch (e) {
      console.log('ERRORE:', e.message);
    }
  }

  await browser.close();
})();
