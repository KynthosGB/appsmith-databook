export default {
  async Generer(documentTypeId) {
    try {
      await Promise.all([
        DonneesGeneralesAffaire.run(),
        CaracteristiquesAppareils.run(),
        EnceintesAppareil.run(),
				QryInfoControlesAppareil.run(),
      ]);

      await storeValue("document_type_id_to_generate", documentTypeId);

      const res = await Api_PDFDocsDC.run();

      const data =
        typeof res === "string"
          ? JSON.parse(res)
          : res?.body && typeof res.body === "object"
          ? res.body
          : res || {};

      if (!data.success) {
        throw new Error(data.message || "La génération du document a échoué");
      }

      await SuiviGenerationDocsDC.run();

      showAlert(
        `Document généré avec succès le ${data.generated_at || ""}`,
        "success"
      );

      return data;
    } catch (e) {
      showAlert(
        "Erreur lors de la génération du document : " +
          (e?.message || "Erreur inconnue"),
        "error"
      );

      return {
        success: false,
        message: String(e?.message || e),
      };
    }
  },
};