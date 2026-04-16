import { jsPDF } from "jspdf";

interface ProgressRecord {
  weight?: number | null;
  bodyFat?: number | null;
  muscleMass?: number | null;
  recordedAt: Date | string;
}

interface SessionNote {
  sessionDate: string;
  summary?: string | null;
  agreements?: string | null;
  nextObjectives?: string | null;
  patientWeight?: number | null;
  adherenceScore?: number | null;
}

interface PatientInfo {
  name: string;
  email?: string | null;
  expertName?: string;
  objective?: string | null;
  startDate?: Date | string | null;
}

interface PDFReportData {
  patient: PatientInfo;
  progressRecords: ProgressRecord[];
  sessionNotes: SessionNote[];
  weeklyCheckins?: Array<{
    weekStart: string;
    weight?: number | null;
    energyLevel?: number | null;
    adherenceScore?: number | null;
    mood?: number | null;
    difficulties?: string | null;
  }>;
}

export function generatePatientPDF(data: PDFReportData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ─── Helper functions ────────────────────────────────────────────────────
  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkPageBreak = (needed: number) => {
    if (y + needed > 275) addPage();
  };

  const drawRect = (x: number, yPos: number, w: number, h: number, r: number, fillColor: string) => {
    doc.setFillColor(fillColor);
    doc.roundedRect(x, yPos, w, h, r, r, "F");
  };

  const text = (str: string, x: number, yPos: number, opts?: { align?: "left" | "center" | "right"; maxWidth?: number }) => {
    doc.text(str, x, yPos, opts as any);
  };

  // ─── HEADER ─────────────────────────────────────────────────────────────
  drawRect(0, 0, pageW, 42, 0, "#F97316");
  doc.setTextColor("#FFFFFF");
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  text("BuddyMarket", margin, 18);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  text("Informe de Progreso del Paciente", margin, 27);
  doc.setFontSize(9);
  text(`Generado el ${new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}`, margin, 36);

  y = 52;
  doc.setTextColor("#1F2937");

  // ─── DATOS DEL PACIENTE ──────────────────────────────────────────────────
  drawRect(margin, y, contentW, 32, 3, "#FFF7ED");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor("#EA580C");
  text("Datos del Paciente", margin + 5, y + 9);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#374151");
  text(`Paciente: ${data.patient.name}`, margin + 5, y + 18);
  if (data.patient.expertName) {
    text(`Nutricionista: ${data.patient.expertName}`, margin + 5, y + 25);
  }
  if (data.patient.objective) {
    const objText = `Objetivo: ${data.patient.objective}`;
    const lines = doc.splitTextToSize(objText, contentW - 10);
    text(lines[0], margin + 100, y + 18);
  }

  y += 40;

  // ─── EVOLUCIÓN DEL PESO ──────────────────────────────────────────────────
  if (data.progressRecords.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#EA580C");
    text("📈 Evolución del Peso", margin, y);
    y += 7;

    // Tabla de registros
    const headers = ["Fecha", "Peso (kg)", "% Grasa", "Masa Muscular"];
    const colWidths = [45, 35, 35, 40];
    const tableX = margin;

    // Header row
    drawRect(tableX, y, contentW, 8, 1, "#F97316");
    doc.setTextColor("#FFFFFF");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    let cx = tableX + 3;
    headers.forEach((h, i) => {
      text(h, cx, y + 5.5);
      cx += colWidths[i];
    });
    y += 8;

    // Data rows
    const recent = data.progressRecords.slice(0, 10);
    recent.forEach((r, idx) => {
      checkPageBreak(8);
      const bg = idx % 2 === 0 ? "#FFFFFF" : "#FFF7ED";
      drawRect(tableX, y, contentW, 7, 0, bg);
      doc.setTextColor("#374151");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      cx = tableX + 3;
      const rowData = [
        new Date(r.recordedAt).toLocaleDateString("es-ES"),
        r.weight ? `${r.weight} kg` : "-",
        r.bodyFat ? `${r.bodyFat}%` : "-",
        r.muscleMass ? `${r.muscleMass} kg` : "-",
      ];
      rowData.forEach((d, i) => {
        text(d, cx, y + 5);
        cx += colWidths[i];
      });
      y += 7;
    });

    // Resumen estadístico
    if (data.progressRecords.length >= 2) {
      const weights = data.progressRecords.filter(r => r.weight).map(r => r.weight as number);
      if (weights.length >= 2) {
        const firstW = weights[weights.length - 1];
        const lastW = weights[0];
        const diff = lastW - firstW;
        const diffText = diff < 0 ? `${diff.toFixed(1)} kg (pérdida)` : `+${diff.toFixed(1)} kg (ganancia)`;
        y += 4;
        checkPageBreak(10);
        drawRect(margin, y, contentW, 9, 2, "#ECFDF5");
        doc.setTextColor("#065F46");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        text(`Variación total de peso: ${diffText}  |  Peso inicial: ${firstW} kg  |  Peso actual: ${lastW} kg`, margin + 4, y + 6);
        y += 13;
      }
    }
    y += 6;
  }

  // ─── HISTORIAL DE SESIONES ───────────────────────────────────────────────
  if (data.sessionNotes.length > 0) {
    checkPageBreak(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#EA580C");
    text("📋 Historial de Sesiones", margin, y);
    y += 8;

    data.sessionNotes.slice(0, 8).forEach((session) => {
      const blockH = 28 + (session.agreements ? 8 : 0) + (session.nextObjectives ? 8 : 0);
      checkPageBreak(blockH + 4);

      drawRect(margin, y, contentW, blockH, 2, "#F9FAFB");
      doc.setFillColor("#F97316");
      doc.roundedRect(margin, y, 3, blockH, 1, 1, "F");

      doc.setTextColor("#374151");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      text(new Date(session.sessionDate + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }), margin + 7, y + 7);

      if (session.patientWeight) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor("#6B7280");
        text(`Peso: ${session.patientWeight} kg`, margin + 7, y + 14);
      }
      if (session.adherenceScore) {
        doc.setTextColor("#6B7280");
        text(`Adherencia: ${session.adherenceScore}/10`, margin + 60, y + 14);
      }

      let lineY = y + 20;
      if (session.summary) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor("#374151");
        const summaryLines = doc.splitTextToSize(`Resumen: ${session.summary}`, contentW - 12);
        text(summaryLines[0], margin + 7, lineY);
        lineY += 6;
      }
      if (session.agreements) {
        doc.setFontSize(8.5);
        doc.setTextColor("#374151");
        const lines = doc.splitTextToSize(`Acuerdos: ${session.agreements}`, contentW - 12);
        text(lines[0], margin + 7, lineY);
        lineY += 6;
      }
      if (session.nextObjectives) {
        doc.setFontSize(8.5);
        doc.setTextColor("#374151");
        const lines = doc.splitTextToSize(`Próximos objetivos: ${session.nextObjectives}`, contentW - 12);
        text(lines[0], margin + 7, lineY);
      }

      y += blockH + 4;
    });
    y += 4;
  }

  // ─── CHECK-INS SEMANALES ─────────────────────────────────────────────────
  if (data.weeklyCheckins && data.weeklyCheckins.length > 0) {
    checkPageBreak(20);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor("#EA580C");
    text("✅ Check-ins Semanales (últimas 8 semanas)", margin, y);
    y += 7;

    const headers2 = ["Semana", "Peso", "Energía", "Adherencia", "Ánimo"];
    const colW2 = [50, 25, 25, 30, 25];
    drawRect(margin, y, contentW, 8, 1, "#F97316");
    doc.setTextColor("#FFFFFF");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    let cx2 = margin + 3;
    headers2.forEach((h, i) => {
      text(h, cx2, y + 5.5);
      cx2 += colW2[i];
    });
    y += 8;

    data.weeklyCheckins.slice(0, 8).forEach((ci, idx) => {
      checkPageBreak(7);
      const bg = idx % 2 === 0 ? "#FFFFFF" : "#FFF7ED";
      drawRect(margin, y, contentW, 7, 0, bg);
      doc.setTextColor("#374151");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      cx2 = margin + 3;
      const rowData2 = [
        new Date(ci.weekStart + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        ci.weight ? `${ci.weight} kg` : "-",
        ci.energyLevel ? `${ci.energyLevel}/10` : "-",
        ci.adherenceScore ? `${ci.adherenceScore}/10` : "-",
        ci.mood ? `${ci.mood}/10` : "-",
      ];
      rowData2.forEach((d, i) => {
        text(d, cx2, y + 5);
        cx2 += colW2[i];
      });
      y += 7;
    });
    y += 8;
  }

  // ─── FOOTER ──────────────────────────────────────────────────────────────
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor("#9CA3AF");
    doc.setFont("helvetica", "normal");
    text(`BuddyMarket — Informe de Progreso — ${data.patient.name}`, margin, 292);
    text(`Página ${i} de ${totalPages}`, pageW - margin, 292, { align: "right" });
    doc.setDrawColor("#E5E7EB");
    doc.line(margin, 288, pageW - margin, 288);
  }

  // Descargar
  const fileName = `informe-${data.patient.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}
