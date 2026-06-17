import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Plus, Search, BookOpen, ChefHat, Clock, Flame, Filter,
  Edit2, Trash2, FolderPlus, Folder, X, Send, Eye,
  UtensilsCrossed, Star, Users, ChevronRight
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Ingredient { name: string; amount?: string; unit?: string }
interface Instruction { step?: number; text: string }

interface RecipeFormData {
  name: string;
  description: string;
  preparationTime: number;
  cookTime: number;
  servings: number;
  difficulty: "easy" | "medium" | "hard";
  mealTime: "desayuno" | "media_manana" | "comida" | "merienda" | "cena" | "cualquiera";
  category: string;
  caloriesPerServing: number;
  proteinsPerServing: number;
  carbsPerServing: number;
  fatsPerServing: number;
  ingredients: Ingredient[];
  instructions: Instruction[];
  isPublic: boolean;
}

const EMPTY_FORM: RecipeFormData = {
  name: "", description: "", preparationTime: 0, cookTime: 0,
  servings: 1, difficulty: "medium", mealTime: "cualquiera",
  category: "", caloriesPerServing: 0, proteinsPerServing: 0,
  carbsPerServing: 0, fatsPerServing: 0,
  ingredients: [{ name: "", amount: "", unit: "" }],
  instructions: [{ text: "" }],
  isPublic: false,
};

const MEAL_TIME_LABELS: Record<string, string> = {
  desayuno: "Desayuno", media_manana: "Media mañana", comida: "Comida",
  merienda: "Merienda", cena: "Cena", cualquiera: "Cualquier momento",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Fácil", medium: "Media", hard: "Difícil",
};

const CATEGORIES = [
  "Carnes", "Pescados", "Vegetariano", "Vegano", "Ensaladas",
  "Sopas", "Pastas", "Arroces", "Legumbres", "Postres",
  "Snacks", "Batidos", "Desayunos", "Detox", "Sin gluten", "Otro",
];

const COLLECTION_COLORS = [
  "#f97316", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f59e0b", "#06b6d4", "#ef4444", "#84cc16", "#6366f1",
];

