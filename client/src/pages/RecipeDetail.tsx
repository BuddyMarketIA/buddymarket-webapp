import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation, useParams } from "wouter";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  ClockIcon,
  UserGroupIcon,
  HeartIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

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
      <div className="vively-page">
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#F97316] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="vively-page container text-center">
        <p className="text-gray-500">Receta no encontrada</p>
        <Link href="/recipes" className="btn-vively mt-4 inline-block">
          Volver a recetas
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === recipe.userId;
  const totalTime = (recipe.preparationTime || 0) + (recipe.cookTime || 0);
  const difficultyLabel: Record<string, string> = { easy: "Fácil", medium: "Media", hard: "Difícil" };
  const difficultyColor: Record<string, string> = {
    easy: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div className="vively-page">
      {/* Back */}
      <Link href="/recipes" className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900">
        <ArrowLeftIcon className="h-4 w-4" />
        Volver a recetas
      </Link>

      {/* Header */}
      <div className="mb-5">
        <div className="mb-2 flex flex-wrap gap-2">
          {recipe.difficulty && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${difficultyColor[recipe.difficulty as string] || "bg-gray-100 text-gray-600"}`}>
              {difficultyLabel[recipe.difficulty as string] || recipe.difficulty}
            </span>
          )}
          {recipe.isPublic && (
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">Pública</span>
          )}
        </div>
        <h1 className="mb-2 text-2xl font-extrabold text-gray-900">{recipe.name}</h1>
        {recipe.description && (
          <p className="text-sm leading-relaxed text-gray-500">{recipe.description}</p>
        )}
      </div>

      {/* Stats row */}
      <div className="mb-5 flex gap-3 overflow-x-auto pb-1">
        {totalTime > 0 && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
            <ClockIcon className="h-4 w-4 text-[#F97316]" />
            {totalTime} min
          </div>
        )}
        {recipe.servings && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
            <UserGroupIcon className="h-4 w-4 text-[#F97316]" />
            {recipe.servings} porciones
          </div>
        )}
        {recipe.preparationTime && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
            🔪 Prep: {recipe.preparationTime} min
          </div>
        )}
        {recipe.cookTime && (
          <div className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
            🍳 Cocción: {recipe.cookTime} min
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => toggleFav.mutate({ recipeId: recipe.id })}
          className="flex items-center gap-1.5 rounded-2xl border-2 border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-red-200 hover:text-red-500"
        >
          <HeartIcon className="h-4 w-4" />
          Favorito
        </button>
        {isOwner && (
          <>
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className="flex items-center gap-1.5 rounded-2xl border-2 border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#F97316]"
            >
              <PencilIcon className="h-4 w-4" />
              Editar
            </Link>
            <button
              onClick={() => {
                if (confirm("¿Eliminar esta receta?")) deleteRecipe.mutate({ id: recipe.id });
              }}
              className="flex items-center gap-1.5 rounded-2xl border-2 border-red-100 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {/* Nutrition */}
      {(recipe.caloriesPerServing || recipe.proteinsPerServing || recipe.carbsPerServing || recipe.fatsPerServing) && (
        <div className="mb-5 vively-card">
          <h2 className="mb-3 text-sm font-bold text-gray-700">Información nutricional (por porción)</h2>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { label: "Calorías", value: recipe.caloriesPerServing, unit: "kcal", color: "text-orange-500" },
              { label: "Proteínas", value: recipe.proteinsPerServing, unit: "g", color: "text-blue-500" },
              { label: "Carbos", value: recipe.carbsPerServing, unit: "g", color: "text-yellow-500" },
              { label: "Grasas", value: recipe.fatsPerServing, unit: "g", color: "text-red-400" },
            ].map((n) => n.value ? (
              <div key={n.label} className="rounded-2xl bg-gray-50 p-2">
                <p className={`text-base font-extrabold ${n.color}`}>{n.value}</p>
                <p className="text-[10px] text-gray-400">{n.unit}</p>
                <p className="text-[10px] font-semibold text-gray-600">{n.label}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}

      {/* Ingredients */}
      <div className="mb-5 vively-card">
        <h2 className="mb-3 text-sm font-bold text-gray-700">
          Ingredientes
          {recipe.servings && <span className="ml-1 font-normal text-gray-400">para {recipe.servings} personas</span>}
        </h2>
        {recipe.ingredients && recipe.ingredients.length > 0 ? (
          <ul className="space-y-2">
            {recipe.ingredients.map((ing: any, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F97316]" />
                <span className="text-gray-700">
                  {ing.amount && <span className="font-semibold">{ing.amount} </span>}
                  {ing.measure?.nameEs && <span className="text-gray-500">{ing.measure.nameEs} de </span>}
                  {ing.ingredient?.nameEs || ing.customName || "Ingrediente"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Sin ingredientes registrados</p>
        )}
      </div>

      {/* Steps */}
      {recipe.steps && recipe.steps.length > 0 && (
        <div className="mb-5 vively-card">
          <h2 className="mb-3 text-sm font-bold text-gray-700">Pasos de preparación</h2>
          <ol className="space-y-4">
            {recipe.steps
              .sort((a: any, b: any) => a.stepNumber - b.stepNumber)
              .map((step: any) => (
                <li key={step.id} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-xs font-bold text-white">
                    {step.stepNumber}
                  </div>
                  <p className="pt-0.5 text-sm leading-relaxed text-gray-700">{step.description}</p>
                </li>
              ))}
          </ol>
        </div>
      )}

      {/* Allergies & Diet */}
      {(recipe.allergies && recipe.allergies.length > 0) && (
        <div className="vively-card">
          <div>
              <h3 className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wide">Contiene alérgenos</h3>
              <div className="flex flex-wrap gap-1.5">
                {recipe.allergies.map((a: any) => (
                  <span key={a.id} className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                    {a.nameEs}
                  </span>
                ))}
              </div>
            </div>
        </div>
      )}

      <div className="vively-disclaimer">
        <p>VIVELY no constituye asesoramiento nutricional profesional.</p>
      </div>
    </div>
  );
}
