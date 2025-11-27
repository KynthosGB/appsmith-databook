export default {
  // Helper : retrouve la ligne pour un groupe (NOTE_CALCUL, PLAN, APPRO...)
  getRowByCode(code) {
    const rows = QryInfosAppareil.data || [];
    return rows.find(r => r.groupe_code === code) || null;
  },

  // Helper générique de sauvegarde
  save(code, metaPatch = {}, fieldsPatch = {}) {
    const row = this.getRowByCode(code);
    if (!row) {
      console.log("Aucun groupe trouvé pour", code);
      return;
    }

    // meta actuel + modifications
    const currentMeta = row.meta || {};
    const newMeta = { ...currentMeta, ...metaPatch };

    return SaveSuiviFab_Groupe.run({
      groupe_appareil_id: row.groupe_appareil_id,

      // si tu ne fournis pas la valeur dans fieldsPatch,
      // on garde la valeur actuelle venant de la requête
      date_debut:         fieldsPatch.date_debut         ?? row.date_debut,
      date_fin:           fieldsPatch.date_fin           ?? row.date_fin,
      date_envoi_client:  fieldsPatch.date_envoi_client  ?? row.date_envoi_client,
      date_retour_client: fieldsPatch.date_retour_client ?? row.date_retour_client,
      responsable:        fieldsPatch.responsable        ?? row.responsable,
      commentaire:        fieldsPatch.commentaire        ?? row.commentaire,
      statut_id:          fieldsPatch.statut_id          ?? row.statut_id,

      meta: newMeta,
    })
    .catch(e => {
      console.log("Erreur SaveSuiviFab", code, e);
      showAlert("Erreur lors de l'enregistrement du suivi de fabrication", "error");
    });
  },

  // ---- Exemple concret : bloc NOTE_DE_CALCUL ----
  saveNoteCalcul() {
    return this.save(
      "NOTE_CALCUL",         // groupe_code dans ta requête

      // --- partie meta (jsonb) ---
      {
        // à toi de choisir les clés meta, c'est ton modèle
        numero: InputNumNDC_Numero.text,
        indice: InputNumNDC_Indice.text,
      },

      // --- partie colonnes "classiques" de la table ---
      {
        date_debut: DateNDC_Date.selectedDate
          ? moment(DateNDC_Date.selectedDate).format("YYYY-MM-DD")
          : null,
      }
    );
  },

  // tu fais la même chose pour les autres blocs :
  // savePlan() { ... this.save("PLAN", { ... }, { ... }); }
  // saveAppro() { ... this.save("APPRO", { ... }, { ... }); }
  // saveFab()  { ... }
};
