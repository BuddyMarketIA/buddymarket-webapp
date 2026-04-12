import { useState, useMemo } from "react";
import { Link } from "wouter";

// ─── Types ────────────────────────────────────────────────────────────────────
type Sex = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type Goal = "lose" | "maintain" | "gain";
type Tab = "calculator" | "test";

interface CalcInputs {
  age: string;
  weight: string;
  height: string;
  sex: Sex;
  activity: ActivityLevel;
  goal: Goal;
}

interface CalcResult {
  bmr: number;
  tdee: number;
  target: number;
  bmi: number;
  bmiLabel: string;
  bmiColor: string;
  protein: number;
  carbs: number;
  fat: number;
}

// ─── Test questions ───────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    id: "breakfast",
    text: "¿Desayunas todos los días?",
    options: [
      { label: "Sí, siempre", score: 0 },
      { label: "A veces", score: 1 },
      { label: "Casi nunca o nunca", score: 2 },
    ],
    badHabit: "Saltarte el desayuno ralentiza tu metabolismo y aumenta el picoteo a media mañana.",
  },
  {
    id: "water",
    text: "¿Cuánta agua bebes al día?",
    options: [
      { label: "Más de 1,5 litros", score: 0 },
      { label: "Entre 1 y 1,5 litros", score: 1 },
      { label: "Menos de 1 litro", score: 2 },
    ],
    badHabit: "La deshidratación se confunde con hambre y reduce tu rendimiento físico y mental hasta un 20%.",
  },
  {
    id: "processed",
    text: "¿Con qué frecuencia consumes ultraprocesados (bollería, snacks, refrescos)?",
    options: [
      { label: "Raramente o nunca", score: 0 },
      { label: "2-3 veces por semana", score: 1 },
      { label: "Todos los días", score: 2 },
    ],
    badHabit: "Los ultraprocesados están diseñados para que comas más de lo que necesitas. Son el principal saboteador de cualquier objetivo nutricional.",
  },
  {
    id: "meals",
    text: "¿Cuántas comidas principales haces al día?",
    options: [
      { label: "3-5 comidas regulares", score: 0 },
      { label: "2 comidas", score: 1 },
      { label: "1 comida o picoteo constante", score: 2 },
    ],
    badHabit: "Comer pocas veces o picar constantemente desregula la insulina y dificulta el control del peso.",
  },
  {
    id: "labels",
    text: "¿Lees las etiquetas nutricionales cuando compras?",
    options: [
      { label: "Siempre o casi siempre", score: 0 },
      { label: "A veces", score: 1 },
      { label: "Nunca", score: 2 },
    ],
    badHabit: "Sin leer etiquetas, es imposible saber lo que realmente estás comiendo. Muchos productos 'saludables' tienen más azúcar que un refresco.",
  },
  {
    id: "planning",
    text: "¿Planificas tu menú semanal antes de hacer la compra?",
    options: [
      { label: "Sí, siempre", score: 0 },
      { label: "A veces", score: 1 },
      { label: "Nunca, compro sobre la marcha", score: 2 },
    ],
    badHabit: "Sin planificación, acabas comprando lo que no necesitas, tirando comida y recurriendo a opciones poco saludables cuando no sabes qué cocinar.",
  },
  {
    id: "vegetables",
    text: "¿Cuántas raciones de frutas y verduras comes al día?",
    options: [
      { label: "5 o más", score: 0 },
      { label: "2-4", score: 1 },
      { label: "0-1", score: 2 },
    ],
    badHabit: "La OMS recomienda mínimo 5 raciones diarias. Con menos de 2, tu ingesta de fibra, vitaminas y antioxidantes es insuficiente.",
  },
  {
    id: "speed",
    text: "¿A qué velocidad comes normalmente?",
    options: [
      { label: "Despacio, masticando bien", score: 0 },
      { label: "A un ritmo normal", score: 1 },
      { label: "Muy rápido, casi sin masticar", score: 2 },
    ],
    badHabit: "Comer rápido impide que la señal de saciedad llegue al cerebro a tiempo. Comes hasta un 30% más de lo necesario sin darte cuenta.",
  },
  {
    id: "sleep",
    text: "¿Cuántas horas duermes de media?",
    options: [
      { label: "7-9 horas", score: 0 },
      { label: "6-7 horas", score: 1 },
      { label: "Menos de 6 horas", score: 2 },
    ],
    badHabit: "Dormir menos de 6 horas aumenta el cortisol y la grelina (hormona del hambre), haciendo que comas más y acumules más grasa abdominal.",
  },
  {
    id: "cooking",
    text: "¿Cocinas en casa la mayoría de tus comidas?",
    options: [
      { label: "Sí, más del 80% de las veces", score: 0 },
      { label: "La mitad de las veces", score: 1 },
      { label: "Casi nunca, como fuera o pido comida", score: 2 },
    ],
    badHabit: "Comer fuera habitualmente multiplica el consumo de sal, grasas saturadas y calorías ocultas. Cocinar en casa es la herramienta más poderosa para controlar tu alimentación.",
  },
  {
    id: "protein",
    text: "¿Incluyes proteína (carne, pescado, huevos, legumbres) en cada comida principal?",
    options: [
      { label: "Sí, en todas", score: 0 },
      { label: "En algunas", score: 1 },
      { label: "Raramente", score: 2 },
    ],
    badHabit: "Sin suficiente proteína en cada comida, perderás masa muscular, tendrás más hambre y tu metabolismo se ralentizará.",
  },
  {
    id: "stress",
    text: "¿Comes por ansiedad o estrés aunque no tengas hambre?",
    options: [
      { label: "Raramente o nunca", score: 0 },
      { label: "A veces", score: 1 },
      { label: "Con frecuencia", score: 2 },
    ],
    badHabit: "La alimentación emocional es uno de los principales obstáculos para mantener un peso saludable. Identificar los desencadenantes es el primer paso para controlarlo.",
  },
];

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentario (sin ejercicio)",
  light: "Ligero (1-3 días/semana)",
  moderate: "Moderado (3-5 días/semana)",
  active: "Activo (6-7 días/semana)",
  very_active: "Muy activo (2 veces/día)",
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_LABELS: Record<Goal, string> = {
  lose: "Perder peso (-500 kcal)",
  maintain: "Mantener peso",
  gain: "Ganar músculo (+300 kcal)",
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

// ─── Calculator logic ─────────────────────────────────────────────────────────
function calculate(inputs: CalcInputs): CalcResult | null {
  const age = parseInt(inputs.age);
  const weight = parseFloat(inputs.weight);
  const height = parseFloat(inputs.height);
  if (!age || !weight || !height || age < 10 || weight < 30 || height < 100) return null;

  // Mifflin-St Jeor
  const bmr =
    inputs.sex === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const tdee = bmr * ACTIVITY_MULTIPLIERS[inputs.activity];
  const target = tdee + GOAL_ADJUSTMENTS[inputs.goal];

  const bmi = weight / ((height / 100) ** 2);
  let bmiLabel = "";
  let bmiColor = "";
  if (bmi < 18.5) { bmiLabel = "Bajo peso"; bmiColor = "#3B82F6"; }
  else if (bmi < 25) { bmiLabel = "Peso normal"; bmiColor = "#22C55E"; }
  else if (bmi < 30) { bmiLabel = "Sobrepeso"; bmiColor = "#F59E0B"; }
  else { bmiLabel = "Obesidad"; bmiColor = "#EF4444"; }

  // Macros (protein 30%, carbs 40%, fat 30%)
  const protein = Math.round((target * 0.30) / 4);
  const carbs = Math.round((target * 0.40) / 4);
  const fat = Math.round((target * 0.30) / 9);

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), target: Math.round(target), bmi: Math.round(bmi * 10) / 10, bmiLabel, bmiColor, protein, carbs, fat };
}

