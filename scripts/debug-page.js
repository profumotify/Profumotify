// Script temporaneo di debug: verifica se l'immagine di Divine Cherry
// (ospitata su intenseoud.com) si carica davvero quando richiesta con
// un Referer esterno, come avviene quando la pagina dell'app la
// richiama - per escludere un blocco hotlink lato server. Va rimosso a
// fine diagnosi.
const { chromium } = require('playwright');

const imageUrl = 'https://www.intenseoud.com/cdn/shop/files/DivineCherry_1080x.png?v=1774736671';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
  });

  // 1) Richiesta diretta all'immagine con Referer del sito reale
  console.log('=== Richiesta immagine con Referer profumotify.github.io ===');
  try {
    const res = await context.request.get(imageUrl, {
      headers: { 'Referer': 'https://profumotify.github.io/' }
    });
    console.log('Status:', res.status());
    console.log('Content-Type:', res.headers()['content-type']);
    console.log('Content-Length:', res.headers()['content-length']);
  } catch (e) {
    console.log('ERRORE:', e.message);
  }

  // 2) Stessa richiesta ma senza alcun Referer (simula navigazione diretta)
  console.log('\n=== Richiesta immagine senza Referer ===');
  try {
    const res2 = await context.request.get(imageUrl);
    console.log('Status:', res2.status());
    console.log('Content-Type:', res2.headers()['content-type']);
  } catch (e) {
    console.log('ERRORE:', e.message);
  }

  // 3) Carica davvero la pagina index.html deployata (se già online) e controlla se l'img si carica
  console.log('\n=== Verifica dentro una vera pagina HTML con <img> ===');
  try {
    const page = await context.newPage();
    await page.setContent(`<html><body><img id="testimg" src="${imageUrl}"></body></html>`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const loaded = await page.evaluate(() => {
      const img = document.getElementById('testimg');
      return { complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
    });
    console.log('Stato immagine nella pagina:', JSON.stringify(loaded));
  } catch (e) {
    console.log('ERRORE:', e.message);
  }

  await browser.close();
})();
