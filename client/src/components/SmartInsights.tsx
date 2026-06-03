import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "@/components/sonner-a11y-shim";

const categoryConfig: Record<string, { label: string; gradient: string; icon: string }> = {
  nutrition_activity: { label: "Nutrición + Actividad", gradient: "from-orange-500 to-amber-500", icon: "🏋️" },
  sleep_nutrition: { label: "Sueño + Nutrición", gradient: "from-indigo-500 to-purple-500", icon: "😴" },
  recovery_nutrition: { label: "Recuperación + Nutrición", gradient: "from-emerald-500 to-teal-500", icon: "💪" },
  weight_goal: { label: "Objetivo de Peso", gradient: "from-rose-500 to-pink-500", icon: "⚖️" },
  hydration: { label: "Hidratación", gradient: "from-cyan-500 to-blue-500", icon: "💧" },
  stress_nutrition: { label: "Estrés + Nutrición", gradient: "from-violet-500 to-fuchsia-500", icon: "🧘" },
  performance: { label: "Rendimiento", gradient: "from-red-500 to-orange-500", icon: "🔥" },
  trend_alert: { label: "Alerta de Tendencia", gradient: "from-yellow-500 to-amber-600", icon: "📉" },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "Crítico", color: "text-red-700", bg: "bg-red-100" },
  high: { label: "Alta", color: "text-orange-700", bg: "bg-orange-100" },
  medium: { label: "Media", color: "text-yellow-700", bg: "bg-yellow-100" },
  low: { label: "Baja", color: "text-green-700", bg: "bg-green-100" },
};

type Insight = {
  icon: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  dataPoints: string;
};

interface SmartInsightsProps {
  compact?: boolean; // For Dashboard (shows fewer items)
}

