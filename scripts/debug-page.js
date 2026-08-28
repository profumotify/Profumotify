// Script temporaneo di diagnosi: prova a raggiungere una pagina con
// varie tecniche per sembrare un visitatore reale (niente elusione
// aggressiva: solo header/fingerprint realistici), stampa cosa ottiene.
const { chromium } = require('playwright');

const targetUrl = process.argv[2];
if (!targetUrl) {
  console.error('Uso: node scripts/debug-page.js <url>');
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: {
      'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    }
  });

  // Rimuove il flag più ovvio con cui i siti riconoscono un browser
  // automatizzato (Playwright/Puppeteer/Selenium lo impostano tutti).
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  // Prima visita la home (comportamento più naturale di un utente vero
  // che arriva da Google/direttamente sul sito), poi il prodotto.
  const homeUrl = new URL(targetUrl).origin;
  console.log('Visito prima la home:', homeUrl);
  try {
    await page.goto(homeUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log('Home fallita:', e.message);
  }

  console.log('\nVisito la pagina target:', targetUrl);
  const res = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  console.log('HTTP status:', res ? res.status() : 'nessuna risposta');
  await page.waitForTimeout(2500);

  const html = await page.content();
  console.log('Lunghezza HTML:', html.length);
  console.log('Titolo pagina:', await page.title());

  const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  console.log(`Trovati ${ldMatches.length} blocchi JSON-LD.\n`);
  ldMatches.forEach((m, i) => {
    console.log(`--- Blocco JSON-LD #${i + 1} ---`);
    try {
      const data = JSON.parse(m[1].trim());
      console.log(JSON.stringify(data, null, 2).slice(0, 4000));
    } catch (e) {
      console.log('(non parsabile)', m[1].trim().slice(0, 300));
    }
  });

  if (ldMatches.length === 0) {
    console.log('\nPrimi 1500 caratteri HTML (per capire cosa ha restituito il sito):');
    console.log(html.replace(/\s+/g, ' ').slice(0, 1500));
  }

  await browser.close();
})();
