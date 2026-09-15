package excelnomi;

import java.util.regex.Pattern;

/**
 * Trasforma un nominativo completo ("Cognome e Nome", eventualmente con
 * doppi nomi/cognomi) nelle sole iniziali di ogni parola, es.:
 * "Cuoccio Raffaella" -> "C.R."
 * "Maria Luisa De Rossi" -> "M.L.D.R."
 */
final class NameInitialsConverter {

    // Almeno due lettere alfabetiche: esclude numeri, sigle gia' in iniziali, celle vuote.
    private static final Pattern HAS_LETTERS = Pattern.compile(".*\\p{L}.*\\p{L}.*");

    private NameInitialsConverter() {
    }

    static boolean looksLikeName(String value) {
        if (value == null) {
            return false;
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return false;
        }
        return HAS_LETTERS.matcher(trimmed).matches();
    }

    static String toInitials(String fullName) {
        String trimmed = fullName.trim();
        String[] words = trimmed.split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (word.isEmpty()) {
                continue;
            }
            char first = word.charAt(0);
            result.append(Character.toUpperCase(first)).append('.');
        }
        return result.toString();
    }
}
