export default {
  getSelectedMonth() {
    return SelectMoisAbsence.selectedOptionValue || "2026-03";
  },

  getMonthInfo() {
    const [year, month] = this.getSelectedMonth().split("-").map(Number);
    const lastDay = new Date(year, month, 0);

    return {
      year,
      month,
      daysInMonth: lastDay.getDate()
    };
  },

  getMonthStart() {
    const { year, month } = this.getMonthInfo();
    return `${year}-${String(month).padStart(2, "0")}-01`;
  },

  getMonthEnd() {
    const { year, month, daysInMonth } = this.getMonthInfo();
    return `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;
  },

  getDayColumns() {
    const { year, month, daysInMonth } = this.getMonthInfo();
    const cols = [];

    for (let day = 1; day <= daysInMonth; day++) {
      cols.push({
        key: String(day),
        fullDate: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      });
    }

    return cols;
  },

  getDayMap() {
    const map = {};
    this.getDayColumns().forEach(col => {
      map[col.key] = col.fullDate;
    });
    return map;
  },

  buildTableData() {
		const monteurs = QryMonteurs.data || [];
		const absences = GetAbsencesTable.data || [];
		const dayColumns = this.getDayColumns();

		const absenceMap = {};

		absences.forEach(a => {
			const dateStr = String(a.date_jour).slice(0, 10);
			const day = String(Number(dateStr.split("-")[2]));
			const key = `${a.everwin_user_id}__${day}`;
			absenceMap[key] = a.heures_absence;
		});

		return monteurs.map(monteur => {
			const row = {
				everwin_user_id: monteur.everwin_user_id,
				nom: monteur.display_name || monteur.everwin_user_id
			};

			dayColumns.forEach(col => {
				const mapKey = `${monteur.everwin_user_id}__${col.key}`;
				row[col.key] = absenceMap[mapKey] ?? null;
			});

			return row;
		});
	},

  buildRowPayload(row) {
    const dayMap = this.getDayMap();
    const payload = [];

    if (!row || !row.everwin_user_id) return payload;

    Object.keys(dayMap).forEach(dayKey => {
      const value = row[dayKey];

      if (
        value !== null &&
        value !== "" &&
        value !== undefined &&
        !isNaN(Number(value)) &&
        Number(value) > 0
      ) {
        payload.push({
          everwin_user_id: row.everwin_user_id,
          date_jour: dayMap[dayKey],
          heures_absence: Number(value)
        });
      }
    });

    return payload;
  }
}