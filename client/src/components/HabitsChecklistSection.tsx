import { useState } from "react";

function useInView(threshold = 0.1) {
  const [inView, setInView] = useState(false);
  const ref = (el: HTMLElement | null) => {
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
  };
  return { ref, inView };
}

interface Question {
  id: string;
  text: string;
  category: "hydration" | "meals" | "balance" | "planning" | "awareness";
  goodAnswer: boolean; // true = "Sí" is good, false = "No" is good
  tip: string;
}

const QUESTIONS: Question[] = [
  { id: "q1", text: "¿Bebes al menos 1,5 litros de agua al día?", category: "hydration", goodAnswer: true, tip: "La deshidratación reduce el metabolismo hasta un 3% y aumenta la sensación de hambre." },
  { id: "q2", text: "¿Desayunas dentro de la primera hora tras levantarte?", category: "meals", goodAnswer: true, tip: "Saltarse el desayuno eleva el cortisol y favorece el almacenamiento de grasa abdominal." },
  { id: "q3", text: "¿Comes fruta o verdura en al menos 2 comidas al día?", category: "balance", goodAnswer: true, tip: "Las frutas y verduras aportan fibra, vitaminas y antioxidantes esenciales para el metabolismo." },
  { id: "q4", text: "¿Sueles saltarte comidas o pasar más de 5 horas sin comer?", category: "meals", goodAnswer: false, tip: "Los ayunos no planificados disparan el cortisol y generan atracones compensatorios." },
  { id: "q5", text: "¿Planificas tus comidas de la semana con antelación?", category: "planning", goodAnswer: true, tip: "Planificar reduce el consumo de ultraprocesados en un 40% según estudios de nutrición." },
  { id: "q6", text: "¿Consumes ultraprocesados (bollería, snacks, refrescos) más de 3 veces por semana?", category: "balance", goodAnswer: false, tip: "Los ultraprocesados alteran la microbiota intestinal y generan inflamación crónica." },
  { id: "q7", text: "¿Sabes cuántas calorías aproximadas consumes al día?", category: "awareness", goodAnswer: true, tip: "El conocimiento calórico mejora la toma de decisiones alimentarias en un 60%." },
  { id: "q8", text: "¿Incluyes proteína (carne, legumbres, huevos, tofu) en cada comida principal?", category: "balance", goodAnswer: true, tip: "La proteína aumenta la saciedad y preserva la masa muscular durante la pérdida de peso." },
  { id: "q9", text: "¿Comes frente a pantallas (TV, móvil) con frecuencia?", category: "awareness", goodAnswer: false, tip: "Comer con distracciones aumenta el consumo calórico hasta un 25% por falta de atención plena." },
  { id: "q10", text: "¿Tienes en cuenta las alergias o intolerancias al planificar tus menús?", category: "planning", goodAnswer: true, tip: "Ignorar intolerancias (como la lactosa o el gluten) genera inflamación intestinal silenciosa." },
];

const CATEGORY_LABELS: Record<string, string> = {
  hydration: "Hidratación",
  meals: "Horarios de comida",
  balance: "Equilibrio nutricional",
  planning: "Planificación",
  awareness: "Conciencia alimentaria",
};

const CATEGORY_COLORS: Record<string, string> = {
  hydration: "#3b82f6",
  meals: "#F97316",
  balance: "#10b981",
  planning: "#8b5cf6",
  awareness: "#f59e0b",
};

interface Props { appUrl: string; }

