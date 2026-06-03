import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { useLocation } from "wouter";
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, Download, Sparkles } from "lucide-react";

// ─── CSV parser (client-side, no deps) ────────────────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
    return row;
  });
  return { headers, rows };
}

// Standard field labels
const FIELD_LABELS: Record<string, string> = {
  name: "Nombre *",
  email: "Email",
  phone: "Teléfono",
  birthDate: "Fecha nacimiento (YYYY-MM-DD)",
  gender: "Sexo (male/female/other)",
  heightCm: "Altura (cm)",
  initialWeightKg: "Peso inicial (kg)",
  targetWeightKg: "Peso objetivo (kg)",
  activityLevel: "Nivel actividad",
  objective: "Objetivo",
  allergies: "Alergias",
  pathologies: "Patologías",
  medications: "Medicación",
  notes: "Notas",
  consultationFrequencyWeeks: "Frecuencia consulta (semanas)",
};

const STANDARD_FIELDS = Object.keys(FIELD_LABELS);

// ─── Template download ─────────────────────────────────────────────────────────
function downloadTemplate() {
  const headers = STANDARD_FIELDS.join(",");
  const example = "María García,maria@email.com,+34 600 123 456,1985-03-15,female,165,78,65,moderate,perdida_peso,gluten,hipertensión,metformina,Consulta cada 2 semanas,2";
  const csv = headers + "\n" + example;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_pacientes_buddyone.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function PatientImport() {
  const [, nav] = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "done">("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isMappingAI, setIsMappingAI] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null);

  const suggestMapping = trpc.offlinePatients.suggestColumnMapping.useMutation({
    onSuccess: (data) => { setMapping(data); setIsMappingAI(false); setStep("mapping"); },
    onError: () => { setIsMappingAI(false); setStep("mapping"); },
  });

  const bulkImport = trpc.offlinePatients.bulkImport.useMutation({
    onSuccess: (data) => { setImportResult({ imported: data.imported }); setStep("done"); },
    onError: (e) => toast.error("Error al importar: " + e.message),
  });

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (!headers.length) { toast.error("No se pudo leer el archivo. Asegúrate de que es un CSV válido."); return; }
      setCsvHeaders(headers);
      setCsvRows(rows);
      // Auto-suggest mapping via AI
      setIsMappingAI(true);
      const sampleRow: Record<string, string> = {};
      headers.forEach((h) => { sampleRow[h] = rows[0]?.[h] ?? ""; });
      suggestMapping.mutate({ headers, sampleRow });
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  // Build patients from mapping
  function buildPatients() {
    return csvRows.map((row) => {
      const p: any = {};
      Object.entries(mapping).forEach(([csvCol, stdField]) => {
        if (!stdField || !STANDARD_FIELDS.includes(stdField)) return;
        const val = row[csvCol]?.trim();
        if (!val) return;
        if (["heightCm", "consultationFrequencyWeeks"].includes(stdField)) p[stdField] = parseInt(val) || undefined;
        else if (["initialWeightKg", "targetWeightKg"].includes(stdField)) p[stdField] = parseFloat(val) || undefined;
        else p[stdField] = val;
      });
      return p;
    }).filter((p) => p.name);
  }

  const patients = step === "preview" || step === "done" ? buildPatients() : [];

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => nav("/app/expert/patients")} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft size={18} className="text-muted-foreground" />
          </button>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "linear-gradient(135deg,#F97316,#FB923C)" }}>
            📥
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">Importar pacientes</h1>
            <p className="text-xs text-muted-foreground">Sube tu archivo CSV y la IA mapeará los campos automáticamente</p>
          </div>
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-8">
          {(["upload", "mapping", "preview", "done"] as const).map((s, i) => {
            const labels = ["Subir archivo", "Mapear campos", "Previsualizar", "Importado"];
            const active = step === s;
            const done = ["upload", "mapping", "preview", "done"].indexOf(step) > i;
            return (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${done ? "bg-green-500 text-white" : active ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {done ? "✓" : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}>{labels[i]}</span>
                {i < 3 && <div className="flex-1 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-2xl p-12 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/30 transition-colors"
            >
              <Upload size={40} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-base font-bold text-foreground mb-1">Arrastra tu archivo CSV aquí</p>
              <p className="text-sm text-muted-foreground mb-4">o haz clic para seleccionarlo</p>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white text-sm font-bold">
                <Upload size={14} /> Seleccionar archivo
              </span>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {isMappingAI && (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50 border border-orange-200">
                <div className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-orange-800">Analizando columnas con IA...</p>
                  <p className="text-xs text-orange-600">Detectando automáticamente los campos de tu archivo</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/40 border border-border">
              <FileText size={20} className="text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">¿No tienes un CSV?</p>
                <p className="text-xs text-muted-foreground">Descarga nuestra plantilla con todos los campos disponibles</p>
              </div>
              <button onClick={downloadTemplate} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
                <Download size={14} /> Plantilla
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-sm font-bold text-blue-800 mb-2">📋 Campos soportados</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(FIELD_LABELS).map(([k, v]) => (
                  <span key={k} className="text-xs text-blue-700">• {v}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Column mapping */}
        {step === "mapping" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-orange-50 border border-orange-200">
              <Sparkles size={16} className="text-orange-500" />
              <p className="text-sm text-orange-800">La IA ha sugerido el mapeo automáticamente. Revisa y ajusta si es necesario.</p>
            </div>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="grid grid-cols-2 gap-0 p-3 bg-muted/40 border-b border-border">
                <span className="text-xs font-bold text-muted-foreground">Columna de tu archivo</span>
                <span className="text-xs font-bold text-muted-foreground">Campo BuddyOne</span>
              </div>
              <div className="divide-y divide-border">
                {csvHeaders.map((header) => (
                  <div key={header} className="grid grid-cols-2 gap-4 p-3 items-center">
                    <span className="text-sm font-medium text-foreground truncate">{header}</span>
                    <select
                      value={mapping[header] ?? ""}
                      onChange={(e) => setMapping((prev) => ({ ...prev, [header]: e.target.value }))}
                      className="text-sm rounded-lg border border-border px-2 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      <option value="">— Ignorar —</option>
                      {STANDARD_FIELDS.map((f) => (
                        <option key={f} value={f}>{FIELD_LABELS[f]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("upload")} className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">Volver</button>
              <button
                onClick={() => {
                  if (!Object.values(mapping).includes("name")) { toast.error("Debes mapear al menos el campo Nombre"); return; }
                  setStep("preview");
                }}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors"
              >
                Previsualizar ({csvRows.length} pacientes)
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle size={16} className="text-green-600" />
              <p className="text-sm text-green-800">Se importarán <strong>{patients.length} pacientes</strong>. Revisa los datos antes de confirmar.</p>
            </div>
            <div className="bg-card rounded-2xl border border-border overflow-hidden max-h-96 overflow-y-auto">
              {patients.slice(0, 50).map((p, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border-b border-border last:border-0">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">
                    {(p.name ?? "?")[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{[p.email, p.phone, p.objective].filter(Boolean).join(" · ")}</p>
                  </div>
                  {p.initialWeightKg && <span className="text-xs text-muted-foreground flex-shrink-0">{p.initialWeightKg} kg</span>}
                </div>
              ))}
              {patients.length > 50 && (
                <div className="p-3 text-center text-xs text-muted-foreground">... y {patients.length - 50} más</div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("mapping")} className="flex-1 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors">Volver</button>
              <button
                onClick={() => bulkImport.mutate({ patients })}
                disabled={bulkImport.isPending}
                className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {bulkImport.isPending ? "Importando..." : `Importar ${patients.length} pacientes`}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Done */}
        {step === "done" && importResult && (
          <div className="text-center space-y-6 py-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle size={40} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground mb-2">¡Importación completada!</h2>
              <p className="text-muted-foreground">Se han importado <strong>{importResult.imported} pacientes</strong> correctamente.</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setStep("upload"); setCsvHeaders([]); setCsvRows([]); setMapping({}); setImportResult(null); }}
                className="px-6 py-3 rounded-xl border border-border font-semibold text-sm hover:bg-muted transition-colors"
              >
                Importar más
              </button>
              <button
                onClick={() => nav("/app/expert/patients")}
                className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-colors"
              >
                Ver mis pacientes
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
