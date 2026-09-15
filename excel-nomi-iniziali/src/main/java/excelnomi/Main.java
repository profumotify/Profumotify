package excelnomi;

import javax.swing.JFrame;
import javax.swing.JTabbedPane;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;

/**
 * App desktop (nessuna installazione richiesta: e' un unico file .jar
 * eseguibile con "java -jar") con due strumenti per la gestione delle
 * rendicontazioni mensili dei centri diurni:
 * <ul>
 *   <li><b>Anonimizza Nomi</b>: sostituisce i nominativi con le sole
 *       iniziali in nuovi file Excel, senza toccare gli originali;</li>
 *   <li><b>Rimborsi Comuni</b>: calcola, per ogni comune di residenza
 *       degli utenti, la quota di trasporto da richiedere a rimborso.</li>
 * </ul>
 */
public final class Main {

    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
        } catch (Exception ignored) {
            // Se il look and feel di sistema non e' disponibile si usa quello di default.
        }
        SwingUtilities.invokeLater(Main::buildAndShow);
    }

    private static void buildAndShow() {
        JFrame frame = new JFrame("Strumenti Rendicontazione Centri Diurni");
        frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

        JTabbedPane tabs = new JTabbedPane();
        tabs.addTab("Anonimizza Nomi", new AnonimizzatorePanel());
        tabs.addTab("Rimborsi Comuni", new RimborsiComuniPanel());
        frame.add(tabs);

        frame.setSize(820, 620);
        frame.setLocationRelativeTo(null);
        frame.setVisible(true);
    }
}
