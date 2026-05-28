const PDFDocument = require("pdfkit");

function buildInvoicePdf({
  logoText = "StudySync",
  invoiceNumber,
  student,
  payment
}) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // Header
  doc
    .fontSize(18)
    .text(logoText, { align: "left" })
    .moveDown(0.25);

  doc
    .fontSize(12)
    .fillColor("#444")
    .text("Invoice", { align: "right" })
    .fillColor("#000");

  doc.moveDown(1);

  // Meta
  doc.fontSize(11);
  doc.text(`Invoice No: ${invoiceNumber}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown(1);

  // Student
  doc.fontSize(12).text("Billed To:", { underline: true });
  doc.fontSize(11).text(student.name);
  doc.text(student.email);
  if (student.phone) doc.text(student.phone);
  doc.moveDown(1);

  // Payment table-ish
  doc.fontSize(12).text("Payment Details:", { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(11).text(`Month: ${payment.monthKey}`);
  doc.text(`Plan: ${student.planName || "Standard"}`);
  doc.text(`Seat: ${student.seatNumber || "—"} (${student.shift || "full"})`);
  doc.text(`Amount: INR ${Number(payment.amount).toFixed(2)}`);
  doc.text(`Status: ${payment.status.toUpperCase()}`);
  doc.text(`Due Date: ${new Date(payment.dueDate).toLocaleDateString()}`);
  if (payment.paidAt) doc.text(`Paid At: ${new Date(payment.paidAt).toLocaleString()}`);

  doc.moveDown(2);
  doc
    .fontSize(10)
    .fillColor("#666")
    .text("This is a computer generated invoice.", { align: "center" });

  return doc;
}

module.exports = { buildInvoicePdf };

