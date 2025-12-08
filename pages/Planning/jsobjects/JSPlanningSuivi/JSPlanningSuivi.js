export default {
  // ---------- Helpers dates ----------

  // Date UTC -> "YYYY-MM-DD"
  formatYMDFromUTC(dateObj) {
    const y = dateObj.getUTCFullYear();
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },

  // diff de jours entre 2 "YYYY-MM-DD"
  diffDays(d1, d2) {
    const [y1, m1, day1] = d1.split("-").map(Number);
    const [y2, m2, day2] = d2.split("-").map(Number);

    const t1 = Date.UTC(y1, m1 - 1, day1);
    const t2 = Date.UTC(y2, m2 - 1, day2);

    return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
  },

  // ajoute "offset" jours à une date "YYYY-MM-DD"
  addDaysYMD(ymd, offset) {
    const [y, m, d] = ymd.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + offset);
    return this.formatYMDFromUTC(date);
  },

  // ---------- Mapping workflow -> lettres / statuts ----------

  // code groupe -> lettre
  stepLetter(code) {
    switch (code) {
      case "NOTE_CALCUL":    return "N";
      case "PLAN":           return "P";
      case "CAHIER_SOUDAGE": return "C";
      case "PREPARATION":    return "R";
      case "APPRO":          return "A";
      default:               return "?";
    }
  },

  // code statut -> libellé simplifié
  stepStatus(statut_code) {
    if (["TERMINE", "VALIDE_CLIENT"].includes(statut_code)) return "Terminé";
    if (["EN_COURS", "ATTENTE_CLIENT", "COMMENTAIRE_A_TRAITER"].includes(statut_code)) return "En cours";
		if (statut_code === "NON_CONCERNE") return "Non concerné";
    if (statut_code === "A_FAIRE") return "todo";
    return "unknown";
  },

  // ---------- Construction des événements ----------

  // construit la liste d'événements (tous appareils qui ont une date_objectif)
  buildEvents() {
    const rows = QryDashboardSuiviFabrication.data || [];
    const events = [];

    rows.forEach((r) => {
      const appareil = r.numero_appareil;
      const label = `${r.nom_appareil}`;
      const etapes = r.etapes || [];

      etapes.forEach((e, idx) => {
        if (!e.date_objectif) return;

        const dateStr = String(e.date_objectif).slice(0, 10); // yyyy-mm-dd

        events.push({
          id: `${appareil}-${e.groupe_code}-${idx}`,
          appareil,
          appareilLabel: label,
          date: dateStr,
          lettre: this.stepLetter(e.groupe_code),
          statut: this.stepStatus(e.statut_code),
          color: e.color || e.statut_couleur || "#e5e7eb",
        });
      });
    });

    return events;
  },

  // ---------- Modèle global pour le widget ----------

  getModel() {
  const rowsRaw = QryDashboardSuiviFabrication.data || [];
  const events = this.buildEvents();
  const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  // 👇 on prépare la légende à envoyer au widget
  const legend = (QrySuiviFab_Statuts.data || []).map((s) => ({
    id: s.id,
    libelle: s.libelle,
    couleur: s.couleur,
  }));

  // --- min/max des délais appareils ---
  let minDelai = null;
  let maxDelai = null;
  rowsRaw.forEach((r) => {
    if (!r.delai) return;
    const dStr = String(r.delai).slice(0, 10); // yyyy-mm-dd
    if (!minDelai || dStr < minDelai) minDelai = dStr;
    if (!maxDelai || dStr > maxDelai) maxDelai = dStr;
  });

  // --- bornes min/max globales (events + delais) ---
  let minDate = null;
  let maxDate = null;

  if (events.length) {
    minDate = events[0].date;
    maxDate = events[0].date;
    events.forEach((e) => {
      if (e.date < minDate) minDate = e.date;
      if (e.date > maxDate) maxDate = e.date;
    });
  }

  // intégrer les délais
  if (minDelai && (!minDate || minDelai < minDate)) minDate = minDelai;
  if (maxDelai && (!maxDate || maxDelai > maxDate)) maxDate = maxDelai;

  // fallback si aucune date nulle part
  if (!minDate) minDate = today;
  if (!maxDate) maxDate = today;

  // s'assurer que "today" est inclus
  if (today < minDate) minDate = today;
  if (today > maxDate) maxDate = maxDate; // today déjà >= maxDate

  // marge : 2 jours avant, 7 jours après la date max
  const padBefore = 2;
  const padAfter = 7;

  const startDate = this.addDaysYMD(minDate, -padBefore);
  const endDate   = this.addDaysYMD(maxDate, padAfter);
  const days = this.diffDays(startDate, endDate) + 1;

  // --- cas particulier : aucune étape planifiée ---
  if (!events.length) {
    const rows = rowsRaw.map((r) => ({
      appareil: r.numero_appareil,
			affaire: r.numero_affaire,
      label: `${r.nom_appareil}`,
      delai: r.delai ? String(r.delai).slice(0, 10) : null,
      events: [],
    }));

    return {
      rows,
      startDate,
      days,
      today,
      legend,        // 👈 IMPORTANT : on renvoie la légende ici aussi
    };
  }

  // --- groupage par appareil à partir des events ---
  const rowMap = {};
  events.forEach((e) => {
    if (!rowMap[e.appareil]) {
      rowMap[e.appareil] = {
        appareil: e.appareil,
				affaire: e.affaire,
        label: e.appareilLabel,
        delai: null, // complété après avec rowsRaw
        events: [],
      };
    }
    rowMap[e.appareil].events.push({
      date: e.date,
      lettre: e.lettre,
      color: e.color,
      statut: e.statut,
    });
  });

  // garantir une ligne pour chaque appareil de la requête,
  // et y associer le délai
  rowsRaw.forEach((r) => {
    const app = r.numero_appareil;
    const delaiStr = r.delai ? String(r.delai).slice(0, 10) : null;

    if (!rowMap[app]) {
      rowMap[app] = {
        appareil: app,
				affaire: r.numero_affaire,
        label: `${r.nom_appareil}`,
        delai: delaiStr,
        events: [],
      };
    } else if (!rowMap[app].delai) {
      rowMap[app].delai = delaiStr;
    }
		if (!rowMap[app].affaire) {      // 👈 NOUVEAU
      rowMap[app].affaire = r.numero_affaire;
    }
  });

  const rows = Object.values(rowMap).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return {
    rows,
    startDate,
    days,
    today,
    legend,        // 👈 et ici aussi
  };
},

};
