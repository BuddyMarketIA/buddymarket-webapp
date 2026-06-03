import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, Upload, Trash2, Plus, ChefHat, ShoppingCart, Sparkles, RefreshCw } from "lucide-react";

interface Ingredient {
  name: string;
  estimatedAmount?: string;
  unit?: string;
  category?: string;
}

interface MealFromScan {
  mealTime: string;
  name: string;
  ingredients: string[];
  calories?: number;
  protein?: number;
  recipe?: { steps: string[]; prepTime?: number };
}

interface ScanMenu {
  meals: MealFromScan[];
  missingIngredients: string[];
  nutritionSummary: { totalCalories?: number; totalProtein?: number; totalCarbs?: number; totalFat?: number };
}

const MEAL_TIME_LABELS: Record<string, string> = {
  desayuno: "🌅 Desayuno",
  media_manana: "🍎 Media mañana",
  comida: "🍽️ Comida",
  merienda: "🫐 Merienda",
  cena: "🌙 Cena",
};

const CATEGORY_COLORS: Record<string, string> = {
  verdura: "bg-green-100 text-green-800",
  fruta: "bg-yellow-100 text-yellow-800",
  proteína: "bg-red-100 text-red-800",
  lácteo: "bg-blue-100 text-blue-800",
  cereal: "bg-amber-100 text-amber-800",
  otro: "bg-muted/50 text-foreground/80",
};

