package excelnomi;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Aggrega le righe {@link GuestMonthRecord} per comune di residenza e
 * genera i file Excel di riepilogo: un file per mese (riepilogo comuni +
 * un foglio di dettaglio per comune) e un file di riepilogo per l'intero
 * periodo caricato (es. un semestre).
 */
final class ComuneReportBuilder {

    private ComuneReportBuilder() {
    }

    static final class ComuneTotals {
        int righe;
        int giorniFrequenza;
        double rimborsoFrequenza;
        int giorniTrasporto;
        double rimborsoTrasportoPieno;

        double quotaAsl() {
            return rimborsoTrasportoPieno * GuestMonthRecord.QUOTA_ASL_TRASPORTO;
        }

        double quotaComune() {
            return rimborsoTrasportoPieno * GuestMonthRecord.QUOTA_COMUNE_TRASPORTO;
        }
    }

    static void writeReport(String titoloRiepilogo, String rigaLabelUtenti, List<GuestMonthRecord> records,
                             Path outputFile) throws IOException {
        Map<String, ComuneTotals> totals = aggregatePerComune(records);
        Map<String, List<GuestMonthRecord>> byComune = groupByComune(records);

        try (Workbook workbook = new XSSFWorkbook()) {
            writeRiepilogoSheet(workbook, "Riepilogo", titoloRiepilogo, rigaLabelUtenti, totals);
            for (Map.Entry<String, List<GuestMonthRecord>> entry : byComune.entrySet()) {
                writeDettaglioComuneSheet(workbook, uniqueSheetName(workbook, entry.getKey()), entry.getValue());
            }

            Path parent = outputFile.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            try (OutputStream out = Files.newOutputStream(outputFile)) {
                workbook.write(out);
            }
        }
    }

    private static Map<String, ComuneTotals> aggregatePerComune(List<GuestMonthRecord> records) {
        Map<String, ComuneTotals> totals = new TreeMap<>();
        for (GuestMonthRecord record : records) {
            ComuneTotals t = totals.computeIfAbsent(record.comune, k -> new ComuneTotals());
            t.righe++;
            t.giorniFrequenza += record.giorniFrequenza;
            t.rimborsoFrequenza += record.rimborsoFrequenza;
            t.giorniTrasporto += record.giorniTrasporto;
            t.rimborsoTrasportoPieno += record.rimborsoTrasportoPieno;
        }
        return totals;
    }

    private static Map<String, List<GuestMonthRecord>> groupByComune(List<GuestMonthRecord> records) {
        Map<String, List<GuestMonthRecord>> byComune = new TreeMap<>();
        for (GuestMonthRecord record : records) {
            byComune.computeIfAbsent(record.comune, k -> new ArrayList<>()).add(record);
        }
        for (List<GuestMonthRecord> list : byComune.values()) {
            list.sort(Comparator.<GuestMonthRecord>comparingInt(r -> r.meseSortKey)
                    .thenComparing(r -> r.nominativo));
        }
        return byComune;
    }

