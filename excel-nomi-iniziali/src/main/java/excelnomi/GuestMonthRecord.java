package excelnomi;

/**
 * Riga di rendicontazione di un utente in un mese, cosi' come letta da un
 * foglio "DSS... - All. B e C": comune di residenza, giorni/rimborso di
 * frequenza e giorni/rimborso di trasporto (importo pieno, prima della
 * ripartizione 40% ASL / 60% Comune).
 */
final class GuestMonthRecord {

    static final double QUOTA_ASL_TRASPORTO = 0.4;
    static final double QUOTA_COMUNE_TRASPORTO = 0.6;

    final String mese;
    final int meseSortKey;
    final String distretto;
    final String nominativo;
    final String comune;
    final int giorniFrequenza;
    final double rimborsoFrequenza;
    final int giorniTrasporto;
    final String buonoTrasporto;
    final double rimborsoTrasportoPieno;

    GuestMonthRecord(String mese, int meseSortKey, String distretto, String nominativo, String comune,
                      int giorniFrequenza, double rimborsoFrequenza,
                      int giorniTrasporto, String buonoTrasporto, double rimborsoTrasportoPieno) {
        this.mese = mese;
        this.meseSortKey = meseSortKey;
        this.distretto = distretto;
        this.nominativo = nominativo;
        this.comune = comune;
        this.giorniFrequenza = giorniFrequenza;
        this.rimborsoFrequenza = rimborsoFrequenza;
        this.giorniTrasporto = giorniTrasporto;
        this.buonoTrasporto = buonoTrasporto;
        this.rimborsoTrasportoPieno = rimborsoTrasportoPieno;
    }

    double quotaAslTrasporto() {
        return rimborsoTrasportoPieno * QUOTA_ASL_TRASPORTO;
    }

    double quotaComuneTrasporto() {
        return rimborsoTrasportoPieno * QUOTA_COMUNE_TRASPORTO;
    }
}
