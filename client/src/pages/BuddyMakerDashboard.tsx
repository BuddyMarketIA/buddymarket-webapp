import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";

type Tab = "/app/profile" | "/app/recipes";

const MEAL_TIMES = [
  { value: "desayuno", label: "Desayuno" },
  { value: "media_manana", label: "Media mañana" },
  { value: "comida", label: "Comida" },
  { value: "merienda", label: "Merienda" },
  { value: "cena", label: "Cena" },
  { value: "cualquiera", label: "Cualquiera" },
] as const;

type MealTime = typeof MEAL_TIMES[number]["value"];

const DIFFICULTIES = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Media" },
  { value: "hard", label: "Difícil" },
] as const;

type Difficulty = typeof DIFFICULTIES[number]["value"];

const COOKING_METHODS = ["Horno", "Plancha", "Olla", "Microondas", "Airfryer", "Wok", "Sin cocción", "Vaporizador"];
const CUISINE_TYPES = ["Mediterránea", "Española", "Italiana", "Asiática", "Mexicana", "Americana", "Vegana", "Internacional"];

interface Ingredient { name: string; amount: string; unit: string; }
interface Step { step: number; text: string; }

const emptyIngredient = (): Ingredient => ({ name: "", amount: "", unit: "" });
const emptyStep = (n: number): Step => ({ step: n, text: "" });

