export default {
  // ====== 3.1) Liste maître : complète-la avec tous les items des 2 images ======
  master: [
    // level 1
    { id: "1",   label_fr: "Caractéristique de l'appareil", label_en: "Type characteristic", level: 1, parent: null, include: true, order: 10 },
    { id: "2",   label_fr: "Déclaration de conformité",     label_en: "Declaration of conformity", level: 1, parent: null, include: true, order: 20 },
    { id: "3",   label_fr: "Attestations et Certificats",    label_en: "Attestations and Certificates", level: 1, parent: null, include: true, order: 30 },
    { id: "4",   label_fr: "Plaque de firme",                label_en: "Firm plate", level: 1, parent: null, include: true, order: 40 },
    { id: "5",   label_fr: "Dossier de calcul et fabrication", label_en: "Calculation & manufacturing file", level: 1, parent: null, include: true, order: 50 },
    { id: "6",   label_fr: "Essais",                         label_en: "Testing", level: 1, parent: null, include: true, order: 60 },
    { id: "7",   label_fr: "Plan qualité",                   label_en: "Quality plan", level: 1, parent: null, include: true, order: 70 },

    // level 2 (exemples — complète la liste)
    { id: "1.1", parent: "1", level: 2, label_fr: "Données de calcul", label_en: "Calculation data", include: true, order: 11 },
    { id: "1.2", parent: "1", level: 2, label_fr: "Finition", label_en: "Finish", include: true, order: 12 },
    { id: "3.1.4", parent: "3", level: 2, label_fr: "Attestation dimensionnelle des brides", label_en: "Dimensional certificate of the flanges", include: false, order: 999 },
    // ...ajoute tout le reste selon tes captures
  ],

  // ====== 3.2) État courant (copié/chargé depuis DB si besoin) ======
  get state() {
    // Si on a déjà un état en mémoire, on prend le store
    if (appsmith.store.sommaire) return appsmith.store.sommaire;
    // Sinon, on part de la master (copie profonde)
    const initial = this.master.map(x => ({ ...x }));
    storeValue("sommaire", initial, true);
    return initial;
  },

  set state(v) { storeValue("sommaire", v, true); },

  // ====== 3.3) Helpers de vue ======
  viewAll() { 
    return [...this.state].sort((a,b) => a.order - b.order || a.id.localeCompare(b.id));
  },

  viewFiltered(chapitreId) {
    if (!chapitreId || chapitreId === "ALL") return this.viewAll();
    return this.viewAll().filter(x => x.id === chapitreId || x.parent === chapitreId);
  },

  // ====== 3.4) Actions ======
  toggleInclude(id, newVal) {
    const arr = this.state.map(x => x.id === id ? { ...x, include: newVal } : x);
    this.state = arr;
    this.renumber(); // garde une numérotation propre
  },

  moveUp(id) {
    const arr = this.viewAll();
    const idx = arr.findIndex(x => x.id === id);
    if (idx <= 0) return;

    // swap des 'order'
    const cur = arr[idx], prev = arr[idx-1];
    const newState = this.state.map(x => {
      if (x.id === cur.id)  return { ...x, order: prev.order };
      if (x.id === prev.id) return { ...x, order: cur.order };
      return x;
    });
    this.state = newState;
    this.renumber();
  },

  moveDown(id) {
    const arr = this.viewAll();
    const idx = arr.findIndex(x => x.id === id);
    if (idx === -1 || idx >= arr.length - 1) return;

    const cur = arr[idx], next = arr[idx+1];
    const newState = this.state.map(x => {
      if (x.id === cur.id)  return { ...x, order: next.order };
      if (x.id === next.id) return { ...x, order: cur.order };
      return x;
    });
    this.state = newState;
    this.renumber();
  },

  // ====== 3.5) Numérotation hiérarchique ======
  renumber() {
    // règle : on numérote 1,2,3… pour les chapitres level=1 (triés par order),
    // puis 1.1, 1.2… pour les enfants (dans l'ordre et si include=true).
    const items = this.viewAll();
    let chapterNo = 0;
    const chapterMap = {}; // idChapitre -> numéro

    const updated = items.map(it => ({ ...it, section_number: "" }));

    // numéroter seulement ceux include=true
    for (const it of updated.filter(x => x.include)) {
      if (it.level === 1) {
        chapterNo += 1;
        chapterMap[it.id] = `${chapterNo}`;
        it.section_number = chapterMap[it.id];
      } else if (it.level === 2 && it.parent && chapterMap[it.parent]) {
        // numéro de sous-chapitre = numéro du chapitre + index local
        const siblings = updated
          .filter(x => x.include && x.level === 2 && x.parent === it.parent)
          .sort((a,b) => a.order - b.order || a.id.localeCompare(b.id));
        const pos = siblings.findIndex(s => s.id === it.id);
        it.section_number = `${chapterMap[it.parent]}.${pos + 1}`;
      }
    }

    // merge dans state
    const merged = this.state.map(x => {
      const u = updated.find(y => y.id === x.id);
      return u ? { ...x, section_number: u.section_number || "" } : x;
    });
    this.state = merged;
    return merged;
  },

  // ====== 3.6) Payloads ======
  buildPDFPayload() {
    // tri + filtre
    const list = this.viewAll().filter(x => x.include);

    // regroupe par chapitres pour le template PDF (plus simple en Liquid)
    const chapters = [];
    const chapterIndexById = {};

    for (const it of list) {
      if (it.level === 1) {
        chapters.push({
          id: it.id,
          number: it.section_number || "",
          title_fr: it.label_fr,
          title_en: it.label_en,
          children: []
        });
        chapterIndexById[it.id] = chapters.length - 1;
      }
    }
    for (const it of list) {
      if (it.level === 2 && it.parent && chapterIndexById[it.parent] !== undefined) {
        chapters[chapterIndexById[it.parent]].children.push({
          id: it.id,
          number: it.section_number || "",
          title_fr: it.label_fr,
          title_en: it.label_en
        });
      }
    }

    // Tu peux ajouter ici d'autres données doc (client, affaire, etc.)
    return {
      // ex: numero_appareil: appsmith.URL.queryParams.numero_appareil,
      toc: chapters
    };
  },

  buildSavePayload() {
    return {
      numero_appareil: appsmith.URL.queryParams.numero_appareil,
      sommaire_json: this.state    // à insérer en JSONB dans Postgres
    };
  },

  // ====== 3.7) Soumission à n8n (webhook) ======
  async submitToN8N() {
    const body = this.buildPDFPayload();
    // Appsmith -> crée un Datasource "n8n_webhook" (type REST API) pointant sur ton webhook
    // avec POST par défaut.
    const res = await n8n_webhook.run({ body }); // ou .run(body) selon config
    showAlert('Sommaire envoyé à n8n / PDFMonkey', 'success');
    return res;
  }
}
