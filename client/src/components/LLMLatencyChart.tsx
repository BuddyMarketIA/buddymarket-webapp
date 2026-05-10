import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

// ── Types ─────────────────────────────────────────────────────────────────────
type RangeOption = 1 | 3 | 7 | 14 | 30;

interface ChartPoint {
  time: string;       // formatted label for X axis
  latencyMs: number;  // raw latency
  success: boolean;
  procedure: string;
  ts: number;         // unix ms for sorting
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as ChartPoint;
  return (
    <div className="rounded-xl border border-border/50 bg-background px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      <p className={d.success ? "text-green-600" : "text-red-500"}>
        {d.success ? "✓ OK" : "✗ Error"} — <span className="font-bold">{d.latencyMs} ms</span>
      </p>
      <p className="text-muted-foreground mt-0.5">{d.procedure}</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function LLMLatencyChart() {
  const [days, setDays] = useState<RangeOption>(7);

  const { data: rows, isLoading, refetch, isFetching } = trpc.admin.getLLMLatencyHistory.useQuery(
    { days },
    { refetchOnWindowFocus: false }
  );

  // Build chart data: chronological order, format time label
  const chartData = useMemo<ChartPoint[]>(() => {
    if (!rows || rows.length === 0) return [];
    const sorted = [...rows].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    return sorted.map((r) => {
      const d = new Date(r.recordedAt);
      const label = days <= 1
        ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      return {
        time: label,
        latencyMs: r.latencyMs,
        success: r.success,
        procedure: r.procedure,
        ts: d.getTime(),
      };
    });
  }, [rows, days]);

  // Stats
  const stats = useMemo(() => {
    if (!chartData.length) return null;
    const latencies = chartData.map((d) => d.latencyMs);
    const successCount = chartData.filter((d) => d.success).length;
    const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    const min = Math.min(...latencies);
    const max = Math.max(...latencies);
    const p95 = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)] ?? max;
    const errorRate = Math.round(((chartData.length - successCount) / chartData.length) * 100);
    return { avg, min, max, p95, total: chartData.length, successCount, errorRate };
  }, [chartData]);

  const RANGE_OPTIONS: { label: string; value: RangeOption }[] = [
    { label: "1d", value: 1 },
    { label: "3d", value: 3 },
    { label: "7d", value: 7 },
    { label: "14d", value: 14 },
    { label: "30d", value: 30 },
  ];

  return (
    <div className="vively-card space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-1.5">
            <span className="text-base">📈</span>
            Latencia histórica del LLM
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tiempo de respuesta por llamada al servicio de IA
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex rounded-lg border border-border/50 overflow-hidden text-xs">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-2.5 py-1 font-semibold transition-colors ${
                  days === opt.value
                    ? "bg-[#F97316] text-white"
                    : "bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted disabled:opacity-50"
            title="Actualizar"
          >
            <ArrowPathIcon className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: "Media", value: `${stats.avg} ms`, color: "text-foreground" },
            { label: "Mín", value: `${stats.min} ms`, color: "text-green-600" },
            { label: "Máx", value: `${stats.max} ms`, color: "text-red-500" },
            { label: "P95", value: `${stats.p95} ms`, color: "text-orange-500" },
            { label: "Tasa error", value: `${stats.errorRate}%`, color: stats.errorRate > 5 ? "text-red-500" : "text-green-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-muted/30 px-2.5 py-2 text-center">
              <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#F97316] border-t-transparent" />
        </div>
      ) : !chartData.length ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
          <span className="text-3xl">📊</span>
          <p className="text-sm font-medium">Sin datos en los últimos {days} días</p>
          <p className="text-xs text-muted-foreground/70">
            Los datos se registran automáticamente al usar el botón "Test conexión" o al generar menús con IA.
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}ms`}
              width={52}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              formatter={(value) => value === "latencyMs" ? "Latencia (ms)" : value}
            />
            {/* P95 reference line */}
            {stats && (
              <ReferenceLine
                y={stats.p95}
                stroke="#F97316"
                strokeDasharray="4 4"
                label={{ value: `P95 ${stats.p95}ms`, position: "insideTopRight", fontSize: 10, fill: "#F97316" }}
              />
            )}
            <Line
              type="monotone"
              dataKey="latencyMs"
              stroke="#F97316"
              strokeWidth={2}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                return (
                  <circle
                    key={`dot-${payload.ts}`}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={payload.success ? "#F97316" : "#ef4444"}
                    stroke={payload.success ? "#F97316" : "#ef4444"}
                    strokeWidth={1}
                  />
                );
              }}
              activeDot={{ r: 5, fill: "#F97316" }}
              name="latencyMs"
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {/* Legend note */}
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#F97316]" /> Llamada exitosa</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-500" /> Error</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-orange-300" /> Línea P95</span>
        <span className="ml-auto">{stats?.total ?? 0} llamadas registradas</span>
      </div>
    </div>
  );
}
