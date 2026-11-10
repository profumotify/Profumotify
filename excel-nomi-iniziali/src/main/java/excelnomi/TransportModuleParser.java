package excelnomi;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Legge il formato alternativo di rendicontazione "Mod_Ut_TRASPORTI" (usato
 * da alcune strutture invece del modulo standard "DSS... - All. B e C"):
 * un unico foglio "Anagrafica" con una riga per utente, e un foglio
 * "Divis. x DSS-Comune" con il riepilogo per comune gia' calcolato dal file
 * stesso. In questo formato il trasporto viene sempre fatturato a tariffa
 * piena (14,50 €/giorno): non esiste la distinzione "Buono servizio
 * trasporto" del modulo standard, quindi ogni riga viene letta come se il
 * buono fosse "NO" (nessuno sconto), e la frequenza giornaliera non e'
 * tracciata in questo modulo (resta a 0).
 * <p>
 * Dopo aver letto le righe utente, i totali per comune calcolati da questa
 * applicazione vengono confrontati con quelli gia' presenti nel foglio
 * "Divis. x DSS-Comune" del file stesso: eventuali discrepanze vengono
 * restituite come avvisi, cosi' da far emergere subito un'eventuale riga
 * letta male invece di scoprirlo solo a consuntivo.
 */
final class TransportModuleParser {

    private static final double TOLLERANZA_EURO = 0.05;

    private TransportModuleParser() {
    }

    static boolean looksLikeTransportModule(Workbook workbook) {
        return findSheetByNameContains(workbook, "anagrafica") != null;
    }

    static MonthlyReportParser.ParsedMonth parse(Workbook workbook, Path file) {
        int[] sortKeyHolder = new int[1];
        String meseLabel = MonthlyReportParser.readMeseLabel(workbook, sortKeyHolder);
        if (meseLabel == null) {
            String name = file.getFileName().toString();
            int dot = name.lastIndexOf('.');
            meseLabel = dot >= 0 ? name.substring(0, dot) : name;
        }
        int meseSortKey = sortKeyHolder[0];

        List<GuestMonthRecord> records = new ArrayList<>();
        List<String> warnings = new ArrayList<>();

        Sheet anagrafica = findSheetByNameContains(workbook, "anagrafica");
        if (anagrafica != null) {
            records.addAll(parseAnagrafica(anagrafica, meseLabel, meseSortKey));
        }

        Sheet divisioneComuni = findSheetByNameContains(workbook, "divis");
        if (divisioneComuni != null) {
            warnings.addAll(verificaTotaliComuni(divisioneComuni, records));
        }

        return new MonthlyReportParser.ParsedMonth(meseLabel, meseSortKey, records, warnings);
    }

    private static List<GuestMonthRecord> parseAnagrafica(Sheet sheet, String meseLabel, int meseSortKey) {
        List<GuestMonthRecord> records = new ArrayList<>();

        int headerRowIdx = -1;
        Map<String, Integer> colonne = null;
        int lastScanRow = Math.min(sheet.getLastRowNum(), 20);
        for (int r = 0; r <= lastScanRow; r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }
            Map<String, Integer> headerMap = headerColumnMap(row);
            if (findColumn(headerMap, "cognome", "nome") != null) {
                headerRowIdx = r;
                colonne = headerMap;
                break;
            }
        }
        if (colonne == null) {
            return records; // intestazione non trovata: foglio non nel formato atteso
        }

        Integer colNome = findColumn(colonne, "cognome", "nome");
        Integer colComune = findColumn(colonne, "comune", "residenza");
        Integer colDataNascita = findColumn(colonne, "data", "nascita");
        Integer colDistretto = findColumn(colonne, "dss");
        Integer colGiorniTrasporto = findColumn(colonne, "giorni", "trasporto");
        Integer colImportoTrasporto = findColumn(colonne, "importo", "trasporto");
        if (colNome == null || colComune == null) {
            return records;
        }

        int lastRow = sheet.getLastRowNum();
        for (int r = headerRowIdx + 1; r <= lastRow; r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }
            String nome = MonthlyReportParser.stringValue(row, colNome);
            if (MonthlyReportParser.isBlank(nome)) {
                continue; // riga vuota/di riempimento del modulo
            }
            String comune = colComune != null ? MonthlyReportParser.stringValue(row, colComune) : null;
            if (MonthlyReportParser.isBlank(comune)) {
                continue;
            }
            String distretto = colDistretto != null ? MonthlyReportParser.stringValue(row, colDistretto) : null;
            Integer annoNascita = colDataNascita != null
                    ? MonthlyReportParser.extractAnnoNascita(row, colDataNascita) : null;
            int giorniTrasporto = colGiorniTrasporto != null
                    ? (int) Math.round(MonthlyReportParser.numericValue(row, colGiorniTrasporto)) : 0;
            double rimborsoTrasportoPieno = colImportoTrasporto != null
                    ? MonthlyReportParser.numericValue(row, colImportoTrasporto) : 0.0;

