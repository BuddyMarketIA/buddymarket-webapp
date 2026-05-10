// ─── React ────────────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from "react"
import { useTranslation } from 'react-i18next';;

// ─── Data / API ───────────────────────────────────────────────────────────────
import { trpc } from "@/lib/trpc";
import { getErrorMessage } from "@/lib/errorUtils";

// ─── UI ───────────────────────────────────────────────────────────────────────
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
type FeedbackCategory = "bug" | "improvement" | "idea" | "other";

interface CategoryOption {
  value: FeedbackCategory;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    value: "bug",
    label: "Error / Bug",
    emoji: "🐛",
    description: "Algo no funciona correctamente",
    color: "#EF4444",
  },
  {
    value: "improvement",
    label: "Mejora",
    emoji: "✨",
    description: "Quiero mejorar algo existente",
    color: "#F97316",
  },
  {
    value: "idea",
    label: "Idea nueva",
    emoji: "💡",
    description: "Una funcionalidad que me gustaría",
    color: "#8B5CF6",
  },
  {
    value: "other",
    label: "Otro",
    emoji: "📝",
    description: "Cualquier otro comentario",
    color: "#6B7280",
  },
];

const MAX_CHARS = 500;
const MIN_CHARS = 10;

interface FeedbackButtonProps {
  asSidebarItem?: boolean;
  onClose?: () => void;
  /** Number of pending feedbacks — shows a badge when > 0 (admin only) */
  pendingCount?: number;
}

