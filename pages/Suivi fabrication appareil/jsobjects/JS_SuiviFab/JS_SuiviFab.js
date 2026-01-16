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
	
	emitAlertEvent(payload) {
		return SendSlackAlert.run({
			numero_affaire: appsmith.URL.queryParams.numero_affaire || null,
			numero_appareil: appsmith.URL.queryParams.numero_appareil || null,
			url: appsmith.URL.fullPath || null,
			...payload,
		}).catch((e) => {
			// On ne bloque pas la sauvegarde si Slack/n8n échoue
			console.log("Slack event failed", e);
		});
	},

	/**
	 * Récupère l'état "avant" d'un item (Appro/Achats/Contrôle/Presta) depuis les queries.
	 * ⚠️ Adapte les noms des queries et les champs selon ton modèle.
	 */
	getItemState(groupCode, itemCode) {
		// Mets ici tes queries de data si elles existent.
		// Exemple (à adapter) :
		const sourcesByGroup = {
			APPRO: (QryInfoApproAppareil.data || []),
			ACHATS: (QryInfoAchatsAppareil.data || []),
			CONTROLE: (QryInfoControlesAppareil.data || []),
			PRESTA_EXTERNES: (QryInfoPrestaExtAppareil.data || []),
		};

		const rows = sourcesByGroup[groupCode] || [];
		const row = rows.find(r => r.code === itemCode) || null;
		return row;
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
    })
		.then(() => {
      showAlert("Délai mis à jour", "success");
     })
		.catch(e => {
      console.log("Erreur save délai", e);
      showAlert("Erreur lors de l'enregistrement du délai", "error");
    });
  },
	
	saveChargeAffaires() {
    const numero_affaire = appsmith.URL.queryParams.numero_affaire;
    if (!numero_affaire) return;

    const everwin_user_id = SelectChargeAffaires.selectedOptionValue;

    return SaveSuivi_ChargeAffAppareil.run({
      numero_affaire,
      everwin_user_id,
    })
		.then(() => {
        showAlert("Chargé d'affaires mis à jour", "success");
      })
		.catch(e => {
      console.log("Erreur save chargé d'affaires", e);
      showAlert("Erreur lors de l'enregistrement du chargé d'affaires", "error");
    });
  },

  // --- statuts des groupes ---
  setStatutForGroupe(groupeCode, statutCode) {
		const row = this.getRowByCode(groupeCode);
		const statut = this.statutByCode(statutCode);
		if (!row || !statut) return;

		const oldStatutCode = row.statut_code;   // AVANT update
		const newStatutCode = statutCode;

		// évite de spam si pas de changement
		if (row.statut_id === statut.id) return;

		return SaveSuivi_Header.run({
			groupe_appareil_id: row.groupe_appareil_id,
			statut_id: statut.id,
		})
		.then(() => {
			// 1) refresh UI
			this.refreshBar();
			showAlert("Mise à jour effectuée ✅", "success");

			return this.emitAlertEvent({
				event_type: "STATUS_CHANGED",
				step_code: groupeCode,
				old_status_code: oldStatutCode,
				new_status_code: newStatutCode,
			});
		})
		.catch((e) => {
			showAlert("Erreur sauvegarde statut", "error");
			console.log(e);
			throw e;
		});
	},

	
	saveNoteCalcul() {
    const row = this.getRowByCode("NOTE_CALCUL");
    if (!row) return;

    const numero = NumNDC.text;          // champ "Numéro"
    const indice = IndiceNDC.text;          // champ "Indice"
    const dateObj = DateObjectifNDC.selectedDate;     // champ "Date obj."
    const dateDebut = DateDebutNDC.selectedDate; // champ "Date début"
    const dateEdition = DateEditionNDC.selectedDate; // champ "Date édition"
		const nombreJours = NbJoursNDC.text;          // champ "Nombre jours"

    return SaveSuivi_NoteCalcul.run({
      groupe_appareil_id: row.groupe_appareil_id,
      numero: numero || null,
      indice: indice || null,
			nombre_jours: nombreJours || null,
      date_objectif: dateObj
        ? moment(dateObj).format("YYYY-MM-DD")
        : null,
      date_debut: dateDebut
        ? moment(dateDebut).format("YYYY-MM-DD")
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
    const dessinateur_id  = Dessinateur.selectedOptionValue;

    const dateObj      = DatePlanObjectif.selectedDate;
    const dateDebut    = DateDebutPlan.selectedDate;
    const dateEnvoi1   = Date1erEnvoiPlan.selectedDate;
    const dateFin      = DateFinPlan.selectedDate;
		const nombreJours  = NbJoursPlan.text;          // champ "Nombre jours"

    return SaveSuivi_Plan.run({
      groupe_appareil_id: row.groupe_appareil_id,
      numero: numero || null,
      indice: indice || null,
      dessinateur_id: dessinateur_id || null,
			nombre_jours: nombreJours || null,

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
		const iwt_id   = IWT.selectedOptionValue;
		const numero   = NumCDS.text;
		const indice   = IndiceCDS.text;

		const dateObj  = DateCDSObjectif.selectedDate;
		const dateDeb  = DateDebutCDS.selectedDate;
		const dateFin  = DateFinCDS.selectedDate;
		const nombreJours  = NbJoursCDS.text;          // champ "Nombre jours"

		return SaveSuivi_CahierSoudage.run({
			groupe_appareil_id: row.groupe_appareil_id,

			iwt_id: iwt_id || null,
			numero: numero || null,
			indice: indice || null,
			nombre_jours: nombreJours || null,

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
		const preparateur_id = Preparateur.selectedOptionValue;
		const dateObj     = DatePrepaObjectif.selectedDate;
		const dateDebut   = DateDebutPrepa.selectedDate;
		const dateFin     = DateFinPrepa.selectedDate;
		const nombreJours  = NbJoursPrepa.text;          // champ "Nombre jours"

		return SaveSuivi_Preparation.run({
			groupe_appareil_id: row.groupe_appareil_id,

			preparateur_id: preparateur_id || null,
			
			nombre_jours: nombreJours || null,

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
	saveApproItem(code, radioGroup, datePicker) {
		const row = this.getRowByCode("BESOINS");
		if (!row) return;

		// état AVANT (depuis data)
		const before = this.getItemState("BESOINS", code);
		const wasEnvoye = !!before?.envoye;

		// RadioGroup -> une seule valeur (string)
		const value = radioGroup.selectedOptionValue || null;

		const na     = value === "na";
		const envoye = value === "envoye";

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
			.then(() => this.refreshBar())
			.then(() => {
				showAlert("Appro mis à jour ✅", "success");

				// notif uniquement si transition false -> true
				if (!wasEnvoye && envoye) {
					return this.emitAlertEvent({
						event_type: "APPRO_SENT",
						event_key: code,        // FONDS / VIROLES / BRIDES ...
						event_value: "true",
					});
				}
			})
			.catch(e => {
				console.log("Erreur save appro", e);
				showAlert("Erreur lors de l'enregistrement de l'approvisionnement", "error");
			});
	},


	
	// --- ACHATS : un sous-groupe (Brides, Visseries, etc.) ---
	saveAchatsItem(code, radioGroup) {
		const row = this.getRowByCode("ACHATS");
		if (!row) return;

		const before = this.getItemState("ACHATS", code);
		const wasRecu = !!before?.recu;

		const value = radioGroup.selectedOptionValue || null;

		const na   = value === "na";
		const recu = value === "recu";

		return SaveSuivi_AchatsItem.run({
			groupe_appareil_id: row.groupe_appareil_id,
			code,
			na,
			recu,
		})
			.then(() => this.refreshBar())
			.then(() => {
				showAlert("Achats mis à jour ✅", "success");

				if (!wasRecu && recu) {
					return this.emitAlertEvent({
						event_type: "ACHATS_RECU",
						event_key: code, // BRIDES / VISSERIES / JOINTS / ...
						event_value: "true",
					});
				}
			})
			.catch(e => {
				console.log("Erreur save achats", e);
				showAlert("Erreur lors de l'enregistrement des achats", "error");
			});
	},


	// --- CONTROLE : un sous-groupe (Visuels, Radio, FAT, ...) ---
	saveControleItem(code, radioGroup, datePicker) {
		const row = this.getRowByCode("CONTROLE");
		if (!row) return;

		const before = this.getItemState("CONTROLE", code);
		const wasFait = !!before?.fait;

		const value = radioGroup.selectedOptionValue || null;

		const na   = value === "na";
		const fait = value === "fait";

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
			.then(() => this.refreshBar())
			.then(() => {
				showAlert("Contrôle mis à jour ✅", "success");

				if (!wasFait && fait) {
					return this.emitAlertEvent({
						event_type: "CONTROLE_FAIT",
						event_key: code, // VISUELS / RADIO / FAT ...
						event_value: "true",
					});
				}
			})
			.catch(e => {
				console.log("Erreur save contrôle", e);
				showAlert("Erreur lors de l'enregistrement du contrôle", "error");
			});
	},


	
	// --- PRESTATIONS EXTERNES : un sous-groupe (Calo, Berces, Plateforme, ...) ---
	savePrestaExterneItem(code, radioGroup, datePicker) {
		const row = this.getRowByCode("PRESTA_EXTERNES");
		if (!row) return;

		const before = this.getItemState("PRESTA_EXTERNES", code);
		const wasCommande = !!before?.commande;

		const value = radioGroup.selectedOptionValue || null;

		const na       = value === "na";
		const commande = value === "commande";

		const date = datePicker.selectedDate
			? moment(datePicker.selectedDate).format("YYYY-MM-DD")
			: null;

		return SaveSuivi_PrestaExterneItem.run({
			groupe_appareil_id: row.groupe_appareil_id,
			code,
			na,
			commande,
			date,
		})
			.then(() => this.refreshBar())
			.then(() => {
				showAlert("Prestations externes mises à jour ✅", "success");

				if (!wasCommande && commande) {
					return this.emitAlertEvent({
						event_type: "PRESTA_COMMANDEE",
						event_key: code, // PLATEFORME / ECHELLE / ...
						event_value: "true",
					});
				}
			})
			.catch(e => {
				console.log("Erreur save prestations externes", e);
				showAlert("Erreur lors de l'enregistrement de prestations externes", "error");
			});
	},



	// --- FABRICATION ---

	saveFabrication() {
		const row = this.getRowByCode("FABRICATION");
		if (!row) return;

		// ⚠️ remplace par les noms réels de tes widgets
		const monteur_id       = Monteur.selectedOptionValue;
		const dateDebutVal  = DateDebutFab.selectedDate;
		const dateFinVal    = DateFinFab.selectedDate;
		const heuresPrevues = Number(HeuresPrevues.text || "") || null;
		const heuresPrevuesMontage = Number(HeuresPrevuesMontage.text || "") || null;
		const heuresPassees = Number(HeuresPassees.text || "") || null;
		const nbJoursMargeFab = NombreJoursMarge.text;

		return SaveSuivi_Fabrication.run({
			groupe_appareil_id: row.groupe_appareil_id,
			monteur_id: monteur_id || null,

			date_debut: dateDebutVal
				? moment(dateDebutVal).format("YYYY-MM-DD")
				: null,

			date_fin: dateFinVal
				? moment(dateFinVal).format("YYYY-MM-DD")
				: null,

			heures_prevues: heuresPrevues,
			heures_prevues_montage: heuresPrevuesMontage,
			heures_passees: heuresPassees,
			nombre_jours_marge_fab: nbJoursMargeFab,
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
			const row = this.getRowByCode("BESOINS");
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
