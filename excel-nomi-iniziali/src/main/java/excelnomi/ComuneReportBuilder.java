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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Aggrega le righe {@link GuestMonthRecord} per comune di residenza e
 * genera i file Excel di riepilogo: un file per mese (riepilogo comuni +
 * un foglio per comune) e un file di riepilogo per l'intero periodo
 * caricato (es. un anno). Ogni foglio comune mostra sia i totali per
 * singolo utente nel periodo (il dato da comunicare al comune) sia il
 * dettaglio mese per mese (per la tracciabilita' interna).
 */
final class ComuneReportBuilder {

    private ComuneReportBuilder() {
    }

    /** Accumulatore di importi/giorni, usato sia per i totali di comune sia per quelli di utente. */
    private static final class Accumulatore {
        int righe;
        int giorniFrequenza;
        double rimborsoFrequenza;
        int giorniTrasporto;
        double rimborsoTrasportoPieno;
        double importoPienoTariffaBase;
        double scontoBuono;
        double quotaAsl;
        double quotaComune;

        void aggiungi(GuestMonthRecord r) {
            righe++;
            giorniFrequenza += r.giorniFrequenza;
            rimborsoFrequenza += r.rimborsoFrequenza;
            giorniTrasporto += r.giorniTrasporto;
            rimborsoTrasportoPieno += r.rimborsoTrasportoPieno;
            importoPienoTariffaBase += r.importoPienoTariffaBase();
            scontoBuono += r.scontoBuonoServizio();
            quotaAsl += r.quotaAslTrasporto();
            quotaComune += r.quotaComuneTrasporto();
        }
    }

    private static final class UtenteTotali {
        final String nominativo;
        final TreeSet<Integer> anniNascita = new TreeSet<>();
        final TreeSet<String> mesi = new TreeSet<>();
        final Accumulatore acc = new Accumulatore();

        UtenteTotali(String nominativo) {
            this.nominativo = nominativo;
        }

        String annoNascitaLabel() {
            if (anniNascita.isEmpty()) {
                return "";
            }
            if (anniNascita.size() == 1) {
                return String.valueOf(anniNascita.first());
            }
            // Stesso nominativo ma anni di nascita diversi tra le righe: probabile omonimia,
            // segnaliamo per non dare per scontato che sia la stessa persona.
            StringBuilder sb = new StringBuilder();
            for (Integer anno : anniNascita) {
                if (sb.length() > 0) {
                    sb.append('/');
                }
                sb.append(anno);
            }
            return sb + " ⚠";
        }
    }

    static void writeReport(String titoloRiepilogo, String rigaLabelUtenti, List<GuestMonthRecord> records,
                             Path outputFile) throws IOException {
        Map<String, Accumulatore> totals = aggregatePerComune(records);
        Map<String, List<GuestMonthRecord>> byComune = groupByComune(records);

        try (Workbook workbook = new XSSFWorkbook()) {
            writeRiepilogoSheet(workbook, "Riepilogo", titoloRiepilogo, rigaLabelUtenti, totals);
            for (Map.Entry<String, List<GuestMonthRecord>> entry : byComune.entrySet()) {
                writeComuneSheet(workbook, uniqueSheetName(workbook, entry.getKey()), entry.getValue());
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

    private static Map<String, Accumulatore> aggregatePerComune(List<GuestMonthRecord> records) {
        Map<String, Accumulatore> totals = new TreeMap<>();
        for (GuestMonthRecord record : records) {
            totals.computeIfAbsent(record.comune, k -> new Accumulatore()).aggiungi(record);
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

    private static List<UtenteTotali> aggregatePerUtente(List<GuestMonthRecord> records) {
        Map<String, UtenteTotali> byUtente = new LinkedHashMap<>();
        List<GuestMonthRecord> ordinati = new ArrayList<>(records);
        ordinati.sort(Comparator.comparing(r -> r.nominativo));
        for (GuestMonthRecord record : ordinati) {
            UtenteTotali u = byUtente.computeIfAbsent(record.nominativo, UtenteTotali::new);
            u.acc.aggiungi(record);
            u.mesi.add(record.mese);
            if (record.annoNascita != null) {
                u.anniNascita.add(record.annoNascita);
            }
        }
        return new ArrayList<>(byUtente.values());
    }

    private static void writeRiepilogoSheet(Workbook workbook, String sheetName, String titolo,
                                             String rigaLabelUtenti, Map<String, Accumulatore> totals) {
        Sheet sheet = workbook.createSheet(sheetName);
        CellStyle headerStyle = boldStyle(workbook);
        CellStyle currencyStyle = currencyStyle(workbook);

        int rowIdx = 0;
        Row titleRow = sheet.createRow(rowIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(titolo);
        titleCell.setCellStyle(headerStyle);
        rowIdx++; // riga vuota

        String[] headers = {
                "Comune", rigaLabelUtenti, "Gg. Frequenza", "Rimborso Frequenza (ASL)",
                "Gg. Trasporto", "Rimborso Trasporto (effettivo)", "Quota ASL 40% (tariffa piena)",
                "Sconto Buoni Servizio (a carico Comune)", "Quota Comune (da richiedere)"
        };
        Row headerRow = sheet.createRow(rowIdx++);
        for (int c = 0; c < headers.length; c++) {
            Cell cell = headerRow.createCell(c);
            cell.setCellValue(headers[c]);
            cell.setCellStyle(headerStyle);
        }

        Accumulatore grandTotal = new Accumulatore();
        for (Map.Entry<String, Accumulatore> entry : totals.entrySet()) {
            Accumulatore t = entry.getValue();
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(entry.getKey());
            row.createCell(1).setCellValue(t.righe);
            row.createCell(2).setCellValue(t.giorniFrequenza);
            setCurrency(row.createCell(3), t.rimborsoFrequenza, currencyStyle);
            row.createCell(4).setCellValue(t.giorniTrasporto);
            setCurrency(row.createCell(5), t.rimborsoTrasportoPieno, currencyStyle);
            setCurrency(row.createCell(6), t.quotaAsl, currencyStyle);
            setCurrency(row.createCell(7), t.scontoBuono, currencyStyle);
            setCurrency(row.createCell(8), t.quotaComune, currencyStyle);

            grandTotal.righe += t.righe;
            grandTotal.giorniFrequenza += t.giorniFrequenza;
            grandTotal.rimborsoFrequenza += t.rimborsoFrequenza;
            grandTotal.giorniTrasporto += t.giorniTrasporto;
            grandTotal.rimborsoTrasportoPieno += t.rimborsoTrasportoPieno;
            grandTotal.quotaAsl += t.quotaAsl;
            grandTotal.scontoBuono += t.scontoBuono;
            grandTotal.quotaComune += t.quotaComune;
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
        setCurrency(totalRow.createCell(6), grandTotal.quotaAsl, currencyStyle);
        setCurrency(totalRow.createCell(7), grandTotal.scontoBuono, currencyStyle);
        setCurrency(totalRow.createCell(8), grandTotal.quotaComune, currencyStyle);

        for (int c = 0; c < headers.length; c++) {
            sheet.autoSizeColumn(c);
        }
    }

    private static void writeComuneSheet(Workbook workbook, String sheetName, List<GuestMonthRecord> records) {
        Sheet sheet = workbook.createSheet(sheetName);
        CellStyle headerStyle = boldStyle(workbook);
        CellStyle currencyStyle = currencyStyle(workbook);

        int rowIdx = writeUtentiSection(sheet, 0, headerStyle, currencyStyle, records);
        rowIdx++; // riga vuota di separazione
        writeDettaglioMensileSection(sheet, rowIdx, headerStyle, currencyStyle, records);

        for (int c = 0; c < 11; c++) {
            sheet.autoSizeColumn(c);
        }
    }

    private static int writeUtentiSection(Sheet sheet, int startRow, CellStyle headerStyle, CellStyle currencyStyle,
                                           List<GuestMonthRecord> records) {
        int rowIdx = startRow;
        Row titleRow = sheet.createRow(rowIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Totali per utente nel periodo (dato da comunicare al Comune)");
        titleCell.setCellStyle(headerStyle);

        String[] headers = {
                "Nominativo", "Anno Nascita", "N. Mesi", "Gg. Frequenza", "Rimborso Frequenza (ASL)",
                "Gg. Trasporto", "Rimborso Trasporto (effettivo)", "Quota ASL 40% (tariffa piena)",
                "Sconto Buoni Servizio (a carico Comune)", "Quota Comune (da richiedere)"
        };
        Row headerRow = sheet.createRow(rowIdx++);
        for (int c = 0; c < headers.length; c++) {
            Cell cell = headerRow.createCell(c);
            cell.setCellValue(headers[c]);
            cell.setCellStyle(headerStyle);
        }

        List<UtenteTotali> utenti = aggregatePerUtente(records);
        Accumulatore grandTotal = new Accumulatore();
        for (UtenteTotali u : utenti) {
            Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(u.nominativo);
            row.createCell(1).setCellValue(u.annoNascitaLabel());
            row.createCell(2).setCellValue(u.mesi.size());
            row.createCell(3).setCellValue(u.acc.giorniFrequenza);
            setCurrency(row.createCell(4), u.acc.rimborsoFrequenza, currencyStyle);
            row.createCell(5).setCellValue(u.acc.giorniTrasporto);
            setCurrency(row.createCell(6), u.acc.rimborsoTrasportoPieno, currencyStyle);
            setCurrency(row.createCell(7), u.acc.quotaAsl, currencyStyle);
            setCurrency(row.createCell(8), u.acc.scontoBuono, currencyStyle);
            setCurrency(row.createCell(9), u.acc.quotaComune, currencyStyle);

            grandTotal.giorniFrequenza += u.acc.giorniFrequenza;
            grandTotal.rimborsoFrequenza += u.acc.rimborsoFrequenza;
            grandTotal.giorniTrasporto += u.acc.giorniTrasporto;
            grandTotal.rimborsoTrasportoPieno += u.acc.rimborsoTrasportoPieno;
            grandTotal.quotaAsl += u.acc.quotaAsl;
            grandTotal.scontoBuono += u.acc.scontoBuono;
            grandTotal.quotaComune += u.acc.quotaComune;
        }

        Row totalRow = sheet.createRow(rowIdx++);
        Cell totalLabel = totalRow.createCell(0);
        totalLabel.setCellValue("TOTALE (" + utenti.size() + " utenti)");
        totalLabel.setCellStyle(headerStyle);
        totalRow.createCell(3).setCellValue(grandTotal.giorniFrequenza);
        setCurrency(totalRow.createCell(4), grandTotal.rimborsoFrequenza, currencyStyle);
        totalRow.createCell(5).setCellValue(grandTotal.giorniTrasporto);
        setCurrency(totalRow.createCell(6), grandTotal.rimborsoTrasportoPieno, currencyStyle);
        setCurrency(totalRow.createCell(7), grandTotal.quotaAsl, currencyStyle);
        setCurrency(totalRow.createCell(8), grandTotal.scontoBuono, currencyStyle);
        setCurrency(totalRow.createCell(9), grandTotal.quotaComune, currencyStyle);
        return rowIdx;
    }

    private static void writeDettaglioMensileSection(Sheet sheet, int startRow, CellStyle headerStyle,
                                                       CellStyle currencyStyle, List<GuestMonthRecord> records) {
        int rowIdx = startRow;
        Row titleRow = sheet.createRow(rowIdx++);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Dettaglio mensile");
        titleCell.setCellStyle(headerStyle);

        String[] headers = {
                "Mese", "Distretto", "Nominativo", "Gg. Frequenza", "Rimborso Frequenza (ASL)",
                "Gg. Trasporto", "Buono Trasporto", "Rimborso Trasporto (effettivo)", "Quota ASL 40%",
                "Sconto Buono", "Quota Comune (da richiedere)"
        };
        Row headerRow = sheet.createRow(rowIdx++);
        for (int c = 0; c < headers.length; c++) {
            Cell cell = headerRow.createCell(c);
            cell.setCellValue(headers[c]);
            cell.setCellStyle(headerStyle);
        }

        Accumulatore subtotal = new Accumulatore();
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
            setCurrency(row.createCell(9), record.scontoBuonoServizio(), currencyStyle);
            setCurrency(row.createCell(10), record.quotaComuneTrasporto(), currencyStyle);

            subtotal.aggiungi(record);
        }

        Row totalRow = sheet.createRow(rowIdx);
        Cell totalLabel = totalRow.createCell(2);
        totalLabel.setCellValue("TOTALE (" + subtotal.righe + ")");
        totalLabel.setCellStyle(headerStyle);
        totalRow.createCell(3).setCellValue(subtotal.giorniFrequenza);
        setCurrency(totalRow.createCell(4), subtotal.rimborsoFrequenza, currencyStyle);
        totalRow.createCell(5).setCellValue(subtotal.giorniTrasporto);
        setCurrency(totalRow.createCell(7), subtotal.rimborsoTrasportoPieno, currencyStyle);
        setCurrency(totalRow.createCell(8), subtotal.quotaAsl, currencyStyle);
        setCurrency(totalRow.createCell(9), subtotal.scontoBuono, currencyStyle);
        setCurrency(totalRow.createCell(10), subtotal.quotaComune, currencyStyle);
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
