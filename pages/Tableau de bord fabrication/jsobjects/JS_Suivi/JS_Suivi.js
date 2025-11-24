export default {
  // Récupère l'étape principale pour un groupe (NOTE_CALCUL, PLAN...)
  getEtape(etapes, groupeCode) {
    if (!Array.isArray(etapes)) return null;
    return etapes.find(e => e.groupe_code === groupeCode) || null;
  },

  // Renvoie la couleur hex déjà calculée (ou gris par défaut)
  colorFor(etapes, groupeCode) {
    const step = this.getEtape(etapes, groupeCode);
    return step?.color || "#e5e7eb";
  },

  // Renvoie un petit texte d'état pour affichage si besoin
  labelFor(etapes, groupeCode) {
    const step = this.getEtape(etapes, groupeCode);
    if (!step) return "";
    switch (step.statut_travail) {
      case "non_concerne": return "NC";
      case "non_commence": return "À faire";
      case "en_cours":     return "En cours";
      case "fait":         return "Fait";
      default:             return step.statut_travail;
    }
  }
};
