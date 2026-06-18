import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Trash2,
  Send,
  Copy,
  ChevronLeft,
  Search,
  UtensilsCrossed,
  Calendar,
  X,
  Flame,
  Dumbbell,
  Wheat,
  Droplets,
  BookOpen,
  ChevronRight,
  LayoutTemplate,
  FolderOpen,
  Star,
} from "lucide-react";

// ─── Constantes ───────────────────────────────────────────────────────────────
const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MEAL_TIMES = [
  { key: "desayuno", label: "Desayuno", emoji: "🌅" },
  { key: "media_manana", label: "Media mañana", emoji: "🍎" },
  { key: "comida", label: "Comida", emoji: "🍽️" },
  { key: "merienda", label: "Merienda", emoji: "☕" },
  { key: "cena", label: "Cena", emoji: "🌙" },
] as const;

type MealTime = typeof MEAL_TIMES[number]["key"];

interface SlotData {
  id: number;
  weeklyPlanId: number;
  dayOfWeek: number;
  mealTime: MealTime;
  recipeId?: number | null;
  customName?: string | null;
  customCalories?: number | null;
  servings?: number | null;
  notes?: string | null;
  recipe?: {
    id: number;
    name: string;
    calories?: number | null;
    protein?: number | null;
    carbs?: number | null;
    fat?: number | null;
    imageUrl?: string | null;
    mealTime?: string | null;
  };
}

