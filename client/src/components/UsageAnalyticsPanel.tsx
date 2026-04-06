import { trpc } from "@/lib/trpc";
import { useMemo } from "react";
import {
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
  CalendarDaysIcon,
  ShoppingCartIcon,
  QrCodeIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

// ── Helpers ────────────────────────────────────────────────────────────────────
function heatColor(value: number, max: number): string {
  if (max === 0) return "bg-gray-100 text-gray-400";
  const ratio = value / max;
  if (ratio === 0) return "bg-gray-100 text-gray-400";
  if (ratio < 0.1) return "bg-orange-50 text-orange-400";
  if (ratio < 0.25) return "bg-orange-100 text-orange-500";
  if (ratio < 0.5) return "bg-orange-200 text-orange-600";
  if (ratio < 0.75) return "bg-orange-300 text-orange-700";
  return "bg-orange-500 text-white";
}

function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    "IA": "bg-purple-100 text-purple-700",
    "Diario": "bg-blue-100 text-blue-700",
    "Menús": "bg-green-100 text-green-700",
    "Compras": "bg-yellow-100 text-yellow-700",
    "Recetas": "bg-red-100 text-red-700",
    "Salud": "bg-teal-100 text-teal-700",
    "Escáner": "bg-indigo-100 text-indigo-700",
    "Expertos": "bg-pink-100 text-pink-700",
    "Inventario": "bg-amber-100 text-amber-700",
  };
  return map[cat] ?? "bg-gray-100 text-gray-600";
}

