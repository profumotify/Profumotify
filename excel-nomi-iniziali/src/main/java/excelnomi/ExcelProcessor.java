package excelnomi;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Cerca, in ogni foglio di un file Excel, sia le colonne la cui intestazione
 * corrisponde a un nominativo (es. "Cognome e Nome") sia i nominativi scritti
 * in testo libero (vedi {@link FreeTextNameRedactor}), sostituendoli con le
 * sole iniziali. Tutto il resto del file resta invariato (formule,
 * formattazione, altri fogli, ecc.). Il file originale non viene mai
 * toccato: il risultato viene scritto in un nuovo file.
 */
final class ExcelProcessor {

    static final List<String> DEFAULT_HEADER_KEYWORDS = Arrays.asList(
            "cognome e nome",
            "nome e cognome",
            "nominativo",
            "cognome nome",
            "nome cognome"
    );

    private static final Set<String> SKIP_VALUES = new HashSet<>(Arrays.asList(
            "totale", "totali", "tot", "subtotale", "sub totale", "note"
    ));

    private ExcelProcessor() {
    }

    static final class Result {
        final String inputFileName;
        final Path outputFile;
        final int columnsFound;
        final int namesTransformed;
        final int freeTextNamesTransformed;

        Result(String inputFileName, Path outputFile, int columnsFound, int namesTransformed,
               int freeTextNamesTransformed) {
            this.inputFileName = inputFileName;
            this.outputFile = outputFile;
            this.columnsFound = columnsFound;
            this.namesTransformed = namesTransformed;
            this.freeTextNamesTransformed = freeTextNamesTransformed;
        }
    }

    static Result process(Path inputFile, Path outputFile, List<String> headerKeywords,
                           List<String> freeTextAnchorPhrases) throws IOException {
        Set<String> normalizedKeywords = new HashSet<>();
        for (String keyword : headerKeywords) {
            String normalized = normalize(keyword);
            if (!normalized.isEmpty()) {
                normalizedKeywords.add(normalized);
            }
        }

        int columnsFound = 0;
        int namesTransformed = 0;
        int freeTextNamesTransformed = 0;

        try (InputStream in = Files.newInputStream(inputFile);
             Workbook workbook = WorkbookFactory.create(in)) {

            for (Sheet sheet : workbook) {
                List<int[]> headerCells = new ArrayList<>();
                for (Row row : sheet) {
                    for (Cell cell : row) {
                        if (cell.getCellType() == CellType.STRING) {
                            String normalized = normalize(cell.getStringCellValue());
                            if (normalizedKeywords.contains(normalized)) {
                                headerCells.add(new int[]{row.getRowNum(), cell.getColumnIndex()});
                            }
                        }
                    }
                }

                for (int[] headerLocation : headerCells) {
                    columnsFound++;
                    int headerRow = headerLocation[0];
                    int column = headerLocation[1];
                    int lastRow = sheet.getLastRowNum();

                    for (int r = headerRow + 1; r <= lastRow; r++) {
                        Row row = sheet.getRow(r);
                        if (row == null) {
                            continue;
                        }
                        Cell cell = row.getCell(column);
                        if (cell == null || cell.getCellType() != CellType.STRING) {
                            continue;
                        }
                        String value = cell.getStringCellValue();
                        if (!NameInitialsConverter.looksLikeName(value)) {
                            continue;
                        }
                        if (SKIP_VALUES.contains(normalize(value))) {
                            continue;
                        }
                        cell.setCellValue(NameInitialsConverter.toInitials(value));
                        namesTransformed++;
                    }
                }

                // Oltre alle colonne strutturate, cerchiamo nominativi scritti in
                // testo libero (es. moduli di dichiarazione/dimissione) riconosciuti
                // da una frase-ancora ("Il sottoscritto", "sig.ra", "dell'utente", ...).
                // Eseguito su ogni foglio, anche quelli senza colonne "Cognome e Nome".
                freeTextNamesTransformed += FreeTextNameRedactor.process(sheet, freeTextAnchorPhrases);
            }

            // Alcuni fogli hanno colonne "specchio" con formule tipo =IF(X9=0,"",X9):
            // forziamo il ricalcolo cosi' Excel le aggiorna aprendo il file, invece di
            // mostrare il vecchio valore (col nome per esteso) rimasto in cache.
            workbook.setForceFormulaRecalculation(true);

            Path parent = outputFile.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            try (OutputStream out = Files.newOutputStream(outputFile)) {
                workbook.write(out);
            }
        }

        return new Result(inputFile.getFileName().toString(), outputFile, columnsFound, namesTransformed,
                freeTextNamesTransformed);
    }

    private static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String normalized = value.toLowerCase(Locale.ITALIAN);
        normalized = normalized.replace('’', ' ')
                .replace('\'', ' ')
                .replace('"', ' ')
                .replace('“', ' ')
                .replace('”', ' ')
                .replace('/', ' ')
                .replace('-', ' ')
                .replace(':', ' ');
        normalized = normalized.trim().replaceAll("\\s+", " ");
        return normalized;
    }
}
