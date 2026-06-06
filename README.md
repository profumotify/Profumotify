# Profumotify v7 - Collezione di Giancarlo

## 📁 Files (4 file modulari)

| File | Dimensione | Descrizione |
|------|-----------|-------------|
| `index.html` | ~3 KB | Struttura HTML, linka CSS/JS/Data |
| `style.css` | ~15 KB | Tutti gli stili, responsive, dark theme |
| `app.js` | ~16 KB | Logica completa: filtri, modal, charts, consigli |
| `data.js` | ~36 KB | Database 49 profumi, note, meteo, statistiche |

## 🚀 Come usare

1. Scarica tutti e 4 i file nella **stessa cartella**
2. Apri `index.html` nel browser
3. Non serve server (offline friendly, tranne immagini Fragrantica)

## ✨ Funzionalità

- **Meteo Bari**: 4 stagioni con temp, umidità, condizioni
- **Consigli automatici**: basati su stagione corrente
- **Filtri**: ricerca testuale, brand, famiglia, stagione
- **Statistiche**: grafici brand/famiglie/stagioni/concentrazioni
- **Piramide note**: più frequenti per testa/cuore/fondo
- **Modal dettagli**: piramide completa, descrizione, metriche
- **Design**: dark/gold, responsive, animazioni

## 📊 Dati collezione

- **49 profumi** totali
- **Brand principali**: Lattafa (16), LPDO (5), Armaf (3), Al Haramain (3), CK (3), Davidoff (2), Anfar (2), Khadlaj (2)
- **Concentrazioni**: EDP (42), EDT (6), Extrait (1)

## 🔧 Per sviluppatori / future modifiche

- **Aggiungere profumi**: modifica solo `data.js` → array `perfumeDB`
- **Cambiare stili**: modifica solo `style.css`
- **Aggiungere funzioni**: modifica solo `app.js`
- **Struttura HTML**: modifica solo `index.html`
