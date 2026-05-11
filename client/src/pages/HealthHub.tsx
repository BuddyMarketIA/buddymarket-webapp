import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { toast } from "@/components/sonner-a11y-shim";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

// Mock data for demo (when no real wearable data exists)
const mockSleepData = [
  { date: "Lun", hours: 7.2, score: 82 },
  { date: "Mar", hours: 6.8, score: 74 },
  { date: "Mié", hours: 7.5, score: 86 },
  { date: "Jue", hours: 8.1, score: 91 },
  { date: "Vie", hours: 6.5, score: 68 },
  { date: "Sáb", hours: 8.5, score: 94 },
  { date: "Dom", hours: 7.8, score: 88 },
];

const mockRecoveryData = [
  { date: "Lun", score: 72 },
  { date: "Mar", score: 65 },
  { date: "Mié", score: 78 },
  { date: "Jue", score: 85 },
  { date: "Vie", score: 60 },
  { date: "Sáb", score: 90 },
  { date: "Dom", score: 82 },
];

const mockActivityData = [
  { date: "Lun", strain: 12.5, calories: 2100 },
  { date: "Mar", strain: 8.2, calories: 1800 },
  { date: "Mié", strain: 14.1, calories: 2400 },
  { date: "Jue", strain: 10.8, calories: 2000 },
  { date: "Vie", strain: 15.3, calories: 2600 },
  { date: "Sáb", strain: 6.5, calories: 1600 },
  { date: "Dom", strain: 9.7, calories: 1900 },
];

const educationalContent = [
  {
    id: "sleep",
    icon: "😴",
    title: "Sueño y Recuperación",
    description: "El sueño es el pilar fundamental de la recuperación. Durante el sueño profundo, tu cuerpo repara tejidos, consolida la memoria y regula hormonas clave como la hormona del crecimiento y el cortisol.",
    tips: [
      "Mantén un horario regular de sueño (±30 min)",
      "Evita pantallas 1h antes de dormir",
      "Temperatura ideal: 18-20°C",
      "Objetivo: 7-9 horas de sueño de calidad",
    ],
  },
  {
    id: "recovery",
    icon: "💚",
    title: "Recuperación (HRV)",
    description: "La Variabilidad de la Frecuencia Cardíaca (HRV) es el indicador más fiable de tu estado de recuperación. Un HRV alto indica que tu sistema nervioso está equilibrado y listo para el esfuerzo.",
    tips: [
      "HRV alto = buena recuperación, puedes entrenar fuerte",
      "HRV bajo = necesitas descanso o entrenamiento ligero",
      "La meditación y respiración mejoran el HRV",
      "El alcohol y el estrés reducen significativamente el HRV",
    ],
  },
  {
    id: "activity",
    icon: "🏃",
    title: "Actividad y Strain",
    description: "El strain (esfuerzo) mide la carga cardiovascular acumulada durante el día. Equilibrar el strain con la recuperación es clave para progresar sin sobreentrenamiento.",
    tips: [
      "Adapta la intensidad a tu nivel de recuperación",
      "Strain 0-9: día ligero | 10-13: moderado | 14+: intenso",
      "Incluye días de recuperación activa (strain 4-7)",
      "Monitoriza tendencias semanales, no solo días aislados",
    ],
  },
  {
    id: "hrv",
    icon: "❤️",
    title: "Frecuencia Cardíaca en Reposo",
    description: "Tu FC en reposo refleja la eficiencia cardiovascular. Con el tiempo, un corazón más entrenado bombea más sangre por latido, reduciendo la FC en reposo.",
    tips: [
      "FC en reposo baja = mejor condición cardiovascular",
      "Aumentos súbitos pueden indicar enfermedad o sobreentrenamiento",
      "Mídela siempre al despertar para mayor precisión",
      "Rango saludable: 50-70 lpm (deportistas: 40-60 lpm)",
    ],
  },
];

