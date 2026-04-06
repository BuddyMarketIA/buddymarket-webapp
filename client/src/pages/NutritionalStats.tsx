import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Link } from "wouter";

const PERIOD_OPTIONS = [
  { label: "7 días", days: 7 },
  { label: "14 días", days: 14 },
  { label: "30 días", days: 30 },
  { label: "90 días", days: 90 },
];

const MACRO_COLORS = {
  calories: "#F97316",
  proteins: "#818CF8",
  carbohydrates: "#FBBF24",
  fats: "#34D399",
};

function MiniBarChart({
  data,
  dataKey,
  color,
  maxVal,
  height = 80,
}: {
  data: Array<{ date: string; calories: number; proteins: number; carbohydrates: number; fats: number }>;
  dataKey: "calories" | "proteins" | "carbohydrates" | "fats";
  color: string;
  maxVal: number;
  height?: number;
}) {
  if (!data.length) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "14px" }}>Sin datos</div>;

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", height, padding: "0 2px" }}>
      {data.map((d, i) => {
        const val = d[dataKey];
        const pct = maxVal > 0 ? Math.min(100, (val / maxVal) * 100) : 0;
        return (
          <div
            key={i}
            title={`${d.date}: ${val}${dataKey === "calories" ? " kcal" : "g"}`}
            style={{
              flex: 1,
              height: `${Math.max(4, pct)}%`,
              background: color,
              borderRadius: "3px 3px 0 0",
              opacity: 0.85,
              transition: "opacity 0.2s",
              cursor: "default",
              minWidth: "3px",
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.opacity = "0.85"; }}
          />
        );
      })}
    </div>
  );
}

function StatCard({
  title,
  emoji,
  value,
  unit,
  avg,
  max,
  min,
  color,
  data,
  dataKey,
}: {
  title: string;
  emoji: string;
  value: number;
  unit: string;
  avg: number;
  max: number;
  min: number;
  color: string;
  data: any[];
  dataKey: "calories" | "proteins" | "carbohydrates" | "fats";
}) {
  return (
    <div style={{ background: "white", borderRadius: "20px", padding: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "12px", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
          {emoji}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#6b7280" }}>{title}</p>
          <p style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>
            {avg}<span style={{ fontSize: "14px", fontWeight: 600, color: "#9ca3af", marginLeft: "3px" }}>{unit}/día</span>
          </p>
        </div>
      </div>
      <MiniBarChart data={data} dataKey={dataKey} color={color} maxVal={max * 1.1} height={70} />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
        <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 600 }}>Mín: {min}{unit}</span>
        <span style={{ fontSize: "13px", color: color, fontWeight: 700 }}>Máx: {max}{unit}</span>
      </div>
    </div>
  );
}

