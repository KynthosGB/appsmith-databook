export default {
  // Retourne la ligne de l'étape (NOTE_CALCUL, PLAN, APPRO...) pour cet appareil
  getEtape(groupeCode) {
    const rows = QrySuiviFab_Groupes.data || [];
    return rows.find(r => r.groupe_code === groupeCode) || null;
  },

  // Couleur à utiliser pour un groupe (issue de workflow_statut.couleur)
  colorFor(groupeCode) {
    const step = this.getEtape(groupeCode);
    return step?.statut_couleur || "#e5e7eb"; // gris par défaut
  },

  // Libellé du statut (si tu veux l'afficher quelque part)
  statutLabelFor(groupeCode) {
    const step = this.getEtape(groupeCode);
    return step?.statut_libelle || "";
  },

  // 🔹 Code du statut (A_FAIRE, EN_COURS, ...)
  statutCodeFor(groupeCode) {
    const step = this.getEtape(groupeCode);
    return step?.statut_code || "";
  },
};
