// Script temporaneo di debug: la pagina prodotto diretta di Afnan 9pm
// Elixir ha dato 520 due volte di fila. Prova qui un URL alternativo
// (pagina collezione) e verifica lo stato generale del sito, per capire
// se e' un problema specifico di quella pagina o del sito intero.
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
  ['Homepage Notino', 'https://www.notino.it/'],
  ['Collezione Afnan 9 PM', 'https://www.notino.it/afnan/9-pm/'],
  ['Prodotto diretto (terzo tentativo)', 'https://www.notino.it/afnan/9-pm-elixir-estratto-profumato-unisex/']
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

      if (label.includes('Prodotto')) {
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
            }
          } catch {}
        }
      }
      if (label.includes('Collezione')) {
        const links = [...html.matchAll(/href="(https:\/\/www\.notino\.it\/afnan\/9-pm[^"]*)"/g)].map(m => m[1]).filter((v,i,a)=>a.indexOf(v)===i);
        console.log('Link prodotti 9 PM trovati:', links.length);
        links.slice(0, 10).forEach(l => console.log('  ' + l));
      }
      await page.close();
    } catch (e) {
      console.log('ERRORE:', e.message);
    }
    await new Promise(r => setTimeout(r, 2000));
  }

  await browser.close();
})();
