import { useState } from "react";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────
type CreatorType = "maker" | "expert";

// ─── Commission calculator ────────────────────────────────────────────────────
// Plans: Basic 4.99€, Premium 9.99€, Pro Max 19.99€
// Platform fees (Apple/Google 30%, Stripe ~3%): ~33% total
// Net per subscription ≈ price × 0.67 × 0.20
const PLAN_PRICES = [4.99, 9.99, 19.99];
const PLATFORM_FEE = 0.33;
const COMMISSION = 0.20;

function calcEarnings(followers: number, convRate: number, avgPlan: number) {
  const subs = Math.round(followers * (convRate / 100));
  const netPerSub = avgPlan * (1 - PLATFORM_FEE) * COMMISSION;
  const monthly = subs * netPerSub;
  const annual = monthly * 12;
  return { subs, monthly, annual, netPerSub };
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const DIFFERENCES = [
  {
    type: "maker" as CreatorType,
    emoji: "📸",
    title: "BuddyMaker",
    subtitle: "Creador de contenido",
    color: "#F97316",
    bg: "#FFF7ED",
    border: "#FED7AA",
    description: "Eres influencer, foodie o apasionado de la nutrición. Compartes recetas, consejos y tu estilo de vida saludable con tu comunidad.",
    requirements: ["Cuenta en redes sociales activa", "Pasión por la alimentación saludable", "Contenido original y auténtico"],
    benefits: ["Código de referido personalizado", "20% de comisión neta por suscripción", "Dashboard de seguimiento en tiempo real", "Materiales de marketing exclusivos", "Soporte prioritario"],
    cta: "Quiero ser BuddyMaker",
  },
  {
    type: "expert" as CreatorType,
    emoji: "🎓",
    title: "BuddyExpert",
    subtitle: "Nutricionista o dietista",
    color: "#8B5CF6",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    description: "Eres nutricionista, dietista o profesional de la salud. Ofreces planes personalizados y acompañamiento profesional a tus clientes.",
    requirements: ["Titulación en nutrición o dietética", "Número de colegiado (opcional)", "Experiencia con clientes"],
    benefits: ["Código de referido personalizado", "20% de comisión neta por suscripción", "Perfil verificado con badge profesional", "Gestión de clientes integrada", "Subida de planes nutricionales en PDF", "Stripe Connect para cobros directos"],
    cta: "Quiero ser BuddyExpert",
  },
];

const TESTIMONIALS = [
  {
    name: "Laura M.",
    role: "BuddyMaker · 28K seguidores",
    avatar: "👩‍🍳",
    text: "Llevo 3 meses como BuddyMaker y ya tengo 47 suscriptores activos. Son €47 al mes sin hacer nada extra, solo compartiendo lo que ya hacía.",
    earnings: "~€47/mes",
  },
  {
    name: "Carlos R.",
    role: "BuddyExpert · Nutricionista",
    avatar: "👨‍⚕️",
    text: "Mis clientes se suscriben a BuddyMarket con mi código y yo cobro una comisión mensual mientras ellos usan la app. Es un ingreso pasivo real.",
    earnings: "~€120/mes",
  },
  {
    name: "Ana P.",
    role: "BuddyMaker · 12K seguidores",
    avatar: "🏋️‍♀️",
    text: "No necesitas millones de seguidores. Con una comunidad pequeña pero comprometida, los resultados son sorprendentes.",
    earnings: "~€28/mes",
  },
];

const FAQS = [
  {
    q: "¿Cuánto cobro exactamente por cada suscripción?",
    a: "El 20% del ingreso neto de cada suscripción. El ingreso neto es el precio del plan menos las comisiones de plataformas de terceros (Apple App Store, Google Play, Stripe). Por ejemplo, para un plan de 9.99€/mes, recibirías aproximadamente 1.34€ por cada suscriptor activo cada mes.",
  },
  {
    q: "¿Cuándo y cómo cobro mis comisiones?",
    a: "Las comisiones se acumulan mensualmente y se pagan el primer día hábil del mes siguiente. Los BuddyExperts cobran directamente via Stripe Connect. Los BuddyMakers reciben transferencia bancaria o PayPal.",
  },
  {
    q: "¿Cuánto tiempo dura la comisión?",
    a: "Mientras el usuario referido mantenga su suscripción activa. Si cancela y vuelve a suscribirse con tu código, vuelves a cobrar. No hay límite de tiempo.",
  },
  {
    q: "¿Necesito un mínimo de seguidores para ser BuddyMaker?",
    a: "No hay mínimo. Lo que importa es la calidad de tu comunidad, no el tamaño. Muchos BuddyMakers con 2.000 seguidores muy comprometidos generan más conversiones que otros con 50.000 seguidores pasivos.",
  },
  {
    q: "¿Puedo ser BuddyMaker y BuddyExpert a la vez?",
    a: "Sí, si tienes titulación en nutrición y también creas contenido, puedes optar a ambas categorías y acumular los beneficios de las dos.",
  },
  {
    q: "¿Qué pasa si un usuario se suscribe sin mi código?",
    a: "Solo se aplica la comisión si el usuario usa tu código de referido en el momento del registro. Por eso es importante que compartas tu código de forma visible y frecuente.",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────
function EarningsCalculator() {
  const [followers, setFollowers] = useState(5000);
  const [convRate, setConvRate] = useState(1);
  const [avgPlan, setAvgPlan] = useState(9.99);

  const { subs, monthly, annual, netPerSub } = calcEarnings(followers, convRate, avgPlan);

  const formatCurrency = (n: number) =>
    n.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 2px 20px rgba(0,0,0,0.08)", border: "1px solid #F3F4F6" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 4 }}>💰 Calculadora de ingresos</div>
      <div style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Descubre cuánto podrías ganar con tu comunidad</div>

      {/* Followers slider */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Seguidores / audiencia</label>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#F97316" }}>{followers.toLocaleString("es-ES")}</span>
        </div>
        <input
          type="range" min={500} max={500000} step={500} value={followers}
          onChange={e => setFollowers(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#F97316" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
          <span>500</span><span>500K</span>
        </div>
      </div>

      {/* Conversion rate */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Tasa de conversión estimada</label>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#F97316" }}>{convRate}%</span>
        </div>
        <input
          type="range" min={0.5} max={10} step={0.5} value={convRate}
          onChange={e => setConvRate(Number(e.target.value))}
          style={{ width: "100%", accentColor: "#F97316" }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
          <span>0.5% (frío)</span><span>10% (muy comprometido)</span>
        </div>
      </div>

      {/* Plan selector */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Plan medio de tus referidos</label>
        <div style={{ display: "flex", gap: 8 }}>
          {PLAN_PRICES.map(p => (
            <button key={p} onClick={() => setAvgPlan(p)} style={{
              flex: 1, padding: "9px 4px", borderRadius: 10, border: "1.5px solid",
              borderColor: avgPlan === p ? "#F97316" : "#E5E7EB",
              background: avgPlan === p ? "#FFF7ED" : "#FAFAFA",
              color: avgPlan === p ? "#F97316" : "#6B7280",
              fontWeight: avgPlan === p ? 700 : 500, fontSize: 13, cursor: "pointer",
            }}>
              {p}€
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ background: "linear-gradient(135deg, #F97316, #FB923C)", borderRadius: 16, padding: 20, color: "#fff", textAlign: "center" }}>
        <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>Con {subs} suscriptores activos · {netPerSub.toFixed(2)}€/suscriptor/mes</div>
        <div style={{ fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{formatCurrency(monthly)}</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginTop: 4 }}>al mes · <strong>{formatCurrency(annual)}</strong> al año</div>
      </div>

      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
        Estimación orientativa. La comisión real es el 20% del ingreso neto tras comisiones de plataformas de terceros (Apple, Google, Stripe ~33%).
      </p>
    </div>
  );
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: 16, marginBottom: 16 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", lineHeight: 1.5 }}>{q}</span>
        <span style={{ fontSize: 18, color: "#F97316", flexShrink: 0, marginTop: 1 }}>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.7, marginTop: 10, paddingRight: 24 }}>{a}</div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Creators() {
  const [activeType, setActiveType] = useState<CreatorType>("maker");

  return (
    <div style={{ minHeight: "100vh", background: "#FEFCE8", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E5E7EB", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <img src="/logo192.png" alt="BuddyMarket" style={{ width: 28, height: 28, borderRadius: 8 }} />
            <span style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>BuddyMarket</span>
          </div>
        </Link>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/creator-dashboard">
            <button style={{ padding: "8px 14px", borderRadius: 10, border: "1.5px solid #F97316", background: "#FFF7ED", color: "#F97316", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              Mi panel
            </button>
          </Link>
          <Link href="/login">
            <button style={{ padding: "8px 14px", borderRadius: 10, border: "1.5px solid #E5E7EB", background: "transparent", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Entrar
            </button>
          </Link>
          <Link href="/register">
            <button style={{ padding: "8px 16px", borderRadius: 10, background: "linear-gradient(135deg, #F97316, #FB923C)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
              Registrarse
            </button>
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>

        {/* Hero */}
        <div style={{ padding: "36px 0 28px", textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#F97316", marginBottom: 14 }}>
            💼 Programa de creadores
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#111827", lineHeight: 1.2, margin: "0 0 12px" }}>
            Convierte tu pasión por la nutrición en ingresos recurrentes
          </h1>
          <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, margin: "0 0 24px" }}>
            Comparte tu código de referido con tu comunidad y gana el <strong style={{ color: "#F97316" }}>20% de comisión neta</strong> por cada suscripción activa, mes tras mes.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { emoji: "♾️", text: "Sin límite de tiempo" },
              { emoji: "📊", text: "Dashboard en tiempo real" },
              { emoji: "💳", text: "Cobro mensual automático" },
            ].map(item => (
              <div key={item.text} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 99, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {item.emoji} {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Earnings calculator */}
        <EarningsCalculator />

        {/* BuddyMaker vs BuddyExpert */}
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: 6 }}>¿Cuál eres tú?</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF", textAlign: "center", marginBottom: 20 }}>Dos perfiles, los mismos beneficios económicos</p>

          {/* Tabs */}
          <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 14, padding: 4, marginBottom: 20 }}>
            {DIFFERENCES.map(d => (
              <button key={d.type} onClick={() => setActiveType(d.type)} style={{
                flex: 1, padding: "10px 8px", borderRadius: 11, border: "none",
                background: activeType === d.type ? "#fff" : "transparent",
                color: activeType === d.type ? d.color : "#6B7280",
                fontWeight: activeType === d.type ? 700 : 500,
                fontSize: 13, cursor: "pointer",
                boxShadow: activeType === d.type ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s ease",
              }}>
                {d.emoji} {d.title}
              </button>
            ))}
          </div>

          {DIFFERENCES.filter(d => d.type === activeType).map(d => (
            <div key={d.type} style={{ background: d.bg, border: `1.5px solid ${d.border}`, borderRadius: 20, padding: 24, animation: "fadeIn 0.3s ease" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: d.color, marginBottom: 4 }}>{d.subtitle}</div>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 20 }}>{d.description}</p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Requisitos</div>
                {d.requirements.map((r, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ color: d.color, fontSize: 14, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 13, color: "#374151" }}>{r}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Beneficios</div>
                {d.benefits.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ color: d.color, fontSize: 14, marginTop: 1 }}>⭐</span>
                    <span style={{ fontSize: 13, color: "#374151" }}>{b}</span>
                  </div>
                ))}
              </div>

              <Link href="/register">
                <button style={{
                  width: "100%", padding: "14px 0", borderRadius: 14,
                  background: `linear-gradient(135deg, ${d.color}, ${d.color}CC)`,
                  color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer",
                }}>
                  {d.cta} →
                </button>
              </Link>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: 20 }}>¿Cómo funciona?</h2>
          {[
            { n: "1", title: "Regístrate gratis", desc: "Crea tu cuenta y solicita acceso al programa de creadores desde tu perfil." },
            { n: "2", title: "Recibe tu código", desc: "Te asignamos un código de referido único que puedes personalizar con tu nombre o marca." },
            { n: "3", title: "Compártelo con tu comunidad", desc: "Comparte tu código en redes sociales, stories, newsletters o directamente con tus clientes." },
            { n: "4", title: "Cobra cada mes", desc: "Por cada suscriptor activo que use tu código, recibes el 20% de comisión neta mes a mes." },
          ].map(step => (
            <div key={step.n} style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
              <div style={{
                minWidth: 40, height: 40, borderRadius: "50%",
                background: "linear-gradient(135deg, #F97316, #FB923C)",
                color: "#fff", fontWeight: 800, fontSize: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>{step.n}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: 20 }}>Lo que dicen nuestros creadores</h2>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 14, border: "1px solid #F3F4F6", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 32 }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{t.role}</div>
                </div>
                <div style={{ marginLeft: "auto", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 99, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: "#F97316" }}>
                  {t.earnings}
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>"{t.text}"</p>
            </div>
          ))}
        </div>

        {/* Commission breakdown */}
        <div style={{ marginTop: 32, background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #F3F4F6", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 4 }}>Transparencia total en comisiones</h2>
          <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>Así se calcula tu comisión para el plan Premium (9.99€/mes)</p>
          {[
            { label: "Precio del plan", value: "9.99€", color: "#111827" },
            { label: "Comisiones plataforma (Apple/Google/Stripe ~33%)", value: "−3.30€", color: "#EF4444" },
            { label: "Ingreso neto BuddyMarket", value: "6.69€", color: "#374151" },
            { label: "Tu comisión (20%)", value: "+1.34€/mes", color: "#22C55E", bold: true },
          ].map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 0", borderBottom: i < 3 ? "1px solid #F3F4F6" : "none",
            }}>
              <span style={{ fontSize: 13, color: "#6B7280" }}>{row.label}</span>
              <span style={{ fontSize: 14, fontWeight: row.bold ? 800 : 600, color: row.color }}>{row.value}</span>
            </div>
          ))}
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12, lineHeight: 1.5 }}>
            Las comisiones de plataformas varían según el canal de pago (web, iOS, Android). El porcentaje indicado es una estimación media.
          </p>
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", textAlign: "center", marginBottom: 20 }}>Preguntas frecuentes</h2>
          {FAQS.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} />)}
        </div>

        {/* Final CTA */}
        <div style={{ marginTop: 32, marginBottom: 48, background: "linear-gradient(135deg, #F97316, #FB923C)", borderRadius: 20, padding: 28, textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>¿Listo para empezar?</div>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 24, lineHeight: 1.6 }}>
            Regístrate gratis, solicita tu código de referido y empieza a generar ingresos recurrentes con tu comunidad.
          </div>
          <Link href="/register">
            <button style={{
              width: "100%", padding: "15px 0", borderRadius: 14,
              background: "#fff", color: "#F97316",
              fontWeight: 800, fontSize: 16, border: "none", cursor: "pointer",
            }}>
              Crear mi cuenta gratis →
            </button>
          </Link>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 12 }}>Sin coste · Sin permanencia · Comisiones desde el primer día</div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", paddingBottom: 32 }}>
          <img src="/logo192.png" alt="BuddyMarket" style={{ width: 20, height: 20, borderRadius: 6, verticalAlign: "middle", marginRight: 6 }} />
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
            BuddyMarket · Este programa no garantiza ingresos mínimos. Los resultados dependen de la actividad y conversión de cada creador.
          </span>
        </div>
      </div>
    </div>
  );
}
