/**
 * OnboardingTourGuide — Guided tour with arrows/tooltips for each profile type
 *
 * Usage:
 *   <OnboardingTourGuide profileType="user" onComplete={() => {}} />
 *
 * The tour uses a fullscreen overlay with a spotlight on target elements.
 * If the target element is not found (e.g., different page), it shows a
 * centered modal instead.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";

// ─── Tour step definitions ────────────────────────────────────────────────────

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string; // CSS selector for the element to highlight
  position?: "top" | "bottom" | "left" | "right" | "center";
  icon?: string;
  route?: string; // If set, the tour navigates to this route first
}

const USER_TOUR: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a BuddyMarket! 🎉",
    description: "Te guiamos por las principales funciones de tu nueva app de nutrición personalizada. Usa las flechas para navegar.",
    position: "center",
    icon: "🥗",
  },
  {
    id: "dashboard",
    title: "Tu Dashboard",
    description: "Aquí tienes un resumen de tu actividad: calorías del día, menú semanal, progreso y recomendaciones personalizadas.",
    targetSelector: "[data-tour='dashboard-summary']",
    position: "bottom",
    icon: "📊",
  },
  {
    id: "recipes",
    title: "Recetas personalizadas",
    description: "Explora miles de recetas adaptadas a tus objetivos, restricciones alimentarias y presupuesto semanal.",
    targetSelector: "[data-tour='nav-recipes']",
    position: "right",
    icon: "🍽️",
  },
  {
    id: "menus",
    title: "Menú semanal",
    description: "Genera tu menú semanal con un clic. La IA lo adapta a tus macros, preferencias y lo actualiza cada semana.",
    targetSelector: "[data-tour='nav-menus']",
    position: "right",
    icon: "📅",
  },
  {
    id: "shopping",
    title: "Lista de la compra",
    description: "Genera automáticamente la lista de la compra desde tu menú semanal. Añade artículos extra y compártela.",
    targetSelector: "[data-tour='nav-shopping']",
    position: "right",
    icon: "🛒",
  },
  {
    id: "inventory",
    title: "Inventario",
    description: "Controla lo que tienes en casa. BuddyMarket usará tu inventario para sugerir recetas con lo que ya tienes.",
    targetSelector: "[data-tour='nav-inventory']",
    position: "right",
    icon: "📦",
  },
  {
    id: "metrics",
    title: "Mis métricas",
    description: "Registra tu peso, medidas y progreso. Visualiza tu evolución con gráficas detalladas a lo largo del tiempo.",
    targetSelector: "[data-tour='nav-metrics']",
    position: "right",
    icon: "📈",
  },
  {
    id: "experts",
    title: "BuddyExperts",
    description: "Conecta con nutricionistas certificados que pueden crear planes personalizados y hacer seguimiento de tu progreso.",
    targetSelector: "[data-tour='nav-experts']",
    position: "right",
    icon: "👨‍⚕️",
  },
  {
    id: "subscription",
    title: "Plan Pro",
    description: "Desbloquea funciones avanzadas: menús ilimitados, análisis nutricional detallado, consultas con expertos y más.",
    targetSelector: "[data-tour='upgrade-cta']",
    position: "top",
    icon: "⭐",
  },
  {
    id: "finish",
    title: "¡Ya estás listo!",
    description: "Puedes volver a ver este tour en cualquier momento desde Configuración → Ayuda. ¡Empieza a cuidarte!",
    position: "center",
    icon: "🚀",
  },
];

const BUDDYEXPERT_TOUR: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido, BuddyExpert! 👨‍⚕️",
    description: "Te mostramos las herramientas profesionales que tienes disponibles para gestionar tus pacientes y hacer crecer tu práctica.",
    position: "center",
    icon: "👨‍⚕️",
  },
  {
    id: "patients",
    title: "Gestión de pacientes",
    description: "Añade y gestiona tus pacientes. Crea planes nutricionales personalizados, haz seguimiento de su progreso y comunícate con ellos.",
    targetSelector: "[data-tour='expert-patients']",
    position: "bottom",
    icon: "👥",
  },
  {
    id: "meal-planner",
    title: "Planificador de menús",
    description: "Crea menús semanales profesionales para tus pacientes con el planificador experto. Genera la lista de la compra automáticamente.",
    targetSelector: "[data-tour='expert-meal-planner']",
    position: "bottom",
    icon: "📋",
  },
  {
    id: "consultations",
    title: "Consultas y agenda",
    description: "Gestiona tus citas, realiza videoconsultas y mantén un historial completo de cada paciente.",
    targetSelector: "[data-tour='expert-consultations']",
    position: "bottom",
    icon: "📆",
  },
  {
    id: "earnings",
    title: "Ingresos y suscripciones",
    description: "Cobra por tus servicios a través de BuddyMarket. Conecta Stripe para recibir pagos y gestiona tus suscripciones.",
    targetSelector: "[data-tour='expert-earnings']",
    position: "bottom",
    icon: "💰",
  },
  {
    id: "profile-public",
    title: "Tu perfil público",
    description: "Los usuarios pueden encontrarte en el directorio de BuddyExperts. Completa tu perfil para aumentar tu visibilidad.",
    targetSelector: "[data-tour='expert-public-profile']",
    position: "bottom",
    icon: "🌟",
  },
  {
    id: "finish",
    title: "¡Todo listo para empezar!",
    description: "Completa tu perfil y empieza a aceptar pacientes. Puedes volver a ver este tour desde Configuración → Ayuda.",
    position: "center",
    icon: "🚀",
  },
];

const BUDDYMAKER_TOUR: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido, BuddyMaker! 👨‍🍳",
    description: "Descubre las herramientas para crear, publicar y monetizar tu contenido culinario en BuddyMarket.",
    position: "center",
    icon: "👨‍🍳",
  },
  {
    id: "recipes",
    title: "Crea tus recetas",
    description: "Publica recetas con fotos, vídeos, macros y pasos detallados. Importa directamente desde Instagram.",
    targetSelector: "[data-tour='maker-recipes']",
    position: "bottom",
    icon: "🍽️",
  },
  {
    id: "stats",
    title: "Estadísticas de contenido",
    description: "Analiza el rendimiento de tus recetas: visualizaciones, guardados, valoraciones y seguidores.",
    targetSelector: "[data-tour='maker-stats']",
    position: "bottom",
    icon: "📊",
  },
  {
    id: "monetization",
    title: "Monetización",
    description: "Gana dinero con tus recetas premium. Los usuarios Pro pueden acceder a tu contenido exclusivo.",
    targetSelector: "[data-tour='maker-monetization']",
    position: "bottom",
    icon: "💰",
  },
  {
    id: "finish",
    title: "¡Empieza a crear!",
    description: "Sube tu primera receta y empieza a construir tu comunidad. Puedes volver a este tour desde Configuración.",
    position: "center",
    icon: "🚀",
  },
];

const EMPRESA_TOUR: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a BuddyMarket Empresa! 🏢",
    description: "Gestiona el bienestar nutricional de tus empleados desde un panel centralizado.",
    position: "center",
    icon: "🏢",
  },
  {
    id: "licenses",
    title: "Gestión de licencias",
    description: "Asigna y gestiona licencias de BuddyMarket para tus empleados. Invítalos por email o código de empresa.",
    targetSelector: "[data-tour='corp-licenses']",
    position: "bottom",
    icon: "🔑",
  },
  {
    id: "analytics",
    title: "Analíticas de bienestar",
    description: "Visualiza estadísticas agregadas (anónimas) sobre el uso de la app y el bienestar general de tu equipo.",
    targetSelector: "[data-tour='corp-analytics']",
    position: "bottom",
    icon: "📊",
  },
  {
    id: "billing",
    title: "Facturación",
    description: "Gestiona tu suscripción corporativa, descarga facturas y ajusta el número de licencias.",
    targetSelector: "[data-tour='corp-billing']",
    position: "bottom",
    icon: "💳",
  },
  {
    id: "finish",
    title: "¡Todo configurado!",
    description: "Invita a tus empleados y empieza a mejorar el bienestar de tu equipo. Puedes volver a este tour desde Ayuda.",
    position: "center",
    icon: "🚀",
  },
];

const CLINICA_VET_TOUR: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido a BuddyMarket Veterinaria! 🐾",
    description: "Gestiona la nutrición de tus pacientes animales con herramientas especializadas.",
    position: "center",
    icon: "🐾",
  },
  {
    id: "patients",
    title: "Pacientes animales",
    description: "Registra mascotas, crea planes dietéticos veterinarios y haz seguimiento de su evolución.",
    targetSelector: "[data-tour='vet-patients']",
    position: "bottom",
    icon: "🐕",
  },
  {
    id: "diets",
    title: "Planes dietéticos",
    description: "Crea planes nutricionales adaptados a cada especie, raza, edad y condición médica.",
    targetSelector: "[data-tour='vet-diets']",
    position: "bottom",
    icon: "🥩",
  },
  {
    id: "finish",
    title: "¡Listo para empezar!",
    description: "Registra tu primer paciente y empieza a gestionar su nutrición. Puedes volver a este tour desde Ayuda.",
    position: "center",
    icon: "🚀",
  },
];

const COLABORADOR_TOUR: TourStep[] = [
  {
    id: "welcome",
    title: "¡Bienvenido, Colaborador! 🤝",
    description: "Como colaborador, tienes acceso completo a BuddyMarket y ganas el 20% de cada suscripción que generes.",
    position: "center",
    icon: "🤝",
  },
  {
    id: "referral",
    title: "Tu código de referido",
    description: "Comparte tu código único con tus contactos. Cada vez que alguien se suscriba con tu código, recibirás tu comisión.",
    targetSelector: "[data-tour='collab-referral']",
    position: "bottom",
    icon: "🔗",
  },
  {
    id: "earnings",
    title: "Tus comisiones",
    description: "Consulta tus comisiones acumuladas, historial de referidos y próximos pagos.",
    targetSelector: "[data-tour='collab-earnings']",
    position: "bottom",
    icon: "💰",
  },
  {
    id: "app",
    title: "Usa la app",
    description: "Como colaborador también tienes acceso completo a todas las funciones de usuario de BuddyMarket.",
    targetSelector: "[data-tour='dashboard-summary']",
    position: "bottom",
    icon: "📱",
  },
  {
    id: "finish",
    title: "¡Empieza a colaborar!",
    description: "Comparte tu código y empieza a ganar comisiones. Puedes volver a este tour desde Configuración.",
    position: "center",
    icon: "🚀",
  },
];

const TOURS: Record<string, TourStep[]> = {
  user: USER_TOUR,
  buddyexpert: BUDDYEXPERT_TOUR,
  buddymaker: BUDDYMAKER_TOUR,
  empresa: EMPRESA_TOUR,
  clinica_vet: CLINICA_VET_TOUR,
  colaborador: COLABORADOR_TOUR,
};

// ─── Tooltip position calculation ────────────────────────────────────────────

interface TooltipPosition {
  top: number;
  left: number;
  arrowDir: "up" | "down" | "left" | "right" | "none";
}

function calculateTooltipPosition(
  targetRect: DOMRect | null,
  preferredPosition: TourStep["position"],
  tooltipWidth = 320,
  tooltipHeight = 180
): TooltipPosition {
  if (!targetRect || preferredPosition === "center") {
    return {
      top: window.innerHeight / 2 - tooltipHeight / 2,
      left: window.innerWidth / 2 - tooltipWidth / 2,
      arrowDir: "none",
    };
  }

  const margin = 16;
  const arrowSize = 12;

  switch (preferredPosition) {
    case "bottom":
      return {
        top: targetRect.bottom + margin + arrowSize,
        left: Math.max(margin, Math.min(
          targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          window.innerWidth - tooltipWidth - margin
        )),
        arrowDir: "up",
      };
    case "top":
      return {
        top: targetRect.top - tooltipHeight - margin - arrowSize,
        left: Math.max(margin, Math.min(
          targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
          window.innerWidth - tooltipWidth - margin
        )),
        arrowDir: "down",
      };
    case "right":
      return {
        top: Math.max(margin, Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          window.innerHeight - tooltipHeight - margin
        )),
        left: targetRect.right + margin + arrowSize,
        arrowDir: "left",
      };
    case "left":
      return {
        top: Math.max(margin, Math.min(
          targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
          window.innerHeight - tooltipHeight - margin
        )),
        left: targetRect.left - tooltipWidth - margin - arrowSize,
        arrowDir: "right",
      };
    default:
      return {
        top: window.innerHeight / 2 - tooltipHeight / 2,
        left: window.innerWidth / 2 - tooltipWidth / 2,
        arrowDir: "none",
      };
  }
}

// ─── Spotlight overlay ────────────────────────────────────────────────────────

function SpotlightOverlay({ targetRect }: { targetRect: DOMRect | null }) {
  if (!targetRect) {
    return (
      <div className="fixed inset-0 bg-black/60 z-[9998]" />
    );
  }

  const padding = 8;
  const x = targetRect.left - padding;
  const y = targetRect.top - padding;
  const w = targetRect.width + padding * 2;
  const h = targetRect.height + padding * 2;
  const r = 12;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ width: "100vw", height: "100vh" }}
      >
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={x} y={y} width={w} height={h} rx={r} fill="black" />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.65)"
          mask="url(#spotlight-mask)"
        />
        {/* Highlight border */}
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={r}
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeDasharray="6 3"
        />
      </svg>
    </div>
  );
}

