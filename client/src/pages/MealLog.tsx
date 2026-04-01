import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Plus,
  Trash2,
  Utensils,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export default function MealLog() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [open, setOpen] = useState(false);
  const [mealName, setMealName] = useState("");
  const [dayPart, setDayPart] = useState("1");
  const [calories, setCalories] = useState("");
  const [proteins, setProteins] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [servings, setServings] = useState("1");

  const [dateStart] = useState(() => selectedDate);
  const { data: logs, isLoading } = trpc.mealLogs.list.useQuery({ startDate: selectedDate, endDate: selectedDate });
  const { data: summary } = trpc.mealLogs.dailySummary.useQuery({ date: selectedDate });
  const { data: dayParts } = trpc.catalogs.dayParts.useQuery();
  const utils = trpc.useUtils();

  const addLog = trpc.mealLogs.add.useMutation({
    onSuccess: () => {
      utils.mealLogs.list.invalidate({ startDate: selectedDate, endDate: selectedDate });
      utils.mealLogs.dailySummary.invalidate({ date: selectedDate });
      setOpen(false);
      setMealName("");
      setCalories("");
      setProteins("");
      setCarbs("");
      setFats("");
      toast.success("Comida registrada");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeLog = trpc.mealLogs.remove.useMutation({
    onSuccess: () => {
      utils.mealLogs.list.invalidate({ startDate: selectedDate, endDate: selectedDate });
      utils.mealLogs.dailySummary.invalidate({ date: selectedDate });
      toast.success("Registro eliminado");
    },
  });

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split("T")[0];

  const dayPartLabel = (id: number | null) => {
    if (!id) return "Comida";
    return dayParts?.find((dp) => dp.id === id)?.nameEs || "Comida";
  };

  // Group logs by day part
  const grouped = logs?.reduce((acc: Record<string, typeof logs>, log) => {
    const part = dayPartLabel(log.log.dayPartId);
    if (!acc[part]) acc[part] = [];
    acc[part].push(log);
    return acc;
  }, {} as Record<string, typeof logs>) || {};

  const dayPartOrder = ["Desayuno", "Media mañana", "Almuerzo", "Merienda", "Cena", "Comida", "Snack"];
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    const ai = dayPartOrder.indexOf(a);
    const bi = dayPartOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Historial de Comidas
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Registra y controla lo que comes cada día</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Registrar comida
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar comida</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label>Nombre de la comida</Label>
                  <Input
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    placeholder="Ej: Ensalada César"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Momento del día</Label>
                    <Select value={dayPart} onValueChange={setDayPart}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dayParts?.map((dp) => (
                          <SelectItem key={dp.id} value={String(dp.id)}>
                            {dp.nameEs}
                          </SelectItem>
                        )) || (
                          <>
                            <SelectItem value="1">Desayuno</SelectItem>
                            <SelectItem value="2">Almuerzo</SelectItem>
                            <SelectItem value="3">Merienda</SelectItem>
                            <SelectItem value="4">Cena</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Porciones</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={servings}
                      onChange={(e) => setServings(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Calorías (kcal)</Label>
                    <Input type="number" min="0" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="350" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Proteínas (g)</Label>
                    <Input type="number" min="0" value={proteins} onChange={(e) => setProteins(e.target.value)} placeholder="20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Carbohidratos (g)</Label>
                    <Input type="number" min="0" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="45" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Grasas (g)</Label>
                    <Input type="number" min="0" value={fats} onChange={(e) => setFats(e.target.value)} placeholder="12" />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={() => {
                    if (!mealName.trim()) {
                      toast.error("El nombre es obligatorio");
                      return;
                    }
                    addLog.mutate({
                      customMealName: mealName.trim(),
                      logDate: selectedDate,
                      dayPartId: Number(dayPart),
                      servings: Number(servings),
                      calories: calories ? Number(calories) : undefined,
                      proteins: proteins ? Number(proteins) : undefined,
                      carbohydrates: carbs ? Number(carbs) : undefined,
                      fats: fats ? Number(fats) : undefined,
                    });
                  }}
                  disabled={addLog.isPending}
                >
                  {addLog.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Registrar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => navigateDate(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 text-center">
            <p className="text-sm font-medium text-foreground capitalize">{formatDate(selectedDate)}</p>
            {isToday && <Badge variant="secondary" className="text-[10px] mt-0.5">Hoy</Badge>}
          </div>
          <Button variant="outline" size="icon" onClick={() => navigateDate(1)} disabled={isToday}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Daily summary */}
        {summary && (summary.calories > 0 || summary.proteins > 0) && (
          <Card className="border-border bg-gradient-to-r from-primary/5 to-accent/10">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                {[
                  { label: "Calorías", value: summary.calories, unit: "kcal" },
                  { label: "Proteínas", value: summary.proteins?.toFixed(1), unit: "g" },
                  { label: "Carbohidratos", value: summary.carbohydrates?.toFixed(1), unit: "g" },
                  { label: "Grasas", value: summary.fats?.toFixed(1), unit: "g" },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-lg font-bold text-foreground">{item.value || 0}</p>
                    <p className="text-[10px] text-muted-foreground">{item.unit}</p>
                    <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Meal logs */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : sortedGroups.length > 0 ? (
          <div className="space-y-5">
            {sortedGroups.map(([part, partLogs]) => (
              <div key={part}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{part}</h3>
                <div className="space-y-2">
                  {partLogs.map((log) => (
                    <Card key={log.log.id} className="border-border">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Utensils className="w-4.5 h-4.5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {log.recipe?.name || log.log.customMealName || "Comida"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              {log.log.calories && (
                                <span className="text-xs text-muted-foreground">{log.log.calories} kcal</span>
                              )}
                              {log.log.servings && log.log.servings !== 1 && (
                                <span className="text-xs text-muted-foreground">{log.log.servings} porciones</span>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => removeLog.mutate({ id: log.log.id })}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ClipboardList className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Sin registros para este día</h3>
            <p className="text-muted-foreground text-sm mb-6">Registra tus comidas para hacer seguimiento nutricional</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Registrar primera comida
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
