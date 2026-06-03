import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, FileText, Activity, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface BloodValue {
  name: string;
  value: number;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  status: "normal" | "bajo" | "alto" | "critico";
  interpretation?: string;
}

interface Recommendation {
  priority: "alta" | "media" | "baja";
  category: string;
  recommendation: string;
  foods?: string[];
}

interface BloodAnalysis {
  extractedValues: BloodValue[];
  overallScore: number;
  overallStatus: "bueno" | "regular" | "atención" | "urgente";
  keyFindings: string[];
  nutritionalDeficiencies: string[];
  recommendations: Recommendation[];
  menuAdjustments: { mealTime: string; suggestion: string }[];
}

interface ManualValue {
  name: string;
  value: string;
  unit: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  normal: { color: "text-green-600 bg-green-50 border-green-200", icon: <CheckCircle className="w-4 h-4 text-green-500" />, label: "Normal" },
  bajo: { color: "text-blue-600 bg-blue-50 border-blue-200", icon: <ChevronDown className="w-4 h-4 text-blue-500" />, label: "Bajo" },
  alto: { color: "text-amber-600 bg-amber-50 border-amber-200", icon: <ChevronUp className="w-4 h-4 text-amber-500" />, label: "Alto" },
  critico: { color: "text-red-600 bg-red-50 border-red-200", icon: <XCircle className="w-4 h-4 text-red-500" />, label: "Crítico" },
};

const PRIORITY_COLORS: Record<string, string> = {
  alta: "bg-red-100 text-red-700 border-red-200",
  media: "bg-amber-100 text-amber-700 border-amber-200",
  baja: "bg-green-100 text-green-700 border-green-200",
};

const SCORE_COLOR = (score: number) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
};

