package excelnomi;

import javax.swing.BorderFactory;
import javax.swing.DefaultListModel;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JLabel;
import javax.swing.JList;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JProgressBar;
import javax.swing.JScrollPane;
import javax.swing.JTextArea;
import javax.swing.JTextField;
import javax.swing.SwingUtilities;
import javax.swing.SwingWorker;
import javax.swing.filechooser.FileNameExtensionFilter;
import java.awt.BorderLayout;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.GridLayout;
import java.io.File;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Pannello che, a partire dai file di rendicontazione mensile (fogli
 * "DSS... - All. B e C"), calcola per ogni comune di residenza degli
 * utenti quanto richiedere a rimborso per il trasporto (60% dell'importo
 * pieno, essendo il restante 40% a carico ASL) e genera un file di
 * riepilogo per ciascun mese caricato piu' un file di riepilogo
 * complessivo sull'intero periodo.
 */
final class RimborsiComuniPanel extends JPanel {

    private final DefaultListModel<File> fileListModel = new DefaultListModel<>();
    private final JList<File> fileList = new JList<>(fileListModel);
    private final JTextField destinationField = new JTextField();
    private final JTextArea logArea = new JTextArea();
    private final JProgressBar progressBar = new JProgressBar();
    private final JButton processButton = new JButton("Calcola rimborsi");

    private File lastChooserDirectory;

    RimborsiComuniPanel() {
        super(new BorderLayout(8, 8));
        add(buildTopPanel(), BorderLayout.NORTH);
        add(buildFileListPanel(), BorderLayout.CENTER);
        add(buildBottomPanel(), BorderLayout.SOUTH);
    }

