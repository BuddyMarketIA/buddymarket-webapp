import React, { useState } from "react"
import { useTranslation } from 'react-i18next';;
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Feature list for the preview ────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🐾",
    title: "Perfil completo de tu mascota",
    desc: "Raza, edad, peso, condición corporal, alergias, historial médico y foto de perfil.",
    demo: "demo-profile",
  },
  {
    icon: "🍽️",
    title: "Menús personalizados con IA",
    desc: "Genera menús semanales adaptados a la especie, tamaño, dieta y condición de salud de tu mascota.",
    demo: "demo-menu",
  },
  {
    icon: "📸",
    title: "Análisis de foto con IA",
    desc: "Sube una foto y la IA evalúa la condición corporal, estado del pelaje y posibles problemas de salud.",
    demo: "demo-photo",
  },
  {
    icon: "⚖️",
    title: "Historial de peso",
    desc: "Registra el peso periódicamente y visualiza la evolución con gráficas interactivas.",
    demo: "demo-weight",
  },
  {
    icon: "💉",
    title: "Vacunas y alertas",
    desc: "Gestiona el calendario de vacunación y recibe alertas antes de que venzan.",
    demo: "demo-vaccines",
  },
  {
    icon: "💊",
    title: "Medicamentos activos",
    desc: "Registra tratamientos, dosis y duración. Alertas de recordatorio automáticas.",
    demo: "demo-meds",
  },
  {
    icon: "🏥",
    title: "Clínicas veterinarias colaboradoras",
    desc: "Vincula a tu mascota con su clínica vet. Los veterinarios pueden ver el historial y añadir alertas.",
    demo: "demo-clinics",
  },
  {
    icon: "🥩",
    title: "Análisis de alimentación actual",
    desc: "Introduce la marca y tipo de pienso que usa tu mascota y la IA analiza si es adecuado.",
    demo: "demo-feeding",
  },
];

// ─── Mock demo data ───────────────────────────────────────────────────────────
const DEMO_PET = {
  name: "Luna",
  species: "🐕 Labrador Retriever",
  age: "3 años",
  weight: "28 kg",
  condition: "Peso ideal",
  conditionColor: "#22c55e",
  diet: "Mixta (pienso + natural)",
  nextVaccine: "Rabia — vence en 12 días",
};

const DEMO_MENU = [
  { time: "Mañana", meal: "Pienso premium (200g) + zanahoria cruda", kcal: 380 },
  { time: "Tarde", meal: "Pollo cocido (150g) + arroz integral (80g)", kcal: 420 },
  { time: "Noche", meal: "Pienso premium (200g) + aceite de salmón (5ml)", kcal: 390 },
];

const DEMO_WEIGHT = [
  { date: "Ene", kg: 26.5 },
  { date: "Feb", kg: 27.1 },
  { date: "Mar", kg: 27.8 },
  { date: "Abr", kg: 28.0 },
];

// ─── Mini demo components ─────────────────────────────────────────────────────
function DemoProfile() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "linear-gradient(135deg, #f97316, #ea580c)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, flexShrink: 0,
      }}>🐕</div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#1f2937" }}>{DEMO_PET.name}</div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{DEMO_PET.species} · {DEMO_PET.age}</div>
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <span style={{
            background: `${DEMO_PET.conditionColor}18`, color: DEMO_PET.conditionColor,
            borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 700,
            border: `1px solid ${DEMO_PET.conditionColor}44`,
          }}>{DEMO_PET.condition}</span>
          <span style={{
            background: "#f3f4f6", color: "#374151",
            borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600,
          }}>{DEMO_PET.weight}</span>
        </div>
      </div>
    </div>
  );
}

function DemoMenu() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {DEMO_MENU.map((m) => (
        <div key={m.time} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f9fafb", borderRadius: 8, padding: "6px 10px",
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f97316" }}>{m.time}</span>
            <div style={{ fontSize: 12, color: "#374151", marginTop: 1 }}>{m.meal}</div>
          </div>
          <span style={{ fontSize: 11, color: "#9ca3af", flexShrink: 0 }}>{m.kcal} kcal</span>
        </div>
      ))}
    </div>
  );
}

