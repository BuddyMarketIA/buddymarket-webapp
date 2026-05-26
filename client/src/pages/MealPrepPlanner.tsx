import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { ChefHat, Clock, Snowflake, ShoppingCart, Play, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/sonner-a11y-shim";
import { Streamdown } from "streamdown";

export default function MealPrepPlanner() {
  const { user } = useAuth();
  const [availableHours, setAvailableHours] = useState(3);
  const [plan, setPlan] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePlan = trpc.mealPrep.generatePlan.useMutation({
    onSuccess: (data) => {
      if (data.plan && !data.plan.error) {
        setPlan(data.plan);
        toast.success(`Plan generado para ${data.recipeCount} recetas`);
      } else {
        toast.error("No se encontraron recetas. Añade recetas a un menú primero.");
      }
      setIsGenerating(false);
    },
    onError: (err) => {
      toast.error(err.message || "Error al generar el plan");
      setIsGenerating(false);
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    generatePlan.mutate({ availableHours });
  };

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12 text-center">
        <ChefHat className="w-12 h-12 mx-auto text-orange-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Meal Prep Planner</h1>
        <p className="text-muted-foreground">Inicia sesión para usar el planificador de batch cooking</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center mx-auto mb-4">
          <ChefHat className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Meal Prep Planner</h1>
        <p className="text-muted-foreground mt-1">
          Organiza tu batch cooking semanal de forma eficiente
        </p>
      </div>

      {/* Configuration */}
      {!plan && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">
                <Clock className="w-4 h-4 inline mr-1" />
                Horas disponibles para cocinar
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((h) => (
                  <button
                    key={h}
                    onClick={() => setAvailableHours(h)}
                    className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      availableHours === h
                        ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                        : "border-border hover:border-green-300"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full h-12 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {isGenerating ? "Generando plan..." : "Generar Plan de Batch Cooking"}
            </Button>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Se usarán las recetas de tu menú activo o tus recetas guardadas
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generated Plan */}
      {plan && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Tu Plan de Meal Prep</h3>
                  <p className="text-sm text-muted-foreground">Tiempo total: {plan.totalTime}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setPlan(null)}>
                  Nuevo plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Phases */}
          {plan.phases?.map((phase: any, idx: number) => (
            <Card key={idx}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">
                    {phase.order || idx + 1}
                  </span>
                  {phase.title}
                  <span className="text-xs text-muted-foreground ml-auto">{phase.duration}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {phase.tasks?.map((task: any, tidx: number) => (
                    <li key={tidx} className="flex items-start gap-2 text-sm">
                      <span className="text-green-500 mt-0.5">•</span>
                      <div>
                        <p>{task.task}</p>
                        {task.recipes && (
                          <p className="text-xs text-muted-foreground">
                            Para: {Array.isArray(task.recipes) ? task.recipes.join(", ") : task.recipes}
                          </p>
                        )}
                        {task.tip && (
                          <p className="text-xs text-orange-600 mt-0.5">💡 {task.tip}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          {/* Simultaneous tasks */}
          {plan.simultaneousTasks?.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" />
                  Aprovecha los tiempos muertos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {plan.simultaneousTasks.map((task: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="text-orange-500">⏱️</span>
                      {task}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Storage guide */}
          {plan.storageGuide?.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-blue-500" />
                  Guía de conservación
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {plan.storageGuide.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <span className="font-medium">{item.recipe}</span>
                      <div className="text-right text-xs text-muted-foreground">
                        <span className={item.method === "congelar" ? "text-blue-600" : "text-green-600"}>
                          {item.method === "congelar" ? "❄️" : "🧊"} {item.method}
                        </span>
                        <span className="ml-2">{item.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shopping tips */}
          {plan.shoppingTips?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-purple-500" />
                  Tips de compra
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1">
                  {plan.shoppingTips.map((tip: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span>🛒</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
