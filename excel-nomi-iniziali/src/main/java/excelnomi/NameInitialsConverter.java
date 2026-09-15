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

    // Testo gia' nella forma "N.G." o "S.A.M.R.": evita di ri-trasformare (e quindi
    // troncare) un valore su cui il programma e' gia' stato eseguito in precedenza.
    private static final Pattern ALREADY_INITIALS = Pattern.compile("^(\\p{Lu}\\.)+$");

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
        if (ALREADY_INITIALS.matcher(trimmed).matches()) {
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