function DemoWeight() {
  const max = Math.max(...DEMO_WEIGHT.map((d) => d.kg));
  const min = Math.min(...DEMO_WEIGHT.map((d) => d.kg));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 60 }}>
        {DEMO_WEIGHT.map((d) => {
          const h = ((d.kg - min) / (max - min + 0.5)) * 48 + 12;
          return (
            <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ fontSize: 10, color: "#f97316", fontWeight: 700 }}>{d.kg}</div>
              <div style={{
                width: "100%", height: h, borderRadius: 4,
                background: "linear-gradient(180deg, #f97316, #fed7aa)",
              }} />
              <div style={{ fontSize: 10, color: "#9ca3af" }}>{d.date}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6, textAlign: "center" }}>
        Evolución de peso · últimos 4 meses
      </div>
    </div>
  );
}

function DemoVaccines() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {[
        { name: "Rabia", date: "12 may 2026", status: "urgent", label: "⚠️ 12 días" },
        { name: "Parvovirus + Moquillo", date: "3 ago 2026", status: "ok", label: "✅ Al día" },
        { name: "Leptospirosis", date: "3 ago 2026", status: "ok", label: "✅ Al día" },
      ].map((v) => (
        <div key={v.name} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: v.status === "urgent" ? "#fef3c7" : "#f0fdf4",
          borderRadius: 8, padding: "6px 10px",
          border: `1px solid ${v.status === "urgent" ? "#fde68a" : "#bbf7d0"}`,
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>{v.name}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{v.date}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: v.status === "urgent" ? "#d97706" : "#16a34a" }}>
            {v.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function DemoPhotoAI() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div style={{
        width: 64, height: 64, borderRadius: 10,
        background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 28, flexShrink: 0,
      }}>📸</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#1f2937", marginBottom: 4 }}>
          Análisis IA de Luna
        </div>
        {[
          { label: "Condición corporal", value: "Ideal (5/9)", color: "#22c55e" },
          { label: "Estado del pelaje", value: "Brillante y sano", color: "#3b82f6" },
          { label: "Postura", value: "Normal", color: "#8b5cf6" },
        ].map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>{r.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DemoMeds() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {[
        { name: "Simparica Trio", dose: "1 comprimido/mes", remaining: "8 días" },
        { name: "Omega-3 canino", dose: "5ml/día en comida", remaining: t("common.active") },
      ].map((m) => (
        <div key={m.name} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f5f3ff", borderRadius: 8, padding: "6px 10px",
          border: "1px solid #e9d5ff",
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>💊 {m.name}</div>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{m.dose}</div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#7c3aed" }}>{m.remaining}</span>
        </div>
      ))}
    </div>
  );
}

function DemoClinics() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: "linear-gradient(135deg, #dcfce7, #bbf7d0)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22, flexShrink: 0,
      }}>🏥</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#1f2937" }}>Clínica VetSalud Madrid</div>
        <div style={{ fontSize: 11, color: "#6b7280" }}>Calle Mayor 12 · Madrid</div>
        <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>
          ✅ Vinculada · 3 alertas activas
        </div>
      </div>
    </div>
  );
}

function DemoFeeding() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>Marca actual</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>Royal Canin Labrador</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: "#6b7280" }}>Tipo</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>Pienso seco adulto</span>
      </div>
      <div style={{
        background: "#fef9c3", borderRadius: 8, padding: "6px 10px",
        border: "1px solid #fde68a", marginTop: 4,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>⚡ Análisis IA</div>
        <div style={{ fontSize: 11, color: "#78350f", marginTop: 2 }}>
          La ración actual es adecuada pero podría beneficiarse de suplemento de Omega-3 para articulaciones.
        </div>
      </div>
    </div>
  );
}

const DEMO_COMPONENTS: Record<string, React.ReactNode> = {
  "demo-profile": <DemoProfile />,
  "demo-menu": <DemoMenu />,
  "demo-photo": <DemoPhotoAI />,
  "demo-weight": <DemoWeight />,
  "demo-vaccines": <DemoVaccines />,
  "demo-meds": <DemoMeds />,
  "demo-clinics": <DemoClinics />,
  "demo-feeding": <DemoFeeding />,
};

