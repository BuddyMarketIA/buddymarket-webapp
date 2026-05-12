import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowLeft, Copy, Download, User, Target, Utensils } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_LABELS: Record<string, string> = { monday: "Lunes", tuesday: "Martes", wednesday: "Miércoles", thursday: "Jueves", friday: "Viernes", saturday: "Sábado", sunday: "Domingo" };
const MEAL_LABELS: Record<string, string> = { breakfast: "Desayuno", midmorning: "Media mañana", lunch: "Comida", snack: "Merienda", dinner: "Cena", lateSnack: "Resopón" };

export default function AIPlanGenerator() {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [objective, setObjective] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState(5);
  const [calorieTarget, setCalorieTarget] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [patientName, setPatientName] = useState("");

  const { data: patients } = trpc.expertPatients.list.useQuery(undefined, { enabled: !!user });
  const generateMutation = trpc.expertEnhanced.generateAIPlan.useMutation({
    onSuccess: (data) => {
      setGeneratedPlan(data.plan);
      setPatientName(data.patientName);
      toast.success("Plan generado con éxito");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = () => {
    if (!selectedPatient || !objective.trim()) {
      toast.error("Selecciona un paciente y describe el objetivo");
      return;
    }
    generateMutation.mutate({
      patientId: selectedPatient,
      objective: objective.trim(),
      restrictions: restrictions.trim() || undefined,
      mealsPerDay,
      durationWeeks,
      calorieTarget: calorieTarget ? parseInt(calorieTarget) : undefined,
    });
  };

  const copyPlan = () => {
    if (!generatedPlan) return;
    const text = JSON.stringify(generatedPlan, null, 2);
    navigator.clipboard.writeText(text);
    toast.success("Plan copiado al portapapeles");
  };

  const weeklyPlan = generatedPlan?.weeklyPlan || {};
  const dailyTotals = generatedPlan?.dailyTotals || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/30">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/app/expert/dashboard">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" /> Generador de Planes IA
            </h1>
            <p className="text-sm text-muted-foreground">Describe el objetivo del paciente y la IA generará un menú semanal personalizado</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4" /> Configuración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Paciente *</Label>
                <Select value={selectedPatient?.toString() || ""} onValueChange={v => setSelectedPatient(parseInt(v))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar paciente" /></SelectTrigger>
                  <SelectContent>
                    {patients?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        <span className="flex items-center gap-2"><User className="w-3 h-3" /> {p.patientName || `Paciente #${p.id}`}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Objetivo del paciente *</Label>
                <Textarea
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  placeholder="Ej: Perder 5kg en 3 meses, intolerante a lactosa, entrena 4 días/semana..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label>Restricciones adicionales</Label>
                <Textarea
                  value={restrictions}
                  onChange={e => setRestrictions(e.target.value)}
                  placeholder="Ej: Sin gluten, vegetariano, alergia a frutos secos..."
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Comidas/día</Label>
                  <Select value={mealsPerDay.toString()} onValueChange={v => setMealsPerDay(parseInt(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[3, 4, 5, 6].map(n => <SelectItem key={n} value={n.toString()}>{n} comidas</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kcal objetivo</Label>
                  <Input type="number" value={calorieTarget} onChange={e => setCalorieTarget(e.target.value)} placeholder="1800" className="mt-1" />
                </div>
              </div>

              <div>
                <Label>Duración</Label>
                <Select value={durationWeeks.toString()} onValueChange={v => setDurationWeeks(parseInt(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 4, 8, 12].map(n => <SelectItem key={n} value={n.toString()}>{n} semana{n > 1 ? "s" : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending || !selectedPatient || !objective.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {generateMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generando plan...
                  </span>
                ) : (
                  <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Generar plan IA</span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Plan */}
          <div className="lg:col-span-2 space-y-4">
            {!generatedPlan && !generateMutation.isPending && (
              <Card className="border-dashed">
                <CardContent className="py-20 text-center">
                  <Sparkles className="w-12 h-12 text-purple-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-muted-foreground">Configura los parámetros y genera un plan</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">La IA creará un menú semanal personalizado basado en los datos del paciente</p>
                </CardContent>
              </Card>
            )}

            {generateMutation.isPending && (
              <Card>
                <CardContent className="py-20 text-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-lg font-medium">Generando plan personalizado...</p>
                  <p className="text-sm text-muted-foreground mt-1">Analizando datos del paciente y creando menú semanal</p>
                </CardContent>
              </Card>
            )}

            {generatedPlan && !generateMutation.isPending && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Plan para {patientName}</h2>
                    {generatedPlan.notes && <p className="text-sm text-muted-foreground mt-0.5">{generatedPlan.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyPlan}><Copy className="w-4 h-4 mr-1" /> Copiar</Button>
                  </div>
                </div>

                {DAYS.map(day => {
                  const meals = weeklyPlan[day];
                  if (!meals) return null;
                  return (
                    <Card key={day}>
                      <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-semibold">{DAY_LABELS[day]}</CardTitle>
                          {dailyTotals[day] && <Badge variant="secondary">{dailyTotals[day]} kcal</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(meals).map(([mealKey, meal]: [string, any]) => (
                            <div key={mealKey} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                              <Utensils className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-muted-foreground">{MEAL_LABELS[mealKey] || mealKey}</p>
                                <p className="text-sm font-medium truncate">{meal.dish || meal.name || mealKey}</p>
                                {meal.ingredients && <p className="text-xs text-muted-foreground truncate">{meal.ingredients}</p>}
                                {meal.kcal && <span className="text-xs text-purple-600 font-medium">{meal.kcal} kcal</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
