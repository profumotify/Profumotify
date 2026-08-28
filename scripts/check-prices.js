// ============================================================
// CONTROLLO PREZZI PROFUMOTIFY
// Gira su GitHub Actions (server-side, niente CORS): controlla il
// prezzo reale su Notino per ogni profumo con link diretto confermato,
// confronta con lo storico salvato in price-history.json, e manda un
// alert Telegram sui cali di prezzo significativi.
//
// Nota onesta: monitoriamo solo i profumi con un link Notino diretto
// verificato (non quelli con solo un link di ricerca) perché per
// quelli non abbiamo un URL di prodotto stabile da controllare.
// ============================================================

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { perfumeDB } = require('../data.js');

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const HISTORY_PATH = path.join(__dirname, '..', 'price-history.json');
const DROP_THRESHOLD_PCT = 5; // segnala solo cali >= 5%
const REQUEST_DELAY_MS = 1500; // non martellare Notino di richieste

function loadHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function saveHistory(history) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2) + '\n');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Il campo "size" in data.js è tipo "105ml" — estrae il numero.
function parseSizeMl(sizeStr) {
  const m = (sizeStr || '').match(/(\d+(?:[.,]\d+)?)\s*ml/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}

// Notino elenca ogni formato (10ml, 30ml, 105ml...) come un'Offer
// separata nello stesso array "offers" — senza scegliere in base alla
// taglia, si rischia di prendere il prezzo di una confezione diversa
// da quella che teniamo in collezione. Sceglie, in ordine: la taglia
// esatta; altrimenti la più vicina per eccesso; altrimenti la più
// grande disponibile sotto la taglia target. Preferisce le offerte
// disponibili (InStock) quando ce n'è scelta.
function pickOffer(offers, targetMl) {
  const parsed = offers
    .map(o => ({ ...o, ml: parseSizeMl(o.name), price: parseFloat(o.price ?? o.lowPrice) }))
    .filter(o => o.ml != null && !isNaN(o.price));

  if (parsed.length === 0) return null;
  if (targetMl == null) return parsed[0];

  const inStock = parsed.filter(o => !o.availability || /InStock/i.test(o.availability));
  const pool = inStock.length > 0 ? inStock : parsed;

  const exact = pool.find(o => o.ml === targetMl);
  if (exact) return exact;

  const bigger = pool.filter(o => o.ml > targetMl).sort((a, b) => a.ml - b.ml);
  if (bigger.length > 0) return bigger[0];

  const smaller = pool.filter(o => o.ml < targetMl).sort((a, b) => b.ml - a.ml);
  if (smaller.length > 0) return smaller[0];

  return pool[0];
}

// Un blocco JSON-LD può annidare il vero Product in punti diversi a
// seconda del tipo di pagina: un array diretto, un @graph (schema
// ibrido), o - come nelle pagine "CollectionPage" di Notino per un
// prodotto con una sola variante - dentro mainEntity. Appiattisce
// tutto in una lista piatta di nodi da controllare.
function flattenJsonLd(data, out = []) {
  if (!data) return out;
  if (Array.isArray(data)) {
    data.forEach(d => flattenJsonLd(d, out));
    return out;
  }
  out.push(data);
  if (data['@graph']) flattenJsonLd(data['@graph'], out);
  if (data.mainEntity) flattenJsonLd(data.mainEntity, out);
  return out;
}

// Estrae prezzo e valuta da una pagina prodotto, per la confezione da
// targetMl millilitri. Prova prima i dati strutturati JSON-LD
// (schema.org Product/Offer, lo standard che i grandi e-commerce
// usano per la SEO ed è molto più stabile di uno scraping basato su
// classi CSS), poi qualche meta tag comune come fallback (che però
// non permette di scegliere la taglia).
function extractPrice(html, targetMl) {
  const ldMatches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of ldMatches) {
    try {
      const data = JSON.parse(m[1].trim());
      const candidates = flattenJsonLd(data);
      for (const item of candidates) {
        const offer = item.offers;
        if (!offer) continue;
        const offerList = Array.isArray(offer) ? offer : [offer];

        const picked = pickOffer(offerList, targetMl);
        if (picked) {
          return { price: picked.price, currency: picked.priceCurrency || 'EUR', matchedMl: picked.ml };
        }
        // Nessuna offerta ha una taglia riconoscibile nel nome: unico
        // prezzo disponibile, non possiamo scegliere per taglia.
        const o = offerList[0];
        const price = parseFloat(o.price ?? o.lowPrice);
        if (!isNaN(price)) {
          return { price, currency: o.priceCurrency || 'EUR', matchedMl: null };
        }
      }
    } catch {
      // JSON-LD malformato o non pertinente, si prova il prossimo blocco
    }
  }

  const metaPrice = html.match(/<meta[^>]+(?:property|itemprop)=["'](?:product:price:amount|price)["'][^>]+content=["']([\d.,]+)["']/i);
  if (metaPrice) {
    return { price: parseFloat(metaPrice[1].replace(',', '.')), currency: 'EUR', matchedMl: null };
  }

  throw new Error('Prezzo non trovato nella pagina (struttura HTML cambiata?)');
}

// Una richiesta HTTP "nuda" (senza JS, senza fingerprint da browser vero)
// viene bloccata con un 403 dalla protezione anti-bot di Notino prima
// ancora di arrivare all'HTML. Usiamo quindi un vero browser headless:
// più lento, ma molto più simile a una visita reale.
let browserPromise = null;
function getBrowser() {
  if (!browserPromise) browserPromise = chromium.launch();
  return browserPromise;
}

async function closeBrowser() {
  if (browserPromise) await (await browserPromise).close();
}

async function fetchPrice(url, targetMl) {
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    locale: 'it-IT'
  });
  try {
    const page = await context.newPage();
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    if (!res) throw new Error('Nessuna risposta dalla pagina');
    if (!res.ok()) throw new Error(`HTTP ${res.status()}`);
    // Lascia respirare eventuale JS della pagina che popola il prezzo
    await page.waitForTimeout(1500);
    const html = await page.content();
    return extractPrice(html, targetMl);
  } finally {
    await context.close();
  }
}