    private static void writeRiepilogoSheet(Workbook workbook, String sheetName, String titolo,
                                             String rigaLabelUtenti, Map<String, ComuneTotals> totals) {
        Sheet sheet = workbook.createSheet(sheetName);
        CellStyle headerStyle = boldStyle(workbook);
        CellStyle currencyStyle = currencyStyle(workbook);
        CellStyle titleStyle = boldStyle(workbook);

        int rowIdx = 0;
        Row titleRow = sheet.createRow(rowIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(titolo);
        titleCell.setCellStyle(titleStyle);
        rowIdx++; // riga vuota

        String[] headers = {
                "Comune", rigaLabelUtenti, "Gg. Frequenza", "Rimborso Frequenza (ASL)",
                "Gg. Trasporto", "Rimborso Trasporto (100%)", "Quota ASL 40%",
                "Quota Comune 60% (da richiedere)"
        };
        Row headerRow = sheet.createRow(rowIdx++);
        for (int c = 0; c < headers.length; c++) {
            Cell cell = headerRow.createCell(c);
            cell.setCellValue(headers[c]);
            cell.setCellStyle(headerStyle);
        }

        ComuneTotals grandTotal = new ComuneTotals();
        for (Map.Entry<String, ComuneTotals> entry : totals.entrySet()) {
            ComuneTotals t = entry.getValue();
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(t.righe);
            row.createCell(2).setCellValue(t.giorniFrequenza);
            setCurrency(row.createCell(3), t.rimborsoFrequenza, currencyStyle);
            row.createCell(4).setCellValue(t.giorniTrasporto);
            setCurrency(row.createCell(5), t.rimborsoTrasportoPieno, currencyStyle);
            setCurrency(row.createCell(6), t.quotaAsl(), currencyStyle);
            setCurrency(row.createCell(7), t.quotaComune(), currencyStyle);

            grandTotal.righe += t.righe;
            grandTotal.giorniFrequenza += t.giorniFrequenza;
            grandTotal.rimborsoFrequenza += t.rimborsoFrequenza;
            grandTotal.giorniTrasporto += t.giorniTrasporto;
            grandTotal.rimborsoTrasportoPieno += t.rimborsoTrasportoPieno;
        }

        Row totalRow = sheet.createRow(rowIdx);
        Cell totalLabel = totalRow.createCell(0);
        totalLabel.setCellValue("TOTALE");
        totalLabel.setCellStyle(headerStyle);
        totalRow.createCell(1).setCellValue(grandTotal.righe);
        totalRow.createCell(2).setCellValue(grandTotal.giorniFrequenza);
        setCurrency(totalRow.createCell(3), grandTotal.rimborsoFrequenza, currencyStyle);
        totalRow.createCell(4).setCellValue(grandTotal.giorniTrasporto);
        setCurrency(totalRow.createCell(5), grandTotal.rimborsoTrasportoPieno, currencyStyle);
        setCurrency(totalRow.createCell(6), grandTotal.quotaAsl(), currencyStyle);
        setCurrency(totalRow.createCell(7), grandTotal.quotaComune(), currencyStyle);

        for (int c = 0; c < headers.length; c++) {
            sheet.autoSizeColumn(c);
        }
    }

    private static void writeDettaglioComuneSheet(Workbook workbook, String sheetName, List<GuestMonthRecord> records) {
        Sheet sheet = workbook.createSheet(sheetName);
        CellStyle headerStyle = boldStyle(workbook);
        CellStyle currencyStyle = currencyStyle(workbook);

        String[] headers = {
                "Mese", "Distretto", "Nominativo", "Gg. Frequenza", "Rimborso Frequenza (ASL)",
                "Gg. Trasporto", "Buono Trasporto", "Rimborso Trasporto (100%)", "Quota ASL 40%",
                "Quota Comune 60% (da richiedere)"
        };
        Row headerRow = sheet.createRow(0);
        for (int c = 0; c < headers.length; c++) {
            Cell cell = headerRow.createCell(c);
            cell.setCellValue(headers[c]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        ComuneTotals subtotal = new ComuneTotals();
        for (GuestMonthRecord record : records) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(record.mese);
            row.createCell(1).setCellValue(distrettoLabel(record.distretto));
            row.createCell(2).setCellValue(record.nominativo);
            row.createCell(3).setCellValue(record.giorniFrequenza);
            setCurrency(row.createCell(4), record.rimborsoFrequenza, currencyStyle);
            row.createCell(5).setCellValue(record.giorniTrasporto);
            row.createCell(6).setCellValue(record.buonoTrasporto);
            setCurrency(row.createCell(7), record.rimborsoTrasportoPieno, currencyStyle);
            setCurrency(row.createCell(8), record.quotaAslTrasporto(), currencyStyle);
            setCurrency(row.createCell(9), record.quotaComuneTrasporto(), currencyStyle);

            subtotal.righe++;
            subtotal.giorniFrequenza += record.giorniFrequenza;
            subtotal.rimborsoFrequenza += record.rimborsoFrequenza;
            subtotal.giorniTrasporto += record.giorniTrasporto;
            subtotal.rimborsoTrasportoPieno += record.rimborsoTrasportoPieno;
        }

        Row totalRow = sheet.createRow(rowIdx);
        Cell totalLabel = totalRow.createCell(2);
        totalLabel.setCellValue("TOTALE (" + subtotal.righe + ")");
        totalLabel.setCellStyle(headerStyle);
        totalRow.createCell(3).setCellValue(subtotal.giorniFrequenza);
        setCurrency(totalRow.createCell(4), subtotal.rimborsoFrequenza, currencyStyle);
        totalRow.createCell(5).setCellValue(subtotal.giorniTrasporto);
        setCurrency(totalRow.createCell(7), subtotal.rimborsoTrasportoPieno, currencyStyle);
        setCurrency(totalRow.createCell(8), subtotal.quotaAsl(), currencyStyle);
        setCurrency(totalRow.createCell(9), subtotal.quotaComune(), currencyStyle);

        for (int c = 0; c < headers.length; c++) {
            sheet.autoSizeColumn(c);
        }
    }

    private static String distrettoLabel(String sheetName) {
        int idx = sheetName.indexOf(" - ");
        return idx > 0 ? sheetName.substring(0, idx) : sheetName;
    }

    private static void setCurrency(Cell cell, double value, CellStyle style) {
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private static CellStyle boldStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        return style;
    }

    private static CellStyle currencyStyle(Workbook workbook) {
        DataFormat format = workbook.createDataFormat();
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(format.getFormat("#,##0.00 €"));
        return style;
    }

    private static String uniqueSheetName(Workbook workbook, String comune) {
        String base = sanitizeSheetName(comune);
        String candidate = base;
        int suffix = 2;
        while (workbook.getSheet(candidate) != null) {
            String suffixStr = " (" + suffix + ")";
            int maxBaseLen = 31 - suffixStr.length();
            candidate = base.substring(0, Math.min(base.length(), maxBaseLen)) + suffixStr;
            suffix++;
        }
        return candidate;
    }

    private static String sanitizeSheetName(String name) {
        String cleaned = name.replaceAll("[\\\\/\\?\\*\\[\\]:]", " ").trim();
        if (cleaned.isEmpty()) {
            cleaned = "Comune";
        }
        return cleaned.length() > 31 ? cleaned.substring(0, 31) : cleaned;
    }
}