export default function SmartInsights({ compact = false }: SmartInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dailySummary, setDailySummary] = useState("");
  const [overallScore, setOverallScore] = useState(0);
  const [hasRealData, setHasRealData] = useState(false);
  const [generated, setGenerated] = useState(false);

  const smartMutation = trpc.healthHub.smartInsights.useMutation({
    onSuccess: (data: any) => {
      setInsights(data.insights || []);
      setDailySummary(data.dailySummary || "");
      setOverallScore(data.overallScore || 0);
      setHasRealData(data.hasRealData || false);
      setGenerated(true);
      toast.success("Análisis inteligente completado");
    },
    onError: (err: any) => {
      toast.error(err.message || "Error al generar análisis");
    },
  });

  const feedbackMutation = trpc.healthHub.submitFeedback.useMutation({
    onSuccess: () => toast.success("Feedback registrado"),
  });

  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, "positive" | "negative">>({});

  const handleFeedback = (idx: number, insight: Insight, type: "positive" | "negative") => {
    setFeedbackGiven((prev) => ({ ...prev, [idx]: type }));
    feedbackMutation.mutate({
      insightTitle: insight.title,
      insightCategory: insight.category,
      insightDescription: insight.description,
      feedback: type,
    });
  };

  const displayInsights = compact ? insights.slice(0, 3) : insights;

  const scoreColor = overallScore >= 80 ? "text-emerald-600" : overallScore >= 60 ? "text-amber-600" : "text-red-600";
  const scoreRing = overallScore >= 80 ? "stroke-emerald-500" : overallScore >= 60 ? "stroke-amber-500" : "stroke-red-500";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white text-lg">
            🧠
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg">
              {compact ? "Tu Coach Inteligente" : "Análisis Inteligente"}
            </h3>
            <p className="text-xs text-muted-foreground">
              Cruza wearables + nutrición + objetivos
            </p>
          </div>
        </div>
        <button
          onClick={() => smartMutation.mutate()}
          disabled={smartMutation.isPending}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {smartMutation.isPending ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analizando...
            </>
          ) : generated ? (
            "Actualizar"
          ) : (
            "Generar análisis"
          )}
        </button>
      </div>

      {/* Score + Summary */}
      {generated && (
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <div className="flex items-center gap-4">
            {/* Score ring */}
            <div className="relative w-16 h-16 flex-shrink-0">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  className={scoreRing}
                  strokeWidth="3"
                  strokeDasharray={`${overallScore} ${100 - overallScore}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center font-bold text-lg ${scoreColor}`}>
                {overallScore}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground text-sm">Tu estado hoy</p>
              <p className="text-muted-foreground text-sm mt-0.5">{dailySummary}</p>
              {!hasRealData && (
                <span className="inline-block mt-1 text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                  Datos de demostración — conecta tus wearables y registra comidas para datos reales
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Insight Cards */}
      {generated && displayInsights.length > 0 && (
        <div className="space-y-3">
          {displayInsights.map((insight, idx) => {
            const cat = categoryConfig[insight.category] || categoryConfig.performance;
            const pri = priorityConfig[insight.priority] || priorityConfig.medium;
            const hasFeedback = feedbackGiven[idx];

            return (
              <div
                key={idx}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Color bar */}
                <div className={`h-1 bg-gradient-to-r ${cat.gradient}`} />
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{insight.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-foreground text-sm">{insight.title}</h4>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pri.bg} ${pri.color}`}>
                          {pri.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded-full">
                          {cat.label}
                        </span>
                      </div>
                      <p className="text-foreground/80 text-sm mt-1.5 leading-relaxed">{insight.description}</p>
                      {/* Data points */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {insight.dataPoints.split(",").map((dp, i) => (
                          <span key={i} className="text-[10px] bg-muted/30 text-muted-foreground px-2 py-0.5 rounded-full border border-border">
                            {dp.trim()}
                          </span>
                        ))}
                      </div>
                      {/* Feedback */}
                      <div className="mt-3 flex items-center gap-2">
                        {hasFeedback ? (
                          <span className={`text-xs ${hasFeedback === "positive" ? "text-emerald-600" : "text-red-500"}`}>
                            {hasFeedback === "positive" ? "👍 Te resultó útil" : "👎 Mejoraremos"}
                          </span>
                        ) : (
                          <>
                            <span className="text-xs text-muted-foreground/70">¿Útil?</span>
                            <button
                              onClick={() => handleFeedback(idx, insight, "positive")}
                              className="w-7 h-7 rounded-full bg-muted/30 hover:bg-emerald-50 flex items-center justify-center text-sm transition-colors"
                            >
                              👍
                            </button>
                            <button
                              onClick={() => handleFeedback(idx, insight, "negative")}
                              className="w-7 h-7 rounded-full bg-muted/30 hover:bg-red-50 flex items-center justify-center text-sm transition-colors"
                            >
                              👎
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!generated && !smartMutation.isPending && (
        <div className="bg-gradient-to-br from-orange-50 to-rose-50 rounded-2xl p-6 text-center border border-orange-100">
          <div className="text-4xl mb-3">🧠</div>
          <p className="font-semibold text-foreground">Tu coach personal con IA</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Analiza tus datos de sueño, actividad, recuperación y nutrición para darte
            recomendaciones personalizadas que te ayuden a alcanzar tus objetivos.
          </p>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Ejemplo: "Ayer te excediste en el deporte y comiste poca proteína. Hoy añade un batido post-entreno."
          </p>
        </div>
      )}

      {/* Loading state */}
      {smartMutation.isPending && (
        <div className="bg-card rounded-2xl border border-border p-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-200 to-rose-200 animate-bounce" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Analizando tus datos de wearables y nutrición...</p>
            <p className="text-xs text-muted-foreground/70">Cruzando sueño, actividad, comidas y objetivos</p>
          </div>
        </div>
      )}

      {/* Compact: link to Health Hub */}
      {compact && generated && insights.length > 3 && (
        <a
          href="/app/health-hub"
          className="block text-center text-sm text-orange-600 font-medium hover:text-orange-700 transition-colors"
        >
          Ver todas las recomendaciones →
        </a>
      )}
    </div>
  );
}
