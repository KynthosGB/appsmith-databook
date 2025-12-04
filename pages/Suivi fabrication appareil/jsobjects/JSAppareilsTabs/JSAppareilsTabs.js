export default {
  // Appelé au chargement de la page
  init() {
    const rows = QryAppareilsAffaire.data || [];
    if (!rows.length) {
      return;
    }

    const current = appsmith.store.appareilSelectionne;

    // Si rien en store ou si l'appareil n'existe plus, on prend le 1er
    const stillExists = rows.some(r => r.numero_appareil === current);
    if (!current || !stillExists) {
      storeValue("appareilSelectionne", rows[0].numero_appareil);
    }
  },

  // Sélection d'un appareil
  setSelected(numero_appareil) {
    return storeValue("appareilSelectionne", numero_appareil);
  },

  // Savoir si un appareil est l'onglet actif
  isSelected(numero_appareil) {
    return appsmith.store.appareilSelectionne === numero_appareil;
  }
};
