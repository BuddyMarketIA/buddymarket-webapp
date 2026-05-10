import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";

// ── Helpers ──────────────────────────────────────────────────────────────────

const activityFactors: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const activityLabels: Record<string, string> = {
  sedentary: "Sedentario (sin ejercicio)",
  light: "Ligero (1-3 días/semana)",
  moderate: "Moderado (3-5 días/semana)",
  active: "Activo (6-7 días/semana)",
  very_active: "Muy activo (2 veces/día)",
};

function getImcInfo(imc: number) {
  if (imc < 18.5) return { label: "Bajo peso", color: "#3b82f6", bg: "#eff6ff", tip: "Tu peso está por debajo del rango saludable. Considera aumentar la ingesta calórica con alimentos nutritivos." };
  if (imc < 25) return { label: "Peso normal", color: "#10b981", bg: "#f0fdf4", tip: "¡Enhorabuena! Tu peso está en el rango saludable. Mantén tus hábitos actuales." };
  if (imc < 30) return { label: "Sobrepeso", color: "#f59e0b", bg: "#fffbeb", tip: "Estás ligeramente por encima del rango saludable. Un pequeño déficit calórico y más actividad pueden ayudarte." };
  return { label: "Obesidad", color: "#ef4444", bg: "#fef2f2", tip: "Es recomendable consultar con un profesional de la salud para establecer un plan personalizado." };
}

