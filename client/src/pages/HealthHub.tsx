/**
 * Health Hub — Conector central del ecosistema de bienestar
 * NO duplica páginas. Muestra resumen de estado + Buddy Coach + accesos directos.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import { Link } from "wouter";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type MainTab = "coach" | "estado" | "dispositivos";

interface ChatMessage {
  id: string;
  role: "coach" | "user";
  content: string;
  time: string;
  suggestions?: string[];
}

/* ─── Coach responses ────────────────────────────────────────────────────── */
const coachResponses: Record<string, { content: string; suggestions?: string[] }> = {
  "¿Estoy listo para entrenar hoy?": {
    content: "Basándome en tus datos: **Recovery 78%** y **HRV 53ms** (↑ vs ayer), estás en buena forma para entrenar. Te recomiendo una sesión de intensidad **moderada-alta**. Hidrátate bien antes y después. 💪",
    suggestions: ["¿Qué ejercicios me recomiendas?", "¿Cuánto debo dormir para recuperarme?"],
  },
  "¿Cómo mejorar mi HRV?": {
    content: "Tu HRV actual es **53ms**. Para mejorarlo: 1) **Duerme 7-9h** consistentemente, 2) **Reduce el alcohol**, 3) **Practica respiración** diafragmática 5 min/día, 4) **Gestiona el estrés**. Con consistencia verás mejoras en 4-6 semanas. 📈",
    suggestions: ["¿Qué alimentos mejoran el HRV?", "¿Cómo gestionar el estrés?"],
  },
  "¿Qué debo comer para recuperarme?": {
    content: "Para optimizar tu recuperación: 🥩 **Proteína** 1.6-2g/kg, 🍌 **Carbohidratos** post-entreno, 🫐 **Antioxidantes** (frutas del bosque, cúrcuma), 💧 **Hidratación** 35ml/kg. ¿Quieres que genere un menú de recuperación?",
    suggestions: ["Ir a Menús →", "Ver mis metas nutricionales →"],
  },
  "Analiza mi semana": {
    content: "Esta semana: **Sueño promedio 7.4h** (bueno ✓), **Recovery 75%** (mejoró +8%), **HRV tendencia alcista** 📈. Punto de mejora: tus viernes tienes peor recuperación, probablemente por el estrés laboral. Recomiendo priorizar el descanso los jueves noche.",
    suggestions: ["¿Cómo mejorar mis viernes?", "Ver mis métricas completas →"],
  },
  "default": {
    content: "Entendido. Estoy analizando tus datos de wearables, nutrición y metas para darte la mejor respuesta personalizada. 🧠",
    suggestions: ["¿Estoy listo para entrenar hoy?", "Analiza mi semana"],
  },
};

const quickSuggestions = [
  "¿Estoy listo para entrenar hoy?",
  "¿Cómo mejorar mi HRV?",
  "¿Qué debo comer para recuperarme?",
  "Analiza mi semana",
];