// ─── Components ───────────────────────────────────────────────────────────────

function MacroBar({ label, grams, kcal, color }: { label: string; grams: number; kcal: number; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>
        {grams}g
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</span>
      <span style={{ fontSize: 11, color: "#9CA3AF" }}>{kcal} kcal</span>
    </div>
  );
}

function Calculator() {
  const [inputs, setInputs] = useState<CalcInputs>({
    age: "", weight: "", height: "", sex: "female", activity: "moderate", goal: "maintain",
  });
  const [showResult, setShowResult] = useState(false);

  const result = useMemo(() => calculate(inputs), [inputs]);

  const set = (k: keyof CalcInputs, v: string) => {
    setInputs(prev => ({ ...prev, [k]: v }));
    setShowResult(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 12, border: "1.5px solid #E5E7EB",
    fontSize: 15, outline: "none", background: "#FAFAFA", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block" };
  const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "none" };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Sexo */}
        <div style={{ gridColumn: "1 / -1" }}>
          <span style={labelStyle}>Sexo biológico</span>
          <div style={{ display: "flex", gap: 10 }}>
            {(["female", "male"] as Sex[]).map(s => (
              <button key={s} onClick={() => set("sex", s)} style={{
                flex: 1, padding: "10px 0", borderRadius: 12, border: "1.5px solid",
                borderColor: inputs.sex === s ? "#F97316" : "#E5E7EB",
                background: inputs.sex === s ? "#FFF7ED" : "#FAFAFA",
                color: inputs.sex === s ? "#F97316" : "#6B7280",
                fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>
                {s === "female" ? "👩 Mujer" : "👨 Hombre"}
              </button>
            ))}
          </div>
        </div>

        {/* Edad */}
        <div>
          <label style={labelStyle}>Edad</label>
          <input type="number" placeholder="30" value={inputs.age} onChange={e => set("age", e.target.value)} style={inputStyle} min={10} max={100} />
        </div>

        {/* Peso */}
        <div>
          <label style={labelStyle}>Peso (kg)</label>
          <input type="number" placeholder="65" value={inputs.weight} onChange={e => set("weight", e.target.value)} style={inputStyle} min={30} max={250} />
        </div>

        {/* Altura */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Altura (cm)</label>
          <input type="number" placeholder="165" value={inputs.height} onChange={e => set("height", e.target.value)} style={inputStyle} min={100} max={250} />
        </div>

        {/* Actividad */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Nivel de actividad</label>
          <select value={inputs.activity} onChange={e => set("activity", e.target.value)} style={selectStyle}>
            {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map(k => (
              <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
            ))}
          </select>
        </div>

        {/* Objetivo */}
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={labelStyle}>Objetivo</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.keys(GOAL_LABELS) as Goal[]).map(g => (
              <button key={g} onClick={() => set("goal", g)} style={{
                flex: "1 1 auto", padding: "9px 12px", borderRadius: 12, border: "1.5px solid",
                borderColor: inputs.goal === g ? "#F97316" : "#E5E7EB",
                background: inputs.goal === g ? "#FFF7ED" : "#FAFAFA",
                color: inputs.goal === g ? "#F97316" : "#6B7280",
                fontWeight: 600, fontSize: 13, cursor: "pointer",
              }}>
                {g === "lose" ? "⬇️ Perder peso" : g === "maintain" ? "⚖️ Mantener" : "💪 Ganar músculo"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => { if (result) setShowResult(true); }}
        disabled={!result}
        style={{
          width: "100%", marginTop: 20, padding: "14px 0", borderRadius: 14,
          background: result ? "linear-gradient(135deg, #F97316, #FB923C)" : "#E5E7EB",
          color: result ? "#fff" : "#9CA3AF", fontWeight: 700, fontSize: 16,
          border: "none", cursor: result ? "pointer" : "not-allowed",
        }}
      >
        Calcular mis necesidades
      </button>

      {showResult && result && (
        <div style={{ marginTop: 24, animation: "fadeIn 0.4s ease" }}>
          {/* IMC */}
          <div style={{ background: "#F9FAFB", borderRadius: 16, padding: 20, marginBottom: 16, border: "1.5px solid #E5E7EB" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Índice de Masa Corporal</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: result.bmiColor }}>{result.bmi}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: result.bmiColor }}>{result.bmiLabel}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, color: "#6B7280", fontWeight: 500 }}>Metabolismo basal</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#111827" }}>{result.bmr} <span style={{ fontSize: 14, fontWeight: 500 }}>kcal</span></div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>en reposo absoluto</div>
              </div>
            </div>
          </div>

          {/* Calorías objetivo */}
          <div style={{
            background: "linear-gradient(135deg, #F97316, #FB923C)", borderRadius: 16,
            padding: 20, marginBottom: 16, color: "#fff", textAlign: "center",
          }}>
            <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 500 }}>Calorías diarias recomendadas para tu objetivo</div>
            <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.1 }}>{result.target}</div>
            <div style={{ fontSize: 14, opacity: 0.85 }}>kcal/día · TDEE: {result.tdee} kcal</div>
          </div>

          {/* Macros */}
          <div style={{ background: "#F9FAFB", borderRadius: 16, padding: 20, border: "1.5px solid #E5E7EB" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 16 }}>Distribución de macronutrientes</div>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <MacroBar label="Proteínas" grams={result.protein} kcal={result.protein * 4} color="#F97316" />
              <MacroBar label="Carbohidratos" grams={result.carbs} kcal={result.carbs * 4} color="#3B82F6" />
              <MacroBar label="Grasas" grams={result.fat} kcal={result.fat * 9} color="#8B5CF6" />
            </div>
          </div>

          {/* Disclaimer */}
          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
            Estos valores son orientativos. Consulta con un profesional de la salud o nutricionista antes de realizar cambios significativos en tu dieta.
          </p>

          {/* CTA */}
          <div style={{ marginTop: 20, background: "#FFF7ED", borderRadius: 16, padding: 20, border: "1.5px solid #FED7AA", textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 6 }}>¿Quieres seguir estos objetivos automáticamente?</div>
            <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>BuddyMarket registra tus comidas, genera menús adaptados a tus macros y hace la lista de la compra por ti.</div>
            <Link href="/register">
              <button style={{
                padding: "13px 32px", borderRadius: 14, background: "linear-gradient(135deg, #F97316, #FB923C)",
                color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", width: "100%",
              }}>
                Empezar gratis con BuddyMarket →
              </button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function HabitsTest() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const badHabits = QUESTIONS.filter(q => (answers[q.id] ?? 0) >= 1)
    .sort((a, b) => (answers[b.id] ?? 0) - (answers[a.id] ?? 0));

  const allAnswered = Object.keys(answers).length === QUESTIONS.length;

  const getDiagnosis = () => {
    if (totalScore <= 4) return { label: "Excelente", color: "#22C55E", emoji: "🌟", text: "Tienes muy buenos hábitos alimentarios. BuddyMarket te ayudará a mantenerlos y optimizarlos." };
    if (totalScore <= 9) return { label: "Mejorable", color: "#F59E0B", emoji: "⚠️", text: "Tienes algunos hábitos que están frenando tus resultados. Con pequeños cambios verás grandes mejoras." };
    if (totalScore <= 15) return { label: "Necesita cambios", color: "#F97316", emoji: "🔥", text: "Varios hábitos están saboteando tu salud y tu peso. Es el momento de actuar." };
    return { label: "Urgente", color: "#EF4444", emoji: "🚨", text: "Tus hábitos actuales tienen un impacto negativo significativo en tu salud. BuddyMarket puede ayudarte a transformarlos paso a paso." };
  };

  const q = QUESTIONS[currentQ];

  if (showResult) {
    const diag = getDiagnosis();
    return (
      <div style={{ animation: "fadeIn 0.4s ease" }}>
        {/* Score */}
        <div style={{
          background: `linear-gradient(135deg, ${diag.color}22, ${diag.color}11)`,
          border: `1.5px solid ${diag.color}44`,
          borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 20,
        }}>
          <div style={{ fontSize: 40 }}>{diag.emoji}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: diag.color, marginTop: 8 }}>{diag.label}</div>
          <div style={{ fontSize: 14, color: "#374151", marginTop: 8, lineHeight: 1.6 }}>{diag.text}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 8 }}>
            Puntuación: <strong style={{ color: diag.color }}>{totalScore}</strong> / {QUESTIONS.length * 2} · {badHabits.length} hábitos a mejorar
          </div>
        </div>

        {/* Bad habits */}
        {badHabits.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
              🎯 Estos son los hábitos que te están frenando:
            </div>
            {badHabits.map((q, i) => (
              <div key={q.id} style={{
                background: "#FFF7ED", borderRadius: 12, padding: 14, marginBottom: 10,
                border: "1.5px solid #FED7AA",
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{
                    minWidth: 24, height: 24, borderRadius: "50%", background: "#F97316",
                    color: "#fff", fontSize: 12, fontWeight: 700, display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 4 }}>{q.text}</div>
                    <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>{q.badHabit}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ background: "#FFF7ED", borderRadius: 16, padding: 20, border: "1.5px solid #FED7AA", textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
            BuddyMarket te ayuda a corregir {badHabits.length > 0 ? `estos ${badHabits.length} hábitos` : "tus hábitos"} paso a paso
          </div>
          <div style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
            Menús personalizados, seguimiento diario, recetas adaptadas y listas de la compra inteligentes. Todo en un solo lugar.
          </div>
          <Link href="/register">
            <button style={{
              padding: "13px 32px", borderRadius: 14, background: "linear-gradient(135deg, #F97316, #FB923C)",
              color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", width: "100%",
            }}>
              Empezar gratis con BuddyMarket →
            </button>
          </Link>
        </div>

        <button onClick={() => { setAnswers({}); setShowResult(false); setCurrentQ(0); }} style={{
          width: "100%", marginTop: 12, padding: "11px 0", borderRadius: 12,
          background: "transparent", border: "1.5px solid #E5E7EB", color: "#6B7280",
          fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>
          Repetir el test
        </button>

        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 12, textAlign: "center", lineHeight: 1.5 }}>
          Este test es orientativo y no constituye un diagnóstico médico ni nutricional. Consulta con un profesional de la salud.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>Pregunta {currentQ + 1} de {QUESTIONS.length}</span>
          <span style={{ fontSize: 13, color: "#9CA3AF" }}>{Math.round(((currentQ) / QUESTIONS.length) * 100)}% completado</span>
        </div>
        <div style={{ height: 6, background: "#F3F4F6", borderRadius: 99 }}>
          <div style={{
            height: "100%", borderRadius: 99,
            background: "linear-gradient(90deg, #F97316, #FB923C)",
            width: `${(currentQ / QUESTIONS.length) * 100}%`,
            transition: "width 0.3s ease",
          }} />
        </div>
      </div>

      {/* Question */}
      <div style={{ background: "#F9FAFB", borderRadius: 16, padding: 20, marginBottom: 16, border: "1.5px solid #E5E7EB" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#111827", lineHeight: 1.5 }}>{q.text}</div>
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((opt, i) => {
          const selected = answers[q.id] === opt.score;
          return (
            <button
              key={i}
              onClick={() => {
                setAnswers(prev => ({ ...prev, [q.id]: opt.score }));
                setTimeout(() => {
                  if (currentQ < QUESTIONS.length - 1) {
                    setCurrentQ(prev => prev + 1);
                  }
                }, 300);
              }}
              style={{
                padding: "13px 16px", borderRadius: 12, border: "1.5px solid",
                borderColor: selected ? "#F97316" : "#E5E7EB",
                background: selected ? "#FFF7ED" : "#FAFAFA",
                color: selected ? "#F97316" : "#374151",
                fontWeight: selected ? 700 : 500, fontSize: 14,
                cursor: "pointer", textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        {currentQ > 0 && (
          <button onClick={() => setCurrentQ(prev => prev - 1)} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #E5E7EB",
            background: "transparent", color: "#6B7280", fontWeight: 600, fontSize: 14, cursor: "pointer",
          }}>
            ← Anterior
          </button>
        )}
        {currentQ < QUESTIONS.length - 1 && answers[q.id] !== undefined && (
          <button onClick={() => setCurrentQ(prev => prev + 1)} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #F97316, #FB923C)",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>
            Siguiente →
          </button>
        )}
        {allAnswered && (
          <button onClick={() => setShowResult(true)} style={{
            flex: 1, padding: "12px 0", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #F97316, #FB923C)",
            color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}>
            Ver mi diagnóstico →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Herramientas() {
  const [tab, setTab] = useState<Tab>("calculator");

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
        <Link href="/register">
          <button style={{
            padding: "8px 18px", borderRadius: 10, background: "linear-gradient(135deg, #F97316, #FB923C)",
            color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
          }}>
            Empezar gratis
          </button>
        </Link>
      </div>

      {/* Hero */}
      <div style={{ padding: "32px 20px 24px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "inline-block", background: "#FFF7ED", border: "1.5px solid #FED7AA", borderRadius: 99, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#F97316", marginBottom: 12 }}>
          🛠️ Herramientas gratuitas
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#111827", lineHeight: 1.2, margin: "0 0 10px" }}>
          Descubre lo que realmente necesita tu cuerpo
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: 0 }}>
          Calcula tus calorías y macros exactos, o descubre qué hábitos te están frenando sin que lo sepas.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 20px" }}>
        <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 14, padding: 4, marginBottom: 24 }}>
          {([
            { key: "calculator", label: "🧮 Calculadora nutricional" },
            { key: "test", label: "🔍 Test de hábitos" },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: "10px 8px", borderRadius: 11, border: "none",
                background: tab === t.key ? "#fff" : "transparent",
                color: tab === t.key ? "#F97316" : "#6B7280",
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: 13, cursor: "pointer",
                boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ background: "#fff", borderRadius: 20, padding: 24, boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #F3F4F6" }}>
          {tab === "calculator" ? (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>Calculadora nutricional</h2>
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 20px" }}>Basada en la fórmula Mifflin-St Jeor, la más precisa para adultos sanos.</p>
              <Calculator />
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>¿Qué estás haciendo mal?</h2>
              <p style={{ fontSize: 13, color: "#9CA3AF", margin: "0 0 20px" }}>12 preguntas para descubrir los hábitos que te están saboteando sin que lo sepas.</p>
              <HabitsTest />
            </>
          )}
        </div>

        {/* Footer disclaimer */}
        <div style={{ textAlign: "center", padding: "24px 0 32px" }}>
          <img src="/logo192.png" alt="BuddyMarket" style={{ width: 20, height: 20, borderRadius: 6, verticalAlign: "middle", marginRight: 6 }} />
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>
            BuddyMarket · Las herramientas son orientativas y no sustituyen el consejo de un profesional de la salud.
          </span>
        </div>
      </div>
    </div>
  );
}
