import { useState } from "react"
import { useTranslation } from 'react-i18next';;
import { trpc } from "@/lib/trpc";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";
import {
  XMarkIcon,
  FireIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";

// ─── Meal type config ────────────────────────────────────────────────────────
const MEAL_EMOJIS: Record<string, string> = {
  desayuno: "🌅",
  breakfast: "🌅",
  "media mañana": "🍎",
  almuerzo: "☀️",
  lunch: "☀️",
  merienda: "🍎",
  snack: "🍎",
  cena: "🌙",
  dinner: "🌙",
  comida: "🍽️",
};

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Pérdida de peso",
  muscle_gain: "Ganancia muscular",
  toning: "Tonificación",
  fat_loss: "Pérdida de grasa",
  maintenance: "Mantenimiento",
  bulking: "Volumen",
  definition: "Definición",
  cardiovascular: "Salud cardiovascular",
  anti_inflammatory: "Antiinflamatorio",
  vegan: "Vegano",
};

const GOAL_COLORS: Record<string, string> = {
  weight_loss: "bg-blue-100 text-blue-700",
  muscle_gain: "bg-red-100 text-red-700",
  toning: "bg-purple-100 text-purple-700",
  fat_loss: "bg-orange-100 text-orange-700",
  maintenance: "bg-green-100 text-green-700",
  bulking: "bg-yellow-100 text-yellow-700",
  definition: "bg-pink-100 text-pink-700",
  cardiovascular: "bg-rose-100 text-rose-700",
  anti_inflammatory: "bg-teal-100 text-teal-700",
  vegan: "bg-emerald-100 text-emerald-700",
};

// ─── Component ───────────────────────────────────────────────────────────────
interface MenuPreviewModalProps {
  menuId: number;
  onClose: () => void;
  onSave?: () => void;
  onActivate?: () => void;
  isOwned?: boolean;
  isSaved?: boolean;
}

