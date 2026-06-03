import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface RecipeResult {
  name: string;
  description: string;
  preparationTime: number;
  cookTime: number;
  servings: number;
  difficulty: string;
  mealTime: string;
  cuisineType: string;
  cookingMethod: string;
  caloriesPerServing: number;
  proteinsPerServing: number;
  carbsPerServing: number;
  fatsPerServing: number;
  fiberPerServing: number;
  ingredients: Array<{ name: string; amount: string; unit: string; category: string }>;
  instructions: Array<{ step: number; text: string }>;
  tags: string[];
  inspirationNote: string;
}

export default function InstagramRecipeImport() {
  const [, navigate] = useLocation();
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [lowerCalories, setLowerCalories] = useState(false);
  const [higherProtein, setHigherProtein] = useState(false);
  const [adaptAllergies, setAdaptAllergies] = useState(false);
  const [result, setResult] = useState<{ recipe: RecipeResult; disclaimer: string } | null>(null);

  const generateMutation = trpc.instagramRecipe.generateFromUrl.useMutation({
    onSuccess: (data) => {
      setResult(data as { recipe: RecipeResult; disclaimer: string });
      toast.success("¡Receta generada con éxito!");
    },
    onError: (err) => {
      toast.error(err.message || "Error al generar la receta");
    },
  });

  const saveMutation = trpc.instagramRecipe.saveRecipe.useMutation({
    onSuccess: (data) => {
      toast.success("¡Receta guardada en tu colección!");
      navigate(`/app/recipes/${data.id}`);
    },
    onError: (err) => {
      toast.error(err.message || "Error al guardar");
    },
  });

  const handleGenerate = () => {
    if (!url.includes("instagram.com")) {
      toast.error("Por favor, introduce una URL válida de Instagram");
      return;
    }
    generateMutation.mutate({
      url,
      caption: caption || undefined,
      preferences: {
        lowerCalories,
        higherProtein,
        adaptToAllergies: adaptAllergies,
      },
    });
  };

  const handleSave = () => {
    if (!result) return;
    const r = result.recipe;
    saveMutation.mutate({
      name: r.name,
      description: r.description,
      preparationTime: r.preparationTime,
      cookTime: r.cookTime,
      servings: r.servings,
      difficulty: r.difficulty as "easy" | "medium" | "hard",
      mealTime: r.mealTime,
      cuisineType: r.cuisineType,
      cookingMethod: r.cookingMethod,
      caloriesPerServing: r.caloriesPerServing,
      proteinsPerServing: r.proteinsPerServing,
      carbsPerServing: r.carbsPerServing,
      fatsPerServing: r.fatsPerServing,
      fiberPerServing: r.fiberPerServing,
      ingredientsJson: JSON.stringify(r.ingredients),
      instructionsJson: JSON.stringify(r.instructions),
      tags: JSON.stringify([...r.tags, "instagram-inspired"]),
      sourceUrl: url,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          📸 Importar Receta de Instagram
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pega el enlace de un reel o post de Instagram y te generaremos una receta original inspirada en él.
        </p>
      </div>

      {/* Input Section */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Enlace de Instagram</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="https://www.instagram.com/reel/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="text-sm"
          />
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Descripción del post (opcional, mejora el resultado)
            </label>
            <Textarea
              placeholder="Pega aquí la descripción/caption del post si la tienes..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground/80">Preferencias:</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={lowerCalories}
                onChange={(e) => setLowerCalories(e.target.checked)}
                className="rounded border-border/80 text-orange-500 focus:ring-orange-500"
              />
              Más baja en calorías (máx. 400 kcal)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={higherProtein}
                onChange={(e) => setHigherProtein(e.target.checked)}
                className="rounded border-border/80 text-orange-500 focus:ring-orange-500"
              />
              Más alta en proteína (mín. 35g)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={adaptAllergies}
                onChange={(e) => setAdaptAllergies(e.target.checked)}
                className="rounded border-border/80 text-orange-500 focus:ring-orange-500"
              />
              Adaptar a mis alergias
            </label>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!url || generateMutation.isPending}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white"
          >
            {generateMutation.isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando receta con IA...
              </span>
            ) : (
              "✨ Generar receta inspirada"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 text-xs text-amber-800">
        <strong>⚠️ Nota legal:</strong> Buddy One genera recetas <strong>originales</strong> inspiradas en el contenido.
        No copiamos recetas de terceros. La IA crea una versión única con ingredientes y proporciones diferentes,
        manteniendo solo el concepto general del plato.
      </div>

      {/* Result */}
      {result && (
        <Card className="border-green-200 bg-green-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              ✅ {result.recipe.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{result.recipe.description}</p>
            <p className="text-xs text-muted-foreground/70 italic mt-1">💡 {result.recipe.inspirationNote}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Macros */}
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-card rounded-lg p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-orange-500">{result.recipe.caloriesPerServing}</div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </div>
              <div className="bg-card rounded-lg p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-green-600">{result.recipe.proteinsPerServing}g</div>
                <div className="text-xs text-muted-foreground">Proteína</div>
              </div>
              <div className="bg-card rounded-lg p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-blue-500">{result.recipe.carbsPerServing}g</div>
                <div className="text-xs text-muted-foreground">Carbos</div>
              </div>
              <div className="bg-card rounded-lg p-2 text-center shadow-sm">
                <div className="text-lg font-bold text-yellow-600">{result.recipe.fatsPerServing}g</div>
                <div className="text-xs text-muted-foreground">Grasas</div>
              </div>
            </div>

            {/* Info */}
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>⏱ {result.recipe.preparationTime + result.recipe.cookTime} min</span>
              <span>🍽 {result.recipe.servings} ración{result.recipe.servings > 1 ? "es" : ""}</span>
              <span>📍 {result.recipe.cuisineType}</span>
              <span>🔥 {result.recipe.cookingMethod}</span>
            </div>

            {/* Ingredients */}
            <div>
              <h3 className="font-semibold text-sm mb-2">🥗 Ingredientes</h3>
              <ul className="space-y-1">
                {result.recipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex justify-between">
                    <span>{ing.name}</span>
                    <span className="text-muted-foreground">{ing.amount} {ing.unit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div>
              <h3 className="font-semibold text-sm mb-2">👨‍🍳 Instrucciones</h3>
              <ol className="space-y-2">
                {result.recipe.instructions.map((inst) => (
                  <li key={inst.step} className="text-sm text-foreground/80">
                    <span className="font-medium text-orange-500">{inst.step}.</span> {inst.text}
                  </li>
                ))}
              </ol>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
              {result.recipe.tags.map((tag) => (
                <span key={tag} className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {saveMutation.isPending ? "Guardando..." : "💾 Guardar en mis recetas"}
            </Button>

            <p className="text-xs text-muted-foreground/70 text-center">{result.disclaimer}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
