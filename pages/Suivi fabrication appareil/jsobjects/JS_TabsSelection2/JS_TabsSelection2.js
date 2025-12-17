export default {
  onTabSelected() {
		const label2 = TabsRevueContrat.selectedTab || TabsRevueContrat.selectedTabLabel;

		if (label2 !== "Données de l'appareil") {
      CaracteristiquesAppareils.run();
      DonneesGeneralesAffaire.run();
      RevueContrat.run();        // si tu as une query pour la table revue_de_contrat_appareil
      EnceintesAppareil.run();   // si tu en as besoin aussi
    }
  }
};
