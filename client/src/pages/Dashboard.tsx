import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useMemo } from "react";
import {
  BellAlertIcon,
} from "@heroicons/react/24/outline";

const QUICK_ITEMS = [
  { label: "Lista de compra", icon: "🛒", to: "/shopping-lists" },
  { label: "Menús", icon: "📅", to: "/menus" },
  { label: "IA Nutricional", icon: "✨", to: "/ai-chat" },
  { label: "Mis Recetas", icon: "📖", to: "/recipes" },
  { label: "Crear Receta", icon: "➕", to: "/recipes/new" },
  { label: "Inventario", icon: "📦", to: "/inventory" },
];

function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = goal > 0 ? Math.min((value / goal) * 100, 100) : 0;
  return (
    <div className="min-w-0">
      <div className="text-[9px] font-semibold text-gray-500">{label}</div>
      <div className="mt-0.5 whitespace-nowrap text-[11px] font-bold text-gray-900">
        {value.toFixed(0)}
        <span className="ml-0.5 text-[9px] font-medium text-gray-400">/ {goal}g</span>
      </div>
      <div className="macro-bar mt-1">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<"today" | "yesterday">("today");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  }, []);

  const { data: todaySummary } = trpc.mealLogs.dailySummary.useQuery(
    { date: todayStr },
    { enabled: !!user }
  );
  const { data: yesterdaySummary } = trpc.mealLogs.dailySummary.useQuery(
    { date: yesterdayStr },
    { enabled: !!user }
  );
  const { data: profileData } = trpc.profile.get.useQuery(undefined, { enabled: !!user });
  const { data: inventoryItems } = trpc.inventory.list.useQuery(undefined, { enabled: !!user });

  // Compute expiring items from inventory list
  const expiringItems = inventoryItems?.filter((item) => {
    if (!item.item.expirationDate) return false;
    const expDate = new Date(item.item.expirationDate);
    const diffDays = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays >= 0;
  }) ?? [];

  const summary = selectedDay === "today" ? todaySummary : yesterdaySummary;
  const kcal = summary?.calories ?? 0;
  const prot = summary?.proteins ?? 0;
  const carbs = summary?.carbohydrates ?? 0;
  const fats = summary?.fats ?? 0;

  const goalKcal = profileData?.profile?.dailyCalorieGoal ?? 2000;
  const goalProt = profileData?.profile?.dailyProteinGoal ?? 150;
  const goalCarbs = profileData?.profile?.dailyCarbsGoal ?? 250;
  const goalFats = profileData?.profile?.dailyFatGoal ?? 65;

  const diff = goalKcal - kcal;
  const pctKcal = goalKcal > 0 ? Math.min((kcal / goalKcal) * 100, 100) : 0;

  const statusMessage =
    diff > 200
      ? `Te quedan ${diff.toFixed(0)} kcal para tu objetivo`
      : diff >= 0
      ? "¡Casi en tu objetivo! Buen trabajo 💪"
      : `Superaste tu objetivo en ${Math.abs(diff).toFixed(0)} kcal`;

  const firstName = user?.name?.split(" ")[0] ?? "Usuario";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="vively-page container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{greeting},</p>
          <h1 className="text-2xl font-bold text-gray-900">{firstName} 👋</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#00D27A] shadow-sm">
          <span className="text-lg font-black text-white">V</span>
        </div>
      </div>

      {/* Expiring alert */}
      {expiringItems && expiringItems.length > 0 && (
        <Link href="/inventory">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3 cursor-pointer">
            <BellAlertIcon className="h-5 w-5 shrink-0 text-orange-500" />
            <p className="text-sm font-medium text-orange-700">
              {expiringItems.length} producto{expiringItems.length > 1 ? "s" : ""} próximo
              {expiringItems.length > 1 ? "s" : ""} a vencer
            </p>
          </div>
        </Link>
      )}

      {/* Day selector */}
      <div className="mb-4 flex gap-2">
        {(["today", "yesterday"] as const).map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
              selectedDay === day
                ? "bg-[#00D27A] text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {day === "today" ? "Hoy" : "Ayer"}
          </button>
        ))}
      </div>

      {/* Nutrition card */}
      <div className="vively-card mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-700">Resumen nutricional</h2>
          <Link href="/meal-log" className="text-xs font-semibold text-[#00D27A]">
            Ver diario →
          </Link>
        </div>

        <div className="flex items-start gap-4">
          {/* Circular progress */}
          <div className="relative shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#f3f4f6" strokeWidth="8" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="#00D27A" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - pctKcal / 100)}`}
                transform="rotate(-90 40 40)"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[15px] font-extrabold leading-none text-gray-900">{kcal.toFixed(0)}</span>
              <span className="text-[8px] font-semibold text-gray-400">kcal</span>
            </div>
          </div>

          {/* Macros */}
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-end gap-1">
              <span className={`text-2xl font-extrabold leading-none ${diff >= 0 ? "text-gray-900" : "text-red-500"}`}>
                {Math.abs(diff).toFixed(0)}
              </span>
              <span className="pb-0.5 text-[10px] font-semibold text-gray-400">kcal</span>
            </div>
            <div className={`mb-3 text-[10px] font-semibold ${diff >= 0 ? "text-[#00D27A]" : "text-red-500"}`}>
              {diff >= 0 ? "restantes" : "superado"}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <MacroBar label="Proteínas" value={prot} goal={goalProt} color="#00D27A" />
              <MacroBar label="Carbos" value={carbs} goal={goalCarbs} color="#3B82F6" />
              <MacroBar label="Grasas" value={fats} goal={goalFats} color="#F59E0B" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#f0fdf4] px-3 py-2 text-xs font-medium text-[#00a85f]">
          <span>👍</span>
          <span>{statusMessage}</span>
        </div>
      </div>

      {/* Quick access */}
      <h2 className="mb-4 text-base font-bold text-gray-900">Accesos rápidos</h2>
      <div className="grid grid-cols-3 gap-4">
        {QUICK_ITEMS.map((item) => (
          <Link key={item.to} href={item.to} className="group">
            <div className="dash-item">
              <div className="dash-item-circle">
                <span className="text-3xl transition-transform group-hover:scale-110">{item.icon}</span>
              </div>
              <span className="dash-item-label">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="vively-disclaimer">
        <p>
          El contenido de VIVELY no constituye recomendaciones profesionales. Consulta siempre con un
          nutricionista o profesional de la salud.
        </p>
      </div>
    </div>
  );
}
