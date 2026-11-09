package excelnomi;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Scrive il file di corrispondenza "nome originale <-> iniziali" raccolto
 * durante un'anonimizzazione. E' un file RISERVATO: vanifica lo scopo
 * dell'anonimizzazione se distribuito insieme ai file con i soli nomi in
 * iniziali, quindi va tenuto solo in locale.
 */
final class NameMappingWriter {

    private NameMappingWriter() {
    }

    static final class Row {
        final String nomeOriginale;
        final String iniziali;
        final int occorrenze;
        final boolean collisione;

        Row(String nomeOriginale, String iniziali, int occorrenze, boolean collisione) {
            this.nomeOriginale = nomeOriginale;
            this.iniziali = iniziali;
            this.occorrenze = occorrenze;
            this.collisione = collisione;
        }
    }

    static List<Row> aggregate(List<NameMapping> mappings) {
        // Conta le occorrenze per ogni coppia esatta (nome originale, iniziali).
        Map<String, Map<String, Integer>> byName = new TreeMap<>();
        for (NameMapping m : mappings) {
            byName.computeIfAbsent(m.nomeOriginale, k -> new LinkedHashMap<>())
                    .merge(m.iniziali, 1, Integer::sum);
        }

        // Conta quanti nomi originali distinti condividono le stesse iniziali,
        // per segnalare le collisioni (iniziali che non si possono invertire in modo univoco).
        Map<String, Integer> distinctNamesPerInitials = new TreeMap<>();
        for (Map<String, Integer> variants : byName.values()) {
            for (String iniziali : variants.keySet()) {
                distinctNamesPerInitials.merge(iniziali, 1, Integer::sum);
            }
        }

        List<Row> rows = new ArrayList<>();
        for (Map.Entry<String, Map<String, Integer>> entry : byName.entrySet()) {
            String nomeOriginale = entry.getKey();
            for (Map.Entry<String, Integer> variant : entry.getValue().entrySet()) {
                String iniziali = variant.getKey();
                int occorrenze = variant.getValue();
                boolean collisione = distinctNamesPerInitials.getOrDefault(iniziali, 0) > 1;
                rows.add(new Row(nomeOriginale, iniziali, occorrenze, collisione));
            }
        }
        return rows;
    }

    static void write(List<NameMapping> mappings, Path outputFile) throws IOException {
        List<Row> rows = aggregate(mappings);

        Path parent = outputFile.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }
        try (OutputStream out = Files.newOutputStream(outputFile)) {
            out.write(0xEF); // BOM UTF-8, cosi' Excel su Windows apre subito gli accenti corretti
            out.write(0xBB);
            out.write(0xBF);
            Writer writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
            writer.write("Nome Originale;Iniziali;Occorrenze;Collisione (iniziali condivise con altri nomi)\n");
            for (Row row : rows) {
                writer.write(csv(row.nomeOriginale));
                writer.write(';');
                writer.write(csv(row.iniziali));
                writer.write(';');
                writer.write(String.valueOf(row.occorrenze));
                writer.write(';');
                writer.write(row.collisione ? "SI" : "NO");
                writer.write('\n');
            }
            writer.flush();
        }
    }

    private static String csv(String value) {
        if (value == null) {
            return "";
        }
        if (value.contains(";") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
