import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Target, Scale, Activity, Brain, Calendar } from "lucide-react";
import { Link } from "wouter";

function TrendIndicator({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value > 0) return <span className="text-green-600 text-xs font-medium flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +{value}{suffix}</span>;
  if (value < 0) return <span className="text-red-600 text-xs font-medium flex items-center gap-0.5"><TrendingDown className="w-3 h-3" /> {value}{suffix}</span>;
  return <span className="text-muted-foreground text-xs flex items-center gap-0.5"><Minus className="w-3 h-3" /> Sin cambio</span>;
}

function MiniChart({ data, color = "#8b5cf6" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = 40;
  const w = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function PatientTrends() {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [period, setPeriod] = useState<"30" | "60" | "90">("90");

  const { data: patients } = trpc.expertPatients.list.useQuery(undefined, { enabled: !!user });
  const { data: trends, isLoading } = trpc.expertEnhanced.getPatientTrends.useQuery(
    { patientRelId: selectedPatient!, days: parseInt(period) },
    { enabled: !!user && !!selectedPatient }
  );

  const weightData = trends?.weightHistory || [];
  const adherenceData = trends?.adherenceHistory || [];
  const moodData = trends?.moodHistory || [];
  const macroData = trends?.macroAverages || { protein: 0, carbs: 0, fat: 0, kcal: 0 };
  const prediction = trends?.goalPrediction;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950/20">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/app/expert/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-indigo-500" /> Análisis de Tendencias</h1>
            <p className="text-sm text-muted-foreground">Correlaciones y predicciones basadas en datos del paciente</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedPatient?.toString() || ""} onValueChange={v => setSelectedPatient(parseInt(v))}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
            <SelectContent>
              {patients?.map((p: any) => (
                <SelectItem key={p.id} value={p.id.toString()}>{p.patientName || `Paciente #${p.id}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={v => setPeriod(v as any)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 días</SelectItem>
              <SelectItem value="60">60 días</SelectItem>
              <SelectItem value="90">90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!selectedPatient ? (
          <Card className="border-dashed">
            <CardContent className="py-20 text-center">
              <Activity className="w-12 h-12 text-indigo-200 mx-auto mb-3" />
              <p className="text-lg font-medium text-muted-foreground">Selecciona un paciente</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Elige un paciente para ver sus tendencias y predicciones</p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Peso actual", value: trends?.currentWeight ? `${trends.currentWeight} kg` : "--", change: trends?.weightChange || 0, suffix: " kg", icon: Scale, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/50" },
                { label: "Adherencia media", value: trends?.avgAdherence ? `${trends.avgAdherence}%` : "--", change: trends?.adherenceChange || 0, suffix: "%", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/50" },
                { label: "Ánimo medio", value: trends?.avgMood ? `${trends.avgMood}/5` : "--", change: trends?.moodChange || 0, suffix: "", icon: Brain, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/50" },
                { label: "Kcal media/día", value: macroData.kcal ? `${macroData.kcal}` : "--", change: 0, suffix: "", icon: Activity, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/50" },
              ].map(m => (
                <Card key={m.label} className={m.bg}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <m.icon className={`w-4 h-4 ${m.color}`} />
                      <TrendIndicator value={m.change} suffix={m.suffix} />
                    </div>
                    <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Weight Trend */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2"><Scale className="w-4 h-4 text-blue-500" /> Evolución del peso</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {weightData.length > 1 ? (
                    <div className="space-y-3">
                      <MiniChart data={weightData.map((w: any) => w.value)} color="#3b82f6" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{weightData[0]?.date}</span>
                        <span>{weightData[weightData.length - 1]?.date}</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span>Inicio: <b>{weightData[0]?.value} kg</b></span>
                        <span>Actual: <b>{weightData[weightData.length - 1]?.value} kg</b></span>
                        <span>Cambio: <b className={trends?.weightChange < 0 ? "text-green-600" : "text-red-600"}>
                          {trends?.weightChange > 0 ? "+" : ""}{trends?.weightChange} kg
                        </b></span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Datos insuficientes</p>
                  )}
                </CardContent>
              </Card>

              {/* Adherence Trend */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500" /> Adherencia al plan</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {adherenceData.length > 1 ? (
                    <div className="space-y-3">
                      <MiniChart data={adherenceData.map((a: any) => a.value)} color="#10b981" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{adherenceData[0]?.date}</span>
                        <span>{adherenceData[adherenceData.length - 1]?.date}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Datos insuficientes</p>
                  )}
                </CardContent>
              </Card>

              {/* Mood Trend */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2"><Brain className="w-4 h-4 text-purple-500" /> Estado de ánimo</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {moodData.length > 1 ? (
                    <div className="space-y-3">
                      <MiniChart data={moodData.map((m: any) => m.value)} color="#8b5cf6" />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>{moodData[0]?.date}</span>
                        <span>{moodData[moodData.length - 1]?.date}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Datos insuficientes</p>
                  )}
                </CardContent>
              </Card>

              {/* Macro Averages */}
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-orange-500" /> Macros promedio</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    {[
                      { label: "Proteínas", value: macroData.protein, unit: "g", color: "bg-red-500", max: 200 },
                      { label: "Carbohidratos", value: macroData.carbs, unit: "g", color: "bg-amber-500", max: 350 },
                      { label: "Grasas", value: macroData.fat, unit: "g", color: "bg-blue-500", max: 100 },
                      { label: "Calorías", value: macroData.kcal, unit: "kcal", color: "bg-orange-500", max: 3000 },
                    ].map(m => (
                      <div key={m.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{m.label}</span>
                          <span className="font-medium">{m.value} {m.unit}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${m.color}`} style={{ width: `${Math.min((m.value / m.max) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goal Prediction */}
            {prediction && (
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-200 dark:border-indigo-800">
                <CardContent className="py-5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900">
                      <Target className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base">Predicción de meta</h3>
                      <p className="text-sm text-muted-foreground mt-1">{prediction.message}</p>
                      {prediction.estimatedDate && (
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm font-medium">Fecha estimada: {prediction.estimatedDate}</span>
                        </div>
                      )}
                      {prediction.weeklyRate && (
                        <Badge variant="outline" className="mt-2">{prediction.weeklyRate > 0 ? "+" : ""}{prediction.weeklyRate} kg/semana</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Correlation Insights */}
            {trends?.correlations && trends.correlations.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Correlaciones detectadas</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {trends.correlations.map((c: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <span className="text-lg">{c.icon || "📊"}</span>
                        <div>
                          <p className="text-sm font-medium">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{c.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
