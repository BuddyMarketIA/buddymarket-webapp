import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePlan } from "@/hooks/usePlan";
import { Link, useLocation } from "wouter";
import { toast } from "@/components/sonner-a11y-shim";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, UserPlus, Home, Settings, Trash2, Mail, Crown, Shield,
  ChevronRight, LogOut, Loader2, Check, X, AlertTriangle,
  ChefHat, Search, Plus, Clock, Flame, CheckCircle2, Circle, BookOpen,
  Baby, User, Sparkles, Calendar, Utensils, Zap, Droplets
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import HouseholdMenuPlans from "@/components/HouseholdMenuPlans";


// ─── Meal type labels ─────────────────────────────────────────────────────────
const MEAL_LABELS: Record<string, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
  snack: "Snack",
};

// ─── Assign Recipe Modal ────────────────────────────────────────────────────
function AssignRecipeModal({
  open,
  onClose,
  householdId,
  members,
}: {
  open: boolean;
  onClose: () => void;
  householdId: number;
  members: Array<{ id: number; displayName: string | null; userName: string | null; userId: number }>;
}) {
  const [selectedMemberId, setSelectedMemberId] = useState<number | "">("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<{ id: number; name: string; imageUrl: string | null } | null>(null);
  const [mealType, setMealType] = useState<"desayuno" | "almuerzo" | "cena" | "snack" | "">("" );
  const [note, setNote] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const utils = trpc.useUtils();

  // Debounce query
  const debounceRef = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef[0]) clearTimeout(debounceRef[0]);
    debounceRef[1](setTimeout(() => setDebouncedQuery(val), 350));
  };

  const { data: searchResults, isLoading: searching } = trpc.householdRecipes.searchRecipes.useQuery(
    { householdId, query: debouncedQuery },
    { enabled: open && debouncedQuery.length >= 2 }
  );

  const assign = trpc.householdRecipes.assign.useMutation({
    onSuccess: () => {
      toast.success("Receta asignada correctamente");
      utils.householdRecipes.getForHousehold.invalidate({ householdId });
      onClose();
      setSelectedRecipe(null);
      setQuery("");
      setDebouncedQuery("");
      setSelectedMemberId("");
      setMealType("");
      setNote("");
      setScheduledDate("");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAssign = () => {
    if (!selectedMemberId || !selectedRecipe) return;
    assign.mutate({
      householdId,
      memberId: selectedMemberId as number,
      recipeId: selectedRecipe.id,
      mealType: mealType || undefined,
      note: note || undefined,
      scheduledDate: scheduledDate || undefined,
      origin: window.location.origin,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            Asignar receta a un miembro
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Step 1: Select member */}
          <div>
            <Label htmlFor="assign-member">Miembro del hogar</Label>
            <Select
              value={selectedMemberId === "" ? "" : String(selectedMemberId)}
              onValueChange={(v) => setSelectedMemberId(Number(v))}
            >
              <SelectTrigger id="assign-member" className="mt-1">
                <SelectValue placeholder="Selecciona un miembro..." />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={String(m.id)}>
                    {m.displayName ?? m.userName ?? `Miembro #${m.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Search recipe */}
          <div>
            <Label htmlFor="recipe-search">Buscar receta</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="recipe-search"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Escribe el nombre de la receta..."
                className="pl-9"
              />
            </div>
            {searching && (
              <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
              </div>
            )}
            {searchResults && searchResults.length > 0 && !selectedRecipe && (
              <div className="mt-2 border rounded-lg overflow-hidden divide-y">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setSelectedRecipe(r); setQuery(r.name); }}
                    className="w-full flex items-center gap-3 p-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <ChefHat className="w-5 h-5 text-orange-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {r.caloriesPerServing && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Flame className="w-3 h-3" />{r.caloriesPerServing} kcal
                          </span>
                        )}
                        {(r.preparationTime || r.cookTime) && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />{(r.preparationTime ?? 0) + (r.cookTime ?? 0)} min
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedRecipe && (
              <div className="mt-2 flex items-center gap-3 p-2.5 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                {selectedRecipe.imageUrl ? (
                  <img src={selectedRecipe.imageUrl} alt={selectedRecipe.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                    <ChefHat className="w-5 h-5 text-orange-400" />
                  </div>
                )}
                <p className="flex-1 text-sm font-medium text-orange-700 dark:text-orange-300 truncate">{selectedRecipe.name}</p>
                <button
                  type="button"
                  onClick={() => { setSelectedRecipe(null); setQuery(""); setDebouncedQuery(""); }}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Quitar receta seleccionada"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Step 3: Optional details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="assign-meal-type">Momento del día</Label>
              <Select value={mealType} onValueChange={(v) => setMealType(v as typeof mealType)}>
                <SelectTrigger id="assign-meal-type" className="mt-1">
                  <SelectValue placeholder="Opcional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desayuno">🌅 Desayuno</SelectItem>
                  <SelectItem value="almuerzo">☀️ Almuerzo</SelectItem>
                  <SelectItem value="cena">🌙 Cena</SelectItem>
                  <SelectItem value="snack">🍎 Snack</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assign-date">Fecha programada</Label>
              <Input
                id="assign-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="assign-note">Nota para el miembro (opcional)</Label>
            <Input
              id="assign-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Prueba esta receta para el lunes"
              maxLength={300}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedMemberId || !selectedRecipe || assign.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
          >
            {assign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Asignar receta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Household Assigned Recipes Panel ────────────────────────────────────────────
function HouseholdAssignedRecipes({
  householdId,
  members,
  isOwnerOrAdmin,
}: {
  householdId: number;
  members: Array<{ id: number; displayName: string | null; userName: string | null; userId: number; userAvatar?: string | null }>;
  isOwnerOrAdmin: boolean;
}) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [expandedMember, setExpandedMember] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const { data: allAssignments, isLoading } = trpc.householdRecipes.getForHousehold.useQuery(
    { householdId },
    { enabled: isOwnerOrAdmin }
  );

  const unassign = trpc.householdRecipes.unassign.useMutation({
    onSuccess: () => {
      toast.success("Receta desasignada");
      utils.householdRecipes.getForHousehold.invalidate({ householdId });
    },
    onError: (e) => toast.error(e.message),
  });

  const markCompleted = trpc.householdRecipes.markCompleted.useMutation({
    onSuccess: () => utils.householdRecipes.getForHousehold.invalidate({ householdId }),
    onError: (e) => toast.error(e.message),
  });

  // Group assignments by member
  const byMember = members.map((m) => ({
    member: m,
    assignments: (allAssignments ?? []).filter((a) => a.member.id === m.id),
  }));

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-orange-500" /> Recetas asignadas
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setShowAssignModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-1 h-8 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Asignar receta
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Asigna recetas específicas a cada miembro del hogar</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-orange-400" />
            </div>
          ) : byMember.every((m) => m.assignments.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aún no hay recetas asignadas</p>
              <p className="text-xs mt-1">Usa el botón &ldquo;Asignar receta&rdquo; para empezar</p>
            </div>
          ) : (
            byMember.map(({ member, assignments }) => {
              if (assignments.length === 0) return null;
              const isExpanded = expandedMember === member.id;
              const completed = assignments.filter((a) => a.isCompleted).length;
              return (
                <div key={member.id} className="border rounded-xl overflow-hidden">
                  {/* Member header */}
                  <button
                    type="button"
                    onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={member.userAvatar ?? undefined} />
                        <AvatarFallback className="bg-orange-100 text-orange-700 text-xs font-semibold">
                          {(member.displayName ?? member.userName ?? "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left">
                        <p className="text-sm font-medium">{member.displayName ?? member.userName ?? "Miembro"}</p>
                        <p className="text-xs text-muted-foreground">
                          {completed}/{assignments.length} completadas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{assignments.length}</Badge>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {/* Assignments list */}
                  {isExpanded && (
                    <div className="border-t divide-y">
                      {assignments.map((a) => (
                        <div key={a.id} className="flex items-start gap-3 p-3 bg-muted/20">
                          {/* Complete toggle */}
                          <button
                            type="button"
                            onClick={() => markCompleted.mutate({ assignmentId: a.id, householdId, completed: !a.isCompleted })}
                            className="mt-0.5 shrink-0 text-muted-foreground hover:text-orange-500 transition-colors"
                            aria-label={a.isCompleted ? "Marcar como pendiente" : "Marcar como completada"}
                          >
                            {a.isCompleted
                              ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                              : <Circle className="w-5 h-5" />}
                          </button>

                          {/* Recipe info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-medium truncate ${a.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                                {a.recipe.name}
                              </p>
                              {a.mealType && (
                                <Badge variant="outline" className="text-xs py-0">
                                  {MEAL_LABELS[a.mealType] ?? a.mealType}
                                </Badge>
                              )}
                            </div>
                            {a.scheduledDate && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                📅 {new Date(a.scheduledDate).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                              </p>
                            )}
                            {a.note && (
                              <p className="text-xs text-muted-foreground mt-0.5 italic">“{a.note}”</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Asignada por {a.assignedBy.name} · {new Date(a.createdAt).toLocaleDateString("es-ES")}
                            </p>
                          </div>

                          {/* Recipe image */}
                          {a.recipe.imageUrl && (
                            <img
                              src={a.recipe.imageUrl}
                              alt={a.recipe.name}
                              className="w-12 h-12 rounded-lg object-cover shrink-0"
                            />
                          )}

                          {/* Unassign */}
                          <button
                            type="button"
                            onClick={() => unassign.mutate({ assignmentId: a.id, householdId })}
                            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                            aria-label="Desasignar receta"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <AssignRecipeModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        householdId={householdId}
        members={members}
      />
    </>
  );
}

// ─── Generador de Menú Familiar con IA ────────────────────────────────────────────
function FamilyMenuModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [days, setDays] = useState(7);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [menuType, setMenuType] = useState<"equilibrado" | "mediterraneo" | "bajo_carbohidratos" | "alto_proteina" | "familiar">("familiar");
  const [notes, setNotes] = useState("");
  const [generatedMenu, setGeneratedMenu] = useState<Record<string, unknown> | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  const generate = trpc.householdRecipes.generateFamilyMenu.useMutation({
    onSuccess: (data) => {
      setGeneratedMenu(data.menu as Record<string, unknown>);
      toast.success(`Menú familiar generado para ${data.memberCount} miembro${data.memberCount !== 1 ? "s" : ""}`);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleClose = () => {
    setGeneratedMenu(null);
    setExpandedDay(0);
    onClose();
  };

  const menuTypeLabels: Record<string, string> = {
    familiar: "Familiar equilibrado",
    equilibrado: "Equilibrado",
    mediterraneo: "Mediterráneo",
    bajo_carbohidratos: "Bajo en carbohidratos",
    alto_proteina: "Alto en proteína",
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Generar Menú Familiar con IA
          </DialogTitle>
        </DialogHeader>

        {!generatedMenu ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              La IA creará un menú personalizado teniendo en cuenta las restricciones, alergias y necesidades nutricionales de cada miembro del hogar, incluyendo niños y bebés.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Número de días</Label>
                <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10, 14].map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} días</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Comidas por día</Label>
                <Select value={String(mealsPerDay)} onValueChange={(v) => setMealsPerDay(Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 (comida + cena)</SelectItem>
                    <SelectItem value="3">3 (desayuno + comida + cena)</SelectItem>
                    <SelectItem value="4">4 (+ merienda)</SelectItem>
                    <SelectItem value="5">5 (+ almuerzo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-sm">Tipo de menú</Label>
              <Select value={menuType} onValueChange={(v) => setMenuType(v as typeof menuType)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(menuTypeLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Notas adicionales <span className="text-muted-foreground">(opcional)</span></Label>
              <Textarea
                className="mt-1 resize-none"
                rows={3}
                placeholder="Ej: preferimos platos rápidos, sin pescado azul, incluir legumbres 3 veces..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
              />
            </div>
            <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-200 rounded-lg p-3">
              ⚠️ Todos los campos son opcionales. La IA usará los perfiles de los miembros del hogar para adaptar el menú automáticamente.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancelar</Button>
              <Button
                onClick={() => generate.mutate({ days, mealsPerDay, menuType, notes: notes || undefined })}
                disabled={generate.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
              >
                {generate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generate.isPending ? "Generando menú..." : "Generar menú"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <h3 className="font-semibold text-purple-800 text-lg">{(generatedMenu.menuName as string) ?? "Menú familiar"}</h3>
              <p className="text-sm text-purple-600 mt-1">{generatedMenu.nutritionSummary as string}</p>
            </div>

            {/* Days accordion */}
            <div className="space-y-2">
              {((generatedMenu.days as Array<{
                dayNumber: number;
                dayName: string;
                meals: Array<{
                  mealType: string;
                  recipeName: string;
                  description: string;
                  isKidFriendly: boolean;
                  isBabyFriendly: boolean;
                  kcalEstimate: number;
                  notes: string | null;
                }>;
              }>) ?? []).map((day, i) => (
                <div key={i} className="border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
                    onClick={() => setExpandedDay(expandedDay === i ? null : i)}
                  >
                    <span className="font-medium">{day.dayName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{day.meals.length} comidas</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${expandedDay === i ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                  {expandedDay === i && (
                    <div className="divide-y">
                      {day.meals.map((meal, j) => (
                        <div key={j} className="p-3 flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                            <Utensils className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{meal.mealType}</span>
                              {meal.isKidFriendly && <Badge className="text-xs bg-blue-50 text-blue-600 border-blue-200 py-0">Niños ✅</Badge>}
                              {meal.isBabyFriendly && <Badge className="text-xs bg-pink-50 text-pink-600 border-pink-200 py-0">Bebés ✅</Badge>}
                              <span className="text-xs text-muted-foreground ml-auto">{meal.kcalEstimate} kcal</span>
                            </div>
                            <p className="font-medium text-sm mt-0.5">{meal.recipeName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{meal.description}</p>
                            {meal.notes && (
                              <p className="text-xs text-amber-600 mt-1 bg-amber-50 rounded px-2 py-1">👶 {meal.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Shopping tips */}
            {Array.isArray(generatedMenu.shoppingTips) && (generatedMenu.shoppingTips as string[]).length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-medium text-green-800 text-sm mb-2">🛒 Consejos de compra</h4>
                <ul className="space-y-1">
                  {(generatedMenu.shoppingTips as string[]).map((tip, i) => (
                    <li key={i} className="text-xs text-green-700 flex items-start gap-1">
                      <Check className="w-3 h-3 mt-0.5 shrink-0" />{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setGeneratedMenu(null)}>Generar otro</Button>
              <Button onClick={handleClose} className="bg-orange-500 hover:bg-orange-600 text-white">Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal para editar el perfil de un miembro (tipo, edad, etc.) ───────────────────────────────
function EditMemberProfileModal({ open, memberId, onClose }: { open: boolean; memberId: number; onClose: () => void }) {
  const [memberType, setMemberType] = useState<"adult" | "child" | "baby">("adult");
  const [birthDate, setBirthDate] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [feedingPhase, setFeedingPhase] = useState("");
  const utils = trpc.useUtils();

  const update = trpc.household.updateMemberProfile.useMutation({
    onSuccess: () => {
      toast.success("Perfil actualizado");
      utils.household.get.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-orange-500" /> Editar perfil del miembro
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm">Tipo de miembro</Label>
            <Select value={memberType} onValueChange={(v) => setMemberType(v as typeof memberType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="adult">👤 Adulto</SelectItem>
                <SelectItem value="child">👦 Niño (1-17 años)</SelectItem>
                <SelectItem value="baby">👶 Bebé (0-12 meses)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm">Fecha de nacimiento <span className="text-muted-foreground">(opcional)</span></Label>
            <Input type="date" className="mt-1" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          {memberType !== "baby" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Peso (kg)</Label>
                <Input type="number" className="mt-1" placeholder="Ej: 25" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
              </div>
              <div>
                <Label className="text-sm">Altura (cm)</Label>
                <Input type="number" className="mt-1" placeholder="Ej: 120" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
              </div>
            </div>
          )}
          {memberType === "baby" && (
            <div>
              <Label className="text-sm">Fase de alimentación</Label>
              <Select value={feedingPhase} onValueChange={setFeedingPhase}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar fase" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breastfeeding">Lactancia materna</SelectItem>
                  <SelectItem value="formula">Fórmula</SelectItem>
                  <SelectItem value="purees">Papillas / purés</SelectItem>
                  <SelectItem value="soft_solids">Sólidos blandos</SelectItem>
                  <SelectItem value="normal">Alimentación normal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => update.mutate({
              memberId,
              memberType,
              birthDate: birthDate || null,
              weightKg: weightKg ? Number(weightKg) : null,
              heightCm: heightCm ? Number(heightCm) : null,
              feedingPhase: (feedingPhase as "breastfeeding" | "formula" | "purees" | "soft_solids" | "normal") || null,
            })}
            disabled={update.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Upsell screen for non-Pro Max users ────────────────────────────────────────────
function HouseholdUpsell({ currentTier }: { currentTier: string }) {
  const isPro = currentTier === "basic";
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center mb-6 shadow-lg">
        <span className="text-5xl">🏠</span>
      </div>
      <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
        <Crown className="w-4 h-4" />
        Exclusivo Pro Max
      </div>
      <h2 className="text-3xl font-bold text-foreground mb-3">Modo Familia</h2>
      <p className="text-muted-foreground max-w-lg mb-8 leading-relaxed text-lg">
        Comparte el menú semanal y la lista de la compra con toda tu familia.
        Cada miembro con sus propias preferencias y restricciones dietéticas.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-xl w-full">
        {[
          { icon: "🍽️", title: "Menú compartido", desc: "Planifica las comidas de toda la familia a la vez" },
          { icon: "🛒", title: "Lista unificada", desc: "Una sola lista de la compra para todos" },
          { icon: "🥗", title: "Preferencias propias", desc: "Restricciones dietéticas individuales por miembro" },
        ].map((f) => (
          <div key={f.title} className="bg-card border border-violet-100 rounded-xl p-5 text-center shadow-sm">
            <div className="text-3xl mb-2">{f.icon}</div>
            <p className="font-semibold text-sm text-foreground">{f.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
      {isPro ? (
        <div className="space-y-3 w-full max-w-sm">
          <p className="text-sm text-muted-foreground">
            Estás en el plan <strong>Pro</strong>. Actualiza a <strong>Pro Max</strong> para acceder al Modo Familia.
          </p>
          <Link href="/precios?plan=premium">
            <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-base">
              Actualizar a Pro Max — 19,99€/mes
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3 w-full max-w-sm">
          <p className="text-sm text-muted-foreground">
            El Modo Familia está disponible exclusivamente en el plan <strong>Pro Max</strong>.
          </p>
          <Link href="/precios?plan=premium">
            <Button size="lg" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-base">
              Ver planes y precios
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">
            Prueba gratuita de 7 días · Cancela cuando quieras
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Dietary restriction labels ────────────────────────────────────────────────
const DIETARY_OPTIONS = [
  { id: "gluten", label: "Sin gluten" },
  { id: "lactosa", label: "Sin lactosa" },
  { id: "huevo", label: "Sin huevo" },
  { id: "frutos_secos", label: "Sin frutos secos" },
  { id: "mariscos", label: "Sin mariscos" },
  { id: "pescado", label: "Sin pescado" },
  { id: "soja", label: "Sin soja" },
  { id: "vegetariano", label: "Vegetariano" },
  { id: "vegano", label: "Vegano" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
];

const GOAL_OPTIONS = [
  { value: "lose_weight", label: "Perder peso" },
  { value: "maintain", label: "Mantener peso" },
  { value: "gain_muscle", label: "Ganar músculo" },
  { value: "eat_healthy", label: "Comer más sano" },
];

// ─── Role badge ───────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  if (role === "owner") return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
      <Crown className="w-3 h-3" /> Propietario
    </Badge>
  );
  if (role === "admin") return (
    <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
      <Shield className="w-3 h-3" /> Admin
    </Badge>
  );
  return (
    <Badge variant="secondary" className="gap-1">
      <Users className="w-3 h-3" /> Miembro
    </Badge>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyHousehold({ onCreate }: { onCreate: () => void }) {
  const [step, setStep] = useState(0);
  const steps = [
    {
      icon: "🏠",
      title: "Bienvenido al modo Familia",
      desc: "Buddy One te permite gestionar la alimentación de toda tu familia desde un solo lugar. Cada miembro tiene su propio perfil nutricional.",
      cta: "Empezar",
    },
    {
      icon: "🍽️",
      title: "Menús personalizados por persona",
      desc: "Genera menús adaptados a las necesidades de cada miembro: niños, adultos, personas con condiciones médicas o preferencias especiales.",
      cta: "Siguiente",
    },
    {
      icon: "🛒",
      title: "Lista de la compra unificada",
      desc: "Buddy One consolida los ingredientes de todos los menús familiares en una sola lista de la compra optimizada.",
      cta: "Siguiente",
    },
    {
      icon: "🥗",
      title: "Preferencias y restricciones",
      desc: "Cada miembro puede tener sus propias alergias, intolerancias y preferencias. La IA las respeta al generar menús.",
      cta: "Crear mi hogar familiar",
      isLast: true,
    },
  ];
  const current = steps[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === step ? "bg-orange-500 w-6" : i < step ? "bg-orange-300" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="w-24 h-24 rounded-3xl bg-orange-100 flex items-center justify-center mb-6 text-5xl">
        {current.icon}
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">{current.title}</h2>
      <p className="text-muted-foreground max-w-md mb-10 leading-relaxed">{current.desc}</p>

      {/* Benefit chips (only on first step) */}
      {step === 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8 max-w-sm w-full">
          {[
            { icon: "👨‍👩‍👧", label: "Toda la familia" },
            { icon: "🤖", label: "IA personalizada" },
            { icon: "⚡", label: "Sincronizado" },
          ].map((b) => (
            <div key={b.label} className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
              <div className="text-2xl mb-1">{b.icon}</div>
              <p className="text-xs font-semibold text-orange-800">{b.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(s => s - 1)} className="gap-1">
            Atrás
          </Button>
        )}
        <Button
          onClick={() => {
            if ((current as any).isLast) onCreate();
            else setStep(s => s + 1);
          }}
          size="lg"
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
        >
          {(current as any).isLast ? <Home className="w-5 h-5" /> : null}
          {current.cta}
        </Button>
      </div>
    </div>
  );
}

// ─── Create household modal ───────────────────────────────────────────────────
function CreateHouseholdModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const utils = trpc.useUtils();
  const create = trpc.household.create.useMutation({
    onSuccess: () => {
      toast.success("¡Hogar creado! Ahora puedes invitar a tu familia.");
      utils.household.get.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-orange-500" /> Crear hogar familiar
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="household-name">Nombre del hogar</Label>
            <Input
              id="household-name"
              placeholder="Ej: Familia García, Casa de los López..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && name.trim() && create.mutate({ name })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => create.mutate({ name })}
            disabled={!name.trim() || create.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {create.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Crear hogar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Invite modal ─────────────────────────────────────────────────────────────
function InviteModal({ open, onClose, householdName }: { open: boolean; onClose: () => void; householdName?: string }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [tab, setTab] = useState<"email" | "whatsapp">("email");
  const utils = trpc.useUtils();
  const invite = trpc.household.invite.useMutation({
    onSuccess: () => {
      setSent(true);
      utils.household.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleClose = () => {
    setEmail("");
    setSent(false);
    setTab("email");
    onClose();
  };

  const handleWhatsApp = () => {
    const text = `¡Hola! Te invito a unirte a nuestro hogar "${householdName || "BuddyOne"}" para compartir menús semanales y listas de la compra. Regístrate en buddyone.io y te envío la invitación por email.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-orange-500" /> Invitar miembro
          </DialogTitle>
        </DialogHeader>
        {sent ? (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-semibold text-foreground">¡Invitación enviada!</p>
            <p className="text-sm text-muted-foreground">
              Hemos enviado un email a <strong>{email}</strong> con el enlace para unirse al hogar.
            </p>
            <Button onClick={handleClose} className="mt-2">Cerrar</Button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTab("email")}
                className={`flex-1 py-2 rounded-xl text-sm font-600 transition-colors ${
                  tab === "email"
                    ? "bg-orange-500 text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                📧 Por email
              </button>
              <button
                onClick={() => setTab("whatsapp")}
                className={`flex-1 py-2 rounded-xl text-sm font-600 transition-colors ${
                  tab === "whatsapp"
                    ? "bg-[#25D366] text-white"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                💬 WhatsApp
              </button>
            </div>

            {tab === "email" ? (
              <div className="space-y-4 py-2">
                <div>
                  <Label htmlFor="invite-email">Email del familiar</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="familiar@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    onKeyDown={(e) => e.key === "Enter" && email.trim() && invite.mutate({ email, origin: window.location.origin })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Recibirán un email con un enlace para unirse. El enlace expira en 7 días.
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                  <Button
                    onClick={() => invite.mutate({ email, origin: window.location.origin })}
                    disabled={!email.trim() || invite.isPending}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {invite.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Enviar invitación
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl p-4 text-center">
                  <p className="text-2xl mb-2">💬</p>
                  <p className="text-sm font-600 text-foreground mb-1">Invitar por WhatsApp</p>
                  <p className="text-xs text-muted-foreground">
                    Se abrirá WhatsApp con un mensaje listo para enviar a quien quieras invitar a tu hogar.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                  <Button
                    onClick={handleWhatsApp}
                    className="bg-[#25D366] hover:bg-[#1fb855] text-white"
                  >
                    Abrir WhatsApp
                  </Button>
                </DialogFooter>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── My preferences modal ─────────────────────────────────────────────────────
function MyPreferencesModal({
  open,
  onClose,
  currentPrefs,
}: {
  open: boolean;
  onClose: () => void;
  currentPrefs: {
    displayName?: string | null;
    dietaryRestrictions?: string[];
    allergies?: string[];
    preferences?: { goal?: string; calories?: number; mealsPerDay?: number };
  };
}) {
  const [displayName, setDisplayName] = useState(currentPrefs.displayName ?? "");
  const [restrictions, setRestrictions] = useState<string[]>(currentPrefs.dietaryRestrictions ?? []);
  const [goal, setGoal] = useState(currentPrefs.preferences?.goal ?? "");
  const [calories, setCalories] = useState(String(currentPrefs.preferences?.calories ?? ""));
  const utils = trpc.useUtils();

  const update = trpc.household.updateMyPreferences.useMutation({
    onSuccess: () => {
      toast.success("Preferencias actualizadas");
      utils.household.get.invalidate();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleRestriction = (id: string) => {
    setRestrictions((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-orange-500" /> Mis preferencias
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div>
            <Label htmlFor="display-name">Nombre en el hogar</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="¿Cómo quieres que te llamen?"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="mb-2 block">Restricciones dietéticas</Label>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`diet-${opt.id}`}
                    checked={restrictions.includes(opt.id)}
                    onCheckedChange={() => toggleRestriction(opt.id)}
                  />
                  <label htmlFor={`diet-${opt.id}`} className="text-sm cursor-pointer">
                    {opt.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="goal-select">Objetivo nutricional</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger id="goal-select" className="mt-1">
                <SelectValue placeholder="Selecciona tu objetivo" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="calories-input">Calorías diarias objetivo (opcional)</Label>
            <Input
              id="calories-input"
              type="number"
              min={800}
              max={5000}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Ej: 2000"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() =>
              update.mutate({
                displayName: displayName || undefined,
                dietaryRestrictions: restrictions,
                preferences: {
                  goal: goal as "lose_weight" | "maintain" | "gain_muscle" | "eat_healthy" | undefined || undefined,
                  calories: calories ? Number(calories) : undefined,
                },
              })
            }
            disabled={update.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {update.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Familia() {
  const { user, loading } = useAuth();
  const { can, tier } = usePlan();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [newName, setNewName] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [expandedMember, setExpandedMember] = useState<number | null>(null);
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  const { data: household, isLoading } = trpc.household.get.useQuery(undefined, {
    enabled: !!user,
  });

  const utils = trpc.useUtils();

  const removeMember = trpc.household.removeMember.useMutation({
    onSuccess: () => {
      toast.success("Miembro eliminado del hogar");
      utils.household.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const cancelInvite = trpc.household.cancelInvitation.useMutation({
    onSuccess: () => {
      toast.success("Invitación cancelada");
      utils.household.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateName = trpc.household.update.useMutation({
    onSuccess: () => {
      toast.success("Nombre actualizado");
      utils.household.get.invalidate();
      setShowRename(false);
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
    navigate("/");
    return null;
  }

  // ── Plan gate: Pro Max only ────────────────────────────────────────────────
  if (!can("canUseHousehold")) {
    return <HouseholdUpsell currentTier={tier} />;
  }

  if (!household) {
    return (
      <>
        <EmptyHousehold onCreate={() => setShowCreate(true)} />
        <CreateHouseholdModal open={showCreate} onClose={() => setShowCreate(false)} />
      </>
    );
  }

  const myMember = household.members.find((m) => m.userId === user.id);
  const isOwnerOrAdmin = myMember?.role === "owner" || myMember?.role === "admin";

  return (
    <div className="container max-w-3xl py-6 space-y-5">

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-orange-400 via-amber-400 to-orange-500 shadow-lg">
        {/* decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-card/10" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-card/10" />
        <div className="relative px-6 py-6">
          <div className="flex items-start justify-between gap-3">
            {/* left: name + meta */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-9 h-9 rounded-xl bg-card/25 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white leading-tight truncate">{household.name}</h1>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => { setNewName(household.name); setShowRename(true); }}
                    className="text-white/70 hover:text-white transition-colors shrink-0"
                    aria-label="Renombrar hogar"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-white/80 text-sm">
                {household.members.length} miembro{household.members.length !== 1 ? "s" : ""}
                {household.pendingInvitations.length > 0 && (
                  <span className="ml-2 bg-card/20 rounded-full px-2 py-0.5 text-xs font-medium">
                    {household.pendingInvitations.length} invitación{household.pendingInvitations.length !== 1 ? "es" : ""} pendiente{household.pendingInvitations.length !== 1 ? "s" : ""}
                  </span>
                )}
              </p>
            </div>
            {/* right: action buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => setShowPrefs(true)}
                className="bg-card/20 hover:bg-card/30 text-white border-0 gap-1.5 text-xs h-8"
              >
                <Settings className="w-3.5 h-3.5" /> Mis preferencias
              </Button>
              {isOwnerOrAdmin && (
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => setShowFamilyMenu(true)}
                    className="bg-card/20 hover:bg-card/30 text-white border-0 gap-1 text-xs h-8 flex-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Menú IA
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowInvite(true)}
                    className="bg-card hover:bg-card/90 text-orange-600 border-0 gap-1 text-xs h-8 font-semibold flex-1"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Invitar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Member avatars strip */}
          <div className="flex items-center gap-2 mt-4">
            <div className="flex -space-x-2">
              {household.members.slice(0, 5).map((m) => (
                <Avatar key={m.id} className="w-8 h-8 border-2 border-white/60 shrink-0">
                  <AvatarImage src={m.userAvatar ?? undefined} />
                  <AvatarFallback className="bg-orange-200 text-orange-800 text-xs font-bold">
                    {(m.displayName ?? m.userName ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
              {household.members.length > 5 && (
                <div className="w-8 h-8 rounded-full border-2 border-white/60 bg-card/20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">+{household.members.length - 5}</span>
                </div>
              )}
            </div>
            <span className="text-white/70 text-xs">
              {household.members.map((m) => m.displayName ?? m.userName ?? "?").slice(0, 3).join(", ")}
              {household.members.length > 3 ? " y más" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick access cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: "/app/menus",        label: "Menú semanal",       icon: "🍽️",  color: "from-orange-50 to-amber-50",   border: "border-orange-200",   text: "text-orange-700" },
          { href: "/app/shopping-list",label: "Lista de la compra", icon: "🛒",  color: "from-green-50 to-emerald-50",  border: "border-green-200",    text: "text-green-700" },
          { href: "/familia/calendario",label: "Calendario",        icon: "📅",  color: "from-blue-50 to-indigo-50",    border: "border-blue-200",     text: "text-blue-700" },
          { href: "/familia/mis-recetas",label: "Mis recetas",      icon: "📖",  color: "from-purple-50 to-violet-50",  border: "border-purple-200",   text: "text-purple-700" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <div className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${link.color} border ${link.border} hover:shadow-md transition-all cursor-pointer group min-h-[90px]`}>
              <span className="text-3xl">{link.icon}</span>
              <span className={`text-xs font-semibold ${link.text} text-center leading-tight`}>{link.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Members ─────────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" /> Miembros del hogar
          </h2>
          {isOwnerOrAdmin && (
            <Button size="sm" variant="outline" onClick={() => setShowInvite(true)} className="gap-1 h-7 text-xs">
              <UserPlus className="w-3.5 h-3.5" /> Añadir
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {household.members.map((member) => {
            const isMe = member.userId === user.id;
            const restrictions: string[] = member.dietaryRestrictions ?? [];
            const prefs = member.preferences as { goal?: string; calories?: number } | null;
            const memberType = (member as { memberType?: string }).memberType;

            return (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                  isMe
                    ? "bg-orange-50 border-orange-200 shadow-sm"
                    : "bg-card border-border/60 hover:border-border hover:shadow-sm"
                }`}
              >
                {/* Avatar */}
                <Avatar className="w-12 h-12 shrink-0">
                  <AvatarImage src={member.userAvatar ?? undefined} />
                  <AvatarFallback className={`font-bold text-base ${
                    isMe ? "bg-orange-200 text-orange-800" : "bg-muted text-muted-foreground"
                  }`}>
                    {(member.displayName ?? member.userName ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="font-semibold text-sm text-foreground truncate max-w-[140px]">
                      {member.displayName ?? member.userName ?? "Sin nombre"}
                    </span>
                    {isMe && (
                      <span className="text-[10px] font-semibold bg-orange-100 text-orange-700 rounded-full px-1.5 py-0.5">Tú</span>
                    )}
                    <RoleBadge role={member.role} />
                    {memberType === "child" && (
                      <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                        <User className="w-2.5 h-2.5" /> Niño
                      </span>
                    )}
                    {memberType === "baby" && (
                      <span className="text-[10px] font-semibold bg-pink-100 text-pink-700 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
                        <Baby className="w-2.5 h-2.5" /> Bebé
                      </span>
                    )}
                  </div>
                  {member.userEmail && (
                    <p className="text-xs text-muted-foreground truncate">{member.userEmail}</p>
                  )}
                  {(restrictions.length > 0 || prefs?.goal) && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {prefs?.goal && (
                        <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          {GOAL_OPTIONS.find((o) => o.value === prefs.goal)?.label ?? prefs.goal}
                          {prefs.calories ? ` · ${prefs.calories} kcal` : ""}
                        </span>
                      )}
                      {restrictions.slice(0, 3).map((r) => (
                        <span key={r} className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          {DIETARY_OPTIONS.find((o) => o.id === r)?.label ?? r}
                        </span>
                      ))}
                      {restrictions.length > 3 && (
                        <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                          +{restrictions.length - 3} más
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {(isMe || (isOwnerOrAdmin && member.role !== "owner")) && (
                  <button
                    onClick={() => {
                      if (confirm(isMe ? "¿Salir del hogar?" : `¿Eliminar a ${member.displayName ?? member.userName}?`)) {
                        removeMember.mutate({ memberId: member.id });
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1 rounded-lg hover:bg-destructive/10"
                    aria-label={isMe ? "Salir del hogar" : "Eliminar miembro"}
                  >
                    {isMe ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Pending invitations ──────────────────────────────────────────── */}
      {household.pendingInvitations.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2 mb-3">
            <Mail className="w-4 h-4 text-orange-500" /> Invitaciones pendientes
          </h2>
          <div className="space-y-2">
            {household.pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-200 bg-amber-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{inv.invitedEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      Expira: {new Date(inv.expiresAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => cancelInvite.mutate({ invitationId: inv.id })}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1 rounded-lg hover:bg-destructive/10 ml-2"
                    aria-label="Cancelar invitación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Assigned Recipes Section ─────────────────────────────────────── */}
      {isOwnerOrAdmin && (
        <HouseholdAssignedRecipes
          householdId={household.id}
          members={household.members as Array<{ id: number; displayName: string | null; userName: string | null; userId: number; userAvatar?: string | null }>}
          isOwnerOrAdmin={isOwnerOrAdmin}
        />
      )}

      {/* ── Menús del Hogar por persona ─────────────────────────────── */}
      <HouseholdMenuPlans
        members={household.members.map(m => ({
          id: m.id,
          displayName: m.displayName,
          userName: m.userName,
          userId: m.userId,
          memberType: m.memberType,
        }))}
      />

      {/* Modals */}
      <FamilyMenuModal open={showFamilyMenu} onClose={() => setShowFamilyMenu(false)} />
      {editingMemberId !== null && (
        <EditMemberProfileModal
          open={editingMemberId !== null}
          memberId={editingMemberId}
          onClose={() => setEditingMemberId(null)}
        />
      )}
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} householdName={household?.name} />
      {myMember && (
        <MyPreferencesModal
          open={showPrefs}
          onClose={() => setShowPrefs(false)}
          currentPrefs={{
            displayName: myMember.displayName,
            dietaryRestrictions: myMember.dietaryRestrictions,
            allergies: myMember.allergies,
            preferences: myMember.preferences as { goal?: string; calories?: number } | undefined,
          }}
        />
      )}

      {/* Rename modal */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renombrar hogar</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="rename-input">Nuevo nombre</Label>
            <Input
              id="rename-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRename(false)}>Cancelar</Button>
            <Button
              onClick={() => updateName.mutate({ name: newName })}
              disabled={!newName.trim() || updateName.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {updateName.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