function calcResults(sex: string, age: number, weight: number, height: number, activity: string, goal: string) {
  const imc = weight / ((height / 100) ** 2);
  const imcRounded = Math.round(imc * 10) / 10;
  const imcInfo = getImcInfo(imc);

  // Mifflin-St Jeor
  const tmb = sex === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdeeBase = tmb * (activityFactors[activity] ?? 1.55);
  let tdee = tdeeBase;
  if (goal === "lose") tdee = tdeeBase * 0.85;
  if (goal === "gain") tdee = tdeeBase * 1.1;

  const protein = Math.round(weight * (goal === "gain" ? 2.2 : 1.8));
  const fat = Math.round((tdee * 0.25) / 9);
  const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4);

  return {
    imc: imcRounded,
    imcLabel: imcInfo.label,
    imcColor: imcInfo.color,
    imcBg: imcInfo.bg,
    imcTip: imcInfo.tip,
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    protein,
    carbs,
    fat,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalculadoraNutricional() {
  // Read params from URL if present
  const params = new URLSearchParams(window.location.search);

  const [sex, setSex] = useState<"male" | "female">((params.get("sexo") as any) ?? "female");
  const [age, setAge] = useState(Number(params.get("edad") ?? 30));
  const [weight, setWeight] = useState(Number(params.get("peso") ?? 65));
  const [height, setHeight] = useState(Number(params.get("altura") ?? 165));
  const [activity, setActivity] = useState(params.get("actividad") ?? "moderate");
  const [goal, setGoal] = useState(params.get("objetivo") ?? "maintain");
  const [calculated, setCalculated] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof calcResults> | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  // Auto-calculate if URL has params
  useEffect(() => {
    if (params.get("sexo") || params.get("edad")) {
      const r = calcResults(
        params.get("sexo") ?? "female",
        Number(params.get("edad") ?? 30),
        Number(params.get("peso") ?? 65),
        Number(params.get("altura") ?? 165),
        params.get("actividad") ?? "moderate",
        params.get("objetivo") ?? "maintain",
      );
      setResults(r);
      setCalculated(true);
    }
  }, []);

  const calculate = () => {
    const r = calcResults(sex, age, weight, height, activity, goal);
    setResults(r);
    setCalculated(true);
    // Scroll to results on mobile
    setTimeout(() => {
      document.getElementById("resultados")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const buildShareUrl = useCallback(() => {
    const base = `${window.location.origin}/calculadora`;
    const q = new URLSearchParams({
      sexo: sex,
      edad: String(age),
      peso: String(weight),
      altura: String(height),
      actividad: activity,
      objetivo: goal,
    });
    return `${base}?${q.toString()}`;
  }, [sex, age, weight, height, activity, goal]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(buildShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = buildShareUrl();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`¡Acabo de calcular mis necesidades nutricionales con Buddy One! 🥗\n\nMi resultado:\n• Calorías diarias: ${results?.tdee} kcal\n• Proteínas: ${results?.protein}g · Carbos: ${results?.carbs}g · Grasas: ${results?.fat}g\n\n¿Cuáles son las tuyas? Calcula aquí gratis 👇\n${buildShareUrl()}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Acabo de calcular mis macros con @BuddyOneApp 🥗\n\n${results?.tdee} kcal/día · ${results?.protein}g proteína · ${results?.carbs}g carbos · ${results?.fat}g grasas\n\n¿Y tú? Calcula gratis 👇`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(buildShareUrl())}`, "_blank");
  };

  const goalLabel = { lose: "Perder peso", maintain: "Mantener peso", gain: "Ganar músculo" }[goal] ?? goal;

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── Header ── */}
      <header style={{ background: "white", borderBottom: "1px solid #f3f4f6", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #F97316, #ea580c)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#111827" }}>Buddy One</span>
          </Link>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Link href="/" style={{ fontSize: 14, fontWeight: 600, color: "#6b7280", textDecoration: "none" }}>← Volver</Link>
            <Link href="/login" style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 14, fontWeight: 700, color: "white",
              background: "linear-gradient(135deg, #F97316, #ea580c)", textDecoration: "none",
            }}>Registrarse gratis</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div style={{ background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 50%, #f0fdf4 100%)", padding: "56px 24px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "white", border: "1.5px solid #fed7aa", fontSize: 13, fontWeight: 700, color: "#ea580c", marginBottom: 20 }}>
          🥗 Calculadora Nutricional Gratuita
        </div>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, color: "#111827", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
          Descubre tus necesidades<br />nutricionales exactas
        </h1>
        <p style={{ fontSize: "clamp(15px, 2vw, 19px)", color: "#6b7280", maxWidth: 560, margin: "0 auto 24px", lineHeight: 1.7 }}>
          Calcula tu IMC, metabolismo basal y distribución de macronutrientes personalizada en segundos. <strong style={{ color: "#374151" }}>100% gratis, sin registro.</strong>
        </p>
        {/* Share hero CTA */}
        <button
          onClick={copyLink}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700,
            background: "white", border: "1.5px solid #e5e7eb", color: "#374151",
            cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = "#F97316")}
          onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}
        >
          {copied ? (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ¡Enlace copiado!</>
          ) : (
            <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg> Envíaselo a un amigo</>
          )}
        </button>
      </div>

      {/* ── Main grid ── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div className="calc-page-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 32 }}>

          {/* ── FORM ── */}
          <div style={{ background: "white", borderRadius: 24, padding: "36px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", marginBottom: 28 }}>Tus datos</h2>

            {/* Sex */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sexo biológico</label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["female", "male"] as const).map(s => (
                  <button key={s} onClick={() => setSex(s)} style={{
                    flex: 1, padding: "13px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    background: sex === s ? "#F97316" : "white",
                    color: sex === s ? "white" : "#374151",
                    border: sex === s ? "2px solid #F97316" : "2px solid #e5e7eb",
                  }}>
                    {s === "female" ? "👩 Mujer" : "👨 Hombre"}
                  </button>
                ))}
              </div>
            </div>

            {/* Age / Weight / Height */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 22 }} className="calc-fields">
              {[
                { label: "Edad", unit: "años", value: age, min: 15, max: 90, setter: setAge },
                { label: "Peso", unit: "kg", value: weight, min: 30, max: 200, setter: setWeight },
                { label: "Altura", unit: "cm", value: height, min: 130, max: 220, setter: setHeight },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number" value={f.value} min={f.min} max={f.max}
                      onChange={e => f.setter(Number(e.target.value))}
                      style={{ width: "100%", padding: "13px 42px 13px 14px", borderRadius: 12, border: "2px solid #e5e7eb", fontSize: 17, fontWeight: 700, color: "#111827", outline: "none", boxSizing: "border-box", background: "#f9fafb" }}
                      onFocus={e => (e.target.style.borderColor = "#F97316")}
                      onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                    />
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nivel de actividad física</label>
              <select value={activity} onChange={e => setActivity(e.target.value)}
                style={{ width: "100%", padding: "13px 16px", borderRadius: 12, border: "2px solid #e5e7eb", fontSize: 14, fontWeight: 600, color: "#111827", background: "#f9fafb", outline: "none", cursor: "pointer" }}
                onFocus={e => (e.target.style.borderColor = "#F97316")}
                onBlur={e => (e.target.style.borderColor = "#e5e7eb")}>
                {Object.entries(activityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {/* Goal */}
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Objetivo principal</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {([
                  ["lose", "🔥 Perder peso"],
                  ["maintain", "⚖️ Mantener"],
                  ["gain", "💪 Ganar músculo"],
                ] as const).map(([k, v]) => (
                  <button key={k} onClick={() => setGoal(k)} style={{
                    padding: "12px 8px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    background: goal === k ? "#F97316" : "white",
                    color: goal === k ? "white" : "#374151",
                    border: goal === k ? "2px solid #F97316" : "2px solid #e5e7eb",
                  }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={calculate} style={{
              width: "100%", padding: "17px", borderRadius: 14, fontSize: 17, fontWeight: 800, color: "white", cursor: "pointer",
              background: "linear-gradient(135deg, #F97316, #ea580c)", border: "none",
              boxShadow: "0 8px 24px rgba(249,115,22,0.35)", transition: "all 0.2s",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(249,115,22,0.45)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(249,115,22,0.35)"; }}>
              Calcular mis necesidades →
            </button>
          </div>

          {/* ── RESULTS ── */}
          <div id="resultados" style={{
            background: calculated ? "white" : "#f9fafb",
            borderRadius: 24, padding: "36px 32px",
            boxShadow: calculated ? "0 4px 32px rgba(0,0,0,0.06)" : "none",
            border: calculated ? "1px solid #f3f4f6" : "2px dashed #e5e7eb",
            display: "flex", flexDirection: "column", justifyContent: calculated ? "flex-start" : "center", alignItems: calculated ? "flex-start" : "center",
            minHeight: 400, transition: "all 0.4s",
          }}>
            {!calculated || !results ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🥗</div>
                <p style={{ fontSize: 17, color: "#9ca3af", fontWeight: 600, lineHeight: 1.6 }}>
                  Completa el formulario<br />y pulsa calcular
                </p>
                <p style={{ fontSize: 13, color: "#d1d5db", marginTop: 8 }}>Los resultados aparecerán aquí</p>
              </div>
            ) : (
              <div style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", margin: 0 }}>Tus resultados</h2>
                  {/* Share button */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setShareMenuOpen(v => !v)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                        background: "#fff7ed", border: "1.5px solid #fed7aa", color: "#ea580c",
                        cursor: "pointer", transition: "all 0.2s",
                      }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                      Compartir resultados
                    </button>
                    {shareMenuOpen && (
                      <div style={{
                        position: "absolute", right: 0, top: "calc(100% + 8px)", zIndex: 50,
                        background: "white", borderRadius: 16, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                        border: "1px solid #f3f4f6", padding: 8, minWidth: 220,
                      }}>
                        <button onClick={() => { copyLink(); setShareMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#374151", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                          {copied ? "¡Copiado!" : "Copiar enlace"}
                        </button>
                        <button onClick={() => { shareWhatsApp(); setShareMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#374151", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Compartir en WhatsApp
                        </button>
                        <button onClick={() => { shareTwitter(); setShareMenuOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10, fontSize: 14, fontWeight: 600, color: "#374151", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#f9fafb")}
                          onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="#000" stroke="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                          Compartir en X (Twitter)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* IMC */}
                <div style={{ background: results.imcBg, borderRadius: 16, padding: "20px 24px", marginBottom: 16, border: `1.5px solid ${results.imcColor}30` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>IMC (Índice de Masa Corporal)</p>
                      <p style={{ fontSize: 36, fontWeight: 900, color: "#111827", lineHeight: 1, marginBottom: 8 }}>{results.imc}</p>
                      <div style={{ height: 8, width: 160, borderRadius: 4, background: "#e5e7eb", overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${Math.min(100, (results.imc / 40) * 100)}%`, background: results.imcColor, borderRadius: 4, transition: "width 0.8s ease" }} />
                      </div>
                    </div>
                    <span style={{ display: "inline-block", padding: "8px 18px", borderRadius: 100, fontSize: 14, fontWeight: 700, background: results.imcColor + "20", color: results.imcColor }}>
                      {results.imcLabel}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginTop: 4 }}>{results.imcTip}</p>
                </div>

                {/* TMB / TDEE */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Metabolismo basal", value: results.tmb, unit: "kcal/día", desc: "En reposo absoluto", color: "#3b82f6" },
                    { label: "Calorías diarias", value: results.tdee, unit: "kcal/día", desc: goalLabel, color: "#F97316" },
                  ].map(r => (
                    <div key={r.label} style={{ background: r.color + "10", borderRadius: 16, padding: "18px 20px", border: `1.5px solid ${r.color}30` }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: r.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{r.label}</p>
                      <p style={{ fontSize: 30, fontWeight: 900, color: "#111827", lineHeight: 1, marginBottom: 4 }}>{r.value.toLocaleString()}</p>
                      <p style={{ fontSize: 12, color: "#6b7280" }}>{r.unit} · {r.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Macros */}
                <div style={{ background: "#f9fafb", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Distribución de macronutrientes diarios</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Proteínas", value: results.protein, unit: "g", color: "#F97316", kcal: results.protein * 4 },
                      { label: "Carbohidratos", value: results.carbs, unit: "g", color: "#3b82f6", kcal: results.carbs * 4 },
                      { label: "Grasas", value: results.fat, unit: "g", color: "#10b981", kcal: results.fat * 9 },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: "center" }}>
                        <div style={{ width: 60, height: 60, borderRadius: "50%", background: m.color + "15", border: `3px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                          <span style={{ fontSize: 19, fontWeight: 900, color: m.color }}>{m.value}</span>
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 2 }}>{m.label}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{m.unit} · {m.kcal} kcal</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Buddy One */}
                <div style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)", borderRadius: 16, padding: "20px 24px", marginBottom: 16, border: "1.5px solid #fed7aa" }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>¿Quieres que Buddy One genere tu menú semanal?</p>
                  <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6, marginBottom: 0 }}>
                    Basado exactamente en estos valores, adaptado a tus alergias, preferencias y los productos de tu supermercado habitual.
                  </p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button
                    onClick={() => {
                      const calcData = { tdee: results.tdee, tmb: results.tmb, protein: results.protein, carbs: results.carbs, fat: results.fat, goal, activity, sex, age, weight, height, imc: results.imc, savedAt: Date.now() };
                      localStorage.setItem("buddymarket_calc_prefill", JSON.stringify(calcData));
                      window.location.href = "/login";
                    }}
                    style={{
                      padding: "14px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "white", cursor: "pointer",
                      background: "linear-gradient(135deg, #F97316, #ea580c)", border: "none",
                      boxShadow: "0 6px 20px rgba(249,115,22,0.35)", transition: "all 0.2s",
                    }}>
                    Generar mi menú gratis →
                  </button>
                  <button
                    onClick={() => { copyLink(); setShareMenuOpen(false); }}
                    style={{
                      padding: "14px 16px", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#374151", cursor: "pointer",
                      background: "white", border: "1.5px solid #e5e7eb", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#F97316")}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#e5e7eb")}>
                    {copied ? "✓ ¡Copiado!" : "📤 Compartir"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Share section ── */}
        <div style={{ marginTop: 64, background: "white", borderRadius: 24, padding: "48px 40px", boxShadow: "0 4px 32px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6", textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤝</div>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, color: "#111827", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            Envíaselo a tus amigos
          </h2>
          <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "#6b7280", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Comparte esta calculadora con las personas que quieres. Que descubran sus macros, su IMC y cómo mejorar su alimentación — gratis, sin registro.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={shareWhatsApp} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700,
              background: "#25D366", color: "white", border: "none", cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 16px rgba(37,211,102,0.3)",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </button>
            <button onClick={shareTwitter} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700,
              background: "#000", color: "white", border: "none", cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X (Twitter)
            </button>
            <button onClick={copyLink} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "13px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700,
              background: copied ? "#10b981" : "white", color: copied ? "white" : "#374151",
              border: `1.5px solid ${copied ? "#10b981" : "#e5e7eb"}`, cursor: "pointer", transition: "all 0.2s",
            }}
              onMouseEnter={e => { if (!copied) e.currentTarget.style.borderColor = "#F97316"; }}
              onMouseLeave={e => { if (!copied) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
              {copied ? (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> ¡Enlace copiado!</>
              ) : (
                <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copiar enlace</>
              )}
            </button>
          </div>
          <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 20 }}>
            El enlace incluirá tus datos para que la persona vea directamente los resultados calculados con sus propios datos.
          </p>
        </div>

        {/* ── SEO / Info section ── */}
        <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }} className="info-grid">
          {[
            { icon: "🧮", title: "Fórmula Mifflin-St Jeor", desc: "La ecuación más precisa para calcular el metabolismo basal, validada por múltiples estudios científicos." },
            { icon: "🎯", title: "Macros personalizados", desc: "La distribución de proteínas, carbohidratos y grasas se ajusta a tu objetivo específico (pérdida, mantenimiento o ganancia)." },
            { icon: "🔗", title: "Enlace compartible", desc: "Genera un enlace único con tus datos para que tus amigos vean sus propios resultados al instante." },
          ].map(item => (
            <div key={item.title} style={{ background: "white", borderRadius: 20, padding: "28px 24px", boxShadow: "0 2px 16px rgba(0,0,0,0.04)", border: "1px solid #f3f4f6" }}>
              <div style={{ fontSize: 36, marginBottom: 14 }}>{item.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 8 }}>{item.title}</h3>
              <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Final CTA ── */}
        <div style={{ marginTop: 48, background: "linear-gradient(135deg, #F97316, #ea580c)", borderRadius: 24, padding: "48px 40px", textAlign: "center", boxShadow: "0 8px 40px rgba(249,115,22,0.3)" }}>
          <h2 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, color: "white", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
            ¿Listo para llevar tu nutrición al siguiente nivel?
          </h2>
          <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "rgba(255,255,255,0.85)", maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Buddy One genera tu menú semanal completo, lista de la compra y seguimiento nutricional basado exactamente en estos valores.
          </p>
          <Link href="/login" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "16px 32px", borderRadius: 14, fontSize: 17, fontWeight: 800, color: "#ea580c",
            background: "white", textDecoration: "none",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)", transition: "all 0.2s",
          }}>
            Empezar gratis →
          </Link>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 16 }}>Sin tarjeta de crédito · Plan gratuito disponible</p>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .calc-page-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .calc-fields { grid-template-columns: 1fr 1fr !important; }
          .info-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .info-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 641px) and (max-width: 900px) {
          .info-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
