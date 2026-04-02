import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Scale, TrendingDown, TrendingUp, Minus, Plus, Trash2, ChevronDown, ChevronUp, Ruler, Activity, Zap } from "lucide-react";

const TODAY = new Date().toISOString().split("T")[0];

interface MetricForm {
  date: string;
  weight: string;
  bodyFat: string;
  muscleMass: string;
  bmi: string;
  waist: string;
  hip: string;
  chest: string;
  arm: string;
  thigh: string;
  calf: string;
  neck: string;
  visceralFat: string;
  boneMass: string;
  waterPercentage: string;
  metabolicAge: string;
  basalMetabolism: string;
  notes: string;
}

const EMPTY_FORM: MetricForm = {
  date: TODAY,
  weight: "", bodyFat: "", muscleMass: "", bmi: "",
  waist: "", hip: "", chest: "", arm: "", thigh: "", calf: "", neck: "",
  visceralFat: "", boneMass: "", waterPercentage: "",
  metabolicAge: "", basalMetabolism: "", notes: "",
};

function parseFl(v: string) {
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
}

function bmiCategory(bmi: number) {
  if (bmi < 18.5) return { label: "Bajo peso", color: "text-blue-500" };
  if (bmi < 25) return { label: "Normal", color: "text-green-500" };
  if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-500" };
  return { label: "Obesidad", color: "text-red-500" };
}

