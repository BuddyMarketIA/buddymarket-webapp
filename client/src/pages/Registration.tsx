import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = "user" | "buddymaker" | "buddyexpert" | "business";
type RegistrationStep = "account_type" | "profile_setup" | "application" | "pending_approval" | "completed";

// ─── Constants ────────────────────────────────────────────────────────────────

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/D0328B43-26CA-43D5-A762-51F7E0C1B4E2_44b3ba71.png";

const ACCOUNT_TYPES = [
  {
    id: "user" as AccountType,
    emoji: "🥗",
    title: "Usuario",
    subtitle: "Quiero mejorar mi alimentación",
    description: "Accede a recetas personalizadas, planifica menús, controla tu nutrición y haz la compra inteligente.",
    color: "#10B981",
    gradient: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
    features: ["Diario nutricional", "Recetas personalizadas", "Menús semanales", "Lista de la compra", "BuddyIA asistente"],
    badge: "Gratis",
    badgeColor: "#10B981",
  },
  {
    id: "buddymaker" as AccountType,
    emoji: "👨‍🍳",
    title: "BuddyMaker",
    subtitle: "Soy creador de contenido nutricional",
    description: "Comparte tus recetas y menús con la comunidad. Monetiza tu conocimiento culinario y nutricional.",
    color: "#F97316",
    gradient: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
    features: ["Publica recetas y menús", "Perfil de creador verificado", "Estadísticas de contenido", "Comunidad de seguidores", "Monetización futura"],
    badge: "Requiere aprobación",
    badgeColor: "#F97316",
  },
  {
    id: "buddyexpert" as AccountType,
    emoji: "🎓",
    title: "BuddyExpert",
    subtitle: "Soy nutricionista o profesional de la salud",
    description: "Ofrece planes de nutrición personalizados y asesoramiento profesional a usuarios de BuddyMarket.",
    color: "#8B5CF6",
    gradient: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
    features: ["Perfil profesional verificado", "Publica planes de nutrición", "Consultas con clientes", "Pagos integrados (Stripe)", "Badge de experto certificado"],
    badge: "Requiere aprobación",
    badgeColor: "#8B5CF6",
  },
  {
    id: "business" as AccountType,
    emoji: "🏢",
    title: "Empresa",
    subtitle: "Somos una empresa alimentaria o de salud",
    description: "Conecta tu marca con miles de usuarios interesados en nutrición y alimentación saludable.",
    color: "#3B82F6",
    gradient: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
    features: ["Perfil de empresa", "Publicación de productos", "Campañas de nutrición", "Analytics avanzado", "Integración con catálogo"],
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
  "Cocina mediterránea",
  "Cocina vegana/vegetariana",
  "Repostería saludable",
  "Meal prep y batch cooking",
  "Cocina fitness y deportiva",
  "Cocina internacional",
  "Cocina sin gluten",
  "Cocina para niños",
  "Cocina rápida y fácil",
  "Fermentados y probióticos",
];

// ─── Step Components ──────────────────────────────────────────────────────────

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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-0.03em" }}>
          ¿Cómo quieres usar BuddyMarket?
        </h2>
        <p style={{ fontSize: 16, color: "#6B7280", margin: 0 }}>
          Elige el tipo de cuenta que mejor se adapta a ti. Podrás cambiarla más adelante.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        {ACCOUNT_TYPES.map((type) => (
          <button
            key={type.id}
            disabled={type.disabled}
            onClick={() => !type.disabled && setSelected(type.id)}
            style={{
              background: selected === type.id ? type.gradient : "white",
              border: selected === type.id ? "none" : "2px solid #E5E7EB",
              borderRadius: 20,
              padding: "24px 20px",
              cursor: type.disabled ? "not-allowed" : "pointer",
              textAlign: "left",
              transition: "all 0.2s ease",
              opacity: type.disabled ? 0.5 : 1,
              boxShadow: selected === type.id ? `0 8px 32px ${type.color}40` : "0 2px 8px rgba(0,0,0,0.06)",
              transform: selected === type.id ? "translateY(-2px)" : "none",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Badge */}
            <div style={{
              position: "absolute", top: 12, right: 12,
              background: selected === type.id ? "rgba(255,255,255,0.25)" : `${type.badgeColor}15`,
              color: selected === type.id ? "white" : type.badgeColor,
              fontSize: 11, fontWeight: 700, borderRadius: 20, padding: "3px 10px",
            }}>
              {type.badge}
            </div>

            <div style={{ fontSize: 36, marginBottom: 12 }}>{type.emoji}</div>
            <h3 style={{
              fontSize: 18, fontWeight: 900, margin: "0 0 4px",
              color: selected === type.id ? "white" : "#1a1a1a",
              letterSpacing: "-0.02em",
            }}>
              {type.title}
            </h3>
            <p style={{
              fontSize: 13, fontWeight: 600, margin: "0 0 12px",
              color: selected === type.id ? "rgba(255,255,255,0.85)" : type.color,
            }}>
              {type.subtitle}
            </p>
            <p style={{
              fontSize: 13, margin: "0 0 16px", lineHeight: 1.5,
              color: selected === type.id ? "rgba(255,255,255,0.8)" : "#6B7280",
            }}>
              {type.description}
            </p>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {type.features.map((f) => (
                <li key={f} style={{
                  fontSize: 13, fontWeight: 600, padding: "3px 0",
                  color: selected === type.id ? "rgba(255,255,255,0.9)" : "#374151",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{ color: selected === type.id ? "rgba(255,255,255,0.7)" : type.color, fontSize: 14 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          onClick={handleContinue}
          disabled={!selected || setAccountType.isPending}
          style={{
            background: selected ? "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" : "#E5E7EB",
            color: selected ? "white" : "#9CA3AF",
            border: "none", borderRadius: 16, padding: "16px 48px",
            fontSize: 16, fontWeight: 800, cursor: selected ? "pointer" : "not-allowed",
            boxShadow: selected ? "0 4px 20px rgba(249,115,22,0.4)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          {setAccountType.isPending ? "Guardando..." : "Continuar →"}
        </button>
      </div>
    </div>
  );
}

function StepProfileSetup({ accountType, onNext }: { accountType: AccountType; onNext: () => void }) {
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

  const [step, setStep] = useState(0); // sub-steps within profile setup
  const totalSubSteps = accountType === "user" ? 4 : 3;

  const handleNext = async () => {
    if (step < totalSubSteps - 1) {
      setStep(step + 1);
      return;
    }
    // Final step - save everything
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
      // Advance step
      const nextStep = (accountType === "buddymaker" || accountType === "buddyexpert") ? "application" : "completed";
      await advanceStep.mutateAsync({ step: nextStep as any });
      onNext();
    } catch {
      toast.error("Error al guardar el perfil");
    }
  };

  const isLoading = updateBasic.isPending || updateProfile.isPending || advanceStep.isPending;

  const subStepTitles = ["Datos personales", "Objetivos", "Alergias y dieta", "Preferencias"];

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
      {/* Sub-step progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 32, justifyContent: "center" }}>
        {Array.from({ length: totalSubSteps }).map((_, i) => (
          <div key={i} style={{
            height: 6, flex: 1, maxWidth: 80, borderRadius: 3,
            background: i <= step ? "#F97316" : "#E5E7EB",
            transition: "background 0.3s ease",
          }} />
        ))}
      </div>

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <h3 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          {subStepTitles[step]}
        </h3>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0 }}>Paso {step + 1} de {totalSubSteps}</p>
      </div>

      {/* Sub-step 0: Personal data */}
      {step === 0 && (
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
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>Objetivo principal</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { v: "lose_weight", l: "⬇️ Perder peso" },
                { v: "gain_muscle", l: "💪 Ganar músculo" },
                { v: "maintain", l: "⚖️ Mantenerme" },
                { v: "improve_health", l: "❤️ Mejorar salud" },
                { v: "eat_healthier", l: "🥗 Comer mejor" },
              ].map(g => (
                <button key={g.v} onClick={() => setForm(f => ({ ...f, mainGoal: g.v }))}
                  style={{ ...chipStyle, ...(form.mainGoal === g.v ? chipActiveStyle : {}), padding: "12px 16px", borderRadius: 14 }}>
                  {g.l}
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
                    ...chipStyle,
                    ...(form.activityLevel === g.v ? chipActiveStyle : {}),
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
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={labelStyle}>Alergias e intolerancias</label>
            <p style={{ fontSize: 13, color: "#6B7280", margin: "0 0 12px" }}>Selecciona todas las que apliquen</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 200, overflowY: "auto", padding: "4px 0" }}>
              {(catalogData ?? []).map((a: any) => (
                <button key={a.id}
                  onClick={() => setForm(f => ({
                    ...f,
                    allergies: f.allergies.includes(a.id)
                      ? f.allergies.filter(id => id !== a.id)
                      : [...f.allergies, a.id],
                  }))}
                  style={{
                    ...chipStyle,
                    ...(form.allergies.includes(a.id) ? chipActiveStyle : {}),
                    fontSize: 13, padding: "8px 14px",
                  }}>
                  {a.nameEs}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Restricciones dietéticas</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxHeight: 200, overflowY: "auto", padding: "4px 0" }}>
              {(restrictionsData ?? []).map((r: any) => (
                <button key={r.id}
                  onClick={() => setForm(f => ({
                    ...f,
                    dietRestrictions: f.dietRestrictions.includes(r.id)
                      ? f.dietRestrictions.filter(id => id !== r.id)
                      : [...f.dietRestrictions, r.id],
                  }))}
                  style={{
                    ...chipStyle,
                    ...(form.dietRestrictions.includes(r.id) ? chipActiveStyle : {}),
                    fontSize: 13, padding: "8px 14px",
                  }}>
                  {r.nameEs}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-step 3: Preferences & Terms */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "#FFF7ED", borderRadius: 16, padding: 20, border: "1px solid #FED7AA" }}>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: "#92400E", margin: "0 0 12px" }}>📋 Términos y condiciones</h4>
            <p style={{ fontSize: 13, color: "#92400E", lineHeight: 1.6, margin: "0 0 16px" }}>
              Al usar BuddyMarket, aceptas que el contenido nutricional es orientativo y no sustituye el consejo de un profesional de la salud. Consulta siempre con un dietista o médico para decisiones importantes sobre tu alimentación.
            </p>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={form.acceptTerms}
                onChange={e => setForm(f => ({ ...f, acceptTerms: e.target.checked }))}
                style={{ marginTop: 2, width: 18, height: 18, accentColor: "#F97316" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: "#92400E" }}>
                Acepto los términos y condiciones y la política de privacidad *
              </span>
            </label>
          </div>
          <div style={{ background: "#F0FDF4", borderRadius: 16, padding: 20, border: "1px solid #BBF7D0" }}>
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
      <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "space-between" }}>
        {step > 0 ? (
          <button onClick={() => setStep(s => s - 1)} style={backBtnStyle}>← Atrás</button>
        ) : <div />}
        <button
          onClick={handleNext}
          disabled={step === 3 && !form.acceptTerms || isLoading}
          style={{
            ...continueBtnStyle,
            opacity: (step === 3 && !form.acceptTerms) || isLoading ? 0.5 : 1,
            cursor: (step === 3 && !form.acceptTerms) || isLoading ? "not-allowed" : "pointer",
          }}>
          {isLoading ? "Guardando..." : step < totalSubSteps - 1 ? "Siguiente →" : "Finalizar perfil →"}
        </button>
      </div>
    </div>
  );
}

function StepApplication({ accountType, onNext }: { accountType: AccountType; onNext: () => void }) {
  const [form, setForm] = useState({
    displayName: "", bio: "", specialty: "", expertCategory: "",
    instagramHandle: "", youtubeHandle: "", tiktokHandle: "", websiteUrl: "",
    motivation: "", experience: "", certifications: "",
  });
  const submitApp = trpc.profile.submitRegistrationApplication.useMutation();

  const handleSubmit = async () => {
    if (!form.displayName || !form.motivation) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    try {
      await submitApp.mutateAsync({
        type: accountType === "buddyexpert" ? "expert" : "maker",
        displayName: form.displayName,
        bio: form.bio || undefined,
        specialty: form.specialty || undefined,
        expertCategory: form.expertCategory || undefined,
        instagramHandle: form.instagramHandle || undefined,
        youtubeHandle: form.youtubeHandle || undefined,
        tiktokHandle: form.tiktokHandle || undefined,
        websiteUrl: form.websiteUrl || undefined,
        motivation: form.motivation || undefined,
        experience: form.experience || undefined,
        certifications: form.certifications || undefined,
      });
      toast.success("¡Solicitud enviada! Te avisaremos cuando sea revisada.");
      onNext();
    } catch (e: any) {
      toast.error(e?.message ?? "Error al enviar la solicitud");
    }
  };

  const isMaker = accountType === "buddymaker";
  const isExpert = accountType === "buddyexpert";

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{isMaker ? "👨‍🍳" : "🎓"}</div>
        <h3 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a1a", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Solicitud de {isMaker ? "BuddyMaker" : "BuddyExpert"}
        </h3>
        <p style={{ fontSize: 14, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
          {isMaker
            ? "Cuéntanos sobre tu experiencia culinaria y por qué quieres compartir tus recetas con la comunidad."
            : "Comparte tu formación y experiencia profesional para que podamos verificar tu perfil."}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label style={labelStyle}>Nombre de perfil público *</label>
          <input style={inputStyle} placeholder={isMaker ? "Chef María García" : "Dra. Ana López, Nutricionista"}
            value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} />
        </div>

        <div>
          <label style={labelStyle}>Descripción / Bio</label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            placeholder={isMaker ? "Cuéntanos sobre tu estilo culinario, experiencia y qué tipo de contenido crearás..." : "Describe tu formación, especialización y enfoque profesional..."}
            value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
        </div>

        {isExpert && (
          <div>
            <label style={labelStyle}>Categoría de especialización</label>
            <select style={inputStyle} value={form.expertCategory}
              onChange={e => setForm(f => ({ ...f, expertCategory: e.target.value }))}>
              <option value="">Selecciona una categoría</option>
              {EXPERT_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
        )}

        {isMaker && (
          <div>
            <label style={labelStyle}>Especialidad culinaria</label>
            <select style={inputStyle} value={form.specialty}
              onChange={e => setForm(f => ({ ...f, specialty: e.target.value }))}>
              <option value="">Selecciona tu especialidad</option>
              {MAKER_SPECIALTIES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        {isExpert && (
          <div>
            <label style={labelStyle}>Certificaciones y titulaciones</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
              placeholder="Grado en Nutrición Humana y Dietética, Universidad de Barcelona (2018). Máster en Nutrición Deportiva (2020)..."
              value={form.certifications} onChange={e => setForm(f => ({ ...f, certifications: e.target.value }))} />
          </div>
        )}

        <div>
          <label style={labelStyle}>Experiencia previa</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
            placeholder={isMaker ? "Llevo 5 años publicando recetas en Instagram con +10k seguidores..." : "3 años de consulta privada, colaboración con clínicas de nutrición..."}
            value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} />
        </div>

        <div>
          <label style={labelStyle}>¿Por qué quieres ser {isMaker ? "BuddyMaker" : "BuddyExpert"}? *</label>
          <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
            placeholder="Cuéntanos tu motivación y qué aportarás a la comunidad de BuddyMarket..."
            value={form.motivation} onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))} />
        </div>

        <div>
          <label style={labelStyle}>Redes sociales (opcional)</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, width: 28 }}>📸</span>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="@tuinstagram"
                value={form.instagramHandle} onChange={e => setForm(f => ({ ...f, instagramHandle: e.target.value }))} />
            </div>
            {isMaker && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, width: 28 }}>▶️</span>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="@tuyoutube"
                  value={form.youtubeHandle} onChange={e => setForm(f => ({ ...f, youtubeHandle: e.target.value }))} />
              </div>
            )}
            {isMaker && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20, width: 28 }}>🎵</span>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="@tutiktok"
                  value={form.tiktokHandle} onChange={e => setForm(f => ({ ...f, tiktokHandle: e.target.value }))} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20, width: 28 }}>🌐</span>
              <input style={{ ...inputStyle, flex: 1 }} placeholder="https://tuweb.com"
                value={form.websiteUrl} onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
        <button onClick={handleSubmit} disabled={submitApp.isPending || !form.displayName || !form.motivation}
          style={{
            ...continueBtnStyle,
            opacity: submitApp.isPending || !form.displayName || !form.motivation ? 0.5 : 1,
            cursor: submitApp.isPending || !form.displayName || !form.motivation ? "not-allowed" : "pointer",
          }}>
          {submitApp.isPending ? "Enviando solicitud..." : "📨 Enviar solicitud"}
        </button>
      </div>
    </div>
  );
}

