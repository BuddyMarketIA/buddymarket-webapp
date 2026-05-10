import { useState } from "react"
import { useTranslation } from 'react-i18next';;
import { PLAN_DISPLAY, PLAN_LIMITS, FEATURE_DESCRIPTIONS, getUpgradePlan, type PlanTier, type PlanLimits } from "@shared/plans";
import { usePlan } from "@/hooks/usePlan";
import { usePayment, type PaymentPlan } from "@/hooks/usePayment";

// ─────────────────────────────────────────────────────────────────────────────
// Upgrade Modal
// ─────────────────────────────────────────────────────────────────────────────
interface UpgradeModalProps {
  feature: keyof PlanLimits;
  currentTier: PlanTier;
  onClose: () => void;
}

export function UpgradeModal({ feature, currentTier, onClose }: UpgradeModalProps) {
  const { purchase, isPending } = usePayment({ onSuccess: onClose });

  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredPlan = featureInfo?.requiredPlan ?? getUpgradePlan(currentTier) ?? "basic";
  const planInfo = PLAN_DISPLAY[requiredPlan];

  const nextPlan = getUpgradePlan(requiredPlan);
  const nextPlanInfo = nextPlan ? PLAN_DISPLAY[nextPlan] : null;

  const handleUpgrade = (plan: PlanTier) => {
    if (plan === "free") return;
    purchase(plan as PaymentPlan, window.location.origin);
  };

  const features: string[] = PLAN_LIMITS[requiredPlan]
    ? [
        PLAN_LIMITS[requiredPlan].canCreateRecipes ? "✓ Crear recetas propias" : "",
        PLAN_LIMITS[requiredPlan].canGenerateAIMenus ? "✓ Menús con IA" : "",
        PLAN_LIMITS[requiredPlan].canAccessSpecializedMenus ? "✓ Menús especializados" : "",
        PLAN_LIMITS[requiredPlan].canAccessDiary ? "✓ Diario nutricional" : "",
        PLAN_LIMITS[requiredPlan].canUseBuddyIA ? "✓ Asistente BuddyIA" : "",
        PLAN_LIMITS[requiredPlan].canConnectSupermarket ? "✓ Conectar supermercado" : "",
        PLAN_LIMITS[requiredPlan].canTrackMetrics ? "✓ Métricas de salud" : "",
        PLAN_LIMITS[requiredPlan].canAccessBuddyExperts ? "✓ Acceso a BuddyExperts" : "",
      ].filter(Boolean)
    : [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "440px",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
          animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${planInfo.color}, ${planInfo.color}cc)`,
          padding: "32px 28px 24px",
          textAlign: "center",
          position: "relative",
        }}>
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 14, right: 14,
              background: "rgba(255,255,255,0.25)", border: "none",
              borderRadius: "50%", width: 30, height: 30,
              cursor: "pointer", color: "white", fontSize: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
           aria-label={t("common.close")>×</button>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <div style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.25)",
            borderRadius: 20,
            padding: "4px 16px",
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 12,
          }}>
            Función {planInfo.badge}
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "white", letterSpacing: "-0.03em" }}>
            {featureInfo?.title ?? "Función premium"}
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: "rgba(255,255,255,0.85)" }}>
            Disponible en el plan {planInfo.name}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 28px" }}>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6B7280", textAlign: "center" }}>
            Desbloquea esta y muchas más funcionalidades con el plan <strong>{planInfo.name}</strong>
          </p>



          {/* Feature list */}
          <div style={{
            background: "#F9FAFB",
            borderRadius: 14,
            padding: "16px 18px",
            marginBottom: 20,
          }}>
            {features.slice(0, 6).map((f, i) => (
              <div key={i} style={{ fontSize: 13, color: "#374151", padding: "3px 0", fontWeight: 500 }}>{f}</div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: planInfo.color }}>{planInfo.price}</span>
            {planInfo.priceMonthly > 0 && (
              <span style={{ fontSize: 13, color: "#9CA3AF", marginLeft: 4 }}>· cancela cuando quieras</span>
            )}
          </div>

          {/* CTA Button */}
          <button
            onClick={() => handleUpgrade(requiredPlan)}
            disabled={isPending}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              border: "none",
              background: isPending ? "#D1D5DB" : `linear-gradient(135deg, ${planInfo.color}, ${planInfo.color}cc)`,
              color: "white",
              fontSize: 16,
              fontWeight: 800,
              cursor: isPending ? "not-allowed" : "pointer",
              boxShadow: isPending ? "none" : `0 6px 20px ${planInfo.color}44`,
              transition: "all 0.2s",
              marginBottom: 10,
            }}
          >
            {isPending ? "Procesando..." : `Actualizar a ${planInfo.name} — ${planInfo.price}`}
          </button>

          {nextPlanInfo && nextPlan && (
            <button
              onClick={() => handleUpgrade(nextPlan)}
              disabled={isPending}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 14,
                border: `2px solid ${nextPlanInfo.color}`,
                background: "white",
                color: nextPlanInfo.color,
                fontSize: 14,
                fontWeight: 700,
                cursor: isPending ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                marginBottom: 10,
              }}
            >
              Ver {nextPlanInfo.name} — {nextPlanInfo.price}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              display: "block",
              width: "100%",
              background: "none",
              border: "none",
              color: "#9CA3AF",
              fontSize: 13,
              cursor: "pointer",
              padding: "6px",
              textAlign: "center",
            }}
          >
            Continuar con el plan gratuito
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UpgradeGate — wraps any component and shows upgrade modal if no access
// ─────────────────────────────────────────────────────────────────────────────
interface UpgradeGateProps {
  feature: keyof PlanLimits;
  children: React.ReactNode;
  overlay?: boolean;
  message?: string;
}

export function UpgradeGate({ feature, children, overlay = false }: UpgradeGateProps) {
  const { can, tier } = usePlan();
  const [showModal, setShowModal] = useState(false);

  if (can(feature)) {
    return <>{children}</>;
  }

  if (overlay) {
    return (
      <>
        <div
          style={{ position: "relative", cursor: "pointer" }}
          onClick={() => setShowModal(true)}
        >
          <div style={{ pointerEvents: "none", opacity: 0.45, userSelect: "none" }}>
            {children}
          </div>
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(3px)",
            borderRadius: "inherit",
            gap: 8,
          }}>
            <div style={{ fontSize: 28 }}>🔒</div>
            <div style={{
              background: "#F97316",
              color: "white",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: 13,
              fontWeight: 700,
            }}>Actualizar plan</div>
          </div>
        </div>
        {showModal && (
          <UpgradeModal feature={feature} currentTier={tier} onClose={() => setShowModal(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        style={{
          background: "linear-gradient(135deg, #FFF7ED, #FEF3C7)",
          border: "2px dashed #FED7AA",
          borderRadius: 16,
          padding: "32px 24px",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(249,115,22,0.15)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 800, color: "#1F2937" }}>
          {FEATURE_DESCRIPTIONS[feature]?.title ?? "Función premium"}
        </h3>
        <p style={{ margin: "0 0 16px", fontSize: 14, color: "#6B7280" }}>
          Disponible en el plan {PLAN_DISPLAY[FEATURE_DESCRIPTIONS[feature]?.requiredPlan ?? "basic"].name}
        </p>
        <button style={{
          background: "linear-gradient(135deg, #F97316, #EA580C)",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "12px 24px",
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: "0 4px 14px rgba(249,115,22,0.35)",
        }}>
          Actualizar plan →
        </button>
      </div>
      {showModal && (
        <UpgradeModal feature={feature} currentTier={tier} onClose={() => setShowModal(false)} />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PlanBadge — shows the current plan badge
// ─────────────────────────────────────────────────────────────────────────────
export function PlanBadge({ tier }: { tier: PlanTier }) {
  const info = PLAN_DISPLAY[tier];
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      background: tier === "free" ? "#F3F4F6" : `${info.color}18`,
      color: tier === "free" ? "#6B7280" : info.color,
      borderRadius: 20,
      padding: "3px 10px",
      fontSize: 12,
      fontWeight: 700,
      border: `1px solid ${tier === "free" ? "#E5E7EB" : `${info.color}44`}`,
    }}>
      {tier !== "free" && "⭐"} {info.badge}
    </span>
  );
}
