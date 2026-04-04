import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import AppLayout from "@/components/AppLayout";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── Palette ─────────────────────────────────────────────────────────────────
const C = {
  orange: "#F97316",
  orangeLight: "#FED7AA",
  blue: "#6366F1",
  blueLight: "#C7D2FE",
  green: "#22C55E",
  greenLight: "#BBF7D0",
  yellow: "#EAB308",
  yellowLight: "#FEF08A",
  red: "#EF4444",
  gray: "#9CA3AF",
  bg: "#FFFBF5",
  card: "#FFFFFF",
  text: "#1C1917",
  muted: "#78716C",
};

// ─── Period selector ──────────────────────────────────────────────────────────
const PERIODS = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};

const CustomTooltip = ({ active, payload, label, unit = "" }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10,
      padding: "8px 14px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 13,
    }}>
      <p style={{ color: C.muted, marginBottom: 4, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(1) : p.value}{unit}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: string;
}) {
  return (
    <div style={{
      background: C.card, borderRadius: 16, padding: "18px 20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", gap: 14,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: color + "20", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, color: C.text, margin: "2px 0 0" }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13, color: C.muted, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

// ─── Chart card ───────────────────────────────────────────────────────────────
function ChartCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: C.card, borderRadius: 16, padding: "20px 16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)", ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Progress() {
  const [days, setDays] = useState(30);

  const summaryQ = trpc.progress.summary.useQuery();
  const weightQ = trpc.progress.weightHistory.useQuery({ days });
  const nutritionQ = trpc.progress.dailyNutrition.useQuery({ days });
  const adherenceQ = trpc.progress.menuAdherence.useQuery({ weeks: 4 });
  const achievementsQ = trpc.achievements.getAll.useQuery();
  const profileQ = trpc.profile.get.useQuery();

  const summary = summaryQ.data;
  const profile = profileQ.data?.profile;

  // Weight chart data
  const weightData = useMemo(() =>
    (weightQ.data ?? []).map(r => ({
      date: fmtDate(r.date),
      Peso: r.weight,
      "% Grasa": r.bodyFat,
    })), [weightQ.data]);

  // Calorie chart data
  const calorieData = useMemo(() =>
    (nutritionQ.data ?? []).map(r => ({
      date: fmtDate(r.date),
      Calorías: r.calories,
      Objetivo: profile?.dailyCalorieGoal ?? 2200,
    })), [nutritionQ.data, profile]);

  // Macros stacked bar
  const macroData = useMemo(() =>
    (nutritionQ.data ?? []).map(r => ({
      date: fmtDate(r.date),
      Proteínas: Math.round(r.proteins),
      Carbos: Math.round(r.carbohydrates),
      Grasas: Math.round(r.fats),
    })), [nutritionQ.data]);

  // Adherence radial
  const adherenceData = useMemo(() =>
    (adherenceQ.data ?? []).map((m, i) => ({
      name: m.name,
      value: m.adherencePct,
      fill: [C.orange, C.blue, C.green, C.yellow][i % 4],
    })), [adherenceQ.data]);

  // Achievements
  const unlockedAchs = useMemo(() =>
    (achievementsQ.data?.achievements ?? []).filter(a => a.unlocked).slice(0, 8),
    [achievementsQ.data]);

  const isLoading = summaryQ.isLoading || weightQ.isLoading || nutritionQ.isLoading;

  // Weight delta
  const weightDelta = summary?.weightLost ?? 0;
  const weightDeltaStr = weightDelta > 0 ? `-${weightDelta}kg` : weightDelta < 0 ? `+${Math.abs(weightDelta)}kg` : "0kg";
  const weightDeltaColor = weightDelta > 0 ? C.green : weightDelta < 0 ? C.red : C.gray;

  return (
    <AppLayout>
      <div style={{ background: C.bg, minHeight: "100vh", padding: "20px 16px 100px" }}>

        {/* Period selector */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              style={{
                padding: "6px 16px", borderRadius: 20, border: "none", cursor: "pointer",
                fontWeight: 600, fontSize: 13,
                background: days === p.days ? C.orange : "#F3F4F6",
                color: days === p.days ? "#fff" : C.muted,
                transition: "all 0.2s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: C.muted }}>
            Cargando estadísticas...
          </div>
        ) : (
          <>
            {/* ── Summary KPI cards ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 28 }}>
              <StatCard
                label="Peso perdido"
                value={weightDeltaStr}
                sub={`${summary?.startWeight ?? "—"}kg → ${summary?.currentWeight ?? "—"}kg`}
                color={C.green}
                icon="⚖️"
              />
              <StatCard
                label="Días registrados"
                value={summary?.daysWithLogs ?? 0}
                sub={`de ${days} días`}
                color={C.orange}
                icon="📅"
              />
              <StatCard
                label="Kcal media/día"
                value={summary?.avgCalories ?? 0}
                sub={`objetivo: ${profile?.dailyCalorieGoal ?? 2200} kcal`}
                color={C.blue}
                icon="🔥"
              />
              <StatCard
                label="Proteína media"
                value={`${summary?.avgProteins ?? 0}g`}
                sub={`objetivo: ${profile?.dailyProteinGoal ?? 165}g`}
                color={C.yellow}
                icon="💪"
              />
              <StatCard
                label="Comidas totales"
                value={summary?.totalLogs ?? 0}
                sub="registradas en el diario"
                color={C.green}
                icon="🍽️"
              />
              <StatCard
                label="Puntos BuddyMarket"
                value={summary?.totalPoints ?? 0}
                sub={`Nivel ${summary?.level ?? 1}`}
                color={C.orange}
                icon="🏆"
              />
            </div>

            {/* ── Weight evolution ── */}
            <ChartCard style={{ marginBottom: 24 }}>
              <SectionHeader
                title="Evolución del peso"
                sub="Peso corporal y % de grasa en el tiempo"
              />
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={weightData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.muted }} tickLine={false} />
                  <YAxis
                    yAxisId="weight"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11, fill: C.muted }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    yAxisId="fat"
                    orientation="right"
                    domain={[0, 40]}
                    tick={{ fontSize: 11, fill: C.muted }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip unit="" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {profile?.targetWeight && (
                    <ReferenceLine
                      yAxisId="weight"
                      y={profile.targetWeight}
                      stroke={C.green}
                      strokeDasharray="5 5"
                      label={{ value: `Objetivo ${profile.targetWeight}kg`, fill: C.green, fontSize: 11 }}
                    />
                  )}
                  <Line
                    yAxisId="weight"
                    type="monotone"
                    dataKey="Peso"
                    stroke={C.orange}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: C.orange, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="fat"
                    type="monotone"
                    dataKey="% Grasa"
                    stroke={C.blue}
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Daily calories ── */}
            <ChartCard style={{ marginBottom: 24 }}>
              <SectionHeader
                title="Calorías diarias"
                sub="Ingesta real vs. objetivo calórico"
              />
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={calorieData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.orange} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.orange} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.muted }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unit=" kcal" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine
                    y={profile?.dailyCalorieGoal ?? 2200}
                    stroke={C.green}
                    strokeDasharray="5 5"
                    label={{ value: "Objetivo", fill: C.green, fontSize: 11 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Calorías"
                    stroke={C.orange}
                    strokeWidth={2}
                    fill="url(#calGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Macros stacked bar ── */}
            <ChartCard style={{ marginBottom: 24 }}>
              <SectionHeader
                title="Distribución de macros"
                sub="Proteínas, carbohidratos y grasas por día (g)"
              />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={macroData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: C.muted }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: C.muted }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip unit="g" />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Proteínas" stackId="a" fill={C.blue} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Carbos" stackId="a" fill={C.yellow} />
                  <Bar dataKey="Grasas" stackId="a" fill={C.green} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* ── Menu adherence ── */}
            {adherenceData.length > 0 && (
              <ChartCard style={{ marginBottom: 24 }}>
                <SectionHeader
                  title="Adherencia al menú"
                  sub="% de comidas planificadas completadas por semana"
                />
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <ResponsiveContainer width="50%" height={180}>
                    <RadialBarChart
                      innerRadius="30%"
                      outerRadius="90%"
                      data={adherenceData}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={6}
                        background={{ fill: "#F3F4F6" }}
                      />
                      <Tooltip
                        formatter={(v: any) => [`${v}%`, "Adherencia"]}
                        contentStyle={{ borderRadius: 10, fontSize: 13 }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div style={{ flex: 1 }}>
                    {adherenceData.map((m, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{m.name}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: m.fill }}>{m.value}%</span>
                        </div>
                        <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${m.value}%`,
                            background: m.fill, borderRadius: 3,
                            transition: "width 0.6s ease",
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            )}

            {/* ── Macros average donut-style ── */}
            <ChartCard style={{ marginBottom: 24 }}>
              <SectionHeader
                title="Media de macros diarios"
                sub="Distribución media de nutrientes en el período"
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  { label: "Proteínas", value: summary?.avgProteins ?? 0, goal: profile?.dailyProteinGoal ?? 165, color: C.blue, unit: "g" },
                  { label: "Carbos", value: summary?.avgCarbs ?? 0, goal: profile?.dailyCarbsGoal ?? 220, color: C.yellow, unit: "g" },
                  { label: "Grasas", value: summary?.avgFats ?? 0, goal: profile?.dailyFatGoal ?? 65, color: C.green, unit: "g" },
                ].map(m => {
                  const pct = m.goal > 0 ? Math.min(100, Math.round((m.value / m.goal) * 100)) : 0;
                  return (
                    <div key={m.label} style={{
                      background: m.color + "10", borderRadius: 14, padding: "16px 14px", textAlign: "center",
                    }}>
                      <p style={{ fontSize: 12, color: C.muted, margin: "0 0 6px", fontWeight: 600 }}>{m.label}</p>
                      <p style={{ fontSize: 22, fontWeight: 800, color: m.color, margin: "0 0 4px" }}>
                        {m.value.toFixed(0)}{m.unit}
                      </p>
                      <p style={{ fontSize: 11, color: C.muted, margin: "0 0 8px" }}>
                        objetivo: {m.goal}{m.unit}
                      </p>
                      <div style={{ height: 5, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: `${pct}%`,
                          background: m.color, borderRadius: 3,
                        }} />
                      </div>
                      <p style={{ fontSize: 11, color: m.color, margin: "4px 0 0", fontWeight: 700 }}>{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </ChartCard>

            {/* ── Achievements ── */}
            {unlockedAchs.length > 0 && (
              <ChartCard style={{ marginBottom: 24 }}>
                <SectionHeader
                  title={`🏆 Logros desbloqueados (${achievementsQ.data?.unlockedCount ?? 0}/${achievementsQ.data?.totalCount ?? 0})`}
                  sub={`${achievementsQ.data?.totalPoints ?? 0} puntos · Nivel ${achievementsQ.data?.level?.title ?? 1}`}
                />
                {/* Level progress bar */}
                {achievementsQ.data?.nextLevel && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: C.muted }}>
                        Nivel {achievementsQ.data.level?.title}
                      </span>
                      <span style={{ fontSize: 13, color: C.orange, fontWeight: 700 }}>
                        {achievementsQ.data.totalPoints} / {achievementsQ.data.nextLevel.minPoints} pts
                      </span>
                    </div>
                    <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, Math.round((achievementsQ.data.totalPoints / achievementsQ.data.nextLevel.minPoints) * 100))}%`,
                        background: `linear-gradient(90deg, ${C.orange}, ${C.yellow})`,
                        borderRadius: 4,
                        transition: "width 0.8s ease",
                      }} />
                    </div>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {unlockedAchs.map((a: any) => (
                    <div key={a.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      background: "#FFFBF5", borderRadius: 12, padding: "10px 12px",
                      border: "1px solid #FED7AA",
                    }}>
                      <span style={{ fontSize: 22 }}>{a.icon ?? "🏅"}</span>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: C.text, margin: 0 }}>{a.title}</p>
                        <p style={{ fontSize: 11, color: C.orange, margin: 0 }}>+{a.points ?? 0} pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ChartCard>
            )}

            {/* ── Streak & activity ── */}
            <ChartCard>
              <SectionHeader title="Actividad del mes" sub="Días con al menos una comida registrada" />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {Array.from({ length: days }, (_, i) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (days - 1 - i));
                  const dateStr = d.toISOString().split("T")[0];
                  const hasLog = (nutritionQ.data ?? []).some(r => r.date === dateStr && r.mealCount > 0);
                  return (
                    <div
                      key={i}
                      title={`${fmtDate(dateStr)}${hasLog ? " ✓" : ""}`}
                      style={{
                        width: 20, height: 20, borderRadius: 4,
                        background: hasLog ? C.orange : "#F3F4F6",
                        opacity: hasLog ? 1 : 0.6,
                        cursor: "default",
                      }}
                    />
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>
                🟠 = día con registro &nbsp;·&nbsp; ⬜ = sin registro
              </p>
            </ChartCard>
          </>
        )}
      </div>
    </AppLayout>
  );
}
