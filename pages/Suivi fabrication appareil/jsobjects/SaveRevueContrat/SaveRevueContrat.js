export default {
  // Récupère le numero_appareil courant
  numeroAppareil() {
    // Adapte si besoin selon ta page
    return appsmith.URL.queryParams.numero_appareil
      || SelectAppareil.selectedOptionValue
      || "";
  },

  // Sauvegarde générique d'un champ
  async saveField(fieldName, fieldValue) {
		const num = this.numeroAppareil();
		if (!num) {
			showAlert("Aucun appareil sélectionné pour la revue de contrat.", "warning");
			return;
		}

		try {
			await UpdateRevueContrat.run({
				fieldName,
				fieldValue,
			});
			showAlert("Enregistré ✔️", "success");
		} catch (e) {
			showAlert("Erreur en sauvegardant la revue de contrat.", "error");
			console.error(e);
		}
	}

};
