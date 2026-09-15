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
 * Cerca, in ogni foglio di un file Excel, le colonne la cui intestazione
 * corrisponde a un nominativo (es. "Cognome e Nome") e ne sostituisce i
 * valori con le sole iniziali, lasciando invariato tutto il resto del file
 * (formule, formattazione, altri fogli, ecc.). Il file originale non viene
 * mai toccato: il risultato viene scritto in un nuovo file.
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

        Result(String inputFileName, Path outputFile, int columnsFound, int namesTransformed) {
            this.inputFileName = inputFileName;
            this.outputFile = outputFile;
            this.columnsFound = columnsFound;
            this.namesTransformed = namesTransformed;
        }
    }

    static Result process(Path inputFile, Path outputFile, List<String> headerKeywords) throws IOException {
        Set<String> normalizedKeywords = new HashSet<>();
        for (String keyword : headerKeywords) {
            String normalized = normalize(keyword);
            if (!normalized.isEmpty()) {
                normalizedKeywords.add(normalized);
            }
        }

        int columnsFound = 0;
        int namesTransformed = 0;

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

        return new Result(inputFile.getFileName().toString(), outputFile, columnsFound, namesTransformed);
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
