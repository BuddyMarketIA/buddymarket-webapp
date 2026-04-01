import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { MagnifyingGlassIcon, PlusIcon, ClockIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

const DIFFICULTIES = [
  { value: "", label: "Todas" },
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Media" },
  { value: "hard", label: "Difícil" },
];

export default function Recipes() {
  const { user, isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState<"all" | "mine">("all");

  const { data: publicRecipes, isLoading: loadingPublic } = trpc.recipes.list.useQuery({
    search: search || undefined,
    difficulty: difficulty || undefined,
    isPublic: true,
    limit: 40,
  });

  const { data: myRecipes, isLoading: loadingMine } = trpc.recipes.myRecipes.useQuery(
    { limit: 40 },
    { enabled: isAuthenticated && tab === "mine" }
  );

  const utils = trpc.useUtils();
  const toggleFav = trpc.recipes.toggleFavorite.useMutation({
    onSuccess: () => {
      utils.recipes.favorites.invalidate();
      toast.success("Favoritos actualizados");
    },
  });

  const displayRecipes = tab === "mine" ? myRecipes : publicRecipes;
  const isLoading = tab === "mine" ? loadingMine : loadingPublic;

  return (
    <div className="vively-page">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recetas</h1>
        <Link href="/recipes/new">
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F97316] shadow-sm transition-transform hover:scale-105">
            <PlusIcon className="h-5 w-5 text-white" />
          </button>
        </Link>
      </div>

      {/* Search bar */}
      <div className="search-bar mb-4">
        <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar recetas o ingredientes..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
            showFilters ? "bg-[#F97316]/10 text-[#F97316]" : "text-gray-400 hover:text-gray-600"
          }`}
        >
          <AdjustmentsHorizontalIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap gap-2 animate-fade-in">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`selectable-badge ${
                difficulty === d.value ? "selectable-badge-active" : "selectable-badge-inactive"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex gap-2">
        {(["all", "mine"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              tab === t
                ? "bg-[#F97316] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "all" ? "Todas" : "Mis recetas"}
          </button>
        ))}
      </div>

      {/* Recipe list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vively-card animate-pulse">
              <div className="flex gap-4">
                <div className="h-24 w-24 rounded-xl bg-gray-100" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                  <div className="h-3 w-1/2 rounded bg-gray-100" />
                  <div className="h-3 w-1/3 rounded bg-gray-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayRecipes && displayRecipes.length > 0 ? (
        <div className="space-y-3">
          {displayRecipes.map((recipe) => (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
              <div className="recipe-tile cursor-pointer">
                <div className="relative col-span-1">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-orange-50">
                    {recipe.imageUrl ? (
                      <img
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <span className="text-4xl">🍳</span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 min-w-0">
                  <h2 className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-[#F97316] line-clamp-2">
                    {recipe.name}
                  </h2>
                  {recipe.preparationTime && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                      <ClockIcon className="h-3.5 w-3.5" />
                      <span>{recipe.preparationTime} min</span>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {recipe.difficulty && (
                      <span className={`${recipe.difficulty === "easy" ? "badge-primary" : recipe.difficulty === "medium" ? "badge-blue" : "badge-orange"}`}>
                        {recipe.difficulty === "easy" ? "Fácil" : recipe.difficulty === "medium" ? "Media" : "Difícil"}
                      </span>
                    )}

                    {!recipe.isPublic && (
                      <span className="badge-gray">Borrador</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="mb-4 text-5xl">🍽️</span>
          <h3 className="mb-2 text-base font-bold text-gray-900">No hay recetas</h3>
          <p className="mb-6 text-sm text-gray-500">
            {search ? "No se encontraron resultados" : "Sé el primero en añadir una receta"}
          </p>
          <Link href="/recipes/new">
            <button className="btn-vively">Crear receta</button>
          </Link>
        </div>
      )}

      {/* Disclaimer */}
      <div className="vively-disclaimer">
        <p>La información nutricional es orientativa. Consulta con un profesional de la salud.</p>
      </div>
    </div>
  );
}
