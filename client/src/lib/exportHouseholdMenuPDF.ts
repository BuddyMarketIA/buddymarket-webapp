import { jsPDF } from "jspdf";

const DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const MEALS = [
  { key: "breakfast", label: "Desayuno" },
  { key: "lunch", label: "Comida" },
  { key: "snack", label: "Merienda" },
  { key: "dinner", label: "Cena" },
];

const MENU_TYPE_LABELS: Record<string, string> = {
  adults: "Adultos",
  kids: "Niños",
  baby: "Bebé",
  custom: "Personalizado",
  family: "Familiar",
};

// Orange brand color
const ORANGE = { r: 249, g: 115, b: 22 };
const ORANGE_LIGHT = { r: 255, g: 237, b: 213 };
const DARK = { r: 30, g: 30, b: 30 };
const GRAY = { r: 100, g: 100, b: 100 };
const LIGHT_GRAY = { r: 240, g: 240, b: 240 };
const WHITE = { r: 255, g: 255, b: 255 };

interface MenuPlan {
  id: number;
  name: string;
  menuType: string;
  weekStartDate: Date | string;
  meals: Record<string, Record<string, string>> | null;
  notes: string | null;
  generatedByAI: boolean;
  memberName?: string | null;
}

export function exportHouseholdMenuToPDF(plan: MenuPlan): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth(); // 297mm
  const pageH = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;
  const contentW = pageW - margin * 2;

  // ── Header bar ──────────────────────────────────────────────────────────────
  doc.setFillColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.rect(0, 0, pageW, 16, "F");

  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("BuddyOne", margin, 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }),
    pageW - margin,
    10.5,
    { align: "right" }
  );

  // ── Title section ────────────────────────────────────────────────────────────
  let y = 24;
  doc.setTextColor(DARK.r, DARK.g, DARK.b);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(plan.name, margin, y);
  y += 5;

  // Subtitle row
  const weekDate = new Date(plan.weekStartDate);
  const weekLabel = `Semana del ${weekDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`;
  const typeLabel = MENU_TYPE_LABELS[plan.menuType] || plan.menuType;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text(`${weekLabel}  ·  Tipo: ${typeLabel}`, margin, y);
  if (plan.generatedByAI) {
    const aiLabel = "✦ Generado por IA";
    const aiX = doc.getTextWidth(`${weekLabel}  ·  Tipo: ${typeLabel}`) + margin + 4;
    doc.setTextColor(ORANGE.r, ORANGE.g, ORANGE.b);
    doc.text(aiLabel, aiX, y);
  }
  y += 8;

  // ── Table ────────────────────────────────────────────────────────────────────
  const colDayW = 22;
  const colMealW = (contentW - colDayW) / MEALS.length;
  const rowH = 8.5;
  const headerH = 9;

  // Table header background
  doc.setFillColor(ORANGE.r, ORANGE.g, ORANGE.b);
  doc.rect(margin, y, contentW, headerH, "F");

  // Header: "Día" column
  doc.setTextColor(WHITE.r, WHITE.g, WHITE.b);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Día", margin + colDayW / 2, y + 6, { align: "center" });

  // Header: meal columns
  MEALS.forEach((meal, i) => {
    const x = margin + colDayW + i * colMealW;
    doc.text(meal.label, x + colMealW / 2, y + 6, { align: "center" });
  });

  y += headerH;

  // Table rows
  DAYS.forEach((day, rowIdx) => {
    const dayMeals = plan.meals?.[day.key] || {};
    const isEven = rowIdx % 2 === 0;

    // Row background
    if (isEven) {
      doc.setFillColor(LIGHT_GRAY.r, LIGHT_GRAY.g, LIGHT_GRAY.b);
    } else {
      doc.setFillColor(WHITE.r, WHITE.g, WHITE.b);
    }
    doc.rect(margin, y, contentW, rowH, "F");

    // Day name
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(ORANGE.r, ORANGE.g, ORANGE.b);
    doc.text(day.label, margin + colDayW / 2, y + 5.5, { align: "center" });

    // Meal cells
    MEALS.forEach((meal, i) => {
      const x = margin + colDayW + i * colMealW;
      const cellText = dayMeals[meal.key] || "—";
      doc.setFont("helvetica", "normal");
      doc.setTextColor(DARK.r, DARK.g, DARK.b);

      // Wrap long text
      const maxW = colMealW - 4;
      const lines = doc.splitTextToSize(cellText, maxW);
      const displayLine = lines[0] + (lines.length > 1 ? "…" : "");
      doc.text(displayLine, x + 2, y + 5.5);
    });

    // Row border
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(margin, y + rowH, margin + contentW, y + rowH);

    y += rowH;
  });

  // Table outer border
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.rect(margin, y - DAYS.length * rowH - headerH, contentW, DAYS.length * rowH + headerH);

  y += 6;

  // ── Notes section ────────────────────────────────────────────────────────────
  if (plan.notes) {
    doc.setFillColor(ORANGE_LIGHT.r, ORANGE_LIGHT.g, ORANGE_LIGHT.b);
    const notesLines = doc.splitTextToSize(`Notas: ${plan.notes}`, contentW - 8);
    const notesH = notesLines.length * 5 + 6;
    doc.roundedRect(margin, y, contentW, notesH, 2, 2, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(DARK.r, DARK.g, DARK.b);
    doc.text(notesLines, margin + 4, y + 5);
    y += notesH + 4;
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(
    "Generado con BuddyOne · buddyoneapp.com · Este menú es orientativo y no sustituye el consejo de un profesional de la salud.",
    pageW / 2,
    pageH - 5,
    { align: "center" }
  );

  // ── Save ─────────────────────────────────────────────────────────────────────
  const safeName = plan.name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s\-_]/g, "").trim();
  doc.save(`${safeName}.pdf`);
}

