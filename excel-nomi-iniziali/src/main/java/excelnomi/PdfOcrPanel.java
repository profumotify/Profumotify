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
import java.util.List;

/**
 * Pannello che converte un PDF di rendicontazione scansionato in un file
 * Excel con la stessa struttura dei fogli "DSS... - All. B e C", usando
 * l'OCR (Tesseract, da installare a parte) sulle pagine "Modulo G" e
 * "Allegato A". Comune di residenza e Buono trasporto restano da
 * compilare a mano (evidenziati in giallo nel file generato): la tabella
 * densa da cui andrebbero letti si e' rivelata inaffidabile con l'OCR.
 */
final class PdfOcrPanel extends JPanel {

    private final DefaultListModel<File> fileListModel = new DefaultListModel<>();
    private final JList<File> fileList = new JList<>(fileListModel);
    private final JTextField destinationField = new JTextField();
    private final JTextArea logArea = new JTextArea();
    private final JProgressBar progressBar = new JProgressBar();
    private final JButton processButton = new JButton("Converti PDF");
    private final JLabel tesseractStatusLabel = new JLabel();

    private File lastChooserDirectory;

    PdfOcrPanel() {
        super(new BorderLayout(8, 8));
        add(buildTopPanel(), BorderLayout.NORTH);
        add(buildFileListPanel(), BorderLayout.CENTER);
        add(buildBottomPanel(), BorderLayout.SOUTH);
        refreshTesseractStatus();
    }

