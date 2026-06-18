/**
 * ProfileTypeSelection — Post-login profile type selection page
 *
 * Flow:
 *  1. User logs in → redirected here if registrationStep === "account_type"
 *  2. Selects profile type → backend updates registrationStep
 *  3. "user" → goes to BuddySetup (existing nutritional onboarding)
 *  4. "empresa" / "clinica_vet" → goes to OrgProfileForm
 *  5. "buddyexpert" / "buddymaker" / "colaborador" → goes to ApplicationForm
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

// ─── Profile type definitions ─────────────────────────────────────────────────

type ProfileType = "user" | "buddyexpert" | "buddymaker" | "empresa" | "clinica_vet" | "colaborador";

interface ProfileCard {
  id: ProfileType;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  gradient: string;
  borderColor: string;
  selectedBg: string;
  requiresApproval?: boolean;
}

const PROFILE_CARDS: ProfileCard[] = [
  {
    id: "user",
    emoji: "🥗",
    title: "Usuario",
    subtitle: "Quiero mejorar mi alimentación",
    description: "Accede a recetas personalizadas, planes nutricionales, seguimiento de objetivos y mucho más.",
    gradient: "from-green-50 to-emerald-50",
    borderColor: "border-green-200",
    selectedBg: "bg-green-50",
  },
  {
    id: "buddyexpert",
    emoji: "👨‍⚕️",
    title: "BuddyExpert",
    subtitle: "Soy nutricionista o dietista",
    description: "Gestiona pacientes, crea planes nutricionales profesionales y genera ingresos con tus servicios.",
    badge: "Requiere aprobación",
    badgeColor: "bg-amber-100 text-amber-700",
    gradient: "from-blue-50 to-indigo-50",
    borderColor: "border-blue-200",
    selectedBg: "bg-blue-50",
    requiresApproval: true,
  },
  {
    id: "buddymaker",
    emoji: "👨‍🍳",
    title: "BuddyMaker",
    subtitle: "Soy creador de contenido culinario",
    description: "Publica recetas, construye tu audiencia y monetiza tu contenido gastronómico.",
    badge: "Requiere aprobación",
    badgeColor: "bg-amber-100 text-amber-700",
    gradient: "from-orange-50 to-amber-50",
    borderColor: "border-orange-200",
    selectedBg: "bg-orange-50",
    requiresApproval: true,
  },
  {
    id: "empresa",
    emoji: "🏢",
    title: "Empresa",
    subtitle: "Quiero ofrecer bienestar a mis empleados",
    description: "Proporciona licencias de BuddyMarket a tus empleados como beneficio de empresa.",
    gradient: "from-purple-50 to-violet-50",
    borderColor: "border-purple-200",
    selectedBg: "bg-purple-50",
  },
  {
    id: "clinica_vet",
    emoji: "🐾",
    title: "Clínica Veterinaria",
    subtitle: "Ofrezco servicios de nutrición animal",
    description: "Gestiona la nutrición de mascotas, crea planes dietéticos veterinarios y conecta con dueños.",
    gradient: "from-teal-50 to-cyan-50",
    borderColor: "border-teal-200",
    selectedBg: "bg-teal-50",
  },
  {
    id: "colaborador",
    emoji: "🤝",
    title: "Colaborador",
    subtitle: "Quiero colaborar con BuddyMarket",
    description: "Accede a la plataforma y recibe una comisión del 20% por cada suscripción que generes.",
    badge: "Requiere aprobación",
    badgeColor: "bg-amber-100 text-amber-700",
    gradient: "from-rose-50 to-pink-50",
    borderColor: "border-rose-200",
    selectedBg: "bg-rose-50",
    requiresApproval: true,
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

export default function ProfileTypeSelection() {
  const [, setLocation] = useLocation();
  const [selected, setSelected] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(false);

  const utils = trpc.useUtils();
  const selectProfileType = trpc.profileSetup.selectProfileType.useMutation();

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const result = await selectProfileType.mutateAsync({ profileType: selected });
      await utils.auth.me.invalidate();

      if (result.status === "profile_setup") {
        // Regular user → go to nutritional onboarding
        setLocation("/buddy-setup");
      } else if (result.status === "org_form") {
        // Empresa / Clínica → go to org profile form
        setLocation(`/profile-setup/org?type=${selected}`);
      } else if (result.status === "application") {
        // Expert / Maker / Colaborador → go to application form
        setLocation(`/profile-setup/apply?type=${selected}`);
      }
    } catch {
      toast.error("Error al seleccionar el perfil. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf8f3] to-[#fff5ec] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-12 pb-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black text-orange-500">Buddy</span>
          <span className="text-2xl font-black text-foreground">Market</span>
        </div>
        <button
          onClick={() => setLocation("/app/dashboard")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Omitir por ahora
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-10 max-w-2xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-foreground mb-2">
            ¿Cómo quieres usar BuddyMarket?
          </h1>
          <p className="text-muted-foreground text-base">
            Elige el perfil que mejor describe tu rol. Podrás cambiarlo más adelante desde tu cuenta.
          </p>
        </div>

        {/* Profile cards grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-8">
          {PROFILE_CARDS.map((card) => (
            <button
              key={card.id}
              onClick={() => setSelected(card.id)}
              className={`
                relative flex flex-col items-start gap-2 rounded-2xl border-2 p-5 text-left transition-all duration-200
                bg-gradient-to-br ${card.gradient}
                ${selected === card.id
                  ? `${card.borderColor} shadow-md scale-[1.02] ring-2 ring-offset-1 ring-orange-400`
                  : "border-border/40 hover:border-border hover:shadow-sm"
                }
              `}
            >
              {/* Badge */}
              {card.badge && (
                <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                  {card.badge}
                </span>
              )}

              {/* Check mark */}
              {selected === card.id && (
                <span className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold shadow-sm">
                  ✓
                </span>
              )}

              <span className="text-3xl">{card.emoji}</span>
              <div>
                <p className="font-bold text-foreground text-base leading-tight">{card.title}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">{card.subtitle}</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            </button>
          ))}
        </div>

        {/* Info box for approval-required profiles */}
        {selected && PROFILE_CARDS.find(c => c.id === selected)?.requiresApproval && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
            <span className="text-xl shrink-0">⏳</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Este perfil requiere aprobación</p>
              <p className="text-xs text-amber-700 mt-1">
                Revisaremos tu solicitud en un plazo de 24-48 horas. Mientras tanto, podrás usar la app como usuario normal.
              </p>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg shadow-orange-200 disabled:opacity-40 transition-all active:scale-95 hover:bg-orange-600"
        >
          {loading ? "Configurando tu perfil…" : selected ? `Continuar como ${PROFILE_CARDS.find(c => c.id === selected)?.title} →` : "Selecciona un perfil para continuar"}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Podrás cambiar o actualizar tu perfil en cualquier momento desde Configuración.
        </p>
      </div>
    </div>
  );
}
