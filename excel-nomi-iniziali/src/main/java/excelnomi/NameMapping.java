package excelnomi;

/**
 * Una coppia nome originale / iniziali generata durante l'anonimizzazione,
 * usata per costruire il file di corrispondenza riservato.
 */
final class NameMapping {
    final String nomeOriginale;
    final String iniziali;

    NameMapping(String nomeOriginale, String iniziali) {
        this.nomeOriginale = nomeOriginale;
        this.iniziali = iniziali;
    }
}