    private JPanel buildTopPanel() {
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 0, 10));
        JLabel intro = new JLabel("<html>Converte un PDF <b>scansionato</b> di rendicontazione mensile in un file "
                + "Excel compatibile con la scheda \"Rimborsi Comuni\". Legge in modo affidabile, tramite OCR, "
                + "le pagine \"Modulo G\" (nominativo, data di nascita, giorni presenza/trasporto) e la pagina "
                + "\"Allegato A\" (mese di riferimento).<br>"
                + "<b>Comune di residenza</b> e <b>Buono trasporto SI/NO</b> restano celle vuote evidenziate in "
                + "giallo nel file generato: vanno compilate a mano guardando la pagina \"Allegato B\" del PDF "
                + "(la lettura automatica di quella tabella densa si e' rivelata inaffidabile). Una volta "
                + "completato, il file e' pronto per l'Anonimizzatore/Rimborsi Comuni.</html>");
        panel.add(intro, BorderLayout.CENTER);
        panel.add(tesseractStatusLabel, BorderLayout.SOUTH);
        return panel;
    }

    private JPanel buildFileListPanel() {
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 0, 10));
        panel.add(new JLabel("File PDF selezionati:"), BorderLayout.NORTH);
        panel.add(new JScrollPane(fileList), BorderLayout.CENTER);

        JPanel buttons = new JPanel(new GridLayout(4, 1, 4, 4));
        JButton addButton = new JButton("Aggiungi PDF...");
        JButton removeButton = new JButton("Rimuovi selezionati");
        JButton clearButton = new JButton("Svuota elenco");
        JButton checkTesseractButton = new JButton("Verifica Tesseract");

        addButton.addActionListener(e -> onAddFiles());
        removeButton.addActionListener(e -> onRemoveSelected());
        clearButton.addActionListener(e -> fileListModel.clear());
        checkTesseractButton.addActionListener(e -> refreshTesseractStatus());

        buttons.add(addButton);
        buttons.add(removeButton);
        buttons.add(clearButton);
        buttons.add(checkTesseractButton);

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
        destinationField.setToolTipText("Se non scelta, il file Excel viene salvato accanto al PDF");
        JButton chooseDestButton = new JButton("Scegli cartella di destinazione...");
        chooseDestButton.addActionListener(e -> onChooseDestination());
        destinationPanel.add(new JLabel("Cartella di destinazione (opzionale):"), BorderLayout.NORTH);
        destinationPanel.add(destinationField, BorderLayout.CENTER);
        destinationPanel.add(chooseDestButton, BorderLayout.EAST);
        panel.add(destinationPanel, BorderLayout.NORTH);

        logArea.setEditable(false);
        logArea.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 12));
        JScrollPane logScroll = new JScrollPane(logArea);
        logScroll.setPreferredSize(new Dimension(100, 220));
        panel.add(logScroll, BorderLayout.CENTER);

        JPanel actionPanel = new JPanel(new BorderLayout(4, 4));
        progressBar.setStringPainted(true);
        processButton.addActionListener(e -> onProcess());
        actionPanel.add(progressBar, BorderLayout.CENTER);
        actionPanel.add(processButton, BorderLayout.EAST);
        panel.add(actionPanel, BorderLayout.SOUTH);

        return panel;
    }

    private void refreshTesseractStatus() {
        boolean available = TesseractRunner.isAvailable();
        if (available) {
            tesseractStatusLabel.setText("<html><font color='green'>&#10003; Tesseract OCR trovato: pronto per la conversione.</font></html>");
        } else {
            tesseractStatusLabel.setText("<html><font color='red'>&#10007; Tesseract OCR non trovato: installalo prima di procedere "
                    + "(vedi README per il link all'installer Windows).</font></html>");
        }
    }

    private void onAddFiles() {
        JFileChooser chooser = new JFileChooser(lastChooserDirectory);
        chooser.setMultiSelectionEnabled(true);
        chooser.setFileFilter(new FileNameExtensionFilter("File PDF (*.pdf)", "pdf"));
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
            JOptionPane.showMessageDialog(this, "Aggiungi almeno un file PDF da convertire.",
                    "Nessun file selezionato", JOptionPane.WARNING_MESSAGE);
            return;
        }
        if (!TesseractRunner.isAvailable()) {
            JOptionPane.showMessageDialog(this,
                    "Tesseract OCR non e' installato o non e' nel PATH di sistema.\nInstallalo (vedi README) e riprova.",
                    "Tesseract non trovato", JOptionPane.ERROR_MESSAGE);
            return;
        }

        List<File> files = new ArrayList<>();
        for (int i = 0; i < fileListModel.size(); i++) {
            files.add(fileListModel.get(i));
        }
        String destinationDir = destinationField.getText().trim();

        processButton.setEnabled(false);
        logArea.setText("");
        progressBar.setValue(0);
        progressBar.setMaximum(files.size());

        new ConversionWorker(files, destinationDir).execute();
    }

    private final class ConversionWorker extends SwingWorker<Void, String> {
        private final List<File> files;
        private final String destinationDir;
        private int successCount = 0;

        ConversionWorker(List<File> files, String destinationDir) {
            this.files = files;
            this.destinationDir = destinationDir;
        }

        @Override
        protected Void doInBackground() {
            int done = 0;
            for (File file : files) {
                publish("=== " + file.getName() + " ===");
                try {
                    Path outputPath = buildOutputPath(file, destinationDir);
                    PdfOcrConverter.Risultato r = PdfOcrConverter.convert(file.toPath(), outputPath, this::publish);
                    publish(String.format(
                            "%s -> %s  (mese: %s, pagine totali: %d, utenti letti: %d, da verificare: %d)",
                            file.getName(), outputPath.getFileName(), r.meseLabel, r.pagineTotali,
                            r.pagineModuloG, r.righeIncomplete));
                    publish("Ricorda di compilare Comune di residenza e Buono trasporto (celle gialle) prima di usare il file.");
                    successCount++;
                } catch (Exception ex) {
                    publish("[ERRORE] " + file.getName() + ": " + ex.getMessage());
                }
                done++;
                publishProgressValue(done);
            }
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

    private static Path buildOutputPath(File inputFile, String destinationDir) {
        String name = inputFile.getName();
        int dot = name.lastIndexOf('.');
        String baseName = dot >= 0 ? name.substring(0, dot) : name;
        String outputName = baseName + "_da_pdf.xlsx";

        File targetDir = (destinationDir != null && !destinationDir.isEmpty())
                ? new File(destinationDir)
                : inputFile.getParentFile();
        return new File(targetDir, outputName).toPath();
    }
}