/* ─── Wellness modules (links to existing pages) ────────────────────────── */
const wellnessModules = [
  { icon: "🎯", label: "Metas de Bienestar", href: "/app/wellness-goals",    color: "#F97316", desc: "Tus objetivos activos" },
  { icon: "📏", label: "Mis Métricas",        href: "/app/metrics",           color: "#EF4444", desc: "Peso y composición" },
  { icon: "📉", label: "Progreso",            href: "/app/progress",          color: "#8B5CF6", desc: "Tendencias y evolución" },
  { icon: "🏆", label: "Mis Logros",          href: "/app/achievements",      color: "#F59E0B", desc: "Insignias conseguidas" },
  { icon: "🔥", label: "Retos",               href: "/app/challenges",        color: "#EF4444", desc: "Desafíos activos" },
  { icon: "👨‍⚕️", label: "Mi Experto",          href: "/app/my-expert",         color: "#0EA5E9", desc: "Tu nutricionista" },
  { icon: "📄", label: "Informes",            href: "/app/monthly-reports",   color: "#6B7280", desc: "Reportes mensuales" },
  { icon: "📈", label: "Estadísticas",        href: "/app/stats",             color: "#7C3AED", desc: "Análisis detallado" },
];

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function HealthHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>("estado");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "coach",
      content: `¡Hola${user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋 Soy tu **Coach Buddy**. Tengo acceso a tus wearables, nutrición, metas y progreso para darte recomendaciones integradas. ¿En qué puedo ayudarte?`,
      time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      suggestions: quickSuggestions.slice(0, 3),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [dailySummaryShown, setDailySummaryShown] = useState(false);
  const [chartDays, setChartDays] = useState<7 | 30>(30);

  // Métricas históricas para gráficas
  const { data: metricsData } = trpc.wearables.getMetrics.useQuery({ days: chartDays });

  // Resumen diario automático por la tarde/noche (después de las 15:00)
  useEffect(() => {
    const hour = new Date().getHours();
    const isAfternoonOrEvening = hour >= 15;
    const storageKey = `buddy_coach_daily_summary_${new Date().toDateString()}`;
    const alreadyShown = sessionStorage.getItem(storageKey);
    if (isAfternoonOrEvening && !alreadyShown && !dailySummaryShown) {
      const timer = setTimeout(() => {
        const summaryMsg: ChatMessage = {
          id: "daily-summary-" + Date.now(),
          role: "coach",
          content: `¡Buenas tardes${user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 🌞 He preparado tu **resumen del día**:\n\n• 🍽️ **Nutrición**: Revisa si has completado tus comidas de hoy en el diario\n• 💧 **Hidratación**: Recuerda llegar a tu objetivo de agua diario\n• 💪 **Actividad**: Consulta tus métricas de hoy en el panel de estado\n• 😴 **Recuperación**: Prioriza el sueño esta noche para mañana\n\n¿Quieres que analice algo en concreto?`,
          time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
          suggestions: ["Analiza mi semana", "¿Qué debo comer para recuperarme?", "¿Estoy listo para entrenar hoy?"],
        };
        setChatMessages(prev => [...prev, summaryMsg]);
        setDailySummaryShown(true);
        sessionStorage.setItem(storageKey, "1");
        // Cambiar al tab del coach para mostrar el resumen
        setActiveTab("coach");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [user?.name]);

  // Wearables
  const { data: wearableConnections, refetch: refetchConnections } = trpc.wearables.getConnections.useQuery();
  const { data: ouraData } = trpc.healthHub.getOuraData.useQuery({ days: 7 });
  const { data: whoopData } = trpc.healthHub.getWhoopData.useQuery({ days: 7 });
  const [connectingOura, setConnectingOura] = useState(false);
  const [connectingWhoop, setConnectingWhoop] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const disconnectMutation = trpc.wearables.disconnect.useMutation({
    onSuccess: (data) => { toast.success(data.message); refetchConnections(); setDisconnecting(null); },
    onError: (e) => { toast.error("Error: " + e.message); setDisconnecting(null); },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("wearable_connected");
    const wError = params.get("wearable_error");
    if (connected) { toast.success(`${connected === "oura" ? "Oura Ring" : "Whoop"} conectado`); refetchConnections(); window.history.replaceState({}, "", window.location.pathname); }
    else if (wError) { toast.error(`Error al conectar: ${wError}`); window.history.replaceState({}, "", window.location.pathname); }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, isTyping]);

  const ouraConnected = wearableConnections?.some((c: any) => c.wearableType === "oura" && c.isActive);
  const whoopConnected = wearableConnections?.some((c: any) => c.wearableType === "whoop" && c.isActive);
  const connectedCount = (ouraConnected ? 1 : 0) + (whoopConnected ? 1 : 0);

  const healthScore = useMemo(() => ({ score: 81, label: "Excelente", recovery: 71, hrv: 53, rhr: 59, sleep: 86 }), [ouraData, whoopData]);

  const handleSend = (text?: string) => {
    const msg = text || chatInput.trim();
    if (!msg) return;
    setChatInput("");
    setChatMessages(prev => [...prev, { id: Date.now().toString(), role: "user", content: msg, time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) }]);
    setIsTyping(true);
    setTimeout(() => {
      const resp = coachResponses[msg] || coachResponses["default"];
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "coach", content: resp.content, time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }), suggestions: resp.suggestions }]);
      setIsTyping(false);
    }, 1000 + Math.random() * 700);
  };

  const handleConnectOura = async () => {
    setConnectingOura(true);
    try {
      const res = await fetch(`/api/trpc/wearables.getOuraAuthUrl?input=${encodeURIComponent(JSON.stringify({ origin: window.location.origin }))}`);
      const json = await res.json();
      if (json?.result?.data?.url) { toast.info("Redirigiendo a Oura Ring..."); window.location.href = json.result.data.url; }
      else toast.error("Oura Ring no está configurado.");
    } catch (e: any) { toast.error("Error: " + (e?.message || "desconocido")); }
    finally { setConnectingOura(false); }
  };

  const handleConnectWhoop = async () => {
    setConnectingWhoop(true);
    try {
      const res = await fetch(`/api/trpc/wearables.getWhoopAuthUrl?input=${encodeURIComponent(JSON.stringify({ origin: window.location.origin }))}`);
      const json = await res.json();
      if (json?.result?.data?.url) { toast.info("Redirigiendo a Whoop..."); window.location.href = json.result.data.url; }
      else toast.error("Whoop no está configurado.");
    } catch (e: any) { toast.error("Error: " + (e?.message || "desconocido")); }
    finally { setConnectingWhoop(false); }
  };

  const platforms = [
    { id: "oura",         name: "Oura Ring",             icon: "💍", color: "#B4B4B4", connected: ouraConnected },
    { id: "whoop",        name: "WHOOP",                 icon: "⌚", color: "#00C48C", connected: whoopConnected },
    { id: "apple_health", name: "Apple Health",          icon: "🍎", color: "#FF3B30", connected: false, soon: true },
    { id: "garmin",       name: "Garmin Connect",        icon: "🏔️", color: "#007DC5", connected: false, soon: true },
    { id: "fitbit",       name: "Fitbit",                icon: "💚", color: "#00B0B9", connected: false, soon: true },
    { id: "samsung",      name: "Samsung Health",        icon: "📱", color: "#1428A0", connected: false, soon: true },
    { id: "google_fit",   name: "Google Health Connect", icon: "❤️", color: "#4285F4", connected: false, soon: true },
    { id: "xiaomi",       name: "Xiaomi Mi Band",        icon: "🟠", color: "#FF6900", connected: false, soon: true },
  ];

  const tabs: { key: MainTab; label: string; icon: string }[] = [
    { key: "estado",       label: "Estado",      icon: "💓" },
    { key: "coach",        label: "Buddy Coach",    icon: "🤖" },
    { key: "dispositivos", label: "Wearables",   icon: "📡" },
  ];

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "#FFF8F0" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 60%, #FDBA74 100%)" }}>
          <div className="p-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">💓</span>
                <h1 className="text-2xl font-bold text-white">Health Hub</h1>
              </div>
              <p className="text-sm text-orange-100 mb-3">Centro de bienestar · {connectedCount > 0 ? `${connectedCount} wearable${connectedCount > 1 ? "s" : ""} activo${connectedCount > 1 ? "s" : ""}` : "Sin wearables conectados"}</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${connectedCount > 0 ? "bg-green-400/25 text-white" : "bg-white/20 text-orange-100"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${connectedCount > 0 ? "bg-green-300" : "bg-orange-200"}`}></span>
                {connectedCount > 0 ? "Sincronizando en tiempo real" : "Conecta un wearable"}
              </span>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black text-white leading-none">{healthScore.score}</div>
              <div className="text-xs text-orange-100 mt-0.5">Score de salud</div>
              <div className="text-xs font-bold text-white">{healthScore.label} ✨</div>
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-4 border-t border-white/20">
            {[
              { label: "Recovery", value: `${healthScore.recovery}%`, icon: "⚡" },
              { label: "HRV",      value: `${healthScore.hrv}ms`,     icon: "💖" },
              { label: "FC Rep.",  value: `${healthScore.rhr}bpm`,    icon: "❤️" },
              { label: "Sueño",    value: `${healthScore.sleep}/100`, icon: "🌙" },
            ].map((s, i) => (
              <div key={i} className="py-3 text-center border-r border-white/20 last:border-0">
                <div className="text-sm">{s.icon}</div>
                <div className="text-sm font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-orange-100">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TABS ─────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-card text-muted-foreground border border-border hover:border-orange-300 hover:text-orange-600"
              }`}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB: ESTADO — resumen del ecosistema de bienestar
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "estado" && (
          <div className="space-y-4">
            {/* Insight del día */}
            <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #EDE9FE, #F3EEFF)", border: "1px solid #DDD6FE" }}>
              <div className="flex items-start gap-3">
                <span className="text-xl">💡</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-purple-800">Insight de tu Buddy Coach</p>
                  <p className="text-sm text-purple-700 mt-1 leading-relaxed">
                    Tu HRV ha subido <strong>8ms esta semana</strong>. Tu sistema nervioso se está recuperando bien. Mantén el patrón de sueño actual y considera añadir 10 min de meditación.
                  </p>
                  <button onClick={() => setActiveTab("coach")} className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800">
                    Preguntarle al Buddy Coach →
                  </button>
                </div>
              </div>
            </div>

            {/* Estado de hoy — resumen compacto */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Estado de hoy</h3>
                <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" })}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sueño",    value: "86/100", trend: "+4 vs ayer",  good: true,  color: "#7C3AED", bg: "#F3EEFF", icon: "🌙" },
                  { label: "Recovery", value: "78%",    trend: "-5 vs ayer",  good: false, color: "#16A34A", bg: "#F0FDF4", icon: "⚡" },
                  { label: "Strain",   value: "12.5",   trend: "Moderado",    good: true,  color: "#F97316", bg: "#FFF7ED", icon: "🔥" },
                  { label: "HRV",      value: "53ms",   trend: "+3 vs ayer",  good: true,  color: "#0EA5E9", bg: "#F0F9FF", icon: "💖" },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: m.bg }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-sm">{m.icon}</span>
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                    </div>
                    <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
                    <p className={`text-xs mt-0.5 font-medium ${m.good ? "text-green-600" : "text-amber-600"}`}>{m.trend}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Acceso a módulos de bienestar */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Módulos de bienestar</h3>
                <span className="text-xs text-muted-foreground">Todo conectado al Coach</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {wellnessModules.map((mod, i) => (
                  <Link key={i} href={mod.href}>
                    <div className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${mod.color}15` }}>
                        {mod.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground group-hover:text-orange-600 transition-colors truncate">{mod.label}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{mod.desc}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* ── GRÁFICAS DE EVOLUCIÓN ── */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Evolución de métricas</h3>
                <div className="flex gap-1">
                  {([7, 30] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setChartDays(d)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                        chartDays === d ? "bg-orange-500 text-white" : "bg-muted text-muted-foreground hover:bg-orange-100"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Gráfica de Scores (Oura) */}
              {metricsData?.oura && metricsData.oura.length > 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Scores Oura Ring (sueño, actividad, preparación)</p>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricsData.oura.map(d => ({
                        date: d.date?.slice(5), // MM-DD
                        Sueño: d.sleepScore,
                        Actividad: d.activityScore,
                        Preparación: d.readinessScore,
                      }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="Sueño" stroke="#7C3AED" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Actividad" stroke="#F97316" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Preparación" stroke="#0EA5E9" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : metricsData?.whoop && metricsData.whoop.length > 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Scores Whoop (recuperación, esfuerzo)</p>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricsData.whoop.map(d => ({
                        date: d.date?.slice(5),
                        Recuperación: d.recoveryScore,
                        Esfuerzo: d.strainScore,
                        Sueño: d.sleepScore,
                      }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="Recuperación" stroke="#16A34A" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Esfuerzo" stroke="#F97316" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Sueño" stroke="#7C3AED" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : metricsData?.userMetrics && metricsData.userMetrics.length > 0 ? (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Evolución de peso y composición corporal</p>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metricsData.userMetrics.map(d => ({
                        date: d.recordedAt?.slice(5),
                        Peso: d.weight,
                        "Grasa %": d.bodyFatPercentage,
                      }))} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="Peso" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Grasa %" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <span className="text-3xl mb-2">📊</span>
                  <p className="text-sm font-semibold text-foreground">Sin datos de métricas aún</p>
                  <p className="text-xs text-muted-foreground mt-1">Conecta un wearable o registra tus métricas corporales para ver gráficas de evolución.</p>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => setActiveTab("dispositivos")} className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-500 text-white hover:bg-orange-600 transition-colors">
                      Conectar wearable
                    </button>
                    <Link href="/app/metrics">
                      <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground hover:bg-orange-100 hover:text-orange-700 transition-colors cursor-pointer">
                        Registrar métricas
                      </span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Síntomas rápidos */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
              <h3 className="text-sm font-bold text-foreground mb-1">¿Cómo te encuentras hoy?</h3>
              <p className="text-xs text-muted-foreground mb-3">El Coach ajustará sus recomendaciones según cómo te sientas</p>
              <div className="flex flex-wrap gap-2">
                {["Cansado", "Con energía", "Estrés", "Dolor muscular", "Bien descansado", "Inflamación", "Falta de apetito"].map(s => (
                  <button
                    key={s}
                    onClick={() => { setActiveTab("coach"); setTimeout(() => handleSend(`Me siento: ${s}. ¿Qué me recomiendas?`), 300); }}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: COACH IA
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "coach" && (
          <div className="space-y-3">
            {/* Contexto */}
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#FFF3E8", border: "1px solid #FFE0C2" }}>
              <span className="text-lg">🧠</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-orange-700">Coach Buddy integra todos tus datos</p>
                <p className="text-xs text-orange-600/80 truncate">Wearables · Nutrición · Metas · Métricas · Progreso</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>En línea
              </span>
            </div>

            {/* Chat */}
            <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm">
              <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto" style={{ background: "#FFFBF7" }}>
                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "coach" ? (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 self-end" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
                        <span className="text-sm">🤖</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 self-end text-sm font-bold text-orange-600">
                        {user?.name?.[0] || "U"}
                      </div>
                    )}
                    <div className="max-w-[80%] space-y-2">
                      <div
                        className="rounded-2xl p-3.5 text-sm leading-relaxed"
                        style={msg.role === "coach"
                          ? { background: "#FFF3E8", border: "1px solid #FFE0C2", borderBottomLeftRadius: 4 }
                          : { background: "#F97316", color: "white", borderBottomRightRadius: 4 }
                        }
                      >
                        {msg.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                          i % 2 === 1
                            ? <strong key={i} className={msg.role === "coach" ? "text-orange-700" : "text-white"}>{part}</strong>
                            : part
                        )}
                        <p className={`text-[10px] mt-1.5 text-right ${msg.role === "coach" ? "text-orange-400" : "text-orange-200"}`}>{msg.time}</p>
                      </div>
                      {msg.suggestions && msg.role === "coach" && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map((s, i) => (
                            <button key={i} onClick={() => handleSend(s)} className="text-xs px-3 py-1.5 rounded-full border border-orange-200 text-orange-600 bg-white hover:bg-orange-50 transition-colors">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
                      <span className="text-sm">🤖</span>
                    </div>
                    <div className="rounded-2xl p-3.5" style={{ background: "#FFF3E8", border: "1px solid #FFE0C2", borderBottomLeftRadius: 4 }}>
                      <div className="flex gap-1 items-center h-4">
                        {[0, 150, 300].map(d => <span key={d} className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${d}ms` }}></span>)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick suggestions */}
              <div className="px-3 py-2 border-t border-border overflow-x-auto" style={{ background: "#FFF8F0" }}>
                <div className="flex gap-2 whitespace-nowrap">
                  {quickSuggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSend(s)} className="text-xs px-3 py-1.5 rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors flex-shrink-0">
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border" style={{ background: "#FFF8F0" }}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSend()}
                    placeholder="Pregunta al Coach Buddy..."
                    className="flex-1 bg-white text-foreground text-sm rounded-full px-4 py-2.5 placeholder-gray-400 border border-border focus:border-orange-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!chatInput.trim() || isTyping}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-40"
                    style={{ background: "#F97316" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: DISPOSITIVOS
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "dispositivos" && (
          <div className="space-y-4">
            {connectedCount > 0 && (
              <div className="rounded-xl p-3 flex items-center gap-2" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-sm text-green-700 font-medium">{connectedCount} dispositivo{connectedCount > 1 ? "s" : ""} activo{connectedCount > 1 ? "s" : ""}</p>
                <button onClick={() => toast.success("Sincronizando...")} className="ml-auto text-xs font-semibold text-green-600 hover:text-green-800">Sincronizar</button>
              </div>
            )}

            <div className="space-y-2">
              {platforms.map(p => (
                <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${p.connected ? "border-green-200 bg-green-50/50" : "border-border bg-card"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: `${p.color}15` }}>{p.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.connected ? "Conectado y sincronizando" : (p as any).soon ? "Próximamente" : "Disponible"}</p>
                    </div>
                  </div>
                  {p.connected ? (
                    <button
                      onClick={() => { setDisconnecting(p.id); disconnectMutation.mutate({ wearableType: p.id as "oura" | "whoop" }); }}
                      disabled={disconnecting === p.id}
                      className="text-xs font-medium text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200"
                    >
                      {disconnecting === p.id ? "..." : "Desconectar"}
                    </button>
                  ) : (p as any).soon ? (
                    <span className="text-xs font-medium text-muted-foreground px-3 py-1.5 rounded-lg bg-muted/50">Próximamente</span>
                  ) : (
                    <button
                      onClick={() => p.id === "oura" ? handleConnectOura() : handleConnectWhoop()}
                      disabled={p.id === "oura" ? connectingOura : connectingWhoop}
                      className="text-xs font-medium text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                      style={{ background: p.color }}
                    >
                      {(p.id === "oura" && connectingOura) || (p.id === "whoop" && connectingWhoop) ? "..." : "Conectar"}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">Apple Health y Google Health Connect requieren la app nativa móvil.</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground/50 text-center pb-2">
          Datos informativos. No constituyen consejo médico profesional.
        </p>
      </div>
    </div>
  );
}
