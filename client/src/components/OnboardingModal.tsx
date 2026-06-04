import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────
type OnboardingStep = "welcome" | "goal" | "physical" | "preferences" | "done";

// ─── Data ─────────────────────────────────────────────────────────────────────
const GOALS = [
  { value: "lose_weight",      emoji: "🔥", label: "Perder peso",      desc: "Reducir grasa y mejorar composición corporal" },
  { value: "gain_muscle",      emoji: "💪", label: "Ganar músculo",     desc: "Aumentar masa muscular y fuerza" },
  { value: "maintain",         emoji: "⚖️", label: "Mantener peso",     desc: "Mantener mi peso actual con buena nutrición" },
  { value: "improve_health",   emoji: "❤️", label: "Mejorar salud",     desc: "Comer mejor y sentirme con más energía" },
  { value: "eat_healthier",    emoji: "🥗", label: "Comer más sano",    desc: "Adoptar hábitos alimentarios más saludables" },
];

const DIETARY_PREFERENCES = [
  { value: "vegetarian",    emoji: "🥦", label: "Vegetariano" },
  { value: "vegan",         emoji: "🌱", label: "Vegano" },
  { value: "gluten_free",   emoji: "🌾", label: "Sin gluten" },
  { value: "lactose_free",  emoji: "🥛", label: "Sin lactosa" },
  { value: "keto",          emoji: "🥑", label: "Keto" },
  { value: "mediterranean", emoji: "🫒", label: "Mediterránea" },
  { value: "none",          emoji: "🍽️", label: "Sin restricciones" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function OnboardingModal() {
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [saving, setSaving] = useState(false);

  // Profile data
  const [selectedGoal, setSelectedGoal] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "">("");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  const { data: profileData, isLoading } = trpc.profile.get.useQuery(undefined, {
    enabled: !!user,
    retry: false,
  });

  const updateProfile = trpc.profile.updateProfile.useMutation();
  const completeOnboarding = trpc.profile.completeOnboarding.useMutation();
  const utils = trpc.useUtils();

  // Show modal for any user who hasn't completed onboarding
  useEffect(() => {
    if (authLoading || isLoading) return;
    if (user && profileData && !profileData.user?.onboardingCompleted) {
      setOpen(true);
    }
  }, [user, authLoading, profileData, isLoading]);

  const firstName = user?.name?.split(" ")[0] || "amig@";

  const togglePref = (val: string) => {
    if (val === "none") { setSelectedPrefs(["none"]); return; }
    setSelectedPrefs(prev => {
      const without = prev.filter(p => p !== "none");
      return without.includes(val) ? without.filter(p => p !== val) : [...without, val];
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const profileInput: Record<string, unknown> = {};
      if (selectedGoal) profileInput.mainGoal = selectedGoal;
      if (gender) profileInput.gender = gender;
      if (age) profileInput.age = parseInt(age);
      if (height) profileInput.height = parseFloat(height);
      if (weight) profileInput.weight = parseFloat(weight);
      if (selectedPrefs.length > 0 && !selectedPrefs.includes("none")) {
        profileInput.dietaryPattern = selectedPrefs.join(",");
      }
      if (Object.keys(profileInput).length > 0) {
        await updateProfile.mutateAsync(profileInput as Parameters<typeof updateProfile.mutateAsync>[0]);
      }
      await completeOnboarding.mutateAsync(undefined);
      utils.profile.get.invalidate();
      setStep("done");
      setTimeout(() => setOpen(false), 2500);
    } catch {
      // Fail gracefully — mark onboarding as complete anyway so user isn't stuck
      try { await completeOnboarding.mutateAsync(undefined); } catch {}
      utils.profile.get.invalidate();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setSaving(true);
    try { await completeOnboarding.mutateAsync(undefined); } catch {}
    utils.profile.get.invalidate();
    setSaving(false);
    setOpen(false);
  };

  const handleNext = () => {
    if (step === "welcome") setStep("goal");
    else if (step === "goal") setStep("physical");
    else if (step === "physical") setStep("preferences");
    else if (step === "preferences") handleFinish();
  };

  const handleSkipStep = () => {
    if (step === "goal") setStep("physical");
    else if (step === "physical") setStep("preferences");
    else if (step === "preferences") handleFinish();
  };

  const stepNum = { welcome: 0, goal: 1, physical: 2, preferences: 3, done: 4 }[step];

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          width: "100%", maxWidth: 460,
          background: "white",
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
          maxHeight: "92dvh",
          display: "flex",
          flexDirection: "column",
          animation: "onboardSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Progress bar (steps 1-3) */}
        {step !== "welcome" && step !== "done" && (
          <div style={{ padding: "20px 24px 0" }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i <= stepNum ? "#F97316" : "#F3F4F6",
                  transition: "background 0.3s ease",
                }} />
              ))}
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#9ca3af" }}>Paso {stepNum} de 3</p>
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* ── WELCOME ── */}
          {step === "welcome" && (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 60, marginBottom: 16 }}>👋</div>
              <h2 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900, color: "#111827", letterSpacing: "-0.03em" }}>
                ¡Hola, {firstName}!
              </h2>
              <p style={{ margin: "0 0 6px", fontSize: 15, color: "#6b7280", lineHeight: 1.6 }}>
                Bienvenid@ a <strong style={{ color: "#F97316" }}>Buddy One</strong>.<br />
                En 3 pasos configuramos tu experiencia.
              </p>
              <p style={{ margin: "0 0 24px", fontSize: 13, color: "#9ca3af" }}>
                Todos los campos son opcionales — puedes saltarlos.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { emoji: "🎯", text: "Tu objetivo nutricional" },
                  { emoji: "📏", text: "Tus datos físicos" },
                  { emoji: "🥗", text: "Tus preferencias alimentarias" },
                ].map(item => (
                  <div key={item.text} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", background: "#FFF8F0",
                    borderRadius: 14, border: "1px solid rgba(249,115,22,0.15)",
                  }}>
                    <span style={{ fontSize: 20 }}>{item.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{item.text}</span>
                  </div>
                ))}
              </div>
              {/* ── Disclaimer médico + RIA obligatorio (App Store / Google Play) ── */}
              <div style={{
                marginTop: 20, padding: "12px 14px",
                background: "#FEF3C7", borderRadius: 12,
                border: "1px solid rgba(245,158,11,0.3)",
                display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <div style={{ margin: 0 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
                    <strong>Aviso médico:</strong> Buddy One es una herramienta de apoyo nutricional y no sustituye el consejo de un médico, dietista o profesional de la salud. Consulta siempre a un especialista antes de realizar cambios significativos en tu alimentación.
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#92400E", lineHeight: 1.5, opacity: 0.85 }}>
                    <strong>Aviso regulatorio (RIA):</strong> Esta plataforma utiliza IA conforme al Reglamento (UE) 2024/1689. Si la usas en contexto profesional o sanitario, consulta con un abogado especializado en regulación de IA.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── GOAL ── */}
          {step === "goal" && (
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 21, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                ¿Cuál es tu objetivo?
              </h2>
              <p style={{ margin: "0 0 18px", fontSize: 14, color: "#6b7280" }}>
                Personalizamos tus menús y recomendaciones según tu meta.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {GOALS.map(goal => (
                  <button
                    key={goal.value}
                    onClick={() => setSelectedGoal(goal.value)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "13px 16px", borderRadius: 16,
                      border: selectedGoal === goal.value ? "2px solid #F97316" : "1.5px solid #E5E7EB",
                      background: selectedGoal === goal.value ? "#FFF8F0" : "white",
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{goal.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#111827" }}>{goal.label}</p>
                      <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>{goal.desc}</p>
                    </div>
                    {selectedGoal === goal.value && (
                      <div style={{
                        width: 20, height: 20, borderRadius: "50%",
                        background: "#F97316", display: "flex",
                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── PHYSICAL ── */}
          {step === "physical" && (
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 21, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                Tus datos físicos
              </h2>
              <p style={{ margin: "0 0 18px", fontSize: 14, color: "#6b7280" }}>
                Opcionales. Los usamos para calcular tus necesidades calóricas.
              </p>

              {/* Gender */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Sexo</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { value: "female", label: "Mujer",  emoji: "👩" },
                    { value: "male",   label: "Hombre", emoji: "👨" },
                    { value: "other",  label: "Otro",   emoji: "🧑" },
                  ].map(g => (
                    <button
                      key={g.value}
                      onClick={() => setGender(g.value as "male" | "female" | "other")}
                      style={{
                        flex: 1, padding: "10px 8px", borderRadius: 12,
                        border: gender === g.value ? "2px solid #F97316" : "1.5px solid #E5E7EB",
                        background: gender === g.value ? "#FFF8F0" : "white",
                        cursor: "pointer", fontSize: 13, fontWeight: 600,
                        color: gender === g.value ? "#F97316" : "#374151",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ fontSize: 22, marginBottom: 4 }}>{g.emoji}</div>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numeric fields */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Edad",   placeholder: "30",  unit: "años", value: age,    onChange: setAge },
                  { label: "Altura", placeholder: "170", unit: "cm",   value: height, onChange: setHeight },
                  { label: "Peso",   placeholder: "70",  unit: "kg",   value: weight, onChange: setWeight },
                ].map(field => (
                  <div key={field.label}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      {field.label}
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="number"
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={e => field.onChange(e.target.value)}
                        style={{
                          width: "100%", padding: "10px 12px",
                          border: "1.5px solid #E5E7EB", borderRadius: 12,
                          fontSize: 15, fontWeight: 600, color: "#111827",
                          background: "white", outline: "none",
                          boxSizing: "border-box",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = "#F97316"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "#E5E7EB"; }}
                      />
                      <span style={{
                        position: "absolute", right: 8, top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 11, color: "#9ca3af", fontWeight: 500,
                      }}>{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PREFERENCES ── */}
          {step === "preferences" && (
            <div>
              <h2 style={{ margin: "0 0 6px", fontSize: 21, fontWeight: 900, color: "#111827", letterSpacing: "-0.02em" }}>
                Preferencias alimentarias
              </h2>
              <p style={{ margin: "0 0 18px", fontSize: 14, color: "#6b7280" }}>
                Selecciona todas las que apliquen. Puedes cambiarlas después.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {DIETARY_PREFERENCES.map(pref => {
                  const selected = selectedPrefs.includes(pref.value);
                  return (
                    <button
                      key={pref.value}
                      onClick={() => togglePref(pref.value)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 14px", borderRadius: 14,
                        border: selected ? "2px solid #F97316" : "1.5px solid #E5E7EB",
                        background: selected ? "#FFF8F0" : "white",
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{pref.emoji}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: selected ? "#F97316" : "#374151" }}>
                        {pref.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── DONE ── */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ margin: "0 0 12px", fontSize: 24, fontWeight: 900, color: "#111827" }}>
                ¡Todo listo!
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: "#6b7280", lineHeight: 1.6 }}>
                Tu perfil está configurado. Buddy One ya puede personalizar tus menús y recomendaciones.
              </p>
            </div>
          )}
        </div>

        {/* ── Footer buttons ── */}
        {step !== "done" && (
          <div style={{ padding: "0 24px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleNext}
              disabled={saving}
              style={{
                width: "100%", padding: "15px 0",
                background: "linear-gradient(135deg, #F97316, #ea580c)",
                color: "white", border: "none", borderRadius: 16,
                fontWeight: 800, fontSize: 15,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 6px 24px rgba(249,115,22,0.35)",
                opacity: saving ? 0.7 : 1,
                transition: "all 0.2s ease",
              }}
            >
              {saving ? "Guardando..." :
               step === "welcome" ? "¡Empezar! 🚀" :
               step === "preferences" ? "Finalizar ✨" :
               "Continuar →"}
            </button>

            {step !== "welcome" && (
              <button
                onClick={handleSkipStep}
                disabled={saving}
                style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 14, cursor: "pointer", padding: "4px 0" }}
              >
                Saltar este paso
              </button>
            )}

            {step === "welcome" && (
              <button
                onClick={handleSkip}
                disabled={saving}
                style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 14, cursor: "pointer", padding: "4px 0" }}
              >
                Configurar más tarde
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes onboardSlideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