// ─── Tooltip card ─────────────────────────────────────────────────────────────

interface TooltipCardProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  position: TooltipPosition;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

function TooltipCard({ step, stepIndex, totalSteps, position, onNext, onPrev, onSkip }: TooltipCardProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  const arrowStyles: Record<string, React.CSSProperties> = {
    up: {
      position: "absolute",
      top: -10,
      left: "50%",
      transform: "translateX(-50%)",
      width: 0,
      height: 0,
      borderLeft: "10px solid transparent",
      borderRight: "10px solid transparent",
      borderBottom: "10px solid white",
    },
    down: {
      position: "absolute",
      bottom: -10,
      left: "50%",
      transform: "translateX(-50%)",
      width: 0,
      height: 0,
      borderLeft: "10px solid transparent",
      borderRight: "10px solid transparent",
      borderTop: "10px solid white",
    },
    left: {
      position: "absolute",
      left: -10,
      top: "50%",
      transform: "translateY(-50%)",
      width: 0,
      height: 0,
      borderTop: "10px solid transparent",
      borderBottom: "10px solid transparent",
      borderRight: "10px solid white",
    },
    right: {
      position: "absolute",
      right: -10,
      top: "50%",
      transform: "translateY(-50%)",
      width: 0,
      height: 0,
      borderTop: "10px solid transparent",
      borderBottom: "10px solid transparent",
      borderLeft: "10px solid white",
    },
    none: { display: "none" },
  };

  return (
    <div
      className="fixed z-[9999] w-80 rounded-2xl bg-white shadow-2xl border border-orange-100"
      style={{ top: position.top, left: position.left }}
    >
      {/* Arrow */}
      <div style={arrowStyles[position.arrowDir]} />

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {step.icon && <span className="text-2xl">{step.icon}</span>}
            <h3 className="font-extrabold text-foreground text-sm leading-tight">{step.title}</h3>
          </div>
          <button
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground text-xs ml-2 shrink-0"
          >
            Saltar
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>

        {/* Progress dots */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIndex ? "w-4 bg-orange-500" : "w-1.5 bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={onPrev}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                ←
              </button>
            )}
            <button
              onClick={onNext}
              className="flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
            >
              {isLast ? "¡Listo! 🎉" : "Siguiente →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main OnboardingTourGuide component ──────────────────────────────────────

interface OnboardingTourGuideProps {
  profileType: string;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function OnboardingTourGuide({ profileType, onComplete, onSkip }: OnboardingTourGuideProps) {
  const steps = TOURS[profileType] ?? USER_TOUR;
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const utils = trpc.useUtils();
  const completeTour = trpc.profileSetup.completeTour.useMutation();

  const step = steps[currentStep];

  // Find and scroll to target element
  const updateTargetRect = useCallback(() => {
    if (!step.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.targetSelector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      }, 400);
    } else {
      setTargetRect(null);
    }
  }, [step.targetSelector]);

  useEffect(() => {
    updateTargetRect();
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [updateTargetRect]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    try {
      await completeTour.mutateAsync();
      await utils.auth.me.invalidate();
    } catch {
      // Ignore errors, still complete tour
    }
    onComplete?.();
  };

  const handleSkip = async () => {
    try {
      await completeTour.mutateAsync();
      await utils.auth.me.invalidate();
    } catch {
      // Ignore
    }
    onSkip?.();
  };

  const tooltipPosition = calculateTooltipPosition(targetRect, step.position);

  return createPortal(
    <>
      <SpotlightOverlay targetRect={targetRect} />
      <TooltipCard
        step={step}
        stepIndex={currentStep}
        totalSteps={steps.length}
        position={tooltipPosition}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
      />
    </>,
    document.body
  );
}

// ─── Tour trigger button (for re-launching from Settings) ────────────────────

interface TourTriggerButtonProps {
  profileType: string;
  className?: string;
}

export function TourTriggerButton({ profileType, className }: TourTriggerButtonProps) {
  const [active, setActive] = useState(false);

  if (active) {
    return (
      <OnboardingTourGuide
        profileType={profileType}
        onComplete={() => setActive(false)}
        onSkip={() => setActive(false)}
      />
    );
  }

  return (
    <button
      onClick={() => setActive(true)}
      className={className ?? "flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"}
    >
      <span>🗺️</span>
      Ver tour de la app
    </button>
  );
}
