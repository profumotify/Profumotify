package excelnomi;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Legge un file di rendicontazione mensile (modulo standard ASL BA con i
 * fogli "DSS1 - All. B e C" ... "DSS14 - All. B e C") ed estrae, per ogni
 * utente elencato, comune di residenza, giorni/rimborso di frequenza e
 * giorni/rimborso di trasporto. Le posizioni delle colonne (B, E, N, O, Q,
 * R, S) corrispondono al modulo regionale standard, identico in tutti i
 * centri diurni; per sicurezza ogni foglio viene comunque validato
 * controllando che l'intestazione in colonna E contenga "comune" prima di
 * leggerne i dati.
 */
final class MonthlyReportParser {

    private static final int COL_NOME = 1;               // B
    private static final int COL_COMUNE = 4;              // E
    private static final int COL_GIORNI_FREQUENZA = 13;   // N
    private static final int COL_RIMBORSO_FREQUENZA = 14; // O
    private static final int COL_GIORNI_TRASPORTO = 16;   // Q
    private static final int COL_BUONO_TRASPORTO = 17;    // R
    private static final int COL_RIMBORSO_TRASPORTO = 18; // S

    private static final int HEADER_ROW_INDEX = 5; // riga 6
    private static final int FIRST_DATA_ROW_INDEX = 8; // riga 9

    private static final String[] MESI_ITALIANI = {
            "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
            "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
    };

    private MonthlyReportParser() {
    }

    static final class ParsedMonth {
        final String meseLabel;
        final int meseSortKey;
        final List<GuestMonthRecord> records;

        ParsedMonth(String meseLabel, int meseSortKey, List<GuestMonthRecord> records) {
            this.meseLabel = meseLabel;
            this.meseSortKey = meseSortKey;
            this.records = records;
        }
    }

    static ParsedMonth parse(Path file) throws IOException {
        try (InputStream in = Files.newInputStream(file);
             Workbook workbook = WorkbookFactory.create(in)) {

            int[] sortKeyHolder = new int[1];
            String meseLabel = readMeseLabel(workbook, sortKeyHolder);
            if (meseLabel == null) {
                meseLabel = stripExtension(file.getFileName().toString());
            }
            int meseSortKey = sortKeyHolder[0];

            List<GuestMonthRecord> records = new ArrayList<>();
            for (Sheet sheet : workbook) {
                if (!sheet.getSheetName().toUpperCase(Locale.ITALIAN).startsWith("DSS")) {
                    continue;
                }
                Row headerRow = sheet.getRow(HEADER_ROW_INDEX);
                if (headerRow == null) {
                    continue;
                }
                Cell comuneHeader = headerRow.getCell(COL_COMUNE);
                if (comuneHeader == null || comuneHeader.getCellType() != CellType.STRING
                        || !comuneHeader.getStringCellValue().toLowerCase(Locale.ITALIAN).contains("comune")) {
                    continue; // il foglio non ha la struttura attesa: lo saltiamo
                }

                int lastRow = sheet.getLastRowNum();
                for (int r = FIRST_DATA_ROW_INDEX; r <= lastRow; r++) {
                    Row row = sheet.getRow(r);
                    if (row == null) {
                        continue;
                    }
                    String nome = stringValue(row, COL_NOME);
                    String comune = stringValue(row, COL_COMUNE);
                    if (isBlank(nome) || isBlank(comune)) {
                        continue;
                    }
                    int giorniFrequenza = (int) Math.round(numericValue(row, COL_GIORNI_FREQUENZA));
                    double rimborsoFrequenza = numericValue(row, COL_RIMBORSO_FREQUENZA);
                    int giorniTrasporto = (int) Math.round(numericValue(row, COL_GIORNI_TRASPORTO));
                    double rimborsoTrasporto = numericValue(row, COL_RIMBORSO_TRASPORTO);
                    String buonoTrasporto = stringValue(row, COL_BUONO_TRASPORTO);

                    records.add(new GuestMonthRecord(meseLabel, meseSortKey, sheet.getSheetName(), nome.trim(),
                            comune.trim(), giorniFrequenza, rimborsoFrequenza, giorniTrasporto,
                            buonoTrasporto == null ? "" : buonoTrasporto.trim(), rimborsoTrasporto));
                }
            }
            return new ParsedMonth(meseLabel, meseSortKey, records);
        }
    }

    private static String readMeseLabel(Workbook workbook, int[] sortKeyHolder) {
        for (Sheet sheet : workbook) {
            String normalized = sheet.getSheetName().toLowerCase(Locale.ITALIAN).replace("\"", "").trim();
            if (!normalized.equals("all. a")) {
                continue;
            }
            for (int r = 0; r <= Math.min(sheet.getLastRowNum(), 20); r++) {
                Row row = sheet.getRow(r);
                if (row == null) {
                    continue;
                }
                for (Cell cell : row) {
                    if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                        Date date = cell.getDateCellValue();
                        Calendar cal = Calendar.getInstance();
                        cal.setTime(date);
                        // Riferimento fatture del mese/anno: e' sempre il 1' giorno del mese.
                        if (cal.get(Calendar.DAY_OF_MONTH) == 1) {
                            int year = cal.get(Calendar.YEAR);
                            int month = cal.get(Calendar.MONTH);
                            sortKeyHolder[0] = year * 100 + month;
                            return MESI_ITALIANI[month] + " " + year;
                        }
                    }
                }
            }
            return null;
        }
        return null;
    }

    private static String stripExtension(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot >= 0 ? fileName.substring(0, dot) : fileName;
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private static String stringValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) {
            return null;
        }
        CellType type = cell.getCellType();
        if (type == CellType.STRING) {
            return cell.getStringCellValue();
        }
        if (type == CellType.FORMULA) {
            // Colonne "specchio" (es. =IF(X9=0,"",X9)): leggiamo il risultato gia' calcolato.
            try {
                if (cell.getCachedFormulaResultType() == CellType.STRING) {
                    return cell.getStringCellValue();
                }
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }

    private static double numericValue(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) {
            return 0;
        }
        if (cell.getCellType() == CellType.NUMERIC || cell.getCellType() == CellType.FORMULA) {
            try {
                return cell.getNumericCellValue();
            } catch (Exception e) {
                return 0;
            }
        }
        return 0;
    }
}