    private JPanel buildTopPanel() {
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 0, 10));
        JLabel intro = new JLabel("<html>Carica i file di rendicontazione mensile (fogli \"DSS... - All. B e C\") "
                + "di uno o piu' mesi. Per ogni utente viene letto il comune di residenza, i giorni/importo di "
                + "frequenza e i giorni/importo pieno di trasporto; del trasporto il "
                + "<b>40% resta a carico ASL</b> e il <b>60% viene calcolato come quota a carico del comune</b> "
                + "di residenza, da richiedere a rimborso.<br>"
                + "Per ogni file caricato viene generato un riepilogo per comune (con un foglio di dettaglio "
                + "utenti per ciascun comune, gia' con nomi in iniziali se hai usato prima l'Anonimizzatore), "
                + "piu' un riepilogo complessivo sull'intero periodo caricato.</html>");
        panel.add(intro, BorderLayout.CENTER);
        return panel;
    }

    private JPanel buildFileListPanel() {
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 0, 10));
        panel.add(new JLabel("File di rendicontazione mensile selezionati:"), BorderLayout.NORTH);
        panel.add(new JScrollPane(fileList), BorderLayout.CENTER);

        JPanel buttons = new JPanel(new GridLayout(3, 1, 4, 4));
        JButton addButton = new JButton("Aggiungi file...");
        JButton removeButton = new JButton("Rimuovi selezionati");
        JButton clearButton = new JButton("Svuota elenco");

        addButton.addActionListener(e -> onAddFiles());
        removeButton.addActionListener(e -> onRemoveSelected());
        clearButton.addActionListener(e -> fileListModel.clear());

        buttons.add(addButton);
        buttons.add(removeButton);
        buttons.add(clearButton);

        JPanel buttonsWrapper = new JPanel(new BorderLayout());
        buttonsWrapper.add(buttons, BorderLayout.NORTH);
        panel.add(buttonsWrapper, BorderLayout.EAST);

        return panel;
    }

    private JPanel buildBottomPanel() {
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.setBorder(BorderFactory.createEmptyBorder(0, 10, 10, 10));

        JPanel destinationPanel = new JPanel(new BorderLayout(4, 4));
        destinationField.setEditable(false);
        destinationField.setToolTipText("Se non scelta, i file di riepilogo vengono salvati accanto al primo file caricato");
        JButton chooseDestButton = new JButton("Scegli cartella di destinazione...");
        chooseDestButton.addActionListener(e -> onChooseDestination());
        destinationPanel.add(new JLabel("Cartella di destinazione (opzionale):"), BorderLayout.NORTH);
        destinationPanel.add(destinationField, BorderLayout.CENTER);
        destinationPanel.add(chooseDestButton, BorderLayout.EAST);
        panel.add(destinationPanel, BorderLayout.NORTH);

        logArea.setEditable(false);
        logArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        JScrollPane logScroll = new JScrollPane(logArea);
        logScroll.setPreferredSize(new Dimension(100, 200));
        panel.add(logScroll, BorderLayout.CENTER);

        JPanel actionPanel = new JPanel(new BorderLayout(4, 4));
        progressBar.setStringPainted(true);
        processButton.addActionListener(e -> onProcess());
        actionPanel.add(progressBar, BorderLayout.CENTER);
        actionPanel.add(processButton, BorderLayout.EAST);
        panel.add(actionPanel, BorderLayout.SOUTH);

        return panel;
    }

    private void onAddFiles() {
        JFileChooser chooser = new JFileChooser(lastChooserDirectory);
        chooser.setMultiSelectionEnabled(true);
        chooser.setFileFilter(new FileNameExtensionFilter("File Excel (*.xlsx, *.xls)", "xlsx", "xls"));
        int outcome = chooser.showOpenDialog(this);
        if (outcome == JFileChooser.APPROVE_OPTION) {
            for (File file : chooser.getSelectedFiles()) {
                if (!fileListModel.contains(file)) {
                    fileListModel.addElement(file);
                }
            }
            lastChooserDirectory = chooser.getCurrentDirectory();
        }
    }

    private void onRemoveSelected() {
        for (File file : fileList.getSelectedValuesList()) {
            fileListModel.removeElement(file);
        }
    }

    private void onChooseDestination() {
        JFileChooser chooser = new JFileChooser(lastChooserDirectory);
        chooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
        int outcome = chooser.showOpenDialog(this);
        if (outcome == JFileChooser.APPROVE_OPTION) {
            destinationField.setText(chooser.getSelectedFile().getAbsolutePath());
        }
    }

    private void onProcess() {
        if (fileListModel.isEmpty()) {
            JOptionPane.showMessageDialog(this, "Aggiungi almeno un file di rendicontazione da elaborare.",
                    "Nessun file selezionato", JOptionPane.WARNING_MESSAGE);
            return;
        }

        List<File> files = new ArrayList<>();
        for (int i = 0; i < fileListModel.size(); i++) {
            files.add(fileListModel.get(i));
        }
        String destinationDir = destinationField.getText().trim();
        File defaultDir = files.get(0).getParentFile();

        processButton.setEnabled(false);
        logArea.setText("");
        progressBar.setValue(0);
        progressBar.setMaximum(files.size() + 1);

        new ProcessingWorker(files, destinationDir, defaultDir).execute();
    }

    private final class ProcessingWorker extends SwingWorker<Void, String> {
        private final List<File> files;
        private final String destinationDir;
        private final File defaultDir;
        private int successCount = 0;

        ProcessingWorker(List<File> files, String destinationDir, File defaultDir) {
            this.files = files;
            this.destinationDir = destinationDir;
            this.defaultDir = defaultDir;
        }

        @Override
        protected Void doInBackground() {
            List<MonthlyReportParser.ParsedMonth> parsedMonths = new ArrayList<>();
            int done = 0;
            for (File file : files) {
                try {
                    MonthlyReportParser.ParsedMonth parsed = MonthlyReportParser.parse(file.toPath());
                    if (parsed.records.isEmpty()) {
                        publish(String.format(
                                "[ATTENZIONE] %s -> nessun utente trovato nei fogli DSS (struttura non riconosciuta o file vuoto)",
                                file.getName()));
                    } else {
                        Path outputPath = buildMonthlyOutputPath(file, destinationDir);
                        ComuneReportBuilder.writeReport("Riepilogo comuni - " + parsed.meseLabel, "N. Utenti",
                                parsed.records, outputPath);
                        publish(String.format("%s (%s) -> %s  (%d utenti, %d comuni)",
                                file.getName(), parsed.meseLabel, outputPath.getFileName(),
                                parsed.records.size(), countComuni(parsed.records)));
                        parsedMonths.add(parsed);
                        successCount++;
                    }
                } catch (Exception ex) {
                    publish("[ERRORE] " + file.getName() + ": " + ex.getMessage());
                }
                done++;
                publishProgressValue(done);
            }

            if (parsedMonths.size() > 1) {
                try {
                    List<GuestMonthRecord> all = new ArrayList<>();
                    for (MonthlyReportParser.ParsedMonth m : parsedMonths) {
                        all.addAll(m.records);
                    }
                    String periodo = periodoLabel(parsedMonths);
                    Path outputPath = buildPeriodOutputPath(periodo, destinationDir, defaultDir);
                    ComuneReportBuilder.writeReport("Riepilogo comuni - periodo " + periodo, "N. Utenti-Mese",
                            all, outputPath);
                    publish(String.format("\nRiepilogo complessivo (%s, %d mesi) -> %s",
                            periodo, parsedMonths.size(), outputPath.getFileName()));
                } catch (Exception ex) {
                    publish("[ERRORE] riepilogo complessivo: " + ex.getMessage());
                }
            }
            publishProgressValue(files.size() + 1);
            return null;
        }

        private void publishProgressValue(int done) {
            SwingUtilities.invokeLater(() -> progressBar.setValue(done));
        }

        @Override
        protected void process(List<String> chunks) {
            for (String line : chunks) {
                logArea.append(line + "\n");
            }
        }

        @Override
        protected void done() {
            processButton.setEnabled(true);
            logArea.append(String.format("\nCompletato: %d/%d file elaborati con successo.\n", successCount, files.size()));
        }
    }

    private static int countComuni(List<GuestMonthRecord> records) {
        return (int) records.stream().map(r -> r.comune).distinct().count();
    }

    private static String periodoLabel(List<MonthlyReportParser.ParsedMonth> months) {
        List<MonthlyReportParser.ParsedMonth> sorted = new ArrayList<>(months);
        sorted.sort(Comparator.comparingInt(m -> m.meseSortKey));
        String primo = sorted.get(0).meseLabel;
        String ultimo = sorted.get(sorted.size() - 1).meseLabel;
        return primo.equals(ultimo) ? primo : primo + " - " + ultimo;
    }

    private static Path buildMonthlyOutputPath(File inputFile, String destinationDir) {
        String name = inputFile.getName();
        int dot = name.lastIndexOf('.');
        String baseName = dot >= 0 ? name.substring(0, dot) : name;
        String outputName = baseName + "_rimborsi_comuni.xlsx";

        File targetDir = (destinationDir != null && !destinationDir.isEmpty())
                ? new File(destinationDir)
                : inputFile.getParentFile();
        return new File(targetDir, outputName).toPath();
    }

    private static Path buildPeriodOutputPath(String periodo, String destinationDir, File defaultDir) {
        String safePeriodo = periodo.replaceAll("[\\\\/\\?\\*\\[\\]:]", "").replace(" - ", "_").replace(" ", "");
        String outputName = "Riepilogo_Comuni_" + safePeriodo + ".xlsx";
        File targetDir = (destinationDir != null && !destinationDir.isEmpty()) ? new File(destinationDir) : defaultDir;
        return new File(targetDir, outputName).toPath();
    }
}
