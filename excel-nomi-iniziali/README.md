# Strumenti Rendicontazione Centri Diurni

App desktop in Java, **senza installazione**: è un unico file `.jar`
eseguibile che si avvia con un doppio click (o con `java -jar`), pensata per
i computer dove non è possibile installare programmi. Contiene tre
strumenti, in tre schede della stessa finestra.

## Requisiti

Serve una Java Runtime (JRE) già presente sul computer — versione 8 o
superiore. Per le schede **Anonimizza Nomi** e **Rimborsi Comuni** non
serve altro: il file `ExcelNomiIniziali.jar` è autonomo (contiene già
tutte le librerie necessarie).

Per la scheda **Da PDF a Excel** serve anche **Tesseract OCR** installato
a parte (non è incluso nel jar: è un programma nativo, non una libreria
Java). Su Windows: scarica e installa l'eseguibile da
https://github.com/UB-Mannheim/tesseract/wiki (versione "UB Mannheim"),
assicurandoti di includere il pacchetto lingua **Italian** durante
l'installazione, e lascialo aggiungere al PATH di sistema (opzione
proposta dall'installer). Dopo l'installazione, nella scheda "Da PDF a
Excel" il pulsante "Verifica Tesseract" conferma se è stato trovato
correttamente.

## Come costruire il file .jar

```bash
cd excel-nomi-iniziali
mvn clean package
```

Il file eseguibile viene creato in `target/ExcelNomiIniziali.jar`. Si avvia
con doppio click (se Java è associato ai file .jar) oppure da terminale:

```bash
java -jar ExcelNomiIniziali.jar
```

---

## Scheda 1 — Anonimizza Nomi

Dato un gruppo di file Excel (es. i 12 file mensili dell'anno più eventuali
file aggiuntivi), sostituisce i nominativi con le sole iniziali, generando
**nuovi** file (suffisso `_iniziali`) senza mai toccare gli originali.

1. Cerca in ogni foglio le colonne la cui intestazione è del tipo
   "Cognome e Nome" (o varianti configurabili: "Nome e Cognome",
   "Nominativo", ecc.) e sostituisce ogni nominativo trovato con le sole
   iniziali delle parole che lo compongono, es.:
   - `Cuoccio Raffaella` → `C.R.`
   - `Maria Luisa De Rossi` → `M.L.D.R.` (doppio nome/cognome: un'iniziale
     per ogni parola)
2. Cerca inoltre nominativi scritti **in testo libero** (es. moduli di
   dichiarazione, presa in carico o dimissione), riconoscendoli da una
   frase-ancora tipica della modulistica ("Il sottoscritto", "sig.ra",
   "dell'utente", ecc., anche questa configurabile).
3. Controlla **tutti i fogli di ogni file**, anche quelli privi di dati nel
   file usato come esempio: se in un mese futuro vengono compilati,
   verranno comunque controllati.

### Colonne "specchio" collegate da formula