export default function BuddyMakerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("/app/profile");
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    bio: "",
    specialty: "",
    avatarUrl: "",
    coverUrl: "",
    instagramHandle: "",
    youtubeHandle: "",
    tiktokHandle: "",
  });

  // Recipe form
  const [recipeForm, setRecipeForm] = useState({
    name: "",
    description: "",
    imageUrl: "",
    prepTime: "",
    cookTime: "",
    servings: "2",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    mealTime: "cualquiera" as MealTime,
    cookingMethod: "",
    cuisineType: "",
    difficulty: "medium" as Difficulty,
    allergens: "",
    tags: "",
    isPublic: true,
    ingredients: [emptyIngredient(), emptyIngredient(), emptyIngredient()],
    steps: [emptyStep(1), emptyStep(2), emptyStep(3)],
  });

  const { data: myProfile, refetch: refetchProfile } = trpc.buddyMakers.getMyProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: myApplication, isLoading: appLoading } = trpc.buddyApplications.getMyApplication.useQuery(
    { type: "maker" },
    { enabled: !!user }
  );

  // Populate form when profile loads
  const [profileLoaded, setProfileLoaded] = useState(false);
  if (myProfile && !profileLoaded) {
    setProfileLoaded(true);
    setProfileForm({
      displayName: myProfile.displayName ?? "",
      bio: myProfile.bio ?? "",
      specialty: myProfile.specialty ?? "",
      avatarUrl: myProfile.avatarUrl ?? "",
      coverUrl: myProfile.coverUrl ?? "",
      instagramHandle: myProfile.instagramHandle ?? "",
      youtubeHandle: myProfile.youtubeHandle ?? "",
      tiktokHandle: myProfile.tiktokHandle ?? "",
    });
  }

  const { data: myRecipes, refetch: refetchRecipes } = trpc.buddyMakers.getMyRecipes.useQuery(undefined, {
    enabled: !!user && !!myProfile,
  });

  const createProfileMutation = trpc.buddyMakers.createProfile.useMutation({
    onSuccess: () => { toast.success("Perfil de creador creado"); refetchProfile(); },
    onError: (e) => toast.error(e.message),
  });

  const updateProfileMutation = trpc.buddyMakers.updateProfile.useMutation({
    onSuccess: () => { toast.success("Perfil actualizado"); refetchProfile(); },
    onError: (e) => toast.error(e.message),
  });

  const createRecipeMutation = trpc.buddyMakers.createRecipe.useMutation({
    onSuccess: () => { toast.success("Receta publicada"); setShowRecipeForm(false); refetchRecipes(); resetRecipeForm(); },
    onError: (e) => toast.error(e.message),
  });

  const updateRecipeMutation = trpc.buddyMakers.updateRecipe.useMutation({
    onSuccess: () => { toast.success("Receta actualizada"); setShowRecipeForm(false); setEditingRecipe(null); refetchRecipes(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteRecipeMutation = trpc.buddyMakers.deleteRecipe.useMutation({
    onSuccess: () => { toast.success("Receta eliminada"); refetchRecipes(); },
    onError: (e) => toast.error(e.message),
  });

  function resetRecipeForm() {
    setRecipeForm({
      name: "", description: "", imageUrl: "", prepTime: "", cookTime: "", servings: "2",
      calories: "", protein: "", carbs: "", fat: "", mealTime: "cualquiera", cookingMethod: "",
      cuisineType: "", difficulty: "medium", allergens: "", tags: "", isPublic: true,
      ingredients: [emptyIngredient(), emptyIngredient(), emptyIngredient()],
      steps: [emptyStep(1), emptyStep(2), emptyStep(3)],
    });
  }

  function openEditRecipe(recipe: any) {
    let ingredients = [emptyIngredient(), emptyIngredient(), emptyIngredient()];
    let steps = [emptyStep(1), emptyStep(2), emptyStep(3)];
    try { if (recipe.ingredientsJson) ingredients = JSON.parse(recipe.ingredientsJson); } catch {}
    try { if (recipe.instructionsJson) steps = JSON.parse(recipe.instructionsJson); } catch {}
    setRecipeForm({
      name: recipe.name ?? "", description: recipe.description ?? "", imageUrl: recipe.imageUrl ?? "",
      prepTime: recipe.preparationTime?.toString() ?? "", cookTime: recipe.cookTime?.toString() ?? "",
      servings: recipe.servings?.toString() ?? "2", calories: recipe.caloriesPerServing?.toString() ?? "",
      protein: recipe.proteinsPerServing?.toString() ?? "", carbs: recipe.carbsPerServing?.toString() ?? "",
      fat: recipe.fatsPerServing?.toString() ?? "", mealTime: (recipe.mealTime as MealTime) ?? "cualquiera",
      cookingMethod: recipe.cookingMethod ?? "", cuisineType: recipe.cuisineType ?? "",
      difficulty: (recipe.difficulty as Difficulty) ?? "medium", allergens: recipe.allergens ?? "",
      tags: recipe.tags ?? "", isPublic: recipe.isPublic ?? true, ingredients, steps,
    });
    setEditingRecipe(recipe);
    setShowRecipeForm(true);
  }

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      displayName: profileForm.displayName,
      bio: profileForm.bio || undefined,
      specialty: profileForm.specialty || undefined,
      avatarUrl: profileForm.avatarUrl || undefined,
      coverUrl: profileForm.coverUrl || undefined,
      instagramHandle: profileForm.instagramHandle || undefined,
      youtubeHandle: profileForm.youtubeHandle || undefined,
      tiktokHandle: profileForm.tiktokHandle || undefined,
    };
    if (myProfile) {
      updateProfileMutation.mutate(payload);
    } else {
      createProfileMutation.mutate(payload);
    }
  }

  function handleSaveRecipe(e: React.FormEvent) {
    e.preventDefault();
    const filteredIngredients = recipeForm.ingredients.filter((i) => i.name.trim());
    const filteredSteps = recipeForm.steps.filter((s) => s.text.trim());
    const payload = {
      name: recipeForm.name,
      description: recipeForm.description || undefined,
      imageUrl: recipeForm.imageUrl || undefined,
      prepTime: recipeForm.prepTime ? parseInt(recipeForm.prepTime) : undefined,
      cookTime: recipeForm.cookTime ? parseInt(recipeForm.cookTime) : undefined,
      servings: recipeForm.servings ? parseInt(recipeForm.servings) : 2,
      calories: recipeForm.calories ? parseInt(recipeForm.calories) : undefined,
      protein: recipeForm.protein ? parseFloat(recipeForm.protein) : undefined,
      carbs: recipeForm.carbs ? parseFloat(recipeForm.carbs) : undefined,
      fat: recipeForm.fat ? parseFloat(recipeForm.fat) : undefined,
      mealTime: recipeForm.mealTime,
      cookingMethod: recipeForm.cookingMethod || undefined,
      cuisineType: recipeForm.cuisineType || undefined,
      difficulty: recipeForm.difficulty,
      ingredientsJson: filteredIngredients.length ? JSON.stringify(filteredIngredients) : undefined,
      instructionsJson: filteredSteps.length ? JSON.stringify(filteredSteps) : undefined,
      allergens: recipeForm.allergens || undefined,
      tags: recipeForm.tags || undefined,
      isPublic: recipeForm.isPublic,
    };
    if (editingRecipe) {
      updateRecipeMutation.mutate({ recipeId: editingRecipe.id, ...payload });
    } else {
      createRecipeMutation.mutate(payload);
    }
  }

  function addIngredient() {
    setRecipeForm((p) => ({ ...p, ingredients: [...p.ingredients, emptyIngredient()] }));
  }
  function removeIngredient(idx: number) {
    setRecipeForm((p) => ({ ...p, ingredients: p.ingredients.filter((_, i) => i !== idx) }));
  }
  function updateIngredient(idx: number, field: keyof Ingredient, value: string) {
    setRecipeForm((p) => ({ ...p, ingredients: p.ingredients.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing) }));
  }
  function addStep() {
    setRecipeForm((p) => ({ ...p, steps: [...p.steps, emptyStep(p.steps.length + 1)] }));
  }
  function removeStep(idx: number) {
    setRecipeForm((p) => ({ ...p, steps: p.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step: i + 1 })) }));
  }
  function updateStep(idx: number, text: string) {
    setRecipeForm((p) => ({ ...p, steps: p.steps.map((s, i) => i === idx ? { ...s, text } : s) }));
  }

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-8 text-center">
          <div className="text-5xl">🔒</div>
          <h2 className="text-xl font-bold text-gray-800">Inicia sesión para acceder a tu panel de creador</h2>
        </div>
      </AppLayout>
    );
  }

  // Gate: only approved makers can access the dashboard
  if (!appLoading && myApplication?.status !== "approved") {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
          <div className="text-6xl">👨‍🍳</div>
          <h2 className="text-xl font-bold">Acceso restringido a BuddyMakers</h2>
          <p className="text-muted-foreground">
            {myApplication?.status === "pending"
              ? "Tu solicitud está siendo revisada. Te notificaremos cuando sea aprobada."
              : "Para acceder a este panel necesitas solicitar y obtener el rol de BuddyMaker."}
          </p>
          <a href="/app/buddy-application?type=maker" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-10 px-6 text-sm font-medium hover:bg-primary/90 transition-colors">
            {myApplication?.status === "pending" ? "Ver estado de mi solicitud" : "Solicitar acceso"}
          </a>
        </div>
      </AppLayout>
    );
  }

  const difficultyColors: Record<string, string> = { easy: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", hard: "bg-red-100 text-red-700" };
  const difficultyLabels: Record<string, string> = { easy: "Fácil", medium: "Media", hard: "Difícil" };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}>
            👨‍🍳
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-black text-gray-900">Panel BuddyMaker</h1>
            <p className="text-xs text-gray-500">Gestiona tu perfil y tus recetas</p>
          </div>
          <a href="/app/buddy-maker-stats" className="flex items-center gap-1.5 rounded-xl bg-orange-50 px-3 py-1.5 text-sm font-semibold text-[#FF6B35] hover:bg-orange-100 transition-colors">
            <span>📊</span> Estadísticas
          </a>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 rounded-2xl p-1">
          {(["/app/profile", "/app/recipes"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? "bg-white text-green-600 shadow-sm" : "text-gray-500"}`}
            >
              {tab === "/app/profile" ? "👤 Mi Perfil" : "🍽️ Mis Recetas"}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "/app/profile" && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-black text-gray-900 mb-2">
              {myProfile ? "Editar perfil de creador" : "Crear perfil de creador"}
            </h2>
            {!myProfile && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800">
                <strong>¿Te apasiona la cocina saludable?</strong> Crea tu perfil de BuddyMaker para compartir tus recetas con la comunidad y ganar seguidores.
              </div>
            )}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Nombre público *</label>
                <input
                  required
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                  placeholder="Ej: Carlos Cocina Sana"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Especialidad culinaria</label>
                <input
                  value={profileForm.specialty}
                  onChange={(e) => setProfileForm((p) => ({ ...p, specialty: e.target.value }))}
                  placeholder="Ej: Cocina mediterránea, Repostería saludable..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">Bio / Presentación</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
                  placeholder="Cuéntanos tu historia y qué tipo de recetas compartes..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">URL foto de perfil</label>
                <input
                  value={profileForm.avatarUrl}
                  onChange={(e) => setProfileForm((p) => ({ ...p, avatarUrl: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">URL imagen de portada</label>
                <input
                  value={profileForm.coverUrl}
                  onChange={(e) => setProfileForm((p) => ({ ...p, coverUrl: e.target.value }))}
                  placeholder="https://..."
                  type="url"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">Instagram</label>
                  <input
                    value={profileForm.instagramHandle}
                    onChange={(e) => setProfileForm((p) => ({ ...p, instagramHandle: e.target.value }))}
                    placeholder="@usuario"
                    className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">YouTube</label>
                  <input
                    value={profileForm.youtubeHandle}
                    onChange={(e) => setProfileForm((p) => ({ ...p, youtubeHandle: e.target.value }))}
                    placeholder="@canal"
                    className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">TikTok</label>
                  <input
                    value={profileForm.tiktokHandle}
                    onChange={(e) => setProfileForm((p) => ({ ...p, tiktokHandle: e.target.value }))}
                    placeholder="@usuario"
                    className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              disabled={createProfileMutation.isPending || updateProfileMutation.isPending}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
            >
              {(createProfileMutation.isPending || updateProfileMutation.isPending)
                ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                : myProfile ? "✓ Guardar cambios" : "✓ Crear perfil de creador"}
            </button>
          </form>
        )}

        {/* Recipes Tab */}
        {activeTab === "/app/recipes" && (
          <div className="space-y-4">
            {!myProfile && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-sm text-green-800 text-center">
                Primero debes crear tu perfil de creador en la pestaña "Mi Perfil".
              </div>
            )}
            {myProfile && !showRecipeForm && (
              <>
                <button
                  onClick={() => { resetRecipeForm(); setEditingRecipe(null); setShowRecipeForm(true); }}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
                >
                  + Publicar nueva receta
                </button>
                {(!myRecipes || myRecipes.length === 0) ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-5xl mb-3">🍽️</div>
                    <p className="font-semibold">Aún no has publicado ninguna receta</p>
                    <p className="text-sm mt-1">Comparte tus recetas favoritas con la comunidad</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myRecipes.map((recipe) => (
                      <div key={recipe.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-start gap-3">
                          <img
                            src={recipe.imageUrl || RECIPE_PLACEHOLDER_IMAGE}
                            alt={recipe.name}
                            className="w-16 h-16 rounded-xl object-cover shrink-0"
                            onError={e => { (e.target as HTMLImageElement).src = RECIPE_PLACEHOLDER_IMAGE; }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{recipe.name}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{recipe.description}</p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {recipe.difficulty && (
                                <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${difficultyColors[recipe.difficulty]}`}>
                                  {difficultyLabels[recipe.difficulty]}
                                </span>
                              )}
                              {recipe.caloriesPerServing && (
                                <span className="text-xs text-gray-400">{recipe.caloriesPerServing} kcal</span>
                              )}
                              {recipe.preparationTime && (
                                <span className="text-xs text-gray-400">{recipe.preparationTime + (recipe.cookTime ?? 0)} min</span>
                              )}
                              <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${recipe.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {recipe.isPublic ? "Pública" : "Privada"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => openEditRecipe(recipe)}
                              className="text-xs font-bold text-green-600 bg-green-50 rounded-xl px-3 py-1.5"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => { if (confirm("¿Eliminar esta receta?")) deleteRecipeMutation.mutate({ recipeId: recipe.id }); }}
                              className="text-xs font-bold text-red-500 bg-red-50 rounded-xl px-3 py-1.5"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Recipe Form */}
            {showRecipeForm && (
              <form onSubmit={handleSaveRecipe} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-gray-900">
                    {editingRecipe ? "Editar receta" : "Nueva receta"}
                  </h2>
                  <button type="button" onClick={() => { setShowRecipeForm(false); setEditingRecipe(null); }} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
                </div>

                {/* Basic info */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Nombre de la receta *</label>
                    <input
                      required
                      value={recipeForm.name}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Ej: Ensalada mediterránea con quinoa"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Descripción</label>
                    <textarea
                      value={recipeForm.description}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Describe brevemente la receta..."
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">URL imagen de la receta</label>
                    <input
                      value={recipeForm.imageUrl}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, imageUrl: e.target.value }))}
                      placeholder="https://..."
                      type="url"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>

                {/* Times & servings */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Prep. (min)</label>
                    <input
                      value={recipeForm.prepTime}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, prepTime: e.target.value }))}
                      type="number" min="0" placeholder="15"
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Cocción (min)</label>
                    <input
                      value={recipeForm.cookTime}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, cookTime: e.target.value }))}
                      type="number" min="0" placeholder="20"
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Raciones</label>
                    <input
                      value={recipeForm.servings}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, servings: e.target.value }))}
                      type="number" min="1" placeholder="2"
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>

                {/* Nutritional info */}
                <div>
                  <label className="text-xs font-bold text-gray-600 mb-2 block">Información nutricional (por ración)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: "calories", label: "Kcal", placeholder: "350" },
                      { key: "protein", label: "Prot. (g)", placeholder: "25" },
                      { key: "carbs", label: "HC (g)", placeholder: "40" },
                      { key: "fat", label: "Grasa (g)", placeholder: "12" },
                    ].map(({ key, label, placeholder }) => (
                      <div key={key}>
                        <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                        <input
                          value={(recipeForm as any)[key]}
                          onChange={(e) => setRecipeForm((p) => ({ ...p, [key]: e.target.value }))}
                          type="number" min="0" placeholder={placeholder}
                          className="w-full rounded-xl border border-gray-200 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Classification */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Momento del día</label>
                    <select
                      value={recipeForm.mealTime}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, mealTime: e.target.value as MealTime }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      {MEAL_TIMES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Dificultad</label>
                    <select
                      value={recipeForm.difficulty}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, difficulty: e.target.value as Difficulty }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Método de cocción</label>
                    <select
                      value={recipeForm.cookingMethod}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, cookingMethod: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <option value="">Sin especificar</option>
                      {COOKING_METHODS.map((m) => <option key={m} value={m.toLowerCase()}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Tipo de cocina</label>
                    <select
                      value={recipeForm.cuisineType}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, cuisineType: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    >
                      <option value="">Sin especificar</option>
                      {CUISINE_TYPES.map((c) => <option key={c} value={c.toLowerCase()}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Ingredients */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-600">Ingredientes</label>
                    <button type="button" onClick={addIngredient} className="text-xs font-bold text-green-600">+ Añadir</button>
                  </div>
                  <div className="space-y-2">
                    {recipeForm.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          value={ing.name}
                          onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                          placeholder="Ingrediente"
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        <input
                          value={ing.amount}
                          onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                          placeholder="Cant."
                          className="w-16 rounded-xl border border-gray-200 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        <input
                          value={ing.unit}
                          onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                          placeholder="Ud."
                          className="w-14 rounded-xl border border-gray-200 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                        />
                        {recipeForm.ingredients.length > 1 && (
                          <button type="button" onClick={() => removeIngredient(idx)} className="text-red-400 font-bold text-sm px-1">×</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Steps */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-600">Pasos de elaboración</label>
                    <button type="button" onClick={addStep} className="text-xs font-bold text-green-600">+ Añadir paso</button>
                  </div>
                  <div className="space-y-2">
                    {recipeForm.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-black flex items-center justify-center shrink-0 mt-2">{idx + 1}</span>
                        <textarea
                          value={step.text}
                          onChange={(e) => updateStep(idx, e.target.value)}
                          placeholder={`Paso ${idx + 1}...`}
                          rows={2}
                          className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                        />
                        {recipeForm.steps.length > 1 && (
                          <button type="button" onClick={() => removeStep(idx)} className="text-red-400 font-bold text-sm px-1 mt-2">×</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extra */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Alérgenos</label>
                    <input
                      value={recipeForm.allergens}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, allergens: e.target.value }))}
                      placeholder='["gluten","lacteos"]'
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 mb-1 block">Etiquetas</label>
                    <input
                      value={recipeForm.tags}
                      onChange={(e) => setRecipeForm((p) => ({ ...p, tags: e.target.value }))}
                      placeholder='["rapida","fitness"]'
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-400"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isPublicRecipe"
                    checked={recipeForm.isPublic}
                    onChange={(e) => setRecipeForm((p) => ({ ...p, isPublic: e.target.checked }))}
                    className="w-4 h-4 accent-green-500"
                  />
                  <label htmlFor="isPublicRecipe" className="text-sm font-semibold text-gray-700">Publicar como receta pública (visible para todos)</label>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setShowRecipeForm(false); setEditingRecipe(null); }}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-gray-600 bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createRecipeMutation.isPending || updateRecipeMutation.isPending}
                    className="flex-1 py-3 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #22C55E, #16A34A)" }}
                  >
                    {(createRecipeMutation.isPending || updateRecipeMutation.isPending)
                      ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</>
                      : editingRecipe ? "✓ Guardar cambios" : "✓ Publicar receta"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
