// ─── React ────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from "react";

// ─── Routing ─────────────────────────────────────────────────────────────────
import { Link } from "wouter";

// ─── Data / API ───────────────────────────────────────────────────────────────
import { trpc } from "@/lib/trpc";

// ─── Auth ─────────────────────────────────────────────────────────────────────
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Charts ───────────────────────────────────────────────────────────────────
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ─── UI ───────────────────────────────────────────────────────────────────────
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type FeedbackStatus = "pending" | "reviewed" | "resolved";
type FeedbackCategory = "bug" | "improvement" | "idea" | "other";
type ActiveTab = "analytics" | "list";

const CATEGORY_META: Record<FeedbackCategory, { emoji: string; label: string; color: string }> = {
  bug:         { emoji: "🐛", label: "Error / Bug",  color: "#EF4444" },
  improvement: { emoji: "✨", label: "Mejora",        color: "#F97316" },
  idea:        { emoji: "💡", label: "Idea nueva",    color: "#8B5CF6" },
  other:       { emoji: "📝", label: "Otro",          color: "#6B7280" },
};

const STATUS_META: Record<FeedbackStatus, { label: string; bg: string; color: string }> = {
  pending:  { label: "Pendiente",  bg: "#FEF3C7", color: "#92400E" },
  reviewed: { label: "Revisado",   bg: "#DBEAFE", color: "#1E40AF" },
  resolved: { label: "Resuelto",   bg: "#D1FAE5", color: "#065F46" },
};