Alcuni fogli hanno colonne duplicate collegate da formula (es. una colonna
con `=IF(X9=0,"",X9)` che rispecchia un'altra colonna con il nome vero).
L'app individua anche queste celle, ne legge il valore già calcolato e lo
sostituisce con le iniziali **come testo statico** (non più come formula):
questo evita che il nome per esteso resti "in cache" nel file e sia ancora
leggibile da chi apre il file senza Excel (o senza farlo ricalcolare) — un
problema di privacy reale corretto in una versione precedente di questo
strumento. Se hai già distribuito o caricato online file `_iniziali`
generati prima di questa correzione, è opportuno rigenerarli con la
versione aggiornata.

L'app è inoltre **idempotente**: si può rilanciare in sicurezza su un file
già anonimizzato in precedenza, senza ulteriormente troncare le iniziali
già presenti.

### File di corrispondenza Nome↔Iniziali (opzionale)

Spuntando la casella "Genera anche un file di corrispondenza
Nome↔Iniziali", oltre ai file anonimizzati viene creato anche
`corrispondenza_nomi_RISERVATO.csv`, con una riga per ogni nominativo
originale distinto incontrato: nome per esteso, iniziali corrispondenti,
quante volte è comparso, e se quelle iniziali sono condivise anche da un
altro nominativo diverso (colonna "Collisione" — in quel caso le iniziali
da sole non bastano a risalire con certezza alla persona giusta).

**Questo file vanifica l'anonimizzazione se distribuito insieme ai file
`_iniziali`**: va tenuto solo sul tuo PC, per uso interno (es. per
riportare un elenco in iniziali al nominativo reale quando serve), mai
caricato online o inviato a terzi insieme ai file anonimizzati. Per
questo la casella è disattivata di default.

## Scheda 2 — Rimborsi Comuni

A partire dai file di rendicontazione mensile (fogli standard ASL
"DSS... - All. B e C"), calcola per ogni **comune di residenza** degli
utenti quanto richiedere a rimborso per il trasporto.

### Logica di calcolo

Per ogni utente, il file di rendicontazione riporta l'importo del trasporto
del mese come `giorni di trasporto × tariffa giornaliera`. La tariffa
piena è **14,50 €/giorno**; se l'utente usufruisce del "Buono servizio
trasporto" (colonna SI/NO), una parte del costo è già coperta dal buono e
la tariffa effettiva scende a **11,39 €/giorno** (sconto di 3,11 €/giorno).

La ripartizione 40% ASL / 60% Comune va calcolata sulla **tariffa piena**,
non sull'importo già scontato:

- la **quota ASL è sempre il 40% di 14,50 €/giorno**, non influenzata dal
  buono;
- la **quota Comune è il 60% di 14,50 €/giorno, meno l'intero sconto del
  buono servizio** (3,11 €/giorno nei giorni in cui è stato usato).

Le due quote sommate tornano sempre uguali all'importo effettivamente
registrato in rendicontazione (40%+60%-sconto = importo con/senza buono).
Lo sconto non va quindi tolto proporzionalmente da entrambe le quote: è
interamente a carico del Comune, perché il buono è uno strumento sociale
che riduce l'onere della famiglia/Comune, non quello dell'ASL.

(Split 40/60 confermato sul modulo ufficiale "Mod_Ut_TRASPORTI", foglio
"Divis. x DSS-Comune": `Quota parte Comune = Importo Trasporto × 0.6`.)

La frequenza (retta giornaliera) resta interamente a carico ASL e non viene
ripartita sui comuni.

### Cosa genera

1. **Aggiungi file...** → carica uno o più file di rendicontazione
   mensile, anche tutti e 12 i mesi dell'anno insieme (va bene anche la
   versione già anonimizzata: lo strumento non ha bisogno dei nomi reali,
   solo di comune/giorni/importi/anno di nascita).
2. Premi **Calcola rimborsi**. Per ogni file caricato viene creato un file
   `<nome file>_rimborsi_comuni.xlsx` con:
   - un foglio **Riepilogo** con i totali per comune (utenti, giorni e
     importi di frequenza e trasporto, quota ASL 40%, sconto buoni
     servizio, quota Comune da richiedere);
   - un foglio per ciascun comune, con **due sezioni**: in alto i
     **totali per utente nel periodo** (nominativo, anno di nascita, mesi
     coperti, giorni e importi totali, quota ASL e quota Comune) — questo
     è il dato pronto da comunicare al Comune, un utente per riga; sotto,
     il **dettaglio mensile** riga per riga per la tracciabilità interna.
3. Se carichi più file (es. tutti i 12 mesi), viene generato anche un
   file `Riepilogo_Comuni_<periodo>.xlsx` con la stessa struttura ma
   aggregata sull'intero periodo caricato (es. un anno intero): il
   riepilogo per comune e, per ciascun comune, i totali annui per utente
   più il dettaglio mese per mese.

### Anno di nascita e omonimie

Ogni riga riporta anche l'anno di nascita dell'utente (letto dalla
colonna "Data di nascita" della rendicontazione). Nel totale per utente,
se per lo stesso nominativo compaiono anni di nascita diversi tra un mese
e l'altro (segno di una probabile omonimia, due persone diverse con lo
stesso nome), viene mostrato un avviso (es. "1980/1990 ⚠") invece di un
anno solo, così non si sommano per errore gli importi di due persone
diverse. Lo stesso anno di nascita è utile anche per distinguere, nel
file di corrispondenza dell'Anonimizzatore, nominativi diversi che
generano le stesse iniziali.

### Verifica

Il calcolo è stato validato sui dati reali di 6 mesi (178 utenti/mese) e
su casi sintetici con buono servizio applicato in mesi alterni: zero
differenze rispetto al ricalcolo indipendente riga per riga.

---

## Scheda 3 — Da PDF a Excel

