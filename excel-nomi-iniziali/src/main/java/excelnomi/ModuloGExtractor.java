package excelnomi;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Estrae i dati di un singolo utente dal testo OCR di una pagina "Modulo G"
 * (autocertificazione famiglia). Pagina semplice, campi isolati e in
 * stampatello: molto piu' affidabile della tabella densa "Allegato B".
 * Non fornisce pero' il Comune di residenza ne' il flag "Buono servizio
 * trasporto": questi vanno aggiunti a mano dall'utente guardando il PDF.
 */
final class ModuloGExtractor {

    private static final Pattern UTENTE_NASCITA = Pattern.compile(
            "dell.{0,3}utente\\s+(.+?)\\s+nat[oa/]+\\s+il\\s+(\\d{1,2}/\\d{1,2}/\\d{4})",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern TRASPORTI = Pattern.compile(
            "trasporti\\s+effettuati\\s+nel\\s+mese\\D*(\\d{1,3})", Pattern.CASE_INSENSITIVE);

    private static final Pattern NUMERIC_TOKEN = Pattern.compile("^(\\d{1,2}|[oO])$");
    private static final Pattern STRIP_NOISE = Pattern.compile("[^0-9oO]");

    private ModuloGExtractor() {
    }

    static boolean looksLikeModuloG(String ocrText) {
        String lower = ocrText.toLowerCase();
        return lower.contains("autocertificazione") && lower.contains("trasporti effettuati");
    }

    static final class Estratto {
        String nominativo;
        String dataNascita;
        Integer giorniPresenza;
        Integer giorniAssenza;
        Integer giorniTrasporto;
        boolean completo;
    }

    static Estratto parse(String ocrText) {
        Estratto e = new Estratto();

        Matcher m = UTENTE_NASCITA.matcher(ocrText);
        if (m.find()) {
            e.nominativo = cleanupNome(m.group(1));
            e.dataNascita = m.group(2);
        }

        for (String line : ocrText.split("\\r?\\n")) {
            if (line.contains("€")) { // riga con la quota sociale in euro
                int euroIdx = line.indexOf('€');
                String before = line.substring(0, euroIdx);
                java.util.List<String> tokens = new java.util.ArrayList<>();
                for (String raw : before.split("\\s+")) {
                    // Rimuoviamo i caratteri di disturbo tipici dell'OCR (graffe, pipe,
                    // parentesi) rimasti attaccati al numero, es. "{24" o "o]".
                    String tok = STRIP_NOISE.matcher(raw).replaceAll("");
                    if (NUMERIC_TOKEN.matcher(tok).matches()) {
                        tokens.add(tok);
                    }
                }
                if (tokens.size() >= 2) {
                    e.giorniPresenza = toInt(tokens.get(tokens.size() - 2));
                    e.giorniAssenza = toInt(tokens.get(tokens.size() - 1));
                }
                break;
            }
        }

        Matcher mt = TRASPORTI.matcher(ocrText);
        if (mt.find()) {
            e.giorniTrasporto = Integer.parseInt(mt.group(1));
        }

        e.completo = e.nominativo != null && e.dataNascita != null
                && e.giorniPresenza != null && e.giorniTrasporto != null
                // Controllo di coerenza: non si puo' essere stati trasportati in piu'
                // giorni di quanti si e' stati presenti. Se risulta il contrario e'
                // quasi certamente un errore di lettura OCR su una cifra.
                && e.giorniPresenza >= e.giorniTrasporto
                && e.giorniPresenza <= 31 && e.giorniTrasporto <= 31;
        return e;
    }

    private static int toInt(String token) {
        if (token.equalsIgnoreCase("o")) {
            return 0;
        }
        return Integer.parseInt(token);
    }

    private static String cleanupNome(String raw) {
        return raw.replaceAll("[|_]", "").replaceAll("\\s+", " ").trim();
    }
}
