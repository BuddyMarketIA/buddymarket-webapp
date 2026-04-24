// ─── React ────────────────────────────────────────────────────────────────────
import React, { useState } from "react";

// ─── Routing ─────────────────────────────────────────────────────────────────
import { Link } from "wouter";

// ─── Data / API ───────────────────────────────────────────────────────────────
import { trpc } from "@/lib/trpc";

// ─── Auth ─────────────────────────────────────────────────────────────────────
import { useAuth } from "@/_core/hooks/useAuth";

// ─── UI ───────────────────────────────────────────────────────────────────────
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type FeedbackStatus = "pending" | "reviewed" | "resolved";
type FeedbackCategory = "bug" | "improvement" | "idea" | "other";

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

export default function AdminFeedback() {
  const { user } = useAuth();
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
    { enabled: user?.role === "admin" }
  );

  const updateMutation = trpc.feedback.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      utils.feedback.list.invalidate();
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
      {/* Header */}
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
            {total} {total === 1 ? "mensaje recibido" : "mensajes recibidos"}
          </p>
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* Status filter tabs */}
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

        {/* List */}
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
                    {/* Category icon */}
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
                      {/* Admin note */}
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
                          resize: "none",
                          outline: "none",
                          fontFamily: "inherit",
                          boxSizing: "border-box",
                          marginBottom: "10px",
                        }}
                      />

                      {/* Status buttons */}
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
                              borderColor: item.status === s ? STATUS_META[s].color ?? "#F97316" : "#e5e7eb",
                              background: item.status === s ? STATUS_META[s].bg : "white",
                              color: item.status === s ? STATUS_META[s].color : "#6b7280",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              transition: "all 0.15s",
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
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
