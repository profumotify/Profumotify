package excelnomi;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;

import java.awt.image.BufferedImage;
import java.awt.image.AffineTransformOp;
import java.awt.geom.AffineTransform;
import java.io.IOException;
import java.nio.file.Path;

/**
 * Converte le pagine di un PDF in immagini (usando Apache PDFBox, libreria
 * Java pura: non serve alcun programma esterno per questo passaggio,
 * solo per l'OCR vero e proprio serve Tesseract installato a parte).
 */
final class PdfPageRenderer {

    private static final int DPI = 400;

    private PdfPageRenderer() {
    }

    static int countPages(Path pdfFile) throws IOException {
        try (PDDocument doc = PDDocument.load(pdfFile.toFile())) {
            return doc.getNumberOfPages();
        }
    }

    interface PageCallback {
        void onPage(int pageIndex, BufferedImage image) throws IOException, InterruptedException;
    }

    static void forEachPage(Path pdfFile, PageCallback callback) throws IOException, InterruptedException {
        try (PDDocument doc = PDDocument.load(pdfFile.toFile())) {
            PDFRenderer renderer = new PDFRenderer(doc);
            int n = doc.getNumberOfPages();
            for (int i = 0; i < n; i++) {
                BufferedImage image = renderer.renderImageWithDPI(i, DPI, ImageType.RGB);
                callback.onPage(i, image);
            }
        }
    }

    /** Ruota l'immagine in senso orario del numero di gradi indicato (0/90/180/270). */
    static BufferedImage rotate(BufferedImage image, int degreesClockwise) {
        if (degreesClockwise % 360 == 0) {
            return image;
        }
        double radians = Math.toRadians(degreesClockwise);
        int w = image.getWidth();
        int h = image.getHeight();
        boolean swap = degreesClockwise == 90 || degreesClockwise == 270;
        int newW = swap ? h : w;
        int newH = swap ? w : h;

        BufferedImage rotated = new BufferedImage(newW, newH, image.getType() == 0 ? BufferedImage.TYPE_INT_RGB : image.getType());
        AffineTransform transform = new AffineTransform();
        transform.translate(newW / 2.0, newH / 2.0);
        transform.rotate(radians);
        transform.translate(-w / 2.0, -h / 2.0);
        AffineTransformOp op = new AffineTransformOp(transform, AffineTransformOp.TYPE_BILINEAR);
        op.filter(image, rotated);
        return rotated;
    }
}
