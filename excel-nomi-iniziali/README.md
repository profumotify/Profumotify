# Strumenti Rendicontazione Centri Diurni

App desktop in Java, **senza installazione**: è un unico file `.jar`
eseguibile che si avvia con un doppio click (o con `java -jar`), pensata per
i computer dove non è possibile installare programmi. Contiene due
strumenti, in due schede della stessa finestra.

## Requisiti

Serve solo una Java Runtime (JRE) già presente sul computer — versione 8 o
superiore. Non è richiesta alcuna installazione di software aggiuntivo: il
file `ExcelNomiIniziali.jar` generato è autonomo (contiene già tutte le
librerie necessarie).

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

## Scheda 2 — Rimborsi Comuni

A partire dai file di rendicontazione mensile (fogli standard ASL
"DSS... - All. B e C"), calcola per ogni **comune di residenza** degli
utenti quanto richiedere a rimborso per il trasporto.

### Logica di calcolo

Per ogni utente, il file di rendicontazione riporta già l'importo pieno del
trasporto del mese (colonna "Rimborso ASL BA" nel blocco Trasporti),
calcolato come `giorni di trasporto × tariffa giornaliera` (14,50 € oppure
11,39 € a seconda del "Buono servizio trasporto"). Di questo importo pieno:

- il **40%** resta a carico dell'ASL;
- il **60%** è la quota a carico del Comune di residenza dell'utente, da
  richiedere a rimborso.

(Split confermato sul modulo ufficiale "Mod_Ut_TRASPORTI", foglio "Divis.
x DSS-Comune": `Quota parte Comune = Importo Trasporto × 0.6`.)

La frequenza (retta giornaliera) resta interamente a carico ASL e non viene
ripartita sui comuni.

### Cosa genera

1. **Aggiungi file...** → carica uno o più file di rendicontazione
   mensile (va bene anche la versione già anonimizzata: lo strumento non
   ha bisogno dei nomi reali, solo di comune/giorni/importi).
2. Premi **Calcola rimborsi**. Per ogni file caricato viene creato un file
   `<nome file>_rimborsi_comuni.xlsx` con:
   - un foglio **Riepilogo** con i totali per comune (utenti, giorni e
     importi di frequenza e trasporto, quota ASL 40%, quota Comune 60%);
   - un foglio per ciascun comune con il dettaglio riga per riga degli
     utenti di quel comune (nominativo, giorni, importi) — pronto per
     essere estratto/inoltrato al singolo comune.
3. Se carichi più di un mese, viene generato anche un file
   `Riepilogo_Comuni_<periodo>.xlsx` con gli stessi fogli ma aggregati
   sull'intero periodo caricato (es. un semestre), con il dettaglio
   mese-per-mese in ogni foglio comune e i totali di periodo nel
   riepilogo.

### Verifica

Il calcolo è stato validato sui dati reali di 5 mesi (147 utenti/mese):
zero differenze rispetto al ricalcolo indipendente riga per riga.

## Note tecniche comuni

- Il riconoscimento delle colonne è basato sul testo esatto
  dell'intestazione (case-insensitive) o, per i rimborsi, sulla posizione
  standard del modulo regionale ASL BA (validata controllando che
  l'intestazione della colonna comune contenga "comune"): funziona quindi
  anche se lo schema cambia leggermente da mese a mese o da centro a
  centro, purché resti quello standard.
- I file originali non vengono mai modificati: ogni elaborazione genera
  nuovi file.
