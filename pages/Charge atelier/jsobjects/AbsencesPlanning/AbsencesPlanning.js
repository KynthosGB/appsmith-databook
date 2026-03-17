export default {
  getSelectedMonthDate() {
    const value = SelectMoisAbsence.selectedOptionValue;
    if (!value) return new Date();

    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date() : d;
  },

  getDaysInMonth() {
    const d = this.getSelectedMonthDate();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  },

  getMonthStart() {
    const d = this.getSelectedMonthDate();
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    return start.toISOString().slice(0, 10);
  },

  getMonthEnd() {
    const d = this.getSelectedMonthDate();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return end.toISOString().slice(0, 10);
  },

  buildTableRows() {
    const monteurs = QryMonteurs.data || [];
    const absences = GetAbsences.data || [];
    const selected = this.getSelectedMonthDate();
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const daysInMonth = this.getDaysInMonth();

    const rowsByUser = {};

    monteurs.forEach(monteur => {
      const row = {
        everwin_user_id: monteur.everwin_user_id,
        nom: monteur.display_name
      };

      for (let day = 1; day <= 31; day++) {
        row[String(day)] = "";
      }

      rowsByUser[monteur.everwin_user_id] = row;
    });

    absences.forEach(abs => {
      const userId = abs.everwin_user_id;
      const d = new Date(abs.date_jour);

      if (isNaN(d.getTime())) return;
      if (d.getFullYear() !== year || d.getMonth() !== month) return;

      const day = d.getDate();
      if (day < 1 || day > 31) return;

      if (!rowsByUser[userId]) {
        const row = {
          everwin_user_id: userId,
          nom: ""
        };

        for (let i = 1; i <= 31; i++) {
          row[String(i)] = "";
        }

        rowsByUser[userId] = row;
      }

      rowsByUser[userId][String(day)] = Number(abs.heures_absence || 0);
    });

    return Object.values(rowsByUser).map(row => {
      for (let day = 1; day <= 31; day++) {
        if (day > daysInMonth) {
          row[String(day)] = "";
        }
      }
      return row;
    });
  },

  buildRowPayload(updatedRow) {
    const selected = this.getSelectedMonthDate();
    const year = selected.getFullYear();
    const month = selected.getMonth();
    const daysInMonth = this.getDaysInMonth();

    const payload = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const value = Number(updatedRow[String(day)] || 0);

      const date = new Date(year, month, day);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");

      payload.push({
        everwin_user_id: updatedRow.everwin_user_id,
        date_jour: `${yyyy}-${mm}-${dd}`,
        heures_absence: value
      });
    }

    return payload;
  }
};