package excelnomi;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Converte un PDF di rendicontazione scansionato in un file Excel con la
 * stessa struttura (un foglio "DSS&lt;N&gt; - All. B e C" per distretto) dei
 * fogli generati dal file originale, cosi' da poter essere riletto
 * direttamente da {@link MonthlyReportParser} una volta completato a mano.
 * <p>
 * I dati vengono letti dalle pagine "Allegato B" (tabella per distretto):
 * nominativo, comune di residenza, data di nascita e buono trasporto
 * SI/NO sono ragionevolmente affidabili e vengono riempiti in automatico;
 * i giorni di presenza e di trasporto restano sempre evidenziati in
 * giallo per una verifica rapida, perche' nei test anche letture che
 * sembravano plausibili si sono rivelate talvolta sbagliate. Il mese di
 * riferimento e' letto dalla pagina "Allegato A".
 */
final class PdfOcrConverter {

    private static final String LANG = "ita";

    static final class RigaEstratta {
        String nominativo;
        String comune;
        String dataNascita;
        Integer giorniPresenza;
        Integer giorniTrasporto;
        String buonoTrasporto;
        boolean completa;
    }

    static final class Risultato {
        String meseLabel;
        int pagineTotali;
        int pagineAllegatoB;
        Map<Integer, List<RigaEstratta>> righePerDistretto = new LinkedHashMap<>();
        int righeTotali;
    }

    static Risultato convert(Path pdfFile, Path outputXlsx, Consumer<String> logger)
            throws IOException, InterruptedException {

        if (!TesseractRunner.isAvailable()) {
            throw new IllegalStateException(
                    "Tesseract OCR non trovato sul PC. Installalo (vedi README) e riprova.");
        }

        Risultato risultato = new Risultato();
        int[] distrettoFallback = {0};

        PdfPageRenderer.forEachPage(pdfFile, (pageIndex, rawImage) -> {
            risultato.pagineTotali++;
            int rotation = TesseractRunner.detectRotation(rawImage);
            BufferedImage image = rotation == 0 ? rawImage : PdfPageRenderer.rotate(rawImage, rotation);
            String text = TesseractRunner.ocrText(image, LANG);

            if (risultato.meseLabel == null && AllegatoAExtractor.looksLikeAllegatoA(text)) {
                AllegatoAExtractor.Estratto mese = AllegatoAExtractor.parse(text);
                if (mese != null) {
                    risultato.meseLabel = mese.meseLabel;
                    logger.accept(String.format("Pagina %d: mese di riferimento = %s", pageIndex + 1, mese.meseLabel));
                }
                return;
            }

            if (AllegatoBExtractor.looksLikeAllegatoB(text)) {
                risultato.pagineAllegatoB++;
                Integer dss = AllegatoBExtractor.extractDssNumber(text);
                if (dss == null) {
                    distrettoFallback[0]++;
                    dss = 900 + distrettoFallback[0]; // numero fittizio se non si legge il distretto
                    logger.accept(String.format(
                            "[ATTENZIONE] pagina %d: non ho riconosciuto il numero del distretto DSS, assegnato un foglio provvisorio",
                            pageIndex + 1));
                }
                List<AllegatoBExtractor.Riga> righe = AllegatoBExtractor.parseRows(text);
                logger.accept(String.format("Pagina %d: Distretto DSS n.%d - %d utenti trovati", pageIndex + 1, dss, righe.size()));

                List<RigaEstratta> lista = risultato.righePerDistretto.computeIfAbsent(dss, k -> new ArrayList<>());
                for (AllegatoBExtractor.Riga r : righe) {
                    RigaEstratta riga = new RigaEstratta();
                    riga.nominativo = r.nominativo;
                    riga.comune = r.comune;
                    riga.dataNascita = r.dataNascita;
                    riga.giorniPresenza = r.giorniPresenza;
                    riga.giorniTrasporto = r.giorniTrasporto;
                    riga.buonoTrasporto = r.buonoTrasporto;
                    riga.completa = r.completa;
                    lista.add(riga);
                    risultato.righeTotali++;
                    if (!r.completa) {
                        logger.accept(String.format(
                                "  [ATTENZIONE] %s: lettura parziale (presenza=%s, trasporto=%s, buono=%s) - verificare a mano",
                                r.nominativo, r.giorniPresenza, r.giorniTrasporto, r.buonoTrasporto));
                    }
                }
            }
        });

        if (risultato.meseLabel == null) {
            risultato.meseLabel = "Mese sconosciuto";
            logger.accept("[ATTENZIONE] Mese di riferimento non trovato nel PDF (pagina Allegato A non riconosciuta): da impostare a mano.");
        }

        writeWorkbook(risultato, outputXlsx);
        return risultato;
    }

    private static void writeWorkbook(Risultato risultato, Path outputXlsx) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            writeAllegatoASheet(workbook, risultato.meseLabel);
            for (Map.Entry<Integer, List<RigaEstratta>> entry : risultato.righePerDistretto.entrySet()) {
                writeDssSheet(workbook, entry.getKey(), entry.getValue());
            }

