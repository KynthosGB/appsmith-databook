export default {
  onTabSelected() {
    const label = Tabs1.selectedTab;

    if (label === "Revue de contrat") {
      CaracteristiquesAppareils.run();
      DonneesGeneralesAffaire.run();
      RevueContrat.run();        // si tu as une query pour la table revue_de_contrat_appareil
      EnceintesAppareil.run();   // si tu en as besoin aussi
    }
		if (label === "Planning") {
      QryDashboardSuiviFabrication.run();
    }
		if (label === "Echanges client") {
      QryClientEmails.run();
    }
		
  }
};
