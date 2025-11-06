export default {
  // --- helpers ordre effectif
  effChapter(x) {
    // ordre d'affichage des chapitres (niveau 1)
    const v = x.chapter_ord_override ?? x.default_chapter_ord ?? x.ch_no ?? 0;
    return Number(v);
  },
  effSub(x) {
    // ordre d'affichage des sous-chapitres (même parent)
    const v = x.sub_ord_override ?? x.default_sub_ord ?? x.sub_no ?? 0;
    return Number(v);
  },

  rows() {
    const r = GetSommaireAppareil?.data;
    if (Array.isArray(r)) return r;
    if (r?.rows) return r.rows;
    if (r?.data) return r.data;
    return [];
  },

  // Tri global de base (fallback) – on garde mais le vrai ordre est fixé par flatList()
  sorted() {
    const n = (v) => Number(v ?? 0);
    return this.rows().slice().sort((a, b) => {
      if (n(a.ch_no)   !== n(b.ch_no))   return n(a.ch_no)   - n(b.ch_no);
      if (n(a.sub_no)  !== n(b.sub_no))  return n(a.sub_no)  - n(b.sub_no);
      if (n(a.sub3_no) !== n(b.sub3_no)) return n(a.sub3_no) - n(b.sub3_no);
      if (n(a.sub4_no) !== n(b.sub4_no)) return n(a.sub4_no) - n(b.sub4_no);
      if (n(a.sub5_no) !== n(b.sub5_no)) return n(a.sub5_no) - n(b.sub5_no);
      return String(a.master_id).localeCompare(String(b.master_id));
    });
  },

  // Liste plate + bornes up/down calculées avec l'ordre effectif
  flatList() {
    const rows = this.sorted();

    // groupement par parent (root = chapitre)
    const byParent = {};
    for (const x of rows) {
      const key = x.parent_master_id || "__ROOT__" + x.numero_appareil;
      if (!byParent[key]) byParent[key] = [];
      byParent[key].push(x);
    }

    // tri dans chaque groupe
    for (const k of Object.keys(byParent)) {
      const isRoot = k.startsWith("__ROOT__");
      byParent[k].sort((a, b) => {
        if (isRoot) {
          // chapitres : ordre override/défaut
          return this.effChapter(a) - this.effChapter(b);
        }
        // sous-chapitres d'un même parent
        const d = this.effSub(a) - this.effSub(b);
        if (d !== 0) return d;
        return String(a.master_id).localeCompare(String(b.master_id));
      });
    }

    // enrichissement UI
    return rows.map((x) => {
      const sibKey = x.parent_master_id || "__ROOT__" + x.numero_appareil;
      const siblings = byParent[sibKey] || [];
      const idx = siblings.findIndex((s) => s.master_id === x.master_id);
      return {
        ...x,
        indent: (Number(x.level) - 1) * 20,
        isChapter: Number(x.level) === 1,
        canUp: idx > 0,
        canDown: idx >= 0 && idx < siblings.length - 1,
        title: (x.display_no ? x.display_no + " - " : "") + x.label_fr,
      };
    });
  },

  // boutons up/down -> requêtes DB puis refresh
  move(direction, item) {
		const isUp = direction === "up";
		const after = () => ReindexChaptersForAppareil.run({
												numero_appareil: appsmith.URL.queryParams.numero_appareil
											}).then(() => GetSommaireAppareil.run());

		if (Number(item.level) === 1) {
			const fn = isUp ? MoveChapterUp : MoveChapterDown;
			return fn.run({ master_id: item.master_id }).then(after);
		} else {
			const fn = isUp ? MoveSubUp : MoveSubDown;
			return fn.run({
				master_id: item.master_id,
				parent_master_id: item.parent_master_id,
			}).then(() => GetSommaireAppareil.run()); // pas besoin de réindexer pour les sous-chapitres
		}
	},

  // toggle : inverse localement et envoie la nouvelle valeur
  toggle(item) {
		const include = !Boolean(item.include);
		const run = Number(item.level) === 1
			? () => ToggleIncludeCascade.run({
					numero_appareil: appsmith.URL.queryParams.numero_appareil,
					master_id: item.master_id,
					include,
				})
			: () => ToggleInclude.run({
					master_id: item.master_id,
					include,
				});

		return run()
			.then(() => ReindexChaptersForAppareil.run({
				numero_appareil: appsmith.URL.queryParams.numero_appareil
			}))
			.then(() => GetSommaireAppareil.run())
			.catch(e => showAlert('Erreur: ' + (e?.message || e), 'error'));
	},
};