// ─── Main Preview Component ───────────────────────────────────────────────────
export default function BuddyPetPreview() {
  const [, navigate] = useLocation();
  const [activeDemo, setActiveDemo] = useState<string>("demo-profile");

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "16px 16px 80px" }}>

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(135deg, #1a0533 0%, #2d0a5e 40%, #0f172a 100%)",
        borderRadius: 24,
        padding: "32px 24px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
        marginBottom: 24,
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: -40, right: -40,
          width: 180, height: 180, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.4) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -30, left: -30,
          width: 140, height: 140, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(124,58,237,0.25)", border: "1px solid rgba(167,139,250,0.4)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 16,
        }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.05em" }}>
            PRO MAX EXCLUSIVO
          </span>
        </div>

        {/* Title */}
        <div style={{ fontSize: 52, marginBottom: 8 }}>🐾</div>
        <h1 style={{
          fontSize: 28, fontWeight: 900, color: "#fff",
          margin: "0 0 10px", lineHeight: 1.2,
        }}>
          BuddyPet
        </h1>
        <p style={{ fontSize: 15, color: "#c4b5fd", margin: "0 0 24px", lineHeight: 1.5 }}>
          Nutrición inteligente y salud integral<br />para tus mascotas
        </p>

        {/* Stats row */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 24,
          marginBottom: 28,
        }}>
          {[
            { n: "8", label: "módulos" },
            { n: "IA", label: "análisis foto" },
            { n: "24/7", label: "alertas" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff" }}>{s.n}</div>
              <div style={{ fontSize: 11, color: "#a78bfa" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA button */}
        <button
          onClick={() => navigate("/app/pricing?plan=premium")}
          style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "14px 32px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(124,58,237,0.5)",
            width: "100%",
            maxWidth: 320,
            letterSpacing: "0.02em",
          }}
        >
          Activar BuddyPet Pro Max →
        </button>
        <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 10, opacity: 0.8 }}>
          Desde 19,99€/mes · Cancela cuando quieras
        </div>
      </div>

      {/* ── Interactive feature demos ── */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1f2937", marginBottom: 4 }}>
          Explora las funcionalidades
        </h2>
        <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
          Toca cada módulo para ver una demo interactiva
        </p>

        {/* Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 }}>
          {FEATURES.map((f) => (
            <button
              key={f.demo}
              onClick={() => setActiveDemo(f.demo)}
              style={{
                background: activeDemo === f.demo
                  ? "linear-gradient(135deg, #f5f3ff, #ede9fe)"
                  : "#f9fafb",
                border: activeDemo === f.demo
                  ? "2px solid #7c3aed"
                  : "2px solid transparent",
                borderRadius: 12,
                padding: "10px 12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 3 }}>{f.icon}</div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: activeDemo === f.demo ? "#7c3aed" : "#1f2937",
                lineHeight: 1.3,
              }}>
                {f.title}
              </div>
            </button>
          ))}
        </div>

        {/* Demo panel */}
        <div style={{
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          borderRadius: 16,
          padding: 16,
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Blur overlay with lock */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(255,255,255,0.65)",
            backdropFilter: "blur(4px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 10, zIndex: 10,
            borderRadius: 16,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
            }}>🔒</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1f2937" }}>
              {FEATURES.find((f) => f.demo === activeDemo)?.title}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", textAlign: "center", maxWidth: 220 }}>
              {FEATURES.find((f) => f.demo === activeDemo)?.desc}
            </div>
            <button
              onClick={() => navigate("/app/pricing?plan=premium")}
              style={{
                background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "#fff", border: "none",
                borderRadius: 10, padding: "10px 22px",
                fontSize: 13, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                marginTop: 4,
              }}
            >
              Desbloquear con Pro Max
            </button>
          </div>

          {/* Blurred demo content underneath */}
          <div style={{ pointerEvents: "none", userSelect: "none" }}>
            {DEMO_COMPONENTS[activeDemo]}
          </div>
        </div>
      </div>

      {/* ── What's included ── */}
      <div style={{
        background: "linear-gradient(135deg, #f5f3ff, #faf5ff)",
        border: "1.5px solid #e9d5ff",
        borderRadius: 20,
        padding: "20px 16px",
        marginBottom: 24,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1f2937", margin: "0 0 14px" }}>
          ⭐ Todo lo que incluye Pro Max
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Perfiles ilimitados de mascotas",
            "Menús semanales personalizados con IA",
            "Análisis de foto con IA (condición corporal, pelaje)",
            "Historial de peso con gráficas",
            "Gestión de vacunas con alertas de vencimiento",
            "Registro de medicamentos activos",
            "Vinculación con clínicas veterinarias",
            "Análisis de alimentación actual con IA",
            "13 tipos de dieta soportados (BARF, casera, renal...)",
            "Acceso a clínicas colaboradoras en toda España",
          ].map((item) => (
            <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: "#7c3aed", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 13, color: "#374151" }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Comparison: Free vs Pro Max ── */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1f2937", margin: "0 0 12px" }}>
          Comparativa de planes
        </h3>
        <div style={{
          background: "#fff",
          border: "1.5px solid #e5e7eb",
          borderRadius: 16,
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 80px 80px",
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
            padding: "10px 16px",
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>Función</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", textAlign: "center" }}>Gratis</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>Pro Max</div>
          </div>
          {/* Rows */}
          {[
            { feature: "Perfil básico de mascota", free: true, pro: true },
            { feature: "Menú personalizado con IA", free: false, pro: true },
            { feature: "Análisis de foto con IA", free: false, pro: true },
            { feature: "Historial de peso", free: false, pro: true },
            { feature: "Vacunas y alertas", free: false, pro: true },
            { feature: "Medicamentos activos", free: false, pro: true },
            { feature: "Clínicas veterinarias", free: false, pro: true },
            { feature: "Análisis de alimentación IA", free: false, pro: true },
          ].map((row, i) => (
            <div key={row.feature} style={{
              display: "grid", gridTemplateColumns: "1fr 80px 80px",
              padding: "10px 16px",
              borderBottom: i < 7 ? "1px solid #f3f4f6" : "none",
              background: i % 2 === 0 ? "#fff" : "#fafafa",
            }}>
              <div style={{ fontSize: 13, color: "#374151" }}>{row.feature}</div>
              <div style={{ textAlign: "center", fontSize: 16 }}>
                {row.free ? "✅" : "—"}
              </div>
              <div style={{ textAlign: "center", fontSize: 16 }}>
                {row.pro ? "✅" : "—"}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Testimonial ── */}
      <div style={{
        background: "linear-gradient(135deg, #fff7ed, #fef3c7)",
        border: "1.5px solid #fed7aa",
        borderRadius: 16,
        padding: "16px",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, flexShrink: 0,
          }}>🐕</div>
          <div>
            <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5, fontStyle: "italic" }}>
              "Desde que uso BuddyPet, mi veterinaria puede ver el historial completo de Max antes de cada visita. La IA detectó que estaba un poco por encima de su peso ideal y ajustamos la dieta. ¡Ha perdido 2kg en 3 meses!"
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginTop: 6 }}>
              María G. · Dueña de Max (Golden Retriever, 5 años)
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{
        background: "linear-gradient(135deg, #1a0533, #2d0a5e)",
        borderRadius: 20,
        padding: "24px 20px",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>🐾</div>
        <h3 style={{ fontSize: 20, fontWeight: 900, color: "#fff", margin: "0 0 8px" }}>
          Dale lo mejor a tu mascota
        </h3>
        <p style={{ fontSize: 14, color: "#c4b5fd", margin: "0 0 20px" }}>
          Activa BuddyPet y empieza hoy mismo a cuidar<br />la salud y nutrición de tu compañero
        </p>
        <button
          onClick={() => navigate("/app/pricing?plan=premium")}
          style={{
            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
            color: "#fff", border: "none",
            borderRadius: 14, padding: "14px 32px",
            fontSize: 16, fontWeight: 800, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(124,58,237,0.5)",
            width: "100%", maxWidth: 320,
          }}
        >
          Activar Pro Max — 19,99€/mes →
        </button>
        <div style={{ fontSize: 12, color: "#7c3aed", marginTop: 10, opacity: 0.7 }}>
          También disponible en plan anual con 2 meses gratis
        </div>
      </div>

    </div>
  );
}
