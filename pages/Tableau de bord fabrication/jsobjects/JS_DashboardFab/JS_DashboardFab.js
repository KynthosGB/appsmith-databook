export default {
  // Récupère l'étape (NOTE_CALCUL, PLAN, ...)
  getStep(etapes, groupCode) {
    if (!Array.isArray(etapes)) return null;
    return etapes.find(x => x.groupe_code === groupCode) || null;
  },

  getLabel(etapes, groupCode) {
    const s = this.getStep(etapes, groupCode);
    return s?.statut_libelle || "";
  },

  getColor(etapes, groupCode) {
    const s = this.getStep(etapes, groupCode);
    return s?.statut_couleur || "#e5e7eb";
  },

  // Calcul du retard en jours
  delayDays(etapes, groupCode) {
    const s = this.getStep(etapes, groupCode);
    if (!s || !s.date_objectif || !s.date_fin) return "";

    const obj = moment(s.date_objectif);
    const fin = moment(s.date_fin);

    const diff = fin.diff(obj, "days");
    return diff > 0 ? diff : "";
  },

  // ----------------------------------------
  // Fonction principale appelée dans le widget
  // ----------------------------------------
  buildRows() {
    const rows = QryDashboardSuiviFabrication.data || [];

    return rows.map(r => ({
      appareil: r.numero_appareil,
      nom_appareil: r.nom_appareil,
      client: r.client,
      delai: r.delai,

      // NOTE DE CALCUL
      ndc: this.delayDays(r.etapes, "NOTE_CALCUL"),
      ndc_color: this.getColor(r.etapes, "NOTE_CALCUL"),

      // PLAN
      plan: this.delayDays(r.etapes, "PLAN"),
      plan_color: this.getColor(r.etapes, "PLAN"),

      // CAHIER DE SOUDAGE
      cds: this.delayDays(r.etapes, "CAHIER_SOUDAGE"),
      cds_color: this.getColor(r.etapes, "CAHIER_SOUDAGE"),

      // PREPARATION
      prepa: this.delayDays(r.etapes, "PREPARATION"),
      prepa_color: this.getColor(r.etapes, "PREPARATION"),

      // APPRO (pas de retard calculé)
			appro_delay: this.delayDays(r.etapes, "APPRO"),
      appro_label: this.getLabel(r.etapes, "APPRO"),
      appro_color: this.getColor(r.etapes, "APPRO"),

      // DVAI
      dvai: this.getLabel(r.etapes, "DVAI"),
      dvai_color: this.getColor(r.etapes, "DVAI"),

      // FAB
      fab: this.getLabel(r.etapes, "FABRICATION"),
      fab_color: this.getColor(r.etapes, "FABRICATION"),

      // DOSSIER CE
      dossier_ce: this.getLabel(r.etapes, "DOSSIER_CE"),
      dossier_ce_color: this.getColor(r.etapes, "DOSSIER_CE"),

      // DOSSIER CONSTRUCTEUR
      dc: this.getLabel(r.etapes, "DOSSIER_CONSTRUCTEUR"),
      dc_color: this.getColor(r.etapes, "DOSSIER_CONSTRUCTEUR"),

      // stats brutes
      total_etapes: r.total_etapes,
      etapes_faites: r.etapes_faites,
      etapes_en_cours: r.etapes_en_cours,
      etapes_a_faire: r.etapes_a_faire,
      nb_en_attente_client: r.nb_en_attente_client,

      // raw
      etapes: r.etapes,
    }));
  }
};
