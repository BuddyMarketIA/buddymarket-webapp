import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

const STEPS = [
  {
    emoji: "👋",
    title: "¡Bienvenido a BuddyMarket!",
    subtitle: "Tu gestor nutricional inteligente",
    description:
      "Controla tu alimentación, planifica menús, gestiona tu despensa y haz la compra en Mercadona y Carrefour, todo desde un solo lugar.",
    color: "#F97316",
  },
  {
    emoji: "🥗",
    title: "Planifica tu nutrición",
    subtitle: "Recetas, menús y diario nutricional",
    description:
      "Explora miles de recetas, crea menús semanales personalizados y registra lo que comes cada día para seguir tu progreso nutricional.",
    color: "#10B981",
  },
  {
    emoji: "🛒",
    title: "Compra inteligente",
    subtitle: "Mercadona y Carrefour integrados",
    description:
      "Genera listas de la compra automáticamente desde tus menús y envíalas directamente al carrito de tu Super con un solo clic.",
    color: "#3B82F6",
  },
  {
    emoji: "🤖",
    title: "BuddyIA te ayuda",
    subtitle: "Asistente nutricional con IA",
    description:
      "Pregunta a BuddyIA sobre nutrición, pídele recetas personalizadas o usa el asistente de eventos para planificar cenas y barbacoas perfectas.",
    color: "#8B5CF6",
  },
  {
    emoji: "👤",
    title: "Configura tu perfil",
    subtitle: "Personaliza tu experiencia",
    description:
      "Completa tu perfil con tus objetivos, alergias e intolerancias para recibir recomendaciones personalizadas. ¡Solo tarda 2 minutos!",
    color: "#F97316",
    cta: "Configurar mi perfil",
    ctaPath: "/app/profile",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data: profileData, isLoading } = trpc.profile.get.useQuery(undefined, {
    retry: false,
    // Only query profile when user is authenticated
    enabled: !!user,
  });

  const completeOnboarding = trpc.profile.completeOnboarding.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    // Wait until auth and profile data are loaded
    if (authLoading || isLoading) return;
    // Only show onboarding modal for brand-new users (registrationStep === 'account_type' means they just signed up)
    // Never force-redirect existing users - they can complete their profile from /profile
    if (user && profileData && !profileData.user?.onboardingCompleted) {
      const regStep = (profileData.user as any)?.registrationStep;
      // Only show the welcome modal if it's a brand new user on their first visit
      // Don't redirect - let them navigate freely
      if (regStep === "completed" || regStep === "pending_approval") {
        // User went through registration, show welcome modal
        setOpen(true);
      }
      // For users with incomplete registration, just let them use the app
      // They can complete profile from /profile page
      return;
    }
  }, [user, authLoading, profileData, isLoading]);

  const handleClose = () => {
    setOpen(false);
    // Mark onboarding as completed on the server
    completeOnboarding.mutate(undefined, {
      onSuccess: () => {
        utils.profile.get.invalidate();
      },
    });
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleCta = (path: string) => {
    handleClose();
    navigate(path);
  };

  if (!open) return null;

  const current = STEPS[step];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: "24px",
          width: "100%",
          maxWidth: "420px",
          overflow: "hidden",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
          animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Color header */}
        <div
          style={{
            background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)`,
            padding: "40px 32px 32px",
            textAlign: "center",
            position: "relative",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(255,255,255,0.25)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              color: "white",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            ×
          </button>
          <div
            style={{
              fontSize: "64px",
              marginBottom: "16px",
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.15))",
            }}
          >
            {current.emoji}
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: 900,
              color: "white",
              letterSpacing: "-0.03em",
            }}
          >
            {current.title}
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: "14px",
              color: "rgba(255,255,255,0.85)",
              fontWeight: 600,
            }}
          >
            {current.subtitle}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "28px 32px 32px" }}>
          <p
            style={{
              margin: "0 0 28px",
              fontSize: "15px",
              color: "#4B5563",
              lineHeight: 1.65,
              textAlign: "center",
            }}
          >
            {current.description}
          </p>

          {/* Step dots */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "24px",
            }}
          >
            {STEPS.map((_, i) => (
              <div
                key={i}
                onClick={() => setStep(i)}
                style={{
                  width: i === step ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  background: i === step ? current.color : "#E5E7EB",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "14px",
                  border: "2px solid #E5E7EB",
                  background: "white",
                  color: "#6B7280",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Atrás
              </button>
            )}
            {current.cta ? (
              <button
                onClick={() => handleCta(current.ctaPath!)}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "14px",
                  border: "none",
                  background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)`,
                  color: "white",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: `0 4px 14px ${current.color}55`,
                }}
              >
                {current.cta}
              </button>
            ) : (
              <button
                onClick={handleNext}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "14px",
                  border: "none",
                  background: `linear-gradient(135deg, ${current.color}, ${current.color}cc)`,
                  color: "white",
                  fontSize: "15px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: `0 4px 14px ${current.color}55`,
                }}
              >
                {step < STEPS.length - 1 ? "Siguiente →" : "¡Empezar!"}
              </button>
            )}
          </div>

          <button
            onClick={handleClose}
            style={{
              display: "block",
              width: "100%",
              marginTop: "12px",
              background: "none",
              border: "none",
              color: "#9CA3AF",
              fontSize: "13px",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            Omitir introducción
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
