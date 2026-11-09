package excelnomi;

/**
 * Riga di rendicontazione di un utente in un mese, cosi' come letta da un
 * foglio "DSS... - All. B e C": comune di residenza, giorni/rimborso di
 * frequenza e giorni/rimborso di trasporto.
 * <p>
 * Il trasporto ha una tariffa piena di 14,50 €/giorno. Quando l'utente
 * usufruisce del "Buono servizio trasporto" (SI), una parte del costo
 * (3,11 €/giorno) e' gia' coperta dal buono e il rimborso ASL registrato
 * in rendicontazione e' quindi ridotto a 11,39 €/giorno. La ripartizione
 * 40% ASL / 60% Comune va pero' calcolata sulla tariffa PIENA: la quota
 * ASL resta sempre il 40% di 14,50 €/giorno, mentre lo sconto del buono
 * viene sottratto per intero dalla sola quota Comune (non proporzionalmente
 * da entrambe).
 */
final class GuestMonthRecord {

    static final double TARIFFA_PIENA_GIORNALIERA = 14.50;
    static final double TARIFFA_SCONTATA_GIORNALIERA = 11.39;
    static final double SCONTO_BUONO_GIORNALIERO = TARIFFA_PIENA_GIORNALIERA - TARIFFA_SCONTATA_GIORNALIERA; // 3,11

    static final double QUOTA_ASL_TRASPORTO = 0.4;
    static final double QUOTA_COMUNE_TRASPORTO = 0.6;

    final String mese;
    final int meseSortKey;
    final String distretto;
    final String nominativo;
    final Integer annoNascita;
    final String comune;
    final int giorniFrequenza;
    final double rimborsoFrequenza;
    final int giorniTrasporto;
    final String buonoTrasporto;
    final double rimborsoTrasportoPieno;

    GuestMonthRecord(String mese, int meseSortKey, String distretto, String nominativo, Integer annoNascita,
                      String comune, int giorniFrequenza, double rimborsoFrequenza,
                      int giorniTrasporto, String buonoTrasporto, double rimborsoTrasportoPieno) {
        this.mese = mese;
        this.meseSortKey = meseSortKey;
        this.distretto = distretto;
        this.nominativo = nominativo;
        this.annoNascita = annoNascita;
        this.comune = comune;
        this.giorniFrequenza = giorniFrequenza;
        this.rimborsoFrequenza = rimborsoFrequenza;
        this.giorniTrasporto = giorniTrasporto;
        this.buonoTrasporto = buonoTrasporto;
        this.rimborsoTrasportoPieno = rimborsoTrasportoPieno;
    }

    private boolean haBuono() {
        return buonoTrasporto != null && buonoTrasporto.trim().equalsIgnoreCase("SI");
    }

    /** Importo del trasporto a tariffa piena (14,50 €/giorno), prima di qualunque sconto buono. */
    double importoPienoTariffaBase() {
        return giorniTrasporto * TARIFFA_PIENA_GIORNALIERA;
    }

    /** Sconto totale dovuto al Buono servizio trasporto, interamente a carico della quota Comune. */
    double scontoBuonoServizio() {
        return haBuono() ? giorniTrasporto * SCONTO_BUONO_GIORNALIERO : 0.0;
    }

    /** Quota ASL: sempre il 40% della tariffa piena, non influenzata dal buono. */
    double quotaAslTrasporto() {
        return importoPienoTariffaBase() * QUOTA_ASL_TRASPORTO;
    }

    /** Quota Comune: 60% della tariffa piena, meno l'intero sconto del buono servizio. */
    double quotaComuneTrasporto() {
        return importoPienoTariffaBase() * QUOTA_COMUNE_TRASPORTO - scontoBuonoServizio();
    }
}
