// Script temporaneo di debug: ispeziona la struttura reale di Fragrantica
// (pagina di ricerca + scheda prodotto) prima di scrivere una logica di
// estrazione per l'arricchimento automatico dei profumi. Va rimosso a
// fine diagnosi.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    locale: 'it-IT'
  });

  // 1) Pagina di ricerca: come sono strutturati i risultati?
  const searchUrl = 'https://www.fragrantica.com/search/?q=' + encodeURIComponent('Xerjoff Naxos');
  console.log('\n=== RICERCA: ' + searchUrl + ' ===');
  try {
    const page = await context.newPage();
    const res = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log('Status:', res ? res.status() : 'nessuna risposta');
    await page.waitForTimeout(2000);
    const html = await page.content();
    console.log('Lunghezza HTML:', html.length);
    console.log('Titolo:', await page.title());

    // Cerca link a pagine /perfume/ nei risultati
    const perfumeLinks = [...html.matchAll(/href="(https:\/\/www\.fragrantica\.com\/perfume\/[^"]+)"/g)]
      .map(m => m[1]).filter((v, i, a) => a.indexOf(v) === i).slice(0, 10);
    console.log('Link a schede profumo trovati:', perfumeLinks.length);
    perfumeLinks.forEach(l => console.log('  ' + l));

    const cfMarkers = /challenges\.cloudflare\.com|Just a moment|__cf_chl|Access Denied|captcha/i.test(html);
    console.log('Indizi blocco anti-bot:', cfMarkers);
    await page.close();
  } catch (e) {
    console.log('ERRORE ricerca:', e.message);
  }

  await new Promise(r => setTimeout(r, 3000));

  // 2) Pagina prodotto nota (Dior Sauvage EDT, molto popolare, sicuro esista)
  const productUrl = 'https://www.fragrantica.com/perfume/Dior/Sauvage-31861.html';
  console.log('\n=== PRODOTTO: ' + productUrl + ' ===');
  try {
    const page = await context.newPage();
    const res = await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log('Status:', res ? res.status() : 'nessuna risposta');
    await page.waitForTimeout(2000);
    const html = await page.content();
    console.log('Lunghezza HTML:', html.length);
    console.log('Titolo:', await page.title());

    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    console.log('og:image:', ogImage ? ogImage[1] : 'non trovato');

    const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    console.log('Blocchi JSON-LD trovati:', ldMatches.length);
    ldMatches.forEach((m, i) => {
      console.log(`  JSON-LD[${i}] (primi 800 char):`, m[1].trim().replace(/\s+/g, ' ').slice(0, 800));
    });

    // Cerca la piramide olfattiva (classi tipiche pyramid/notes)
    const pyramidHint = html.match(/pyramid[\s\S]{0,300}/i);
    console.log('Indizio piramide note (contesto):', pyramidHint ? pyramidHint[0].replace(/\s+/g, ' ').slice(0, 300) : 'non trovato');

    const cfMarkers = /challenges\.cloudflare\.com|Just a moment|__cf_chl|Access Denied|captcha/i.test(html);
    console.log('Indizi blocco anti-bot:', cfMarkers);
    await page.close();
  } catch (e) {
    console.log('ERRORE prodotto:', e.message);
  }

  await browser.close();
})();
