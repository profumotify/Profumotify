package excelnomi;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Estrae mese/anno di riferimento dal testo OCR della pagina "Allegato A". */
final class AllegatoAExtractor {

    private static final String[] MESI = {
            "gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
            "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"
    };

    private static final Pattern MESE_ANNO = Pattern.compile(
            "(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)"
                    + "\\s*/\\s*(\\d{4})", Pattern.CASE_INSENSITIVE);

    private AllegatoAExtractor() {
    }

    static boolean looksLikeAllegatoA(String ocrText) {
        String lower = ocrText.toLowerCase();
        return lower.contains("riferimento") && lower.contains("mese") && lower.contains("anno")
                || (lower.contains("spesa frequenza") && lower.contains("distretti"));
    }

    static final class Estratto {
        String meseLabel;
        int meseSortKey;
    }

    static Estratto parse(String ocrText) {
        Matcher m = MESE_ANNO.matcher(ocrText);
        if (!m.find()) {
            return null;
        }
        String meseNome = m.group(1).toLowerCase();
        int anno = Integer.parseInt(m.group(2));
        int meseIdx = -1;
        for (int i = 0; i < MESI.length; i++) {
            if (MESI[i].equals(meseNome)) {
                meseIdx = i;
                break;
            }
        }
        if (meseIdx < 0) {
            return null;
        }
        Estratto e = new Estratto();
        e.meseLabel = Character.toUpperCase(meseNome.charAt(0)) + meseNome.substring(1) + " " + anno;
        e.meseSortKey = anno * 100 + meseIdx;
        return e;
    }
}