            Path parent = outputXlsx.getParent();
            if (parent != null) {
                Files.createDirectories(parent);
            }
            try (OutputStream out = Files.newOutputStream(outputXlsx)) {
                workbook.write(out);
            }
        }
    }

    private static void writeAllegatoASheet(Workbook workbook, String meseLabel) {
        Sheet sheet = workbook.createSheet("All. \"A\"");
        Row labelRow = sheet.createRow(7); // riga 8 (1-based), come nel modulo originale
        labelRow.createCell(9).setCellValue("Riferimento fatture del mese/anno");

        Row valueRow = sheet.createRow(8); // riga 9, cella sotto l'etichetta
        Cell dateCell = valueRow.createCell(9);
        java.util.Date date = parseMeseLabelToDate(meseLabel);
        if (date != null) {
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(workbook.createDataFormat().getFormat("mmmm yyyy"));
            dateCell.setCellValue(date);
            dateCell.setCellStyle(dateStyle);
        } else {
            dateCell.setCellValue(meseLabel + " (verificare manualmente)");
        }
        sheet.autoSizeColumn(9);
    }

    private static java.util.Date parseMeseLabelToDate(String meseLabel) {
        String[] mesi = {"gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
                "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"};
        String[] parts = meseLabel.trim().split("\\s+");
        if (parts.length != 2) {
            return null;
        }
        int meseIdx = -1;
        for (int i = 0; i < mesi.length; i++) {
            if (mesi[i].equalsIgnoreCase(parts[0])) {
                meseIdx = i;
                break;
            }
        }
        try {
            int anno = Integer.parseInt(parts[1]);
            if (meseIdx < 0) {
                return null;
            }
            Calendar cal = Calendar.getInstance();
            cal.clear();
            cal.set(anno, meseIdx, 1);
            return cal.getTime();
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static void writeDssSheet(Workbook workbook, int dssNumber, List<RigaEstratta> righe) {
        String sheetName = "DSS" + dssNumber + " - All. \"B\" e \"C\"";
        if (sheetName.length() > 31) {
            sheetName = sheetName.substring(0, 31);
        }
        Sheet sheet = workbook.createSheet(sheetName);
        CellStyle headerStyle = boldStyle(workbook);
        CellStyle highlightStyle = highlightStyle(workbook);

        Row header = sheet.createRow(5); // riga 6: stessa posizione del modulo originale
        setHeader(header, 0, "n.", headerStyle);
        setHeader(header, 1, "Cognome e Nome", headerStyle);
        setHeader(header, 4, "Comune di residenza", headerStyle);
        setHeader(header, 6, "Data di nascita", headerStyle);
        setHeader(header, 13, "Gg. Presenza (da OCR - VERIFICARE)", headerStyle);
        setHeader(header, 14, "Rimborso Frequenza (non disponibile da OCR)", headerStyle);
        setHeader(header, 16, "Gg. Trasporto (da OCR - VERIFICARE)", headerStyle);
        setHeader(header, 17, "Buono trasporto SI/NO", headerStyle);
        setHeader(header, 18, "Rimborso Trasporto (calcolato automaticamente)", headerStyle);
        setHeader(header, 19, "NOTE", headerStyle);

        int rowIdx = 8; // riga 9: prima riga dati, come nel modulo originale
        int n = 1;
        int firstDataRow = rowIdx;
        for (RigaEstratta riga : righe) {
            Row row = sheet.createRow(rowIdx);
            row.createCell(0).setCellValue(n++);
            row.createCell(1).setCellValue(riga.nominativo != null ? riga.nominativo : "");

            Cell comuneCell = row.createCell(4);
            comuneCell.setCellValue(riga.comune != null ? riga.comune : "");
            if (riga.comune == null) {
                comuneCell.setCellStyle(highlightStyle);
            }

            if (riga.dataNascita != null) {
                row.createCell(6).setCellValue(riga.dataNascita);
            }

            // I giorni (presenza/trasporto) restano SEMPRE evidenziati: anche quando
            // sembrano plausibili, nei test si sono rivelati a volte sbagliati.
            Cell presenzaCell = row.createCell(13);
            if (riga.giorniPresenza != null) {
                presenzaCell.setCellValue(riga.giorniPresenza);
            }
            presenzaCell.setCellStyle(highlightStyle);

            row.createCell(14).setCellValue(0);

            Cell trasportoCell = row.createCell(16);
            if (riga.giorniTrasporto != null) {
                trasportoCell.setCellValue(riga.giorniTrasporto);
            }
            trasportoCell.setCellStyle(highlightStyle);

            Cell buonoCell = row.createCell(17);
            buonoCell.setCellValue(riga.buonoTrasporto != null ? riga.buonoTrasporto : "");
            if (riga.buonoTrasporto == null) {
                buonoCell.setCellStyle(highlightStyle);
            }

            row.createCell(18).setCellValue(0);

            if (!riga.completa) {
                row.createCell(19).setCellValue("Verificare: lettura OCR parziale o incoerente su questa riga");
            }
            rowIdx++;
        }
        int lastDataRow = rowIdx - 1;

        if (lastDataRow >= firstDataRow) {
            DataValidationHelper dvHelper = sheet.getDataValidationHelper();
            DataValidationConstraint constraint = dvHelper.createExplicitListConstraint(new String[]{"SI", "NO"});
            CellRangeAddressList addressList = new CellRangeAddressList(firstDataRow, lastDataRow, 17, 17);
            DataValidation validation = dvHelper.createValidation(constraint, addressList);
            validation.setShowErrorBox(true);
            sheet.addValidationData(validation);
        }

        for (int c = 0; c <= 19; c++) {
            sheet.autoSizeColumn(c);
        }
    }

    private static void setHeader(Row row, int col, String text, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(text);
        cell.setCellStyle(style);
    }

    private static CellStyle boldStyle(Workbook workbook) {
        Font font = workbook.createFont();
        font.setBold(true);
        CellStyle style = workbook.createCellStyle();
        style.setFont(font);
        style.setWrapText(true);
        return style;
    }

    private static CellStyle highlightStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(IndexedColors.YELLOW.getIndex());
        style.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
        return style;
    }
}
