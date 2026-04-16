import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  general: { label: "General", color: "bg-gray-100 text-gray-700", icon: "🍽️" },
  weight_loss: { label: "Pérdida de peso", color: "bg-green-100 text-green-700", icon: "📉" },
  muscle_gain: { label: "Ganancia muscular", color: "bg-blue-100 text-blue-700", icon: "💪" },
  maintenance: { label: "Mantenimiento", color: "bg-yellow-100 text-yellow-700", icon: "⚖️" },
  vegetarian: { label: "Vegetariano", color: "bg-emerald-100 text-emerald-700", icon: "🥦" },
  vegan: { label: "Vegano", color: "bg-teal-100 text-teal-700", icon: "🌱" },
  mediterranean: { label: "Mediterráneo", color: "bg-orange-100 text-orange-700", icon: "🫒" },
  diabetic: { label: "Diabético", color: "bg-purple-100 text-purple-700", icon: "🩺" },
};

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MEALS = [
  { key: "breakfast", label: "Desayuno", icon: "🌅" },
  { key: "lunch", label: "Comida", icon: "🍽️" },
  { key: "dinner", label: "Cena", icon: "🌙" },
  { key: "snack", label: "Snack", icon: "🍎" },
];

type WeekData = Record<string, Record<string, string>>;

const emptyWeekData = (): WeekData => {
  const data: WeekData = {};
  DAYS.forEach(day => {
    data[day] = {};
    MEALS.forEach(meal => {
      data[day][meal.key] = "";
    });
  });
  return data;
};

// ─── Componentes drag & drop ─────────────────────────────────────────────────
const QUICK_RECIPES = [
  "Avena con frutas", "Tostadas con aguacate", "Huevos revueltos", "Yogur con granola",
  "Ensalada de pollo", "Arroz con verduras", "Pasta integral", "Salmón al horno",
  "Pollo a la plancha", "Lentejas", "Gazpacho", "Tortilla española",
  "Fruta de temporada", "Frutos secos", "Batido proteico", "Queso con jamón",
];

function DraggableRecipe({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`px-2 py-1 rounded-lg text-xs font-medium cursor-grab select-none transition-all ${
        isDragging
          ? "opacity-50 scale-95"
          : "bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 hover:shadow-sm"
      }`}
    >
      {label}
    </div>
  );
}

function DroppableCell({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`relative rounded-lg transition-all ${
      isOver ? "ring-2 ring-orange-400 bg-orange-50" : ""
    }`}>
      <Input
        placeholder="—"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs h-8 px-2"
      />
    </div>
  );
}