export default function NutritionalStats() {
  const { t } = useTranslation();
  const [days, setDays] = useState(30);
  const { data, isLoading } = trpc.mealLogs.nutritionalHistory.useQuery({ days });
  const metricsData = trpc.metrics.getAll.useQuery();

  const stats = useMemo(() => {
    const arr = data?.data ?? [];
    if (!arr.length) return null;
    const calc = (key: "calories" | "proteins" | "carbohydrates" | "fats") => {
      const vals = arr.map(d => d[key]).filter(v => v > 0);
      if (!vals.length) return { avg: 0, max: 0, min: 0 };
      return {
        avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
        max: Math.max(...vals),
        min: Math.min(...vals),
      };
    };
    return {
      calories: calc("calories"),
      proteins: calc("proteins"),
      carbohydrates: calc("carbohydrates"),
      fats: calc("fats"),
      daysWithData: arr.length,
    };
  }, [data]);

  // Weight metrics for evolution chart
  const weightHistory = useMemo(() => {
    const metrics = metricsData.data ?? [];
    return (metrics as any[])
      .filter((m: any) => m.weight != null)
      .sort((a: any, b: any) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .slice(-30)
      .map((m: any) => ({
        date: new Date(m.recordedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" }),
        weight: m.weight,
      }));
  }, [metricsData.data]);

  const maxWeight = weightHistory.length ? Math.max(...weightHistory.map((w: any) => w.weight)) : 100;
  const minWeight = weightHistory.length ? Math.min(...weightHistory.map((w: any) => w.weight)) : 0;

  return (
    <div style={{ padding: "16px", paddingBottom: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <Link href="/app/profile">
          <button style={{ width: "36px", height: "36px", borderRadius: "12px", background: "white", border: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.03em" }}>📊 Estadísticas</h1>
          <p style={{ margin: "2px 0 0", fontSize: "14px", color: "#9ca3af", fontWeight: 500 }}>Tu evolución nutricional</p>
        </div>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.days}
            onClick={() => setDays(opt.days)}
            style={{
              padding: "8px 16px",
              borderRadius: "12px",
              border: "none",
              background: days === opt.days ? "#F97316" : "white",
              color: days === opt.days ? "white" : "#6b7280",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: days === opt.days ? "0 4px 12px rgba(249,115,22,0.35)" : "0 2px 8px rgba(0,0,0,0.06)",
              transition: "all 0.2s",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ height: "140px", borderRadius: "20px", background: "#f3f4f6", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : !stats ? (
        <div style={{ background: "white", borderRadius: "20px", padding: "32px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <p style={{ fontSize: "40px", margin: "0 0 12px" }}>📊</p>
          <p style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>Sin datos suficientes</p>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#9ca3af" }}>Registra tus comidas en el Diario para ver estadísticas</p>
          <Link href="/app/meal-log">
            <button style={{ background: "#F97316", color: "white", border: "none", borderRadius: "14px", padding: "12px 24px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              Ir al Diario →
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Summary banner */}
          <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderRadius: "22px", padding: "18px 20px", marginBottom: "16px", boxShadow: "0 8px 24px rgba(0,0,0,0.20)" }}>
            <p style={{ margin: "0 0 4px", fontSize: "14px", fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Resumen — últimos {days} días
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Días registrados</p>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: 900, color: "white", letterSpacing: "-0.04em" }}>{stats.daysWithData}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "14px", color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Kcal media/día</p>
                <p style={{ margin: 0, fontSize: "28px", fontWeight: 900, color: "#F97316", letterSpacing: "-0.04em" }}>{stats.calories.avg}</p>
              </div>
            </div>
          </div>

          {/* Macro cards grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
            <StatCard
              title="Calorías"
              emoji="🔥"
              value={stats.calories.avg}
              unit="kcal"
              avg={stats.calories.avg}
              max={stats.calories.max}
              min={stats.calories.min}
              color={MACRO_COLORS.calories}
              data={data?.data ?? []}
              dataKey="calories"
            />
            <StatCard
              title="Proteínas"
              emoji="💪"
              value={stats.proteins.avg}
              unit="g"
              avg={stats.proteins.avg}
              max={stats.proteins.max}
              min={stats.proteins.min}
              color={MACRO_COLORS.proteins}
              data={data?.data ?? []}
              dataKey="proteins"
            />
            <StatCard
              title="Carbohidratos"
              emoji="⚡"
              value={stats.carbohydrates.avg}
              unit="g"
              avg={stats.carbohydrates.avg}
              max={stats.carbohydrates.max}
              min={stats.carbohydrates.min}
              color={MACRO_COLORS.carbohydrates}
              data={data?.data ?? []}
              dataKey="carbohydrates"
            />
            <StatCard
              title="Grasas"
              emoji="🥑"
              value={stats.fats.avg}
              unit="g"
              avg={stats.fats.avg}
              max={stats.fats.max}
              min={stats.fats.min}
              color={MACRO_COLORS.fats}
              data={data?.data ?? []}
              dataKey="fats"
            />
          </div>

          {/* Macro distribution donut */}
          <div style={{ background: "white", borderRadius: "20px", padding: "18px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
            <p style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 800, color: "#1a1a1a" }}>Distribución media de macros</p>
            {(() => {
              const totalMacroKcal = stats.proteins.avg * 4 + stats.carbohydrates.avg * 4 + stats.fats.avg * 9;
              if (totalMacroKcal === 0) return <p style={{ color: "#9ca3af", fontSize: "13px" }}>Sin datos</p>;
              const protPct = Math.round((stats.proteins.avg * 4 / totalMacroKcal) * 100);
              const carbPct = Math.round((stats.carbohydrates.avg * 4 / totalMacroKcal) * 100);
              const fatPct = 100 - protPct - carbPct;
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {[
                    { label: "Proteínas", pct: protPct, color: MACRO_COLORS.proteins, emoji: "💪", target: "25-35%" },
                    { label: "Carbohidratos", pct: carbPct, color: MACRO_COLORS.carbohydrates, emoji: "⚡", target: "45-55%" },
                    { label: "Grasas", pct: fatPct, color: MACRO_COLORS.fats, emoji: "🥑", target: "20-30%" },
                  ].map(m => (
                    <div key={m.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a" }}>{m.emoji} {m.label}</span>
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 600 }}>Objetivo: {m.target}</span>
                          <span style={{ fontSize: "13px", fontWeight: 900, color: m.color }}>{m.pct}%</span>
                        </div>
                      </div>
                      <div style={{ height: "8px", borderRadius: "999px", background: "#f3f4f6", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "999px", background: m.color, width: `${m.pct}%`, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* Weight evolution */}
      {weightHistory.length > 1 && (
        <div style={{ background: "white", borderRadius: "20px", padding: "18px", marginBottom: "16px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1a1a1a" }}>⚖️ Evolución del peso</p>
            <Link href="/app/metrics">
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#F97316" }}>Ver métricas →</span>
            </Link>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "80px" }}>
            {weightHistory.map((w: any, i: number) => {
              const range = maxWeight - minWeight || 1;
              const pct = ((w.weight - minWeight) / range) * 80 + 20;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <div
                    title={`${w.date}: ${w.weight}kg`}
                    style={{
                      width: "100%",
                      height: `${pct}%`,
                      background: "linear-gradient(180deg, #F97316, #FB923C)",
                      borderRadius: "3px 3px 0 0",
                      opacity: 0.85,
                      minHeight: "4px",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>{weightHistory[0]?.date}</span>
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#F97316" }}>
              {weightHistory[weightHistory.length - 1]?.weight}kg actual
            </span>
            <span style={{ fontSize: "13px", color: "#9ca3af" }}>{weightHistory[weightHistory.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* CTA to log meals */}
      <Link href="/app/meal-log">
        <div style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", borderRadius: "18px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", border: "1px solid rgba(249,115,22,0.15)" }}>
          <span style={{ fontSize: "28px" }}>📝</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "#1a1a1a" }}>Registra más comidas</p>
            <p style={{ margin: 0, fontSize: "14px", color: "#9ca3af" }}>Cuantos más datos, mejores estadísticas</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </Link>

      <p style={{ fontSize: "13px", color: "#d1d5db", textAlign: "center", margin: "16px 0 0", lineHeight: 1.5 }}>
        BuddyMarket no constituye asesoramiento médico o nutricional profesional. Consulta a un profesional.
      </p>
    </div>
  );
}