// ─── Componente: Tarjeta de receta draggable (panel lateral) ──────────────────
function DraggableRecipeCard({ recipe }: { recipe: { id: number; name: string; calories?: number | null; mealTime?: string | null; imageUrl?: string | null } }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { type: "recipe", recipe },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`p-2 rounded-lg border cursor-grab active:cursor-grabbing select-none transition-all ${
        isDragging ? "opacity-40 scale-95" : "hover:border-orange-400 hover:bg-orange-50"
      } bg-white border-gray-200`}
    >
      <div className="flex items-center gap-2">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-4 h-4 text-orange-400" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-800 truncate">{recipe.name}</p>
          {recipe.calories && (
            <p className="text-xs text-gray-400">{recipe.calories} kcal</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Componente: Slot droppable en el grid ────────────────────────────────────
function DroppableSlot({
  day,
  mealTime,
  slots,
  onRemoveSlot,
  onAddCustom,
}: {
  day: number;
  mealTime: MealTime;
  slots: SlotData[];
  onRemoveSlot: (slotId: number, planId: number) => void;
  onAddCustom: (day: number, mealTime: MealTime) => void;
}) {
  const dropId = `slot-${day}-${mealTime}`;
  const { isOver, setNodeRef } = useDroppable({ id: dropId, data: { day, mealTime } });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] rounded-lg p-1 transition-colors ${
        isOver ? "bg-orange-100 border-2 border-orange-400 border-dashed" : "bg-gray-50 border border-gray-100"
      }`}
    >
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="group relative flex items-start gap-1 p-1.5 mb-1 rounded bg-white border border-gray-200 hover:border-orange-300 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-800 truncate leading-tight">
              {slot.recipe?.name ?? slot.customName ?? "Sin nombre"}
            </p>
            {(slot.recipe?.calories ?? slot.customCalories) && (
              <p className="text-xs text-gray-400">
                {slot.recipe?.calories ?? slot.customCalories} kcal
                {slot.servings && slot.servings !== 1 ? ` × ${slot.servings}` : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => onRemoveSlot(slot.id, slot.weeklyPlanId)}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-100 transition-all flex-shrink-0"
          >
            <X className="w-3 h-3 text-red-400" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onAddCustom(day, mealTime)}
        className="w-full text-xs text-gray-300 hover:text-orange-400 py-1 transition-colors flex items-center justify-center gap-1"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ExpertMealPlanner() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  // Estado del planificador
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showCustomSlotModal, setShowCustomSlotModal] = useState(false);
  const [customSlotTarget, setCustomSlotTarget] = useState<{ day: number; mealTime: MealTime } | null>(null);
  const [activeRecipe, setActiveRecipe] = useState<{ id: number; name: string; calories?: number | null } | null>(null);

  // Formulario nuevo plan
  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [newPlanPatientId, setNewPlanPatientId] = useState<string>("");
  const [newPlanNotes, setNewPlanNotes] = useState("");

  // Formulario slot personalizado
  const [customName, setCustomName] = useState("");
  const [customCalories, setCustomCalories] = useState("");
  const [customNotes, setCustomNotes] = useState("");

  // Formulario envío
  const [sendPatientId, setSendPatientId] = useState<string>("");
  const [sendMessage, setSendMessage] = useState("");

  // Búsqueda de recetas
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeMealFilter, setRecipeMealFilter] = useState<string>("all");

  // Plantillas
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [applyTemplateId, setApplyTemplateId] = useState<number | null>(null);
  const [applyPatientId, setApplyPatientId] = useState<string>("");
  const [applyWeekDate, setApplyWeekDate] = useState("");
  const [applyPlanTitle, setApplyPlanTitle] = useState("");

  // Sensores drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ─── Queries ───────────────────────────────────────────────────────────────
  const { data: plans = [] } = trpc.expertMealPlanner.listPlans.useQuery({});
  const { data: templates = [] } = trpc.expertMealPlanner.listTemplates.useQuery();
  const { data: planData } = trpc.expertMealPlanner.getPlan.useQuery(
    { planId: selectedPlanId! },
    { enabled: !!selectedPlanId }
  );
  const { data: myRecipes = [] } = trpc.expertRecipes.listRecipes.useQuery({});
  const { data: patients = [] } = trpc.offlinePatients.list.useQuery();

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const createPlan = trpc.expertMealPlanner.createPlan.useMutation({
    onSuccess: (plan) => {
      utils.expertMealPlanner.listPlans.invalidate();
      setSelectedPlanId(plan.id);
      setShowNewPlanModal(false);
      setNewPlanTitle("");
      setNewPlanPatientId("");
      setNewPlanNotes("");
      toast({ title: "Plan creado", description: plan.title });
    },
  });

  const deletePlan = trpc.expertMealPlanner.deletePlan.useMutation({
    onSuccess: () => {
      utils.expertMealPlanner.listPlans.invalidate();
      setSelectedPlanId(null);
      toast({ title: "Plan eliminado" });
    },
  });

  const addSlot = trpc.expertMealPlanner.addSlot.useMutation({
    onSuccess: () => {
      if (selectedPlanId) utils.expertMealPlanner.getPlan.invalidate({ planId: selectedPlanId });
    },
  });

  const removeSlot = trpc.expertMealPlanner.removeSlot.useMutation({
    onSuccess: () => {
      if (selectedPlanId) utils.expertMealPlanner.getPlan.invalidate({ planId: selectedPlanId });
    },
  });

  const moveSlot = trpc.expertMealPlanner.moveSlot.useMutation({
    onSuccess: () => {
      if (selectedPlanId) utils.expertMealPlanner.getPlan.invalidate({ planId: selectedPlanId });
    },
  });

  const duplicatePlan = trpc.expertMealPlanner.duplicatePlan.useMutation({
    onSuccess: (plan) => {
      utils.expertMealPlanner.listPlans.invalidate();
      setSelectedPlanId(plan.id);
      toast({ title: "Plan duplicado", description: plan.title });
    },
  });

  const saveAsTemplate = trpc.expertMealPlanner.saveAsTemplate.useMutation({
    onSuccess: () => {
      utils.expertMealPlanner.listTemplates.invalidate();
      setShowSaveTemplateModal(false);
      setTemplateName("");
      setTemplateDescription("");
      toast({ title: "✅ Plantilla guardada", description: "Puedes reutilizarla con cualquier paciente desde el botón Plantillas" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const applyTemplate = trpc.expertMealPlanner.applyTemplate.useMutation({
    onSuccess: (newPlan) => {
      utils.expertMealPlanner.listPlans.invalidate();
      setShowTemplatesModal(false);
      setApplyTemplateId(null);
      setApplyPatientId("");
      setApplyWeekDate("");
      setApplyPlanTitle("");
      setSelectedPlanId(newPlan.id);
      toast({ title: "✅ Plantilla aplicada", description: `Plan "${newPlan.title}" creado` });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTemplate = trpc.expertMealPlanner.deleteTemplate.useMutation({
    onSuccess: () => utils.expertMealPlanner.listTemplates.invalidate(),
  });

  const sendPlan = trpc.expertMealPlanner.sendPlanByEmail.useMutation({
    onSuccess: () => {
      setShowSendModal(false);
      toast({ title: "Plan enviado", description: "El menú semanal ha sido enviado al paciente por email" });
    },
    onError: (e) => toast({ title: "Error al enviar", description: e.message, variant: "destructive" }),
  });

  // ─── Drag & Drop handlers ──────────────────────────────────────────────────
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "recipe") {
      setActiveRecipe(data.recipe);
    } else if (data?.type === "slot") {
      setActiveRecipe({ id: data.slot.id, name: data.slot.recipe?.name ?? data.slot.customName ?? "" });
    }
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveRecipe(null);
    const { active, over } = event;
    if (!over || !selectedPlanId) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!overData?.day === undefined || !overData?.mealTime) return;

    const targetDay: number = overData.day;
    const targetMealTime: MealTime = overData.mealTime;

    if (activeData?.type === "recipe") {
      // Soltar receta del panel lateral en un slot del grid
      addSlot.mutate({
        weeklyPlanId: selectedPlanId,
        dayOfWeek: targetDay,
        mealTime: targetMealTime,
        recipeId: activeData.recipe.id,
        servings: 1,
      });
    } else if (activeData?.type === "slot") {
      // Mover slot existente a otro día/momento
      const slot: SlotData = activeData.slot;
      if (slot.dayOfWeek !== targetDay || slot.mealTime !== targetMealTime) {
        moveSlot.mutate({
          slotId: slot.id,
          weeklyPlanId: selectedPlanId,
          newDayOfWeek: targetDay,
          newMealTime: targetMealTime,
        });
      }
    }
  }, [selectedPlanId, addSlot, moveSlot]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleRemoveSlot = (slotId: number, planId: number) => {
    removeSlot.mutate({ slotId, weeklyPlanId: planId });
  };

  const handleAddCustomSlot = (day: number, mealTime: MealTime) => {
    setCustomSlotTarget({ day, mealTime });
    setCustomName("");
    setCustomCalories("");
    setCustomNotes("");
    setShowCustomSlotModal(true);
  };

  const handleSaveCustomSlot = () => {
    if (!selectedPlanId || !customSlotTarget || !customName.trim()) return;
    addSlot.mutate({
      weeklyPlanId: selectedPlanId,
      dayOfWeek: customSlotTarget.day,
      mealTime: customSlotTarget.mealTime,
      customName: customName.trim(),
      customCalories: customCalories ? parseInt(customCalories) : undefined,
      notes: customNotes || undefined,
    });
    setShowCustomSlotModal(false);
  };

  // ─── Filtrar recetas ────────────────────────────────────────────────────────
  const filteredRecipes = myRecipes.filter((r: { name: string; mealTime?: string | null }) => {
    const matchSearch = !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase());
    const matchMeal = recipeMealFilter === "all" || r.mealTime === recipeMealFilter;
    return matchSearch && matchMeal;
  });

  // ─── Grid del planificador ─────────────────────────────────────────────────
  const grid = planData?.grid ?? {};

  const getSlotsForCell = (day: number, mealTime: MealTime): SlotData[] => {
    return (grid[day]?.[mealTime] ?? []) as SlotData[];
  };

  // ─── Macros totales del plan ───────────────────────────────────────────────
  const plan = planData?.plan;

  return (
    <AppLayout>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex h-[calc(100vh-64px)] overflow-hidden">
          {/* ── Panel izquierdo: lista de planes ─────────────────────────── */}
          <div className="w-56 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">Mis planes</h3>
                <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  title="Mis plantillas"
                  className="h-6 w-6 p-0 text-purple-500 hover:bg-purple-50"
                  onClick={() => setShowTemplatesModal(true)}
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-orange-500 hover:bg-orange-50"
                  onClick={() => setShowNewPlanModal(true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {plans.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Sin planes</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 text-orange-500 text-xs"
                    onClick={() => setShowNewPlanModal(true)}
                  >
                    Crear plan
                  </Button>
                </div>
              ) : (
                plans.map((p: { id: number; title: string; totalCalories?: number | null; offlinePatientId?: number | null }) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlanId(p.id)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                      selectedPlanId === p.id
                        ? "bg-orange-50 border border-orange-200 text-orange-700"
                        : "hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <p className="font-medium truncate">{p.title}</p>
                    {p.totalCalories && (
                      <p className="text-gray-400 mt-0.5">{p.totalCalories} kcal/día</p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* ── Panel central: grid semanal ───────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedPlanId ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-400 mb-2">Planificador semanal</h2>
                  <p className="text-gray-400 text-sm mb-6 max-w-sm">
                    Crea un plan semanal y arrastra tus recetas guardadas al grid para armar el menú de tu paciente.
                  </p>
                  <Button
                    onClick={() => setShowNewPlanModal(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear primer plan
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Header del plan */}
                <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-800 truncate">{plan?.title}</h2>
                    {plan && (
                      <div className="flex items-center gap-3 mt-0.5">
                        {plan.totalCalories && (
                          <span className="flex items-center gap-1 text-xs text-orange-500">
                            <Flame className="w-3 h-3" /> {plan.totalCalories} kcal/día
                          </span>
                        )}
                        {plan.totalProtein && (
                          <span className="flex items-center gap-1 text-xs text-blue-500">
                            <Dumbbell className="w-3 h-3" /> {plan.totalProtein}g prot
                          </span>
                        )}
                        {plan.totalCarbs && (
                          <span className="flex items-center gap-1 text-xs text-yellow-500">
                            <Wheat className="w-3 h-3" /> {plan.totalCarbs}g carbs
                          </span>
                        )}
                        {plan.totalFat && (
                          <span className="flex items-center gap-1 text-xs text-green-500">
                            <Droplets className="w-3 h-3" /> {plan.totalFat}g grasas
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setTemplateName(plan?.title ? `${plan.title} — plantilla` : "");
                        setTemplateDescription("");
                        setShowSaveTemplateModal(true);
                      }}
                      className="text-xs h-8 text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      <Star className="w-3 h-3 mr-1" />
                      Guardar plantilla
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => duplicatePlan.mutate({ planId: selectedPlanId, newTitle: `${plan?.title} (copia)` })}
                      className="text-xs h-8"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Duplicar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowSendModal(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8"
                    >
                      <Send className="w-3 h-3 mr-1" />
                      Enviar al paciente
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("¿Eliminar este plan?")) deletePlan.mutate({ planId: selectedPlanId });
                      }}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Grid semanal */}
                <div className="flex-1 overflow-auto p-3">
                  <div className="min-w-[900px]">
                    {/* Cabecera de días */}
                    <div className="grid grid-cols-8 gap-1 mb-2">
                      <div className="w-24" />
                      {DAYS.map((day) => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Filas de momentos del día */}
                    {MEAL_TIMES.map(({ key, label, emoji }) => (
                      <div key={key} className="grid grid-cols-8 gap-1 mb-1">
                        {/* Etiqueta del momento */}
                        <div className="w-24 flex items-start pt-2">
                          <div className="text-right w-full">
                            <span className="text-sm">{emoji}</span>
                            <p className="text-xs font-medium text-gray-500 leading-tight">{label}</p>
                          </div>
                        </div>
                        {/* Slots para cada día */}
                        {DAYS.map((_, dayIdx) => (
                          <DroppableSlot
                            key={`${dayIdx}-${key}`}
                            day={dayIdx}
                            mealTime={key}
                            slots={getSlotsForCell(dayIdx, key)}
                            onRemoveSlot={handleRemoveSlot}
                            onAddCustom={handleAddCustomSlot}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Panel derecho: recetas guardadas ──────────────────────────── */}
          <div className="w-56 flex-shrink-0 border-l border-gray-100 bg-white flex flex-col">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-1 mb-2">
                <BookOpen className="w-4 h-4 text-orange-400" />
                <h3 className="text-sm font-semibold text-gray-700">Mis recetas</h3>
              </div>
              <div className="relative mb-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  className="pl-6 h-7 text-xs"
                />
              </div>
              <Select value={recipeMealFilter} onValueChange={setRecipeMealFilter}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {MEAL_TIMES.map(({ key, label }) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredRecipes.length === 0 ? (
                <div className="text-center py-6">
                  <UtensilsCrossed className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Sin recetas</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1 text-orange-500 text-xs"
                    onClick={() => navigate("/app/expert/recipes")}
                  >
                    Añadir recetas
                  </Button>
                </div>
              ) : (
                filteredRecipes.map((recipe: { id: number; name: string; calories?: number | null; mealTime?: string | null; imageUrl?: string | null }) => (
                  <DraggableRecipeCard key={recipe.id} recipe={recipe} />
                ))
              )}
            </div>
            <div className="p-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                Arrastra las recetas al grid
              </p>
            </div>
          </div>
        </div>

        {/* ── Drag Overlay ──────────────────────────────────────────────────── */}
        <DragOverlay>
          {activeRecipe && (
            <div className="p-2 rounded-lg border border-orange-400 bg-white shadow-lg opacity-90 w-48">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <UtensilsCrossed className="w-4 h-4 text-orange-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{activeRecipe.name}</p>
                  {activeRecipe.calories && (
                    <p className="text-xs text-gray-400">{activeRecipe.calories} kcal</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ── Modal: Nuevo plan ──────────────────────────────────────────────── */}
      <Dialog open={showNewPlanModal} onOpenChange={setShowNewPlanModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo plan semanal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre del plan *</label>
              <Input
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                placeholder="Ej: Plan semana 1 - Pérdida de peso"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Paciente (opcional)</label>
              <Select value={newPlanPatientId} onValueChange={setNewPlanPatientId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin paciente (plantilla)</SelectItem>
                  {patients.map((p: { id: number; name: string }) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notas</label>
              <Textarea
                value={newPlanNotes}
                onChange={(e) => setNewPlanNotes(e.target.value)}
                placeholder="Observaciones del plan..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPlanModal(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!newPlanTitle.trim()) return;
                createPlan.mutate({
                  title: newPlanTitle.trim(),
                  offlinePatientId: newPlanPatientId && newPlanPatientId !== "none" ? parseInt(newPlanPatientId) : undefined,
                  notes: newPlanNotes || undefined,
                });
              }}
              disabled={!newPlanTitle.trim() || createPlan.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createPlan.isPending ? "Creando..." : "Crear plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Slot personalizado ──────────────────────────────────────── */}
      <Dialog open={showCustomSlotModal} onOpenChange={setShowCustomSlotModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Añadir comida personalizada</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre *</label>
              <Input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ej: Yogur con fruta"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Calorías (opcional)</label>
              <Input
                type="number"
                value={customCalories}
                onChange={(e) => setCustomCalories(e.target.value)}
                placeholder="Ej: 200"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Notas</label>
              <Input
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Instrucciones adicionales..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomSlotModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveCustomSlot}
              disabled={!customName.trim() || addSlot.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Añadir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Guardar como plantilla ──────────────────────────────────── */}
      <Dialog open={showSaveTemplateModal} onOpenChange={setShowSaveTemplateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-purple-500" />
              Guardar como plantilla
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Guarda este menú semanal como plantilla para reutilizarlo fácilmente con otros pacientes.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Nombre de la plantilla *</label>
              <Input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Ej: Menú pérdida de peso — semana tipo"
                className="mt-1"
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Descripción (opcional)</label>
              <Textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Para qué tipo de paciente es este menú..."
                rows={2}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplateModal(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!selectedPlanId || !templateName.trim()) return;
                saveAsTemplate.mutate({
                  planId: selectedPlanId,
                  templateName: templateName.trim(),
                  description: templateDescription || undefined,
                });
              }}
              disabled={!templateName.trim() || saveAsTemplate.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {saveAsTemplate.isPending ? "Guardando..." : "Guardar plantilla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Mis plantillas ──────────────────────────────────────────── */}
      <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-purple-500" />
              Mis plantillas de menú
            </DialogTitle>
          </DialogHeader>
          {(templates as Array<{ id: number; title: string; description?: string | null; slotCount: number; totalCalories?: number | null; createdAt: Date }>).length === 0 ? (
            <div className="text-center py-10">
              <LayoutTemplate className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aún no tienes plantillas guardadas</p>
              <p className="text-sm text-gray-400 mt-1">
                Crea un plan semanal y usa el botón <strong>"Guardar plantilla"</strong> para guardarlo aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {!applyTemplateId ? (
                (templates as Array<{ id: number; title: string; description?: string | null; slotCount: number; totalCalories?: number | null; createdAt: Date }>).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <LayoutTemplate className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{t.slotCount} comidas</span>
                        {t.totalCalories && <span className="text-xs text-orange-400">{t.totalCalories} kcal/día</span>}
                        {t.description && <span className="text-xs text-gray-400 truncate">· {t.description}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => {
                          setApplyTemplateId(t.id);
                          setApplyPlanTitle(t.title);
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-7"
                      >
                        Usar plantilla
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`¿Eliminar la plantilla "${t.title}"?`)) deleteTemplate.mutate({ templateId: t.id });
                        }}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-3 p-1">
                  <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => setApplyTemplateId(null)} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Volver
                    </button>
                    <p className="text-sm font-medium text-gray-700">Aplicar plantilla a paciente</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Nombre del plan *</label>
                    <Input
                      value={applyPlanTitle}
                      onChange={(e) => setApplyPlanTitle(e.target.value)}
                      placeholder="Ej: Semana 1 — María García"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Paciente *</label>
                    <Select value={applyPatientId} onValueChange={setApplyPatientId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Seleccionar paciente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(patients as Array<{ id: number; name: string }>).map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Semana de inicio (opcional)</label>
                    <Input
                      type="date"
                      value={applyWeekDate}
                      onChange={(e) => setApplyWeekDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setApplyTemplateId(null)}>Cancelar</Button>
                    <Button
                      onClick={() => {
                        if (!applyTemplateId || !applyPatientId || !applyPlanTitle.trim()) return;
                        applyTemplate.mutate({
                          templateId: applyTemplateId,
                          offlinePatientId: parseInt(applyPatientId),
                          weekStartDate: applyWeekDate || new Date().toISOString().split("T")[0],
                          planTitle: applyPlanTitle.trim(),
                        });
                      }}
                      disabled={!applyPatientId || !applyPlanTitle.trim() || applyTemplate.isPending}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {applyTemplate.isPending ? "Creando plan..." : "Crear plan desde plantilla"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Enviar plan ─────────────────────────────────────────────── */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar plan al paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Paciente *</label>
              <Select value={sendPatientId} onValueChange={setSendPatientId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Seleccionar paciente..." />
                </SelectTrigger>
                <SelectContent>
                  {patients
                    .filter((p: { email?: string | null }) => p.email)
                    .map((p: { id: number; name: string; email?: string | null }) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} — {p.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {patients.filter((p: { email?: string | null }) => !p.email).length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  Solo se muestran pacientes con email registrado
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Mensaje personalizado (opcional)</label>
              <Textarea
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                placeholder="Añade un mensaje personal para tu paciente..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendModal(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!sendPatientId || !selectedPlanId) return;
                sendPlan.mutate({
                  planId: selectedPlanId,
                  offlinePatientId: parseInt(sendPatientId),
                  customMessage: sendMessage || undefined,
                });
              }}
              disabled={!sendPatientId || sendPlan.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {sendPlan.isPending ? "Enviando..." : "Enviar por email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
