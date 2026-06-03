/**
 * patientReportPdf.ts
 * Generates a professional PDF report for a patient using Puppeteer.
 * Includes:
 *   - Header with BuddyOne branding and patient info
 *   - Weight evolution chart (SVG)
 *   - Weekly menu / diet table
 *   - Footer with disclaimer
 */

import puppeteer from "puppeteer";

export interface WeightRecord {
  recordedAt: Date | string;
  weightKg: number;
  notes?: string | null;
}

export interface PatientInfo {
  name: string;
  email?: string | null;
  heightCm?: number | null;
  initialWeightKg?: number | null;
  targetWeightKg?: number | null;
  objective?: string | null;
  allergies?: string | null;
  pathologies?: string | null;
  consultationFrequencyWeeks?: number | null;
}

export interface MenuDay {
  breakfast?: string;
  midMorning?: string;
  lunch?: string;
  snack?: string;
  dinner?: string;
}

export type WeeklyMenu = Record<string, MenuDay>; // key = day name

export interface GeneratePdfOptions {
  patient: PatientInfo;
  weightHistory: WeightRecord[];
  menuData: WeeklyMenu | any;
  weekLabel: string;
  expertName?: string;
  customMessage?: string;
}

// ─── SVG Weight Chart ────────────────────────────────────────────────────────

function buildWeightChartSvg(records: WeightRecord[]): string {
  if (!records || records.length < 2) {
    return `<div class="no-data">Sin suficientes registros de peso para mostrar la gráfica (mínimo 2 registros).</div>`;
  }

  const sorted = [...records].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const W = 680;
  const H = 200;
  const padL = 48;
  const padR = 20;
  const padT = 20;
  const padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const weights = sorted.map((r) => r.weightKg);
  const minW = Math.floor(Math.min(...weights) - 2);
  const maxW = Math.ceil(Math.max(...weights) + 2);
  const range = maxW - minW || 1;

  const toX = (i: number) => padL + (i / (sorted.length - 1)) * chartW;
  const toY = (w: number) => padT + chartH - ((w - minW) / range) * chartH;

  // Polyline points
  const points = sorted.map((r, i) => `${toX(i)},${toY(r.weightKg)}`).join(" ");
  // Area fill
  const areaPoints = [
    `${toX(0)},${padT + chartH}`,
    ...sorted.map((r, i) => `${toX(i)},${toY(r.weightKg)}`),
    `${toX(sorted.length - 1)},${padT + chartH}`,
  ].join(" ");

  // Y-axis labels (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => minW + (range / 4) * i);
  const yTicksSvg = yTicks
    .map(
      (v) =>
        `<text x="${padL - 6}" y="${toY(v) + 4}" text-anchor="end" font-size="10" fill="#6b7280">${v.toFixed(1)}</text>
         <line x1="${padL}" y1="${toY(v)}" x2="${W - padR}" y2="${toY(v)}" stroke="#e5e7eb" stroke-width="1" />`
    )
    .join("\n");

  // X-axis labels (max 7 labels)
  const step = Math.max(1, Math.floor(sorted.length / 7));
  const xLabelsSvg = sorted
    .filter((_, i) => i % step === 0 || i === sorted.length - 1)
    .map((r, _, arr) => {
      const origIdx = sorted.indexOf(r);
      const d = new Date(r.recordedAt);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      return `<text x="${toX(origIdx)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="#6b7280">${label}</text>`;
    })
    .join("\n");

  // Data point circles
  const dotsSvg = sorted
    .map(
      (r, i) =>
        `<circle cx="${toX(i)}" cy="${toY(r.weightKg)}" r="4" fill="#f97316" stroke="white" stroke-width="2" />`
    )
    .join("\n");

  return `
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f97316" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#f97316" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <!-- Grid -->
      ${yTicksSvg}
      <!-- Area -->
      <polygon points="${areaPoints}" fill="url(#areaGrad)" />
      <!-- Line -->
      <polyline points="${points}" fill="none" stroke="#f97316" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
      <!-- Dots -->
      ${dotsSvg}
      <!-- X labels -->
      ${xLabelsSvg}
      <!-- Y axis -->
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + chartH}" stroke="#d1d5db" stroke-width="1" />
    </svg>`;
}

