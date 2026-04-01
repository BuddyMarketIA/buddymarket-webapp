import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Clock,
  Edit,
  Heart,
  Loader2,
  Trash2,
  Users,
  Utensils,
  ChefHat,
  BarChart3,
  ShoppingCart,
} from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const { data: recipe, isLoading } = trpc.recipes.getById.useQuery(
    { id: Number(id) },
    { enabled: !!id }
  );

  const utils = trpc.useUtils();

  const toggleFav = trpc.recipes.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.recipes.getById.invalidate({ id: Number(id) });
      toast.success("Favoritos actualizados");
    },
  });

  const deleteRecipe = trpc.recipes.delete.useMutation({
    onSuccess: () => {
      toast.success("Receta eliminada");
      navigate("/recipes");
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!recipe) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Receta no encontrada</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/recipes">Volver a recetas</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const isOwner = user?.id === recipe.userId;
  const totalTime = (recipe.preparationTime || 0) + (recipe.cookTime || 0);
  const difficultyLabel = { easy: "Fácil", medium: "Media", hard: "Difícil" }[recipe.difficulty as string] || recipe.difficulty;

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/recipes">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Volver a recetas
          </Link>
        </Button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              {recipe.difficulty && (
                <Badge variant="secondary">
                  {difficultyLabel}
                </Badge>
              )}
              {recipe.isPublic && <Badge variant="outline">Pública</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {recipe.name}
            </h1>
            {recipe.description && (
              <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
              {recipe.preparationTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Prep: {recipe.preparationTime} min
                </span>
              )}
              {recipe.cookTime && (
                <span className="flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4" />
                  Cocción: {recipe.cookTime} min
                </span>
              )}
              {recipe.servings && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {recipe.servings} porciones
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleFav.mutate({ recipeId: recipe.id })}
            >
              <Heart className="w-4 h-4 mr-1.5" />
              Favorito
            </Button>
            {isOwner && (
              <>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/recipes/${recipe.id}/edit`}>
                    <Edit className="w-4 h-4 mr-1.5" />
                    Editar
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm("¿Eliminar esta receta?")) {
                      deleteRecipe.mutate({ id: recipe.id });
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Ingredients */}
          <div className="lg:col-span-1">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="w-4.5 h-4.5 text-primary" />
                  Ingredientes
                  {recipe.servings && (
                    <span className="text-xs font-normal text-muted-foreground ml-auto">
                      para {recipe.servings} pers.
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recipe.ingredients && recipe.ingredients.length > 0 ? (
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ing: any, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-foreground">
                          {ing.amount && `${ing.amount} `}
                          {ing.measure?.nameEs && `${ing.measure.nameEs} de `}
                          {ing.ingredient?.nameEs || ing.customName || "Ingrediente"}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin ingredientes registrados</p>
                )}
              </CardContent>
            </Card>

            {/* Nutrition info */}
            {(recipe.caloriesPerServing || recipe.proteinsPerServing || recipe.carbsPerServing || recipe.fatsPerServing) && (
              <Card className="border-border mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4.5 h-4.5 text-primary" />
                    Información nutricional
                    <span className="text-xs font-normal text-muted-foreground ml-auto">por porción</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: "Calorías", value: recipe.caloriesPerServing, unit: "kcal" },
                      { label: "Proteínas", value: recipe.proteinsPerServing, unit: "g" },
                      { label: "Carbohidratos", value: recipe.carbsPerServing, unit: "g" },
                      { label: "Grasas", value: recipe.fatsPerServing, unit: "g" },
                    ].filter(n => n.value != null).map((nutrient) => (
                      <div key={nutrient.label} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{nutrient.label}</span>
                        <span className="font-medium text-foreground">{nutrient.value} {nutrient.unit}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Steps */}
          <div className="lg:col-span-2">
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Utensils className="w-4.5 h-4.5 text-primary" />
                  Preparación
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recipe.steps && recipe.steps.length > 0 ? (
                  <ol className="space-y-4">
                    {recipe.steps
                      .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
                      .map((step: any) => (
                        <li key={step.id} className="flex gap-4">
                          <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {step.stepNumber}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-foreground leading-relaxed">{step.description}</p>
                            {step.duration && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {step.duration} min
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin pasos de preparación registrados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