// ─── Analytics Panel ─────────────────────────────────────────────────────────
function AnalyticsPanel() {
  const { data, isLoading } = trpc.feedback.analytics.useQuery();

  const categoryChartData = useMemo(() => {
    if (!data) return [];
    return (data.byCategory as Array<{ category: string; count: number }>).map((r) => ({
      name: CATEGORY_META[r.category as FeedbackCategory]?.label ?? r.category,
      value: r.count,
      color: CATEGORY_META[r.category as FeedbackCategory]?.color ?? "#6B7280",
      emoji: CATEGORY_META[r.category as FeedbackCategory]?.emoji ?? "📝",
    }));
  }, [data]);

  const statusChartData = useMemo(() => {
    if (!data) return [];
    return (data.byStatus as Array<{ status: string; count: number }>).map((r) => ({
      name: STATUS_META[r.status as FeedbackStatus]?.label ?? r.status,
      value: r.count,
      color: r.status === "pending" ? "#F59E0B" : r.status === "reviewed" ? "#3B82F6" : "#10B981",
    }));
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) return [];
    const rows = (data.dailyTrend as Array<{ day: string; count: number }>)
      .sort((a, b) => a.day.localeCompare(b.day));
    return rows.map((r) => ({
      day: new Date(r.day + "T00:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
      feedbacks: r.count,
    }));
  }, [data]);

  const resolutionRate = useMemo(() => {
    if (!data) return 0;
    const total = data.total;
    if (total === 0) return 0;
    const resolved = (data.byStatus as Array<{ status: string; count: number }>)
      .find((s) => s.status === "resolved")?.count ?? 0;
    return Math.round((resolved / total) * 100);
  }, [data]);

  const avgResolutionDays = useMemo(() => {
    if (!data?.avgResolutionMs) return null;
    const days = data.avgResolutionMs / (1000 * 60 * 60 * 24);
    return days < 1 ? `${Math.round(data.avgResolutionMs / (1000 * 60 * 60))}h` : `${days.toFixed(1)}d`;
  }, [data]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
        <div style={{ width: "32px", height: "32px", border: "3px solid #f3f4f6", borderTopColor: "#F97316", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        Cargando métricas...
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>📊</div>
        <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>Sin datos todavía</p>
        <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>Las métricas aparecerán cuando los usuarios envíen feedback.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
        {/* Total */}
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", border: "1.5px solid #f3f4f6" }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total</p>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }}>{data.total}</p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>mensajes recibidos</p>
        </div>

        {/* Resolution rate */}
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", border: "1.5px solid #f3f4f6" }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tasa resolución</p>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: 900, color: resolutionRate >= 70 ? "#10B981" : resolutionRate >= 40 ? "#F59E0B" : "#EF4444", letterSpacing: "-0.03em" }}>{resolutionRate}%</p>
          <div style={{ marginTop: "6px", height: "4px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${resolutionRate}%`, background: resolutionRate >= 70 ? "#10B981" : resolutionRate >= 40 ? "#F59E0B" : "#EF4444", borderRadius: "99px", transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Pending */}
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", border: "1.5px solid #f3f4f6" }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pendientes</p>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: 900, color: "#F59E0B", letterSpacing: "-0.03em" }}>
            {(data.byStatus as Array<{ status: string; count: number }>).find((s) => s.status === "pending")?.count ?? 0}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>sin revisar</p>
        </div>

        {/* Avg resolution */}
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", border: "1.5px solid #f3f4f6" }}>
          <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tiempo medio</p>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: 900, color: "#8B5CF6", letterSpacing: "-0.03em" }}>
            {avgResolutionDays ?? "—"}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>para resolver</p>
        </div>
      </div>

      {/* ── Trend Chart ── */}
      {trendData.length > 0 && (
        <div style={{ background: "white", borderRadius: "16px", padding: "16px", border: "1.5px solid #f3f4f6" }}>
          <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#111827" }}>
            Tendencia — últimos 30 días
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="feedbackGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "white", border: "1.5px solid #f3f4f6", borderRadius: "10px", fontSize: "12px" }}
                labelStyle={{ fontWeight: 700, color: "#111827" }}
              />
              <Area type="monotone" dataKey="feedbacks" name="Feedbacks" stroke="#F97316" strokeWidth={2.5} fill="url(#feedbackGrad)" dot={false} activeDot={{ r: 4, fill: "#F97316" }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Category & Status Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>

        {/* Category bar chart */}
        {categoryChartData.length > 0 && (
          <div style={{ background: "white", borderRadius: "16px", padding: "16px", border: "1.5px solid #f3f4f6" }}>
            <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#111827" }}>Por categoría</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={categoryChartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="emoji" tick={{ fontSize: 14 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "white", border: "1.5px solid #f3f4f6", borderRadius: "10px", fontSize: "12px" }}
                  formatter={(value: number, _name: string, props: { payload?: { name: string } }) => [value, props.payload?.name ?? ""]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cat-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Status pie chart */}
        {statusChartData.length > 0 && (
          <div style={{ background: "white", borderRadius: "16px", padding: "16px", border: "1.5px solid #f3f4f6" }}>
            <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: 800, color: "#111827" }}>Por estado</p>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={55}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`st-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "white", border: "1.5px solid #f3f4f6", borderRadius: "10px", fontSize: "12px" }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Category breakdown list ── */}
      <div style={{ background: "white", borderRadius: "16px", padding: "16px", border: "1.5px solid #f3f4f6" }}>
        <p style={{ margin: "0 0 12px", fontSize: "13px", fontWeight: 800, color: "#111827" }}>Desglose por categoría</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {categoryChartData
            .sort((a, b) => b.value - a.value)
            .map((cat) => {
              const pct = data.total > 0 ? Math.round((cat.value / data.total) * 100) : 0;
              return (
                <div key={cat.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{cat.emoji} {cat.name}</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: cat.color }}>{cat.value} ({pct}%)</span>
                  </div>
                  <div style={{ height: "6px", background: "#f3f4f6", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: cat.color, borderRadius: "99px", transition: "width 0.6s ease" }} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminFeedback() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("analytics");
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<Record<number, string>>({});

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.feedback.list.useQuery(
    {
      status: statusFilter === "all" ? undefined : statusFilter,
      limit: 100,
      offset: 0,
    },
    { enabled: user?.role === "admin" && activeTab === "list" }
  );

  const updateMutation = trpc.feedback.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      utils.feedback.list.invalidate();
      utils.feedback.analytics.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (!user) return null;
  if (user.role !== "admin") {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <p style={{ color: "#EF4444", fontWeight: 700 }}>Acceso restringido a administradores.</p>
        <Link href="/app/dashboard" style={{ color: "#F97316", fontWeight: 700 }}>← Volver al dashboard</Link>
      </div>
    );
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const counts = {
    all: total,
    pending:  items.filter((i) => i.status === "pending").length,
    reviewed: items.filter((i) => i.status === "reviewed").length,
    resolved: items.filter((i) => i.status === "resolved").length,
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#FAF9F7", paddingBottom: "40px" }}>
      {/* ── Header ── */}
      <div style={{ background: "white", borderBottom: "1px solid #f3f4f6", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px", position: "sticky", top: 0, zIndex: 10 }}>
        <Link href="/app/admin" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "10px", background: "#f9fafb", border: "1px solid #e5e7eb", textDecoration: "none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: "17px", fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
            Feedback de usuarios
          </h1>
          <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af", fontWeight: 500 }}>
            Análisis y gestión de mensajes
          </p>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div style={{ background: "white", borderBottom: "1px solid #f3f4f6", padding: "0 20px", display: "flex", gap: "0" }}>
        {(["analytics", "list"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab ? "2.5px solid #F97316" : "2.5px solid transparent",
              color: activeTab === tab ? "#F97316" : "#6b7280",
              fontSize: "13px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
              marginBottom: "-1px",
            }}
          >
            {tab === "analytics" ? "📊 Análisis" : "📋 Mensajes"}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 20px" }}>
        {activeTab === "analytics" ? (
          <AnalyticsPanel />
        ) : (
          <>
            {/* ── Status filter tabs ── */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
              {(["all", "pending", "reviewed", "resolved"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "99px",
                    border: "2px solid",
                    borderColor: statusFilter === s ? "#F97316" : "#e5e7eb",
                    background: statusFilter === s ? "#F97316" : "white",
                    color: statusFilter === s ? "white" : "#6b7280",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  {s === "all" ? "Todos" : STATUS_META[s].label}
                  {" "}
                  <span style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "20px",
                    height: "18px",
                    padding: "0 5px",
                    borderRadius: "99px",
                    background: statusFilter === s ? "rgba(255,255,255,0.25)" : "#f3f4f6",
                    fontSize: "11px",
                    fontWeight: 800,
                  }}>
                    {counts[s]}
                  </span>
                </button>
              ))}
            </div>

            {/* ── List ── */}
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
                <div style={{ width: "32px", height: "32px", border: "3px solid #f3f4f6", borderTopColor: "#F97316", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                Cargando feedbacks...
              </div>
            ) : items.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
                <p style={{ fontWeight: 700, color: "#374151", margin: "0 0 4px" }}>Sin feedbacks</p>
                <p style={{ color: "#9ca3af", fontSize: "14px", margin: 0 }}>
                  {statusFilter === "all" ? "Aún no has recibido ningún feedback." : `No hay feedbacks con estado "${STATUS_META[statusFilter as FeedbackStatus].label}".`}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map((item) => {
                  const cat = CATEGORY_META[item.category as FeedbackCategory] ?? CATEGORY_META.other;
                  const st = STATUS_META[item.status as FeedbackStatus] ?? STATUS_META.pending;
                  const isExpanded = expandedId === item.id;
                  const note = noteText[item.id] ?? (item.adminNote ?? "");

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: "white",
                        borderRadius: "16px",
                        border: "1.5px solid",
                        borderColor: isExpanded ? "#F97316" : "#f3f4f6",
                        overflow: "hidden",
                        transition: "border-color 0.15s",
                      }}
                    >
                      {/* Card header */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >
                        <div style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "12px",
                          background: `${cat.color}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "18px",
                          flexShrink: 0,
                        }}>
                          {cat.emoji}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: cat.color }}>{cat.label}</span>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "99px",
                              background: st.bg,
                              color: st.color,
                              fontSize: "11px",
                              fontWeight: 700,
                            }}>
                              {st.label}
                            </span>
                            <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "auto" }}>
                              {new Date(item.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <p style={{
                            margin: 0,
                            fontSize: "13px",
                            color: "#374151",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: isExpanded ? undefined : 2,
                            WebkitBoxOrient: "vertical",
                            overflow: isExpanded ? "visible" : "hidden",
                          }}>
                            {item.message}
                          </p>
                        </div>

                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#9ca3af"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ flexShrink: 0, transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>

                      {/* Expanded actions */}
                      {isExpanded && (
                        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f9fafb" }}>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "#6b7280", marginBottom: "6px", marginTop: "12px" }}>
                            Nota interna (opcional)
                          </label>
                          <textarea
                            value={note}
                            onChange={(e) => setNoteText((prev) => ({ ...prev, [item.id]: e.target.value }))}
                            placeholder="Añade una nota interna sobre este feedback..."
                            rows={2}
                            style={{
                              width: "100%",
                              padding: "10px 12px",
                              borderRadius: "10px",
                              border: "1.5px solid #e5e7eb",
                              fontSize: "13px",
                              color: "#374151",
                              fontFamily: "inherit",
                              boxSizing: "border-box",
                              marginBottom: "10px",
                              resize: "vertical",
                            }}
                          />

                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {(["pending", "reviewed", "resolved"] as FeedbackStatus[]).map((s) => (
                              <button
                                key={s}
                                onClick={() => {
                                  updateMutation.mutate({ id: item.id, status: s, adminNote: note || undefined });
                                }}
                                disabled={updateMutation.isPending}
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: "10px",
                                  border: "2px solid",
                                  borderColor: item.status === s ? STATUS_META[s].color : "#e5e7eb",
                                  background: item.status === s ? STATUS_META[s].bg : "white",
                                  color: item.status === s ? STATUS_META[s].color : "#6b7280",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  opacity: updateMutation.isPending ? 0.6 : 1,
                                }}
                              >
                                {STATUS_META[s].label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