function StepPendingApproval({ accountType, application }: { accountType: AccountType; application: any }) {
  const [, navigate] = useLocation();
  const statusColor = application?.status === "approved" ? "#10B981" : application?.status === "rejected" ? "#EF4444" : "#F97316";
  const statusLabel = application?.status === "approved" ? "✅ Aprobada" : application?.status === "rejected" ? "❌ Rechazada" : "⏳ En revisión";

  return (
    <div style={{ maxWidth: 500, margin: "0 auto", padding: "0 16px", textAlign: "center" }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>
        {application?.status === "approved" ? "🎉" : application?.status === "rejected" ? "😔" : "⏳"}
      </div>
      <h3 style={{ fontSize: 24, fontWeight: 900, color: "#1a1a1a", margin: "0 0 12px", letterSpacing: "-0.02em" }}>
        {application?.status === "approved"
          ? "¡Solicitud aprobada!"
          : application?.status === "rejected"
          ? "Solicitud no aprobada"
          : "Solicitud en revisión"}
      </h3>

      <div style={{
        background: `${statusColor}10`, border: `2px solid ${statusColor}30`,
        borderRadius: 16, padding: 20, marginBottom: 24,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: statusColor, marginBottom: 8 }}>{statusLabel}</div>
        {application?.status === "pending" && (
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0, lineHeight: 1.6 }}>
            Nuestro equipo está revisando tu solicitud. Normalmente tarda entre 24-48 horas laborables.
            Te notificaremos por email cuando tengamos una respuesta.
          </p>
        )}
        {application?.status === "approved" && (
          <p style={{ fontSize: 14, color: "#166534", margin: 0, lineHeight: 1.6 }}>
            ¡Bienvenido/a a la familia {accountType === "buddymaker" ? "BuddyMaker" : "BuddyExpert"}!
            Ya puedes acceder a todas las funciones de tu cuenta.
          </p>
        )}
        {application?.status === "rejected" && application?.adminNote && (
          <p style={{ fontSize: 14, color: "#991B1B", margin: 0, lineHeight: 1.6 }}>
            <strong>Motivo:</strong> {application.adminNote}
          </p>
        )}
      </div>

      {application?.status === "pending" && (
        <div style={{ background: "#F9FAFB", borderRadius: 16, padding: 20, marginBottom: 24, textAlign: "left" }}>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: "#374151", margin: "0 0 12px" }}>Mientras esperas...</h4>
          {["Completa tu perfil nutricional", "Explora recetas de la comunidad", "Prueba los menús especializados con IA", "Configura tu diario nutricional"].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 14, color: "#6B7280" }}>
              <span style={{ color: "#F97316", fontWeight: 800 }}>→</span> {item}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => navigate("/app/dashboard")} style={continueBtnStyle}>
        {application?.status === "approved" ? "Ir a mi panel →" : "Ir al inicio →"}
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
      // If already completed, redirect to dashboard
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

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FFF7ED" }}>
        <div style={{ textAlign: "center" }}>
          <img src={LOGO_URL} alt="BuddyMarket" style={{ width: 64, height: 64, borderRadius: 16, marginBottom: 16 }} />
          <p style={{ color: "#9CA3AF", fontSize: 16 }}>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #FFF7ED 0%, #FFFBF5 100%)" }}>
      {/* Header */}
      <div style={{
        background: "white", borderBottom: "1px solid #F3F4F6",
        padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src={LOGO_URL} alt="BuddyMarket" style={{ width: 40, height: 40, borderRadius: 12 }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#1a1a1a", letterSpacing: "-0.02em" }}>BuddyMarket</div>
            <div style={{ fontSize: 12, color: "#F97316", fontWeight: 700 }}>Configuración de cuenta</div>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: i < currentStepIndex ? "#10B981" : i === currentStepIndex ? "#F97316" : "#E5E7EB",
                color: i <= currentStepIndex ? "white" : "#9CA3AF",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800, transition: "all 0.3s ease",
              }}>
                {i < currentStepIndex ? "✓" : i + 1}
              </div>
              <span style={{
                fontSize: 12, fontWeight: 600, display: "none",
                color: i === currentStepIndex ? "#F97316" : "#9CA3AF",
              }} className="sm:block">
                {s.label}
              </span>
              {i < WIZARD_STEPS.length - 1 && (
                <div style={{ width: 20, height: 2, background: i < currentStepIndex ? "#10B981" : "#E5E7EB", borderRadius: 1 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "40px 16px 80px" }}>
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
          <StepPendingApproval
            accountType={currentAccountType}
            application={regStatus?.application}
          />
        )}
      </div>
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #E5E7EB",
  fontSize: 15, fontWeight: 500, color: "#1a1a1a", background: "white",
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

const continueBtnStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)",
  color: "white", border: "none", borderRadius: 16, padding: "16px 40px",
  fontSize: 16, fontWeight: 800, cursor: "pointer",
  boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
  transition: "all 0.2s ease",
};

const backBtnStyle: React.CSSProperties = {
  background: "white", color: "#6B7280", border: "2px solid #E5E7EB",
  borderRadius: 16, padding: "14px 28px", fontSize: 15, fontWeight: 700,
  cursor: "pointer", transition: "all 0.2s ease",
};
