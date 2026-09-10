// Script temporaneo di debug: ultimo profumo senza foto, Afnan 9pm
// Elixir. Riprova Notino (ieri instabile) e, come alternative, il sito
// ufficiale Afnan e Ulta Beauty. Va rimosso a fine diagnosi.
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
  ['Notino (retry)', 'https://www.notino.it/afnan/9-pm-elixir-estratto-profumato-unisex/'],
  ['Afnan ufficiale (US)', 'https://us.afnan.com/products/9-pm'],
  ['Ulta Beauty', 'https://www.ulta.com/p/9-pm-elixir-extrait-de-parfum-mkt77006374?sku=77009941']
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
      await page.waitForTimeout(2000);
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
            if (item.image) console.log('JSON-LD image:', Array.isArray(item.image) ? item.image[0] : (item.image.url || item.image));
            if (item.name) console.log('JSON-LD name:', item.name);
          }
        } catch {}
      }

      const cfMarkers = /challenges\.cloudflare\.com|Just a moment|__cf_chl|Access Denied|captcha|Ci siamo quasi/i.test(html);
      console.log('Indizi blocco anti-bot:', cfMarkers);
      await page.close();
    } catch (e) {
      console.log('ERRORE:', e.message);
    }
    await new Promise(r => setTimeout(r, 1500));
  }

  await browser.close();
})();
