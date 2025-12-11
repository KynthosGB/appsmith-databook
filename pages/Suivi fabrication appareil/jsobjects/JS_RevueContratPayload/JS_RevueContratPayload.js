export default {
  /** Convertit YYYY-MM-DD → DD/MM/YYYY */
  formatDateISOToFR(d) {
    if (!d) return null;
    return moment(d).format("DD/MM/YYYY");
  },

  /** Formattage revue_de_contrat */
  formatRevue(raw) {
    if (!raw) return {};

    return {
      ...raw,

      date_devis: this.formatDateISOToFR(raw.date_devis),
      date_appel_doffre: this.formatDateISOToFR(raw.date_appel_doffre),
      date_livraison_prev: this.formatDateISOToFR(raw.date_livraison_prev),

      // tu peux retirer les champs techniques :
      // id: undefined,
      // created_at: undefined,
      // updated_at: undefined,
    };
  },

  /** Formattage donnees_generales_affaire */
  formatDonneesGeneralesAffaire(raw) {
    if (!raw) return {};

    return {
      ...raw,

      // d'après ton JSON, la seule date ici est :
      date_creation_dossier: this.formatDateISOToFR(raw.date_creation_dossier),
    };
  },

  /** Formattage caracteristiques_appareil */
  formatCaracteristiques(raw) {
    if (!raw) return {};

    return {
      ...raw,

      date_livraison: this.formatDateISOToFR(raw.date_livraison),
      // ajoute ici d'autres dates si tu en ajoutes plus tard
    };
  },

  /** Formattage liste des enceintes (si tu veux) */
  formatEnceintes(list = []) {
    return (list || []).map(e => ({
      ...e,
      date_epreuve: this.formatDateISOToFR(e.date_epreuve),
    }));
  }
};
