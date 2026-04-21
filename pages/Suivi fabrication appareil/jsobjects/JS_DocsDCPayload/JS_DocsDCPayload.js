export default {
  /** Convertit YYYY-MM-DD → DD/MM/YYYY */
  formatDateISOToFR(d) {
    if (!d) return null;
    return moment(d).format("DD/MM/YYYY");
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
  },
	
	formatControlesAppareil(list = []) {
		const result = {};

		(list || []).forEach(c => {
			const code = c.controle_code;
			if (!code) return;

			result[code] = {
				...c,
				afficher: c.na !== true
			};
		});

		return result;
	}
};
