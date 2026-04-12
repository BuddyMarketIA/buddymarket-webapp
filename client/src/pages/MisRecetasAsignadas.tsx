import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChefHat, Clock, Flame, CheckCircle2, Circle, Loader2,
  ArrowLeft, CalendarDays, User, BookOpen, Filter
} from "lucide-react";
import { toast } from "@/components/sonner-a11y-shim";

const MEAL_LABELS: Record<string, { label: string; emoji: string }> = {
  desayuno: { label: "Desayuno", emoji: "🌅" },
  almuerzo: { label: "Almuerzo", emoji: "☀️" },
  cena: { label: "Cena", emoji: "🌙" },
  snack: { label: "Snack", emoji: "🍎" },
};

export default function MisRecetasAsignadas() {
  const { user, loading } = useAuth();
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const utils = trpc.useUtils();

  const { data: assignments, isLoading } = trpc.householdRecipes.getMyAssignments.useQuery(
    undefined,
    { enabled: !!user }
  );

  const markCompleted = trpc.householdRecipes.markCompleted.useMutation({
    onSuccess: (_, vars) => {
      toast.success(vars.completed ? "¡Receta completada! 🎉" : "Marcada como pendiente");
      utils.householdRecipes.getMyAssignments.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container max-w-2xl py-16 text-center">
        <p className="text-muted-foreground">Inicia sesión para ver tus recetas asignadas.</p>
      </div>
    );
  }

  const filtered = (assignments ?? []).filter((a) => {
    if (filter === "pending") return !a.isCompleted;
    if (filter === "completed") return a.isCompleted;
    return true;
  });

  const pending = (assignments ?? []).filter((a) => !a.isCompleted).length;
  const completed = (assignments ?? []).filter((a) => a.isCompleted).length;

  // Group by date
  const byDate: Record<string, typeof filtered> = {};
  for (const a of filtered) {
    const key = a.scheduledDate
      ? new Date(a.scheduledDate).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })
      : "Sin fecha programada";
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(a);
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/familia">
          <Button variant="ghost" size="icon" aria-label="Volver al hogar">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-500" />
            Mis recetas asignadas
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Recetas que tu hogar ha preparado especialmente para ti
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center p-4">
          <p className="text-2xl font-bold text-orange-500">{(assignments ?? []).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-2xl font-bold text-amber-500">{pending}</p>
          <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
        </Card>
        <Card className="text-center p-4">
          <p className="text-2xl font-bold text-green-500">{completed}</p>
          <p className="text-xs text-muted-foreground mt-1">Completadas</p>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">
            Todas <Badge variant="secondary" className="ml-1.5 text-xs">{(assignments ?? []).length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex-1">
            Pendientes <Badge variant="secondary" className="ml-1.5 text-xs">{pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">
            Completadas <Badge variant="secondary" className="ml-1.5 text-xs">{completed}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">
                {filter === "pending" ? "¡Todo al día! No tienes recetas pendientes." :
                 filter === "completed" ? "Aún no has completado ninguna receta." :
                 "Tu hogar aún no te ha asignado ninguna receta."}
              </p>
              {filter === "all" && (
                <p className="text-sm mt-1">Cuando alguien de tu hogar te asigne una receta, aparecerá aquí.</p>
              )}
            </div>
          ) : (
            Object.entries(byDate).map(([dateLabel, items]) => (
              <div key={dateLabel} className="space-y-2">
                {/* Date group header */}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarDays className="w-3.5 h-3.5" />
                  <span className="capitalize">{dateLabel}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Recipe cards */}
                {items.map((a) => {
                  const meal = a.mealType ? MEAL_LABELS[a.mealType] : null;
                  return (
                    <Card
                      key={a.id}
                      className={`transition-all ${a.isCompleted ? "opacity-60" : ""}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Complete toggle */}
                          <button
                            type="button"
                            onClick={() => markCompleted.mutate({
                              assignmentId: a.id,
                              householdId: a.householdId,
                              completed: !a.isCompleted,
                            })}
                            className="mt-0.5 shrink-0 text-muted-foreground hover:text-orange-500 transition-colors"
                            aria-label={a.isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
                          >
                            {a.isCompleted
                              ? <CheckCircle2 className="w-6 h-6 text-green-500" />
                              : <Circle className="w-6 h-6" />}
                          </button>

                          {/* Recipe info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`font-semibold ${a.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                                  {a.recipe.name}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {meal && (
                                    <Badge variant="outline" className="text-xs py-0 gap-1">
                                      {meal.emoji} {meal.label}
                                    </Badge>
                                  )}
                                  {a.recipe.caloriesPerServing && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Flame className="w-3 h-3" />{a.recipe.caloriesPerServing} kcal
                                    </span>
                                  )}
                                  {(a.recipe.preparationTime || a.recipe.cookTime) && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {(a.recipe.preparationTime ?? 0) + (a.recipe.cookTime ?? 0)} min
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Recipe image */}
                              {a.recipe.imageUrl && (
                                <img
                                  src={a.recipe.imageUrl}
                                  alt={a.recipe.name}
                                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                                />
                              )}
                            </div>

                            {/* Note from assigner */}
                            {a.note && (
                              <div className="mt-2 p-2.5 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-900">
                                <p className="text-xs text-orange-700 dark:text-orange-300 italic">
                                  "{a.note}"
                                </p>
                              </div>
                            )}

                            {/* Assigned by */}
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <User className="w-3 h-3" />
                              <span>Asignada por {a.assignedBy.name} · {new Date(a.createdAt).toLocaleDateString("es-ES")}</span>
                            </div>
                          </div>
                        </div>

                        {/* View recipe link */}
                        <div className="mt-3 pt-3 border-t">
                          <Link href={`/recetas/${a.recipe.id}`}>
                            <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs">
                              <BookOpen className="w-3.5 h-3.5" />
                              Ver receta completa
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
