/**
 * Generador de facturas PDF para el panel B2B de RRHH.
 * Usa PDFKit para crear un documento profesional con datos de la empresa,
 * período de facturación, licencias activas y totales.
 */
import * as PDFDocumentModule from "pdfkit";
const PDFDocument = (PDFDocumentModule as any).default || PDFDocumentModule;

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  company: {
    name: string;
    taxId?: string | null;
    contactEmail: string;
    contactName?: string | null;
    plan: string;
  };
  activeLicenses: number;
  pricePerLicense: number;
  totalAmount: number;
  status: string;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  business: "Business",
  enterprise: "Enterprise",
  corporate: "Corporate",
  global: "Global",
};

/**
 * Genera un PDF de factura y devuelve un Buffer con el contenido.
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 50,
        info: {
          Title: `Factura ${data.invoiceNumber}`,
          Author: "BuddyOne for Business",
          Subject: `Factura mensual — ${data.company.name}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - 100; // 50 margin each side
      const orange = "#F97316";
      const darkGray = "#1F2937";
      const medGray = "#6B7280";
      const lightBg = "#F9FAFB";

      // ─── HEADER ───────────────────────────────────────────────────
      // Orange accent bar
      doc.rect(0, 0, doc.page.width, 6).fill(orange);

      doc.moveDown(1);

      // Company logo text
      doc.fontSize(22).fillColor(orange).text("Buddy", 50, 30, { continued: true });
      doc.fillColor(darkGray).text("One");
      doc.fontSize(9).fillColor(medGray).text("for Business", 50, 55);

      // Invoice label - right aligned
      doc.fontSize(28).fillColor(darkGray).text("FACTURA", 350, 30, { align: "right" });
      doc.fontSize(10).fillColor(medGray).text(data.invoiceNumber, 350, 62, { align: "right" });

      // ─── SEPARATOR ────────────────────────────────────────────────
      doc.moveTo(50, 85).lineTo(50 + pageWidth, 85).strokeColor("#E5E7EB").lineWidth(1).stroke();

      // ─── EMISOR & RECEPTOR ────────────────────────────────────────
      const infoY = 100;

      // Emisor (left)
      doc.fontSize(8).fillColor(orange).text("EMISOR", 50, infoY);
      doc.fontSize(10).fillColor(darkGray).text("BuddyOne Technologies S.L.", 50, infoY + 14);
      doc.fontSize(8).fillColor(medGray)
        .text("CIF: B-XXXXXXXX", 50, infoY + 28)
        .text("Madrid, España", 50, infoY + 40)
        .text("facturacion@buddyone.io", 50, infoY + 52);

      // Receptor (right)
      const rightX = 320;
      doc.fontSize(8).fillColor(orange).text("CLIENTE", rightX, infoY);
      doc.fontSize(10).fillColor(darkGray).text(data.company.name, rightX, infoY + 14);
      doc.fontSize(8).fillColor(medGray);
      if (data.company.taxId) {
        doc.text(`CIF/NIF: ${data.company.taxId}`, rightX, infoY + 28);
      }
      if (data.company.contactName) {
        doc.text(`Contacto: ${data.company.contactName}`, rightX, infoY + (data.company.taxId ? 40 : 28));
      }
      doc.text(data.company.contactEmail, rightX, infoY + (data.company.taxId ? 52 : 40));

      // ─── DETALLES DE FACTURA ──────────────────────────────────────
      const detailY = 185;
      doc.moveTo(50, detailY).lineTo(50 + pageWidth, detailY).strokeColor("#E5E7EB").lineWidth(1).stroke();

      const detailBoxY = detailY + 10;
      // 4 columns of info
      const colWidth = pageWidth / 4;

      const detailItems = [
        { label: "Fecha de emisión", value: data.issueDate },
        { label: "Período", value: `${data.billingPeriodStart} — ${data.billingPeriodEnd}` },
        { label: "Plan", value: PLAN_LABELS[data.company.plan] || data.company.plan },
        { label: "Estado", value: data.status === "paid" ? "Pagado" : data.status === "confirmed" ? "Confirmado" : "Pendiente" },
      ];

      detailItems.forEach((item, i) => {
        const x = 50 + i * colWidth;
        doc.fontSize(7).fillColor(medGray).text(item.label.toUpperCase(), x, detailBoxY);
        doc.fontSize(9).fillColor(darkGray).text(item.value, x, detailBoxY + 12, { width: colWidth - 10 });
      });

      // ─── TABLA DE CONCEPTOS ───────────────────────────────────────
      const tableY = 240;

      // Table header
      doc.rect(50, tableY, pageWidth, 28).fill("#F3F4F6");
      doc.fontSize(8).fillColor(medGray);
      doc.text("CONCEPTO", 60, tableY + 9);
      doc.text("LICENCIAS", 280, tableY + 9, { width: 70, align: "center" });
      doc.text("PRECIO/UD.", 355, tableY + 9, { width: 80, align: "center" });
      doc.text("TOTAL", 440, tableY + 9, { width: 100, align: "right" });

      // Table row
      const rowY = tableY + 28;
      doc.rect(50, rowY, pageWidth, 36).fill("white");
      doc.moveTo(50, rowY).lineTo(50 + pageWidth, rowY).strokeColor("#E5E7EB").lineWidth(0.5).stroke();

      doc.fontSize(9).fillColor(darkGray);
      doc.text("Buddy One Pro Max — Licencia empleado", 60, rowY + 8);
      doc.fontSize(7).fillColor(medGray);
      doc.text(`Plan ${PLAN_LABELS[data.company.plan] || data.company.plan} · Período ${data.billingPeriodStart} a ${data.billingPeriodEnd}`, 60, rowY + 22);

      doc.fontSize(9).fillColor(darkGray);
      doc.text(data.activeLicenses.toString(), 280, rowY + 13, { width: 70, align: "center" });
      doc.text(`${data.pricePerLicense.toFixed(2)} €`, 355, rowY + 13, { width: 80, align: "center" });
      doc.text(`${data.totalAmount.toFixed(2)} €`, 440, rowY + 13, { width: 100, align: "right" });

      // Bottom border
      const bottomLineY = rowY + 36;
      doc.moveTo(50, bottomLineY).lineTo(50 + pageWidth, bottomLineY).strokeColor("#E5E7EB").lineWidth(0.5).stroke();

      // ─── TOTALES ──────────────────────────────────────────────────
      const totalsY = bottomLineY + 15;
      const totalsX = 370;
      const totalsValX = 440;
      const totalsW = 100;

      // Subtotal
      doc.fontSize(9).fillColor(medGray).text("Subtotal:", totalsX, totalsY);
      doc.fontSize(9).fillColor(darkGray).text(`${data.totalAmount.toFixed(2)} €`, totalsValX, totalsY, { width: totalsW, align: "right" });

      // IVA
      const ivaAmount = data.totalAmount * 0.21;
      doc.fontSize(9).fillColor(medGray).text("IVA (21%):", totalsX, totalsY + 18);
      doc.fontSize(9).fillColor(darkGray).text(`${ivaAmount.toFixed(2)} €`, totalsValX, totalsY + 18, { width: totalsW, align: "right" });

      // Separator
      doc.moveTo(totalsX, totalsY + 35).lineTo(totalsX + totalsW + 70, totalsY + 35).strokeColor("#E5E7EB").lineWidth(0.5).stroke();

      // Total
      const totalWithIva = data.totalAmount + ivaAmount;
      doc.fontSize(12).fillColor(darkGray).font("Helvetica-Bold").text("TOTAL:", totalsX, totalsY + 42);
      doc.fontSize(12).fillColor(orange).text(`${totalWithIva.toFixed(2)} €`, totalsValX, totalsY + 42, { width: totalsW, align: "right" });

      // ─── NOTAS ────────────────────────────────────────────────────
      const notesY = totalsY + 80;
      doc.font("Helvetica");
      doc.rect(50, notesY, pageWidth, 60).fill(lightBg);
      doc.fontSize(8).fillColor(orange).text("INFORMACIÓN", 60, notesY + 10);
      doc.fontSize(8).fillColor(medGray)
        .text("• La facturación se basa en las licencias activas durante el período indicado.", 60, notesY + 24)
        .text("• Una licencia se considera activa si el empleado ha utilizado la app en los últimos 30 días.", 60, notesY + 36)
        .text("• Para consultas sobre esta factura, contacte con facturacion@buddyone.io", 60, notesY + 48);

      // ─── FOOTER ───────────────────────────────────────────────────
      const footerY = doc.page.height - 60;
      doc.moveTo(50, footerY).lineTo(50 + pageWidth, footerY).strokeColor("#E5E7EB").lineWidth(0.5).stroke();
      doc.fontSize(7).fillColor(medGray)
        .text(
          "BuddyOne Technologies S.L. · CIF: B-XXXXXXXX · Madrid, España · buddyone.io",
          50, footerY + 10,
          { align: "center", width: pageWidth }
        );
      doc.fontSize(7).fillColor(medGray)
        .text(
          "Este documento es una factura simplificada generada automáticamente. Para facturas completas, contacte con facturación.",
          50, footerY + 22,
          { align: "center", width: pageWidth }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
