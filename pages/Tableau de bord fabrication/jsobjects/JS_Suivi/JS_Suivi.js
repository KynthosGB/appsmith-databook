export default {
  getEtape(etapes, groupeCode) {
    if (!Array.isArray(etapes)) return null;
    return etapes.find(e => e.groupe_code === groupeCode) || null;
  }
};
