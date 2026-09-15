package excelnomi;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Individua nominativi scritti in testo libero (non sotto una colonna
 * "Cognome e Nome"), riconoscendoli da una frase-ancora tipica della
 * modulistica ("Il sottoscritto", "sig.ra", "dell'utente", ...) che li
 * precede. Copre due casi:
 * <ul>
 *   <li>il nome segue l'ancora nella stessa cella, es.
 *       "La sottoscritta Suglia Lucia nata a Bari il ..." -&gt;
 *       "La sottoscritta S.L. nata a Bari il ...";</li>
 *   <li>l'ancora e' un'etichetta a se' stante e il nome si trova nella
 *       prima cella non vuota successiva sulla stessa riga, es.
 *       "Dimissione del sig./sig.ra" | "Mario Rossi" -&gt; "M.R.".</li>
 * </ul>
 * Non essendoci un'intestazione di colonna da cercare, l'euristica e'
 * volutamente prudente: richiede che il testo candidato sia composto
 * solo da 2-5 parole che iniziano tutte con lettera maiuscola, per
 * evitare di alterare etichette o altro testo del modulo.
 */
final class FreeTextNameRedactor {

    static final List<String> DEFAULT_ANCHOR_PHRASES = Arrays.asList(
            "il sottoscritto",
            "la sottoscritta",
            "dell'utente",
            "dell'ospite",
            "sig.ra",
            "sig."
    );

    // Una "parola nome": iniziale maiuscola seguita SOLO da minuscole (es. "Rossi", "Sant'Anna").
    // Deliberatamente non accetta altre maiuscole nel corpo della parola, cosi' da escludere
    // etichette/titoli scritti in MAIUSCOLO (es. "DELL'OSPITE", "FREQUENZA") che altrimenti
    // verrebbero scambiati per nomi propri.
    private static final String NAME_WORD = "\\p{Lu}[\\p{Ll}'\\u2019\\-]*";

    private static final Pattern STRICT_FULL_NAME =
            Pattern.compile("^" + NAME_WORD + "(?:\\s+" + NAME_WORD + "){1,4}$");

    private static final Pattern NAME_AFTER_ANCHOR =
            Pattern.compile("\\s*(" + NAME_WORD + "(?:\\s+" + NAME_WORD + "){1,4})");

    private static final int MAX_COLUMNS_TO_SCAN_RIGHT = 30;

    private FreeTextNameRedactor() {
    }

    static int process(Sheet sheet, List<String> anchorPhrases) {
        List<String> sortedAnchors = new ArrayList<>();
        for (String phrase : anchorPhrases) {
            String normalized = phrase.trim().toLowerCase(Locale.ITALIAN);
            if (!normalized.isEmpty()) {
                sortedAnchors.add(normalized);
            }
        }
        // Le ancore piu' lunghe vanno provate per prime (es. "sig.ra" prima di "sig.")
        // altrimenti quella piu' corta, che ne e' un prefisso, la intercetterebbe prima.
        sortedAnchors.sort(Comparator.comparingInt(String::length).reversed());

        int transformed = 0;
        for (Row row : sheet) {
            for (Cell cell : row) {
                if (cell.getCellType() != CellType.STRING) {
                    continue;
                }
                String text = cell.getStringCellValue();
                String lower = text.toLowerCase(Locale.ITALIAN);

                for (String anchor : sortedAnchors) {
                    int idx = lower.indexOf(anchor);
                    if (idx < 0) {
                        continue;
                    }
                    int afterAnchor = idx + anchor.length();
                    String suffix = text.substring(afterAnchor);
                    Matcher matcher = NAME_AFTER_ANCHOR.matcher(suffix);

                    if (matcher.lookingAt()) {
                        String namePart = matcher.group(1);
                        String initials = NameInitialsConverter.toInitials(namePart);
                        int start = afterAnchor + matcher.start(1);
                        int end = afterAnchor + matcher.end(1);
                        String newText = text.substring(0, start) + initials + text.substring(end);
                        cell.setCellValue(newText);
                        transformed++;
                    } else if (transformInFirstCellToTheRight(row, cell.getColumnIndex())) {
                        transformed++;
                    }
                    break; // una sola ancora per cella
                }
            }
        }
        return transformed;
    }

    private static boolean transformInFirstCellToTheRight(Row row, int anchorColumn) {
        int limit = Math.min(anchorColumn + 1 + MAX_COLUMNS_TO_SCAN_RIGHT, row.getLastCellNum());
        for (int col = anchorColumn + 1; col < limit; col++) {
            Cell candidate = row.getCell(col);
            if (candidate == null) {
                continue;
            }
            // Ci fermiamo alla prima cella non vuota incontrata: e' quella pensata
            // per contenere il nome (le altre nel mezzo sono vuote/unite col merge).
            if (candidate.getCellType() == CellType.STRING) {
                String value = candidate.getStringCellValue().trim();
                if (STRICT_FULL_NAME.matcher(value).matches()) {
                    candidate.setCellValue(NameInitialsConverter.toInitials(value));
                    return true;
                }
            }
            return false;
        }
        return false;
    }
}
