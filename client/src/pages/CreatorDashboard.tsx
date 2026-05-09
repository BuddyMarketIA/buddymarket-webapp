import React, { useState } from "react"
import { useTranslation } from 'react-i18next';;
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine, Legend,
} from "recharts";
import { Input } from "@/components/ui/input";
import {
  Users, TrendingUp, TrendingDown, Euro, Copy, Check, ExternalLink, Star,
  ArrowUpRight, ArrowDownRight, Minus, ChefHat, Award, Clock,
  Share2, RefreshCw, AlertCircle, Search, ChevronLeft, ChevronRight,
  Download, Filter, Calendar, BarChart2, Activity,
} from "lucide-react";
import { toast } from "@/components/sonner-a11y-shim";

// ─── Charts Section Component ─────────────────────────────────────────────
const CHART_TOOLTIP_STYLE = { borderRadius: 10, border: "1px solid #e5e7eb", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" };

function ChartsSection({ monthlyTrend, weeklyTrend, projection, stats }: { monthlyTrend: any[]; weeklyTrend: any[]; projection: any; stats: any }) {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "cumulative">("monthly");
  const [chartType, setChartType] = useState<"earnings" | "referrals" | "combined">("earnings");

  const data = period === "weekly" ? weeklyTrend : monthlyTrend;
  const xKey = period === "weekly" ? "week" : "month";

  const earnedKey = period === "cumulative" ? "cumEarned" : "earned";
  const referralsKey = period === "cumulative" ? "cumReferrals" : "referrals";

  const avgEarned = data.length ? data.reduce((s: number, d: any) => s + (d[earnedKey] ?? 0), 0) / data.length : 0;
  const avgReferrals = data.length ? data.reduce((s: number, d: any) => s + (d[referralsKey] ?? 0), 0) / data.length : 0;

  return (
    <div className="space-y-5">
      {/* Projection cards */}
      {projection && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Proyección anual", value: `${projection.annualEarned.toFixed(0)}€`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
            { label: "Referidos/año", value: projection.annualReferrals, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Próximo mes", value: `${projection.nextMonthEarned.toFixed(2)}€`, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Nuevos/mes", value: projection.nextMonthReferrals, icon: Activity, color: "text-purple-600", bg: "bg-purple-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-xl p-3 ${bg} flex items-center gap-3`}>
              <div className={`w-8 h-8 rounded-lg bg-background flex items-center justify-center shadow-sm flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-sm font-bold ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main chart card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Análisis de rendimiento</CardTitle>
              <CardDescription>
                {period === "weekly" ? "Últimas 12 semanas" : period === "cumulative" ? "Acumulado total" : "Últimos 12 meses"}
              </CardDescription>
            </div>
            {/* Chart type selector */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(["earnings", "referrals", "combined"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setChartType(t)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    chartType === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "earnings" ? "💰 Ganancias" : t === "referrals" ? "👥 Referidos" : "📊 Combinado"}
                </button>
              ))}
            </div>
          </div>
          {/* Period selector */}
          <div className="flex gap-1.5 flex-wrap">
            {(["weekly", "monthly", "cumulative"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  period === p
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-background text-muted-foreground border-border hover:border-orange-300"
                }`}
              >
                {p === "weekly" ? "Semanal" : p === "monthly" ? "Mensual" : "Acumulado"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={260}>
            {chartType === "earnings" ? (
              <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(2)}€`, period === "cumulative" ? "Acumulado" : "Ganancias"]}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                <ReferenceLine y={avgEarned} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.5}
                  label={{ value: `Media: ${avgEarned.toFixed(2)}€`, position: "insideTopRight", fontSize: 10, fill: "#f97316" }}
                />
                <Area type="monotone" dataKey={earnedKey} stroke="#f97316" strokeWidth={2.5} fill="url(#earnGrad)" dot={{ r: 3, fill: "#f97316" }} activeDot={{ r: 5 }} />
              </AreaChart>
            ) : chartType === "referrals" ? (
              <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number) => [v, period === "cumulative" ? "Acumulados" : "Referidos"]}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                <ReferenceLine y={avgReferrals} stroke="#3b82f6" strokeDasharray="4 4" strokeOpacity={0.5}
                  label={{ value: `Media: ${avgReferrals.toFixed(1)}`, position: "insideTopRight", fontSize: 10, fill: "#3b82f6" }}
                />
                <Bar dataKey={referralsKey} fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Line type="monotone" dataKey={referralsKey} stroke="#1d4ed8" strokeWidth={2} dot={false} />
              </ComposedChart>
            ) : (
              <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey={xKey} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} axisLine={false} tickLine={false} width={45} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v: number, name: string) => name === earnedKey ? [`${v.toFixed(2)}€`, "Ganancias"] : [v, "Referidos"]}
                  contentStyle={CHART_TOOLTIP_STYLE}
                />
                <Legend formatter={(v) => v === earnedKey ? "Ganancias" : "Referidos"} wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="right" dataKey={referralsKey} fill="#3b82f6" radius={[4, 4, 0, 0]} opacity={0.7} />
                <Line yAxisId="left" type="monotone" dataKey={earnedKey} stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: "#f97316" }} activeDot={{ r: 5 }} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Referrals Table Component ──────────────────────────────────────────────
const planLabels: Record<string, string> = { pro: "Pro", pro_max: "Pro Max", free: "Free" };

function ReferralsTable({ codeId, stats, handleShare }: { codeId?: number; stats: any; handleShare: () => void }) {
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<"all" | "active" | "cancelled">("all");
  const [search, setSearch] = React.useState("");
  const [searchInput, setSearchInput] = React.useState("");
  const PAGE_SIZE = 15;

  const { data, isLoading, refetch } = trpc.referrals.getReferralsList.useQuery(
    { page, pageSize: PAGE_SIZE, status, search: search || undefined },
    { refetchInterval: 30000 }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = (s: "all" | "active" | "cancelled") => {
    setStatus(s);
    setPage(1);
  };

  const exportCSV = () => {
    if (!data?.items?.length) return;
    const headers = ["Nombre", "Email", "Plan", "Estado", "Fecha registro", "Días activo", "Ganancias generadas"];
    const rows = data.items.map((r: any) => [
      r.referredName,
      r.referredEmail ?? "",
      planLabels[r.plan] ?? r.plan ?? "",
      r.isActive ? t("common.active") : t("common.cancelled"),
      r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-ES") : "",
      r.daysActive ?? 0,
      `${(r.totalEarned ?? 0).toFixed(2)}€`,
    ]);
    const csv = [headers, ...rows].map(row => row.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "referidos.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado correctamente");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">Lista completa de referidos</CardTitle>
            <CardDescription>
              {stats.activeReferrals} activos · {stats.totalReferrals - stats.activeReferrals} cancelados · {stats.totalReferrals} total
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5" disabled={!data?.items?.length}>
              <Download className="w-3.5 h-3.5" />
              CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(["all", "active", "cancelled"] as const).map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                status === s
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-background text-muted-foreground border-border hover:border-orange-300"
              }`}
            >
              <Filter className="w-3 h-3 inline mr-1" />
              {s === "all" ? "Todos" : s === "active" ? "Activos" : "Cancelados"}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="pl-9 h-9 text-sm"
            />
          </div>
          <Button type="submit" size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">Buscar</Button>
          {search && (
            <Button type="button" variant="outline" size="sm" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}>Limpiar</Button>
          )}
        </form>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : !data?.items?.length ? (
          <div className="text-center py-12 px-6">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {search || status !== "all" ? "No hay referidos con estos filtros" : "Aún no tienes referidos"}
            </p>
            {!search && status === "all" && (
              <>
                <p className="text-sm text-muted-foreground mt-1">Comparte tu código para empezar a ganar</p>
                <Button onClick={handleShare} className="mt-4 bg-orange-500 hover:bg-orange-600 text-white" size="sm">
                  <Share2 className="w-4 h-4 mr-1" /> Compartir mi código
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-2 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <span>Usuario</span>
              <span>Plan</span>
              <span>Estado</span>
              <span>Registro</span>
              <span>Días activo</span>
              <span className="text-right">Ganancias</span>
            </div>

            {data.items.map((ref: any) => (
              <div
                key={ref.id}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-2 md:gap-3 px-5 py-3.5 border-b last:border-0 hover:bg-muted/20 transition-colors items-center"
              >
                {/* User */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold text-sm">
                    {ref.referredImage
                      ? <img src={ref.referredImage} alt="" className="w-9 h-9 rounded-full object-cover" />
                      : (ref.referredName?.[0] ?? "?").toUpperCase()
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{ref.referredName}</p>
                    {ref.referredEmail && <p className="text-xs text-muted-foreground truncate">{ref.referredEmail}</p>}
                  </div>
                </div>

                {/* Plan */}
                <div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {planLabels[ref.plan] ?? ref.plan ?? "Free"}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${
                    ref.isActive
                      ? "bg-green-50 text-green-700 border-green-200"
                      : "bg-red-50 text-red-600 border-red-200"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${ref.isActive ? "bg-green-500" : "bg-red-400"}`} />
                    {ref.isActive ? t("common.active") : t("common.cancelled")}
                  </span>
                </div>

                {/* Registration date */}
                <div className="text-sm text-muted-foreground">
                  {ref.createdAt ? new Date(ref.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" }) : "—"}
                </div>

                {/* Days active */}
                <div className="text-sm text-muted-foreground">
                  {ref.daysActive ?? 0} días
                </div>

                {/* Earnings */}
                <div className="text-right">
                  <span className={`text-sm font-semibold ${ref.totalEarned > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                    {(ref.totalEarned ?? 0).toFixed(2)}€
                  </span>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t bg-muted/20">
                <p className="text-xs text-muted-foreground">
                  Mostrando {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, data.total)} de {data.total} referidos
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const p = data.totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= data.totalPages - 2 ? data.totalPages - 4 + i : page - 2 + i;
                    return (
                      <Button
                        key={p} variant={p === page ? "default" : "outline"} size="sm"
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 p-0 text-xs ${p === page ? "bg-orange-500 hover:bg-orange-600 text-white" : ""}`}
                      >
                        {p}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline" size="sm"
                    onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="w-8 h-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function StatCard({
  title, value, subtitle, icon: Icon, trend, trendValue, color = "orange",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "orange" | "green" | "blue" | "purple";
}) {
  const colorMap = {
    orange: "text-orange-500 bg-orange-50",
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
  };
  return (
    <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground truncate">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                ) : trend === "down" ? (
                  <ArrowDownRight className="w-3 h-3 text-red-500" />
                ) : (
                  <Minus className="w-3 h-3 text-muted-foreground" />
                )}
                <span className={`text-xs font-medium ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralRow({ referral, index }: { referral: any; index: number }) {
  const planLabels: Record<string, string> = {
    pro: "Pro",
    pro_max: "Pro Max",
    free: "Free",
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {referral.referredName ? referral.referredName[0].toUpperCase() : "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {referral.referredName ?? `Usuario #${index + 1}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(referral.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {referral.plan && (
          <Badge variant="secondary" className="text-xs">
            {planLabels[referral.plan] ?? referral.plan}
          </Badge>
        )}
        <Badge
          variant={referral.isActive ? "default" : "secondary"}
          className={`text-xs ${referral.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`}
        >
          {referral.isActive ? t("common.active") : t("common.cancelled")}
        </Badge>
      </div>
    </div>
  );
}

function EarningRow({ earning }: { earning: any }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white flex-shrink-0">
        <Euro className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          Comisión de {earning.referredName ?? "usuario"}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(earning.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold text-green-600">
          +{(earning.commissionAmount / 100).toFixed(2)}€
        </span>
        <Badge
          variant={earning.status === "completed" ? "default" : "secondary"}
          className={`text-xs ${earning.status === "completed" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-yellow-100 text-yellow-700"}`}
        >
          {earning.status === "completed" ? "Pagado" : t("common.pending")}
        </Badge>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const generateCode = trpc.referrals.generate.useMutation({
    onSuccess: () => {
      utils.referrals.getDashboardStats.invalidate();
      toast.success("¡Código de referido generado!");
    },
    onError: (e) => toast.error(e.message),
  });
  const utils = trpc.useUtils();

  const { data, isLoading, error, refetch } = trpc.referrals.getDashboardStats.useQuery(undefined, {
    refetchInterval: 30000, // refresh every 30s for "real-time"
  });

  const handleCopyCode = () => {
    if (!data || !("code" in data) || !data.code) return;
    const referralLink = `${window.location.origin}/registro?ref=${data.code.code}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("¡Enlace copiado al portapapeles!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (!data || !("code" in data) || !data.code) return;
    const referralLink = `${window.location.origin}/registro?ref=${data.code.code}`;
    if (navigator.share) {
      navigator.share({
        title: "Únete a Buddy One",
        text: `Usa mi código ${data.code.code} y obtén un ${data.code.discountPercent}% de descuento en tu suscripción`,
        url: referralLink,
      });
    } else {
      handleCopyCode();
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Acceso restringido</h2>
          <p className="text-muted-foreground mb-6">Necesitas iniciar sesión para ver tu panel de creador.</p>
          <Link href="/login">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full">Iniciar sesión</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // No referral code yet
  if (!data || !("hasCode" in data) || !data.hasCode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Panel de Creador</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Genera tu código de referido único para empezar a ganar comisiones del <strong>20%</strong> por cada suscripción que traigas a Buddy One.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8 text-left space-y-3">
            <h3 className="font-semibold text-orange-800">¿Cómo funciona?</h3>
            <div className="space-y-2 text-sm text-orange-700">
              <div className="flex items-start gap-2"><span className="font-bold">1.</span><span>Genera tu código personalizado</span></div>
              <div className="flex items-start gap-2"><span className="font-bold">2.</span><span>Compártelo con tu audiencia — ellos obtienen un {15}% de descuento</span></div>
              <div className="flex items-start gap-2"><span className="font-bold">3.</span><span>Tú ganas el <strong>20% de cada suscripción activa</strong> que entre con tu código</span></div>
              <div className="flex items-start gap-2"><span className="font-bold">4.</span><span>Cobras mientras el usuario siga suscrito</span></div>
            </div>
          </div>
          <Button
            onClick={() => generateCode.mutate({ creatorType: "buddymaker", discountPercent: 15 })}
            disabled={generateCode.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg rounded-xl"
          >
            {generateCode.isPending ? "Generando..." : "Generar mi código de referido"}
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            ¿Eres nutricionista o experto en salud?{" "}
            <Link href="/app/buddy-experts" className="text-orange-500 underline">Regístrate como BuddyExpert</Link>
          </p>
        </div>
      </div>
    );
  }

  const { code, creatorProfile, stats, monthlyTrend, weeklyTrend, projection, recentEarnings, recentReferrals } = data as any;
  const referralLink = `${window.location.origin}/registro?ref=${code?.code}`;
  const monthTrend = stats.lastMonthEarned > 0
    ? stats.monthEarned >= stats.lastMonthEarned
      ? "up" : "down"
    : "neutral";
  const monthTrendValue = stats.lastMonthEarned > 0
    ? `${Math.round(Math.abs(((stats.monthEarned - stats.lastMonthEarned) / stats.lastMonthEarned) * 100))}% vs mes anterior`
    : "Primer mes";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {creatorProfile?.avatarUrl ? (
                <img src={creatorProfile.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-background/20 flex items-center justify-center">
                  {creatorProfile?.type === "expert" ? <ChefHat className="w-7 h-7" /> : <Star className="w-7 h-7" />}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{creatorProfile?.displayName ?? user.name}</h1>
                  {creatorProfile?.verified && (
                    <Badge className="bg-background/20 text-white border-0 text-xs">✓ Verificado</Badge>
                  )}
                </div>
                <p className="text-orange-100 text-sm">
                  {creatorProfile?.type === "expert" ? "BuddyExpert" : "BuddyMaker"} · Panel de Control
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-white/30 text-white hover:bg-background/10 bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualizar
              </Button>
              <Link href="/creators">
                <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-background/10 bg-transparent">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ver landing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ganancias totales"
            value={`${stats.totalEarned.toFixed(2)}€`}
            subtitle="Comisiones acumuladas"
            icon={Euro}
            color="green"
          />
          <StatCard
            title="Este mes"
            value={`${stats.monthEarned.toFixed(2)}€`}
            subtitle={`${new Date().toLocaleString("es-ES", { month: "long" })}`}
            icon={TrendingUp}
            trend={monthTrend}
            trendValue={monthTrendValue}
            color="orange"
          />
          <StatCard
            title="Referidos activos"
            value={stats.activeReferrals}
            subtitle={`${stats.totalReferrals} total`}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Tasa de conversión"
            value={`${stats.conversionRate}%`}
            subtitle={`${stats.usageCount} usos del código`}
            icon={Award}
            color="purple"
          />
        </div>

        {/* Referral Code Card */}
        <Card className="border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-700 mb-1">Tu código de referido</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-black text-orange-600 tracking-wider font-mono">
                    {code?.code}
                  </span>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    {code?.discountPercent}% descuento para tus referidos
                  </Badge>
                </div>
                <p className="text-xs text-orange-600 mt-2 truncate max-w-sm">
                  {referralLink}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Compartir
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopyCode}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "¡Copiado!" : "Copiar enlace"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Charts Section */}
        <ChartsSection monthlyTrend={monthlyTrend} weeklyTrend={weeklyTrend} projection={projection} stats={stats} />

        {/* Referrals & Earnings Tables */}
        <Tabs defaultValue="referrals">
          <TabsList className="mb-4">
            <TabsTrigger value="referrals">
              <Users className="w-4 h-4 mr-1.5" />
              Referidos ({stats.totalReferrals})
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <Euro className="w-4 h-4 mr-1.5" />
              Comisiones ({recentEarnings?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referrals">
            <ReferralsTable codeId={code?.id} stats={stats} handleShare={handleShare} />
          </TabsContent>

          <TabsContent value="earnings">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Historial de comisiones</CardTitle>
                <CardDescription>
                  Total acumulado: <strong className="text-green-600">{stats.totalEarned.toFixed(2)}€</strong>
                  {" · "}Este mes: <strong className="text-orange-600">{stats.monthEarned.toFixed(2)}€</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentEarnings?.length > 0 ? (
                  <div>
                    {recentEarnings.map((earning: any) => (
                      <EarningRow key={earning.id} earning={earning} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Euro className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Aún no hay comisiones</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Las comisiones aparecerán cuando tus referidos se suscriban
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">¿Cuándo cobro mis comisiones?</p>
                <p className="text-sm text-blue-700">
                  Las comisiones se calculan automáticamente cada vez que un usuario referido renueva su suscripción.
                  El pago se realiza mensualmente a tu cuenta de Stripe Connect. El porcentaje es del <strong>20% neto</strong> después
                  de las comisiones de plataformas (App Store 30%, Google Play 30%, Stripe ~3%).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
