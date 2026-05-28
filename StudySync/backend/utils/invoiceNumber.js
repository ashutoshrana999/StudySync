function invoiceNumber() {
  // Simple unique-ish invoice number: INV-YYYYMMDD-<random>
  const d = new Date();
  const y = String(d.getFullYear());
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(16).slice(2, 8).toUpperCase();
  return `INV-${y}${m}${day}-${rand}`;
}

module.exports = { invoiceNumber };