// Simple sparkline bar chart
function MiniBarChart({ data, label, color }: { data: { date: string; count: number }[]; label: string; color: string }) {
  const max = Math.max(...data.map(d => Number(d.count)), 1);
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-gray-500">{label}</p>
      <div className="flex items-end gap-0.5 h-12">
        {data.slice(-30).map((d, i) => (
          <div
            key={i}
            title={`${d.date}: ${d.count}`}
            className={`flex-1 rounded-sm ${color} opacity-80 hover:opacity-100 transition-opacity`}
            style={{ height: `${Math.max((Number(d.count) / max) * 100, 4)}%` }}
          />
        ))}
        {data.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-300">Sin datos</div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function UsageAnalyticsPanel() {
  const { data: overview, isLoading: loadingOverview } = trpc.usageAnalytics.getOverview.useQuery();
  const { data: heatmap, isLoading: loadingHeatmap } = trpc.usageAnalytics.getFeatureHeatmap.useQuery();
  const { data: dailyActivity, isLoading: loadingDaily } = trpc.usageAnalytics.getDailyActivity.useQuery();
  const { data: aiUsage, isLoading: loadingAI } = trpc.usageAnalytics.getAIUsage.useQuery();
  const { data: topUsers, isLoading: loadingTop } = trpc.usageAnalytics.getTopUsers.useQuery();

  const sortedHeatmap = useMemo(() => {
    if (!heatmap) return [];
    return [...heatmap].sort((a, b) => b.count - a.count);
  }, [heatmap]);

  const maxHeatmapCount = useMemo(() => {
    if (!sortedHeatmap.length) return 0;
    return sortedHeatmap[0].count;
  }, [sortedHeatmap]);

  const aiTotal = overview
    ? overview.menus.aiGenerated + overview.mealLogs.aiPhoto + overview.shoppingLists.aiGenerated
    : 0;

  if (loadingOverview) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="vively-card animate-pulse h-24 bg-gray-50" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── KPI Cards ── */}
      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-gray-700">
          <ChartBarIcon className="h-4 w-4 text-orange-500" /> Métricas globales
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="vively-card text-center">
            <UserGroupIcon className="mx-auto mb-1 h-5 w-5 text-blue-500" />
            <p className="text-2xl font-extrabold text-gray-900">{overview?.users.total ?? 0}</p>
            <p className="text-xs text-gray-500">Usuarios totales</p>
            <p className="mt-0.5 text-xs font-semibold text-green-600">+{overview?.users.new30d ?? 0} este mes</p>
          </div>
          <div className="vively-card text-center">
            <SparklesIcon className="mx-auto mb-1 h-5 w-5 text-purple-500" />
            <p className="text-2xl font-extrabold text-gray-900">{aiTotal}</p>
            <p className="text-xs text-gray-500">Acciones con IA</p>
            <p className="mt-0.5 text-xs font-semibold text-purple-600">Total acumulado</p>
          </div>
          <div className="vively-card text-center">
            <CalendarDaysIcon className="mx-auto mb-1 h-5 w-5 text-green-500" />
            <p className="text-2xl font-extrabold text-gray-900">{overview?.menus.total ?? 0}</p>
            <p className="text-xs text-gray-500">Menús creados</p>
            <p className="mt-0.5 text-xs font-semibold text-green-600">{overview?.menus.aiGenerated ?? 0} con IA</p>
          </div>
          <div className="vively-card text-center">
            <ShoppingCartIcon className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
            <p className="text-2xl font-extrabold text-gray-900">{overview?.shoppingLists.total ?? 0}</p>
            <p className="text-xs text-gray-500">Listas de compra</p>
            <p className="mt-0.5 text-xs font-semibold text-yellow-600">{overview?.shoppingLists.aiGenerated ?? 0} con IA</p>
          </div>
          <div className="vively-card text-center">
            <QrCodeIcon className="mx-auto mb-1 h-5 w-5 text-indigo-500" />
            <p className="text-2xl font-extrabold text-gray-900">{overview?.mealLogs.aiPhoto ?? 0}</p>
            <p className="text-xs text-gray-500">Análisis IA foto</p>
            <p className="mt-0.5 text-xs font-semibold text-indigo-600">Escáner alimentos</p>
          </div>
          <div className="vively-card text-center">
            <ArrowTrendingUpIcon className="mx-auto mb-1 h-5 w-5 text-teal-500" />
            <p className="text-2xl font-extrabold text-gray-900">{overview?.mealLogs.total ?? 0}</p>
            <p className="text-xs text-gray-500">Registros diario</p>
            <p className="mt-0.5 text-xs font-semibold text-teal-600">Total entradas</p>
          </div>
        </div>
      </div>

      {/* ── IA Usage Breakdown ── */}
      <div className="vively-card space-y-3">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
          <SparklesIcon className="h-4 w-4 text-purple-500" /> Uso de Inteligencia Artificial
        </h3>
        {loadingAI ? (
          <div className="animate-pulse h-16 bg-gray-50 rounded-xl" />
        ) : (
          <div className="space-y-2">
            {[
              { label: "Menús generados por IA", value: aiUsage?.aiMenus ?? 0, color: "bg-purple-500", icon: "🤖" },
              { label: "Análisis de foto (IA)", value: aiUsage?.aiPhotoAnalysis ?? 0, color: "bg-blue-500", icon: "📷" },
              { label: "Listas de compra con IA", value: aiUsage?.aiShoppingLists ?? 0, color: "bg-green-500", icon: "🛒" },
            ].map((item) => {
              const total = (aiUsage?.totalAIActions ?? 0) || 1;
              const pct = Math.round((item.value / total) * 100);
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-gray-600">{item.icon} {item.label}</span>
                    <span className="text-xs font-bold text-gray-800">{item.value} <span className="text-gray-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {aiUsage && aiUsage.feedback.total > 0 && (
              <div className="mt-2 flex items-center justify-between rounded-xl bg-yellow-50 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-yellow-800">⭐ Valoración media IA</p>
                  <p className="text-xs text-yellow-600">{aiUsage.feedback.total} valoraciones · {aiUsage.feedback.accuracyPct}% precisión</p>
                </div>
                <p className="text-2xl font-extrabold text-yellow-700">{aiUsage.feedback.avgRating}/5</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Feature Heatmap ── */}
      <div className="vively-card space-y-3">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
          <ChartBarIcon className="h-4 w-4 text-orange-500" /> Mapa de calor de funcionalidades
        </h3>
        <p className="text-xs text-gray-400">Uso acumulado por funcionalidad. El color indica la intensidad de uso relativa.</p>
        {loadingHeatmap ? (
          <div className="animate-pulse h-32 bg-gray-50 rounded-xl" />
        ) : (
          <div className="grid grid-cols-1 gap-1.5">
            {sortedHeatmap.map((item) => (
              <div
                key={item.feature}
                className={`flex items-center justify-between rounded-xl px-3 py-2 ${heatColor(item.count, maxHeatmapCount)}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{item.feature}</p>
                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium ${categoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-sm font-extrabold">{item.count.toLocaleString("es-ES")}</p>
                  <p className="text-[10px] opacity-70">usos</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Daily Activity Charts ── */}
      <div className="vively-card space-y-4">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
          <ArrowTrendingUpIcon className="h-4 w-4 text-teal-500" /> Actividad últimos 30 días
        </h3>
        {loadingDaily ? (
          <div className="animate-pulse h-24 bg-gray-50 rounded-xl" />
        ) : (
          <div className="space-y-4">
            <MiniBarChart
              data={(dailyActivity?.usersByDay ?? []).map(d => ({ date: String(d.date), count: Number(d.count) }))}
              label="Nuevos usuarios por día"
              color="bg-blue-400"
            />
            <MiniBarChart
              data={(dailyActivity?.mealLogsByDay ?? []).map(d => ({ date: String(d.date), count: Number(d.count) }))}
              label="Registros de comida por día"
              color="bg-orange-400"
            />
            <MiniBarChart
              data={(dailyActivity?.menusByDay ?? []).map(d => ({ date: String(d.date), count: Number(d.count) }))}
              label="Menús creados por día"
              color="bg-green-400"
            />
          </div>
        )}
      </div>

      {/* ── Top Users ── */}
      <div className="vively-card space-y-3">
        <h3 className="flex items-center gap-1.5 text-sm font-bold text-gray-700">
          <TrophyIcon className="h-4 w-4 text-yellow-500" /> Top 10 usuarios más activos
        </h3>
        <p className="text-xs text-gray-400">Clasificados por número de registros en el diario alimentario.</p>
        {loadingTop ? (
          <div className="animate-pulse h-24 bg-gray-50 rounded-xl" />
        ) : (
          <div className="space-y-1.5">
            {(topUsers ?? []).map((u, i) => (
              <div key={u.userId} className="flex items-center gap-3 rounded-xl bg-gray-50 px-3 py-2">
                <span className={`shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold ${
                  i === 0 ? "bg-yellow-400 text-white" :
                  i === 1 ? "bg-gray-300 text-gray-700" :
                  i === 2 ? "bg-amber-600 text-white" :
                  "bg-gray-100 text-gray-500"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{u.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                </div>
                <span className="shrink-0 text-sm font-extrabold text-orange-600">{u.logCount}</span>
              </div>
            ))}
            {(!topUsers || topUsers.length === 0) && (
              <p className="text-center text-xs text-gray-400 py-4">Sin datos de actividad todavía.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Other stats ── */}
      <div className="vively-card">
        <h3 className="mb-2 text-sm font-bold text-gray-700">Otras métricas</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Recetas favoritas", value: overview?.favorites ?? 0, icon: "❤️" },
            { label: "Likes en recetas", value: overview?.recipeLikes ?? 0, icon: "👍" },
            { label: "Complementos registrados", value: overview?.complements ?? 0, icon: "☕" },
            { label: "Métricas corporales", value: overview?.bodyMetrics ?? 0, icon: "⚖️" },
            { label: "Planes copiados", value: overview?.expertCopies ?? 0, icon: "👨‍⚕️" },
            { label: "Solicitudes pendientes", value: overview?.pendingApplications ?? 0, icon: "📋" },
          ].map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2">
              <span className="text-lg">{stat.icon}</span>
              <div>
                <p className="text-sm font-extrabold text-gray-800">{stat.value.toLocaleString("es-ES")}</p>
                <p className="text-[10px] text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
