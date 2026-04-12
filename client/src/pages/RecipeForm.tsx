import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Plus, Trash2, Sparkles, Search, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "@/components/sonner-a11y-shim";

interface IngredientEntry {
  id?: number;
  name: string;
  quantity: string;
  unit: string;
}

const COMMON_UNITS = ["g", "kg", "ml", "l", "unidad", "cucharada", "cucharadita", "taza", "al gusto"];

export default function RecipeForm() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const isEditing = !!id;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [preparationTime, setPreparationTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("4");
  const [difficulty, setDifficulty] = useState("medium");
  const [mealTime, setMealTime] = useState<string>("");
  const [isPublic, setIsPublic] = useState(true);
  const [calories, setCalories] = useState("");
  const [proteins, setProteins] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [steps, setSteps] = useState<{ stepNumber: number; description: string }[]>([
    { stepNumber: 1, description: "" },
  ]);

  // Ingredients
  const [ingredients, setIngredients] = useState<IngredientEntry[]>([
    { name: "", quantity: "", unit: "g" },
  ]);
  const [searchQuery, setSearchQuery] = useState<string[]>([""]);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const { data: ingredientsList } = trpc.ingredients.getAll.useQuery({ limit: 200 });
  const [generatingImage, setGeneratingImage] = useState(false);
  const generateAIImage = trpc.recipes.generateAIImage.useMutation();

  const createRecipe = trpc.recipes.create.useMutation({
    onSuccess: async (data) => {
      toast.success("¡Receta creada con éxito!");
      // Auto-generate AI image for public recipes
      if (isPublic && data?.id) {
        setGeneratingImage(true);
        toast.loading("✨ Generando imagen con IA...", { id: "gen-img" });
        try {
          await generateAIImage.mutateAsync({ recipeId: data.id });
          toast.success("¡Imagen generada con IA! 📸", { id: "gen-img" });
        } catch {
          toast.dismiss("gen-img");
        } finally {
          setGeneratingImage(false);
        }
      }
      navigate(`/app/recipes/${data?.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const calculateNutrition = trpc.recipes.calculateNutrition.useMutation<{ calories: number; protein: number; carbs: number; fat: number }>({
    onSuccess: (data: any) => {
      setCalories(String(data.calories));
      setProteins(String(data.protein));
      setCarbs(String(data.carbs));
      setFats(String(data.fat));
      toast.success("¡Valores nutricionales calculados automáticamente! 🧠");
    },
    onError: () => toast.error("No se pudo calcular la nutrición. Inténtalo de nuevo."),
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "g" }]);
    setSearchQuery([...searchQuery, ""]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
    setSearchQuery(searchQuery.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof IngredientEntry, value: string) => {
    setIngredients(ingredients.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
    if (field === "name") {
      setSearchQuery(searchQuery.map((q, i) => i === index ? value : q));
    }
  };

  const selectIngredient = (index: number, name: string) => {
    updateIngredient(index, "name", name);
    setShowDropdown(null);
  };

  const filteredIngredients = (index: number) => {
    const q = searchQuery[index]?.toLowerCase() ?? "";
    if (!q || !ingredientsList) return [];
      return ingredientsList.filter(ing =>
      (ing.nameEs ?? "").toLowerCase().includes(q)
    ).slice(0, 8);
  };

  const handleCalculateNutrition = () => {
    const validIngredients = ingredients.filter(i => i.name.trim() && i.quantity);
    if (validIngredients.length === 0) {
      toast.error("Añade al menos un ingrediente con cantidad para calcular la nutrición");
      return;
    }
    setCalcLoading(true);
    calculateNutrition.mutate({
      ingredients: validIngredients.map(i => ({
        name: i.name.trim(),
        quantity: parseFloat(i.quantity) || 0,
        unit: i.unit,
      })),
      servings: parseInt(servings) || 1,
    }, {
      onSettled: () => setCalcLoading(false),
    });
  };

  const addStep = () => {
    setSteps([...steps, { stepNumber: steps.length + 1, description: "" }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const updateStep = (index: number, description: string) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, description } : s)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("El nombre de la receta es obligatorio");
      return;
    }
    const validIngredients = ingredients.filter(i => i.name.trim());
    const ingredientsJson = validIngredients.length > 0
      ? JSON.stringify(validIngredients.map(i => ({
          name: i.name.trim(),
          quantity: i.quantity ? parseFloat(i.quantity) : undefined,
          unit: i.unit,
        })))
      : undefined;

    const validSteps = steps.filter(s => s.description.trim());
    const instructionsJson = validSteps.length > 0
      ? JSON.stringify(validSteps.map((s, idx) => ({ step: idx + 1, text: s.description.trim() })))
      : undefined;

    createRecipe.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      preparationTime: preparationTime ? Number(preparationTime) : undefined,
      cookTime: cookTime ? Number(cookTime) : undefined,
      servings: Number(servings),
      difficulty: difficulty as "easy" | "medium" | "hard",
      mealTime: (mealTime || undefined) as any,
      isPublic,
      calories: calories ? Number(calories) : undefined,
      protein: proteins ? Number(proteins) : undefined,
      carbs: carbs ? Number(carbs) : undefined,
      fat: fats ? Number(fats) : undefined,
      ingredientsJson,
      instructionsJson,
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/app/recipes">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Volver a recetas
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {isEditing ? "Editar receta" : "Nueva receta"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isEditing ? "Modifica los datos de tu receta" : "Crea una nueva receta para tu colección"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Información básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre de la receta *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Pasta carbonara"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe brevemente tu receta..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="prep">Preparación (min)</Label>
                <Input id="prep" type="number" min="0" value={preparationTime} onChange={(e) => setPreparationTime(e.target.value)} placeholder="15" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cook">Cocción (min)</Label>
                <Input id="cook" type="number" min="0" value={cookTime} onChange={(e) => setCookTime(e.target.value)} placeholder="30" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="servings">Porciones</Label>
                <Input id="servings" type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="difficulty">Dificultad</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger id="difficulty"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Fácil</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="hard">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mealTime">Momento del día</Label>
              <Select value={mealTime} onValueChange={setMealTime}>
                <SelectTrigger id="mealTime"><SelectValue placeholder="Selecciona cuándo se toma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="desayuno">☀️ Desayuno</SelectItem>
                  <SelectItem value="media_manana">🍎 Media mañana</SelectItem>
                  <SelectItem value="comida">🥗 Comida</SelectItem>
                  <SelectItem value="merienda">🫐 Merienda</SelectItem>
                  <SelectItem value="cena">🌙 Cena</SelectItem>
                  <SelectItem value="cualquiera">🕐 Cualquier momento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
              <Label htmlFor="isPublic" className="cursor-pointer">
                Receta pública (visible para todos)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Ingredientes</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Añade los ingredientes con sus cantidades exactas</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="w-4 h-4 mr-1.5" />
                Añadir
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3" ref={dropdownRef}>
            {ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2 items-start">
                {/* Ingredient name with search */}
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={ing.name}
                      onChange={(e) => {
                        updateIngredient(index, "name", e.target.value);
                        setShowDropdown(index);
                      }}
                      onFocus={() => setShowDropdown(index)}
                      placeholder="Buscar ingrediente..."
                      className="pl-8 text-sm"
                    />
                  </div>
                  {showDropdown === index && filteredIngredients(index).length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
                      {filteredIngredients(index).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-orange-50 hover:text-orange-700 transition-colors flex items-center gap-2"
                          onClick={() => selectIngredient(index, item.nameEs ?? "")}
                        >
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt="" className="w-5 h-5 rounded object-cover" />
                          )}
                          {item.nameEs}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Quantity */}
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={ing.quantity}
                  onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                  placeholder="Cant."
                  className="w-20 text-sm shrink-0"
                />
                {/* Unit */}
                <Select value={ing.unit} onValueChange={(v) => updateIngredient(index, "unit", v)}>
                  <SelectTrigger className="w-28 text-sm shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_UNITS.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {ingredients.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeIngredient(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {ingredients.filter(i => i.name.trim()).length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Añade ingredientes para poder calcular la nutrición automáticamente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Nutrition */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Información nutricional (por porción)</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Se calcula automáticamente a partir de los ingredientes</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCalculateNutrition}
                disabled={calcLoading || calculateNutrition.isPending}
                className="border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
              >
                {(calcLoading || calculateNutrition.isPending) ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-1.5" />
                )}
                Calcular con IA
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Calorías (kcal)", value: calories, setter: setCalories, placeholder: "450", emoji: "🔥" },
                { label: "Proteínas (g)", value: proteins, setter: setProteins, placeholder: "25", emoji: "💪" },
                { label: "Carbohidratos (g)", value: carbs, setter: setCarbs, placeholder: "60", emoji: "🌾" },
                { label: "Grasas (g)", value: fats, setter: setFats, placeholder: "15", emoji: "🫒" },
              ].map((field) => (
                <div key={field.label} className="space-y-1.5">
                  <Label className="text-xs">{field.emoji} {field.label}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    className={field.value ? "border-orange-200 bg-orange-50/30" : ""}
                  />
                </div>
              ))}
            </div>
            {(calories || proteins || carbs || fats) && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {calories && <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-700">🔥 {calories} kcal</Badge>}
                {proteins && <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">💪 {proteins}g proteína</Badge>}
                {carbs && <Badge variant="secondary" className="text-xs bg-yellow-50 text-yellow-700">🌾 {carbs}g carbos</Badge>}
                {fats && <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">🫒 {fats}g grasas</Badge>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Pasos de preparación</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="w-4 h-4 mr-1.5" />
                Añadir paso
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-2">
                  {step.stepNumber}
                </div>
                <Textarea
                  value={step.description}
                  onChange={(e) => updateStep(index, e.target.value)}
                  placeholder={`Describe el paso ${step.stepNumber}...`}
                  rows={2}
                  className="flex-1"
                />
                {steps.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 mt-1 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStep(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link href="/app/recipes">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={createRecipe.isPending || generatingImage}>
            {(createRecipe.isPending || generatingImage) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {generatingImage ? "Generando imagen IA..." : isEditing ? "Guardar cambios" : isPublic ? "Crear receta pública ✨" : "Crear receta"}
          </Button>
        </div>
      </form>
    </div>
  );
}
