import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAYS_ES = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

interface Props {
  onClose: () => void;
  calorieGoal?: number;
  goalType?: string;
  /** Called when user taps a day to navigate to that day's diary */
  onDayPress?: (date: string) => void;
}

export default function NutritionCalendar({ onClose, calorieGoal = 2000, goalType, onDayPress }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [, navigate] = useLocation();

  const { data, isLoading } = trpc.mealLogs.monthlySummary.useQuery({
    year,
    month,
    calorieGoal,
    goalType: goalType as any,
  });

  // Build a map of date -> color
  const colorMap = useMemo(() => {
    const map: Record<string, "green" | "red" | "orange"> = {};
    (data?.days ?? []).forEach((d) => {
      if (d.color) map[d.date] = d.color;
    });
    return map;
  }, [data]);

  // Build calendar grid (weeks starting on Monday)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    // Monday = 0 ... Sunday = 6
    const startDow = (firstDay.getDay() + 6) % 7; // shift so Mon=0
    const totalDays = lastDay.getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;
  const isFutureMonth = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1);

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (onDayPress) {
      onDayPress(dateStr);
    } else {
      // Navigate to diary for that day
      const offset = Math.round((new Date(dateStr).getTime() - today.setHours(0,0,0,0)) / 86400000);
      navigate(`/app/diary?offset=${offset}`);
    }
    onClose();
  };

  const getDayColor = (day: number) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return colorMap[dateStr] ?? null;
  };

  const todayDay = isCurrentMonth ? today.getDate() : null;

  // Count stats for the month
  const stats = useMemo(() => {
    const days = data?.days ?? [];
    return {
      green: days.filter(d => d.color === "green").length,
      red: days.filter(d => d.color === "red").length,
      orange: days.filter(d => d.color === "orange").length,
      total: days.filter(d => d.color !== null).length,
    };
  }, [data]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: "#1a1a2e", maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between px-6 py-4">
          <button
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-2xl transition-colors"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="text-center">
            <h2 className="text-base font-bold tracking-widest uppercase" style={{ color: "white" }}>
              {MONTHS_ES[month - 1]}
            </h2>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{year}</p>
          </div>

          <button
            onClick={nextMonth}
            disabled={isFutureMonth}
            className="flex h-9 w-9 items-center justify-center rounded-2xl transition-colors"
            style={{ background: isFutureMonth ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)", opacity: isFutureMonth ? 0.3 : 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-4 pb-2">
          {DAYS_ES.map(d => (
            <div key={d} className="text-center text-xs font-bold" style={{ color: "rgba(255,255,255,0.35)" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1 px-4 pb-4">
          {isLoading
            ? Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center h-10">
                  <div className="w-8 h-8 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.06)" }} />
                </div>
              ))
            : calendarDays.map((day, i) => {
                if (!day) return <div key={i} />;
                const color = getDayColor(day);
                const isToday = day === todayDay;
                const isFuture = isCurrentMonth && day > today.getDate();

                const bgColor = color === "green"
                  ? "#16a34a"
                  : color === "red"
                  ? "#dc2626"
                  : color === "orange"
                  ? "#ea580c"
                  : isToday
                  ? "rgba(249,115,22,0.25)"
                  : "transparent";

                const textColor = color
                  ? "white"
                  : isToday
                  ? "#F97316"
                  : isFuture
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(255,255,255,0.75)";

                return (
                  <div key={i} className="flex items-center justify-center h-10">
                    <button
                      onClick={() => !isFuture && handleDayClick(day)}
                      disabled={isFuture}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all"
                      style={{
                        background: bgColor,
                        color: textColor,
                        border: isToday && !color ? "2px solid #F97316" : "none",
                        cursor: isFuture ? "default" : "pointer",
                        boxShadow: color ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                      }}
                    >
                      {day}
                    </button>
                  </div>
                );
              })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 px-6 pb-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#dc2626" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {data?.isWeightLoss ? "&lt;34%" : "&gt;110%"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#ea580c" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {data?.isWeightLoss ? "34–100%" : "34–66%"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#16a34a" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
              {data?.isWeightLoss ? "≤100%" : "66–110%"}
            </span>
          </div>
        </div>

        {/* Monthly stats */}
        {stats.total > 0 && (
          <div className="mx-4 mb-6 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.05)" }}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
              Resumen del mes
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(22,163,74,0.15)" }}>
                <p className="text-xl font-black" style={{ color: "#4ade80" }}>{stats.green}</p>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {data?.isWeightLoss ? "Bajo objetivo" : "En objetivo"}
                </p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(234,88,12,0.15)" }}>
                <p className="text-xl font-black" style={{ color: "#fb923c" }}>{stats.orange}</p>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>Incompleto</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(220,38,38,0.15)" }}>
                <p className="text-xl font-black" style={{ color: "#f87171" }}>{stats.red}</p>
                <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {data?.isWeightLoss ? "Excedido" : "Pasado"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-center text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Objetivo: {calorieGoal.toLocaleString("es-ES")} kcal/día
            </p>
          </div>
        )}

        {/* Close button */}
        <div className="px-4 pb-8">
          <button
            onClick={onClose}
            className="w-full rounded-2xl py-3.5 text-sm font-bold transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
