import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";

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
  const [isPublic, setIsPublic] = useState(true);
  const [calories, setCalories] = useState("");
  const [proteins, setProteins] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");
  const [steps, setSteps] = useState<{ stepNumber: number; description: string; duration?: number }[]>([
    { stepNumber: 1, description: "" },
  ]);

  const { data: ingredientsList } = trpc.ingredients.getAll.useQuery({ limit: 200 });
  const { data: measuresList } = trpc.catalogs.measures.useQuery();

  const createRecipe = trpc.recipes.create.useMutation({
    onSuccess: (data) => {
      toast.success(t("recipes.created", "Recipe created successfully"));
      navigate(`/app/recipes/${data?.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

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
      toast.error(t("recipes.nameRequired", "Name is required"));
      return;
    }
    createRecipe.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      preparationTime: preparationTime ? Number(preparationTime) : undefined,
      cookTime: cookTime ? Number(cookTime) : undefined,
      servings: Number(servings),
      difficulty: difficulty as "easy" | "medium" | "hard",
      isPublic,
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
            {isEditing ? t("recipes.editRecipe", "Edit recipe") : t("recipes.newRecipe", "New recipe")}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isEditing ? t("recipes.editSubtitle", "Modify your recipe data") : t("recipes.newSubtitle", "Create a new recipe for your collection")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic info */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("recipes.basicInfo", "Basic information")}</CardTitle>
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
                  <Input
                    id="prep"
                    type="number"
                    min="0"
                    value={preparationTime}
                    onChange={(e) => setPreparationTime(e.target.value)}
                    placeholder="15"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cook">Cocción (min)</Label>
                  <Input
                    id="cook"
                    type="number"
                    min="0"
                    value={cookTime}
                    onChange={(e) => setCookTime(e.target.value)}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="servings">Porciones</Label>
                  <Input
                    id="servings"
                    type="number"
                    min="1"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="difficulty">Dificultad</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
                <Label htmlFor="isPublic" className="cursor-pointer">
                  Receta pública (visible para todos)
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Nutrition */}
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Información nutricional (por porción)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Calorías (kcal)", value: calories, setter: setCalories, placeholder: "450" },
                  { label: "Proteínas (g)", value: proteins, setter: setProteins, placeholder: "25" },
                  { label: "Carbohidratos (g)", value: carbs, setter: setCarbs, placeholder: "60" },
                  { label: "Grasas (g)", value: fats, setter: setFats, placeholder: "15" },
                ].map((field) => (
                  <div key={field.label} className="space-y-1.5">
                    <Label className="text-xs">{field.label}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
              </div>
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
            <Button type="submit" disabled={createRecipe.isPending}>
              {createRecipe.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Guardar cambios" : "Crear receta"}
            </Button>
          </div>
        </form>
    </div>
  );
}
