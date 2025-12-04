export default {
  async saveCurrentRow () {
    try {
      await SaveLigneEncApp.run();
      showAlert("Ligne enregistrée", "success");
      EnceintesAppareil.run();
    } catch (e) {
      console.log("Erreur saveCurrentRow", e);
      showAlert("Échec de l'enregistrement", "error");
    }
  }
};