export default function MenuTemplates() {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    // over.id format: "day__mealKey"
    const [day, mealKey] = (over.id as string).split("__");
    if (day && mealKey) {
      const recipeLabel = active.id as string;
      setWeekData(prev => ({
        ...prev,
        [day]: { ...prev[day], [mealKey]: recipeLabel },
      }));
    }
  };

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "general",
    targetCalories: "",
    isPublic: false,
  });
  const [weekData, setWeekData] = useState<WeekData>(emptyWeekData());

  const { data: templates, isLoading, refetch } = trpc.expertPatients.getMenuTemplates.useQuery(
    undefined,
    { enabled: !!user }
  );

  const createTemplateMutation = trpc.expertPatients.createMenuTemplate.useMutation({
    onSuccess: () => {
      toast.success("✅ Plantilla guardada correctamente");
      setShowCreateModal(false);
      setShowEditorModal(false);
      setTemplateForm({ name: "", description: "", category: "general", targetCalories: "", isPublic: false });
      setWeekData(emptyWeekData());
      setEditingTemplateId(null);
      refetch();
    },
    onError: () => toast.error("Error al guardar la plantilla"),
  });

  const deleteTemplateMutation = trpc.expertPatients.deleteMenuTemplate.useMutation({
    onSuccess: () => { toast.success("Plantilla eliminada"); refetch(); },
    onError: () => toast.error("Error al eliminar la plantilla"),
  });

  const filteredTemplates = (templates ?? []).filter(t => {
    const matchesSearch = !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || t.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSaveTemplate = () => {
    if (!templateForm.name.trim()) return;
    createTemplateMutation.mutate({
      name: templateForm.name.trim(),
      description: templateForm.description.trim() || undefined,
      category: templateForm.category,
      targetCalories: templateForm.targetCalories ? parseInt(templateForm.targetCalories) : undefined,
      weekData: JSON.stringify(weekData),
      isPublic: templateForm.isPublic,
    });
  };

  const handleOpenEditor = (template?: any) => {
    if (template) {
      setEditingTemplateId(template.id);
      setTemplateForm({
        name: template.name,
        description: template.description || "",
        category: template.category || "general",
        targetCalories: template.targetCalories?.toString() || "",
        isPublic: template.isPublic,
      });
      try {
        setWeekData(JSON.parse(template.weekData) || emptyWeekData());
      } catch {
        setWeekData(emptyWeekData());
      }
    } else {
      setEditingTemplateId(null);
      setTemplateForm({ name: "", description: "", category: "general", targetCalories: "", isPublic: false });
      setWeekData(emptyWeekData());
    }
    setShowEditorModal(true);
  };

  if (!user) return null;

  return (
    <AppLayout showBack>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🗂️ Plantillas de Menús</h1>
            <p className="text-sm text-gray-500 mt-1">Crea plantillas reutilizables para asignar a tus pacientes con un clic</p>
          </div>
          <Button onClick={() => handleOpenEditor()} className="bg-orange-500 hover:bg-orange-600 text-white">
            + Nueva plantilla
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 mb-5 flex-wrap">
          <Input
            placeholder="Buscar plantillas..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lista de plantillas */}
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-3">🗂️</div>
            <p className="text-gray-500 font-medium text-lg">Sin plantillas de menús</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
              Crea plantillas para reutilizar menús completos con tus pacientes. Ahorra tiempo y mantén consistencia.
            </p>
            <Button onClick={() => handleOpenEditor()} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
              Crear primera plantilla
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const catInfo = CATEGORY_LABELS[template.category ?? "general"] ?? CATEGORY_LABELS.general;
              let weekDataParsed: WeekData = {};
              try { weekDataParsed = JSON.parse(template.weekData); } catch { /* empty */ }
              const totalMeals = Object.values(weekDataParsed).reduce((acc, day) =>
                acc + Object.values(day).filter(v => v.trim()).length, 0
              );

              return (
                <div key={template.id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-base">{template.name}</h3>
                      {template.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEditor(template)}
                        className="text-gray-400 hover:text-orange-600 transition-colors p-1 text-sm"
                        title="Editar"
                      >✏️</button>
                      <button
                        onClick={() => { if (confirm("¿Eliminar esta plantilla?")) deleteTemplateMutation.mutate({ templateId: template.id }); }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 text-sm"
                        title="Eliminar"
                      >🗑️</button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catInfo.color}`}>
                      {catInfo.icon} {catInfo.label}
                    </span>
                    {template.targetCalories && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                        🔥 {template.targetCalories} kcal
                      </span>
                    )}
                    {template.isPublic && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        🌐 Pública
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                    <span>{totalMeals} comidas definidas · {template.usageCount} usos</span>
                    <span>{new Date(template.createdAt).toLocaleDateString("es-ES")}</span>
                  </div>

                  {/* Preview de días */}
                  <div className="mt-3 grid grid-cols-7 gap-0.5">
                    {DAYS.map(day => {
                      const dayData = weekDataParsed[day] || {};
                      const mealsCount = Object.values(dayData).filter(v => v.trim()).length;
                      return (
                        <div key={day} className="text-center">
                          <div className="text-xs text-gray-400">{day.slice(0, 2)}</div>
                          <div className={`w-full h-1.5 rounded-full mt-0.5 ${
                            mealsCount >= 4 ? 'bg-green-400' :
                            mealsCount >= 2 ? 'bg-yellow-400' :
                            mealsCount >= 1 ? 'bg-orange-300' :
                            'bg-gray-200'
                          }`} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Editor de plantilla */}
      <Dialog open={showEditorModal} onOpenChange={setShowEditorModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplateId ? "✏️ Editar plantilla" : "🗂️ Nueva plantilla de menú"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Datos básicos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nombre de la plantilla *</Label>
                <Input
                  placeholder="Ej: Menú hipocalórico 1500 kcal"
                  value={templateForm.name}
                  onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select value={templateForm.category} onValueChange={v => setTemplateForm(prev => ({ ...prev, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.icon} {val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Descripción (opcional)</Label>
                <Textarea
                  placeholder="Para qué tipo de paciente es este menú..."
                  value={templateForm.description}
                  onChange={e => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1" rows={2}
                />
              </div>
              <div>
                <Label>Calorías objetivo (kcal)</Label>
                <Input
                  type="number"
                  placeholder="1500"
                  value={templateForm.targetCalories}
                  onChange={e => setTemplateForm(prev => ({ ...prev, targetCalories: e.target.value }))}
                  className="mt-1"
                />
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    id="template-public"
                    checked={templateForm.isPublic}
                    onChange={e => setTemplateForm(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="template-public" className="cursor-pointer text-sm">🌐 Plantilla pública (visible para otros expertos)</Label>
                </div>
              </div>
            </div>

            {/* Editor semanal drag & drop */}
            <div>
              <Label className="text-base font-semibold">📅 Editor semanal (drag & drop)</Label>
              <p className="text-xs text-gray-400 mt-0.5 mb-2">Arrastra recetas rápidas a las celdas o escribe directamente</p>
              {/* Recetas rápidas para arrastrar */}
              <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="mb-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <p className="text-xs font-semibold text-orange-700 mb-2">🍽️ Recetas rápidas — arrastra a la tabla</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_RECIPES.map(recipe => (
                      <DraggableRecipe key={recipe} id={recipe} label={recipe} />
                    ))}
                  </div>
                </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left py-2 pr-3 text-gray-500 font-medium w-24">Comida</th>
                      {DAYS.map(day => (
                        <th key={day} className="text-center py-2 px-1 text-gray-500 font-medium text-xs">{day.slice(0, 3)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MEALS.map(meal => (
                      <tr key={meal.key} className="border-t border-gray-100">
                        <td className="py-2 pr-3">
                          <span className="text-xs font-medium text-gray-600">{meal.icon} {meal.label}</span>
                        </td>
                        {DAYS.map(day => (
                          <td key={day} className="py-1 px-1">
                            <DroppableCell
                              id={`${day}__${meal.key}`}
                              value={weekData[day]?.[meal.key] || ""}
                              onChange={v => setWeekData(prev => ({
                                ...prev,
                                [day]: { ...prev[day], [meal.key]: v }
                              }))}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <DragOverlay>
                {activeDragId ? (
                  <div className="px-2 py-1 rounded-lg text-xs font-medium bg-orange-500 text-white shadow-lg">
                    {activeDragId}
                  </div>
                ) : null}
              </DragOverlay>
              </DndContext>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditorModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateForm.name.trim() || createTemplateMutation.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {createTemplateMutation.isPending ? "Guardando..." : editingTemplateId ? "Actualizar plantilla" : "Guardar plantilla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
