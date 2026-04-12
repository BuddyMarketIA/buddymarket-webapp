import { useState } from "react";

function useInView(threshold = 0.15) {
  const [inView, setInView] = useState(false);
  const ref = (el: HTMLElement | null) => {
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
  };
  return { ref, inView };
}

interface Props { appUrl: string; }

export default function NutritionalCalculatorSection({ appUrl }: Props) {
  const section = useInView(0.1);

  // Form state
  const [sex, setSex] = useState<"male" | "female">("female");
  const [age, setAge] = useState(30);
  const [weight, setWeight] = useState(65);
  const [height, setHeight] = useState(165);
  const [activity, setActivity] = useState<"sedentary" | "light" | "moderate" | "active" | "very_active">("moderate");
  const [goal, setGoal] = useState<"lose" | "maintain" | "gain">("maintain");
  const [calculated, setCalculated] = useState(false);

  // Results
  const [results, setResults] = useState({ imc: 0, imcLabel: "", tmb: 0, tdee: 0, protein: 0, carbs: 0, fat: 0 });

  const activityFactors = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  const activityLabels = { sedentary: "Sedentario", light: "Ligero (1-3 días/sem)", moderate: "Moderado (3-5 días/sem)", active: "Activo (6-7 días/sem)", very_active: "Muy activo (2x/día)" };

  const getImcLabel = (imc: number) => {
    if (imc < 18.5) return { label: "Bajo peso", color: "#3b82f6" };
    if (imc < 25) return { label: "Peso normal", color: "#10b981" };
    if (imc < 30) return { label: "Sobrepeso", color: "#f59e0b" };
    return { label: "Obesidad", color: "#ef4444" };
  };

  const calculate = () => {
    const imc = weight / ((height / 100) ** 2);
    const { label: imcLabel } = getImcLabel(imc);

    // Mifflin-St Jeor
    let tmb = sex === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

    const tdeeBase = tmb * activityFactors[activity];
    let tdee = tdeeBase;
    if (goal === "lose") tdee = tdeeBase * 0.85;
    if (goal === "gain") tdee = tdeeBase * 1.1;

    // Macros
    const protein = Math.round(weight * (goal === "gain" ? 2.2 : 1.8));
    const fat = Math.round((tdee * 0.25) / 9);
    const carbs = Math.round((tdee - protein * 4 - fat * 9) / 4);

    setResults({ imc: Math.round(imc * 10) / 10, imcLabel, tmb: Math.round(tmb), tdee: Math.round(tdee), protein, carbs, fat });
    setCalculated(true);
  };

  const imcInfo = getImcLabel(results.imc);

  return (
    <section
      ref={section.ref as any}
      id="calculadora"
      style={{ padding: "96px 24px", background: "#f9fafb" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          textAlign: "center", marginBottom: 56,
          opacity: section.inView ? 1 : 0,
          transform: section.inView ? "translateY(0)" : "translateY(24px)",
          transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "#fff7ed", border: "1.5px solid #fed7aa", fontSize: 13, fontWeight: 700, color: "#ea580c", marginBottom: 16 }}>
            Calculadora Nutricional Gratuita
          </div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "#111827", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            Descubre tus necesidades<br />nutricionales exactas
          </h2>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#6b7280", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
            Calcula tu IMC, metabolismo basal y distribución de macronutrientes personalizada en segundos.
          </p>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "1fr", gap: 32,
          opacity: section.inView ? 1 : 0,
          transform: section.inView ? "translateY(0)" : "translateY(32px)",
          transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.15s",
        }} className="calc-grid">

          {/* Form card */}
          <div style={{ background: "white", borderRadius: 24, padding: "36px 32px", boxShadow: "0 4px 32px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 28 }}>Tus datos</h3>

            {/* Sex */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Sexo biológico</label>
              <div style={{ display: "flex", gap: 10 }}>
                {(["female", "male"] as const).map(s => (
                  <button key={s} onClick={() => setSex(s)} style={{
                    flex: 1, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                    background: sex === s ? "#F97316" : "white",
                    color: sex === s ? "white" : "#374151",
                    border: sex === s ? "2px solid #F97316" : "2px solid #e5e7eb",
                  }}>
                    {s === "female" ? "Mujer" : "Hombre"}
                  </button>
                ))}
              </div>
            </div>

            {/* Age / Weight / Height */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }} className="calc-fields">
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
                      style={{ width: "100%", padding: "12px 40px 12px 14px", borderRadius: 12, border: "2px solid #e5e7eb", fontSize: 16, fontWeight: 700, color: "#111827", outline: "none", boxSizing: "border-box", background: "#f9fafb" }}
                      onFocus={e => (e.target.style.borderColor = "#F97316")}
                      onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                    />
                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>{f.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Activity */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nivel de actividad</label>
              <select value={activity} onChange={e => setActivity(e.target.value as any)}
                style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #e5e7eb", fontSize: 14, fontWeight: 600, color: "#111827", background: "#f9fafb", outline: "none", cursor: "pointer" }}
                onFocus={e => (e.target.style.borderColor = "#F97316")}
                onBlur={e => (e.target.style.borderColor = "#e5e7eb")}>
                {Object.entries(activityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            {/* Goal */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", display: "block", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Objetivo</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {([["lose", "Perder peso"], ["maintain", "Mantener"], ["gain", "Ganar músculo"]] as const).map(([k, v]) => (
                  <button key={k} onClick={() => setGoal(k)} style={{
                    padding: "11px 8px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
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
              width: "100%", padding: "16px", borderRadius: 14, fontSize: 16, fontWeight: 800, color: "white", cursor: "pointer",
              background: "linear-gradient(135deg, #F97316, #ea580c)", border: "none",
              boxShadow: "0 8px 24px rgba(249,115,22,0.35)", transition: "all 0.2s",
            }}
              onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-2px)"; (e.target as HTMLElement).style.boxShadow = "0 12px 32px rgba(249,115,22,0.45)"; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; (e.target as HTMLElement).style.boxShadow = "0 8px 24px rgba(249,115,22,0.35)"; }}>
              Calcular mis necesidades
            </button>
          </div>

          {/* Results card */}
          <div style={{
            background: calculated ? "white" : "#f9fafb",
            borderRadius: 24, padding: "36px 32px",
            boxShadow: calculated ? "0 4px 32px rgba(0,0,0,0.06)" : "none",
            border: calculated ? "1px solid #f3f4f6" : "2px dashed #e5e7eb",
            display: "flex", flexDirection: "column", justifyContent: calculated ? "flex-start" : "center", alignItems: calculated ? "flex-start" : "center",
            minHeight: 400, transition: "all 0.4s",
          }}>
            {!calculated ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
                  </svg>
                </div>
                <p style={{ fontSize: 16, color: "#9ca3af", fontWeight: 600 }}>Completa el formulario y<br />pulsa calcular</p>
              </div>
            ) : (
              <div style={{ width: "100%" }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 24 }}>Tus resultados</h3>

                {/* IMC */}
                <div style={{ background: "#f9fafb", borderRadius: 16, padding: "20px 24px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>IMC (Índice de Masa Corporal)</p>
                    <p style={{ fontSize: 32, fontWeight: 900, color: "#111827", lineHeight: 1 }}>{results.imc}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "inline-block", padding: "6px 14px", borderRadius: 100, fontSize: 13, fontWeight: 700, background: imcInfo.color + "20", color: imcInfo.color }}>
                      {results.imcLabel}
                    </span>
                    <div style={{ marginTop: 8, height: 6, width: 120, borderRadius: 3, background: "#e5e7eb", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.min(100, (results.imc / 40) * 100)}%`, background: imcInfo.color, borderRadius: 3, transition: "width 0.8s" }} />
                    </div>
                  </div>
                </div>

                {/* TMB / TDEE */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    { label: "Metabolismo basal", value: results.tmb, unit: "kcal/día", desc: "En reposo absoluto", color: "#3b82f6" },
                    { label: "Calorías totales", value: results.tdee, unit: "kcal/día", desc: goal === "lose" ? "Para perder peso" : goal === "gain" ? "Para ganar músculo" : "Para mantener", color: "#F97316" },
                  ].map(r => (
                    <div key={r.label} style={{ background: r.color + "10", borderRadius: 16, padding: "18px 20px", border: `1.5px solid ${r.color}30` }}>
                      <p style={{ fontSize: 11, fontWeight: 700, color: r.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{r.label}</p>
                      <p style={{ fontSize: 28, fontWeight: 900, color: "#111827", lineHeight: 1, marginBottom: 4 }}>{r.value.toLocaleString()}</p>
                      <p style={{ fontSize: 12, color: "#6b7280" }}>{r.unit} · {r.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Macros */}
                <div style={{ background: "#f9fafb", borderRadius: 16, padding: "20px 24px", marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 16 }}>Distribución de macronutrientes diarios</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Proteínas", value: results.protein, unit: "g", color: "#F97316", kcal: results.protein * 4 },
                      { label: "Carbohidratos", value: results.carbs, unit: "g", color: "#3b82f6", kcal: results.carbs * 4 },
                      { label: "Grasas", value: results.fat, unit: "g", color: "#10b981", kcal: results.fat * 9 },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: "center" }}>
                        <div style={{ width: 56, height: 56, borderRadius: "50%", background: m.color + "15", border: `3px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: m.color }}>{m.value}</span>
                        </div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 2 }}>{m.label}</p>
                        <p style={{ fontSize: 11, color: "#9ca3af" }}>{m.unit} · {m.kcal} kcal</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: "1.5px solid #fed7aa" }}>
                  <p style={{ fontSize: 13, color: "#92400e", fontWeight: 600, lineHeight: 1.6 }}>
                    BuddyMarket puede generar tu menú semanal completo basado exactamente en estos valores, adaptado a tus alergias y preferencias.
                  </p>
                </div>

                <a href={appUrl} style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "14px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, color: "white",
                  background: "linear-gradient(135deg, #F97316, #ea580c)", textDecoration: "none",
                  boxShadow: "0 6px 20px rgba(249,115,22,0.35)", transition: "all 0.2s",
                }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.transform = "translateY(0)"; }}>
                  Generar mi menú personalizado
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .calc-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .calc-fields { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </section>
  );
}
