package excelnomi;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;

/**
 * Richiama l'eseguibile esterno "tesseract" (OCR) installato sul PC
 * dell'utente. Non e' incluso nel jar: va installato separatamente (vedi
 * README). Usato per leggere le pagine di un PDF scansionato pagina per
 * pagina, convertendole prima in immagine con {@link PdfPageRenderer}.
 */
final class TesseractRunner {

    private static final Pattern ROTATE_PATTERN = Pattern.compile("Rotate:\\s*(\\d+)");

    private TesseractRunner() {
    }

    static boolean isAvailable() {
        try {
            Process p = new ProcessBuilder("tesseract", "--version").redirectErrorStream(true).start();
            readAll(p.getInputStream());
            return p.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    /** Rileva la rotazione necessaria (0/90/180/270) per raddrizzare il testo della pagina. */
    static int detectRotation(BufferedImage image) {
        try {
            File tmp = writeTempPng(image);
            try {
                Process p = new ProcessBuilder("tesseract", tmp.getAbsolutePath(), "stdout", "--psm", "0")
                        .redirectErrorStream(true).start();
                String output = readAll(p.getInputStream());
                p.waitFor();
                Matcher m = ROTATE_PATTERN.matcher(output);
                if (m.find()) {
                    return Integer.parseInt(m.group(1));
                }
            } finally {
                tmp.delete();
            }
        } catch (Exception ignored) {
            // Se la rilevazione fallisce (es. pagina troppo scarna di testo), si prosegue senza ruotare.
        }
        return 0;
    }

    static String ocrText(BufferedImage image, String lang) throws IOException, InterruptedException {
        File tmp = writeTempPng(image);
        try {
            Process p = new ProcessBuilder("tesseract", tmp.getAbsolutePath(), "stdout", "-l", lang, "--psm", "6")
                    .redirectErrorStream(true).start();
            String output = readAll(p.getInputStream());
            p.waitFor();
            return output;
        } finally {
            tmp.delete();
        }
    }

    private static File writeTempPng(BufferedImage image) throws IOException {
        File tmp = File.createTempFile("ocr-page-", ".png");
        ImageIO.write(image, "png", tmp);
        return tmp;
    }

    private static String readAll(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] chunk = new byte[8192];
        int n;
        while ((n = in.read(chunk)) != -1) {
            buffer.write(chunk, 0, n);
        }
        return new String(buffer.toByteArray(), StandardCharsets.UTF_8);
    }
}