/**
 * Opens a print-friendly view of the menu in a new window.
 */
export function printHouseholdMenu(plan: MenuPlan): void {
  const weekDate = new Date(plan.weekStartDate);
  const weekLabel = weekDate.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const typeLabel = MENU_TYPE_LABELS[plan.menuType] || plan.menuType;

  const rows = DAYS.map((day) => {
    const dayMeals = plan.meals?.[day.key] || {};
    const cells = MEALS.map((m) => `<td>${dayMeals[m.key] || "—"}</td>`).join("");
    return `<tr><th>${day.label}</th>${cells}</tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${plan.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #1e1e1e; padding: 20px; }
    .header { background: #f97316; color: white; padding: 10px 16px; border-radius: 6px 6px 0 0; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 16px; font-weight: bold; }
    .header .brand { font-size: 11px; opacity: 0.85; }
    .meta { background: #fff7ed; border: 1px solid #fed7aa; border-top: none; padding: 8px 16px; font-size: 10px; color: #7c3aed; border-radius: 0 0 6px 6px; margin-bottom: 14px; }
    .meta span { color: #ea580c; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    thead th { background: #f97316; color: white; padding: 7px 8px; text-align: center; font-size: 10.5px; }
    thead th:first-child { text-align: left; width: 80px; }
    tbody tr:nth-child(even) { background: #f5f5f5; }
    tbody tr:nth-child(odd) { background: #ffffff; }
    tbody th { text-align: left; padding: 7px 8px; font-weight: bold; color: #f97316; width: 80px; border-right: 1px solid #e5e7eb; }
    tbody td { padding: 7px 8px; border-right: 1px solid #e5e7eb; vertical-align: top; }
    tbody td:last-child, tbody th:last-child { border-right: none; }
    tr { border-bottom: 1px solid #e5e7eb; }
    .notes { margin-top: 14px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 8px 12px; font-size: 10px; color: #7c3aed; }
    .footer { margin-top: 16px; font-size: 8.5px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 8px; }
    .ai-badge { display: inline-block; background: #f3e8ff; color: #7c3aed; border-radius: 4px; padding: 1px 6px; font-size: 9px; font-weight: bold; margin-left: 8px; }
    @media print {
      body { padding: 0; }
      @page { size: A4 landscape; margin: 12mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${plan.name}${plan.generatedByAI ? '<span class="ai-badge">✦ IA</span>' : ""}</h1>
    <span class="brand">BuddyOne · buddyoneapp.com</span>
  </div>
  <div class="meta">
    Semana del <span>${weekLabel}</span> &nbsp;·&nbsp; Tipo: <span>${typeLabel}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Día</th>
        ${MEALS.map((m) => `<th>${m.label}</th>`).join("")}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  ${plan.notes ? `<div class="notes"><strong>Notas:</strong> ${plan.notes}</div>` : ""}
  <div class="footer">
    Generado con BuddyOne · Este menú es orientativo y no sustituye el consejo de un profesional de la salud.
  </div>
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
