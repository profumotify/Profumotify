# Profumotify v7.1 - Collezione di Giancarlo

## Novità v7.1
- ✅ **Login utenti multipli** (giancarlo / ospite)
- ✅ **Link acquisto** per ogni profumo: Fragrantica, Notino, Pinalli
- ✅ **Immagini Fragrantica** verificate per tutti i 49 profumi
- ✅ Sistema modulare a **4 file** per modifiche facili

## 📁 Files (4 file modulari)

| File | Dimensione | Descrizione |
|------|-----------|-------------|
| `index.html` | ~4 KB | Struttura HTML, user bar, logout |
| `style.css` | ~18 KB | Stili completi + login + link acquisto |
| `app.js` | ~18 KB | Logica + login system + modal con link |
| `data.js` | ~38 KB | Database 49 profumi + link reali + users |

## 🚀 Come usare

1. Scarica tutti e 4 i file nella **stessa cartella**
2. Apri `index.html` nel browser
3. Login: **giancarlo** / **bari2024** (o **ospite** / **ospite**)
4. Funziona offline (tranne immagini e link esterni)

## ✨ Funzionalità

- **Login utenti** con localStorage (ricorda l'accesso)
- **Meteo Bari** per stagione con consigli automatici
- **Link acquisto** in ogni scheda profumo: Fragrantica (info), Notino, Pinalli
- **Filtri** avanzati: ricerca, brand, famiglia, stagione
- **Statistiche** con grafici interattivi
- **Piramide note** olfattive più frequenti
- **Consigli** basati su stagione e meteo

## 🔧 Per sviluppatori

| Modifica | File |
|---|---|
| Aggiungere profumi | `data.js` → `perfumeDB` |
| Cambiare stili | `style.css` |
| Nuove funzioni | `app.js` |
| Struttura HTML | `index.html` |
| Aggiungere utenti | `data.js` → `usersDB` |
