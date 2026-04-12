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
  ChefHat, Search, Plus, Clock, Flame, CheckCircle2, Circle, BookOpen
} from "lucide-react";


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

// ─── Upsell screen for non-Pro Max users ────────────────────────────────────────────────
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
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-6">
        <Home className="w-10 h-10 text-orange-500" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">Crea tu hogar familiar</h2>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        Comparte el menú semanal y la lista de la compra con toda tu familia. Cada miembro puede tener sus propias preferencias y restricciones dietéticas.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-lg w-full">
        {[
          { icon: "🍽️", title: "Menú compartido", desc: "Planifica las comidas de toda la familia" },
          { icon: "🛒", title: "Lista unificada", desc: "Una sola lista de la compra para todos" },
          { icon: "🥗", title: "Preferencias propias", desc: "Cada miembro con sus restricciones" },
        ].map((f) => (
          <div key={f.title} className="bg-card border rounded-xl p-4 text-center">
            <div className="text-3xl mb-2">{f.icon}</div>
            <p className="font-semibold text-sm text-foreground">{f.title}</p>
            <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
      <Button onClick={onCreate} size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
        <Home className="w-5 h-5" /> Crear mi hogar
      </Button>
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
function InviteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
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
    onClose();
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
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Recibirán un email con un enlace para unirse. El enlace expira en 7 días.
              </p>
            </div>
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
    <div className="container max-w-3xl py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-5 h-5 text-orange-500" />
            <h1 className="text-2xl font-bold text-foreground">{household.name}</h1>
            {isOwnerOrAdmin && (
              <button
                onClick={() => { setNewName(household.name); setShowRename(true); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Renombrar hogar"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {household.members.length} miembro{household.members.length !== 1 ? "s" : ""}
            {household.pendingInvitations.length > 0 && (
              <span className="ml-2 text-orange-500">
                · {household.pendingInvitations.length} invitación{household.pendingInvitations.length !== 1 ? "es" : ""} pendiente{household.pendingInvitations.length !== 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPrefs(true)}
            className="gap-1"
          >
            <Settings className="w-4 h-4" /> Mis preferencias
          </Button>
          {isOwnerOrAdmin && (
            <Button
              size="sm"
              onClick={() => setShowInvite(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white gap-1"
            >
              <UserPlus className="w-4 h-4" /> Invitar
            </Button>
          )}
        </div>
      </div>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-500" /> Miembros del hogar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {household.members.map((member) => {
            const isMe = member.userId === user.id;
            const restrictions: string[] = member.dietaryRestrictions ?? [];
            const prefs = member.preferences as { goal?: string; calories?: number } | null;

            return (
              <div
                key={member.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
              >
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={member.userAvatar ?? undefined} />
                  <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                    {(member.displayName ?? member.userName ?? "?")[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground truncate">
                      {member.displayName ?? member.userName ?? "Sin nombre"}
                    </span>
                    {isMe && <Badge variant="outline" className="text-xs">Tú</Badge>}
                    <RoleBadge role={member.role} />
                  </div>
                  {member.userEmail && (
                    <p className="text-xs text-muted-foreground mt-0.5">{member.userEmail}</p>
                  )}
                  {restrictions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {restrictions.slice(0, 4).map((r) => (
                        <Badge key={r} variant="secondary" className="text-xs py-0">
                          {DIETARY_OPTIONS.find((o) => o.id === r)?.label ?? r}
                        </Badge>
                      ))}
                      {restrictions.length > 4 && (
                        <Badge variant="secondary" className="text-xs py-0">
                          +{restrictions.length - 4} más
                        </Badge>
                      )}
                    </div>
                  )}
                  {prefs?.goal && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Objetivo: {GOAL_OPTIONS.find((o) => o.value === prefs.goal)?.label ?? prefs.goal}
                      {prefs.calories ? ` · ${prefs.calories} kcal/día` : ""}
                    </p>
                  )}
                </div>
                {(isMe || (isOwnerOrAdmin && member.role !== "owner")) && (
                  <button
                    onClick={() => {
                      if (confirm(isMe ? "¿Salir del hogar?" : `¿Eliminar a ${member.displayName ?? member.userName}?`)) {
                        removeMember.mutate({ memberId: member.id });
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0 mt-1"
                    aria-label={isMe ? "Salir del hogar" : "Eliminar miembro"}
                  >
                    {isMe ? <LogOut className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {household.pendingInvitations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="w-4 h-4 text-orange-500" /> Invitaciones pendientes
            </CardTitle>
            <CardDescription>Esperando que acepten la invitación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {household.pendingInvitations.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Mail className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{inv.invitedEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      Expira: {new Date(inv.expiresAt).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                </div>
                {isOwnerOrAdmin && (
                  <button
                    onClick={() => cancelInvite.mutate({ invitationId: inv.id })}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Cancelar invitación"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Assigned Recipes Section */}
      {isOwnerOrAdmin && (
        <HouseholdAssignedRecipes
          householdId={household.id}
          members={household.members}
          isOwnerOrAdmin={isOwnerOrAdmin}
        />
      )}

      {/* Quick links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Accesos rápidos del hogar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { href: "/menu", label: "Menú semanal compartido", icon: "🍽️" },
            { href: "/lista-compra", label: "Lista de la compra del hogar", icon: "🛒" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/60 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{link.icon}</span>
                  <span className="font-medium text-foreground">{link.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Modals */}
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
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
