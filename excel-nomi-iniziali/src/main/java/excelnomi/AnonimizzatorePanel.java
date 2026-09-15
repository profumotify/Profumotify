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
 * Pannello che sostituisce, in un gruppo di file Excel (es. i 12 mesi
 * dell'anno piu' eventuali file aggiuntivi), i nominativi presenti nelle
 * colonne "Cognome e Nome" (e nel testo libero) con le sole iniziali,
 * generando nuovi file senza toccare gli originali.
 */
final class AnonimizzatorePanel extends JPanel {

    private final DefaultListModel<File> fileListModel = new DefaultListModel<>();
    private final JList<File> fileList = new JList<>(fileListModel);
    private final JTextField keywordsField = new JTextField(String.join(", ", ExcelProcessor.DEFAULT_HEADER_KEYWORDS));
    private final JTextField anchorsField = new JTextField(String.join(", ", FreeTextNameRedactor.DEFAULT_ANCHOR_PHRASES));
    private final JTextField destinationField = new JTextField();
    private final JTextArea logArea = new JTextArea();
    private final JProgressBar progressBar = new JProgressBar();
    private final JButton processButton = new JButton("Elabora file");

    private File lastChooserDirectory;

    AnonimizzatorePanel() {
        super(new BorderLayout(8, 8));
        add(buildTopPanel(), BorderLayout.NORTH);
        add(buildFileListPanel(), BorderLayout.CENTER);
        add(buildBottomPanel(), BorderLayout.SOUTH);
    }

    private JPanel buildTopPanel() {
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.setBorder(BorderFactory.createEmptyBorder(10, 10, 0, 10));

        JLabel intro = new JLabel("<html>Carica i file Excel da elaborare (es. i 12 file dei mesi, "
                + "piu' eventuali file aggiuntivi). In <b>ogni foglio</b> di ogni file, i nominativi "
                + "trovati in colonne tipo \"Cognome e Nome\" e nel testo libero (es. moduli di "
                + "dichiarazione/dimissione) verranno sostituiti con le sole iniziali "
                + "(es. \"Maria Luisa De Rossi\" &rarr; \"M.L.D.R.\") in <b>nuovi</b> file, "
                + "senza toccare gli originali.</html>");
        panel.add(intro, BorderLayout.NORTH);

        JPanel keywordsPanel = new JPanel(new GridLayout(2, 1, 4, 8));
        keywordsPanel.setBorder(BorderFactory.createEmptyBorder(8, 0, 8, 0));

        JPanel headerRow = new JPanel(new BorderLayout(4, 4));
        headerRow.add(new JLabel("Intestazioni colonna da riconoscere (separate da virgola):"), BorderLayout.NORTH);
        headerRow.add(keywordsField, BorderLayout.CENTER);
        keywordsPanel.add(headerRow);

        JPanel anchorRow = new JPanel(new BorderLayout(4, 4));
        anchorRow.add(new JLabel("Frasi-ancora per nomi nel testo libero (separate da virgola):"), BorderLayout.NORTH);
        anchorRow.add(anchorsField, BorderLayout.CENTER);
        keywordsPanel.add(anchorRow);

        panel.add(keywordsPanel, BorderLayout.CENTER);

        return panel;
    }

    private JPanel buildFileListPanel() {
        JPanel panel = new JPanel(new BorderLayout(4, 4));
        panel.setBorder(BorderFactory.createEmptyBorder(0, 10, 0, 10));
        panel.add(new JLabel("File Excel selezionati:"), BorderLayout.NORTH);
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
        destinationField.setToolTipText("Se non scelta, ogni file trasformato viene salvato accanto all'originale");
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
            JOptionPane.showMessageDialog(this, "Aggiungi almeno un file Excel da elaborare.",
                    "Nessun file selezionato", JOptionPane.WARNING_MESSAGE);
            return;
        }

        List<String> keywords = new ArrayList<>();
        for (String part : keywordsField.getText().split(",")) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                keywords.add(trimmed);
            }
        }
        if (keywords.isEmpty()) {
            keywords = ExcelProcessor.DEFAULT_HEADER_KEYWORDS;
        }

        List<String> anchors = new ArrayList<>();
        for (String part : anchorsField.getText().split(",")) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                anchors.add(trimmed);
            }
        }
        if (anchors.isEmpty()) {
            anchors = FreeTextNameRedactor.DEFAULT_ANCHOR_PHRASES;
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

        new ProcessingWorker(files, keywords, anchors, destinationDir).execute();
    }

    private final class ProcessingWorker extends SwingWorker<Void, String> {
        private final List<File> files;
        private final List<String> keywords;
        private final List<String> anchors;
        private final String destinationDir;
        private int successCount = 0;

        ProcessingWorker(List<File> files, List<String> keywords, List<String> anchors, String destinationDir) {
            this.files = files;
            this.keywords = keywords;
            this.anchors = anchors;
            this.destinationDir = destinationDir;
        }

        @Override
        protected Void doInBackground() {
            int done = 0;
            for (File file : files) {
                try {
                    Path outputPath = buildOutputPath(file, destinationDir);
                    ExcelProcessor.Result result = ExcelProcessor.process(file.toPath(), outputPath, keywords, anchors);
                    int totalTransformed = result.namesTransformed + result.freeTextNamesTransformed;
                    if (totalTransformed == 0) {
                        publish(String.format(
                                "[ATTENZIONE] %s -> nessun nominativo riconosciuto (0 colonne, 0 nel testo libero)",
                                result.inputFileName));
                    } else {
                        publish(String.format(
                                "%s -> %s  (colonne trovate: %d, nominativi in colonna: %d, nel testo libero: %d)",
                                result.inputFileName, result.outputFile.getFileName(), result.columnsFound,
                                result.namesTransformed, result.freeTextNamesTransformed));
                    }
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
        String extension = dot >= 0 ? name.substring(dot) : "";
        String outputName = baseName + "_iniziali" + extension;

        File targetDir = (destinationDir != null && !destinationDir.isEmpty())
                ? new File(destinationDir)
                : inputFile.getParentFile();
        return new File(targetDir, outputName).toPath();
    }
}
