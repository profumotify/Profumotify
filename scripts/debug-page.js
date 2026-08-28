// Script temporaneo di debug: recupera l'immagine prodotto reale (da
// JSON-LD o meta og:image) per le schede senza foto, dai link forniti
// dall'utente. Una richiesta ravvicinata dietro l'altra fa scattare il
// blocco anti-bot di Notino ("Ci siamo quasi..."): qui ogni richiesta usa
// un contesto browser nuovo e una pausa piu' lunga tra una e l'altra.
// Va rimosso a fine diagnosi.
const { chromium } = require('playwright');

const urls = [
  ['id25 Jameel (Khadlaj)', 'https://www.notino.it/khadlaj/jameel-olio-profumato-unisex/p-16255199'],
  ['id26 Aseel Al Oud (Khadlaj)', 'https://www.notino.it/khadlaj/aseel-al-oud-olio-profumato-unisex/p-16253429'],
  ['id28 Tanasuk (Al Haramain)', 'https://www.notino.it/al-haramain/tanasuk-olio-profumato-unisex/p-16127388'],
  ['id30 Saher Al Layali (Ard Al Zaafaran)', 'https://www.notino.it/ard-al-zaafaran/saher-al-layali-eau-de-parfum-unisex/p-16271928'],
  ['id31 Salamah (Asdaaf)', 'https://www.notino.it/asdaaf/salamah-eau-de-parfum-unisex/p-16299743'],
  ['id45 Deep (G. Bellini) - Kaufland', 'https://www.kaufland.it/product/548581059/']
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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

  for (const [label, targetUrl] of urls) {
    console.log('\n=== ' + label + ' :: ' + targetUrl + ' ===');
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      locale: 'it-IT'
    });
    try {
      const page = await context.newPage();
      const res = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      console.log('Status:', res ? res.status() : 'nessuna risposta');
      await page.waitForTimeout(2000);
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
      await page.close();
    } catch (e) {
      console.log('ERRORE:', e.message);
    } finally {
      await context.close();
    }
    await sleep(6000);
  }

  await browser.close();
})();