function calcBmi(weight: number, heightCm: number) {
  const h = heightCm / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

// Metric type presets
const METRIC_TYPES = [
  { id: "basic", label: "Peso", emoji: "⚖️", desc: "Solo peso y talla", icon: Scale },
  { id: "composition", label: "Composición", emoji: "💪", desc: "Grasa y músculo", icon: Activity },
  { id: "measures", label: "Medidas", emoji: "📏", desc: "Circunferencias", icon: Ruler },
  { id: "smart", label: "Báscula IA", emoji: "⚡", desc: "Todos los datos", icon: Zap },
] as const;
type MetricType = typeof METRIC_TYPES[number]["id"];

export default function Metrics() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState<MetricForm>(EMPTY_FORM);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [metricType, setMetricType] = useState<MetricType>("basic");
  const [activeChart, setActiveChart] = useState<"weight" | "bodyFat" | "muscleMass" | "waist">("weight");

  const metricsQuery = trpc.metrics.getAll.useQuery(undefined, { enabled: !!user });
  const latestQuery = trpc.metrics.getLatest.useQuery(undefined, { enabled: !!user });
  const profileQuery = trpc.profile.get.useQuery(undefined, { enabled: !!user });

  const utils = trpc.useUtils();

  const addMutation = trpc.metrics.add.useMutation({
    onSuccess: () => {
      toast.success("✅ Métricas guardadas");
      utils.metrics.getAll.invalidate();
      utils.metrics.getLatest.invalidate();
      setForm({ ...EMPTY_FORM, date: form.date });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.metrics.delete.useMutation({
    onSuccess: () => {
      toast.success("Registro eliminado");
      utils.metrics.getAll.invalidate();
      utils.metrics.getLatest.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let bmiVal = parseFl(form.bmi);
    // Auto-calculate BMI if weight and height available
    if (!bmiVal && form.weight && profileQuery.data?.profile?.height) {
      bmiVal = calcBmi(parseFloat(form.weight), profileQuery.data.profile.height);
    }
    addMutation.mutate({
      date: form.date,
      weight: parseFl(form.weight),
      bodyFat: parseFl(form.bodyFat),
      muscleMass: parseFl(form.muscleMass),
      bmi: bmiVal,
      waist: parseFl(form.waist),
      hip: parseFl(form.hip),
      chest: parseFl(form.chest),
      arm: parseFl(form.arm),
      thigh: parseFl(form.thigh),
      calf: parseFl(form.calf),
      neck: parseFl(form.neck),
      visceralFat: parseFl(form.visceralFat),
      boneMass: parseFl(form.boneMass),
      waterPercentage: parseFl(form.waterPercentage),
      metabolicAge: parseFl(form.metabolicAge),
      basalMetabolism: parseFl(form.basalMetabolism),
      notes: form.notes || undefined,
    });
  };

  const f = (field: keyof MetricForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  // Chart data: last 30 entries sorted ascending
  const chartData = useMemo(() => {
    if (!metricsQuery.data) return [];
    return [...metricsQuery.data]
      .sort((a, b) => String(a.date) < String(b.date) ? -1 : 1)
      .slice(-30)
      .map(m => ({
        date: String(m.date).slice(5), // MM-DD
        weight: m.weight,
        bodyFat: m.bodyFat,
        muscleMass: m.muscleMass,
        waist: m.waist,
      }));
  }, [metricsQuery.data]);

  const latest = latestQuery.data;
  const prev = metricsQuery.data?.[1]; // second most recent

  function trend(curr?: number | null, prev?: number | null) {
    if (!curr || !prev) return null;
    const diff = curr - prev;
    if (Math.abs(diff) < 0.1) return <Minus className="w-4 h-4 text-gray-400" />;
    if (diff < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <TrendingUp className="w-4 h-4 text-red-400" />;
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!user) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <Scale className="w-12 h-12 text-muted-foreground" />
      <p className="text-muted-foreground">Inicia sesión para registrar tus métricas</p>
      <Button onClick={() => window.location.href = getLoginUrl()}>Iniciar sesión</Button>
    </div>
  );

  const CHART_LINES = {
    weight: { key: "weight", label: "Peso (kg)", color: "#6366f1" },
    bodyFat: { key: "bodyFat", label: "Grasa corporal (%)", color: "#f59e0b" },
    muscleMass: { key: "muscleMass", label: "Masa muscular (kg)", color: "#10b981" },
    waist: { key: "waist", label: "Cintura (cm)", color: "#ec4899" },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Mis Métricas</h1>
          <p className="text-sm text-muted-foreground">Seguimiento de tu evolución corporal</p>
        </div>
      </div>

      {/* Summary cards */}
      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Peso", value: latest.weight, unit: "kg", prevVal: prev?.weight },
            { label: "Grasa", value: latest.bodyFat, unit: "%", prevVal: prev?.bodyFat },
            { label: "Músculo", value: latest.muscleMass, unit: "kg", prevVal: prev?.muscleMass },
            { label: "IMC", value: latest.bmi, unit: "", prevVal: prev?.bmi },
          ].map(({ label, value, unit, prevVal }) => (
            <Card key={label} className="border-0 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-lg font-bold">
                    {value != null ? `${value}${unit}` : "—"}
                  </span>
                  {trend(value, prevVal)}
                </div>
                {label === "IMC" && value != null && (
                  <span className={`text-xs font-medium ${bmiCategory(value).color}`}>
                    {bmiCategory(value).label}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="register">
        <TabsList className="w-full">
          <TabsTrigger value="register" className="flex-1">Registrar</TabsTrigger>
          <TabsTrigger value="evolution" className="flex-1">Evolución</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Historial</TabsTrigger>
        </TabsList>

        {/* REGISTER TAB */}
        <TabsContent value="register">
          <Card className="border-0 bg-card/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Nueva medición</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Metric type selector */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {METRIC_TYPES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMetricType(t.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${
                      metricType === t.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card/40 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <span className="text-xs font-semibold leading-tight">{t.label}</span>
                    <span className="text-[10px] leading-tight opacity-70 hidden sm:block">{t.desc}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={form.date} onChange={f("date")} max={TODAY} />
                </div>

                {/* Basic: weight + BMI */}
                {(metricType === "basic" || metricType === "composition" || metricType === "smart") && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Peso (kg) <span className="text-red-400">*</span></Label>
                      <Input type="number" step="0.1" placeholder="70.5" value={form.weight} onChange={f("weight")} />
                    </div>
                    <div>
                      <Label>IMC <span className="text-xs text-muted-foreground">(auto)</span></Label>
                      <Input type="number" step="0.1" placeholder="Auto" value={form.bmi} onChange={f("bmi")} />
                    </div>
                  </div>
                )}

                {/* Composition: body fat + muscle */}
                {(metricType === "composition" || metricType === "smart") && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>% Grasa corporal</Label>
                      <Input type="number" step="0.1" placeholder="20.0" value={form.bodyFat} onChange={f("bodyFat")} />
                    </div>
                    <div>
                      <Label>Masa muscular (kg)</Label>
                      <Input type="number" step="0.1" placeholder="35.0" value={form.muscleMass} onChange={f("muscleMass")} />
                    </div>
                  </div>
                )}

                {/* Measures: circumferences */}
                {(metricType === "measures" || metricType === "smart") && (
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Medidas corporales (cm)</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Cintura</Label><Input type="number" step="0.5" placeholder="80" value={form.waist} onChange={f("waist")} /></div>
                      <div><Label>Cadera</Label><Input type="number" step="0.5" placeholder="95" value={form.hip} onChange={f("hip")} /></div>
                      <div><Label>Pecho</Label><Input type="number" step="0.5" placeholder="90" value={form.chest} onChange={f("chest")} /></div>
                      <div><Label>Brazo</Label><Input type="number" step="0.5" placeholder="32" value={form.arm} onChange={f("arm")} /></div>
                      <div><Label>Muslo</Label><Input type="number" step="0.5" placeholder="55" value={form.thigh} onChange={f("thigh")} /></div>
                      <div><Label>Pantorrilla</Label><Input type="number" step="0.5" placeholder="38" value={form.calf} onChange={f("calf")} /></div>
                    </div>
                  </div>
                )}

                {/* Smart scale: advanced fields */}
                {metricType === "smart" && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border/50">
                    <div><Label>Cuello (cm)</Label><Input type="number" step="0.5" placeholder="38" value={form.neck} onChange={f("neck")} /></div>
                    <div><Label>Grasa visceral</Label><Input type="number" step="1" placeholder="5" value={form.visceralFat} onChange={f("visceralFat")} /></div>
                    <div><Label>Masa ósea (kg)</Label><Input type="number" step="0.1" placeholder="3.2" value={form.boneMass} onChange={f("boneMass")} /></div>
                    <div><Label>% Agua corporal</Label><Input type="number" step="0.1" placeholder="55" value={form.waterPercentage} onChange={f("waterPercentage")} /></div>
                    <div><Label>Edad metabólica</Label><Input type="number" step="1" placeholder="28" value={form.metabolicAge} onChange={f("metabolicAge")} /></div>
                    <div><Label>Metabolismo basal (kcal)</Label><Input type="number" step="1" placeholder="1650" value={form.basalMetabolism} onChange={f("basalMetabolism")} /></div>
                  </div>
                )}

                <div>
                  <Label>Notas</Label>
                  <Textarea placeholder="Observaciones, contexto..." value={form.notes} onChange={f("notes")} rows={2} />
                </div>

                <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                  {addMutation.isPending ? "Guardando..." : "Guardar medición"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVOLUTION TAB */}
        <TabsContent value="evolution">
          <Card className="border-0 bg-card/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">Evolución (últimas 30 mediciones)</CardTitle>
                <div className="flex gap-1 flex-wrap">
                  {(Object.keys(CHART_LINES) as Array<keyof typeof CHART_LINES>).map(k => (
                    <button
                      key={k}
                      onClick={() => setActiveChart(k)}
                      className={`text-xs px-2 py-1 rounded-full border transition-colors ${activeChart === k ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}
                    >
                      {CHART_LINES[k].label.split(" ")[0]}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chartData.length < 2 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2">
                  <Scale className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Registra al menos 2 mediciones para ver la evolución</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    />
                    <Line
                      type="monotone"
                      dataKey={CHART_LINES[activeChart].key}
                      stroke={CHART_LINES[activeChart].color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name={CHART_LINES[activeChart].label}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history">
          <Card className="border-0 bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Historial de mediciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {metricsQuery.isLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
              ) : !metricsQuery.data?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Scale className="w-8 h-8 opacity-30" />
                  <p className="text-sm">Aún no tienes mediciones registradas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left p-3 text-muted-foreground font-medium">Fecha</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Peso</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Grasa%</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Músculo</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">IMC</th>
                        <th className="text-right p-3 text-muted-foreground font-medium">Cintura</th>
                        <th className="p-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricsQuery.data.map((m, i) => (
                        <tr key={m.id} className={`border-b border-border/30 hover:bg-muted/30 transition-colors ${i === 0 ? "bg-primary/5" : ""}`}>
                          <td className="p-3 font-medium">
                            {String(m.date).slice(0, 10)}
                            {i === 0 && <Badge variant="outline" className="ml-2 text-xs py-0">Última</Badge>}
                          </td>
                          <td className="p-3 text-right">{m.weight != null ? `${m.weight} kg` : "—"}</td>
                          <td className="p-3 text-right">{m.bodyFat != null ? `${m.bodyFat}%` : "—"}</td>
                          <td className="p-3 text-right">{m.muscleMass != null ? `${m.muscleMass} kg` : "—"}</td>
                          <td className="p-3 text-right">
                            {m.bmi != null ? (
                              <span className={bmiCategory(m.bmi).color}>{m.bmi}</span>
                            ) : "—"}
                          </td>
                          <td className="p-3 text-right">{m.waist != null ? `${m.waist} cm` : "—"}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                if (!window.confirm(`¿Eliminar la medición del ${String(m.date).slice(0, 10)}?`)) return;
                                deleteMutation.mutate({ id: m.id });
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
