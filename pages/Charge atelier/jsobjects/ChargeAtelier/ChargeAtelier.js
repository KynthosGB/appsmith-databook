export default {
  HOURS_PER_DAY: 7.5,

  formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  },

  parseDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  },

  normalizeUTC(date) {
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  },

  isWeekend(date) {
    const day = date.getUTCDay();
    return day === 0 || day === 6;
  },

  getAllFabDates() {
    const rows = GetChargeFab.data || [];
    const dates = [];

    rows.forEach(row => {
      const d1 = this.parseDate(row.DateDebutFab);
      const d2 = this.parseDate(row.DateFinFab);

      if (d1) dates.push(d1);
      if (d2) dates.push(d2);
    });

    return dates;
  },

  getStartDate() {
    const dates = this.getAllFabDates();
    if (!dates.length) return null;

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    return this.formatDate(minDate);
  },

  getEndDate() {
    const dates = this.getAllFabDates();
    if (!dates.length) return null;

    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    return this.formatDate(maxDate);
  },

  getDateRange() {
    const startStr = this.getStartDate();
    const endStr = this.getEndDate();

    if (!startStr || !endStr) return [];

    let current = this.normalizeUTC(new Date(startStr + "T00:00:00"));
    const end = this.normalizeUTC(new Date(endStr + "T00:00:00"));

    const days = [];

    while (current <= end) {
      const localDate = new Date(
        current.getUTCFullYear(),
        current.getUTCMonth(),
        current.getUTCDate()
      );
      days.push(this.formatDate(localDate));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return days;
  },

  getMonteursCount() {
    return (QryMonteurs.data || []).length;
  },

  buildAbsenceMap() {
    const rows = GetAbsences.data || [];
    const map = {};

    rows.forEach(row => {
      const day = String(row.date_jour).slice(0, 10);
      const hours = Number(row.heures_absence || 0);
      map[day] = (map[day] || 0) + hours;
    });

    return map;
  },

  buildClosureMap() {
    const rows = GetFermeturesEntreprise.data || [];
    const map = {};

    rows.forEach(row => {
      let start = this.parseDate(row.date_debut);
      let end = this.parseDate(row.date_fin);

      if (!start || !end) return;
      if (start > end) [start, end] = [end, start];

      start = this.normalizeUTC(start);
      end = this.normalizeUTC(end);

      for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const localDate = new Date(
          d.getUTCFullYear(),
          d.getUTCMonth(),
          d.getUTCDate()
        );
        const key = this.formatDate(localDate);
        map[key] = true;
      }
    });

    return map;
  },

  buildHolidayMap() {
    const start = this.getStartDate();
    const end = this.getEndDate();

    if (!start || !end) return {};
    return JoursFeriesFR.getHolidaySet(start, end);
  },

  getTheoreticalCapacityHours() {
    return this.getMonteursCount() * this.HOURS_PER_DAY;
  },

  buildDailyCapacityData() {
    const days = this.getDateRange();
    const absenceMap = this.buildAbsenceMap();
    const closureMap = this.buildClosureMap();
    const holidayMap = this.buildHolidayMap();
    const theoretical = this.getTheoreticalCapacityHours();

    return days.map(dayStr => {
      const date = new Date(dayStr + "T00:00:00");
      const utcDate = this.normalizeUTC(date);

      const isWeekend = this.isWeekend(utcDate);
      const isClosed = !!closureMap[dayStr];
      const isHoliday = !!holidayMap[dayStr];
      const absenceHours = Number(absenceMap[dayStr] || 0);

      let capacity = 0;

      if (!isWeekend && !isClosed && !isHoliday) {
        capacity = Math.max(theoretical - absenceHours, 0);
      }

      return {
        period: dayStr,
        capacity: Number(capacity.toFixed(2)),
        theoretical: Number(theoretical.toFixed(2)),
        absenceHours: Number(absenceHours.toFixed(2)),
        isWeekend,
        isClosed,
        isHoliday
      };
    });
  },

  getISOWeekInfo(dateStr) {
    const date = new Date(dateStr + "T00:00:00");
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));

    const dayNum = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);

    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);

    return {
      year: tmp.getUTCFullYear(),
      week: weekNum
    };
  },

  getWeekKey(dateStr) {
    const { year, week } = this.getISOWeekInfo(dateStr);
    return `${year}-S${String(week).padStart(2, "0")}`;
  },

  getMonthKey(dateStr) {
    return dateStr.slice(0, 7);
  },

  buildDailyLoadMap() {
		const rows = GetChargeFab.data || [];
		const loadByDay = {};
		const closureMap = this.buildClosureMap();
		const holidayMap = this.buildHolidayMap();

		rows.forEach(row => {
			let d1 = this.parseDate(row.DateDebutFab);
			let d2 = this.parseDate(row.DateFinFab);
			const totalHours = Number(row.HeuresPrevuesMontage || 0);

			if (!d1 || !d2 || totalHours <= 0) return;
			if (d1 > d2) [d1, d2] = [d2, d1];

			d1 = this.normalizeUTC(d1);
			d2 = this.normalizeUTC(d2);

			const workingDays = [];

			for (let d = new Date(d1); d <= d2; d.setUTCDate(d.getUTCDate() + 1)) {
				const localDate = new Date(
					d.getUTCFullYear(),
					d.getUTCMonth(),
					d.getUTCDate()
				);
				const key = this.formatDate(localDate);

				const isWeekend = this.isWeekend(d);
				const isClosed = !!closureMap[key];
				const isHoliday = !!holidayMap[key];

				if (!isWeekend && !isClosed && !isHoliday) {
					workingDays.push(key);
				}
			}

			if (!workingDays.length) return;

			const dailyHours = totalHours / workingDays.length;

			workingDays.forEach(key => {
				loadByDay[key] = (loadByDay[key] || 0) + dailyHours;
			});
		});

		return loadByDay;
	},

  buildDailyChartData() {
    const capacityRows = this.buildDailyCapacityData();
    const loadMap = this.buildDailyLoadMap();

    return capacityRows.map(row => ({
      period: row.period,
      hours: Number((loadMap[row.period] || 0).toFixed(2)),
      capacity: row.capacity,
      theoretical: row.theoretical,
      absenceHours: row.absenceHours,
      isWeekend: row.isWeekend,
      isClosed: row.isClosed,
      isHoliday: row.isHoliday
    }));
  },

  aggregateByWeek(dailyData) {
    const grouped = {};

    dailyData.forEach(item => {
      const key = this.getWeekKey(item.period);

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          hours: 0,
          capacity: 0
        };
      }

      grouped[key].hours += item.hours;
      grouped[key].capacity += item.capacity;
    });

    return Object.values(grouped)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(item => ({
        period: item.period,
        hours: Number(item.hours.toFixed(2)),
        capacity: Number(item.capacity.toFixed(2))
      }));
  },

  aggregateByMonth(dailyData) {
    const grouped = {};

    dailyData.forEach(item => {
      const key = this.getMonthKey(item.period);

      if (!grouped[key]) {
        grouped[key] = {
          period: key,
          hours: 0,
          capacity: 0
        };
      }

      grouped[key].hours += item.hours;
      grouped[key].capacity += item.capacity;
    });

    return Object.values(grouped)
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(item => ({
        period: item.period,
        hours: Number(item.hours.toFixed(2)),
        capacity: Number(item.capacity.toFixed(2))
      }));
  },

  getChartData() {
    const granularity = SelectGranularite.selectedOptionValue || "day";
    const dailyData = this.buildDailyChartData();

    if (granularity === "week") return this.aggregateByWeek(dailyData);
    if (granularity === "month") return this.aggregateByMonth(dailyData);

    return dailyData;
  },

  getXAxisName() {
    const granularity = SelectGranularite.selectedOptionValue || "day";
    if (granularity === "week") return "Semaine";
    if (granularity === "month") return "Mois";
    return "Date";
  },

  getSeriesName() {
    const granularity = SelectGranularite.selectedOptionValue || "day";
    if (granularity === "week") return "Charge atelier hebdo";
    if (granularity === "month") return "Charge atelier mensuelle";
    return "Charge atelier";
  },

  buildEchartOption() {
    const data = this.getChartData();
    const granularity = SelectGranularite.selectedOptionValue || "day";

    return {
      tooltip: {
        trigger: "axis"
      },
      legend: {
        top: 0
      },
      grid: {
        left: 60,
        right: 30,
        top: 50,
        bottom: 70
      },
      xAxis: {
        type: "category",
        name: this.getXAxisName(),
        data: data.map(d => d.period),
        axisLabel: {
          rotate: granularity === "day" ? 45 : 0
        }
      },
      yAxis: {
        type: "value",
        name: "Heures"
      },
      series: [
        {
          name: this.getSeriesName(),
          type: "line",
          smooth: true,
          areaStyle: {},
          data: data.map(d => d.hours)
        },
        {
          name: "Capacité atelier",
          type: "line",
          smooth: false,
          symbol: "none",
          data: data.map(d => d.capacity)
        }
      ]
    };
  }
}