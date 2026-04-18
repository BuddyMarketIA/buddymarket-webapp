/**
 * AdminContent — Panel de gestión de contenido dinámico
 * Permite añadir y editar recetas y menús desde la app sin necesidad de redespliegue.
 * Solo accesible para usuarios con rol "admin".
 */
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import { Link } from "wouter";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PhotoIcon,
  ChevronLeftIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  step: number;
  text: string;
}

// ─── RecipeForm ───────────────────────────────────────────────────────────────

function RecipeForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [mealTime, setMealTime] = useState(initial?.mealTime ?? "cualquiera");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "medium");
  const [prepTime, setPrepTime] = useState(initial?.preparationTime?.toString() ?? "");
  const [cookTime, setCookTime] = useState(initial?.cookTime?.toString() ?? "");
  const [servings, setServings] = useState(initial?.servings?.toString() ?? "2");
  const [calories, setCalories] = useState(initial?.caloriesPerServing?.toString() ?? "");
  const [proteins, setProteins] = useState(initial?.proteinsPerServing?.toString() ?? "");
  const [carbs, setCarbs] = useState(initial?.carbsPerServing?.toString() ?? "");
  const [fats, setFats] = useState(initial?.fatsPerServing?.toString() ?? "");
  const [fiber, setFiber] = useState(initial?.fiberPerServing?.toString() ?? "");
  const [cuisineType, setCuisineType] = useState(initial?.cuisineType ?? "");
  const [cookingMethod, setCookingMethod] = useState(initial?.cookingMethod ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);
  const [isKidFriendly, setIsKidFriendly] = useState(initial?.isKidFriendly ?? false);
  const [isBabyFriendly, setIsBabyFriendly] = useState(initial?.isBabyFriendly ?? false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ingredients
  const parseIngredients = (): Ingredient[] => {
    try {
      const parsed = JSON.parse(initial?.ingredientsJson ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };
  const [ingredients, setIngredients] = useState<Ingredient[]>(parseIngredients);

  // Steps
  const parseSteps = (): Step[] => {
    try {
      const parsed = JSON.parse(initial?.instructionsJson ?? "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  };
  const [steps, setSteps] = useState<Step[]>(parseSteps);

  const uploadImage = trpc.admin.uploadRecipeImage.useMutation({
    onSuccess: (data) => { setImageUrl(data.url); toast.success("Imagen subida"); },
    onError: (err) => toast.error(err.message),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !initial?.id) { toast.error("Guarda primero la receta para subir imagen"); return; }
    if (file.size > 8 * 1024 * 1024) { toast.error("Máx 8 MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadImage.mutate({ recipeId: initial.id, imageBase64: base64, mimeType: file.type });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const addIngredient = () => setIngredients([...ingredients, { name: "", amount: "", unit: "g" }]);
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[i] = { ...updated[i], [field]: value };
    setIngredients(updated);
  };

  const addStep = () => setSteps([...steps, { step: steps.length + 1, text: "" }]);
  const removeStep = (i: number) => setSteps(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, step: idx + 1 })));
  const updateStep = (i: number, text: string) => {
    const updated = [...steps];
    updated[i] = { ...updated[i], text };
    setSteps(updated);
  };

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      mealTime,
      difficulty,
      preparationTime: prepTime ? parseInt(prepTime) : undefined,
      cookTime: cookTime ? parseInt(cookTime) : undefined,
      servings: servings ? parseInt(servings) : 2,
      caloriesPerServing: calories ? parseInt(calories) : undefined,
      proteinsPerServing: proteins ? parseFloat(proteins) : undefined,
      carbsPerServing: carbs ? parseFloat(carbs) : undefined,
      fatsPerServing: fats ? parseFloat(fats) : undefined,
      fiberPerServing: fiber ? parseFloat(fiber) : undefined,
      cuisineType: cuisineType.trim() || undefined,
      cookingMethod: cookingMethod.trim() || undefined,
      imageUrl: imageUrl || undefined,
      isPublic,
      isKidFriendly,
      isBabyFriendly,
      ingredientsJson: ingredients.filter(i => i.name.trim()).length > 0
        ? JSON.stringify(ingredients.filter(i => i.name.trim()))
        : undefined,
      instructionsJson: steps.filter(s => s.text.trim()).length > 0
        ? JSON.stringify(steps.filter(s => s.text.trim()))
        : undefined,
    });
  };

  const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";

  return (
    <div className="space-y-5">
      {/* Basic info */}
      <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-foreground/80">Información básica</h4>
        <div>
          <label className={labelCls}>Nombre *</label>
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Ej: Ensalada mediterránea" />
        </div>
        <div>
          <label className={labelCls}>Descripción</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className={inputCls} rows={2} placeholder="Breve descripción de la receta" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Momento del día</label>
            <select value={mealTime} onChange={e => setMealTime(e.target.value)} className={inputCls}>
              <option value="desayuno">Desayuno</option>
              <option value="media_manana">Media mañana</option>
              <option value="comida">Comida</option>
              <option value="merienda">Merienda</option>
              <option value="cena">Cena</option>
              <option value="cualquiera">Cualquiera</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Dificultad</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={inputCls}>
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Prep. (min)</label>
            <input type="number" value={prepTime} onChange={e => setPrepTime(e.target.value)} className={inputCls} placeholder="15" min="0" />
          </div>
          <div>
            <label className={labelCls}>Cocción (min)</label>
            <input type="number" value={cookTime} onChange={e => setCookTime(e.target.value)} className={inputCls} placeholder="30" min="0" />
          </div>
          <div>
            <label className={labelCls}>Raciones</label>
            <input type="number" value={servings} onChange={e => setServings(e.target.value)} className={inputCls} placeholder="2" min="1" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Tipo de cocina</label>
            <input value={cuisineType} onChange={e => setCuisineType(e.target.value)} className={inputCls} placeholder="mediterránea, italiana…" />
          </div>
          <div>
            <label className={labelCls}>Método de cocción</label>
            <input value={cookingMethod} onChange={e => setCookingMethod(e.target.value)} className={inputCls} placeholder="horno, plancha, airfryer…" />
          </div>
        </div>
        {/* Flags */}
        <div className="flex flex-wrap gap-4">
          {[
            { label: "Pública", val: isPublic, set: setIsPublic },
            { label: "Apto niños", val: isKidFriendly, set: setIsKidFriendly },
            { label: "Apto bebés", val: isBabyFriendly, set: setIsBabyFriendly },
          ].map(({ label, val, set }) => (
            <label key={label} className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="rounded" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Image */}
      <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-foreground/80">Imagen</h4>
        {imageUrl && (
          <img src={imageUrl} alt="preview" className="h-32 w-full object-cover rounded-xl" />
        )}
        <div className="flex gap-2">
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={`${inputCls} flex-1`} placeholder="URL de imagen (CDN)" />
          {initial?.id && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              <PhotoIcon className="h-4 w-4" />
              {uploading ? "Subiendo…" : "Subir"}
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        {!initial?.id && <p className="text-xs text-muted-foreground/70">Guarda primero la receta para poder subir imagen desde el dispositivo.</p>}
      </div>

      {/* Nutritional values */}
      <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-foreground/80">Valores nutricionales (por ración)</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Calorías (kcal)", val: calories, set: setCalories },
            { label: "Proteínas (g)", val: proteins, set: setProteins },
            { label: "Carbohidratos (g)", val: carbs, set: setCarbs },
            { label: "Grasas (g)", val: fats, set: setFats },
            { label: "Fibra (g)", val: fiber, set: setFiber },
          ].map(({ label, val, set }) => (
            <div key={label}>
              <label className={labelCls}>{label}</label>
              <input type="number" value={val} onChange={e => set(e.target.value)} className={inputCls} placeholder="0" min="0" step="0.1" />
            </div>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground/80">Ingredientes ({ingredients.length})</h4>
          <button onClick={addIngredient} className="flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-100">
            <PlusIcon className="h-3.5 w-3.5" /> Añadir
          </button>
        </div>
        {ingredients.length === 0 && (
          <p className="text-xs text-muted-foreground/70 text-center py-2">No hay ingredientes. Pulsa "Añadir" para empezar.</p>
        )}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {ingredients.map((ing, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={ing.name}
                onChange={e => updateIngredient(i, "name", e.target.value)}
                className={`${inputCls} flex-1`}
                placeholder="Ingrediente"
              />
              <input
                value={ing.amount}
                onChange={e => updateIngredient(i, "amount", e.target.value)}
                className={`${inputCls} w-20`}
                placeholder="Cant."
              />
              <input
                value={ing.unit}
                onChange={e => updateIngredient(i, "unit", e.target.value)}
                className={`${inputCls} w-16`}
                placeholder="Unidad"
              />
              <button onClick={() => removeIngredient(i)} className="shrink-0 text-red-400 hover:text-red-600">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-foreground/80">Instrucciones ({steps.length} pasos)</h4>
          <button onClick={addStep} className="flex items-center gap-1 rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600 hover:bg-orange-100">
            <PlusIcon className="h-3.5 w-3.5" /> Añadir paso
          </button>
        </div>
        {steps.length === 0 && (
          <p className="text-xs text-muted-foreground/70 text-center py-2">No hay pasos. Pulsa "Añadir paso" para empezar.</p>
        )}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-600 mt-2">
                {step.step}
              </span>
              <textarea
                value={step.text}
                onChange={e => updateStep(i, e.target.value)}
                className={`${inputCls} flex-1 resize-none`}
                rows={2}
                placeholder={`Paso ${step.step}…`}
              />
              <button onClick={() => removeStep(i)} className="shrink-0 text-red-400 hover:text-red-600 mt-2">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {isSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
          {initial ? "Guardar cambios" : "Crear receta"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/30"
        >
          <XMarkIcon className="h-4 w-4" /> Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── MenuForm ─────────────────────────────────────────────────────────────────

function MenuForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [goal, setGoal] = useState(initial?.goal ?? "");
  const [dailyCalories, setDailyCalories] = useState(initial?.dailyCalories?.toString() ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "easy");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [objective, setObjective] = useState(initial?.objective ?? "");
  const [persons, setPersons] = useState(initial?.persons?.toString() ?? "1");
  const [dailyMealsCount, setDailyMealsCount] = useState(initial?.dailyMealsCount?.toString() ?? "3");
  const [durationDays, setDurationDays] = useState("7");
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);

  const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
  const labelCls = "block text-xs font-semibold text-muted-foreground mb-1";

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("El nombre es obligatorio"); return; }
    onSave({
      name: name.trim(),
      goal: goal || undefined,
      dailyCalories: dailyCalories ? parseInt(dailyCalories) : undefined,
      difficulty,
      coverImage: coverImage.trim() || undefined,
      objective: objective.trim() || undefined,
      persons: persons ? parseInt(persons) : 1,
      dailyMealsCount: dailyMealsCount ? parseInt(dailyMealsCount) : 3,
      durationDays: durationDays ? parseInt(durationDays) : 7,
      isPublic,
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm space-y-3">
        <h4 className="text-sm font-bold text-foreground/80">Información del menú</h4>
        <div>
          <label className={labelCls}>Nombre *</label>
          <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Ej: Menú pérdida de peso 7 días" />
        </div>
        <div>
          <label className={labelCls}>Objetivo / descripción</label>
          <textarea value={objective} onChange={e => setObjective(e.target.value)} className={inputCls} rows={2} placeholder="Descripción del menú y sus objetivos" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Meta nutricional</label>
            <select value={goal} onChange={e => setGoal(e.target.value)} className={inputCls}>
              <option value="">Sin especificar</option>
              <option value="perdida_peso">Pérdida de peso</option>
              <option value="ganancia_muscular">Ganancia muscular</option>
              <option value="tonificacion">Tonificación</option>
              <option value="perdida_grasa">Pérdida de grasa</option>
              <option value="mantenimiento">Mantenimiento</option>
              <option value="bienestar">Bienestar</option>
              <option value="vegano">Vegano</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Dificultad</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={inputCls}>
              <option value="easy">Fácil</option>
              <option value="medium">Media</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Calorías/día</label>
            <input type="number" value={dailyCalories} onChange={e => setDailyCalories(e.target.value)} className={inputCls} placeholder="1800" min="0" />
          </div>
          <div>
            <label className={labelCls}>Personas</label>
            <input type="number" value={persons} onChange={e => setPersons(e.target.value)} className={inputCls} placeholder="1" min="1" />
          </div>
          <div>
            <label className={labelCls}>Comidas/día</label>
            <input type="number" value={dailyMealsCount} onChange={e => setDailyMealsCount(e.target.value)} className={inputCls} placeholder="3" min="1" max="6" />
          </div>
        </div>
        {!initial && (
          <div>
            <label className={labelCls}>Duración (días)</label>
            <input type="number" value={durationDays} onChange={e => setDurationDays(e.target.value)} className={inputCls} placeholder="7" min="1" max="30" />
          </div>
        )}
        <div>
          <label className={labelCls}>URL imagen de portada</label>
          <input value={coverImage} onChange={e => setCoverImage(e.target.value)} className={inputCls} placeholder="https://cdn.example.com/menu-cover.jpg" />
        </div>
        {coverImage && (
          <img src={coverImage} alt="portada" className="h-32 w-full object-cover rounded-xl" />
        )}
        <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} className="rounded" />
          Menú público (visible en la biblioteca)
        </label>
      </div>

      <div className="flex gap-3 pb-8">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {isSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <CheckIcon className="h-4 w-4" />}
          {initial ? "Guardar cambios" : "Crear menú"}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 rounded-2xl border border-border px-5 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted/30"
        >
          <XMarkIcon className="h-4 w-4" /> Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type View = "list" | "new-recipe" | "edit-recipe" | "new-menu" | "edit-menu";

export default function AdminContent() {
  const { user, loading: isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"recipes" | "menus">("recipes");
  const [view, setView] = useState<View>("list");
  const [editTarget, setEditTarget] = useState<any>(null);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeOffset, setRecipeOffset] = useState(0);
  const [menuSearch, setMenuSearch] = useState("");
  const [menuOffset, setMenuOffset] = useState(0);
  const LIMIT = 20;

  const utils = trpc.useUtils();

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: recipesData, refetch: refetchRecipes } = trpc.admin.recipes.useQuery(
    { limit: LIMIT, offset: recipeOffset, search: recipeSearch || undefined },
    { enabled: activeTab === "recipes" && view === "list" }
  );

  const { data: menusData, refetch: refetchMenus } = trpc.contentSync.adminListMenus.useQuery(
    { limit: LIMIT, offset: menuOffset, search: menuSearch || undefined },
    { enabled: activeTab === "menus" && view === "list" }
  );

  // ── Recipe mutations ──────────────────────────────────────────────────────
  const createRecipe = trpc.contentSync.adminCreateRecipe.useMutation({
    onSuccess: () => { toast.success("Receta creada"); setView("list"); refetchRecipes(); },
    onError: (err) => toast.error(err.message),
  });

  const updateRecipe = trpc.contentSync.adminUpdateRecipe.useMutation({
    onSuccess: () => { toast.success("Receta actualizada"); setView("list"); refetchRecipes(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteRecipe = trpc.contentSync.adminDeleteRecipe.useMutation({
    onSuccess: () => { toast.success("Receta eliminada"); refetchRecipes(); },
    onError: (err) => toast.error(err.message),
  });

  // ── Menu mutations ────────────────────────────────────────────────────────
  const createMenu = trpc.contentSync.adminCreateMenu.useMutation({
    onSuccess: () => { toast.success("Menú creado"); setView("list"); refetchMenus(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMenu = trpc.contentSync.adminUpdateMenu.useMutation({
    onSuccess: () => { toast.success("Menú actualizado"); setView("list"); refetchMenus(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMenu = trpc.contentSync.adminDeleteMenu.useMutation({
    onSuccess: () => { toast.success("Menú eliminado"); refetchMenus(); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" /></div>;
  if (!user || user.role !== "admin") return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <p className="text-muted-foreground">Acceso restringido a administradores.</p>
      <Link href="/app/dashboard" className="text-orange-500 underline text-sm">Volver al inicio</Link>
    </div>
  );

  // ── Form handlers ─────────────────────────────────────────────────────────
  const handleSaveRecipe = (data: any) => {
    if (editTarget) {
      updateRecipe.mutate({ id: editTarget.id, ...data });
    } else {
      createRecipe.mutate(data);
    }
  };

  const handleSaveMenu = (data: any) => {
    if (editTarget) {
      updateMenu.mutate({ id: editTarget.id, ...data });
    } else {
      createMenu.mutate(data);
    }
  };

  const handleDeleteRecipe = (id: number, name: string) => {
    if (confirm(`¿Eliminar la receta "${name}"? Esta acción no se puede deshacer.`)) {
      deleteRecipe.mutate({ id });
    }
  };

  const handleDeleteMenu = (id: number, name: string) => {
    if (confirm(`¿Eliminar el menú "${name}"? Esta acción no se puede deshacer.`)) {
      deleteMenu.mutate({ id });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const isFormView = view !== "list";
  const isSaving = createRecipe.isPending || updateRecipe.isPending || createMenu.isPending || updateMenu.isPending;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border/50 px-4 py-3 flex items-center gap-3">
        {isFormView ? (
          <button onClick={() => { setView("list"); setEditTarget(null); }} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="h-4 w-4" /> Volver
          </button>
        ) : (
          <Link href="/app/admin" className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ChevronLeftIcon className="h-4 w-4" /> Admin
          </Link>
        )}
        <div className="flex-1">
          <h1 className="text-base font-bold text-foreground">
            {view === "list" && "Gestión de contenido"}
            {view === "new-recipe" && "Nueva receta"}
            {view === "edit-recipe" && `Editar: ${editTarget?.name}`}
            {view === "new-menu" && "Nuevo menú"}
            {view === "edit-menu" && `Editar: ${editTarget?.name}`}
          </h1>
          <p className="text-xs text-muted-foreground/70">Añade o edita contenido sin redesplegar la app</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Tab selector (only in list view) */}
        {!isFormView && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("recipes")}
              className={`flex items-center gap-2 flex-1 rounded-2xl py-2.5 text-sm font-semibold transition-colors ${activeTab === "recipes" ? "bg-orange-500 text-white" : "bg-background text-muted-foreground border border-border"}`}
            >
              <BookOpenIcon className="h-4 w-4 mx-auto" />
              <span>Recetas</span>
            </button>
            <button
              onClick={() => setActiveTab("menus")}
              className={`flex items-center gap-2 flex-1 rounded-2xl py-2.5 text-sm font-semibold transition-colors ${activeTab === "menus" ? "bg-orange-500 text-white" : "bg-background text-muted-foreground border border-border"}`}
            >
              <CalendarDaysIcon className="h-4 w-4 mx-auto" />
              <span>Menús</span>
            </button>
          </div>
        )}

        {/* ── RECIPES LIST ── */}
        {view === "list" && activeTab === "recipes" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <input
                  value={recipeSearch}
                  onChange={e => { setRecipeSearch(e.target.value); setRecipeOffset(0); }}
                  placeholder="Buscar receta…"
                  className="w-full rounded-2xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <button
                onClick={() => { setEditTarget(null); setView("new-recipe"); }}
                className="flex items-center gap-1.5 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
              >
                <PlusIcon className="h-4 w-4" /> Nueva
              </button>
            </div>

            <p className="text-xs text-muted-foreground/70">{recipesData?.total ?? "…"} recetas en total</p>

            {!recipesData ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" /></div>
            ) : recipesData.recipes.length === 0 ? (
              <div className="rounded-2xl bg-background border border-border/50 p-8 text-center">
                <p className="text-sm text-muted-foreground/70">No se encontraron recetas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recipesData.recipes.map((r: any) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-2xl bg-background border border-border/50 p-3 shadow-sm">
                    <img
                      src={r.imageUrl || "https://placehold.co/64x64/FFF0E0/F97316?text=🍽️"}
                      alt={r.name}
                      className="h-12 w-12 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                      <p className="text-xs text-muted-foreground/70">ID #{r.id} · {r.userName ?? "sistema"}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setEditTarget(r); setView("edit-recipe"); }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground/70 hover:bg-orange-50 hover:text-orange-500"
                        title="Editar"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecipe(r.id, r.name)}
                        disabled={deleteRecipe.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground/70 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recipesData && recipesData.total > LIMIT && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setRecipeOffset(Math.max(0, recipeOffset - LIMIT))}
                  disabled={recipeOffset === 0}
                  className="rounded-xl bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40 hover:bg-muted"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-muted-foreground/70">
                  {recipeOffset + 1}–{Math.min(recipeOffset + LIMIT, recipesData.total)} de {recipesData.total}
                </span>
                <button
                  onClick={() => setRecipeOffset(recipeOffset + LIMIT)}
                  disabled={recipeOffset + LIMIT >= recipesData.total}
                  className="rounded-xl bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40 hover:bg-muted"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── MENUS LIST ── */}
        {view === "list" && activeTab === "menus" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
                <input
                  value={menuSearch}
                  onChange={e => { setMenuSearch(e.target.value); setMenuOffset(0); }}
                  placeholder="Buscar menú…"
                  className="w-full rounded-2xl border border-border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <button
                onClick={() => { setEditTarget(null); setView("new-menu"); }}
                className="flex items-center gap-1.5 rounded-2xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
              >
                <PlusIcon className="h-4 w-4" /> Nuevo
              </button>
            </div>

            <p className="text-xs text-muted-foreground/70">{menusData?.total ?? "…"} menús en total</p>

            {!menusData ? (
              <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" /></div>
            ) : menusData.menus.length === 0 ? (
              <div className="rounded-2xl bg-background border border-border/50 p-8 text-center">
                <p className="text-sm text-muted-foreground/70">No se encontraron menús</p>
              </div>
            ) : (
              <div className="space-y-2">
                {menusData.menus.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-background border border-border/50 p-3 shadow-sm">
                    {m.coverImage ? (
                      <img src={m.coverImage} alt={m.name} className="h-12 w-12 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                        <CalendarDaysIcon className="h-6 w-6 text-orange-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground/70">
                        ID #{m.id} · {m.goal ?? "sin objetivo"} · {m.isPublic ? "público" : "privado"}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setEditTarget(m); setView("edit-menu"); }}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground/70 hover:bg-orange-50 hover:text-orange-500"
                        title="Editar"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMenu(m.id, m.name)}
                        disabled={deleteMenu.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground/70 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {menusData && menusData.total > LIMIT && (
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setMenuOffset(Math.max(0, menuOffset - LIMIT))}
                  disabled={menuOffset === 0}
                  className="rounded-xl bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40 hover:bg-muted"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-muted-foreground/70">
                  {menuOffset + 1}–{Math.min(menuOffset + LIMIT, menusData.total)} de {menusData.total}
                </span>
                <button
                  onClick={() => setMenuOffset(menuOffset + LIMIT)}
                  disabled={menuOffset + LIMIT >= menusData.total}
                  className="rounded-xl bg-muted/50 px-3 py-1.5 text-xs font-semibold text-muted-foreground disabled:opacity-40 hover:bg-muted"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── RECIPE FORM ── */}
        {(view === "new-recipe" || view === "edit-recipe") && (
          <RecipeForm
            initial={editTarget}
            onSave={handleSaveRecipe}
            onCancel={() => { setView("list"); setEditTarget(null); }}
            isSaving={isSaving}
          />
        )}

        {/* ── MENU FORM ── */}
        {(view === "new-menu" || view === "edit-menu") && (
          <MenuForm
            initial={editTarget}
            onSave={handleSaveMenu}
            onCancel={() => { setView("list"); setEditTarget(null); }}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
}
