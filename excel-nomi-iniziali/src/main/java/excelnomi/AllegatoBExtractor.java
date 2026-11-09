package excelnomi;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Estrae le righe utente dal testo OCR di una pagina "Allegato B" (tabella
 * densa per distretto: Cognome e Nome, Comune di residenza, Data di
 * nascita, giorni di presenza/trasporto, Buono servizio trasporto).
 * <p>
 * A differenza del tentativo iniziale (basato sulla posizione delle
 * singole parole e sul numero di riga "n. progr." letto dall'OCR, che si
 * e' rivelato inaffidabile), qui si lavora riga di testo per riga di
 * testo: ogni riga non vuota viene processata nell'ordine in cui compare,
 * senza fidarsi del numero progressivo (che puo' essere letto male senza
 * per questo invalidare il resto della riga). I valori numerici vengono
 * letti per prossimita' rispetto all'ancora piu' affidabile della riga,
 * il flag SI/NO del "Buono servizio trasporto".
 */
final class AllegatoBExtractor {

    private static final Pattern DSS_NUMBER = Pattern.compile("DSS\\s*n\\.?\\s*(\\d{1,2})", Pattern.CASE_INSENSITIVE);

    // Il separatore tra nominativo e comune nell'OCR e' inaffidabile: a volte e'
    // una barra verticale "|", a volte viene letto come "]", a volte manca del
    // tutto (solo uno spazio). Il comune e' quasi sempre un'unica parola in
    // maiuscolo: si cattura quindi come l'ultima parola singola immediatamente
    // prima della data di nascita, qualunque sia (o non sia) il separatore
    // davanti ad essa, e tutto il resto prima di quella parola e' il nominativo.
    private static final Pattern ROW_START = Pattern.compile(
            "([A-ZÀ-Ý][A-ZÀ-Ý'.\\s]{2,45}?)\\s*[|\\]]?\\s*([A-ZÀ-Ý.]{3,20})\\s*[|\\]]?\\s*(\\d{1,2}/\\d{1,2}/\\d{4})",
            Pattern.CASE_INSENSITIVE);

    // "SI" viene talvolta letto dall'OCR come "sì"/"SÌ" (accento, non solo
    // maiuscolo/minuscolo): CASE_INSENSITIVE da solo non lo riconosce perche'
    // "ì" non e' la stessa lettera di "i", serve elencarlo esplicitamente.
    // \b di default considera "parola" solo i caratteri ASCII: senza
    // UNICODE_CHARACTER_CLASS, un confine giusto dopo la "ì" accentata non
    // verrebbe riconosciuto come tale (ì non e' \w in ASCII) e il match
    // fallirebbe sempre per la variante accentata.
    private static final Pattern BUONO_TOKEN = Pattern.compile("\\b(S[IÌì]|NO)\\b",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CHARACTER_CLASS);

    private static final Pattern SMALL_INT = Pattern.compile("(\\d{1,2})");
    private static final Pattern DATE = Pattern.compile("\\d{1,2}/\\d{1,2}/\\d{4}");

    // Apostrofi/virgolette "intelligenti" letti dall'OCR (es. davanti a un
    // comune) non fanno parte della classe di caratteri di ROW_START e
    // spezzerebbero il match a meta' parola: si neutralizzano a spazio prima
    // di ogni confronto.
    private static final Pattern NOISE_PUNCT = Pattern.compile(
            "[‘’“”‚„«»–—]");

    private AllegatoBExtractor() {
    }

    static boolean looksLikeAllegatoB(String ocrText) {
        String lower = ocrText.toLowerCase();
        return lower.contains("distretto") && (lower.contains("cognome e nome") || lower.contains("ognome e nome"))
                && (lower.contains("rimborso") || lower.contains("trasport"));
    }

    static Integer extractDssNumber(String ocrText) {
        Matcher m = DSS_NUMBER.matcher(ocrText);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    static final class Riga {
        String nominativo;
        String comune;
        String dataNascita;
        Integer giorniPresenza;
        Integer giorniTrasporto;
        String buonoTrasporto;
        boolean completa;
    }

    static List<Riga> parseRows(String ocrText) {
        List<Riga> righe = new ArrayList<>();
        for (String rawLine : ocrText.split("\\r?\\n")) {
            String line = NOISE_PUNCT.matcher(rawLine).replaceAll(" ");
            Matcher start = ROW_START.matcher(line);
            if (!start.find()) {
                continue; // riga senza un nominativo+comune+data riconoscibili: probabilmente vuota/rumore
            }

            Riga r = new Riga();
            r.nominativo = cleanup(start.group(1));
            r.comune = cleanup(start.group(2));
            r.dataNascita = start.group(3);

            String tail = line.substring(start.end());
            Matcher buono = BUONO_TOKEN.matcher(tail);
            if (buono.find()) {
                // Normalizzato a "SI"/"NO" puri (senza accento) anche se letto come
                // "sì"/"SÌ": l'accento e' solo rumore OCR, e la colonna Excel usa
                // una validazione a tendina con le sole stringhe "SI"/"NO".
                r.buonoTrasporto = buono.group(1).toUpperCase().startsWith("S") ? "SI" : "NO";
                String beforeBuono = tail.substring(0, buono.start());
                // Il numero di giorni di trasporto e' l'intero isolato piu' vicino,
                // immediatamente prima del flag SI/NO sulla stessa riga.
                r.giorniTrasporto = lastSmallInt(beforeBuono);

                // Tra la data di nascita e il flag SI/NO ci sono ANCORA tre date
                // (autorizzazione DSS dal/al, data presa in carico): saltiamo fino
                // all'ultima di queste prima di cercare "ore autoriz." e "giorni di
                // presenza", che sono i primi due numeri dopo di esse.
                Matcher dateMatcher = DATE.matcher(beforeBuono);
                int afterLastDate = 0;
                while (dateMatcher.find()) {
                    afterLastDate = dateMatcher.end();
                }
                String numericTail = beforeBuono.substring(afterLastDate);
                List<Integer> leading = allSmallInts(numericTail);
                if (leading.size() >= 2) {
                    r.giorniPresenza = leading.get(1); // 0=ore autoriz. pro-die, 1=giorni presenza
                } else if (leading.size() == 1) {
                    r.giorniPresenza = leading.get(0);
                }
            }

            r.completa = r.nominativo != null && !r.nominativo.isEmpty()
                    && r.comune != null && !r.comune.isEmpty()
                    && r.dataNascita != null
                    && r.giorniPresenza != null && r.giorniTrasporto != null
                    && r.buonoTrasporto != null
                    && r.giorniPresenza >= r.giorniTrasporto
                    && r.giorniPresenza <= 31 && r.giorniTrasporto <= 31;

            righe.add(r);
        }
        return righe;
    }

    private static Integer lastSmallInt(String text) {
        Matcher m = SMALL_INT.matcher(text);
        Integer last = null;
        while (m.find()) {
            last = Integer.parseInt(m.group(1));
        }
        return last;
    }

    private static List<Integer> allSmallInts(String text) {
        List<Integer> result = new ArrayList<>();
        Matcher m = SMALL_INT.matcher(text);
        while (m.find()) {
            result.add(Integer.parseInt(m.group(1)));
        }
        return result;
    }

    private static String cleanup(String raw) {
        return raw.replaceAll("[|_]", "").replaceAll("\\s+", " ").trim();
    }
}
