import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Sparkles, RefreshCw, Clock, Flame, Drumstick, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/sonner-a11y-shim";

const MOODS = [
  { id: "quick" as const, label: "Rápido", icon: "⚡", desc: "< 15 min" },
  { id: "healthy" as const, label: "Saludable", icon: "🥗", desc: "Equilibrado" },
  { id: "comfort" as const, label: "Comfort food", icon: "🍲", desc: "Reconfortante" },
  { id: "light" as const, label: "Ligero", icon: "🌿", desc: "Bajo en calorías" },
  { id: "adventurous" as const, label: "Aventurero", icon: "🌍", desc: "Algo nuevo" },
];

export default function QuickSuggest() {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[number]["id"] | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [mealTime, setMealTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const suggestMutation = trpc.quickSuggest.suggest.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions);
      setMealTime(data.mealTime);
      setIsLoading(false);
    },
    onError: () => {
      toast.error("No se pudo obtener sugerencias");
      setIsLoading(false);
    },
  });

  const handleSuggest = (mood?: typeof MOODS[number]["id"]) => {
    setIsLoading(true);
    suggestMutation.mutate({ mood: mood || selectedMood || undefined });
  };

  const mealTimeLabels: Record<string, string> = {
    desayuno: "🌅 Desayuno",
    media_manana: "☀️ Media mañana",
    comida: "🍽️ Comida",
    merienda: "🍵 Merienda",
    cena: "🌙 Cena",
  };

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12 text-center">
        <Sparkles className="w-12 h-12 mx-auto text-orange-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">¿Qué como hoy?</h1>
        <p className="text-muted-foreground mb-6">Inicia sesión para recibir sugerencias personalizadas</p>
      </div>
    );
  }

  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold">¿Qué como hoy?</h1>
        <p className="text-muted-foreground mt-1">
          {mealTime ? mealTimeLabels[mealTime] || mealTime : "Sugerencia inteligente basada en tu perfil"}
        </p>
      </div>

      {/* Mood selector */}
      {suggestions.length === 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-3 text-center">¿Qué te apetece?</p>
          <div className="grid grid-cols-2 gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                onClick={() => setSelectedMood(mood.id)}
                className={`p-3 rounded-xl border-2 transition-all text-left ${
                  selectedMood === mood.id
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-950"
                    : "border-border hover:border-orange-300"
                }`}
              >
                <span className="text-xl">{mood.icon}</span>
                <p className="font-medium text-sm mt-1">{mood.label}</p>
                <p className="text-xs text-muted-foreground">{mood.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main action button */}
      {suggestions.length === 0 && (
        <Button
          onClick={() => handleSuggest()}
          disabled={isLoading}
          className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white rounded-xl"
        >
          {isLoading ? (
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Zap className="w-5 h-5 mr-2" />
          )}
          {isLoading ? "Pensando..." : "¡Sorpréndeme!"}
        </Button>
      )}

      {/* Results */}
      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Mis sugerencias</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSuggest()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
              Otras
            </Button>
          </div>

          {suggestions.map((recipe, idx) => (
            <Link key={recipe.id} href={`/app/recipes/${recipe.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {recipe.imageUrl && recipe.imageUrl !== "imageUrl" ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🍽️</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2">{recipe.name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {recipe.calories} kcal
                        </span>
                        <span className="flex items-center gap-1">
                          <Drumstick className="w-3 h-3 text-green-500" />
                          {recipe.protein}g prot
                        </span>
                        {recipe.prepTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {recipe.prepTime}
                          </span>
                        )}
                      </div>
                      {recipe.cuisineType && (
                        <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                          {recipe.cuisineType}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          <p className="text-xs text-center text-muted-foreground mt-4">
            Sugerencias basadas en tu perfil, historial y momento del día
          </p>
        </div>
      )}
    </div>
  );
}