// ─── Recipe Card ─────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  onEdit,
  onDelete,
  onAssign,
  onView,
}: {
  recipe: any;
  onEdit: () => void;
  onDelete: () => void;
  onAssign: () => void;
  onView: () => void;
}) {
  const difficultyColor = { easy: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", hard: "bg-red-100 text-red-700" };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{recipe.name}</h3>
            {recipe.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{recipe.description}</p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={onView} className="p-1 hover:bg-white/60 rounded text-muted-foreground hover:text-foreground">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button onClick={onEdit} className="p-1 hover:bg-white/60 rounded text-muted-foreground hover:text-foreground">
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDelete} className="p-1 hover:bg-white/60 rounded text-muted-foreground hover:text-red-500">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {recipe.mealTime && recipe.mealTime !== "cualquiera" && (
            <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full">
              {MEAL_TIME_LABELS[recipe.mealTime]}
            </span>
          )}
          {recipe.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor[recipe.difficulty as keyof typeof difficultyColor] ?? ""}`}>
              {DIFFICULTY_LABELS[recipe.difficulty]}
            </span>
          )}
          {recipe.category && (
            <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">
              {recipe.category}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 flex items-center gap-3 text-xs text-muted-foreground border-b border-border">
        {(recipe.preparationTime || recipe.cookTime) ? (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {(recipe.preparationTime ?? 0) + (recipe.cookTime ?? 0)} min
          </span>
        ) : null}
        {recipe.caloriesPerServing ? (
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3" />
            {recipe.caloriesPerServing} kcal
          </span>
        ) : null}
        {recipe.servings && (
          <span className="flex items-center gap-1">
            <UtensilsCrossed className="w-3 h-3" />
            {recipe.servings} rac.
          </span>
        )}
      </div>

      {/* Macros */}
      {(recipe.proteinsPerServing || recipe.carbsPerServing || recipe.fatsPerServing) ? (
        <div className="px-4 py-2 flex gap-3 text-xs border-b border-border">
          {recipe.proteinsPerServing ? <span className="text-blue-600 dark:text-blue-400">P: {recipe.proteinsPerServing}g</span> : null}
          {recipe.carbsPerServing ? <span className="text-amber-600 dark:text-amber-400">HC: {recipe.carbsPerServing}g</span> : null}
          {recipe.fatsPerServing ? <span className="text-rose-600 dark:text-rose-400">G: {recipe.fatsPerServing}g</span> : null}
        </div>
      ) : null}

      {/* Action */}
      <div className="px-4 py-2">
        <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs h-7" onClick={onAssign}>
          <Send className="w-3 h-3 mr-1" /> Asignar a paciente
        </Button>
      </div>
    </div>
  );
}

// ─── Recipe Form ─────────────────────────────────────────────────────────────

function RecipeForm({
  form,
  onChange,
}: {
  form: RecipeFormData;
  onChange: (f: RecipeFormData) => void;
}) {
  const addIngredient = () => onChange({ ...form, ingredients: [...form.ingredients, { name: "", amount: "", unit: "" }] });
  const removeIngredient = (i: number) => onChange({ ...form, ingredients: form.ingredients.filter((_, idx) => idx !== i) });
  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const updated = [...form.ingredients];
    updated[i] = { ...updated[i], [field]: value };
    onChange({ ...form, ingredients: updated });
  };

  const addInstruction = () => onChange({ ...form, instructions: [...form.instructions, { text: "" }] });
  const removeInstruction = (i: number) => onChange({ ...form, instructions: form.instructions.filter((_, idx) => idx !== i) });
  const updateInstruction = (i: number, value: string) => {
    const updated = [...form.instructions];
    updated[i] = { ...updated[i], text: value };
    onChange({ ...form, instructions: updated });
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {/* Basic info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">Nombre de la receta *</Label>
          <Input value={form.name} onChange={e => onChange({ ...form, name: e.target.value })} placeholder="Ej: Ensalada mediterránea" className="h-8 text-sm mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Descripción</Label>
          <Textarea value={form.description} onChange={e => onChange({ ...form, description: e.target.value })} placeholder="Descripción breve..." className="text-sm mt-1 h-16 resize-none" />
        </div>
        <div>
          <Label className="text-xs">Momento del día</Label>
          <Select value={form.mealTime} onValueChange={v => onChange({ ...form, mealTime: v as any })}>
            <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(MEAL_TIME_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Dificultad</Label>
          <Select value={form.difficulty} onValueChange={v => onChange({ ...form, difficulty: v as any })}>
            <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="hard">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Categoría</Label>
          <Select value={form.category || "none"} onValueChange={v => onChange({ ...form, category: v === "none" ? "" : v })}>
            <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin categoría</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Raciones</Label>
          <Input type="number" min={1} value={form.servings} onChange={e => onChange({ ...form, servings: Number(e.target.value) })} className="h-8 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">Prep. (min)</Label>
          <Input type="number" min={0} value={form.preparationTime} onChange={e => onChange({ ...form, preparationTime: Number(e.target.value) })} className="h-8 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">Cocción (min)</Label>
          <Input type="number" min={0} value={form.cookTime} onChange={e => onChange({ ...form, cookTime: Number(e.target.value) })} className="h-8 text-sm mt-1" />
        </div>
      </div>

      {/* Nutrition */}
      <div>
        <Label className="text-xs font-semibold">Valores nutricionales (por ración)</Label>
        <div className="grid grid-cols-4 gap-2 mt-1">
          {[
            { key: "caloriesPerServing", label: "Kcal" },
            { key: "proteinsPerServing", label: "Prot (g)" },
            { key: "carbsPerServing", label: "HC (g)" },
            { key: "fatsPerServing", label: "Grasas (g)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <Label className="text-xs text-muted-foreground">{label}</Label>
              <Input
                type="number" min={0}
                value={(form as any)[key]}
                onChange={e => onChange({ ...form, [key]: Number(e.target.value) })}
                className="h-8 text-sm mt-0.5"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs font-semibold">Ingredientes</Label>
          <button onClick={addIngredient} className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Añadir
          </button>
        </div>
        <div className="space-y-1.5">
          {form.ingredients.map((ing, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <Input value={ing.amount ?? ""} onChange={e => updateIngredient(i, "amount", e.target.value)} placeholder="Cant." className="h-7 text-xs w-16 shrink-0" />
              <Input value={ing.unit ?? ""} onChange={e => updateIngredient(i, "unit", e.target.value)} placeholder="Ud." className="h-7 text-xs w-16 shrink-0" />
              <Input value={ing.name} onChange={e => updateIngredient(i, "name", e.target.value)} placeholder="Ingrediente" className="h-7 text-xs flex-1" />
              {form.ingredients.length > 1 && (
                <button onClick={() => removeIngredient(i)} className="text-muted-foreground hover:text-red-500 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs font-semibold">Preparación</Label>
          <button onClick={addInstruction} className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1">
            <Plus className="w-3 h-3" /> Añadir paso
          </button>
        </div>
        <div className="space-y-1.5">
          {form.instructions.map((inst, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-xs text-muted-foreground mt-1.5 w-5 shrink-0 text-right">{i + 1}.</span>
              <Textarea
                value={inst.text}
                onChange={e => updateInstruction(i, e.target.value)}
                placeholder={`Paso ${i + 1}...`}
                className="text-xs flex-1 h-14 resize-none"
              />
              {form.instructions.length > 1 && (
                <button onClick={() => removeInstruction(i)} className="text-muted-foreground hover:text-red-500 mt-1.5 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ExpertRecipes() {
  const utils = trpc.useUtils();

  // State
  const [activeTab, setActiveTab] = useState<"my" | "search">("my");
  const [search, setSearch] = useState("");
  const [filterMealTime, setFilterMealTime] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeCollection, setActiveCollection] = useState<number | null>(null);

  // Modals
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [viewingRecipe, setViewingRecipe] = useState<any>(null);
  const [showCollectionModal, setShowCollectionModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningRecipe, setAssigningRecipe] = useState<any>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Form state
  const [form, setForm] = useState<RecipeFormData>(EMPTY_FORM);
  const [collectionForm, setCollectionForm] = useState({ name: "", description: "", color: "#f97316" });
  const [assignForm, setAssignForm] = useState({ patientId: 0, notes: "", servings: 1, mealTime: "cualquiera" as any, sendByEmail: false });
  const [publicSearch, setPublicSearch] = useState("");

  // Queries
  const { data: myRecipes = [], refetch: refetchMy } = trpc.expertRecipes.listMyRecipes.useQuery(
    activeCollection ? { collectionId: activeCollection } : {}
  );
  const { data: collections = [], refetch: refetchCollections } = trpc.expertRecipes.listCollections.useQuery();
  const { data: patients = [] } = trpc.offlinePatients.list.useQuery();
  const { data: publicRecipes = [], refetch: refetchPublic } = trpc.expertRecipes.searchPublicRecipes.useQuery(
    { search: publicSearch, limit: 20 },
    { enabled: publicSearch.length >= 2 }
  );

  // Mutations
  const createRecipe = trpc.expertRecipes.createRecipe.useMutation({
    onSuccess: () => { refetchMy(); toast.success("Receta creada"); setShowRecipeModal(false); setForm(EMPTY_FORM); },
    onError: (e) => toast.error(e.message),
  });
  const updateRecipe = trpc.expertRecipes.updateRecipe.useMutation({
    onSuccess: () => { refetchMy(); toast.success("Receta actualizada"); setShowRecipeModal(false); setEditingRecipe(null); setForm(EMPTY_FORM); },
    onError: (e) => toast.error(e.message),
  });
  const deleteRecipe = trpc.expertRecipes.deleteRecipe.useMutation({
    onSuccess: () => { refetchMy(); toast.success("Receta eliminada"); },
    onError: (e) => toast.error(e.message),
  });
  const createCollection = trpc.expertRecipes.createCollection.useMutation({
    onSuccess: () => { refetchCollections(); toast.success("Colección creada"); setShowCollectionModal(false); setCollectionForm({ name: "", description: "", color: "#f97316" }); },
    onError: (e) => toast.error(e.message),
  });
  const deleteCollection = trpc.expertRecipes.deleteCollection.useMutation({
    onSuccess: () => { refetchCollections(); if (activeCollection) setActiveCollection(null); toast.success("Colección eliminada"); },
  });
  const assignRecipe = trpc.expertRecipes.assignRecipeToPatient.useMutation({
    onSuccess: () => { toast.success("Receta asignada al paciente"); setShowAssignModal(false); },
    onError: (e) => toast.error(e.message),
  });
  const addToCollection = trpc.expertRecipes.addRecipeToCollection.useMutation({
    onSuccess: () => { refetchCollections(); toast.success("Añadida a la colección"); },
  });

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    return myRecipes.filter(r => {
      const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
      const matchMeal = filterMealTime === "all" || r.mealTime === filterMealTime;
      const matchCat = filterCategory === "all" || r.category === filterCategory;
      return matchSearch && matchMeal && matchCat;
    });
  }, [myRecipes, search, filterMealTime, filterCategory]);

  // Handlers
  const openCreate = () => {
    setEditingRecipe(null);
    setForm(EMPTY_FORM);
    setShowRecipeModal(true);
  };

  const openEdit = (recipe: any) => {
    setEditingRecipe(recipe);
    setForm({
      name: recipe.name ?? "",
      description: recipe.description ?? "",
      preparationTime: recipe.preparationTime ?? 0,
      cookTime: recipe.cookTime ?? 0,
      servings: recipe.servings ?? 1,
      difficulty: recipe.difficulty ?? "medium",
      mealTime: recipe.mealTime ?? "cualquiera",
      category: recipe.category ?? "",
      caloriesPerServing: recipe.caloriesPerServing ?? 0,
      proteinsPerServing: recipe.proteinsPerServing ?? 0,
      carbsPerServing: recipe.carbsPerServing ?? 0,
      fatsPerServing: recipe.fatsPerServing ?? 0,
      ingredients: recipe.ingredientsJson ? JSON.parse(recipe.ingredientsJson) : [{ name: "", amount: "", unit: "" }],
      instructions: recipe.instructionsJson ? JSON.parse(recipe.instructionsJson) : [{ text: "" }],
      isPublic: recipe.isPublic ?? false,
    });
    setShowRecipeModal(true);
  };

  const handleSaveRecipe = () => {
    if (!form.name.trim()) { toast.error("El nombre es obligatorio"); return; }
    const payload = {
      ...form,
      ingredientsJson: JSON.stringify(form.ingredients.filter(i => i.name.trim())),
      instructionsJson: JSON.stringify(form.instructions.filter(i => i.text.trim()).map((s, idx) => ({ step: idx + 1, text: s.text }))),
    };
    if (editingRecipe) {
      updateRecipe.mutate({ recipeId: editingRecipe.id, ...payload });
    } else {
      createRecipe.mutate(payload);
    }
  };

  const handleAssign = (recipe: any) => {
    setAssigningRecipe(recipe);
    setAssignForm({ patientId: 0, notes: "", servings: recipe.servings ?? 1, mealTime: recipe.mealTime ?? "cualquiera", sendByEmail: false });
    setShowAssignModal(true);
  };

  const handleConfirmAssign = () => {
    if (!assignForm.patientId) { toast.error("Selecciona un paciente"); return; }
    assignRecipe.mutate({
      patientId: assignForm.patientId,
      recipeId: assigningRecipe.id,
      notes: assignForm.notes || undefined,
      servings: assignForm.servings,
      mealTime: assignForm.mealTime,
      sendByEmail: assignForm.sendByEmail,
    });
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-orange-500" />
              Mis Recetas
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {myRecipes.length} receta{myRecipes.length !== 1 ? "s" : ""} en tu biblioteca
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSearchModal(true)} className="text-xs">
              <Search className="w-3.5 h-3.5 mr-1" /> Buscar en BuddyOne
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCollectionModal(true)} className="text-xs">
              <FolderPlus className="w-3.5 h-3.5 mr-1" /> Nueva colección
            </Button>
            <Button size="sm" onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Nueva receta
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          {/* Sidebar: Collections */}
          <div className="w-48 shrink-0 hidden md:block">
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Colecciones</p>
              <button
                onClick={() => setActiveCollection(null)}
                className={`w-full text-left text-xs px-2 py-1.5 rounded-lg flex items-center gap-2 mb-1 transition-colors ${!activeCollection ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-medium" : "text-muted-foreground hover:bg-muted"}`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Todas</span>
                <span className="ml-auto text-xs opacity-60">{myRecipes.length}</span>
              </button>
              {collections.map(col => (
                <div key={col.id} className="group relative">
                  <button
                    onClick={() => setActiveCollection(col.id)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg flex items-center gap-2 mb-0.5 transition-colors ${activeCollection === col.id ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 font-medium" : "text-muted-foreground hover:bg-muted"}`}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: col.color ?? "#f97316" }} />
                    <span className="truncate flex-1">{col.name}</span>
                    <span className="text-xs opacity-60">{col.recipeCount ?? 0}</span>
                  </button>
                  <button
                    onClick={() => { if (confirm(`¿Eliminar la colección "${col.name}"?`)) deleteCollection.mutate({ collectionId: col.id }); }}
                    className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {collections.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2 opacity-60">Sin colecciones</p>
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar receta..."
                  className="pl-8 h-8 text-sm"
                />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
              </div>
              <Select value={filterMealTime} onValueChange={setFilterMealTime}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="Momento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los momentos</SelectItem>
                  {Object.entries(MEAL_TIME_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="h-8 text-xs w-36">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Recipe Grid */}
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
                <ChefHat className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <h3 className="font-semibold text-foreground mb-1">
                  {myRecipes.length === 0 ? "Tu biblioteca de recetas está vacía" : "No hay recetas con estos filtros"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {myRecipes.length === 0
                    ? "Crea tu primera receta o busca en el catálogo de BuddyOne"
                    : "Prueba a cambiar los filtros de búsqueda"}
                </p>
                {myRecipes.length === 0 && (
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Crear receta
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowSearchModal(true)}>
                      <Search className="w-3.5 h-3.5 mr-1" /> Buscar en BuddyOne
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredRecipes.map(recipe => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onEdit={() => openEdit(recipe)}
                    onDelete={() => { if (confirm(`¿Eliminar "${recipe.name}"?`)) deleteRecipe.mutate({ recipeId: recipe.id }); }}
                    onAssign={() => handleAssign(recipe)}
                    onView={() => setViewingRecipe(recipe)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Recipe Create/Edit Modal ─────────────────────────────────────────── */}
      <Dialog open={showRecipeModal} onOpenChange={setShowRecipeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRecipe ? "Editar receta" : "Nueva receta"}</DialogTitle>
          </DialogHeader>
          <RecipeForm form={form} onChange={setForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecipeModal(false)}>Cancelar</Button>
            <Button
              onClick={handleSaveRecipe}
              disabled={createRecipe.isPending || updateRecipe.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {(createRecipe.isPending || updateRecipe.isPending) ? "Guardando..." : (editingRecipe ? "Guardar cambios" : "Crear receta")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── View Recipe Modal ────────────────────────────────────────────────── */}
      <Dialog open={!!viewingRecipe} onOpenChange={() => setViewingRecipe(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              {viewingRecipe?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingRecipe && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {viewingRecipe.description && <p className="text-sm text-muted-foreground">{viewingRecipe.description}</p>}
              <div className="flex flex-wrap gap-2 text-xs">
                {viewingRecipe.mealTime && viewingRecipe.mealTime !== "cualquiera" && <Badge variant="secondary">{MEAL_TIME_LABELS[viewingRecipe.mealTime]}</Badge>}
                {viewingRecipe.difficulty && <Badge variant="secondary">{DIFFICULTY_LABELS[viewingRecipe.difficulty]}</Badge>}
                {viewingRecipe.category && <Badge variant="secondary">{viewingRecipe.category}</Badge>}
                {viewingRecipe.caloriesPerServing ? <Badge className="bg-orange-100 text-orange-700">{viewingRecipe.caloriesPerServing} kcal</Badge> : null}
              </div>
              {viewingRecipe.ingredientsJson && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Ingredientes</h4>
                  <ul className="space-y-1">
                    {(JSON.parse(viewingRecipe.ingredientsJson) as Ingredient[]).map((ing, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-orange-500">•</span>
                        <span>{ing.amount} {ing.unit} {ing.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {viewingRecipe.instructionsJson && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Preparación</h4>
                  <ol className="space-y-2">
                    {(JSON.parse(viewingRecipe.instructionsJson) as Instruction[]).map((inst, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="font-semibold text-orange-500 shrink-0">{i + 1}.</span>
                        <span>{inst.text}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingRecipe(null)}>Cerrar</Button>
            <Button onClick={() => { handleAssign(viewingRecipe); setViewingRecipe(null); }} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Send className="w-3.5 h-3.5 mr-1" /> Asignar a paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Collection Modal ─────────────────────────────────────────────────── */}
      <Dialog open={showCollectionModal} onOpenChange={setShowCollectionModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nueva colección</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nombre *</Label>
              <Input value={collectionForm.name} onChange={e => setCollectionForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Recetas para perder peso" className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Descripción</Label>
              <Input value={collectionForm.description} onChange={e => setCollectionForm(f => ({ ...f, description: e.target.value }))} placeholder="Opcional..." className="h-8 text-sm mt-1" />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2 mt-1 flex-wrap">
                {COLLECTION_COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setCollectionForm(f => ({ ...f, color }))}
                    className={`w-6 h-6 rounded-full transition-transform ${collectionForm.color === color ? "scale-125 ring-2 ring-offset-1 ring-foreground" : "hover:scale-110"}`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollectionModal(false)}>Cancelar</Button>
            <Button
              onClick={() => { if (!collectionForm.name.trim()) { toast.error("El nombre es obligatorio"); return; } createCollection.mutate(collectionForm); }}
              disabled={createCollection.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Crear colección
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Assign Recipe Modal ──────────────────────────────────────────────── */}
      <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Asignar receta a paciente</DialogTitle>
          </DialogHeader>
          {assigningRecipe && (
            <div className="space-y-3">
              <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3">
                <p className="font-medium text-sm">{assigningRecipe.name}</p>
                {assigningRecipe.caloriesPerServing ? <p className="text-xs text-muted-foreground">{assigningRecipe.caloriesPerServing} kcal/ración</p> : null}
              </div>
              <div>
                <Label className="text-xs">Paciente *</Label>
                <Select value={assignForm.patientId ? String(assignForm.patientId) : ""} onValueChange={v => setAssignForm(f => ({ ...f, patientId: Number(v) }))}>
                  <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Seleccionar paciente..." /></SelectTrigger>
                  <SelectContent>
                    {patients.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Raciones</Label>
                  <Input type="number" min={1} value={assignForm.servings} onChange={e => setAssignForm(f => ({ ...f, servings: Number(e.target.value) }))} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Momento</Label>
                  <Select value={assignForm.mealTime} onValueChange={v => setAssignForm(f => ({ ...f, mealTime: v as any }))}>
                    <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(MEAL_TIME_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Notas para el paciente</Label>
                <Textarea value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} placeholder="Instrucciones específicas, adaptaciones..." className="text-sm mt-1 h-16 resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={assignForm.sendByEmail} onChange={e => setAssignForm(f => ({ ...f, sendByEmail: e.target.checked }))} className="rounded" />
                <span className="text-sm">Enviar receta por email al paciente</span>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancelar</Button>
            <Button onClick={handleConfirmAssign} disabled={assignRecipe.isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
              {assignRecipe.isPending ? "Asignando..." : "Asignar receta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Search Public Recipes Modal ──────────────────────────────────────── */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buscar en el catálogo de BuddyOne</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={publicSearch}
                onChange={e => setPublicSearch(e.target.value)}
                placeholder="Buscar receta (mínimo 2 caracteres)..."
                className="pl-8 h-9 text-sm"
                autoFocus
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {publicSearch.length >= 2 && publicRecipes.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">No se encontraron recetas</p>
              )}
              {publicRecipes.map(recipe => (
                <div key={recipe.id} className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{recipe.name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                      {recipe.mealTime && recipe.mealTime !== "cualquiera" && <span>{MEAL_TIME_LABELS[recipe.mealTime]}</span>}
                      {recipe.caloriesPerServing ? <span>{recipe.caloriesPerServing} kcal</span> : null}
                      {recipe.category && <span>{recipe.category}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      onClick={() => handleAssign(recipe)}
                    >
                      <Send className="w-3 h-3 mr-1" /> Asignar
                    </Button>
                    {collections.length > 0 && (
                      <Select onValueChange={v => addToCollection.mutate({ collectionId: Number(v), recipeId: recipe.id })}>
                        <SelectTrigger className="h-7 text-xs w-28">
                          <Folder className="w-3 h-3 mr-1" />
                          <SelectValue placeholder="Guardar" />
                        </SelectTrigger>
                        <SelectContent>
                          {collections.map(col => <SelectItem key={col.id} value={String(col.id)}>{col.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSearchModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
