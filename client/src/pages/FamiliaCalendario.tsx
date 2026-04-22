import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Users,
  ArrowLeft,
  Home,
  AlertCircle,
  Filter,
  X,
} from "lucide-react";
import { toast } from "@/components/sonner-a11y-shim";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DAYS_FULL = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MEAL_TYPES = [
  { key: "desayuno", label: "Desayuno", emoji: "🌅", color: "bg-amber-50 border-amber-200" },
  { key: "almuerzo", label: "Almuerzo", emoji: "☀️", color: "bg-orange-50 border-orange-200" },
  { key: "cena", label: "Cena", emoji: "🌙", color: "bg-indigo-50 border-indigo-200" },
  { key: "snack", label: "Snack", emoji: "🍎", color: "bg-green-50 border-green-200" },
] as const;

type MealKey = "desayuno" | "almuerzo" | "cena" | "snack";

/** Get Monday of the week containing `date` */
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatWeekRange(monday: Date): string {
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${monday.toLocaleDateString("es-ES", opts)} – ${sunday.toLocaleDateString("es-ES", opts)}`;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// ─── Member color palette ─────────────────────────────────────────────────────
const MEMBER_COLORS = [
  "bg-orange-100 text-orange-800 border-orange-300",
  "bg-blue-100 text-blue-800 border-blue-300",
  "bg-purple-100 text-purple-800 border-purple-300",
  "bg-green-100 text-green-800 border-green-300",
  "bg-pink-100 text-pink-800 border-pink-300",
  "bg-yellow-100 text-yellow-800 border-yellow-300",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RecipeCardProps {
  assignment: {
    id: number;
    isCompleted: boolean | null;
    note: string | null;
    memberId?: number;
    mealType?: string | null;
    scheduledDate?: Date | string | null;
    completedAt?: Date | null;
    createdAt?: Date;
    recipe: { id: number; name: string; imageUrl: string | null; caloriesPerServing: number | null; preparationTime: number | null; cookTime: number | null };
    member: { id: number; displayName: string | null; userId: number; role: string };
    assignedBy: { id: number; name: string | null };
  };
  memberColor: string;
  memberName: string;
  onToggleComplete: (assignmentId: number, householdId: number, completed: boolean) => void;
  householdId: number;
}

function RecipeCard({ assignment, memberColor, memberName, onToggleComplete, householdId }: RecipeCardProps) {
  const totalTime = (assignment.recipe.preparationTime ?? 0) + (assignment.recipe.cookTime ?? 0);

  return (
    <div
      className={`group relative rounded-lg border overflow-hidden transition-all hover:shadow-md ${
        assignment.isCompleted ? "opacity-60" : ""
      } bg-background border-border`}
    >
      {/* Recipe image */}
      {assignment.recipe.imageUrl ? (
        <div className="relative h-16 overflow-hidden">
          <img
            src={assignment.recipe.imageUrl}
            alt={assignment.recipe.name}
            className="w-full h-full object-cover"
          />
          {assignment.isCompleted && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          )}
        </div>
      ) : (
        <div className="h-10 bg-gradient-to-r from-orange-100 to-amber-100 flex items-center justify-center">
          <span className="text-lg">🍽️</span>
        </div>
      )}

      {/* Content */}
      <div className="p-2">
        <Link href={`/app/recipes/${assignment.recipe.id}`}>
          <p className={`text-xs font-semibold leading-tight hover:text-orange-600 transition-colors line-clamp-2 ${assignment.isCompleted ? "line-through text-muted-foreground/70" : "text-foreground"}`}>
            {assignment.recipe.name}
          </p>
        </Link>

        {/* Meta */}
        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {assignment.recipe.caloriesPerServing && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Flame className="w-2.5 h-2.5 text-orange-400" />
              {assignment.recipe.caloriesPerServing} kcal
            </span>
          )}
          {totalTime > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5 text-muted-foreground/70" />
              {totalTime}min
            </span>
          )}
        </div>

        {/* Member badge */}
        <div className={`inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${memberColor}`}>
          <Users className="w-2.5 h-2.5" />
          <span className="truncate max-w-[60px]">{memberName}</span>
        </div>

        {/* Note */}
        {assignment.note && (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-[10px] text-muted-foreground/70 italic mt-1 line-clamp-1 cursor-help">
                "{assignment.note}"
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-xs">{assignment.note}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Complete toggle */}
        <button
          onClick={() => onToggleComplete(assignment.id, householdId, !assignment.isCompleted)}
          className={`mt-1.5 w-full flex items-center justify-center gap-1 text-[10px] py-1 rounded transition-colors ${
            assignment.isCompleted
              ? "text-green-600 hover:text-muted-foreground"
              : "text-muted-foreground/70 hover:text-green-600"
          }`}
          aria-label={assignment.isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
        >
          {assignment.isCompleted ? (
            <><CheckCircle2 className="w-3 h-3" /> Completada</>
          ) : (
            <><Circle className="w-3 h-3" /> Pendiente</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function FamiliaCalendario() {
  const { user, loading } = useAuth();
  const [weekMonday, setWeekMonday] = useState<Date>(() => getWeekMonday(new Date()));
  const weekStartStr = toISODate(weekMonday);
  // null = todos los miembros; number = id del miembro filtrado
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  // Get user's household
  const { data: householdData, isLoading: householdLoading } = trpc.household.get.useQuery(undefined, {
    enabled: !!user,
  });

  const householdId = householdData?.id;

  // Calendar data
  const { data: calendarData, isLoading: calendarLoading, refetch } = trpc.householdRecipes.getWeekCalendar.useQuery(
    { householdId: householdId ?? 0, weekStart: weekStartStr },
    { enabled: !!householdId }
  );

  // Mark complete mutation
  const markCompleted = trpc.householdRecipes.markCompleted.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: () => {
      toast.error("No se pudo actualizar el estado de la receta");
    },
  });

  const handleToggleComplete = (assignmentId: number, hId: number, completed: boolean) => {
    markCompleted.mutate({ assignmentId, householdId: hId, completed });
  };

  // Build member color map
  const memberColorMap = useMemo(() => {
    const map: Record<number, { color: string; name: string }> = {};
    (calendarData?.members ?? []).forEach((m, i) => {
      map[m.id] = {
        color: MEMBER_COLORS[i % MEMBER_COLORS.length],
        name: m.displayName ?? m.memberUser?.name ?? `Miembro ${i + 1}`,
      };
    });
    return map;
  }, [calendarData?.members]);

  // Filtered assignments (by member if a filter is active)
  const filteredAssignments = useMemo(() => {
    const all = calendarData?.assignments ?? [];
    if (selectedMemberId === null) return all;
    return all.filter((a) => a.member.id === selectedMemberId);
  }, [calendarData?.assignments, selectedMemberId]);

  // Build grid: day × mealType → assignments[]
  type AssignmentItem = NonNullable<typeof calendarData>["assignments"][number];
  const grid = useMemo(() => {
    const result: Record<string, Record<MealKey, AssignmentItem[]>> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekMonday);
      d.setDate(d.getDate() + i);
      const key = toISODate(d);
      result[key] = { desayuno: [], almuerzo: [], cena: [], snack: [] };
    }
    filteredAssignments.forEach((a) => {
      if (!a.scheduledDate) return;
      const dateKey = toISODate(new Date(a.scheduledDate));
      if (!result[dateKey]) return;
      const meal = (a.mealType as MealKey) ?? "snack";
      if (!result[dateKey][meal]) result[dateKey][meal] = [];
      result[dateKey][meal].push(a);
    });
    return result;
  }, [filteredAssignments, weekMonday]);

  const totalAssignments = filteredAssignments.length;
  const completedCount = filteredAssignments.filter((a) => a.isCompleted).length;

  // Auth guard
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) {
    window.location.href = "/login";
    return null;
  }

  // No household
  if (!householdLoading && !householdId) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Sin hogar configurado</h2>
          <p className="text-muted-foreground mb-6">Crea o únete a un hogar para ver el calendario familiar.</p>
          <Link href="/familia">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              Ir a Mi Hogar
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-full px-2 sm:px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <Link href="/familia">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Mi Hogar</span>
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                Calendario del Hogar
              </h1>
              <p className="text-sm text-muted-foreground">{householdData?.name}</p>
            </div>
          </div>

          {/* Stats */}
          {totalAssignments > 0 && (
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{completedCount}/{totalAssignments}</p>
                <p className="text-xs text-muted-foreground">completadas</p>
              </div>
              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${totalAssignments > 0 ? (completedCount / totalAssignments) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between mb-4 bg-background rounded-xl border border-border px-4 py-2.5 shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const prev = new Date(weekMonday);
              prev.setDate(prev.getDate() - 7);
              setWeekMonday(prev);
            }}
            aria-label="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="text-center">
            <p className="font-semibold text-foreground text-sm">{formatWeekRange(weekMonday)}</p>
            <button
              onClick={() => setWeekMonday(getWeekMonday(new Date()))}
              className="text-xs text-orange-500 hover:underline"
            >
              Ir a hoy
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const next = new Date(weekMonday);
              next.setDate(next.getDate() + 7);
              setWeekMonday(next);
            }}
            aria-label="Semana siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Member filter + legend */}
        {calendarData?.members && calendarData.members.length > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap bg-background rounded-xl border border-border px-3 py-2 shadow-sm">
            <span className="flex items-center gap-1 text-xs text-muted-foreground font-medium mr-1">
              <Filter className="w-3.5 h-3.5" />
              Filtrar:
            </span>
            {/* "Todos" button */}
            <button
              onClick={() => setSelectedMemberId(null)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                selectedMemberId === null
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-muted/50 text-muted-foreground border-border hover:border-gray-400"
              }`}
            >
              <Users className="w-3 h-3" />
              Todos
            </button>
            {/* Per-member buttons */}
            {calendarData.members.map((m, i) => {
              const name = m.displayName ?? m.memberUser?.name ?? `Miembro ${i + 1}`;
              const colorClass = MEMBER_COLORS[i % MEMBER_COLORS.length];
              const isActive = selectedMemberId === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(isActive ? null : m.id)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isActive
                      ? colorClass + " ring-2 ring-offset-1 ring-current"
                      : colorClass + " opacity-60 hover:opacity-100"
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Filtrar por ${name}`}
                >
                  <Users className="w-3 h-3" />
                  {name}
                  {isActive && <X className="w-2.5 h-2.5 ml-0.5" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {(householdLoading || calendarLoading) && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Calendar grid — desktop: 7 columns */}
        {!householdLoading && !calendarLoading && (
          <>
            {/* Desktop grid */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date(weekMonday);
                    d.setDate(d.getDate() + i);
                    const today = isToday(d);
                    return (
                      <div
                        key={i}
                        className={`text-center py-2 rounded-lg text-sm font-semibold ${
                          today
                            ? "bg-orange-500 text-white"
                            : "bg-muted/50 text-muted-foreground"
                        }`}
                      >
                        <div>{DAYS_ES[i]}</div>
                        <div className={`text-lg font-bold ${today ? "text-white" : "text-foreground"}`}>
                          {d.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Meal rows */}
                {MEAL_TYPES.map((meal) => (
                  <div key={meal.key} className="mb-3">
                    {/* Meal type header */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-t-lg border-b-2 border-border mb-1 ${meal.color}`}>
                      <span className="text-base">{meal.emoji}</span>
                      <span className="text-sm font-semibold text-foreground/80">{meal.label}</span>
                    </div>

                    {/* 7-day row */}
                    <div className="grid grid-cols-7 gap-2">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date(weekMonday);
                        d.setDate(d.getDate() + i);
                        const dateKey = toISODate(d);
                        const dayAssignments = grid[dateKey]?.[meal.key as MealKey] ?? [];
                        const today = isToday(d);

                        return (
                          <div
                            key={i}
                            className={`min-h-[80px] rounded-lg p-1.5 ${
                              today ? "ring-2 ring-orange-300 ring-offset-1" : "bg-muted/30"
                            } border border-border/50`}
                          >
                            {dayAssignments.length === 0 ? (
                              <div className="h-full flex items-center justify-center">
                                <span className="text-gray-300 text-xs">—</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {dayAssignments.map((a) => (
                                  <RecipeCard
                                    key={a.id}
                                    assignment={a}
                                    memberColor={memberColorMap[a.member.id]?.color ?? MEMBER_COLORS[0]}
                                    memberName={memberColorMap[a.member.id]?.name ?? "Miembro"}
                                    onToggleComplete={handleToggleComplete}
                                    householdId={householdId!}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile: list by day */}
            <div className="md:hidden space-y-4">
              {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(weekMonday);
                d.setDate(d.getDate() + i);
                const dateKey = toISODate(d);
                const today = isToday(d);
                const dayHasAssignments = MEAL_TYPES.some(
                  (m) => (grid[dateKey]?.[m.key as MealKey] ?? []).length > 0
                );

                return (
                  <div key={i} className={`rounded-xl border overflow-hidden ${today ? "border-orange-400 shadow-md" : "border-border"}`}>
                    {/* Day header */}
                    <div className={`px-4 py-2.5 flex items-center justify-between ${today ? "bg-orange-500 text-white" : "bg-muted/30 text-foreground/80"}`}>
                      <span className="font-bold">{DAYS_FULL[i]}</span>
                      <span className={`text-sm ${today ? "text-orange-100" : "text-muted-foreground"}`}>
                        {d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>

                    {!dayHasAssignments ? (
                      <div className="px-4 py-3 text-sm text-muted-foreground/70 italic">Sin recetas asignadas</div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {MEAL_TYPES.map((meal) => {
                          const dayAssignments = grid[dateKey]?.[meal.key as MealKey] ?? [];
                          if (dayAssignments.length === 0) return null;
                          return (
                            <div key={meal.key} className="px-3 py-2">
                              <div className="flex items-center gap-1.5 mb-2">
                                <span>{meal.emoji}</span>
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{meal.label}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {dayAssignments.map((a) => (
                                  <RecipeCard
                                    key={a.id}
                                    assignment={a}
                                    memberColor={memberColorMap[a.member.id]?.color ?? MEMBER_COLORS[0]}
                                    memberName={memberColorMap[a.member.id]?.name ?? "Miembro"}
                                    onToggleComplete={handleToggleComplete}
                                    householdId={householdId!}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {totalAssignments === 0 && !calendarLoading && (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                {selectedMemberId !== null ? (
                  <>
                    <h3 className="text-lg font-semibold text-foreground/80 mb-2">Sin recetas para este miembro</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                      No hay recetas asignadas a este miembro esta semana.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMemberId(null)}
                      className="gap-2"
                    >
                      <X className="w-4 h-4" />
                      Ver todos los miembros
                    </Button>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-foreground/80 mb-2">Sin recetas esta semana</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                      Asigna recetas a los miembros del hogar con fecha programada para verlas aquí.
                    </p>
                    <Link href="/familia">
                      <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                        <Users className="w-4 h-4" />
                        Asignar recetas
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* Info tip */}
            {totalAssignments > 0 && (
              <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                <span>Solo se muestran recetas con fecha programada. Para asignar recetas a días concretos, usa el botón "Asignar receta" en la página de Mi Hogar.</span>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
