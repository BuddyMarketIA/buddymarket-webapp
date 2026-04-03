import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Assets ───────────────────────────────────────────────────────────────────

const LOGO_COLOR = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddymarket-logo-color_856f2d67.jpg";
const LOGO_ICON  = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/D0328B43-26CA-43D5-A762-51F7E0C1B4E2_44b3ba71.png";

const FOOD_IMAGES = [
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/salmon_quinoa-GK5uCABZM54kHC6jSfHP9p.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/bowl_acai_frutas-VPHcDyWLiwTWng4EtSyWaN.webp",
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = "user" | "buddymaker" | "buddyexpert" | "business";
type RegistrationStep = "account_type" | "profile_setup" | "application" | "pending_approval" | "completed";

// ─── Left panel data per main step ───────────────────────────────────────────

const PANEL_DATA: Record<string, { img: string; headline: string; sub: string; bullets: string[] }> = {
  account_type: {
    img: FOOD_IMAGES[0],
    headline: "Tu nutrición, inteligente y personalizada",
    sub: "Únete a miles de personas que ya cuidan su alimentación con BuddyMarket",
    bullets: ["🥗 Recetas y menús personalizados", "🛒 Compra en Mercadona y Carrefour", "🤖 BuddyIA, tu asistente nutricional", "📊 Seguimiento diario de nutrición"],
  },
  profile_setup: {
    img: FOOD_IMAGES[1],
    headline: "Cuanto más nos cuentes, mejor te ayudamos",
    sub: "Personalizamos cada receta y menú según tus objetivos y necesidades",
    bullets: ["🎯 Objetivos adaptados a ti", "⚠️ Alergias e intolerancias controladas", "🏃 Nivel de actividad en cuenta", "📏 Calorías calculadas automáticamente"],
  },
  application: {
    img: FOOD_IMAGES[2],
    headline: "Forma parte de nuestra comunidad de creadores",
    sub: "BuddyMakers y BuddyExperts que comparten su pasión por la nutrición",
    bullets: ["👥 +5.000 usuarios activos", "🌟 Perfil verificado y destacado", "💰 Monetización futura", "📈 Estadísticas de tu contenido"],
  },
  pending_approval: {
    img: FOOD_IMAGES[3],
    headline: "¡Ya casi estás dentro!",
    sub: "Mientras revisamos tu solicitud, puedes explorar todo lo que BuddyMarket tiene para ti",
    bullets: ["🍽️ Miles de recetas disponibles", "📅 Planifica tu menú semanal", "💬 Pregunta a BuddyIA", "🛒 Gestiona tu despensa"],
  },
};

// ─── Account type cards ───────────────────────────────────────────────────────

const ACCOUNT_TYPES = [
  {
    id: "user" as AccountType,
    emoji: "🥗",
    title: "Usuario",
    subtitle: "Quiero mejorar mi alimentación",
    description: "Accede a recetas, planifica menús, controla tu nutrición y haz la compra inteligente.",
    color: "#10B981",
    gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    features: ["Diario nutricional", "Recetas personalizadas", "Menús semanales", "Lista de la compra"],
    badge: "Gratis",
    badgeColor: "#10B981",
  },
  {
    id: "buddymaker" as AccountType,
    emoji: "👨‍🍳",
    title: "BuddyMaker",
    subtitle: "Soy creador de contenido nutricional",
    description: "Comparte tus recetas y menús con la comunidad. Monetiza tu conocimiento culinario.",
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    features: ["Publica recetas y menús", "Perfil verificado", "Estadísticas", "Monetización futura"],
    badge: "Requiere aprobación",
    badgeColor: "#F97316",
  },
  {
    id: "buddyexpert" as AccountType,
    emoji: "🎓",
    title: "BuddyExpert",
    subtitle: "Soy nutricionista o profesional",
    description: "Ofrece planes de nutrición personalizados y asesoramiento profesional.",
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    features: ["Perfil profesional", "Planes de nutrición", "Consultas con clientes", "Badge de experto"],
    badge: "Requiere aprobación",
    badgeColor: "#8B5CF6",
  },
  {
    id: "business" as AccountType,
    emoji: "🏢",
    title: "Empresa",
    subtitle: "Somos una empresa alimentaria",
    description: "Conecta tu marca con miles de usuarios interesados en nutrición.",
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    features: ["Perfil de empresa", "Publicación de productos", "Analytics avanzado", "Integración catálogo"],
    badge: "Próximamente",
    badgeColor: "#6B7280",
    disabled: true,
  },
];

const EXPERT_CATEGORIES = [
  { value: "dieta_equilibrada", label: "Dieta Equilibrada" },
  { value: "perdida_peso", label: "Pérdida de Peso" },
  { value: "ganancia_muscular", label: "Ganancia Muscular" },
  { value: "deporte_rendimiento", label: "Deporte y Rendimiento" },
  { value: "nutricion_clinica", label: "Nutrición Clínica" },
  { value: "nutricion_infantil", label: "Nutrición Infantil" },
  { value: "nutricion_deportiva", label: "Nutrición Deportiva" },
  { value: "dietas_especiales", label: "Dietas Especiales (vegana, celiaca...)" },
  { value: "psiconutricion", label: "Psiconutrición" },
  { value: "nutricion_oncologica", label: "Nutrición Oncológica" },
];

const MAKER_SPECIALTIES = [
  "Cocina mediterránea", "Cocina vegana/vegetariana", "Repostería saludable",
  "Meal prep y batch cooking", "Cocina fitness y deportiva", "Cocina internacional",
  "Cocina sin gluten", "Cocina para niños", "Cocina rápida y fácil", "Fermentados y probióticos",
];

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel({ step, accountType }: { step: RegistrationStep; accountType: AccountType }) {
  const key = step === "account_type" ? "account_type"
    : step === "profile_setup" ? "profile_setup"
    : step === "application" ? "application"
    : "pending_approval";
  const data = PANEL_DATA[key];
  const accentColor = accountType === "buddymaker" ? "#F97316"
    : accountType === "buddyexpert" ? "#8B5CF6"
    : accountType === "business" ? "#3B82F6"
    : "#10B981";

  return (
    <div style={{
      position: "relative", overflow: "hidden",
      background: "#1a1a1a", height: "100%", minHeight: "100vh",
    }}>
      {/* Background image */}
      <img src={data.img} alt="" style={{
        position: "absolute", inset: 0, width: "100%", height: "100%",
        objectFit: "cover", opacity: 0.45,
        transition: "opacity 0.6s ease",
      }} />

      {/* Gradient overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(160deg, ${accentColor}99 0%, rgba(0,0,0,0.75) 60%, rgba(0,0,0,0.9) 100%)`,
        transition: "background 0.6s ease",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", flexDirection: "column", height: "100%",
        padding: "40px 40px 48px",
        justifyContent: "space-between",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO_ICON} alt="BuddyMarket" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <img src={LOGO_COLOR} alt="BuddyMarket" style={{ height: 28, filter: "brightness(0) invert(1)" }} />
        </div>

        {/* Main copy */}
        <div>
          <h2 style={{
            fontSize: 32, fontWeight: 900, color: "white",
            margin: "0 0 12px", lineHeight: 1.2, letterSpacing: "-0.03em",
          }}>
            {data.headline}
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", margin: "0 0 32px", lineHeight: 1.6 }}>
            {data.sub}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {data.bullets.map((b, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "rgba(255,255,255,0.1)", borderRadius: 12,
                padding: "12px 16px", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}>
                <span style={{ fontSize: 20 }}>{b.split(" ")[0]}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
                  {b.split(" ").slice(1).join(" ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {["🔒 Datos seguros", "🇪🇸 Hecho en España", "⭐ 4.9/5 valoración"].map((b, i) => (
            <div key={i} style={{
              fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.1)", borderRadius: 20,
              padding: "6px 14px", border: "1px solid rgba(255,255,255,0.15)",
            }}>
              {b}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressSteps({ steps, current }: { steps: { id: string; label: string }[]; current: string }) {
  const idx = steps.findIndex(s => s.id === current);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
      {steps.map((s, i) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: i < idx ? "#10B981" : i === idx ? "#F97316" : "#E5E7EB",
              color: i <= idx ? "white" : "#9CA3AF",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 800,
              boxShadow: i === idx ? "0 0 0 4px rgba(249,115,22,0.2)" : "none",
              transition: "all 0.3s ease",
            }}>
              {i < idx ? "✓" : i + 1}
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
              color: i === idx ? "#F97316" : i < idx ? "#10B981" : "#9CA3AF",
            }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 8px", marginBottom: 18,
              background: i < idx ? "#10B981" : "#E5E7EB",
              transition: "background 0.3s ease",
            }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step: Account Type ───────────────────────────────────────────────────────

function StepAccountType({ onSelect }: { onSelect: (type: AccountType) => void }) {
  const [selected, setSelected] = useState<AccountType | null>(null);
  const setAccountType = trpc.profile.setAccountType.useMutation();

  const handleContinue = async () => {
    if (!selected) return;
    try {
      await setAccountType.mutateAsync({ accountType: selected });
      onSelect(selected);
    } catch {
      toast.error("Error al guardar el tipo de cuenta");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
          ¿Cómo quieres usar BuddyMarket?
        </h2>
        <p style={{ fontSize: 15, color: "#6B7280", margin: 0 }}>
          Elige el tipo de cuenta que mejor se adapta a ti. Podrás cambiarla más adelante.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
        {ACCOUNT_TYPES.map((type) => (
          <button
            key={type.id}
            disabled={type.disabled}
            onClick={() => !type.disabled && setSelected(type.id)}
            style={{
              background: selected === type.id ? type.gradient : "white",
              border: selected === type.id ? "none" : "2px solid #E5E7EB",
              borderRadius: 18, padding: "20px 16px",
              cursor: type.disabled ? "not-allowed" : "pointer",
              textAlign: "left", transition: "all 0.2s ease",
              opacity: type.disabled ? 0.5 : 1,
              boxShadow: selected === type.id ? `0 8px 28px ${type.color}40` : "0 2px 6px rgba(0,0,0,0.04)",
              transform: selected === type.id ? "translateY(-2px)" : "none",
              position: "relative", overflow: "hidden",
            }}
          >
            {/* Badge */}
            <div style={{
              position: "absolute", top: 10, right: 10,
              background: selected === type.id ? "rgba(255,255,255,0.22)" : `${type.badgeColor}15`,
              color: selected === type.id ? "white" : type.badgeColor,
              fontSize: 10, fontWeight: 700, borderRadius: 20, padding: "3px 8px",
            }}>
              {type.badge}
            </div>

            <div style={{ fontSize: 32, marginBottom: 10 }}>{type.emoji}</div>
            <h3 style={{
              fontSize: 16, fontWeight: 900, margin: "0 0 3px",
              color: selected === type.id ? "white" : "#1a1a1a",
            }}>
              {type.title}
            </h3>
            <p style={{
              fontSize: 12, fontWeight: 600, margin: "0 0 8px",
              color: selected === type.id ? "rgba(255,255,255,0.85)" : type.color,
            }}>
              {type.subtitle}
            </p>
            <p style={{
              fontSize: 12, margin: "0 0 12px", lineHeight: 1.5,
              color: selected === type.id ? "rgba(255,255,255,0.75)" : "#6B7280",
            }}>
              {type.description}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {type.features.map((f) => (
                <li key={f} style={{
                  fontSize: 12, fontWeight: 600, padding: "2px 0",
                  color: selected === type.id ? "rgba(255,255,255,0.9)" : "#374151",
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{ color: selected === type.id ? "rgba(255,255,255,0.7)" : type.color }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!selected || setAccountType.isPending}
        style={{
          ...btnPrimary,
          width: "100%",
          opacity: !selected || setAccountType.isPending ? 0.5 : 1,
          cursor: !selected || setAccountType.isPending ? "not-allowed" : "pointer",
        }}
      >
        {setAccountType.isPending ? "Guardando..." : "Continuar →"}
      </button>
    </div>
  );
}

// ─── Step: Profile Setup ──────────────────────────────────────────────────────

function StepProfileSetup({ accountType, onNext }: { accountType: AccountType; onNext: () => void }) {
  const [subStep, setSubStep] = useState(0);
  const [form, setForm] = useState({
    name: "", gender: "", birthYear: "", height: "", weight: "", mainGoal: "",
    activityLevel: "", allergies: [] as number[], dietRestrictions: [] as number[],
    acceptTerms: false, newsletter: false,
  });

  const { data: catalogData } = trpc.catalogs.allergies.useQuery();
  const { data: restrictionsData } = trpc.catalogs.dietRestrictions.useQuery();
  const updateBasic = trpc.profile.updateBasic.useMutation();
  const updateProfile = trpc.profile.updateProfile.useMutation();
  const setAllergies = trpc.profile.setAllergies.useMutation();
  const setDietRestrictions = trpc.profile.setDietRestrictions.useMutation();
  const updatePreferences = trpc.profile.updatePreferences.useMutation();
  const advanceStep = trpc.profile.advanceRegistrationStep.useMutation();

  const totalSubSteps = 4;
  const isLoading = updateBasic.isPending || updateProfile.isPending || advanceStep.isPending;

  const SUB_STEPS = [
    { icon: "👤", title: "Datos personales", desc: "Cuéntanos un poco sobre ti" },
    { icon: "🎯", title: "Tu objetivo", desc: "¿Qué quieres conseguir con BuddyMarket?" },
    { icon: "⚠️", title: "Alergias y dieta", desc: "Para personalizar tus recetas" },
    { icon: "✅", title: "Últimos detalles", desc: "Casi listo, solo un momento más" },
  ];

  const handleNext = async () => {
    if (subStep < totalSubSteps - 1) {
      setSubStep(s => s + 1);
      return;
    }
    try {
      if (form.name) await updateBasic.mutateAsync({ name: form.name });
      await updateProfile.mutateAsync({
        gender: form.gender as any,
        birthYear: form.birthYear ? parseInt(form.birthYear) : undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        mainGoal: form.mainGoal as any,
        activityLevel: form.activityLevel as any,
      });
      if (form.allergies.length > 0) await setAllergies.mutateAsync({ allergyIds: form.allergies });
      if (form.dietRestrictions.length > 0) await setDietRestrictions.mutateAsync({ restrictionIds: form.dietRestrictions });
      await updatePreferences.mutateAsync({ acceptTerms: form.acceptTerms, newsletter: form.newsletter });
      const nextStep = (accountType === "buddymaker" || accountType === "buddyexpert") ? "application" : "completed";
      await advanceStep.mutateAsync({ step: nextStep as any });
      onNext();
    } catch {
      toast.error("Error al guardar el perfil");
    }
  };

  const canProceed = subStep === 3 ? form.acceptTerms : true;

  return (
    <div>
      {/* Sub-step tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, overflowX: "auto", paddingBottom: 4 }}>
        {SUB_STEPS.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", borderRadius: 12, whiteSpace: "nowrap",
            background: i === subStep ? "#FFF7ED" : i < subStep ? "#F0FDF4" : "#F9FAFB",
            border: `2px solid ${i === subStep ? "#F97316" : i < subStep ? "#10B981" : "#E5E7EB"}`,
            cursor: i < subStep ? "pointer" : "default",
            transition: "all 0.2s ease",
          }}
          onClick={() => i < subStep && setSubStep(i)}
          >
            <span style={{ fontSize: 16 }}>{i < subStep ? "✓" : s.icon}</span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: i === subStep ? "#F97316" : i < subStep ? "#10B981" : "#9CA3AF",
            }}>
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {/* Sub-step header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "#FFF7ED", borderRadius: 20, padding: "6px 14px",
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 18 }}>{SUB_STEPS[subStep].icon}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#F97316" }}>
            Paso {subStep + 1} de {totalSubSteps}
          </span>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
          {SUB_STEPS[subStep].title}
        </h3>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>{SUB_STEPS[subStep].desc}</p>
      </div>

      {/* Sub-step 0: Personal data */}
      {subStep === 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={labelStyle}>Nombre completo</label>
            <input style={inputStyle} placeholder="Tu nombre" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Género</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ v: "male", l: "♂ Hombre" }, { v: "female", l: "♀ Mujer" }, { v: "other", l: "⚧ Otro" }].map(g => (
                <button key={g.v} onClick={() => setForm(f => ({ ...f, gender: g.v }))}
                  style={{ ...chipStyle, ...(form.gender === g.v ? chipActiveStyle : {}) }}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Año de nacimiento</label>
              <input style={inputStyle} type="number" placeholder="1990" value={form.birthYear}
                onChange={e => setForm(f => ({ ...f, birthYear: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Altura (cm)</label>
              <input style={inputStyle} type="number" placeholder="170" value={form.height}
                onChange={e => setForm(f => ({ ...f, height: e.target.value }))} />
            </div>
            <div>
              <label style={labelStyle}>Peso (kg)</label>
              <input style={inputStyle} type="number" placeholder="70" value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
          </div>
        </div>
      )}

      {/* Sub-step 1: Goals */}
      {subStep === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>Objetivo principal</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { v: "lose_weight", l: "⬇️ Perder peso", d: "Déficit calórico controlado" },
                { v: "gain_muscle", l: "💪 Ganar músculo", d: "Superávit con proteínas" },
                { v: "maintain", l: "⚖️ Mantenerme", d: "Equilibrio nutricional" },
                { v: "improve_health", l: "❤️ Mejorar salud", d: "Hábitos saludables" },
                { v: "eat_healthier", l: "🥗 Comer mejor", d: "Más variedad y nutrición" },
              ].map(g => (
                <button key={g.v} onClick={() => setForm(f => ({ ...f, mainGoal: g.v }))}
                  style={{
                    ...chipStyle, ...(form.mainGoal === g.v ? chipActiveStyle : {}),
                    padding: "14px 16px", borderRadius: 14, textAlign: "left",
                  }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{g.l}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{g.d}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Nivel de actividad física</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { v: "sedentary", l: "🪑 Sedentario", d: "Trabajo de oficina, poco ejercicio" },
                { v: "light", l: "🚶 Ligero", d: "Ejercicio 1-2 veces/semana" },
                { v: "moderate", l: "🏃 Moderado", d: "Ejercicio 3-4 veces/semana" },
                { v: "active", l: "⚡ Activo", d: "Ejercicio 5+ veces/semana" },
                { v: "very_active", l: "🔥 Muy activo", d: "Atleta o trabajo físico intenso" },
              ].map(g => (
                <button key={g.v} onClick={() => setForm(f => ({ ...f, activityLevel: g.v }))}
                  style={{
                    ...chipStyle, ...(form.activityLevel === g.v ? chipActiveStyle : {}),
                    padding: "12px 16px", borderRadius: 14, textAlign: "left",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                  <span style={{ fontWeight: 700 }}>{g.l}</span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>{g.d}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-step 2: Allergies & Diet */}
      {subStep === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>Alergias e intolerancias</label>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 12px" }}>
              Selecciona todas las que apliquen (opcional)
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 180, overflowY: "auto" }}>
              {(catalogData ?? []).map((a: any) => (
                <button key={a.id}
                  onClick={() => setForm(f => ({
                    ...f,
                    allergies: f.allergies.includes(a.id)
                      ? f.allergies.filter(id => id !== a.id)
                      : [...f.allergies, a.id],
                  }))}
                  style={{ ...chipStyle, ...(form.allergies.includes(a.id) ? chipActiveStyle : {}), fontSize: 13, padding: "8px 14px" }}>
                  {a.nameEs}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Restricciones dietéticas</label>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 12px" }}>
              Selecciona todas las que apliquen (opcional)
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 180, overflowY: "auto" }}>
              {(restrictionsData ?? []).map((r: any) => (
                <button key={r.id}
                  onClick={() => setForm(f => ({
                    ...f,
                    dietRestrictions: f.dietRestrictions.includes(r.id)
                      ? f.dietRestrictions.filter(id => id !== r.id)
                      : [...f.dietRestrictions, r.id],
                  }))}
                  style={{ ...chipStyle, ...(form.dietRestrictions.includes(r.id) ? chipActiveStyle : {}), fontSize: 13, padding: "8px 14px" }}>
                  {r.nameEs}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-step 3: Terms & Newsletter */}
      {subStep === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Summary card */}
          <div style={{
            background: "linear-gradient(135deg, #FFF7ED 0%, #FFFBF5 100%)",
            borderRadius: 16, padding: 20, border: "1px solid #FED7AA",
          }}>
            <h4 style={{ fontSize: 15, fontWeight: 800, color: "#92400E", margin: "0 0 12px" }}>
              🎉 ¡Tu perfil está casi listo!
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { l: "Nombre", v: form.name || "—" },
                { l: "Género", v: form.gender === "male" ? "Hombre" : form.gender === "female" ? "Mujer" : form.gender || "—" },
                { l: "Objetivo", v: form.mainGoal?.replace("_", " ") || "—" },
                { l: "Actividad", v: form.activityLevel || "—" },
                { l: "Alergias", v: form.allergies.length > 0 ? `${form.allergies.length} seleccionadas` : "Ninguna" },
                { l: "Dieta", v: form.dietRestrictions.length > 0 ? `${form.dietRestrictions.length} restricciones` : "Sin restricciones" },
              ].map(item => (
                <div key={item.l} style={{ fontSize: 13 }}>
                  <span style={{ color: "#9CA3AF", fontWeight: 600 }}>{item.l}: </span>
                  <span style={{ color: "#374151", fontWeight: 700 }}>{item.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Terms */}
          <div style={{ background: "#FFFBF5", borderRadius: 16, padding: 18, border: "1px solid #FED7AA" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={form.acceptTerms}
                onChange={e => setForm(f => ({ ...f, acceptTerms: e.target.checked }))}
                style={{ marginTop: 2, width: 18, height: 18, accentColor: "#F97316" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#92400E", lineHeight: 1.5 }}>
                Acepto los <a href="/legal/terminos" target="_blank" style={{ color: "#F97316" }}>términos y condiciones</a> y la <a href="/legal/privacidad" target="_blank" style={{ color: "#F97316" }}>política de privacidad</a>. El contenido nutricional es orientativo y no sustituye el consejo médico. *
              </span>
            </label>
          </div>

          {/* Newsletter */}
          <div style={{ background: "#F0FDF4", borderRadius: 16, padding: 18, border: "1px solid #BBF7D0" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={form.newsletter}
                onChange={e => setForm(f => ({ ...f, newsletter: e.target.checked }))}
                style={{ marginTop: 2, width: 18, height: 18, accentColor: "#10B981" }} />
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#166534", display: "block" }}>
                  📧 Quiero recibir el newsletter semanal
                </span>
                <span style={{ fontSize: 13, color: "#166534", opacity: 0.8 }}>
                  Recetas, consejos nutricionales y novedades de BuddyMarket
                </span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        {subStep > 0 && (
          <button onClick={() => setSubStep(s => s - 1)} style={{ ...btnSecondary, flex: "0 0 auto" }}>
            ← Atrás
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          style={{
            ...btnPrimary, flex: 1,
            opacity: !canProceed || isLoading ? 0.5 : 1,
            cursor: !canProceed || isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Guardando..." : subStep < totalSubSteps - 1 ? "Siguiente →" : "¡Completar perfil! 🎉"}
        </button>
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 12 }}>
        Todos los campos son opcionales excepto los marcados con *
      </p>
    </div>
  );
}

// ─── Step: Application ────────────────────────────────────────────────────────

function StepApplication({ accountType, onNext }: { accountType: AccountType; onNext: () => void }) {
  const [form, setForm] = useState({
    displayName: "", bio: "", expertCategory: "", specialty: "",
    certifications: "", experience: "", motivation: "",
    instagramHandle: "", youtubeHandle: "", tiktokHandle: "", websiteUrl: "",
  });
  const submitApp = trpc.buddyApplications.submitApplication.useMutation();
  const isMaker = accountType === "buddymaker";
  const isExpert = accountType === "buddyexpert";

  const handleSubmit = async () => {
    if (!form.displayName || !form.motivation) {
      toast.error("Rellena los campos obligatorios");
      return;
    }
    try {
      await submitApp.mutateAsync({
        type: accountType === "buddymaker" ? "maker" : "expert",
        displayName: form.displayName,
        bio: form.bio,
        expertCategory: form.expertCategory || undefined,
        specialty: form.specialty || undefined,
        certifications: form.certifications || undefined,
        experience: form.experience || undefined,
        motivation: form.motivation,
        instagramHandle: form.instagramHandle || undefined,
        youtubeHandle: form.youtubeHandle || undefined,
        tiktokHandle: form.tiktokHandle || undefined,
        websiteUrl: form.websiteUrl || undefined,
      });
      onNext();
    } catch {
      toast.error("Error al enviar la solicitud");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: isMaker ? "#FFF7ED" : "#F5F3FF", borderRadius: 20,
          padding: "6px 14px", marginBottom: 10,
        }}>
          <span style={{ fontSize: 18 }}>{isMaker ? "👨‍🍳" : "🎓"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: isMaker ? "#F97316" : "#8B5CF6" }}>
            Solicitud de {isMaker ? "BuddyMaker" : "BuddyExpert"}
          </span>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          Cuéntanos sobre ti
        </h3>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
          {isMaker
            ? "Cuéntanos sobre tu experiencia culinaria y por qué quieres compartir tus recetas."
            : "Comparte tu formación y experiencia para que podamos verificar tu perfil."}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Nombre de perfil público *</label>
          <input style={inputStyle} placeholder={isMaker ? "Chef María García" : "Dra. Ana López, Nutricionista"}
            value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Descripción / Bio</label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            placeholder={isMaker ? "Tu estilo culinario, experiencia y qué tipo de contenido crearás..." : "Tu formación, especialización y enfoque profesional..."}
            value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
        </div>
        {isExpert && (
          <div>
            <label style={labelStyle}>Categoría de especialización</label>
            <select style={inputStyle} value={form.expertCategory}
              onChange={e => setForm(f => ({ ...f, expertCategory: e.target.value }))}>
              <option value="">Selecciona una categoría</option>
              {EXPERT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        )}
        {isMaker && (
          <div>
            <label style={labelStyle}>Especialidad culinaria</label>
            <select style={inputStyle} value={form.specialty}
              onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}>
              <option value="">Selecciona tu especialidad</option>
              {MAKER_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}
        {isExpert && (
          <div>
            <label style={labelStyle}>Certificaciones y titulaciones</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              placeholder="Grado en Nutrición Humana y Dietética, Universidad de Barcelona (2018)..."
              value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} />
          </div>
        )}
        <div>
          <label style={labelStyle}>¿Por qué quieres ser {isMaker ? "BuddyMaker" : "BuddyExpert"}? *</label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            placeholder="Tu motivación y qué aportarás a la comunidad de BuddyMarket..."
            value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))} />
        </div>
        <div>
          <label style={labelStyle}>Redes sociales (opcional)</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { icon: "📸", placeholder: "@tuinstagram", field: "instagramHandle" },
              ...(isMaker ? [
                { icon: "▶️", placeholder: "@tuyoutube", field: "youtubeHandle" },
                { icon: "🎵", placeholder: "@tutiktok", field: "tiktokHandle" },
              ] : []),
              { icon: "🌐", placeholder: "https://tuweb.com", field: "websiteUrl" },
            ].map(({ icon, placeholder, field }) => (
              <div key={field} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, width: 28 }}>{icon}</span>
                <input style={{ ...inputStyle, flex: 1 }} placeholder={placeholder}
                  value={(form as any)[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitApp.isPending || !form.displayName || !form.motivation}
        style={{
          ...btnPrimary, width: "100%", marginTop: 28,
          opacity: submitApp.isPending || !form.displayName || !form.motivation ? 0.5 : 1,
          cursor: submitApp.isPending || !form.displayName || !form.motivation ? "not-allowed" : "pointer",
        }}
      >
        {submitApp.isPending ? "Enviando solicitud..." : "📨 Enviar solicitud"}
      </button>
    </div>
  );
}

// ─── Step: Pending Approval ───────────────────────────────────────────────────

function StepPendingApproval({ accountType, application }: { accountType: AccountType; application: any }) {
  const [, navigate] = useLocation();
  const isApproved = application?.status === "approved";
  const isRejected = application?.status === "rejected";
  const statusColor = isApproved ? "#10B981" : isRejected ? "#EF4444" : "#F97316";

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 72, marginBottom: 20, lineHeight: 1 }}>
        {isApproved ? "🎉" : isRejected ? "😔" : "⏳"}
      </div>
      <h3 style={{ fontSize: 26, fontWeight: 900, color: "#1a1a1a", margin: "0 0 10px", letterSpacing: "-0.03em" }}>
        {isApproved ? "¡Solicitud aprobada!" : isRejected ? "Solicitud no aprobada" : "¡Ya casi estás dentro!"}
      </h3>
      <p style={{ fontSize: 15, color: "#6B7280", margin: "0 0 28px", lineHeight: 1.6 }}>
        {isApproved
          ? `¡Bienvenido/a a la familia ${accountType === "buddymaker" ? "BuddyMaker" : "BuddyExpert"}!`
          : isRejected
          ? "Nuestro equipo ha revisado tu solicitud y no ha podido aprobarse en este momento."
          : "Tu solicitud está en revisión. Normalmente tardamos 24-48 horas laborables."}
      </p>

      <div style={{
        background: `${statusColor}10`, border: `2px solid ${statusColor}30`,
        borderRadius: 18, padding: 20, marginBottom: 28, textAlign: "left",
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: statusColor, marginBottom: 8 }}>
          {isApproved ? "✅ Aprobada" : isRejected ? "❌ No aprobada" : "⏳ En revisión"}
        </div>
        {isRejected && application?.adminNote && (
          <p style={{ fontSize: 14, color: "#991B1B", margin: 0 }}>
            <strong>Motivo:</strong> {application.adminNote}
          </p>
        )}
        {!isApproved && !isRejected && (
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
            Te notificaremos por email cuando tengamos una respuesta. Mientras tanto, ya puedes explorar todas las funciones de BuddyMarket.
          </p>
        )}
      </div>

      {/* While waiting */}
      {!isApproved && !isRejected && (
        <div style={{ background: "#F9FAFB", borderRadius: 16, padding: 20, marginBottom: 28, textAlign: "left" }}>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: "#374151", margin: "0 0 12px" }}>
            Mientras esperas, puedes:
          </h4>
          {[
            "🥗 Explorar miles de recetas de la comunidad",
            "📅 Planificar tu menú semanal",
            "🤖 Chatear con BuddyIA",
            "🛒 Gestionar tu despensa e inventario",
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", fontSize: 14, color: "#6B7280" }}>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate("/app/dashboard")} style={{ ...btnPrimary, width: "100%" }}>
        {isApproved ? "Ir a mi panel →" : "Empezar a explorar BuddyMarket →"}
      </button>
    </div>
  );
}

// ─── Main Registration Page ───────────────────────────────────────────────────

export default function Registration() {
  const [, navigate] = useLocation();
  const { data: regStatus, isLoading, refetch } = trpc.profile.getRegistrationStatus.useQuery();
  const [localStep, setLocalStep] = useState<RegistrationStep | null>(null);
  const [localAccountType, setLocalAccountType] = useState<AccountType>("user");

  useEffect(() => {
    if (regStatus) {
      if (regStatus.registrationStep === "completed" && regStatus.onboardingCompleted) {
        navigate("/app/dashboard");
        return;
      }
      setLocalStep(regStatus.registrationStep as RegistrationStep);
      setLocalAccountType(regStatus.accountType as AccountType);
    }
  }, [regStatus]);

  const currentStep = localStep ?? regStatus?.registrationStep ?? "account_type";
  const currentAccountType = localAccountType ?? regStatus?.accountType ?? "user";

  const WIZARD_STEPS = [
    { id: "account_type", label: "Tipo de cuenta" },
    { id: "profile_setup", label: "Tu perfil" },
    ...(currentAccountType === "buddymaker" || currentAccountType === "buddyexpert"
      ? [{ id: "application", label: "Solicitud" }]
      : []),
    { id: "pending_approval", label: "Confirmación" },
  ];

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF7ED" }}>
        <div style={{ textAlign: "center" }}>
          <img src={LOGO_ICON} alt="BuddyMarket" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16 }} />
          <p style={{ color: "#9CA3AF", fontSize: 16 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* ── Left panel (hidden on mobile) ── */}
      <div style={{
        flex: "0 0 42%", display: "none",
        // Show on desktop via media query workaround
      }} className="registration-left-panel">
        <LeftPanel step={currentStep as RegistrationStep} accountType={currentAccountType} />
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        background: "white",
        display: "flex", flexDirection: "column",
      }}>
        {/* Top bar */}
        <div style={{
          padding: "20px 32px", display: "flex", alignItems: "center",
          justifyContent: "space-between", borderBottom: "1px solid #F3F4F6",
          position: "sticky", top: 0, background: "white", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={LOGO_ICON} alt="" style={{ width: 36, height: 36, borderRadius: 10 }} />
            <span style={{ fontSize: 16, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
              BuddyMarket
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {WIZARD_STEPS.map((s, i) => {
              const idx = WIZARD_STEPS.findIndex(ws => ws.id === currentStep);
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: i < idx ? "#10B981" : i === idx ? "#F97316" : "#E5E7EB",
                    color: i <= idx ? "white" : "#9CA3AF",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, transition: "all 0.3s ease",
                    boxShadow: i === idx ? "0 0 0 3px rgba(249,115,22,0.2)" : "none",
                  }}>
                    {i < idx ? "✓" : i + 1}
                  </div>
                  {i < WIZARD_STEPS.length - 1 && (
                    <div style={{
                      width: 16, height: 2, borderRadius: 1,
                      background: i < idx ? "#10B981" : "#E5E7EB",
                    }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div style={{ flex: 1, padding: "40px 32px 60px", maxWidth: 580, width: "100%", margin: "0 auto" }}>
          {currentStep === "account_type" && (
            <StepAccountType onSelect={(type) => {
              setLocalAccountType(type);
              setLocalStep("profile_setup");
              refetch();
            }} />
          )}
          {currentStep === "profile_setup" && (
            <StepProfileSetup accountType={currentAccountType} onNext={() => {
              const nextStep = (currentAccountType === "buddymaker" || currentAccountType === "buddyexpert")
                ? "application" : "pending_approval";
              setLocalStep(nextStep);
              refetch();
            }} />
          )}
          {currentStep === "application" && (
            <StepApplication accountType={currentAccountType} onNext={() => {
              setLocalStep("pending_approval");
              refetch();
            }} />
          )}
          {(currentStep === "pending_approval" || currentStep === "completed") && (
            <StepPendingApproval accountType={currentAccountType} application={regStatus?.application} />
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .registration-left-panel {
            display: block !important;
          }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 7,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 12, border: "2px solid #E5E7EB",
  fontSize: 14, fontWeight: 500, color: "#1a1a1a", background: "white",
  outline: "none", boxSizing: "border-box", fontFamily: "inherit",
  transition: "border-color 0.2s ease",
};

const chipStyle: React.CSSProperties = {
  background: "white", border: "2px solid #E5E7EB", borderRadius: 20,
  padding: "10px 16px", fontSize: 14, fontWeight: 600, color: "#374151",
  cursor: "pointer", transition: "all 0.2s ease",
};

const chipActiveStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
  border: "2px solid transparent", color: "white",
  boxShadow: "0 4px 12px rgba(249,115,22,0.35)",
};

const btnPrimary: React.CSSProperties = {
  background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
  color: "white", border: "none", borderRadius: 14, padding: "15px 32px",
  fontSize: 15, fontWeight: 800, cursor: "pointer",
  boxShadow: "0 4px 18px rgba(249,115,22,0.4)",
  transition: "all 0.2s ease",
};

const btnSecondary: React.CSSProperties = {
  background: "white", color: "#6B7280", border: "2px solid #E5E7EB",
  borderRadius: 14, padding: "13px 24px", fontSize: 14, fontWeight: 700,
  cursor: "pointer", transition: "all 0.2s ease",
};
