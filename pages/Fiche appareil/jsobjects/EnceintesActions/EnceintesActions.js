export default {
  async saveCurrentRow () {
    // index de la ligne concernée par le onSubmit
    const idx = TableEnceintesAppareil.triggeredRowIndex;

    if (idx === undefined || idx === null || idx < 0) {
      return;
    }

    // ligne telle qu'elle est dans le tableau après édition
    const r = TableEnceintesAppareil.tableData[idx];

    if (!r) return;

    try {
      await SaveLigneEncApp.run({
        ...r,
        // normaliser les champs spéciaux si besoin
        date_epreuve: r.date_epreuve ?? null,
        numero_appareil: appsmith.URL.queryParams.numero_appareil,
      });

      showAlert("Ligne enregistrée", "success");
      // rafraîchir la query si tu veux forcer le reload depuis la BDD
      EnceintesAppareil.run();
    } catch (e) {
      showAlert("Échec de l'enregistrement", "error");
      console.log("Erreur saveCurrentRow", e);
    }
  }
};