export default function BloodTestAnalysis() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("application/pdf");
  const [fileName, setFileName] = useState<string | null>(null);
  const [testDate, setTestDate] = useState("");
  const [labName, setLabName] = useState("");
  const [bloodTestId, setBloodTestId] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<BloodAnalysis | null>(null);
  const [manualValues, setManualValues] = useState<ManualValue[]>([]);
  const [useManual, setUseManual] = useState(false);
  const [step, setStep] = useState<"upload" | "analyze" | "results">("upload");
  const [expandedSection, setExpandedSection] = useState<string | null>("findings");

  const { data: history } = trpc.health.history.useQuery();

  const uploadMutation = trpc.health.uploadBloodTest.useMutation({
    onSuccess: (data) => {
      setBloodTestId(data.id);
      setStep("analyze");
      toast.success("Analítica subida correctamente");
    },
    onError: (e) => toast.error(`Error al subir: ${e.message}`),
  });

  const analyzeMutation = trpc.health.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysis(data as BloodAnalysis);
      setStep("results");
      toast.success("¡Análisis completado!");
    },
    onError: (e) => toast.error(`Error al analizar: ${e.message}`),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) { toast.error("El archivo no puede superar 16 MB"); return; }
    setFileName(file.name);
    setMimeType(file.type || "application/pdf");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setFileBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!fileBase64) return;
    uploadMutation.mutate({ fileBase64, mimeType, testDate: testDate || undefined, labName: labName || undefined });
  };

  const handleAnalyze = () => {
    if (!bloodTestId) return;
    const manualJson = useManual && manualValues.length > 0
      ? JSON.stringify(manualValues.filter(v => v.name && v.value))
      : undefined;
    analyzeMutation.mutate({ bloodTestId, manualValuesJson: manualJson });
  };

  const handleManualOnly = () => {
    // Create a placeholder record and analyze with manual values
    if (manualValues.filter(v => v.name && v.value).length === 0) {
      toast.error("Añade al menos un valor manualmente");
      return;
    }
    setUseManual(true);
    // Upload a dummy record first
    uploadMutation.mutate({ fileBase64: btoa("manual"), mimeType: "text/plain", testDate: testDate || undefined, labName: labName || undefined });
  };

  const addManualValue = () => setManualValues(prev => [...prev, { name: "", value: "", unit: "" }]);
  const removeManualValue = (idx: number) => setManualValues(prev => prev.filter((_, i) => i !== idx));
  const updateManualValue = (idx: number, field: keyof ManualValue, value: string) => {
    setManualValues(prev => prev.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const resetAll = () => {
    setFileBase64(null); setFileName(null); setBloodTestId(null);
    setAnalysis(null); setManualValues([]); setUseManual(false);
    setStep("upload"); setTestDate(""); setLabName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleSection = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-24">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Analítica de sangre
            </h1>
            <p className="text-sm text-muted-foreground">IA interpreta tus valores y ajusta tu nutrición</p>
          </div>
          {step !== "upload" && (
            <Button variant="outline" size="sm" onClick={resetAll}>Nueva analítica</Button>
          )}
        </div>
        {/* Steps */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {(["upload", "analyze", "results"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? "bg-blue-500 text-white" : (["upload", "analyze", "results"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-gray-200 text-muted-foreground")}`}>
                {i + 1}
              </div>
              <span className={`text-xs ${step === s ? "text-blue-600 font-medium" : "text-muted-foreground/70"}`}>
                {s === "upload" ? "Subir" : s === "analyze" ? "Confirmar" : "Resultados"}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Sube tu analítica</CardTitle>
                <p className="text-sm text-muted-foreground">PDF o imagen de tu analítica de sangre</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  className="border-2 border-dashed border-blue-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {fileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div className="text-left">
                        <p className="font-medium text-foreground text-sm">{fileName}</p>
                        <p className="text-xs text-muted-foreground">Toca para cambiar</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-10 h-10 text-blue-400 mx-auto" />
                      <p className="font-medium text-foreground/80">Sube tu analítica</p>
                      <p className="text-xs text-muted-foreground/70">PDF, JPG, PNG — máx. 16 MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFileChange} />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Fecha del análisis</Label>
                    <Input type="date" value={testDate} onChange={e => setTestDate(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Laboratorio (opcional)</Label>
                    <Input placeholder="Ej: Synlab" value={labName} onChange={e => setLabName(e.target.value)} className="mt-1" />
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600"
                  onClick={handleUpload}
                  disabled={!fileBase64 || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subiendo...</> : <><Upload className="w-4 h-4 mr-2" /> Subir analítica</>}
                </Button>
              </CardContent>
            </Card>

            {/* Manual entry alternative */}
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-foreground/80 mb-3">¿No tienes el PDF? Introduce los valores manualmente</p>
                <div className="space-y-2">
                  {manualValues.map((v, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input placeholder="Parámetro (ej: Glucosa)" value={v.name} onChange={e => updateManualValue(idx, "name", e.target.value)} className="flex-1 text-sm" />
                      <Input placeholder="Valor" value={v.value} onChange={e => updateManualValue(idx, "value", e.target.value)} className="w-20 text-sm" />
                      <Input placeholder="Unidad" value={v.unit} onChange={e => updateManualValue(idx, "unit", e.target.value)} className="w-20 text-sm" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/70" onClick={() => removeManualValue(idx)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addManualValue}><Plus className="w-3 h-3 mr-1" /> Añadir valor</Button>
                </div>
                {manualValues.length > 0 && (
                  <Button className="w-full mt-3 bg-indigo-500 hover:bg-indigo-600" onClick={handleManualOnly} disabled={uploadMutation.isPending}>
                    {uploadMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
                    Analizar con valores manuales
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* History */}
            {history && history.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Analíticas anteriores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {history.slice(0, 3).map((h: { id: number; testDate?: string | null; labName?: string | null; analysisJson?: string | null }) => {
                    const a = h.analysisJson ? JSON.parse(h.analysisJson as string) as BloodAnalysis : null;
                    return (
                      <div key={h.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{h.testDate ? new Date(h.testDate).toLocaleDateString("es-ES") : "Sin fecha"}</p>
                          <p className="text-xs text-muted-foreground">{h.labName ?? "Laboratorio no especificado"}</p>
                        </div>
                        {a?.overallScore && (
                          <span className={`text-lg font-bold ${SCORE_COLOR(a.overallScore)}`}>{a.overallScore}/100</span>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* STEP 2: Confirm & analyze */}
        {step === "analyze" && (
          <Card>
            <CardContent className="pt-6 space-y-4 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Analítica lista para analizar</h2>
                <p className="text-sm text-muted-foreground mt-1">La IA leerá tus valores y generará recomendaciones nutricionales personalizadas</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-left space-y-1">
                <p className="text-xs text-blue-700 font-medium">¿Qué analizará la IA?</p>
                <ul className="text-xs text-blue-600 space-y-0.5">
                  <li>• Glucosa, colesterol, triglicéridos, hemoglobina</li>
                  <li>• Vitaminas (D, B12, ácido fólico) y minerales (hierro, zinc)</li>
                  <li>• Función hepática y renal</li>
                  <li>• Marcadores inflamatorios</li>
                  <li>• Ajustes nutricionales específicos para tus valores</li>
                </ul>
              </div>
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando (puede tardar 30s)...</>
                  : <><Activity className="w-4 h-4 mr-2" /> Analizar con IA</>
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Results */}
        {step === "results" && analysis && (
          <div className="space-y-4">
            {/* Overall score */}
            <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">Puntuación de salud</p>
                    <p className="text-5xl font-black mt-1">{analysis.overallScore}<span className="text-2xl">/100</span></p>
                    <Badge className="mt-2 bg-card/20 text-white border-white/30 capitalize">{analysis.overallStatus}</Badge>
                  </div>
                  <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center">
                    <Activity className="w-10 h-10 text-white/80" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key findings */}
            {analysis.keyFindings?.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <button className="w-full flex items-center justify-between" onClick={() => toggleSection("findings")}>
                    <span className="font-semibold text-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Hallazgos clave</span>
                    {expandedSection === "findings" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === "findings" && (
                    <ul className="mt-3 space-y-2">
                      {analysis.keyFindings.map((f, i) => (
                        <li key={i} className="flex gap-2 text-sm text-foreground/80">
                          <span className="text-amber-500 mt-0.5">•</span>{f}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Deficiencies */}
            {analysis.nutritionalDeficiencies?.length > 0 && (
              <Card className="border-red-100">
                <CardContent className="pt-4">
                  <p className="font-semibold text-foreground flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-red-500" /> Deficiencias nutricionales detectadas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {analysis.nutritionalDeficiencies.map((d, i) => (
                      <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-full">{d}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blood values */}
            {analysis.extractedValues?.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <button className="w-full flex items-center justify-between mb-3" onClick={() => toggleSection("values")}>
                    <span className="font-semibold text-foreground">Valores extraídos ({analysis.extractedValues.length})</span>
                    {expandedSection === "values" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === "values" && (
                    <div className="space-y-2">
                      {analysis.extractedValues.map((v, i) => {
                        const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.normal;
                        return (
                          <div key={i} className={`flex items-center justify-between p-2 rounded-lg border ${cfg.color}`}>
                            <div className="flex items-center gap-2">
                              {cfg.icon}
                              <div>
                                <p className="text-sm font-medium">{v.name}</p>
                                {v.interpretation && <p className="text-xs opacity-75">{v.interpretation}</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">{v.value} {v.unit}</p>
                              {v.referenceMin != null && v.referenceMax != null && (
                                <p className="text-xs opacity-60">{v.referenceMin}–{v.referenceMax}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <Card>
                <CardContent className="pt-4">
                  <button className="w-full flex items-center justify-between mb-3" onClick={() => toggleSection("recs")}>
                    <span className="font-semibold text-foreground flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Recomendaciones</span>
                    {expandedSection === "recs" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {expandedSection === "recs" && (
                    <div className="space-y-3">
                      {analysis.recommendations.map((r, i) => (
                        <div key={i} className={`p-3 rounded-lg border ${PRIORITY_COLORS[r.priority] ?? PRIORITY_COLORS.baja}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-xs ${PRIORITY_COLORS[r.priority]}`}>{r.priority}</Badge>
                            <span className="text-xs font-medium capitalize">{r.category}</span>
                          </div>
                          <p className="text-sm">{r.recommendation}</p>
                          {r.foods && r.foods.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {r.foods.map((f, j) => (
                                <span key={j} className="text-xs bg-card/60 px-2 py-0.5 rounded-full">{f}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Menu adjustments */}
            {analysis.menuAdjustments?.length > 0 && (
              <Card className="border-indigo-100 bg-indigo-50">
                <CardContent className="pt-4">
                  <p className="font-semibold text-indigo-900 mb-3">Ajustes en tu menú diario</p>
                  <div className="space-y-2">
                    {analysis.menuAdjustments.map((adj, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-indigo-500 font-medium capitalize w-24 flex-shrink-0">{adj.mealTime}:</span>
                        <span className="text-indigo-800">{adj.suggestion}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <p className="text-xs text-center text-muted-foreground/70 px-4">
              Este análisis es orientativo y no sustituye la consulta médica profesional. Consulta siempre con tu médico o dietista.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