            records.add(new GuestMonthRecord(meseLabel, meseSortKey,
                    distretto == null ? "" : distretto.trim(), nome.trim(), annoNascita, comune.trim(),
                    0, 0.0, // la frequenza giornaliera non e' tracciata in questo modulo
                    giorniTrasporto, "NO", // niente Buono servizio trasporto: sempre tariffa piena
                    rimborsoTrasportoPieno));
        }
        return records;
    }

    /**
     * Confronta i totali per comune calcolati da questa applicazione con
     * quelli gia' presenti nella seconda tabella del foglio "Divis. x
     * DSS-Comune" (quella con le colonne "Comune" / "N. giorni Trasporto
     * Fatturati" / "Importi fatturati" / "Totale a carico Comune").
     */
    private static List<String> verificaTotaliComuni(Sheet sheet, List<GuestMonthRecord> records) {
        List<String> warnings = new ArrayList<>();

        int headerRowIdx = -1;
        Map<String, Integer> colonne = null;
        int lastRow = sheet.getLastRowNum();
        for (int r = 0; r <= lastRow; r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }
            String primaCella = MonthlyReportParser.stringValue(row, 0);
            if (primaCella == null || !primaCella.trim().equalsIgnoreCase("comune")) {
                continue;
            }
            Map<String, Integer> headerMap = headerColumnMap(row);
            if (findColumn(headerMap, "totale", "comune") != null) {
                headerRowIdx = r;
                colonne = headerMap;
                break;
            }
        }
        if (colonne == null) {
            return warnings; // tabella di riepilogo per comune non trovata: niente da verificare
        }

        Integer colGiorni = findColumn(colonne, "giorni", "trasporto");
        Integer colImporto = findColumn(colonne, "importi", "fatturat");
        Integer colTotaleComune = findColumn(colonne, "totale", "comune");

        Map<String, double[]> daFile = new HashMap<>(); // comune normalizzato -> {giorni, importo, quotaComune}
        Map<String, String> nomiOriginali = new HashMap<>();
        for (int r = headerRowIdx + 1; r <= lastRow; r++) {
            Row row = sheet.getRow(r);
            if (row == null) {
                continue;
            }
            String comune = MonthlyReportParser.stringValue(row, 0);
            if (MonthlyReportParser.isBlank(comune) || comune.trim().equalsIgnoreCase("totali")) {
                continue;
            }
            String key = comune.trim().toLowerCase(Locale.ITALIAN);
            double giorni = colGiorni != null ? MonthlyReportParser.numericValue(row, colGiorni) : 0;
            double importo = colImporto != null ? MonthlyReportParser.numericValue(row, colImporto) : 0;
            double quotaComune = colTotaleComune != null ? MonthlyReportParser.numericValue(row, colTotaleComune) : 0;
            daFile.put(key, new double[]{giorni, importo, quotaComune});
            nomiOriginali.put(key, comune.trim());
        }

        Map<String, double[]> daNoi = new HashMap<>();
        for (GuestMonthRecord rec : records) {
            String key = rec.comune.trim().toLowerCase(Locale.ITALIAN);
            double[] tot = daNoi.computeIfAbsent(key, k -> new double[3]);
            tot[0] += rec.giorniTrasporto;
            tot[1] += rec.importoPienoTariffaBase();
            tot[2] += rec.quotaComuneTrasporto();
            nomiOriginali.putIfAbsent(key, rec.comune.trim());
        }

        for (String key : nomiOriginali.keySet()) {
            double[] file = daFile.getOrDefault(key, new double[3]);
            double[] nostro = daNoi.getOrDefault(key, new double[3]);
            String nome = nomiOriginali.get(key);
            if (Math.round(file[0]) != Math.round(nostro[0])) {
                warnings.add(String.format(
                        "[VERIFICA] comune %s: giorni trasporto calcolati=%.0f, nel file=%.0f",
                        nome, nostro[0], file[0]));
            }
            if (Math.abs(file[1] - nostro[1]) > TOLLERANZA_EURO) {
                warnings.add(String.format(
                        "[VERIFICA] comune %s: importo trasporto calcolato=%.2f €, nel file=%.2f €",
                        nome, nostro[1], file[1]));
            }
            if (Math.abs(file[2] - nostro[2]) > TOLLERANZA_EURO) {
                warnings.add(String.format(
                        "[VERIFICA] comune %s: quota Comune calcolata=%.2f €, nel file=%.2f €",
                        nome, nostro[2], file[2]));
            }
        }
        return warnings;
    }

    private static Sheet findSheetByNameContains(Workbook workbook, String needle) {
        for (Sheet sheet : workbook) {
            if (sheet.getSheetName().toLowerCase(Locale.ITALIAN).contains(needle)) {
                return sheet;
            }
        }
        return null;
    }

    /** Mappa testo-intestazione-normalizzato (minuscolo, spazi singoli) -> indice colonna. */
    private static Map<String, Integer> headerColumnMap(Row row) {
        Map<String, Integer> map = new HashMap<>();
        for (Cell cell : row) {
            if (cell.getCellType() != CellType.STRING) {
                continue;
            }
            String normalized = cell.getStringCellValue()
                    .toLowerCase(Locale.ITALIAN)
                    .replaceAll("\\s+", " ")
                    .trim();
            if (!normalized.isEmpty()) {
                map.put(normalized, cell.getColumnIndex());
            }
        }
        return map;
    }

    /** Trova la colonna la cui intestazione contiene tutte le parole chiave indicate. */
    private static Integer findColumn(Map<String, Integer> headerMap, String... keywords) {
        for (Map.Entry<String, Integer> entry : headerMap.entrySet()) {
            boolean matchesAll = true;
            for (String keyword : keywords) {
                if (!entry.getKey().contains(keyword)) {
                    matchesAll = false;
                    break;
                }
            }
            if (matchesAll) {
                return entry.getValue();
            }
        }
        return null;
    }
}
