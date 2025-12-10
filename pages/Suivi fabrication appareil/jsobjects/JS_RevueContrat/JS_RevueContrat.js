export default {
  /**
   * Génère et télécharge la Revue de contrat à partir de l'URL signée
   * renvoyée par n8n/PDFMonkey.
   * Peut aussi recevoir { url, filename } pour bypasser l'appel n8n.
   */
  async downloadRevueContrat(opts = {}) {
    try {
      // 1) Obtenir le payload (via opts ou via la requête Api_RevueContrat)
      const res = opts.url
        ? {
            document_card: {
              download_url: opts.url,
              filename: opts.filename || "revue_contrat.pdf",
            },
          }
        : await Api_RevueContrat.run();

      const payload =
        res && typeof res === "object"
          ? (res.body && typeof res.body === "object" ? res.body : res)
          : typeof res === "string"
          ? JSON.parse(res)
          : {};

      // 2) Extraire l'URL et le nom
      const doc  = payload.document_card || payload;
      const url  = (doc?.download_url || "").trim();
      const name = (doc?.filename || opts.filename || "revue_contrat.pdf").trim();

      if (!url) {
        throw new Error("URL de téléchargement manquante (revue de contrat)");
      }

      // 3) Déclencher le téléchargement (avec fallback ouverture nouvel onglet)
      try {
        download(url, name);
      } catch {
        navigateTo(url, {}, "NEW_WINDOW");
      }

      showAlert("Téléchargement de la revue de contrat lancé.", "success");
      return { ok: true, url, filename: name };
    } catch (e) {
      showAlert(
        "Erreur revue de contrat : " + (e?.message || "Téléchargement impossible"),
        "error"
      );
      return { ok: false, error: String(e?.message || e) };
    }
  },
};
