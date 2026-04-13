// @ts-nocheck
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { RECIPE_PLACEHOLDER_IMAGE } from "@/lib/constants";

type Period = "7d" | "30d" | "90d" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  "all": "Todo el tiempo",
};

function MetricCard({
  icon,
  label,
  value,
  subLabel,
  accent = false,
}: {
  icon: string;
  label: string;
  value: string | number;
  subLabel?: string;
  accent?: boolean;
}) {
  return (
    <div className={`p-4 rounded-2xl border ${accent ? "bg-orange-50 border-orange-200" : "bg-white border-gray-200"}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-gray-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${accent ? "text-orange-600" : "text-gray-900"}`}>
        {typeof value === "number" ? value.toLocaleString("es-ES") : value}
      </p>
      {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
    </div>
  );
}

export default function MakerAnalytics() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("30d");

  const { data, isLoading } = trpc.makerAnalytics.getMakerAnalytics.useQuery(
    { period },
    { enabled: !!user }
  );

  // Calcular el máximo de vistas para la barra del gráfico
  const maxViews = useMemo(() => {
    if (!data?.dailyData?.length) return 1;
    return Math.max(...data.dailyData.map(d => d.views), 1);
  }, [data?.dailyData]);

  if (!user) return null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analíticas de alcance</h1>
            <p className="text-sm text-gray-500 mt-1">
              Estadísticas de vistas e interacciones de tus recetas
            </p>
          </div>
          {/* Selector de período */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(["7d", "30d", "90d", "all"] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  period === p
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "all" ? "Todo" : p}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !data ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Sin datos disponibles</h3>
            <p className="text-gray-500 text-sm">
              Las analíticas se generan automáticamente cuando los usuarios visitan tus recetas.
            </p>
          </div>
        ) : (
          <>
            {/* Tarjetas de métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <MetricCard icon="👁️" label="Vistas totales" value={data.totals.views} accent />
              <MetricCard icon="👤" label="Vistas únicas" value={data.totals.uniqueViews} />
              <MetricCard icon="❤️" label="Me gusta" value={data.totals.likes} />
              <MetricCard icon="🔖" label="Guardadas" value={data.totals.saves} />
              <MetricCard icon="↗️" label="Compartidas" value={data.totals.shares} />
              <MetricCard
                icon="🎯"
                label="Conversión"
                value={`${data.totals.conversionRate}%`}
                subLabel="Vistas → Guardadas"
              />
            </div>

            {/* Gráfica de evolución temporal */}
            {data.dailyData.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-8">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Evolución de vistas — {PERIOD_LABELS[period]}
                </h3>
                <div className="flex items-end gap-0.5 h-40 overflow-x-auto pb-2">
                  {data.dailyData.map((day, i) => {
                    const heightPct = (day.views / maxViews) * 100;
                    const date = new Date(day.date + "T00:00:00");
                    const isToday = day.date === new Date().toISOString().split("T")[0];
                    return (
                      <div
                        key={day.date}
                        className="flex-1 min-w-[8px] flex flex-col items-center gap-1 group relative"
                        title={`${date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}: ${day.views} vistas`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                          {date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}: {day.views} vistas
                          {day.likes > 0 && ` · ${day.likes} ❤️`}
                          {day.saves > 0 && ` · ${day.saves} 🔖`}
                        </div>
                        <div
                          className={`w-full rounded-t transition-all ${isToday ? "bg-orange-500" : "bg-orange-200 group-hover:bg-orange-400"}`}
                          style={{ height: `${Math.max(heightPct, 2)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {new Date(data.dailyData[0].date + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(data.dailyData[data.dailyData.length - 1].date + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            )}

            {/* Top recetas */}
            {data.topRecipes.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-700 mb-4">
                  Top recetas por vistas
                </h3>
                <div className="space-y-3">
                  {data.topRecipes.map((recipe, index) => {
                    const maxRecipeViews = data.topRecipes[0].totalViews || 1;
                    const barWidth = (recipe.totalViews / maxRecipeViews) * 100;
                    return (
                      <div key={recipe.recipeId} className="flex items-center gap-3">
                        {/* Posición */}
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-gray-100 text-gray-600" :
                          index === 2 ? "bg-orange-100 text-orange-600" :
                          "bg-gray-50 text-gray-400"
                        }`}>
                          {index + 1}
                        </span>
                        {/* Imagen */}
                        <img
                          src={recipe.recipe.imageUrl ?? RECIPE_PLACEHOLDER_IMAGE}
                          alt={recipe.recipe.title}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {recipe.recipe.title}
                            </span>
                            <span className="text-sm font-bold text-gray-700 flex-shrink-0">
                              {recipe.totalViews.toLocaleString("es-ES")} vistas
                            </span>
                          </div>
                          {/* Barra de progreso */}
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-400 rounded-full transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          {/* Métricas secundarias */}
                          <div className="flex gap-3 mt-1">
                            {recipe.totalLikes > 0 && (
                              <span className="text-xs text-gray-400">❤️ {recipe.totalLikes}</span>
                            )}
                            {recipe.totalSaves > 0 && (
                              <span className="text-xs text-gray-400">🔖 {recipe.totalSaves}</span>
                            )}
                            {recipe.totalShares > 0 && (
                              <span className="text-xs text-gray-400">↗️ {recipe.totalShares}</span>
                            )}
                            {recipe.totalViews > 0 && recipe.totalSaves > 0 && (
                              <span className="text-xs text-gray-400">
                                🎯 {((recipe.totalSaves / recipe.totalViews) * 100).toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Estado vacío si no hay datos */}
            {data.totals.views === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200 mt-6">
                <div className="text-5xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  Sin datos para el período seleccionado
                </h3>
                <p className="text-gray-500 text-sm">
                  Las vistas e interacciones se registran automáticamente cuando los usuarios acceden a tus recetas.
                  Prueba con un período más amplio.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
