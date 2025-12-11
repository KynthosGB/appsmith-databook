export default {
  async saveAll () {
    try {
      // 1) Update table appareils
      await UpdateAppareil.run();

      // 2) Update table caracteristiques_appareils
      await UpdateCaracteristiques.run();
			
      await GetSommaireAppareil.run();
			
      // 3) UI feedback & rafraîchissement
      showAlert('Enregistré', 'success');
      return true;
    } catch (e) {
      showAlert(e?.message || "Échec de l'enregistrement", "error");
      return false;
    }
  }
}
