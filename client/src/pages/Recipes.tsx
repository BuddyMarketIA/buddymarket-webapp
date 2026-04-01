import AppLayout from "@/components/AppLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen,
  Clock,
  Heart,
  Plus,
  Search,
  Sparkles,
  Star,
  Utensils,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

function RecipeCard({ recipe, onToggleFavorite }: { recipe: any; onToggleFavorite?: (id: number) => void }) {
  const difficultyLabel = { easy: "Fácil", medium: "Media", hard: "Difícil" }[recipe.difficulty as string] || recipe.difficulty;
  const difficultyColor = { easy: "bg-green-100 text-green-700", medium: "bg-yellow-100 text-yellow-700", hard: "bg-red-100 text-red-700" }[recipe.difficulty as string] || "";
  const totalTime = (recipe.preparationTime || 0) + (recipe.cookTime || 0);

  return (
    <Card className="border-border hover:shadow-md transition-shadow duration-200 overflow-hidden group">
      {/* Image placeholder */}
      <div className="h-40 bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center relative">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <Utensils className="w-10 h-10 text-primary/40" />
        )}
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(recipe.id); }}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Heart className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
          </button>
        )}
        {recipe.difficulty && (
          <Badge className={`absolute top-2 left-2 text-[10px] ${difficultyColor} border-0`}>
            {difficultyLabel}
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground text-sm leading-tight mb-2 line-clamp-2" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          {recipe.name}
        </h3>
        {recipe.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{recipe.description}</p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {totalTime} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {recipe.servings} pers.
            </span>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <Button size="sm" variant="outline" className="w-full h-8 text-xs" asChild>
            <Link href={`/recipes/${recipe.id}`}>Ver receta</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Recipes() {
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [view, setView] = useState<"public" | "mine" | "favorites">("public");

  const { data: publicRecipes, isLoading: loadingPublic } = trpc.recipes.list.useQuery({
    search: search || undefined,
    difficulty: difficulty !== "all" ? difficulty : undefined,
    isPublic: true,
    limit: 24,
  });

  const { data: myRecipes, isLoading: loadingMine } = trpc.recipes.myRecipes.useQuery(
    { limit: 24 },
    { enabled: isAuthenticated && view === "mine" }
  );

  const { data: favorites, isLoading: loadingFavs } = trpc.recipes.favorites.useQuery(
    undefined,
    { enabled: isAuthenticated && view === "favorites" }
  );

  const utils = trpc.useUtils();
  const toggleFav = trpc.recipes.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.recipes.favorites.invalidate();
      toast.success("Favoritos actualizados");
    },
  });

  const displayRecipes = view === "mine" ? myRecipes : view === "favorites" ? favorites : publicRecipes;
  const isLoading = view === "mine" ? loadingMine : view === "favorites" ? loadingFavs : loadingPublic;

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Recetas
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Descubre y gestiona tus recetas favoritas</p>
          </div>
          {isAuthenticated && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/recipes/generate">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Generar con IA
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/recipes/new">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Nueva receta
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar recetas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Dificultad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="easy">Fácil</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="hard">Difícil</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View tabs */}
        {isAuthenticated && (
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            {[
              { key: "public", label: "Explorar" },
              { key: "mine", label: "Mis recetas" },
              { key: "favorites", label: "Favoritas" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setView(tab.key as any)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === tab.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Recipe grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
                <div className="h-40 bg-muted rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayRecipes && displayRecipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onToggleFavorite={isAuthenticated ? (id) => toggleFav.mutate({ recipeId: id }) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <BookOpen className="w-14 h-14 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {view === "mine" ? "Aún no tienes recetas" : view === "favorites" ? "No tienes recetas favoritas" : "No se encontraron recetas"}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              {view === "mine"
                ? "Crea tu primera receta para empezar"
                : view === "favorites"
                ? "Marca recetas como favoritas para verlas aquí"
                : "Prueba con otros términos de búsqueda"}
            </p>
            {view === "mine" && (
              <Button asChild>
                <Link href="/recipes/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear receta
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