export default function HabitsChecklistSection({ appUrl }: Props) {
  const section = useInView(0.1);
  const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
  const [showResults, setShowResults] = useState(false);

  const answered = Object.keys(answers).length;
  const total = QUESTIONS.length;
  const progress = Math.round((answered / total) * 100);

  const handleAnswer = (id: string, value: boolean) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const calculateScore = () => {
    let score = 0;
    QUESTIONS.forEach(q => {
      const ans = answers[q.id];
      if (ans === null || ans === undefined) return;
      if (q.goodAnswer === ans) score++;
    });
    return score;
  };

  const getScoreInfo = (score: number) => {
    const pct = (score / total) * 100;
    if (pct >= 80) return { label: "Excelente", desc: "Tu alimentación está muy bien encaminada. BuddyMarket puede ayudarte a optimizar los últimos detalles.", color: "#10b981", emoji: "🏆" };
    if (pct >= 60) return { label: "Buena base", desc: "Tienes buenos hábitos pero hay margen de mejora. Hay algunos errores clave que están frenando tus resultados.", color: "#F97316", emoji: "📈" };
    if (pct >= 40) return { label: "Necesita mejoras", desc: "Estás cometiendo varios errores nutricionales que pueden afectar tu energía, peso y salud a largo plazo.", color: "#f59e0b", emoji: "⚠️" };
    return { label: "Atención urgente", desc: "Tu alimentación actual puede estar perjudicando tu salud. Es el momento ideal para empezar a cambiar con ayuda.", color: "#ef4444", emoji: "🚨" };
  };

  const score = calculateScore();
  const scoreInfo = getScoreInfo(score);

  const wrongAnswers = QUESTIONS.filter(q => {
    const ans = answers[q.id];
    return ans !== null && ans !== undefined && q.goodAnswer !== ans;
  });

  const canShowResults = answered >= Math.ceil(total * 0.7);

  return (
    <section
      ref={section.ref as any}
      id="checklist"
      style={{ padding: "96px 24px", background: "white" }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          textAlign: "center", marginBottom: 52,
          opacity: section.inView ? 1 : 0,
          transform: section.inView ? "translateY(0)" : "translateY(24px)",
          transition: "all 0.7s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 100, background: "#f0fdf4", border: "1.5px solid #bbf7d0", fontSize: 13, fontWeight: 700, color: "#059669", marginBottom: 16 }}>
            Análisis de hábitos nutricionales
          </div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 48px)", fontWeight: 900, color: "#111827", margin: "0 0 16px", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            ¿Estás comiendo bien<br />o cometiendo errores?
          </h2>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#6b7280", maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
            Responde estas 10 preguntas y descubre qué hábitos están saboteando tu nutrición sin que lo sepas.
          </p>
        </div>

        {/* Progress bar */}
        <div style={{
          marginBottom: 36,
          opacity: section.inView ? 1 : 0,
          transition: "opacity 0.6s 0.2s",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Progreso</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#F97316" }}>{answered}/{total} respondidas</span>
          </div>
          <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #F97316, #ea580c)", borderRadius: 4, transition: "width 0.4s" }} />
          </div>
        </div>

        {/* Questions */}
        {!showResults && (
          <div style={{
            display: "flex", flexDirection: "column", gap: 14,
            opacity: section.inView ? 1 : 0,
            transform: section.inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.8s cubic-bezier(0.16,1,0.3,1) 0.2s",
          }}>
            {QUESTIONS.map((q, i) => {
              const ans = answers[q.id];
              const isAnswered = ans !== null && ans !== undefined;
              const isCorrect = isAnswered && q.goodAnswer === ans;

              return (
                <div key={q.id} style={{
                  background: isAnswered ? (isCorrect ? "#f0fdf4" : "#fff7ed") : "#f9fafb",
                  borderRadius: 16, padding: "20px 24px",
                  border: isAnswered ? `1.5px solid ${isCorrect ? "#bbf7d0" : "#fed7aa"}` : "1.5px solid #f3f4f6",
                  transition: "all 0.3s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: CATEGORY_COLORS[q.category] + "15", color: CATEGORY_COLORS[q.category], textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          {CATEGORY_LABELS[q.category]}
                        </span>
                        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>#{i + 1}</span>
                      </div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#111827", lineHeight: 1.5, margin: 0 }}>{q.text}</p>
                      {isAnswered && !isCorrect && (
                        <p style={{ fontSize: 13, color: "#92400e", marginTop: 8, lineHeight: 1.5, padding: "8px 12px", background: "#fef3c7", borderRadius: 8 }}>
                          {q.tip}
                        </p>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {[true, false].map(v => (
                        <button key={String(v)} onClick={() => handleAnswer(q.id, v)} style={{
                          padding: "9px 20px", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                          background: ans === v ? (v ? "#10b981" : "#ef4444") : "white",
                          color: ans === v ? "white" : "#374151",
                          border: ans === v ? `2px solid ${v ? "#10b981" : "#ef4444"}` : "2px solid #e5e7eb",
                        }}>
                          {v ? "Sí" : "No"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Show results button */}
            <div style={{ textAlign: "center", marginTop: 16 }}>
              {!canShowResults && (
                <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 12 }}>Responde al menos {Math.ceil(total * 0.7)} preguntas para ver tu análisis</p>
              )}
              <button onClick={() => setShowResults(true)} disabled={!canShowResults} style={{
                padding: "16px 40px", borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: canShowResults ? "pointer" : "not-allowed",
                background: canShowResults ? "linear-gradient(135deg, #F97316, #ea580c)" : "#e5e7eb",
                color: canShowResults ? "white" : "#9ca3af", border: "none",
                boxShadow: canShowResults ? "0 8px 24px rgba(249,115,22,0.35)" : "none",
                transition: "all 0.2s",
              }}>
                Ver mi análisis nutricional
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {showResults && (
          <div style={{ animation: "fadeInUp 0.5s ease" }}>
            {/* Score card */}
            <div style={{
              background: `linear-gradient(135deg, ${scoreInfo.color}15, ${scoreInfo.color}05)`,
              border: `2px solid ${scoreInfo.color}40`,
              borderRadius: 24, padding: "36px 32px", textAlign: "center", marginBottom: 32,
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>{scoreInfo.emoji}</div>
              <h3 style={{ fontSize: 28, fontWeight: 900, color: "#111827", marginBottom: 8 }}>
                {score}/{total} hábitos correctos — {scoreInfo.label}
              </h3>
              <p style={{ fontSize: 16, color: "#4b5563", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 24px" }}>{scoreInfo.desc}</p>

              {/* Score bar */}
              <div style={{ height: 12, background: "#e5e7eb", borderRadius: 6, overflow: "hidden", maxWidth: 400, margin: "0 auto 8px" }}>
                <div style={{ height: "100%", width: `${(score / total) * 100}%`, background: scoreInfo.color, borderRadius: 6, transition: "width 1s" }} />
              </div>
              <p style={{ fontSize: 13, color: "#9ca3af" }}>{Math.round((score / total) * 100)}% de hábitos saludables</p>
            </div>

            {/* Errors */}
            {wrongAnswers.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h4 style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 16 }}>
                  Errores detectados ({wrongAnswers.length})
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {wrongAnswers.map(q => (
                    <div key={q.id} style={{ background: "#fff7ed", borderRadius: 14, padding: "16px 20px", border: "1.5px solid #fed7aa", display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ef444420", border: "2px solid #ef4444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{q.text}</p>
                        <p style={{ fontSize: 13, color: "#92400e", lineHeight: 1.5 }}>{q.tip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div style={{ background: "linear-gradient(135deg, #fff7ed, #fef3c7)", borderRadius: 20, padding: "32px", textAlign: "center", border: "1.5px solid #fed7aa" }}>
              <h4 style={{ fontSize: 20, fontWeight: 900, color: "#111827", marginBottom: 8 }}>
                BuddyMarket corrige estos errores automáticamente
              </h4>
              <p style={{ fontSize: 15, color: "#4b5563", lineHeight: 1.7, marginBottom: 24 }}>
                Genera menús personalizados que se adaptan a tus hábitos, corrigen tus carencias nutricionales y te ayudan a alcanzar tus objetivos sin esfuerzo.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <a href={appUrl} style={{
                  display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 32px", borderRadius: 12, fontSize: 15, fontWeight: 800, color: "white",
                  background: "linear-gradient(135deg, #F97316, #ea580c)", textDecoration: "none",
                  boxShadow: "0 8px 24px rgba(249,115,22,0.35)", transition: "all 0.2s",
                }}>
                  Empezar gratis ahora
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </a>
                <button onClick={() => { setShowResults(false); setAnswers({}); }} style={{
                  padding: "15px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer",
                  background: "white", color: "#374151", border: "2px solid #e5e7eb", transition: "all 0.2s",
                }}>
                  Repetir test
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
