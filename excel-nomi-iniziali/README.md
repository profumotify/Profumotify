# Anonimizzatore Nomi Excel

App desktop in Java, **senza installazione**: è un unico file `.jar`
eseguibile che si avvia con un doppio click (o con `java -jar`), pensata per
i computer dove non è possibile installare programmi.

## Cosa fa

Dato un gruppo di file Excel (es. i 12 file mensili dell'anno più eventuali
file aggiuntivi), l'app controlla **tutti i fogli di ogni file** (non solo
quelli che nel file di esempio contengono già dei nomi: se un foglio oggi è
vuoto ma in un mese futuro viene compilato, verrà comunque controllato) e:

1. Cerca in ogni foglio le colonne la cui intestazione è del tipo
   "Cognome e Nome" (o varianti configurabili: "Nome e Cognome",
   "Nominativo", ecc.) e sostituisce ogni nominativo trovato nella colonna
   con le sole iniziali delle parole che lo compongono, es.:
   - `Cuoccio Raffaella` → `C.R.`
   - `Maria Luisa De Rossi` → `M.L.D.R.` (doppio nome/cognome: un'iniziale
     per ogni parola)
2. Cerca inoltre nominativi scritti **in testo libero**, non in una
   colonna strutturata (es. moduli di dichiarazione, presa in carico o
   dimissione), riconoscendoli da una frase-ancora tipica della
   modulistica ("Il sottoscritto", "sig.ra", "dell'utente", ecc., anche
   questa configurabile) che li precede, sia quando il nome segue
   l'ancora nella stessa cella (es. *"La sottoscritta Suglia Lucia nata
   a..."* → *"La sottoscritta S.L. nata a..."*), sia quando si trova nella
   prima cella non vuota successiva sulla stessa riga.
3. Salva il risultato in **nuovi file** (con suffisso `_iniziali`), senza
   mai modificare o sovrascrivere i file originali. Tutto il resto del
   foglio (formule, importi, formattazione, altri fogli) resta invariato.

Il riconoscimento nel testo libero è volutamente prudente (richiede una
frase-ancora nota nelle vicinanze e che il testo candidato sia composto
solo da parole con iniziale maiuscola e resto minuscolo, per non alterare
per errore etichette o titoli scritti in maiuscolo): non è un
riconoscimento generico di "qualunque nome in qualunque punto del foglio",
ma copre in modo mirato la modulistica di questo tipo di documenti. Se in
un file compare un nome scritto secondo uno schema non ancora coperto,
basta aggiungere la frase che lo precede nel campo "Frasi-ancora" della
finestra dell'app.

## Requisiti

Serve solo una Java Runtime (JRE) già presente sul computer — versione 11
o superiore. Non è richiesta alcuna installazione di software aggiuntivo:
il file `ExcelNomiIniziali.jar` generato è autonomo (contiene già tutte le
librerie necessarie).

## Come costruire il file .jar

```bash
cd excel-nomi-iniziali
mvn clean package
```

Il file eseguibile viene creato in `target/ExcelNomiIniziali.jar`.

## Come usare l'app

Doppio click sul file `ExcelNomiIniziali.jar` (se Java è associato ai file
.jar), oppure da terminale:

```bash
java -jar ExcelNomiIniziali.jar
```

Nella finestra che si apre:

1. **Aggiungi file...** → seleziona i file Excel da elaborare (es. i 12
   mesi, uno alla volta o tutti insieme).
2. (Opzionale) Modifica le intestazioni riconosciute, se i tuoi file usano
   un'etichetta diversa da "Cognome e Nome".
3. (Opzionale) Scegli una cartella di destinazione diversa da quella dei
   file originali.
4. Premi **Elabora file**: per ogni file caricato viene creato un nuovo
   file `<nome originale>_iniziali.xlsx` con i nomi trasformati in
   iniziali. Il log in basso mostra quante colonne e quanti nominativi
   sono stati trovati per ciascun file.

## Note tecniche

- Alcuni fogli usano colonne "specchio" collegate tramite formule (es.
  `=IF(X9=0,"",X9)`): l'app trasforma il valore letterale e forza il
  ricalcolo delle formule, così anche le colonne collegate mostrano le
  iniziali corrette alla prima apertura del file in Excel.
- Il riconoscimento delle colonne è basato sul testo esatto
  dell'intestazione (case-insensitive), non sulla posizione della
  colonna: funziona quindi anche se lo schema cambia leggermente da mese a
  mese, purché l'intestazione resti una di quelle configurate.
