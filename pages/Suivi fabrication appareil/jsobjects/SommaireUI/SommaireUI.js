export default {
	labelFor(x) {
		const lang =
			// 1) choix en cours (reactif)
			(appsmith.store.langue_appareil || (RadioLangue.selectedOptionValue || 'fr')).toLowerCase()
			// 2) fallback DB si rien en mémoire (rare)
			|| (DonneesGeneralesAffaire.data?.[0]?.langue || 'fr').toLowerCase();

		return lang === 'en'
			? (x.label_en || x.label_fr || '')
			: (x.label_fr || x.label_en || '');
	},
	
	annexList() {
		// reprend la liste plate et ne garde que le chapitre 8 et ses enfants inclus
		const all = this.flatList();
		return all.filter(x =>
			x.master_id === '8' || (x.parent_master_id === '8' && x.include)
		);
	},

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

		// tri dans chaque groupe (inchangé)
		for (const k of Object.keys(byParent)) {
			const isRoot = k.startsWith("__ROOT__");
			byParent[k].sort((a, b) => {
				if (isRoot) return this.effChapter(a) - this.effChapter(b);
				const d = this.effSub(a) - this.effSub(b);
				if (d !== 0) return d;
				return String(a.master_id).localeCompare(String(b.master_id));
			});
		}

		// pré-calcul d'une numérotation effective "effDisplayNo" par parent parmi les items inclus
		const effDisplayNoMap = new Map();
		for (const [parentKey, siblings] of Object.entries(byParent)) {
			// parent display_no (pour préfixer les sous-niveaux)
			let parentDisplay = "";
			if (!parentKey.startsWith("__ROOT__")) {
				const parentItem = rows.find(r => r.master_id === parentKey);
				parentDisplay = parentItem?.display_no ? String(parentItem.display_no) : "";
			}

			let i = 0;
			for (const s of siblings) {
				if (s.include) {
					i += 1;
					const myNo = parentDisplay ? `${parentDisplay}.${i}` : String(i);
					effDisplayNoMap.set(s.master_id, myNo);
				} else {
					// non inclus : pas de numéro effectif
					effDisplayNoMap.set(s.master_id, s.display_no ?? "");
				}
			}
		}

		// enrichissement UI
		return rows.map((x) => {
			const sibKey = x.parent_master_id || "__ROOT__" + x.numero_appareil;
			const siblings = byParent[sibKey] || [];
			const siblingsIncluded = siblings.filter(s => s.include);             // *** clé ***
			const idxInc = siblingsIncluded.findIndex(s => s.master_id === x.master_id);

			return {
				...x,
				indent: (Number(x.level) - 1) * 20,
				isChapter: Number(x.level) === 1,
				// boutons: bornes calculées parmi les seuls éléments inclus
				canUp: x.include && idxInc > 0,
				canDown: x.include && idxInc >= 0 && idxInc < siblingsIncluded.length - 1,
				// numéro effectif calculé (fallback sur display_no si présent)
				effDisplayNo: effDisplayNoMap.get(x.master_id) || x.display_no || "",
				// titre basé sur la numérotation effective
				title: ( (effDisplayNoMap.get(x.master_id) || x.display_no ? (effDisplayNoMap.get(x.master_id) || x.display_no) + " - " : "") + this.labelFor(x)),
			};
		});
	},


  // boutons up/down -> requêtes DB puis refresh
	move(direction, item) {
		const numero_appareil = appsmith.URL.queryParams.numero_appareil;
		const isUp = direction === "up";
		const refresh = () => GetSommaireAppareil.run();

		if (+item.level === 1) {
			const fn = isUp ? MoveChapterUp : MoveChapterDown;
			return fn.run({ master_id: item.master_id })
				.then(() => ReindexChaptersForAppareil.run({ numero_appareil }))
				.then(refresh)
				.catch(e => showAlert('Erreur move(chapitre): ' + (e?.message || e), 'error'));
		} else {
			const fn = isUp ? MoveSubUp : MoveSubDown;
			return fn.run({
					master_id: item.master_id,
					parent_master_id: item.parent_master_id,
				})
				.then(() => ReindexSubByParent.run({
					numero_appareil,
					parent_master_id: item.parent_master_id,
				}))
				.then(refresh)
				.catch(e => showAlert('Erreur move(sous-chapitre): ' + (e?.message || e), 'error'));
		}
	},

	// toggle : inverse localement et envoie la nouvelle valeur
		toggle(item) {
		const numero_appareil = appsmith.URL.queryParams.numero_appareil;
		const include = !Boolean(item.include);

		// Niveau 1 : tu as déjà la cascade existante
		const runToggle = (+item.level === 1)
			? () => ToggleIncludeCascade.run({
					numero_appareil,
					master_id: item.master_id,
					include,
				})
			// Niveaux >= 2 : nouvelle cascade par sous-arbre
			: () => ToggleIncludeCascadeFromNode.run({
					numero_appareil,
					root_master_id: item.master_id,
					include,
				});

		// Réindexation : chapitres vs sous-chapitres
		const reindex = (+item.level === 1)
			? () => ReindexChaptersForAppareil.run({ numero_appareil })
			: () => ReindexSubByParent.run({
					numero_appareil,
					parent_master_id: item.parent_master_id,
				});

		return runToggle()
			.then(reindex)
			.then(() => GetSommaireAppareil.run())
			.catch(e => showAlert('Erreur toggle: ' + (e?.message || e), 'error'));
	},

};