// ─── Menu Table ──────────────────────────────────────────────────────────────

const DAYS_ES: Record<string, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
  lunes: "Lunes",
  martes: "Martes",
  miércoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sábado: "Sábado",
  domingo: "Domingo",
};

function buildMenuTableHtml(menuData: any): string {
  if (!menuData || typeof menuData !== "object") {
    return `<p class="no-data">No hay datos de menú disponibles.</p>`;
  }

  // Normalise: support {days: [...]} or {monday: {...}, ...} or {lunes: {...}, ...}
  let days: Array<{ name: string; meals: MenuDay }> = [];

  if (Array.isArray(menuData.days)) {
    days = menuData.days.map((d: any) => ({
      name: DAYS_ES[d.day?.toLowerCase()] ?? d.day ?? "Día",
      meals: {
        breakfast: d.breakfast ?? d.desayuno,
        midMorning: d.midMorning ?? d.mediaMañana ?? d.media_manana,
        lunch: d.lunch ?? d.comida ?? d.almuerzo,
        snack: d.snack ?? d.merienda,
        dinner: d.dinner ?? d.cena,
      },
    }));
  } else {
    for (const [key, val] of Object.entries(menuData)) {
      if (typeof val === "object" && val !== null) {
        const v = val as any;
        days.push({
          name: DAYS_ES[key.toLowerCase()] ?? key,
          meals: {
            breakfast: v.breakfast ?? v.desayuno,
            midMorning: v.midMorning ?? v.mediaMañana,
            lunch: v.lunch ?? v.comida ?? v.almuerzo,
            snack: v.snack ?? v.merienda,
            dinner: v.dinner ?? v.cena,
          },
        });
      }
    }
  }

  if (!days.length) {
    return `<p class="no-data">No se encontraron días en el menú.</p>`;
  }

  const mealLabels: Array<{ key: keyof MenuDay; label: string; emoji: string }> = [
    { key: "breakfast", label: "Desayuno", emoji: "🌅" },
    { key: "midMorning", label: "Media mañana", emoji: "🍎" },
    { key: "lunch", label: "Comida", emoji: "🍽️" },
    { key: "snack", label: "Merienda", emoji: "🥗" },
    { key: "dinner", label: "Cena", emoji: "🌙" },
  ];

  const headerCells = days.map((d) => `<th>${d.name}</th>`).join("");
  const rows = mealLabels
    .map(({ key, label, emoji }) => {
      const cells = days
        .map((d) => {
          const meal = d.meals[key];
          return `<td>${meal ? meal : '<span class="empty">—</span>'}</td>`;
        })
        .join("");
      return `<tr><td class="meal-label">${emoji} ${label}</td>${cells}</tr>`;
    })
    .join("");

  return `
    <table class="menu-table">
      <thead>
        <tr>
          <th class="meal-col">Comida</th>
          ${headerCells}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── Stats bar ───────────────────────────────────────────────────────────────

function buildStatsBar(patient: PatientInfo, weightHistory: WeightRecord[]): string {
  const sorted = [...weightHistory].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  );
  const currentWeight = sorted[0]?.weightKg ?? patient.initialWeightKg;
  const initialWeight = patient.initialWeightKg;
  const targetWeight = patient.targetWeightKg;

  const diff =
    currentWeight && initialWeight ? (currentWeight - initialWeight).toFixed(1) : null;
  const diffLabel =
    diff !== null
      ? `${parseFloat(diff) > 0 ? "+" : ""}${diff} kg desde inicio`
      : "Sin datos";
  const diffColor = diff !== null && parseFloat(diff) < 0 ? "#16a34a" : "#dc2626";

  const stats = [
    { label: "Peso actual", value: currentWeight ? `${currentWeight} kg` : "—" },
    { label: "Peso inicial", value: initialWeight ? `${initialWeight} kg` : "—" },
    { label: "Objetivo", value: targetWeight ? `${targetWeight} kg` : "—" },
    { label: "Variación", value: diffLabel, color: diffColor },
    { label: "Altura", value: patient.heightCm ? `${patient.heightCm} cm` : "—" },
    { label: "Registros", value: `${weightHistory.length}` },
  ];

  return stats
    .map(
      (s) =>
        `<div class="stat-card">
          <div class="stat-label">${s.label}</div>
          <div class="stat-value" style="${s.color ? `color:${s.color}` : ""}">${s.value}</div>
        </div>`
    )
    .join("");
}

// ─── Full HTML ────────────────────────────────────────────────────────────────

function buildReportHtml(opts: GeneratePdfOptions): string {
  const { patient, weightHistory, menuData, weekLabel, expertName, customMessage } = opts;

  const today = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const chartSvg = buildWeightChartSvg(weightHistory);
  const menuTable = buildMenuTableHtml(menuData);
  const statsBar = buildStatsBar(patient, weightHistory);

  const objectiveMap: Record<string, string> = {
    lose_weight: "Pérdida de peso",
    gain_muscle: "Ganancia muscular",
    maintain: "Mantenimiento",
    improve_health: "Mejorar salud",
    other: "Otro",
  };

  const objectiveLabel = patient.objective
    ? objectiveMap[patient.objective] ?? patient.objective
    : null;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Informe Nutricional — ${patient.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12px;
    color: #1f2937;
    background: #fff;
    line-height: 1.5;
  }

  /* ── Header ── */
  .header {
    background: linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%);
    color: white;
    padding: 24px 32px 20px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }
  .logo-area { display: flex; align-items: center; gap: 10px; }
  .logo-icon {
    width: 40px; height: 40px;
    background: rgba(255,255,255,0.2);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
  }
  .logo-text { font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
  .logo-sub { font-size: 10px; opacity: 0.85; margin-top: 1px; }
  .header-right { text-align: right; }
  .header-right .report-title { font-size: 16px; font-weight: 600; }
  .header-right .report-date { font-size: 10px; opacity: 0.85; margin-top: 3px; }

  /* ── Patient info band ── */
  .patient-band {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 14px 32px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .patient-avatar {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, #f97316, #ea580c);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 700; font-size: 16px;
    flex-shrink: 0;
  }
  .patient-name { font-size: 16px; font-weight: 700; color: #111827; }
  .patient-meta { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .patient-meta span { margin-right: 12px; }
  .week-badge {
    margin-left: auto;
    background: #fff7ed;
    border: 1px solid #fed7aa;
    color: #c2410c;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }

  /* ── Content ── */
  .content { padding: 24px 32px; }

  /* ── Section title ── */
  .section-title {
    font-size: 13px;
    font-weight: 700;
    color: #374151;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
    padding-bottom: 6px;
    border-bottom: 2px solid #f97316;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  /* ── Stats bar ── */
  .stats-bar {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    margin-bottom: 24px;
  }
  .stat-card {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 8px;
    text-align: center;
  }
  .stat-label { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .stat-value { font-size: 14px; font-weight: 700; color: #111827; }

  /* ── Chart section ── */
  .chart-section { margin-bottom: 28px; }
  .chart-wrapper {
    background: #fafafa;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    padding: 16px;
    overflow: hidden;
  }
  .chart-wrapper svg { display: block; width: 100%; }
  .no-data { color: #9ca3af; font-size: 11px; text-align: center; padding: 24px 0; }

  /* ── Menu table ── */
  .menu-section { margin-bottom: 24px; }
  .menu-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5px;
  }
  .menu-table th {
    background: #f97316;
    color: white;
    padding: 8px 6px;
    text-align: center;
    font-weight: 600;
    font-size: 11px;
  }
  .menu-table th.meal-col {
    background: #ea580c;
    text-align: left;
    width: 100px;
  }
  .menu-table td {
    padding: 7px 6px;
    border: 1px solid #e5e7eb;
    vertical-align: top;
    line-height: 1.4;
    text-align: center;
  }
  .menu-table td.meal-label {
    background: #fff7ed;
    font-weight: 600;
    color: #c2410c;
    text-align: left;
    white-space: nowrap;
    border-right: 2px solid #fed7aa;
  }
  .menu-table tr:nth-child(even) td:not(.meal-label) { background: #fafafa; }
  .menu-table .empty { color: #d1d5db; }

  /* ── Custom message ── */
  .message-box {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-left: 4px solid #f59e0b;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 24px;
    font-size: 11.5px;
    color: #78350f;
    line-height: 1.6;
  }
  .message-box strong { display: block; margin-bottom: 4px; color: #92400e; }

  /* ── Clinical notes ── */
  .clinical-notes {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 24px;
    font-size: 11px;
    color: #14532d;
  }
  .clinical-notes strong { display: block; margin-bottom: 6px; }
  .clinical-notes .note-item { margin-bottom: 3px; }
  .clinical-notes .note-label { font-weight: 600; }

  /* ── Footer ── */
  .footer {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    padding: 14px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 9.5px;
    color: #9ca3af;
  }
  .footer-disclaimer { max-width: 480px; line-height: 1.4; }
  .footer-brand { font-weight: 600; color: #f97316; }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="logo-area">
    <div class="logo-icon">🥗</div>
    <div>
      <div class="logo-text">BuddyOne</div>
      <div class="logo-sub">Nutrición inteligente</div>
    </div>
  </div>
  <div class="header-right">
    <div class="report-title">Informe Nutricional</div>
    <div class="report-date">Generado el ${today}${expertName ? ` · ${expertName}` : ""}</div>
  </div>
</div>

<!-- PATIENT BAND -->
<div class="patient-band">
  <div class="patient-avatar">${patient.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}</div>
  <div>
    <div class="patient-name">${patient.name}</div>
    <div class="patient-meta">
      ${patient.email ? `<span>✉ ${patient.email}</span>` : ""}
      ${objectiveLabel ? `<span>🎯 ${objectiveLabel}</span>` : ""}
      ${patient.consultationFrequencyWeeks ? `<span>📅 Revisión cada ${patient.consultationFrequencyWeeks} semana(s)</span>` : ""}
    </div>
  </div>
  <div class="week-badge">📅 ${weekLabel}</div>
</div>

<!-- CONTENT -->
<div class="content">

  <!-- STATS -->
  <div class="section-title">📊 Resumen de métricas</div>
  <div class="stats-bar">${statsBar}</div>

  ${
    customMessage
      ? `<div class="message-box"><strong>💬 Mensaje de tu nutricionista:</strong>${customMessage}</div>`
      : ""
  }

  ${
    patient.allergies || patient.pathologies
      ? `<div class="clinical-notes">
          <strong>📋 Notas clínicas relevantes</strong>
          ${patient.allergies ? `<div class="note-item"><span class="note-label">Alergias/intolerancias:</span> ${patient.allergies}</div>` : ""}
          ${patient.pathologies ? `<div class="note-item"><span class="note-label">Patologías:</span> ${patient.pathologies}</div>` : ""}
        </div>`
      : ""
  }

  <!-- WEIGHT CHART -->
  ${
    weightHistory.length > 0
      ? `<div class="chart-section">
          <div class="section-title">📈 Evolución del peso</div>
          <div class="chart-wrapper">${chartSvg}</div>
        </div>`
      : ""
  }

  <!-- MENU TABLE -->
  <div class="menu-section">
    <div class="section-title">🍽️ Plan alimentario — ${weekLabel}</div>
    ${menuTable}
  </div>

</div>

<!-- FOOTER -->
<div class="footer">
  <div class="footer-disclaimer">
    Este informe ha sido generado con <span class="footer-brand">BuddyOne</span> y es de carácter orientativo.
    No sustituye el criterio clínico del profesional de la salud. Consulta siempre a tu nutricionista antes de realizar cambios en tu dieta.
  </div>
  <div>buddyoneapp.com</div>
</div>

</body>
</html>`;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function generatePatientReportPdf(opts: GeneratePdfOptions): Promise<Buffer> {
  const html = buildReportHtml(opts);

  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
