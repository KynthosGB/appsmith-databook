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
		const numero   = NumCDS.text;
		const indice   = IndiceCDS.text;

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
	
	// --- PRÉPARATION ---
	savePreparation() {
		const row = this.getRowByCode("PREPARATION");
		if (!row) return;

		// ⚠️ adapter les noms de widgets :
		const preparateur = Preparateur.text;
		const dateObj     = DatePrepaObjectif.selectedDate;
		const dateDebut   = DateDebutPrepa.selectedDate;
		const dateFin     = DateFinPrepa.selectedDate;

		return SaveSuivi_Preparation.run({
			groupe_appareil_id: row.groupe_appareil_id,

			preparateur: preparateur || null,

			date_objectif: dateObj
				? moment(dateObj).format("YYYY-MM-DD")
				: null,

			date_debut: dateDebut
				? moment(dateDebut).format("YYYY-MM-DD")
				: null,

			date_fin: dateFin
				? moment(dateFin).format("YYYY-MM-DD")
				: null,
		})
			.then(() => {
				showAlert("Préparation mise à jour ✅", "success");
			})
			.catch(e => {
				console.log("Erreur save préparation", e);
				showAlert("Erreur lors de l'enregistrement de la préparation", "error");
			});
	},
	
	// --- APPRO : un sous-groupe (Fonds, Virolés, etc.) ---
	saveApproItem(code, checkboxGroup, datePicker) {
		const row = this.getRowByCode("APPRO");
		if (!row) return;

		const selected = checkboxGroup.selectedValues || [];
		const na     = selected.includes("na");
		const envoye = selected.includes("envoye");

		const date = datePicker.selectedDate
			? moment(datePicker.selectedDate).format("YYYY-MM-DD")
			: null;

		return SaveSuivi_ApproItem.run({
			groupe_appareil_id: row.groupe_appareil_id,
			code,
			na,
			envoye,
			date,
		})
			.then(() => this.setEnCoursIfNeeded("APPRO"))
			.then(() => this.refreshBar())
			.then(() => {
				showAlert("Appro mis à jour ✅", "success");
			})
			.catch(e => {
				console.log("Erreur save appro", e);
				showAlert("Erreur lors de l'enregistrement de l'approvisionnement", "error");
			});
	},
	
	// --- ACHATS : un sous-groupe (Brides, Visseries, etc.) ---
	saveAchatsItem(code, checkboxGroup) {
		// récupère la ligne du groupe 'ACHATS' pour l'appareil
		const row = this.getRowByCode("ACHATS");
		if (!row) return;

		const selected = checkboxGroup.selectedValues || [];
		const na   = selected.includes("na");
		const recu = selected.includes("recu");

		return SaveSuivi_AchatsItem.run({
			groupe_appareil_id: row.groupe_appareil_id,
			code,
			na,
			recu,
		})
			.then(() => this.setEnCoursIfNeeded("ACHATS"))
			.then(() => this.refreshBar())
			.then(() => {
				showAlert("Achats mis à jour ✅", "success");
			})
			.catch(e => {
				console.log("Erreur save achats", e);
				showAlert("Erreur lors de l'enregistrement des achats", "error");
			});
	},


	// --- CONTROLE : un sous-groupe (Visuels, Radio, FAT, ...) ---
	saveControleItem(code, checkboxGroup, datePicker) {
		// code = 'VISUELS', 'RADIO', 'FAT', ...
		// checkboxGroup = widget CheckboxGroup (NA / Fait)
		// datePicker = widget DatePicker correspondant

		const row = this.getRowByCode("CONTROLE");
		if (!row) return;

		const selected = checkboxGroup.selectedValues || [];
		const na   = selected.includes("na");
		const fait = selected.includes("fait");

		const date = datePicker.selectedDate
			? moment(datePicker.selectedDate).format("YYYY-MM-DD")
			: null;

		return SaveSuivi_ControleItem.run({
			groupe_appareil_id: row.groupe_appareil_id,
			code,
			na,
			fait,
			date,
		})
			.then(() => this.setEnCoursIfNeeded("CONTROLE")) // A_FAIRE -> EN_COURS
			.then(() => this.refreshBar())                   // refresh ButtonGroup
			.then(() => {
				showAlert("Contrôle mis à jour ✅", "success");
			})
			.catch(e => {
				console.log("Erreur save contrôle", e);
				showAlert("Erreur lors de l'enregistrement du contrôle", "error");
			});
	},

	// --- FABRICATION ---

	saveFabrication() {
		const row = this.getRowByCode("FABRICATION");
		if (!row) return;

		// ⚠️ remplace par les noms réels de tes widgets
		const monteur       = Monteur.text;
		const dateDebutVal  = DateDebutFab.selectedDate;
		const dateFinVal    = DateFinFab.selectedDate;
		const heuresPrevues = Number(HeuresPrevues.text || "") || null;
		const heuresPrevuesMontage = Number(HeuresPrevuesMontage.text || "") || null;
		const heuresPassees = Number(HeuresPassees.text || "") || null;

		return SaveSuivi_Fabrication.run({
			groupe_appareil_id: row.groupe_appareil_id,
			monteur: monteur || null,

			date_debut: dateDebutVal
				? moment(dateDebutVal).format("YYYY-MM-DD")
				: null,

			date_fin: dateFinVal
				? moment(dateFinVal).format("YYYY-MM-DD")
				: null,

			heures_prevues: heuresPrevues,
			heures_prevues_montage: heuresPrevuesMontage,
			heures_passees: heuresPassees,
		})
			.then(() => {
				showAlert("Fabrication mise à jour ✅", "success");
			})
			.catch(e => {
				console.log("Erreur save fabrication", e);
				showAlert("Erreur lors de l'enregistrement de la fabrication", "error");
			});
	},

	// --- DOSSIER CONSTRUCTEUR ---
	saveDossierConstructeur() {
		const row = this.getRowByCode("DOSSIER_CONSTRUCTEUR");
		if (!row) return;

		// ⚠️ remplace par le nom réel du widget
		const numero = InputNumDC.text;

		return SaveSuivi_DossierConstructeur.run({
			groupe_appareil_id: row.groupe_appareil_id,
			numero: numero || null,
		})
			.then(() => {
				showAlert("Dossier constructeur mis à jour ✅", "success");
			})
			.catch(e => {
				console.log("Erreur save dossier constructeur", e);
				showAlert("Erreur lors de l'enregistrement du dossier constructeur", "error");
			});
	},

	  // --- APPRO (date objectif globale) ---
		saveAppro() {
			const row = this.getRowByCode("APPRO");
			if (!row) return;

			// ⚠️ adapte le nom du widget si besoin
			const dateObj = DateObjectifAppro.selectedDate;

			return SaveSuivi_Appro.run({
				groupe_appareil_id: row.groupe_appareil_id,
				date_objectif: dateObj
					? moment(dateObj).format("YYYY-MM-DD")
					: null,
			})
				.then(() => {
					showAlert("Objectif appro mis à jour ✅", "success");
				})
				.catch(e => {
					console.log("Erreur save appro (date objectif)", e);
					showAlert(
						"Erreur lors de l'enregistrement de la date objectif appro",
						"error"
					);
				});
		},
	
		// --- ACHATS (date objectif globale) ---
		saveAchats() {
			const row = this.getRowByCode("ACHATS");
			if (!row) return;

			// ⚠️ adapte le nom du widget si besoin
			const dateObj = DateObjectifAchats.selectedDate;

			return SaveSuivi_Achats.run({
				groupe_appareil_id: row.groupe_appareil_id,
				date_objectif: dateObj
					? moment(dateObj).format("YYYY-MM-DD")
					: null,
			})
				.then(() => {
					showAlert("Objectif achats mis à jour ✅", "success");
				})
				.catch(e => {
					console.log("Erreur save achats (date objectif)", e);
					showAlert(
						"Erreur lors de l'enregistrement de la date objectif achats",
						"error"
					);
				});
		},


};
