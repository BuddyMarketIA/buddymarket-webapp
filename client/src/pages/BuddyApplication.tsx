import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CheckCircle, Clock, XCircle, Star, ChefHat, ArrowLeft, ArrowRight, Check } from "lucide-react";

type AppType = "expert" | "maker";

const EXPERT_CATEGORIES = [
  "Nutrición clínica", "Pérdida de peso", "Ganancia muscular", "Nutrición deportiva",
  "Nutrición vegana/vegetariana", "Diabetes y metabolismo", "Nutrición infantil",
  "Trastornos alimentarios", "Nutrición oncológica", "Dietas terapéuticas"
];

const SPECIALTIES_MAKER = [
  "Cocina mediterránea", "Repostería saludable", "Cocina vegana", "Meal prep",
  "Cocina asiática", "Cocina española", "Recetas fitness", "Cocina sin gluten",
  "Cocina rápida", "Cocina familiar"
];

const STEPS_EXPERT = [
  { title: "Tipo y nombre", desc: "Elige tu rol y nombre público" },
  { title: "Perfil profesional", desc: "Formación, experiencia y certificaciones" },
  { title: "Redes sociales", desc: "Cómo encontrarte en internet" },
];

const STEPS_MAKER = [
  { title: "Tipo y nombre", desc: "Elige tu rol y nombre público" },
  { title: "Tu estilo culinario", desc: "Especialidad y motivación" },
  { title: "Redes sociales", desc: "Cómo encontrarte en internet" },
];

