export default {
  intv: null,

  newJobId() {
    try { return crypto.randomUUID(); }
    catch { return 'job_' + Math.random().toString(36).slice(2); }
  },

  startPolling() {
    // rafraîchit la requête GetProgress toutes les 1.5 s
    if (this.intv) clearInterval(this.intv);
    this.intv = setInterval(() => GetProgress.run(), 1000);
  },

  stopPolling() {
    if (this.intv) { clearInterval(this.intv); this.intv = null; }
  }
}
