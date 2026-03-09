export default {
  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },

  getEasterDate(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  },

  addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  },

  getYearHolidays(year) {
    const easter = this.getEasterDate(year);

    return [
      `${year}-01-01`,
      `${year}-05-01`,
      `${year}-05-08`,
      `${year}-07-14`,
      `${year}-08-15`,
      `${year}-11-01`,
      `${year}-11-11`,
      `${year}-12-25`,
      this.formatDate(this.addDays(easter, 1)),   // Lundi de Pâques
      this.formatDate(this.addDays(easter, 39)),  // Ascension
      this.formatDate(this.addDays(easter, 50))   // Lundi de Pentecôte
    ];
  },

  getHolidaysBetween(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return [];

    const startYear = Number(startDateStr.slice(0, 4));
    const endYear = Number(endDateStr.slice(0, 4));

    const holidays = [];

    for (let year = startYear; year <= endYear; year++) {
      holidays.push(...this.getYearHolidays(year));
    }

    return holidays.filter(d => d >= startDateStr && d <= endDateStr);
  },

  getHolidaySet(startDateStr, endDateStr) {
    const dates = this.getHolidaysBetween(startDateStr, endDateStr);
    const set = {};
    dates.forEach(d => { set[d] = true; });
    return set;
  }
};