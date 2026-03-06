export default {
  HOURS_PER_DAY: 7.5,
  CAPACITE_ATELIER: 120,

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

  isWorkingDayUTC(date) {
    const day = date.getUTCDay();
    return day !== 0 && day !== 6;
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
    return dateStr.slice(0, 7); // YYYY-MM
  },

  buildDailyLoad() {
    const rows = GetChargeFab.data || [];
    const loadByDay = {};

    rows.forEach(row => {
      let d1 = this.parseDate(row.DateDebutFab);
      let d2 = this.parseDate(row.DateFinFab);

      if (!d1 || !d2) return;

      if (d1 > d2) [d1, d2] = [d2, d1];

      d1 = this.normalizeUTC(d1);
      d2 = this.normalizeUTC(d2);

      for (let d = new Date(d1); d <= d2; d.setUTCDate(d.getUTCDate() + 1)) {
        if (this.isWorkingDayUTC(d)) {
          const localDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
          const key = this.formatDate(localDate);
          loadByDay[key] = (loadByDay[key] || 0) + this.HOURS_PER_DAY;
        }
      }
    });

    return Object.keys(loadByDay)
      .sort()
      .map(date => ({
        period: date,
        hours: Number(loadByDay[date].toFixed(2)),
        capacity: this.CAPACITE_ATELIER
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
          capacity: 0,
          daysCount: 0
        };
      }

      grouped[key].hours += item.hours;
      grouped[key].capacity += item.capacity;
      grouped[key].daysCount += 1;
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
          capacity: 0,
          daysCount: 0
        };
      }

      grouped[key].hours += item.hours;
      grouped[key].capacity += item.capacity;
      grouped[key].daysCount += 1;
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
    const dailyData = this.buildDailyLoad();

    if (granularity === "week") {
      return this.aggregateByWeek(dailyData);
    }

    if (granularity === "month") {
      return this.aggregateByMonth(dailyData);
    }

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