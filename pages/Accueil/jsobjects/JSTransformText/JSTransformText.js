export default {
  normalizeText(text) {
    if (!text) return "";

    return String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9_ -]/g, "")
      .replace(/-/g, "_")
      .replace(/\s+/g, "_")
      .toUpperCase();
  },

  // Applique à n'importe quel widget passé en paramètre
  applyTo(widget) {
    const current = widget?.text ?? "";
    const normalized = this.normalizeText(current);

    if (normalized === current) return;

    return widget.setValue(normalized);
  }
};