async function sendTelegram(text) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID non configurati, salto invio. Messaggio che sarebbe stato inviato:\n' + text);
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  if (!res.ok) {
    console.error('Errore invio Telegram:', res.status, await res.text());
  }
}

async function main() {
  const history = loadHistory();
  const today = new Date().toISOString().slice(0, 10);

  const trackable = perfumeDB.filter(p => p.notino && !p.notino.includes('/search/'));
  console.log(`Controllo prezzi per ${trackable.length}/${perfumeDB.length} profumi (link Notino diretto confermato)...`);

  const alerts = [];
  const errors = [];

  for (const p of trackable) {
    const targetMl = parseSizeMl(p.size);
    try {
      const { price, currency, matchedMl } = await fetchPrice(p.notino, targetMl);
      const prev = history[p.id];

      if (targetMl != null && matchedMl != null && matchedMl !== targetMl) {
        console.log(`⚠️ ${p.brand} ${p.name}: in collezione è ${p.size}, ma su Notino oggi è disponibile solo la confezione da ${matchedMl}ml — uso quella.`);
      }

      // Confrontiamo con lo storico solo se la taglia rilevata è la
      // stessa dell'ultima volta: altrimenti un "calo" potrebbe essere
      // solo perché oggi risulta in vendita una confezione più piccola.
      // La serie storica invece tiene tutti i punti (anche a taglie
      // diverse), serve per il grafico nella scheda del profumo.
      const series = prev?.history ? [...prev.history] : [];
      const sameSizeEntries = series.filter(h => h.sizeMl === matchedMl);
      const lastSameSize = sameSizeEntries[sameSizeEntries.length - 1];

      if (lastSameSize) {
        const diff = price - lastSameSize.price;
        const diffPct = (diff / lastSameSize.price) * 100;
        if (diff < 0 && Math.abs(diffPct) >= DROP_THRESHOLD_PCT) {
          alerts.push(
            `📉 <b>${p.brand} ${p.name}</b> (${matchedMl ?? '?'}ml)\n` +
            `${lastSameSize.price.toFixed(2)}€ → <b>${price.toFixed(2)}€</b> (${diffPct.toFixed(0)}%)\n` +
            `${p.notino}`
          );
        }
        const lowestSoFar = Math.min(...sameSizeEntries.map(h => h.price));
        if (price < lowestSoFar) {
          alerts.push(
            `🏆 <b>${p.brand} ${p.name}</b> (${matchedMl ?? '?'}ml) è al minimo storico: <b>${price.toFixed(2)}€</b>\n${p.notino}`
          );
        }
      }

      const todayIdx = series.findIndex(h => h.date === today);
      const entry = { date: today, price, sizeMl: matchedMl };
      if (todayIdx >= 0) series[todayIdx] = entry; else series.push(entry);

      history[p.id] = { currency, history: series.slice(-180) };
    } catch (e) {
      errors.push(`${p.brand} ${p.name}: ${e.message}`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  await closeBrowser();
  saveHistory(history);

  if (alerts.length > 0) {
    const msg = `🌹 <b>Profumotify — Aggiornamento prezzi</b>\n\n${alerts.join('\n\n')}`;
    await sendTelegram(msg);
    console.log(`Inviato alert per ${alerts.length} variazioni.`);
  } else {
    console.log('Nessun calo di prezzo significativo oggi.');
  }

  if (errors.length > 0) {
    console.log(`\n⚠️ ${errors.length} profumi non controllabili in questa esecuzione:`);
    errors.forEach(e => console.log('  - ' + e));
  }
}

main().catch(async e => {
  console.error('Errore fatale:', e);
  await closeBrowser().catch(() => {});
  process.exit(1);
});