export default function FeedbackButton({ asSidebarItem = false, onClose, pendingCount = 0 }: FeedbackButtonProps = {}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"category" | "message" | "success">("category");
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submitMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setStep("success");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, "No se pudo enviar el feedback. Inténtalo de nuevo."));
    },
  });

  // Focus textarea when entering message step
  useEffect(() => {
    if (step === "message" && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [step]);

  // Reset state when closing
  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setStep("category");
      setCategory(null);
      setMessage("");
    }, 300);
  }

  function handleCategorySelect(cat: FeedbackCategory) {
    setCategory(cat);
    setStep("message");
  }

  function handleBack() {
    setStep("category");
    setMessage("");
  }

  function handleSubmit() {
    if (!category || message.trim().length < MIN_CHARS) return;
    submitMutation.mutate({ category, message: message.trim() });
  }

  const selectedCategory = CATEGORIES.find((c) => c.value === category);
  const charsLeft = MAX_CHARS - message.length;
  const isValid = message.trim().length >= MIN_CHARS && message.length <= MAX_CHARS;

  function handleOpenFromSidebar() {
    if (onClose) onClose();
    setTimeout(() => setOpen(true), 320); // wait for sidebar close animation
  }

  return (
    <>
      {/* Sidebar item trigger */}
      {asSidebarItem ? (
        <button
          onClick={handleOpenFromSidebar}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: "11px", padding: "9px 13px", borderRadius: "10px", background: "transparent", border: "none", cursor: "pointer", marginBottom: "2px", textAlign: "left" }}
        >
          <span style={{ fontSize: "17px", width: "21px", textAlign: "center" }}>💬</span>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--sidebar-text, #374151)", flex: 1 }}>Enviar feedback</span>
          {pendingCount > 0 && (
            <span
              title={`${pendingCount} feedback${pendingCount === 1 ? "" : "s"} pendiente${pendingCount === 1 ? "" : "s"}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: pendingCount > 99 ? "28px" : "20px",
                height: "20px",
                padding: "0 5px",
                borderRadius: "10px",
                background: "#EF4444",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                lineHeight: 1,
                flexShrink: 0,
                animation: "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
              }}
            >
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
      ) : null}

      {/* Modal overlay */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 9000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
              overflow: "hidden",
              animation: "feedbackSlideUp 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #F97316, #FB923C)",
              padding: "20px 20px 16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
                  Tu opinión importa
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                  Ayúdanos a mejorar Buddy One
                </p>
              </div>
              <button
                onClick={handleClose}
                aria-label=t("common.close")
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(255,255,255,0.2)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step: category */}
            {step === "category" && (
              <div style={{ padding: "20px" }}>
                <p style={{ margin: "0 0 16px", fontSize: "14px", fontWeight: 700, color: "#374151" }}>
                  ¿Qué tipo de feedback quieres enviarnos?
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategorySelect(cat.value)}
                      style={{
                        padding: "14px 12px",
                        borderRadius: "14px",
                        border: "2px solid #f3f4f6",
                        background: "white",
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "all 0.15s",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = cat.color;
                        e.currentTarget.style.background = `${cat.color}0D`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#f3f4f6";
                        e.currentTarget.style.background = "white";
                      }}
                    >
                      <span style={{ fontSize: "24px", lineHeight: 1 }}>{cat.emoji}</span>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: "#111827" }}>{cat.label}</span>
                      <span style={{ fontSize: "11px", color: "#6b7280", lineHeight: 1.3 }}>{cat.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: message */}
            {step === "message" && selectedCategory && (
              <div style={{ padding: "20px" }}>
                {/* Category badge */}
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "99px",
                  background: `${selectedCategory.color}15`,
                  border: `1.5px solid ${selectedCategory.color}30`,
                  marginBottom: "14px",
                }}>
                  <span style={{ fontSize: "14px" }}>{selectedCategory.emoji}</span>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: selectedCategory.color }}>{selectedCategory.label}</span>
                </div>

                <label htmlFor="feedback-message" style={{ display: "block", fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "8px" }}>
                  Cuéntanos más
                </label>
                <textarea
                  id="feedback-message"
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                  placeholder={
                    category === "bug"
                      ? "Describe el error: ¿qué pasó? ¿qué esperabas que pasara?"
                      : category === "improvement"
                      ? "¿Qué mejorarías y cómo lo harías?"
                      : category === "idea"
                      ? "Describe tu idea con el mayor detalle posible"
                      : "Escribe tu comentario aquí..."
                  }
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "12px",
                    border: `2px solid ${message.trim().length >= MIN_CHARS ? selectedCategory.color + "50" : "#e5e7eb"}`,
                    fontSize: "14px",
                    lineHeight: 1.5,
                    color: "#111827",
                    resize: "none",
                    outline: "none",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = selectedCategory.color; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = message.trim().length >= MIN_CHARS ? selectedCategory.color + "50" : "#e5e7eb"; }}
                />

                {/* Char counter */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                  <span style={{ fontSize: "11px", color: message.trim().length < MIN_CHARS ? "#9ca3af" : "#10b981", fontWeight: 600 }}>
                    {message.trim().length < MIN_CHARS
                      ? `Mínimo ${MIN_CHARS - message.trim().length} caracteres más`
                      : "✓ Listo para enviar"}
                  </span>
                  <span style={{ fontSize: "11px", color: charsLeft < 50 ? "#EF4444" : "#9ca3af", fontWeight: 600 }}>
                    {charsLeft} restantes
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                  <button
                    onClick={handleBack}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "12px",
                      border: "2px solid #e5e7eb",
                      background: "white",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#6b7280",
                      cursor: "pointer",
                    }}
                  >
                    ← Atrás
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!isValid || submitMutation.isPending}
                    style={{
                      flex: 2,
                      padding: "12px",
                      borderRadius: "12px",
                      border: "none",
                      background: isValid && !submitMutation.isPending
                        ? `linear-gradient(135deg, ${selectedCategory.color}, ${selectedCategory.color}CC)`
                        : "#e5e7eb",
                      fontSize: "14px",
                      fontWeight: 800,
                      color: isValid && !submitMutation.isPending ? "white" : "#9ca3af",
                      cursor: isValid && !submitMutation.isPending ? "pointer" : "not-allowed",
                      transition: "all 0.15s",
                    }}
                  >
                    {submitMutation.isPending ? t("common.sending") : "Enviar feedback"}
                  </button>
                </div>
              </div>
            )}

            {/* Step: success */}
            {step === "success" && (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <div style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #10b981, #34d399)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                  ¡Gracias por tu feedback!
                </p>
                <p style={{ margin: "0 0 24px", fontSize: "14px", color: "#6b7280", lineHeight: 1.5 }}>
                  Tu opinión nos ayuda a mejorar Buddy One cada día. Lo revisaremos lo antes posible.
                </p>
                <button
                  onClick={handleClose}
                  style={{
                    padding: "12px 32px",
                    borderRadius: "12px",
                    border: "none",
                    background: "linear-gradient(135deg, #F97316, #FB923C)",
                    fontSize: "14px",
                    fontWeight: 800,
                    color: "white",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
                  }}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Animation keyframes */}
      <style>{`
        @keyframes feedbackSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
