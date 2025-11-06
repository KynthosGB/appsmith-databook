export default {
  // --- Source de données normalisée
  rows() {
    const r = GetSommaireAppareil?.data;
    if (Array.isArray(r)) return r;
    if (r?.rows) return r.rows;
    if (r?.data) return r.data;
    return [];
  },

  // --- Tri numérique stable (évite 3.10 avant 3.9)
  sorted() {
		const n = (v) => Number(v ?? 0);
		return this.rows().slice().sort((a, b) => {
			if (n(a.ch_no)    !== n(b.ch_no))    return n(a.ch_no)    - n(b.ch_no);
			if (n(a.sub_no)   !== n(b.sub_no))   return n(a.sub_no)   - n(b.sub_no);
			if (n(a.sub3_no)  !== n(b.sub3_no))  return n(a.sub3_no)  - n(b.sub3_no);
			if (n(a.sub4_no)  !== n(b.sub4_no))  return n(a.sub4_no)  - n(b.sub4_no);
			if (n(a.sub5_no)  !== n(b.sub5_no))  return n(a.sub5_no)  - n(b.sub5_no);
			return String(a.master_id).localeCompare(String(b.master_id));
		});
	},

  // --- Liste "plate" + calcul des bornes up/down
  flatList() {
    const rows = this.sorted();
    const byParent = {};
    for (const x of rows) {
      const key = x.parent_master_id || "__ROOT__" + x.numero_appareil;
      if (!byParent[key]) byParent[key] = [];   // <-- pas de ||= ici
      byParent[key].push(x);                    // <-- push fonctionne
    }
    // ordre dans chaque groupe de siblings
    const num = (v) => Number(v ?? 9999);
    for (const k of Object.keys(byParent)) {
			byParent[k].sort((a, b) => {
				const num = (v) => Number(v ?? 0);
				if (num(a.sub_no)  !== num(b.sub_no))  return num(a.sub_no)  - num(b.sub_no);
				if (num(a.sub3_no) !== num(b.sub3_no)) return num(a.sub3_no) - num(b.sub3_no);
				if (num(a.sub4_no) !== num(b.sub4_no)) return num(a.sub4_no) - num(b.sub4_no);
				if (num(a.sub5_no) !== num(b.sub5_no)) return num(a.sub5_no) - num(b.sub5_no);
				return String(a.master_id).localeCompare(String(b.master_id));
			});
		}
    // enrichit chaque ligne (indent, bornes up/down, titre)
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

  // --- Actions
  move(direction, item) {
    const isUp = direction === "up";
    if (Number(item.level) === 1) {
      const fn = isUp ? MoveChapterUp : MoveChapterDown;
      return fn.run({ master_id: item.master_id }).then(() => GetSommaireAppareil.run());
    } else {
      const fn = isUp ? MoveSubUp : MoveSubDown;
      return fn
        .run({
          master_id: item.master_id,
          parent_master_id: item.parent_master_id,
        })
        .then(() => GetSommaireAppareil.run());
    }
  },

  toggle(item, include) {
    if (Number(item.level) === 1) {
      return ToggleIncludeCascade.run({
        numero_appareil: appsmith.URL.queryParams.numero_appareil,
        master_id: item.master_id,
        include,
      }).then(() => GetSommaireAppareil.run());
    }
    return ToggleInclude.run({
      master_id: item.master_id,
      include,
    }).then(() => GetSommaireAppareil.run());
  },
};