export default function MenuPreviewModal({
  menuId,
  onClose,
  onSave,
  onActivate,
  isOwned = false,
  isSaved = false,
}: MenuPreviewModalProps) {
  const [selectedDay, setSelectedDay] = useState(1);

  const { data: preview, isLoading } = trpc.menuPreview.get.useQuery(
    { menuId },
    { staleTime: 60_000 }
  );

  const currentDay = preview?.days.find((d) => d.dayNumber === selectedDay);
  const totalDays = preview?.totalDays ?? 0;

  // Calculate total calories for the selected day
  const dayCalories = currentDay?.parts.reduce((sum, part) => {
    return sum + part.recipes.reduce((s, r) => s + (r.calories ?? 0), 0);
  }, 0) ?? 0;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-background shadow-2xl animate-slide-up overflow-hidden"
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with cover image */}
        <div className="relative h-44 bg-gradient-to-br from-orange-100 to-amber-50 flex-shrink-0">
          {preview?.coverImage ? (
            <img
              src={preview.coverImage}
              alt={preview.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-20">🥗</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>

          {/* Menu info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {preview?.goal && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold mb-1.5 ${
                  GOAL_COLORS[preview.goal] ?? "bg-orange-100 text-orange-700"
                }`}
              >
                {GOAL_LABELS[preview.goal] ?? preview.goal}
              </span>
            )}
            <h2 className="text-lg font-bold text-white leading-tight drop-shadow">
              {isLoading ? t("common.loading_ellipsis") : preview?.name ?? "Menú"}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              {preview?.dailyCalories && (
                <div className="flex items-center gap-1">
                  <FireIcon className="h-3.5 w-3.5 text-orange-300" />
                  <span className="text-xs text-white/90 font-semibold">
                    {preview.dailyCalories} kcal/día
                  </span>
                </div>
              )}
              {totalDays > 0 && (
                <span className="text-xs text-white/80">
                  {totalDays} {totalDays === 1 ? "día" : "días"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Objective */}
        {preview?.objective && (
          <div className="px-4 py-3 bg-orange-50/50 border-b border-border/40 flex-shrink-0">
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {preview.objective}
            </p>
          </div>
        )}

        {/* Day selector */}
        {totalDays > 1 && (
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40 flex-shrink-0">
            <button
              onClick={() => setSelectedDay((d) => Math.max(1, d - 1))}
              disabled={selectedDay === 1}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 disabled:opacity-30"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
            </button>
            <div className="flex-1 overflow-x-auto scrollbar-none">
              <div className="flex gap-1.5 min-w-max">
                {preview?.days.map((d) => (
                  <button
                    key={d.dayNumber}
                    onClick={() => setSelectedDay(d.dayNumber)}
                    className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      selectedDay === d.dayNumber
                        ? "bg-[#F97316] text-white shadow-sm"
                        : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    Día {d.dayNumber}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setSelectedDay((d) => Math.min(totalDays, d + 1))}
              disabled={selectedDay === totalDays}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/60 disabled:opacity-30"
            >
              <ChevronRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Day content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : !currentDay || currentDay.parts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-4xl mb-3">📋</span>
              <p className="text-sm text-muted-foreground">
                No hay recetas para este día
              </p>
            </div>
          ) : (
            <>
              {/* Day calories summary */}
              {dayCalories > 0 && (
                <div className="flex items-center gap-2 rounded-2xl bg-orange-50 px-3 py-2">
                  <FireIcon className="h-4 w-4 text-[#F97316]" />
                  <span className="text-xs font-bold text-[#F97316]">
                    Total día: {dayCalories} kcal
                  </span>
                </div>
              )}

              {/* Meal parts */}
              {currentDay.parts.map((part) => (
                <div key={part.id}>
                  {/* Meal type header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">
                      {MEAL_EMOJIS[part.mealType?.toLowerCase() ?? ""] ?? "🍽️"}
                    </span>
                    <h3 className="text-sm font-bold text-foreground capitalize">
                      {part.mealType}
                    </h3>
                  </div>

                  {/* Recipes */}
                  {part.recipes.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-6 mb-3">
                      Sin recetas asignadas
                    </p>
                  ) : (
                    <div className="space-y-2 pl-0">
                      {part.recipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="flex items-center gap-3 rounded-2xl bg-muted/30 border border-border/40 p-2.5"
                        >
                          {/* Recipe image */}
                          <div className="h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                            <img
                              src={recipe.imageUrl || RECIPE_PLACEHOLDER_IMAGE}
                              alt={recipe.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  RECIPE_PLACEHOLDER_IMAGE;
                              }}
                            />
                          </div>
                          {/* Recipe info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                              {recipe.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {recipe.calories && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <FireIcon className="h-3 w-3 text-orange-400" />
                                  {recipe.calories} kcal
                                </span>
                              )}
                              {recipe.prepTime && (
                                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                  <ClockIcon className="h-3 w-3" />
                                  {recipe.prepTime} min
                                </span>
                              )}
                            </div>
                            {/* Macros */}
                            {(recipe.proteins || recipe.carbs || recipe.fats) && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {recipe.proteins && (
                                  <span className="rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-600">
                                    P {recipe.proteins}g
                                  </span>
                                )}
                                {recipe.carbs && (
                                  <span className="rounded-full bg-yellow-50 px-1.5 py-0.5 text-[9px] font-bold text-yellow-600">
                                    C {recipe.carbs}g
                                  </span>
                                )}
                                {recipe.fats && (
                                  <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-500">
                                    G {recipe.fats}g
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 p-4 border-t border-border/40 flex-shrink-0 bg-background">
          {onSave && !isOwned && !isSaved && (
            <button
              onClick={() => {
                onSave();
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-orange-50 border border-orange-200 py-3 text-sm font-bold text-[#F97316]"
            >
              <StarSolidIcon className="h-4 w-4" />
              Guardar menú
            </button>
          )}
          {onActivate && (
            <button
              onClick={() => {
                onActivate();
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-[#F97316] py-3 text-sm font-bold text-white shadow-sm"
            >
              ▶ Usar este menú
            </button>
          )}
          {isOwned && !onActivate && (
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-muted/60 py-3 text-sm font-semibold text-foreground"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
