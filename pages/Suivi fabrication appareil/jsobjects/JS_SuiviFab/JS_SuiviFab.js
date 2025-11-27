export default {
  rows() {
		return QrySuiviFab_Groupes.data || [];
	},

  getRowByCode(code) {
    return this.rows().find(r => r.groupe_code === code) || null;
  },

  statutByCode(code) {
    const rows = QrySuiviFab_Statuts.data || [];
    return rows.find(s => s.code === code) || null;
  },

  refreshBar() {
		return QrySuiviFab_Groupes.run();
	},

  // --- délai "Livraison le :" ---

  saveDelai() {
    const numero_appareil = appsmith.URL.queryParams.numero_appareil;
    if (!numero_appareil) return;

    const delai = DateLivraison.selectedDate
      ? moment(DateLivraison.selectedDate).format("YYYY-MM-DD")
      : null;

    return SaveSuivi_DelaiAppareil.run({
      numero_appareil,
      delai,
    }).catch(e => {
      console.log("Erreur save délai", e);
      showAlert("Erreur lors de l'enregistrement du délai", "error");
    });
  },

  // --- statuts des groupes ---

  setStatutForGroupe(groupeCode, statutCode) {
    const row = this.getRowByCode(groupeCode);
    const statut = this.statutByCode(statutCode);
    if (!row || !statut) return;

    if (row.statut_id === statut.id) return;

    return SaveSuivi_Header.run({
      groupe_appareil_id: row.groupe_appareil_id,
      statut_id: statut.id,
    }).then(() => this.refreshBar());
  },

  setEnCoursIfNeeded(groupeCode) {
    const row = this.getRowByCode(groupeCode);
    if (!row) return;

    if (row.statut_code === "A_FAIRE") {
      return this.setStatutForGroupe(groupeCode, "EN_COURS");
    }
  },
	
	saveNoteCalcul() {
    const row = this.getRowByCode("NOTE_CALCUL");
    if (!row) return;

    const numero = NumNDC.text;          // champ "Numéro"
    const indice = IndiceNDC.text;          // champ "Indice"
    const dateObj = DateObjectifNDC.selectedDate;     // champ "Date obj."
    const dateEdition = DateEditionNDC.selectedDate; // champ "Date édition"

    return SaveSuivi_NoteCalcul.run({
      groupe_appareil_id: row.groupe_appareil_id,
      numero: numero || null,
      indice: indice || null,
      date_objectif: dateObj
        ? moment(dateObj).format("YYYY-MM-DD")
        : null,
      date_edition: dateEdition
        ? moment(dateEdition).format("YYYY-MM-DD")
        : null,
    })
    .then(() => {
      showAlert("Infos note de calcul mises à jour ✅", "success");
    })
		.catch(e => {
      console.log("Erreur save note de calcul", e);
      showAlert("Erreur lors de l'enregistrement de la note de calcul", "error");
    });
  },
	
	// --- PLAN ---
  savePlan() {
    const row = this.getRowByCode("PLAN");
    if (!row) return;

    // ⚠️ remplace ces noms par les tiens
    const numero       = NumPlan.text;
    const indice       = IndicePlan.text;
    const dessinateur  = Dessinateur.text;

    const dateObj      = DatePlanObjectif.selectedDate;
    const dateDebut    = DateDebutPlan.selectedDate;
    const dateEnvoi1   = Date1erEnvoiPlan.selectedDate;
    const dateFin      = DateFinPlan.selectedDate;

    return SaveSuivi_Plan.run({
      groupe_appareil_id: row.groupe_appareil_id,
      numero: numero || null,
      indice: indice || null,
      dessinateur: dessinateur || null,

      date_objectif: dateObj
        ? moment(dateObj).format("YYYY-MM-DD")
        : null,

      date_debut: dateDebut
        ? moment(dateDebut).format("YYYY-MM-DD")
        : null,

      date_premier_envoi: dateEnvoi1
        ? moment(dateEnvoi1).format("YYYY-MM-DD")
        : null,

      date_fin: dateFin
        ? moment(dateFin).format("YYYY-MM-DD")
        : null,
    })
      .then(() => {
        showAlert("Infos plan mises à jour ✅", "success");
      })
      .catch(e => {
        console.log("Erreur save plan", e);
        showAlert("Erreur lors de l'enregistrement du plan", "error");
      });
  },
	
	// --- CAHIER DE SOUDAGE ---
	saveCahierSoudage() {
		const row = this.getRowByCode("CAHIER_SOUDAGE");
		if (!row) return;

		// ⚠️ adapter les noms de widgets :
		const iwt      = IWT.text;
		const numero   = InputNumCDS.text;
		const indice   = InputIndiceCDS.text;

		const dateObj  = DateCDSObjectif.selectedDate;
		const dateDeb  = DateDebutCDS.selectedDate;
		const dateFin  = DateFinCDS.selectedDate;

		return SaveSuivi_CahierSoudage.run({
			groupe_appareil_id: row.groupe_appareil_id,

			iwt: iwt || null,
			numero: numero || null,
			indice: indice || null,

			date_objectif: dateObj
				? moment(dateObj).format("YYYY-MM-DD")
				: null,

			date_debut: dateDeb
				? moment(dateDeb).format("YYYY-MM-DD")
				: null,

			date_fin: dateFin
				? moment(dateFin).format("YYYY-MM-DD")
				: null,
		})
			.then(() => {
				showAlert("Cahier de soudage mis à jour ✅", "success");
			})
			.catch(e => {
				console.log("Erreur save cahier de soudage", e);
				showAlert("Erreur lors de l'enregistrement du cahier de soudage", "error");
			});
	},
};