export default function HealthHub() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState<7 | 30 | 90>(7);
  const [activeTab, setActiveTab] = useState<"overview" | "sleep" | "recovery" | "activity" | "education">("overview");

  const { data: connections, isLoading: loadingConnections } = trpc.healthHub.getConnections.useQuery();
  const { data: wearableConnections, refetch: refetchConnections } = trpc.wearables.getConnections.useQuery();

  const ouraConnected = wearableConnections?.some((c: any) => c.wearableType === "oura" && c.isActive);
  const whoopConnected = wearableConnections?.some((c: any) => c.wearableType === "whoop" && c.isActive);

  const [connectingOura, setConnectingOura] = useState(false);
  const [connectingWhoop, setConnectingWhoop] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const disconnectMutation = trpc.wearables.disconnect.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchConnections();
      setDisconnecting(null);
    },
    onError: (e) => {
      toast.error("Error al desconectar: " + e.message);
      setDisconnecting(null);
    },
  });

  const handleConnectOura = async () => {
    setConnectingOura(true);
    try {
      const redirectUri = `${window.location.origin}/app/wearables`;
      // Use fetch to call the query endpoint with input
      const res = await fetch(`/api/trpc/wearables.getOuraAuthUrl?input=${encodeURIComponent(JSON.stringify({ redirectUri }))}`);
      const json = await res.json();
      if (json?.result?.data?.url) {
        toast.info("Redirigiendo a Oura Ring...");
        window.location.href = json.result.data.url;
      } else {
        toast.error("Oura Ring no está configurado. Contacta al administrador.");
      }
    } catch (e: any) {
      toast.error("Error al conectar Oura: " + (e?.message || "Error desconocido"));
    } finally {
      setConnectingOura(false);
    }
  };

  const handleConnectWhoop = async () => {
    setConnectingWhoop(true);
    try {
      const redirectUri = `${window.location.origin}/app/wearables`;
      const res = await fetch(`/api/trpc/wearables.getWhoopAuthUrl?input=${encodeURIComponent(JSON.stringify({ redirectUri }))}`);
      const json = await res.json();
      if (json?.result?.data?.url) {
        toast.info("Redirigiendo a Whoop...");
        window.location.href = json.result.data.url;
      } else {
        toast.error("Whoop no está configurado. Contacta al administrador.");
      }
    } catch (e: any) {
      toast.error("Error al conectar Whoop: " + (e?.message || "Error desconocido"));
    } finally {
      setConnectingWhoop(false);
    }
  };

  const handleDisconnect = (wearableType: "oura" | "whoop") => {
    setDisconnecting(wearableType);
    disconnectMutation.mutate({ wearableType });
  };

  // AI Insights state
  const [aiInsights, setAiInsights] = useState<Array<{ icon: string; title: string; description: string; category: string; priority: string }>>([]);
  const [insightsGeneratedAt, setInsightsGeneratedAt] = useState<number | null>(null);

  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, "positive" | "negative">>({});
  const [selectedCategories, setSelectedCategories] = useState<Array<"sleep" | "recovery" | "activity" | "nutrition" | "stress">>([]);

  const toggleCategory = (cat: "sleep" | "recovery" | "activity" | "nutrition" | "stress") => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const generateInsightsMutation = trpc.healthHub.generateInsights.useMutation({
    onSuccess: (data) => {
      setAiInsights(data.insights);
      setInsightsGeneratedAt(data.generatedAt);
      setFeedbackGiven({});
      toast.success("Insights generados correctamente");
    },
    onError: (e) => {
      toast.error("Error al generar insights: " + e.message);
    },
  });

  const submitFeedbackMutation = trpc.healthHub.submitFeedback.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (e) => {
      toast.error("Error al enviar feedback: " + e.message);
    },
  });

  const handleFeedback = (idx: number, insight: typeof aiInsights[0], feedback: "positive" | "negative") => {
    setFeedbackGiven(prev => ({ ...prev, [idx]: feedback }));
    submitFeedbackMutation.mutate({
      insightTitle: insight.title,
      insightCategory: insight.category,
      insightDescription: insight.description,
      feedback,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-4 md:p-6 pb-24">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Salud Conectada</h1>
            <p className="text-gray-500 mt-1">Tu centro de datos de bienestar</p>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDateRange(d as 7 | 30 | 90)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  dateRange === d
                    ? "bg-orange-500 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-orange-50 border border-gray-200"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/80 backdrop-blur-sm rounded-xl p-1 mb-6 overflow-x-auto border border-gray-100 shadow-sm">
          {[
            { id: "overview", label: "Resumen", icon: "📊" },
            { id: "sleep", label: "Sueño", icon: "😴" },
            { id: "recovery", label: "Recuperación", icon: "💚" },
            { id: "activity", label: "Actividad", icon: "🏃" },
            { id: "education", label: "Aprende", icon: "📚" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-orange-50"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Connection Status Cards */}
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Oura Ring Card */}
              <div className={`rounded-2xl p-5 border transition-all ${ouraConnected ? "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200" : "bg-white border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                      💍
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Oura Ring</h3>
                      <p className="text-sm text-gray-500">Sueño, HRV, Temperatura</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ouraConnected ? (
                      <>
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Conectado</span>
                        <button
                          onClick={() => handleDisconnect("oura")}
                          disabled={disconnecting === "oura"}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                        >
                          {disconnecting === "oura" ? (
                            <span className="flex items-center gap-1"><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Desconectando...</span>
                          ) : "Desconectar"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleConnectOura}
                        disabled={connectingOura}
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {connectingOura ? (
                          <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Conectando...</>
                        ) : "Conectar"}
                      </button>
                    )}
                  </div>
                </div>
                {ouraConnected && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-purple-700">86</p>
                      <p className="text-xs text-gray-500">Sleep Score</p>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-purple-700">45ms</p>
                      <p className="text-xs text-gray-500">HRV</p>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-purple-700">7.5h</p>
                      <p className="text-xs text-gray-500">Sueño</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Whoop Card */}
              <div className={`rounded-2xl p-5 border transition-all ${whoopConnected ? "bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200" : "bg-white border-gray-200"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-2xl">
                      ⌚
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Whoop</h3>
                      <p className="text-sm text-gray-500">Strain, Recuperación, Sueño</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {whoopConnected ? (
                      <>
                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">Conectado</span>
                        <button
                          onClick={() => handleDisconnect("whoop")}
                          disabled={disconnecting === "whoop"}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                        >
                          {disconnecting === "whoop" ? (
                            <span className="flex items-center gap-1"><svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Desconectando...</span>
                          ) : "Desconectar"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleConnectWhoop}
                        disabled={connectingWhoop}
                        className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {connectingWhoop ? (
                          <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Conectando...</>
                        ) : "Conectar"}
                      </button>
                    )}
                  </div>
                </div>
                {whoopConnected && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-teal-700">12.5</p>
                      <p className="text-xs text-gray-500">Strain</p>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-teal-700">78%</p>
                      <p className="text-xs text-gray-500">Recovery</p>
                    </div>
                    <div className="text-center p-2 bg-white/60 rounded-lg">
                      <p className="text-lg font-bold text-teal-700">2.1k</p>
                      <p className="text-xs text-gray-500">Calorías</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Last Synced Data Summary */}
            {(ouraConnected || whoopConnected) && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Últimos datos sincronizados
                  </h3>
                  <span className="text-xs text-gray-400">Actualizado hace 2h</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {/* Sleep Score */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3 border border-indigo-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">😴</span>
                      <span className="text-xs text-gray-500 font-medium">Sueño</span>
                    </div>
                    <p className="text-xl font-bold text-indigo-700">86<span className="text-xs font-normal text-gray-400">/100</span></p>
                    <p className="text-xs text-green-600 mt-0.5">+4 vs ayer</p>
                  </div>
                  {/* Heart Rate */}
                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-3 border border-red-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">❤️</span>
                      <span className="text-xs text-gray-500 font-medium">FC Reposo</span>
                    </div>
                    <p className="text-xl font-bold text-red-600">58<span className="text-xs font-normal text-gray-400"> bpm</span></p>
                    <p className="text-xs text-green-600 mt-0.5">-2 vs ayer</p>
                  </div>
                  {/* HRV */}
                  <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-xl p-3 border border-violet-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">💓</span>
                      <span className="text-xs text-gray-500 font-medium">HRV</span>
                    </div>
                    <p className="text-xl font-bold text-violet-700">45<span className="text-xs font-normal text-gray-400"> ms</span></p>
                    <p className="text-xs text-green-600 mt-0.5">+3 vs ayer</p>
                  </div>
                  {/* Recovery */}
                  <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-3 border border-emerald-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">💚</span>
                      <span className="text-xs text-gray-500 font-medium">Recuperación</span>
                    </div>
                    <p className="text-xl font-bold text-emerald-700">78<span className="text-xs font-normal text-gray-400">%</span></p>
                    <p className="text-xs text-amber-600 mt-0.5">-5 vs ayer</p>
                  </div>
                  {/* Calories */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 border border-orange-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">🔥</span>
                      <span className="text-xs text-gray-500 font-medium">Calorías</span>
                    </div>
                    <p className="text-xl font-bold text-orange-600">2,145<span className="text-xs font-normal text-gray-400"> kcal</span></p>
                    <p className="text-xs text-green-600 mt-0.5">+120 vs ayer</p>
                  </div>
                  {/* Body Temp */}
                  <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-3 border border-sky-100">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">🌡️</span>
                      <span className="text-xs text-gray-500 font-medium">Temp. Corp.</span>
                    </div>
                    <p className="text-xl font-bold text-sky-700">36.4<span className="text-xs font-normal text-gray-400">°C</span></p>
                    <p className="text-xs text-gray-400 mt-0.5">Normal</p>
                  </div>
                </div>
              </div>
            )}

            {/* No devices - show what you could see */}
            {!ouraConnected && !whoopConnected && (
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-5 border border-gray-200 border-dashed mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl">📊</div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Resumen de datos sincronizados</h3>
                    <p className="text-xs text-gray-400">Conecta un dispositivo para ver tus métricas aquí</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {["Sueño", "FC Reposo", "HRV", "Recuperación", "Calorías", "Temp."].map((label) => (
                    <div key={label} className="bg-white/60 rounded-lg p-2.5 text-center border border-gray-100">
                      <p className="text-lg font-bold text-gray-300">--</p>
                      <p className="text-xs text-gray-400">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insights Section */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Insights de IA</h3>
                    <p className="text-xs text-gray-400">Recomendaciones personalizadas basadas en tus métricas</p>
                  </div>
                </div>
                <button
                  onClick={() => generateInsightsMutation.mutate(selectedCategories.length > 0 ? { categories: selectedCategories } : undefined)}
                  disabled={generateInsightsMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-medium hover:from-violet-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {generateInsightsMutation.isPending ? (
                    <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Analizando...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Generar Insights</>
                  )}
                </button>
              </div>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2 mb-4">
                {([
                  { key: "sleep" as const, label: "Sueño", icon: "😴", color: "indigo" },
                  { key: "recovery" as const, label: "Recuperación", icon: "💪", color: "emerald" },
                  { key: "activity" as const, label: "Actividad", icon: "🏋️", color: "orange" },
                  { key: "nutrition" as const, label: "Nutrición", icon: "🥗", color: "pink" },
                  { key: "stress" as const, label: "Estrés", icon: "🧠", color: "purple" },
                ]).map(cat => {
                  const isSelected = selectedCategories.includes(cat.key);
                  const colorMap: Record<string, string> = {
                    indigo: isSelected ? "bg-indigo-100 border-indigo-400 text-indigo-700" : "bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600",
                    emerald: isSelected ? "bg-emerald-100 border-emerald-400 text-emerald-700" : "bg-white border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600",
                    orange: isSelected ? "bg-orange-100 border-orange-400 text-orange-700" : "bg-white border-gray-200 text-gray-500 hover:border-orange-300 hover:text-orange-600",
                    pink: isSelected ? "bg-pink-100 border-pink-400 text-pink-700" : "bg-white border-gray-200 text-gray-500 hover:border-pink-300 hover:text-pink-600",
                    purple: isSelected ? "bg-purple-100 border-purple-400 text-purple-700" : "bg-white border-gray-200 text-gray-500 hover:border-purple-300 hover:text-purple-600",
                  };
                  return (
                    <button
                      key={cat.key}
                      onClick={() => toggleCategory(cat.key)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all flex items-center gap-1.5 ${colorMap[cat.color]}`}
                    >
                      <span>{cat.icon}</span>
                      {cat.label}
                      {isSelected && (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
                {selectedCategories.length > 0 && (
                  <button
                    onClick={() => setSelectedCategories([])}
                    className="px-3 py-1.5 rounded-full border border-gray-200 text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
              {selectedCategories.length > 0 && (
                <p className="text-xs text-violet-500 mb-3">Filtrando por: {selectedCategories.map(c => ({ sleep: "Sueño", recovery: "Recuperación", activity: "Actividad", nutrition: "Nutrición", stress: "Estrés" })[c]).join(", ")}</p>
              )}

              {/* Insights Cards */}
              {aiInsights.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiInsights.map((insight, idx) => {
                    const categoryColors: Record<string, string> = {
                      sleep: "from-indigo-50 to-blue-50 border-indigo-100",
                      recovery: "from-emerald-50 to-green-50 border-emerald-100",
                      activity: "from-orange-50 to-amber-50 border-orange-100",
                      nutrition: "from-pink-50 to-rose-50 border-pink-100",
                      stress: "from-purple-50 to-violet-50 border-purple-100",
                    };
                    const priorityBadge: Record<string, string> = {
                      high: "bg-red-100 text-red-700",
                      medium: "bg-amber-100 text-amber-700",
                      low: "bg-green-100 text-green-700",
                    };
                    const priorityLabel: Record<string, string> = {
                      high: "Alta",
                      medium: "Media",
                      low: "Baja",
                    };
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-4 border bg-gradient-to-br ${categoryColors[insight.category] || "from-gray-50 to-slate-50 border-gray-100"} transition-all hover:shadow-md`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{insight.icon}</span>
                            <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge[insight.priority] || "bg-gray-100 text-gray-600"}`}>
                            {priorityLabel[insight.priority] || insight.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                        {/* Feedback buttons */}
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200/50">
                          <span className="text-xs text-gray-400">
                            {feedbackGiven[idx] ? (
                              feedbackGiven[idx] === "positive" ? "Te ha resultado útil" : "Lo tendremos en cuenta"
                            ) : (
                              "¿Te resultó útil?"
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleFeedback(idx, insight, "positive")}
                              disabled={!!feedbackGiven[idx]}
                              className={`p-1.5 rounded-lg transition-all ${
                                feedbackGiven[idx] === "positive"
                                  ? "bg-green-100 text-green-600 scale-110"
                                  : feedbackGiven[idx]
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                              }`}
                              title="Útil"
                            >
                              <svg className="w-4 h-4" fill={feedbackGiven[idx] === "positive" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleFeedback(idx, insight, "negative")}
                              disabled={!!feedbackGiven[idx]}
                              className={`p-1.5 rounded-lg transition-all ${
                                feedbackGiven[idx] === "negative"
                                  ? "bg-red-100 text-red-600 scale-110"
                                  : feedbackGiven[idx]
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-gray-400 hover:bg-red-50 hover:text-red-600"
                              }`}
                              title="No útil"
                            >
                              <svg className="w-4 h-4" fill={feedbackGiven[idx] === "negative" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-gradient-to-br from-violet-50/50 to-purple-50/50 rounded-xl border border-dashed border-violet-200">
                  <div className="text-3xl mb-2">🧠</div>
                  <p className="text-sm text-gray-500 mb-1">Pulsa <strong>"Generar Insights"</strong> para obtener recomendaciones</p>
                  <p className="text-xs text-gray-400">La IA analizará tus métricas de los últimos 7 días</p>
                </div>
              )}

              {/* Timestamp */}
              {insightsGeneratedAt && (
                <p className="text-xs text-gray-400 mt-3 text-right">
                  Generado: {new Date(insightsGeneratedAt).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                </p>
              )}
            </div>

            {/* Overview Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sleep Chart */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>😴</span> Calidad del Sueño
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={mockSleepData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="score" stroke="#8b5cf6" fill="#ede9fe" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Recovery Chart */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>💚</span> Recuperación
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mockRecoveryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Activity Chart */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm lg:col-span-2">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🏃</span> Actividad (Strain)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={mockActivityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="strain" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Personalized Tips */}
            <div className="mt-6 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 text-white">
              <h3 className="font-semibold text-lg mb-3">Insights Personalizados</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm font-medium mb-1">Sueño promedio</p>
                  <p className="text-2xl font-bold">7.5h</p>
                  <p className="text-xs opacity-80 mt-1">+0.3h vs semana anterior</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm font-medium mb-1">Recuperación media</p>
                  <p className="text-2xl font-bold">76%</p>
                  <p className="text-xs opacity-80 mt-1">Buen nivel, puedes entrenar</p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-sm font-medium mb-1">Strain semanal</p>
                  <p className="text-2xl font-bold">77.1</p>
                  <p className="text-xs opacity-80 mt-1">Carga moderada-alta</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sleep Tab */}
        {activeTab === "sleep" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Análisis del Sueño</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mockSleepData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" domain={[0, 10]} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Area yAxisId="left" type="monotone" dataKey="hours" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} name="Horas" />
                  <Area yAxisId="right" type="monotone" dataKey="score" stroke="#8b5cf6" fill="#ede9fe" strokeWidth={2} name="Score" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
              <h4 className="font-semibold text-indigo-900 mb-2">Sobre el Score de Sueño</h4>
              <p className="text-sm text-indigo-700 leading-relaxed">
                El score de sueño combina duración, eficiencia, latencia, fases REM y sueño profundo.
                Un score superior a 85 indica sueño reparador. Por debajo de 70, tu recuperación se verá afectada.
              </p>
            </div>
          </div>
        )}

        {/* Recovery Tab */}
        {activeTab === "recovery" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Recuperación Diaria</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockRecoveryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]} name="Recovery %">
                    {mockRecoveryData.map((entry, index) => (
                      <rect key={index} fill={entry.score >= 67 ? "#10b981" : entry.score >= 34 ? "#f59e0b" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-green-50 rounded-2xl p-5 border border-green-100">
              <h4 className="font-semibold text-green-900 mb-2">Interpretación de la Recuperación</h4>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="w-4 h-4 rounded-full bg-green-500 mx-auto mb-1"></div>
                  <p className="text-xs font-medium text-gray-700">67-100%</p>
                  <p className="text-xs text-gray-500">Entrena fuerte</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 mx-auto mb-1"></div>
                  <p className="text-xs font-medium text-gray-700">34-66%</p>
                  <p className="text-xs text-gray-500">Moderado</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="w-4 h-4 rounded-full bg-red-500 mx-auto mb-1"></div>
                  <p className="text-xs font-medium text-gray-700">0-33%</p>
                  <p className="text-xs text-gray-500">Descansa</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-lg text-gray-900 mb-4">Strain y Calorías</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="strain" stroke="#f97316" strokeWidth={2} name="Strain" />
                  <Line yAxisId="right" type="monotone" dataKey="calories" stroke="#06b6d4" strokeWidth={2} name="Calorías" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
              <h4 className="font-semibold text-orange-900 mb-2">Gestión del Strain</h4>
              <p className="text-sm text-orange-700 leading-relaxed">
                El strain óptimo depende de tu recuperación. Si tu recovery es 80%+, puedes apuntar a strain 14-18.
                Con recovery bajo (menos de 50%), mantén strain por debajo de 10 para evitar sobreentrenamiento.
              </p>
            </div>
          </div>
        )}

        {/* Education Tab */}
        {activeTab === "education" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 mb-6">
              <h3 className="font-semibold text-blue-900 text-lg mb-2">Centro de Aprendizaje</h3>
              <p className="text-sm text-blue-700">
                Entiende tus métricas de salud para tomar mejores decisiones sobre tu bienestar.
                El conocimiento es poder cuando se trata de optimizar tu rendimiento y recuperación.
              </p>
            </div>

            {educationalContent.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{item.description}</p>
                    <div className="space-y-1.5">
                      {item.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-orange-500 mt-0.5 text-xs">●</span>
                          <p className="text-sm text-gray-700">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No devices connected state */}
        {!ouraConnected && !whoopConnected && activeTab === "overview" && (
          <div className="mt-6 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
            <div className="text-5xl mb-4">🔗</div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">Conecta tu primer dispositivo</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Conecta tu Oura Ring o Whoop para ver datos reales de sueño, recuperación y actividad.
              Los datos mostrados arriba son de demostración.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleConnectOura}
                disabled={connectingOura}
                className="px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {connectingOura ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Conectando...</>
                ) : (
                  <><span>💍</span> Conectar Oura Ring</>
                )}
              </button>
              <button
                onClick={handleConnectWhoop}
                disabled={connectingWhoop}
                className="px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {connectingWhoop ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Conectando...</>
                ) : (
                  <><span>⌚</span> Conectar Whoop</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Los datos mostrados son informativos y no constituyen consejo médico profesional.
            Consulta con un profesional de la salud antes de tomar decisiones basadas en estos datos.
          </p>
        </div>
      </div>
    </div>
  );
}