export default function FridgeScanner() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/jpeg");
  const [scanId, setScanId] = useState<number | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [generatedMenu, setGeneratedMenu] = useState<ScanMenu | null>(null);
  const [dietType, setDietType] = useState("equilibrada");
  const [step, setStep] = useState<"upload" | "review" | "menu">("upload");
  const [expandedMeal, setExpandedMeal] = useState<number | null>(null);

  const scanMutation = trpc.fridge.scan.useMutation({
    onSuccess: (data) => {
      setScanId(data.scanId);
      setIngredients((data.ingredients as Ingredient[]) ?? []);
      setStep("review");
      toast.success(`¡${(data.ingredients as Ingredient[]).length} ingredientes detectados!`);
    },
    onError: (e) => toast.error(`Error al escanear: ${e.message}`),
  });

  const generateMenuMutation = trpc.fridge.generateMenuFromScan.useMutation({
    onSuccess: (data) => {
      setGeneratedMenu(data as ScanMenu);
      setStep("menu");
      toast.success("¡Menú generado con tus ingredientes!");
    },
    onError: (e) => toast.error(`Error al generar menú: ${e.message}`),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error("La imagen no puede superar 16 MB");
      return;
    }
    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreviewUrl(result);
      // Extract base64 without the data URL prefix
      const base64 = result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = () => {
    if (!imageBase64) return;
    scanMutation.mutate({ imageBase64, mimeType });
  };

  const handleGenerateMenu = () => {
    if (!scanId) return;
    generateMenuMutation.mutate({
      scanId,
      ingredientsJson: JSON.stringify(ingredients),
      mealsPerDay: 5,
      dietType,
    });
  };

  const removeIngredient = (idx: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { name: "", estimatedAmount: "", category: "otro" }]);
  };

  const updateIngredient = (idx: number, field: keyof Ingredient, value: string) => {
    setIngredients((prev) => prev.map((ing, i) => i === idx ? { ...ing, [field]: value } : ing));
  };

  const resetScan = () => {
    setPreviewUrl(null);
    setImageBase64(null);
    setScanId(null);
    setIngredients([]);
    setGeneratedMenu(null);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Camera className="w-5 h-5 text-orange-500" />
              Escáner de nevera
            </h1>
            <p className="text-sm text-muted-foreground">Fotografía tu nevera y genera un menú con lo que tienes</p>
          </div>
          {step !== "upload" && (
            <Button variant="outline" size="sm" onClick={resetScan}>
              <RefreshCw className="w-4 h-4 mr-1" /> Nueva foto
            </Button>
          )}
        </div>
        {/* Progress steps */}
        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2">
          {(["upload", "review", "menu"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? "bg-orange-500 text-white" : (["upload", "review", "menu"].indexOf(step) > i ? "bg-green-500 text-white" : "bg-gray-200 text-muted-foreground")}`}>
                {i + 1}
              </div>
              <span className={`text-xs ${step === s ? "text-orange-600 font-medium" : "text-muted-foreground/70"}`}>
                {s === "upload" ? "Foto" : s === "review" ? "Revisar" : "Menú"}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <Card>
            <CardContent className="pt-6">
              <div
                className="border-2 border-dashed border-orange-300 rounded-xl p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Nevera" className="max-h-64 mx-auto rounded-lg object-contain" />
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                      <Camera className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground/80">Fotografía tu nevera o despensa</p>
                      <p className="text-sm text-muted-foreground mt-1">Toca para seleccionar una imagen</p>
                    </div>
                    <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground/70">
                      <Upload className="w-3 h-3" />
                      <span>JPG, PNG, WEBP — máx. 16 MB</span>
                    </div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

              {previewUrl && (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Cambiar foto
                    </Button>
                    <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleScan} disabled={scanMutation.isPending}>
                      {scanMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analizando...</> : <><Sparkles className="w-4 h-4 mr-2" /> Detectar ingredientes</>}
                    </Button>
                  </div>
                  <p className="text-xs text-center text-muted-foreground/70">La IA analizará tu nevera y detectará todos los alimentos visibles</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* STEP 2: Review ingredients */}
        {step === "review" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Ingredientes detectados</CardTitle>
                  <Badge variant="secondary">{ingredients.length} encontrados</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Revisa y edita la lista antes de generar el menú</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {ingredients.map((ing, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[ing.category ?? "otro"] ?? CATEGORY_COLORS.otro}`}>
                      {ing.category ?? "otro"}
                    </span>
                    <Input
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                      className="flex-1 h-7 text-sm border-0 bg-transparent focus-visible:ring-0 p-0"
                      placeholder="Nombre del ingrediente"
                    />
                    <Input
                      value={ing.estimatedAmount ?? ""}
                      onChange={(e) => updateIngredient(idx, "estimatedAmount", e.target.value)}
                      className="w-20 h-7 text-xs border-0 bg-transparent focus-visible:ring-0 p-0 text-muted-foreground"
                      placeholder="cantidad"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/70 hover:text-red-500" onClick={() => removeIngredient(idx)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2" onClick={addIngredient}>
                  <Plus className="w-4 h-4 mr-1" /> Añadir ingrediente
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label className="text-sm font-medium">Tipo de dieta</Label>
                  <Select value={dietType} onValueChange={setDietType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equilibrada">Equilibrada</SelectItem>
                      <SelectItem value="mediterranea">Mediterránea</SelectItem>
                      <SelectItem value="baja_calorias">Baja en calorías</SelectItem>
                      <SelectItem value="alta_proteina">Alta en proteína</SelectItem>
                      <SelectItem value="vegana">Vegana</SelectItem>
                      <SelectItem value="vegetariana">Vegetariana</SelectItem>
                      <SelectItem value="sin_gluten">Sin gluten</SelectItem>
                      <SelectItem value="keto">Keto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-orange-500 hover:bg-orange-600"
                  onClick={handleGenerateMenu}
                  disabled={generateMenuMutation.isPending || ingredients.filter(i => i.name.trim()).length === 0}
                >
                  {generateMenuMutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando menú...</>
                    : <><ChefHat className="w-4 h-4 mr-2" /> Generar menú con estos ingredientes</>
                  }
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* STEP 3: Generated menu */}
        {step === "menu" && generatedMenu && (
          <div className="space-y-4">
            {/* Nutrition summary */}
            {generatedMenu.nutritionSummary?.totalCalories && (
              <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0">
                <CardContent className="pt-4">
                  <p className="text-sm font-medium opacity-90 mb-2">Resumen nutricional del menú</p>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div><p className="text-xl font-bold">{generatedMenu.nutritionSummary.totalCalories}</p><p className="text-xs opacity-80">kcal</p></div>
                    <div><p className="text-xl font-bold">{generatedMenu.nutritionSummary.totalProtein}g</p><p className="text-xs opacity-80">proteína</p></div>
                    <div><p className="text-xl font-bold">{generatedMenu.nutritionSummary.totalCarbs}g</p><p className="text-xs opacity-80">carbos</p></div>
                    <div><p className="text-xl font-bold">{generatedMenu.nutritionSummary.totalFat}g</p><p className="text-xs opacity-80">grasa</p></div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meals */}
            <div className="space-y-3">
              {generatedMenu.meals.map((meal, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between cursor-pointer" onClick={() => setExpandedMeal(expandedMeal === idx ? null : idx)}>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-orange-600 mb-1">{MEAL_TIME_LABELS[meal.mealTime] ?? meal.mealTime}</p>
                        <p className="font-semibold text-foreground">{meal.name}</p>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          {meal.calories && <span>🔥 {meal.calories} kcal</span>}
                          {meal.protein && <span>💪 {meal.protein}g prot.</span>}
                          {meal.recipe?.prepTime && <span>⏱️ {meal.recipe.prepTime} min</span>}
                        </div>
                      </div>
                      <span className="text-muted-foreground/70 text-sm">{expandedMeal === idx ? "▲" : "▼"}</span>
                    </div>

                    {expandedMeal === idx && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {meal.ingredients && meal.ingredients.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Ingredientes:</p>
                            <div className="flex flex-wrap gap-1">
                              {meal.ingredients.map((ing, i) => (
                                <span key={i} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{ing}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {meal.recipe?.steps && meal.recipe.steps.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Preparación:</p>
                            <ol className="space-y-1">
                              {meal.recipe.steps.map((step, i) => (
                                <li key={i} className="text-xs text-foreground/80 flex gap-2">
                                  <span className="w-4 h-4 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[10px]">{i + 1}</span>
                                  <span>{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Missing ingredients */}
            {generatedMenu.missingIngredients && generatedMenu.missingIngredients.length > 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800">Ingredientes que te faltan</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {generatedMenu.missingIngredients.map((item, i) => (
                      <span key={i} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{item}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button variant="outline" className="w-full" onClick={resetScan}>
              <Camera className="w-4 h-4 mr-2" /> Escanear otra nevera
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