Converte un PDF **scansionato** di rendicontazione mensile (lo stesso
modulo standard ASL BA, stampato, firmato/timbrato e poi scansionato) in
un file Excel con la stessa struttura dei fogli "DSS... - All. B e C"
(un foglio per ogni distretto trovato), pronto per essere completato e
poi usato nelle altre due schede.

### Cosa legge in automatico, e cosa no

Il PDF scansionato è un'immagine, non testo: serve l'OCR (riconoscimento
ottico dei caratteri). I dati vengono letti direttamente dalle pagine
"Allegato A" (mese di riferimento) e "Allegato B" (la tabella densa per
distretto, una pagina per ogni DSS) — **non** dai moduli "G" (che in un
PDF scansionato da moduli cartacei compilati a mano sono spesso
illeggibili e comunque non sono richiesti). Testato su scansioni reali,
l'affidabilità varia a seconda del campo:

- **Mese di riferimento, numero del distretto DSS, nominativo, comune di
  residenza, data di nascita**: lettura ragionevolmente affidabile e
  riempita in automatico, con qualche imperfezione occasionale (es. una
  parola isolata di rumore OCR attaccata al nominativo) che si nota
  facilmente confrontando con il PDF.
- **Giorni di presenza, giorni di trasporto**: letti quando possibile, ma
  **restano sempre evidenziati in giallo** anche quando il valore letto
  sembra plausibile — nei test, letture apparentemente corrette per
  questi due campi si sono rivelate talvolta sbagliate (cifre scambiate),
  un rischio troppo alto per numeri che finiscono in richieste di
  rimborso reali. Vanno quindi sempre confrontati con il PDF riga per
  riga prima di fidarsene.
- **Buono servizio trasporto (SI/NO)**: letto quando il testo OCR lo
  rende come un token isolato riconoscibile; se non viene trovato, la
  cella resta vuota ed evidenziata in giallo (con menù a tendina SI/NO)
  da compilare a mano.
- Ogni riga la cui lettura risulta incompleta o incoerente (es. più
  giorni di trasporto che di presenza, fisicamente impossibile) viene
  **segnalata automaticamente** in colonna NOTE e nel log ("ATTENZIONE") —
  non viene mai lasciata passare silenziosamente come se fosse corretta.

### Come usare

1. Installa Tesseract OCR (vedi "Requisiti" sopra) e verifica con il
   pulsante "Verifica Tesseract" nella scheda.
2. **Aggiungi PDF...** → carica uno o più PDF scansionati.
3. Premi **Converti PDF**. Per ogni PDF viene creato un file
   `<nome file>_da_pdf.xlsx` con un foglio "All. \"A\"" (mese) e un foglio
   "DSS\<N\> - All. \"B\" e \"C\"" per ogni distretto trovato, con una riga
   per utente.
4. Apri il file generato: controlla **sempre** le celle evidenziate in
   giallo (giorni di presenza/trasporto sempre; comune e buono solo se
   mancanti) guardando la pagina "Allegato B" corrispondente del PDF
   originale, e verifica le righe segnalate in colonna NOTE.
5. Usa il file completato con l'Anonimizzatore e/o Rimborsi Comuni come
   un qualsiasi altro file di rendicontazione.

### Perché non è completamente automatico

La tabella densa "Allegato B" è scritta a macchina ma molto compatta, e
l'OCR a volte legge male un separatore di colonna o una cifra. Per i
campi testuali (nominativo, comune, data) questo è quasi sempre
recuperabile e visibile a colpo d'occhio se sbagliato; per le cifre
(giorni di presenza/trasporto) un errore di lettura può invece passare
inosservato se non segnalato — da qui la scelta di evidenziarle sempre
in giallo, qualunque sia il risultato letto. Il compromesso (automatico
dove l'errore si nota, sempre verificato a mano dove non si noterebbe)
privilegia la correttezza dei numeri sulla comodità.

## Note tecniche comuni

- Il riconoscimento delle colonne è basato sul testo esatto
  dell'intestazione (case-insensitive) o, per i rimborsi, sulla posizione
  standard del modulo regionale ASL BA (validata controllando che
  l'intestazione della colonna comune contenga "comune"): funziona quindi
  anche se lo schema cambia leggermente da mese a mese o da centro a
  centro, purché resti quello standard.
- I file originali non vengono mai modificati: ogni elaborazione genera
  nuovi file.