function StatusBanner({ status, adminNote, type }: { status: string; adminNote?: string | null; type: AppType }) {
  if (status === "pending") return (
    <div style={{ padding: "14px 16px", borderRadius: "14px", background: "#fefce8", border: "1.5px solid #fde047", display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <Clock style={{ width: "18px", height: "18px", color: "#ca8a04", flexShrink: 0, marginTop: "1px" }} />
      <div>
        <p style={{ margin: 0, fontWeight: 700, color: "#854d0e", fontSize: "14px" }}>Solicitud en revisión</p>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#92400e" }}>
          Tu solicitud ha sido enviada y está siendo revisada por el equipo de BuddyMarket. Te notificaremos cuando sea aprobada.
        </p>
      </div>
    </div>
  );
  if (status === "approved") return (
    <div style={{ padding: "14px 16px", borderRadius: "14px", background: "#f0fdf4", border: "1.5px solid #86efac", display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <CheckCircle style={{ width: "18px", height: "18px", color: "#16a34a", flexShrink: 0, marginTop: "1px" }} />
      <div>
        <p style={{ margin: 0, fontWeight: 700, color: "#14532d", fontSize: "14px" }}>¡Solicitud aprobada! 🎉</p>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#166534" }}>
          Ya tienes acceso completo a tu panel de {type === "expert" ? "BuddyExpert" : "BuddyMaker"}.
          {adminNote && ` Nota del equipo: "${adminNote}"`}
        </p>
      </div>
    </div>
  );
  if (status === "rejected") return (
    <div style={{ padding: "14px 16px", borderRadius: "14px", background: "#fef2f2", border: "1.5px solid #fca5a5", display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <XCircle style={{ width: "18px", height: "18px", color: "#dc2626", flexShrink: 0, marginTop: "1px" }} />
      <div>
        <p style={{ margin: 0, fontWeight: 700, color: "#7f1d1d", fontSize: "14px" }}>Solicitud rechazada</p>
        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#991b1b" }}>
          {adminNote || "Tu solicitud no fue aprobada en esta ocasión."} Puedes volver a enviar una solicitud con más información.
        </p>
      </div>
    </div>
  );
  return null;
}

function StepIndicator({ current, total, steps }: { current: number; total: number; steps: { title: string; desc: string }[] }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      {/* Progress bar */}
      <div style={{ height: "4px", borderRadius: "2px", background: "#f3f4f6", overflow: "hidden", marginBottom: "16px" }}>
        <div style={{ height: "100%", width: `${((current + 1) / total) * 100}%`, background: "linear-gradient(90deg, #F97316, #FB923C)", borderRadius: "2px", transition: "width 0.4s ease" }} />
      </div>
      {/* Step dots */}
      <div style={{ display: "flex", gap: "0", position: "relative" }}>
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: i === 0 ? "flex-start" : i === steps.length - 1 ? "flex-end" : "center" }}>
              <div style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: done ? "#F97316" : active ? "white" : "#f3f4f6",
                border: active ? "2.5px solid #F97316" : done ? "none" : "2px solid #e5e7eb",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "14px", fontWeight: 700, color: done ? "white" : active ? "#F97316" : "#9ca3af",
                transition: "all 0.3s ease",
                boxShadow: active ? "0 0 0 4px rgba(249,115,22,0.15)" : "none"
              }}>
                {done ? <Check style={{ width: "14px", height: "14px" }} /> : i + 1}
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "13px", fontWeight: active ? 700 : 500, color: active ? "#F97316" : "#9ca3af", textAlign: i === 0 ? "left" : i === steps.length - 1 ? "right" : "center" }}>
                {step.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BuddyApplication({ type }: { type?: AppType }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeType, setActiveType] = useState<AppType>(type ?? "expert");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    displayName: "",
    bio: "",
    specialty: "",
    instagramHandle: "",
    youtubeHandle: "",
    tiktokHandle: "",
    websiteUrl: "",
    motivation: "",
    experience: "",
    expertCategory: "",
    certifications: "",
  });

  const expertAppQuery = trpc.buddyApplications.getMyApplication.useQuery(
    { type: "expert" }, { enabled: !!user }
  );
  const makerAppQuery = trpc.buddyApplications.getMyApplication.useQuery(
    { type: "maker" }, { enabled: !!user }
  );

  const utils = trpc.useUtils();
  const submitMutation = trpc.buddyApplications.submitApplication.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! Te notificaremos cuando sea revisada.");
      utils.buddyApplications.getMyApplication.invalidate();
      setStep(0);
    },
    onError: (e) => toast.error(e.message),
  });

  const currentApp = activeType === "expert" ? expertAppQuery.data : makerAppQuery.data;
  const steps = activeType === "expert" ? STEPS_EXPERT : STEPS_MAKER;

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const validateStep = () => {
    if (step === 0 && !form.displayName.trim()) {
      toast.error("El nombre público es obligatorio");
      return false;
    }
    if (step === 1 && activeType === "expert" && !form.bio.trim()) {
      toast.error("Cuéntanos algo sobre ti");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < steps.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };

  const handleSubmit = () => {
    if (!form.displayName.trim()) return toast.error("El nombre es obligatorio");
    submitMutation.mutate({ type: activeType, ...form });
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #F97316", borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!user) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "16px", padding: "24px" }}>
      <div style={{ fontSize: "48px" }}>🔒</div>
      <p style={{ margin: 0, fontWeight: 700, fontSize: "18px", color: "#1a1a1a" }}>Inicia sesión para continuar</p>
      <p style={{ margin: 0, fontSize: "14px", color: "#6b7280", textAlign: "center" }}>Necesitas una cuenta para enviar tu solicitud como creador.</p>
      <button
        onClick={() => window.location.href = getLoginUrl()}
        style={{ padding: "12px 24px", borderRadius: "14px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontWeight: 700, fontSize: "15px", border: "none", cursor: "pointer" }}
      >
        Iniciar sesión
      </button>
    </div>
  );

  const card: React.CSSProperties = { background: "white", borderRadius: "18px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: "16px" };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "16px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1 as any)}
          style={{ width: "36px", height: "36px", borderRadius: "50%", border: "1.5px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft style={{ width: "16px", height: "16px", color: "#6b7280" }} />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "#1a1a1a" }}>Únete como creador</h1>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af" }}>Comparte tu conocimiento con la comunidad</p>
        </div>
      </div>

      {/* Type selector */}
      {(!currentApp || currentApp.status === "rejected") && (
        <div style={{ ...card }}>
          <p style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.08em" }}>Elige tu rol</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              onClick={() => { setActiveType("expert"); setStep(0); }}
              style={{
                padding: "14px", borderRadius: "14px", textAlign: "left",
                border: activeType === "expert" ? "2px solid #7c3aed" : "1.5px solid #e5e7eb",
                background: activeType === "expert" ? "rgba(124,58,237,0.06)" : "white",
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <Star style={{ width: "16px", height: "16px", color: "#7c3aed" }} />
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>BuddyExpert</span>
                {expertAppQuery.data && (
                  <span style={{ marginLeft: "auto", fontSize: "13px", padding: "2px 6px", borderRadius: "6px", background: expertAppQuery.data.status === "approved" ? "#dcfce7" : "#fef9c3", color: expertAppQuery.data.status === "approved" ? "#166534" : "#854d0e", fontWeight: 700 }}>
                    {expertAppQuery.data.status === "approved" ? "✓" : "⏳"}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>Nutricionistas y expertos en salud</p>
            </button>
            <button
              onClick={() => { setActiveType("maker"); setStep(0); }}
              style={{
                padding: "14px", borderRadius: "14px", textAlign: "left",
                border: activeType === "maker" ? "2px solid #F97316" : "1.5px solid #e5e7eb",
                background: activeType === "maker" ? "rgba(249,115,22,0.06)" : "white",
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <ChefHat style={{ width: "16px", height: "16px", color: "#F97316" }} />
                <span style={{ fontWeight: 700, fontSize: "14px", color: "#1a1a1a" }}>BuddyMaker</span>
                {makerAppQuery.data && (
                  <span style={{ marginLeft: "auto", fontSize: "13px", padding: "2px 6px", borderRadius: "6px", background: makerAppQuery.data.status === "approved" ? "#dcfce7" : "#fef9c3", color: makerAppQuery.data.status === "approved" ? "#166534" : "#854d0e", fontWeight: 700 }}>
                    {makerAppQuery.data.status === "approved" ? "✓" : "⏳"}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>Creadores de recetas y contenido</p>
            </button>
          </div>
        </div>
      )}

      {/* Status banner if application exists and not rejected */}
      {currentApp && currentApp.status !== "rejected" && (
        <div style={{ marginBottom: "16px" }}>
          <StatusBanner status={currentApp.status} adminNote={currentApp.adminNote} type={activeType} />
        </div>
      )}

      {/* If approved, show go-to-panel button */}
      {currentApp?.status === "approved" && (
        <div style={card}>
          <button
            onClick={() => navigate(activeType === "expert" ? "/app/buddy-expert-dashboard" : "/app/buddy-maker-dashboard")}
            style={{ width: "100%", padding: "14px", borderRadius: "14px", background: "linear-gradient(135deg, #F97316, #FB923C)", color: "white", fontWeight: 700, fontSize: "15px", border: "none", cursor: "pointer" }}
          >
            Ir a mi panel de {activeType === "expert" ? "BuddyExpert" : "BuddyMaker"} →
          </button>
        </div>
      )}

      {/* Application form — show if no app or if rejected */}
      {(!currentApp || currentApp.status === "rejected") && (
        <div style={card}>
          {currentApp?.status === "rejected" && (
            <div style={{ marginBottom: "16px" }}>
              <StatusBanner status="rejected" adminNote={currentApp.adminNote} type={activeType} />
            </div>
          )}

          {/* Step indicator */}
          <StepIndicator current={step} total={steps.length} steps={steps} />

          {/* Step title */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1a1a1a" }}>{steps[step].title}</p>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af" }}>{steps[step].desc}</p>
          </div>

          {/* STEP 0: Basic info */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Nombre público <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder={activeType === "expert" ? "Ej: Dra. María García, Nutricionista" : "Ej: Chef Sano, Recetas Fit"}
                  value={form.displayName}
                  onChange={f("displayName")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", boxSizing: "border-box" }}
                />
                <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#9ca3af" }}>Así te verán los usuarios en la plataforma</p>
              </div>

              {activeType === "expert" && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Categoría de especialización</label>
                  <select
                    value={form.expertCategory}
                    onChange={f("expertCategory")}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", appearance: "none", boxSizing: "border-box" }}
                  >
                    <option value="">Selecciona una categoría</option>
                    {EXPERT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              )}

              {activeType === "maker" && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Especialidad culinaria</label>
                  <select
                    value={form.specialty}
                    onChange={f("specialty")}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", appearance: "none", boxSizing: "border-box" }}
                  >
                    <option value="">Selecciona tu especialidad</option>
                    {SPECIALTIES_MAKER.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* STEP 1: Professional profile */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>
                  Sobre ti {activeType === "expert" && <span style={{ color: "#ef4444" }}>*</span>}
                </label>
                <textarea
                  placeholder={activeType === "expert" ? "Cuéntanos quién eres, tu formación y en qué te especializas..." : "Cuéntanos quién eres y qué tipo de recetas creas..."}
                  value={form.bio}
                  onChange={f("bio")}
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>¿Por qué quieres unirte?</label>
                <textarea
                  placeholder="Cuéntanos tu motivación y qué aportarás a la comunidad..."
                  value={form.motivation}
                  onChange={f("motivation")}
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Experiencia previa</label>
                <textarea
                  placeholder={activeType === "expert" ? "Formación, años de experiencia, casos de éxito..." : "Proyectos anteriores, seguidores, plataformas..."}
                  value={form.experience}
                  onChange={f("experience")}
                  rows={2}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              {activeType === "expert" && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Certificaciones y titulaciones</label>
                  <textarea
                    placeholder="Ej: Graduada en Nutrición Humana y Dietética, Máster en Nutrición Deportiva..."
                    value={form.certifications}
                    onChange={f("certifications")}
                    rows={2}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
              )}

              {activeType === "expert" && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej: Nutrición deportiva y pérdida de peso"
                    value={form.specialty}
                    onChange={f("specialty")}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Social media */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.2)" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#9a3412", fontWeight: 500 }}>
                  💡 Las redes sociales son opcionales pero ayudan al equipo a verificar tu perfil más rápido.
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Instagram</label>
                <input
                  type="text"
                  placeholder="@tu_usuario"
                  value={form.instagramHandle}
                  onChange={f("instagramHandle")}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {activeType === "maker" ? (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>YouTube</label>
                    <input
                      type="text"
                      placeholder="@tu_canal"
                      value={form.youtubeHandle}
                      onChange={f("youtubeHandle")}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>TikTok</label>
                    <input
                      type="text"
                      placeholder="@tu_usuario"
                      value={form.tiktokHandle}
                      onChange={f("tiktokHandle")}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "6px" }}>Web / LinkedIn</label>
                  <input
                    type="url"
                    placeholder="https://tu-web.com"
                    value={form.websiteUrl}
                    onChange={f("websiteUrl")}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "15px", background: "white", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              )}

              {/* Summary before submit */}
              <div style={{ padding: "14px", borderRadius: "14px", background: "#f9fafb", border: "1.5px solid #e5e7eb" }}>
                <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>Resumen de tu solicitud</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}><strong>Rol:</strong> {activeType === "expert" ? "BuddyExpert" : "BuddyMaker"}</p>
                  <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}><strong>Nombre:</strong> {form.displayName || "—"}</p>
                  {form.specialty && <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}><strong>Especialidad:</strong> {form.specialty}</p>}
                  {form.expertCategory && <p style={{ margin: 0, fontSize: "13px", color: "#374151" }}><strong>Categoría:</strong> {form.expertCategory}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{ flex: 1, padding: "13px", borderRadius: "14px", border: "1.5px solid #e5e7eb", background: "white", color: "#374151", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}
              >
                ← Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={submitMutation.isPending}
              style={{
                flex: 2, padding: "13px", borderRadius: "14px",
                background: submitMutation.isPending ? "#e5e7eb" : "linear-gradient(135deg, #F97316, #FB923C)",
                color: "white", fontWeight: 700, fontSize: "15px", border: "none",
                cursor: submitMutation.isPending ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              {submitMutation.isPending ? "Enviando..." : step < steps.length - 1 ? (
                <><span>Siguiente</span><ArrowRight style={{ width: "16px", height: "16px" }} /></>
              ) : (
                <><Check style={{ width: "16px", height: "16px" }} /><span>Enviar solicitud</span></>
              )}
            </button>
          </div>

          <p style={{ margin: "12px 0 0", fontSize: "14px", color: "#9ca3af", textAlign: "center" }}>
            El equipo revisará tu solicitud en 24-48h. Recibirás una notificación cuando sea aprobada.
          </p>
        </div>
      )}
    </div>
  );
}
