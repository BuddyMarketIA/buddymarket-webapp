/**
 * Health Hub — Núcleo del Ecosistema de Bienestar
 * Fusiona: Coach IA · Metas de Bienestar · Métricas · Wearables · Módulos del ecosistema
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import { Link } from "wouter";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type MainTab = "coach" | "metas" | "metricas" | "ecosistema" | "dispositivos";
type GoalCategory = "sleep" | "recovery" | "activity" | "stress" | "nutrition" | "hydration";
type MetricKey = "hrv" | "rhr" | "sleep" | "recovery" | "steps" | "active" | "spo2";
type PeriodKey = "7d" | "14d" | "30d";

interface WellnessGoal {
  id: string;
  category: GoalCategory;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  progress: number;
  priority: "low" | "medium" | "high";
  status: "active" | "completed";
  tips: string[];
  deadline: Date;
}

interface ChatMessage {
  id: string;
  role: "coach" | "user";
  content: string;
  time: string;
  suggestions?: string[];
}

/* ─── Mock data ──────────────────────────────────────────────────────────── */
const mockSleepData = [
  { date: "Lun", hours: 7.2, score: 82 },
  { date: "Mar", hours: 6.8, score: 74 },
  { date: "Mie", hours: 7.5, score: 86 },
  { date: "Jue", hours: 8.1, score: 91 },
  { date: "Vie", hours: 6.5, score: 68 },
  { date: "Sab", hours: 8.5, score: 94 },
  { date: "Dom", hours: 7.8, score: 88 },
];

const mockHrvData = [
  { date: "Lun", value: 48 },
  { date: "Mar", value: 52 },
  { date: "Mie", value: 55 },
  { date: "Jue", value: 53 },
  { date: "Vie", value: 49 },
  { date: "Sab", value: 58 },
  { date: "Dom", value: 61 },
];

const mockRecoveryData = [
  { date: "Lun", score: 72 },
  { date: "Mar", score: 65 },
  { date: "Mie", score: 78 },
  { date: "Jue", score: 85 },
  { date: "Vie", score: 60 },
  { date: "Sab", score: 90 },
  { date: "Dom", score: 82 },
];

const goalCategoryConfig: Record<GoalCategory, { icon: string; label: string; color: string; bg: string; unit: string; defaultTarget: number; tips: string[] }> = {
  sleep:     { icon: "🌙", label: "Sueño",         color: "#7C3AED", bg: "#F3EEFF", unit: "horas",   defaultTarget: 8,     tips: ["Horario consistente", "Sin pantallas 1h antes", "Ambiente oscuro y fresco"] },
  recovery:  { icon: "⚡", label: "Recuperación",  color: "#16A34A", bg: "#F0FDF4", unit: "puntos",  defaultTarget: 80,    tips: ["Más proteína post-entreno", "Estiramientos diarios", "Reduce el estrés"] },
  activity:  { icon: "🏃", label: "Actividad",     color: "#F97316", bg: "#FFF7ED", unit: "pasos",   defaultTarget: 10000, tips: ["Camina 30 min diarios", "Sube escaleras", "Descansos activos cada hora"] },
  stress:    { icon: "🧘", label: "Estrés",         color: "#0EA5E9", bg: "#F0F9FF", unit: "nivel",   defaultTarget: 3,     tips: ["Meditación diaria", "Respiración profunda", "Límites de trabajo"] },
  nutrition: { icon: "🥗", label: "Nutrición",     color: "#D97706", bg: "#FFFBEB", unit: "porciones", defaultTarget: 5,  tips: ["5 frutas/verduras al día", "Reduce procesados", "Come a horas fijas"] },
  hydration: { icon: "💧", label: "Hidratación",   color: "#0891B2", bg: "#ECFEFF", unit: "vasos",   defaultTarget: 8,     tips: ["Agua al despertar", "Lleva botella contigo", "Bebe antes de sentir sed"] },
};

const ecosystemModules = [
  { icon: "🥗", label: "Recetas",     href: "/app/recipes",          color: "#F97316", desc: "Recetas personalizadas según tus metas" },
  { icon: "📋", label: "Menús",       href: "/app/menus",            color: "#D97706", desc: "Planificación semanal de comidas" },
  { icon: "📦", label: "Inventario",  href: "/app/inventory",        color: "#16A34A", desc: "Gestión de tu despensa inteligente" },
  { icon: "🛒", label: "BuddyShop",   href: "/app/shop",             color: "#7C3AED", desc: "Compra los ingredientes de tus menús" },
  { icon: "👨‍⚕️", label: "Mi Experto",  href: "/app/my-expert",        color: "#0EA5E9", desc: "Consulta con tu nutricionista" },
  { icon: "📏", label: "Métricas",    href: "/app/metrics",          color: "#EF4444", desc: "Evolución de tu peso y composición" },
  { icon: "📈", label: "Progreso",    href: "/app/progress",         color: "#8B5CF6", desc: "Historial y tendencias de salud" },
  { icon: "🏆", label: "Logros",      href: "/app/achievements",     color: "#F59E0B", desc: "Insignias y retos completados" },
  { icon: "🔥", label: "Retos",       href: "/app/challenges",       color: "#EF4444", desc: "Desafíos para mantenerte motivado" },
  { icon: "🐾", label: "BuddyPet",    href: "/app/buddy-pet",        color: "#10B981", desc: "Nutrición inteligente para tu mascota" },
  { icon: "👥", label: "Familia",     href: "/app/familia",          color: "#F97316", desc: "Gestión nutricional familiar" },
  { icon: "📄", label: "Informes",    href: "/app/monthly-reports",  color: "#6B7280", desc: "Reportes mensuales de tu bienestar" },
];

const coachSuggestions = [
  "¿Estoy listo para entrenar hoy?",
  "¿Cómo mejorar mi HRV?",
  "¿Qué debo comer para recuperarme mejor?",
  "¿Por qué me siento cansado?",
  "¿Cuánto debo dormir según mis datos?",
  "Analiza mi semana de sueño",
];

const coachResponses: Record<string, { content: string; suggestions?: string[] }> = {
  "¿Estoy listo para entrenar hoy?": {
    content: "Basándome en tus datos de hoy: **Recovery 78%** y **HRV 53ms** (↑ vs ayer), estás en buena forma para entrenar. Te recomiendo una sesión de intensidad **moderada-alta** (strain 12-15). Asegúrate de hidratarte bien antes y después. 💪",
    suggestions: ["¿Qué ejercicios me recomiendas?", "¿Cuánto tiempo debo entrenar?"],
  },
  "¿Cómo mejorar mi HRV?": {
    content: "Tu HRV actual es **53ms**, que está en rango normal. Para mejorarlo: 1) **Duerme 7-9h** consistentemente, 2) **Reduce el alcohol** (baja el HRV hasta 24h), 3) **Practica respiración** diafragmática 5 min/día, 4) **Gestiona el estrés** con meditación. Con consistencia, podrías ver mejoras en 4-6 semanas. 📈",
    suggestions: ["¿Qué alimentos mejoran el HRV?", "Muéstrame mi tendencia de HRV"],
  },
  "¿Qué debo comer para recuperarme mejor?": {
    content: "Para optimizar tu recuperación con **Recovery Score 78%**: 🥩 **Proteína** 1.6-2g/kg (unos 128-160g si pesas 80kg), 🍌 **Carbohidratos** post-entreno para reponer glucógeno, 🫐 **Antioxidantes** (frutas del bosque, cúrcuma), 💧 **Hidratación** 35ml/kg. ¿Quieres que genere un menú de recuperación personalizado?",
    suggestions: ["Genera un menú de recuperación", "¿Cuánta proteína necesito?"],
  },
  "default": {
    content: "Entendido. Estoy analizando tus datos de salud para darte la mejor respuesta. Recuerda que combino tus métricas de wearables, nutrición y metas para darte recomendaciones 100% personalizadas. 🧠",
    suggestions: ["¿Estoy listo para entrenar hoy?", "Analiza mi semana"],
  },
};

/* ─── Component ──────────────────────────────────────────────────────────── */
export default function HealthHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<MainTab>("coach");
  const [period, setPeriod] = useState<PeriodKey>("7d");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "coach",
      content: `¡Hola${user?.name ? `, ${user.name.split(" ")[0]}` : ""}! 👋 Soy tu **Coach Buddy**, el núcleo de tu ecosistema de bienestar. Tengo acceso a tus métricas de wearables, historial nutricional, metas y progreso para darte recomendaciones completamente personalizadas.\n\n¿En qué puedo ayudarte hoy?`,
      time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
      suggestions: coachSuggestions.slice(0, 3),
    },
  ]);
  const [isCoachTyping, setIsCoachTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Goals state
  const [goals, setGoals] = useState<WellnessGoal[]>([
    { id: "1", category: "sleep",    title: "Dormir 8 horas diarias",    targetValue: 8,     currentValue: 6.5,  unit: "horas",   progress: 81, priority: "high",   status: "active",    tips: goalCategoryConfig.sleep.tips,     deadline: new Date(Date.now() + 30 * 86400000) },
    { id: "2", category: "activity", title: "10,000 pasos diarios",      targetValue: 10000, currentValue: 7500, unit: "pasos",   progress: 75, priority: "medium", status: "active",    tips: goalCategoryConfig.activity.tips,  deadline: new Date(Date.now() + 60 * 86400000) },
    { id: "3", category: "recovery", title: "Recovery Score > 80%",      targetValue: 80,    currentValue: 78,   unit: "puntos",  progress: 97, priority: "high",   status: "active",    tips: goalCategoryConfig.recovery.tips,  deadline: new Date(Date.now() + 14 * 86400000) },
    { id: "4", category: "hydration","title": "Beber 8 vasos de agua",   targetValue: 8,     currentValue: 8,    unit: "vasos",   progress: 100, priority: "low",   status: "completed", tips: goalCategoryConfig.hydration.tips, deadline: new Date(Date.now() + 7 * 86400000) },
  ]);
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ category: "sleep" as GoalCategory, title: "", targetValue: 0 });

  // Wearables
  const { data: wearableConnections, refetch: refetchConnections } = trpc.wearables.getConnections.useQuery();
  const { data: ouraData } = trpc.healthHub.getOuraData.useQuery({ days: period === "7d" ? 7 : period === "14d" ? 14 : 30 });
  const { data: whoopData } = trpc.healthHub.getWhoopData.useQuery({ days: period === "7d" ? 7 : period === "14d" ? 14 : 30 });
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isCoachTyping]);

  const ouraConnected = wearableConnections?.some((c: any) => c.wearableType === "oura" && c.isActive);
  const whoopConnected = wearableConnections?.some((c: any) => c.wearableType === "whoop" && c.isActive);
  const connectedCount = (ouraConnected ? 1 : 0) + (whoopConnected ? 1 : 0);
  const hasData = connectedCount > 0;

  const healthScore = useMemo(() => ({ score: 81, label: "Excelente", recovery: 71, hrv: 53, rhr: 59 }), [ouraData, whoopData]);

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const avgProgress = activeGoals.length > 0 ? Math.round(activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length) : 0;

  const handleSendMessage = (text?: string) => {
    const msg = text || chatInput.trim();
    if (!msg) return;
    setChatInput("");
    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: msg, time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) };
    setChatMessages(prev => [...prev, userMsg]);
    setIsCoachTyping(true);
    setTimeout(() => {
      const response = coachResponses[msg] || coachResponses["default"];
      const coachMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "coach",
        content: response.content,
        time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
        suggestions: response.suggestions,
      };
      setChatMessages(prev => [...prev, coachMsg]);
      setIsCoachTyping(false);
    }, 1200 + Math.random() * 800);
  };

  const handleAddGoal = () => {
    if (!newGoal.title || newGoal.targetValue <= 0) return;
    const cfg = goalCategoryConfig[newGoal.category];
    setGoals(prev => [...prev, {
      id: Date.now().toString(), category: newGoal.category, title: newGoal.title,
      targetValue: newGoal.targetValue, currentValue: 0, unit: cfg.unit,
      progress: 0, priority: "medium", status: "active", tips: cfg.tips,
      deadline: new Date(Date.now() + 30 * 86400000),
    }]);
    setNewGoal({ category: "sleep", title: "", targetValue: 0 });
    setShowNewGoalForm(false);
    toast.success("¡Meta creada! El Coach Buddy la tendrá en cuenta.");
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
    { id: "oura",         name: "Oura Ring",            icon: "💍", color: "#B4B4B4", connected: ouraConnected },
    { id: "whoop",        name: "WHOOP",                icon: "⌚", color: "#00C48C", connected: whoopConnected },
    { id: "apple_health", name: "Apple Health",         icon: "🍎", color: "#FF3B30", connected: false },
    { id: "garmin",       name: "Garmin Connect",       icon: "🏔️", color: "#007DC5", connected: false },
    { id: "fitbit",       name: "Fitbit",               icon: "💚", color: "#00B0B9", connected: false },
    { id: "samsung",      name: "Samsung Health",       icon: "📱", color: "#1428A0", connected: false },
    { id: "google_fit",   name: "Google Health Connect",icon: "❤️", color: "#4285F4", connected: false },
    { id: "xiaomi",       name: "Xiaomi Mi Band",       icon: "🟠", color: "#FF6900", connected: false },
  ];

  const mainTabs: { key: MainTab; label: string; icon: string }[] = [
    { key: "coach",       label: "Coach IA",    icon: "🤖" },
    { key: "metas",       label: "Metas",       icon: "🎯" },
    { key: "metricas",    label: "Métricas",    icon: "📊" },
    { key: "ecosistema",  label: "Ecosistema",  icon: "🌐" },
    { key: "dispositivos",label: "Dispositivos",icon: "📡" },
  ];

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen" style={{ background: "#FFF8F0" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* ── HERO BANNER ─────────────────────────────────────────────── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 60%, #FDBA74 100%)" }}>
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">💓</span>
                  <h1 className="text-2xl font-bold text-white">Health Hub</h1>
                </div>
                <p className="text-sm text-orange-100 mb-3">El núcleo de tu ecosistema de bienestar</p>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${hasData ? "bg-green-400/20 text-white" : "bg-white/20 text-orange-100"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasData ? "bg-green-300" : "bg-orange-200"}`}></span>
                    {hasData ? `${connectedCount} wearable${connectedCount > 1 ? "s" : ""} activo${connectedCount > 1 ? "s" : ""}` : "Sin wearables"}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white">
                    🎯 {activeGoals.length} meta{activeGoals.length !== 1 ? "s" : ""} activa{activeGoals.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-white">{healthScore.score}</div>
                <div className="text-xs text-orange-100">Score de salud</div>
                <div className="text-xs font-semibold text-white mt-0.5">{healthScore.label} ✨</div>
              </div>
            </div>
          </div>

          {/* Mini stats strip */}
          <div className="grid grid-cols-4 border-t border-white/20">
            {[
              { label: "Recovery", value: `${healthScore.recovery}%`, icon: "⚡" },
              { label: "HRV",      value: `${healthScore.hrv}ms`,     icon: "💖" },
              { label: "FC Rep.",  value: `${healthScore.rhr}bpm`,    icon: "❤️" },
              { label: "Progreso", value: `${avgProgress}%`,          icon: "🎯" },
            ].map((s, i) => (
              <div key={i} className="py-3 text-center border-r border-white/20 last:border-0">
                <div className="text-sm">{s.icon}</div>
                <div className="text-sm font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-orange-100">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN TABS ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {mainTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-card text-muted-foreground border border-border hover:border-orange-200 hover:text-orange-600"
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              {tab.label}
              {tab.key === "metas" && activeGoals.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/30 text-white" : "bg-orange-100 text-orange-600"}`}>
                  {activeGoals.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB: COACH IA
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "coach" && (
          <div className="space-y-4">
            {/* Context bar */}
            <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#FFF3E8", border: "1px solid #FFE0C2" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
                <span className="text-sm">🧠</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-orange-700">Coach Buddy tiene acceso a:</p>
                <p className="text-xs text-orange-600/80 truncate">Wearables · Nutrición · Metas · Métricas · Historial</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-green-100 text-green-700">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>En línea
              </span>
            </div>

            {/* Chat window */}
            <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm">
              {/* Chat messages */}
              <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto" style={{ background: "#FFFBF7" }}>
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
                    <div className={`max-w-[80%] space-y-2`}>
                      <div
                        className="rounded-2xl p-3.5 text-sm leading-relaxed"
                        style={msg.role === "coach"
                          ? { background: "#FFF3E8", border: "1px solid #FFE0C2", borderBottomLeftRadius: 4 }
                          : { background: "#F97316", color: "white", borderBottomRightRadius: 4 }
                        }
                      >
                        {msg.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                          i % 2 === 1 ? <strong key={i} className={msg.role === "coach" ? "text-orange-700" : "text-white"}>{part}</strong> : part
                        )}
                        <p className={`text-[10px] mt-1.5 text-right ${msg.role === "coach" ? "text-orange-400" : "text-orange-200"}`}>{msg.time}</p>
                      </div>
                      {/* Suggestion chips */}
                      {msg.suggestions && msg.role === "coach" && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.suggestions.map((s, i) => (
                            <button
                              key={i}
                              onClick={() => handleSendMessage(s)}
                              className="text-xs px-3 py-1.5 rounded-full border border-orange-200 text-orange-600 bg-white hover:bg-orange-50 transition-colors"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isCoachTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
                      <span className="text-sm">🤖</span>
                    </div>
                    <div className="rounded-2xl p-3.5" style={{ background: "#FFF3E8", border: "1px solid #FFE0C2", borderBottomLeftRadius: 4 }}>
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick suggestions bar */}
              <div className="px-3 py-2 border-t border-border overflow-x-auto" style={{ background: "#FFF8F0" }}>
                <div className="flex gap-2 whitespace-nowrap">
                  {coachSuggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors flex-shrink-0"
                    >
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
                    onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                    placeholder="Pregunta al Coach Buddy sobre tu salud..."
                    className="flex-1 bg-white text-foreground text-sm rounded-full px-4 py-2.5 placeholder-gray-400 border border-border focus:border-orange-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!chatInput.trim() || isCoachTyping}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-50 transition-opacity"
                    style={{ background: "#F97316" }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Insight del día */}
            <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #EDE9FE, #F3EEFF)", border: "1px solid #DDD6FE" }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <p className="text-sm font-bold text-purple-800">Insight del Coach de hoy</p>
                  <p className="text-sm text-purple-700 mt-1 leading-relaxed">
                    Tu HRV ha subido <strong>8ms esta semana</strong>. Esto indica que tu sistema nervioso se está recuperando bien. Mantén el patrón de sueño actual y considera añadir 10 min de meditación para consolidar la mejora.
                  </p>
                  <button onClick={() => handleSendMessage("Cuéntame más sobre mi HRV")} className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800">
                    Saber más →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: METAS DE BIENESTAR
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "metas" && (
          <div className="space-y-4">
            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Metas activas",    value: activeGoals.length,    color: "#F97316", bg: "#FFF7ED" },
                { label: "Completadas",      value: completedGoals.length, color: "#16A34A", bg: "#F0FDF4" },
                { label: "Progreso medio",   value: `${avgProgress}%`,     color: "#7C3AED", bg: "#F3EEFF" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Add goal button */}
            <button
              onClick={() => setShowNewGoalForm(!showNewGoalForm)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva meta de bienestar
            </button>

            {/* New goal form */}
            {showNewGoalForm && (
              <div className="rounded-2xl p-4 bg-card border border-border shadow-sm space-y-3">
                <h3 className="font-semibold text-foreground">Crear nueva meta</h3>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Categoría</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(goalCategoryConfig) as [GoalCategory, typeof goalCategoryConfig[GoalCategory]][]).map(([key, cfg]) => (
                      <button
                        key={key}
                        onClick={() => setNewGoal(g => ({ ...g, category: key }))}
                        className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-medium transition-all border ${newGoal.category === key ? "border-transparent text-white" : "border-border text-muted-foreground hover:border-orange-200"}`}
                        style={newGoal.category === key ? { background: cfg.color } : { background: cfg.bg }}
                      >
                        <span>{cfg.icon}</span> {cfg.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Título de la meta</label>
                  <input
                    type="text"
                    placeholder={`Ej: ${goalCategoryConfig[newGoal.category].label} mejorada`}
                    value={newGoal.title}
                    onChange={e => setNewGoal(g => ({ ...g, title: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:border-orange-400 focus:outline-none bg-background"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Objetivo ({goalCategoryConfig[newGoal.category].unit})</label>
                  <input
                    type="number"
                    placeholder={`Ej: ${goalCategoryConfig[newGoal.category].defaultTarget}`}
                    value={newGoal.targetValue || ""}
                    onChange={e => setNewGoal(g => ({ ...g, targetValue: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:border-orange-400 focus:outline-none bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleAddGoal} className="flex-1 py-2 rounded-xl text-sm font-semibold text-white" style={{ background: "#F97316" }}>Crear meta</button>
                  <button onClick={() => setShowNewGoalForm(false)} className="flex-1 py-2 rounded-xl text-sm font-medium text-muted-foreground border border-border">Cancelar</button>
                </div>
              </div>
            )}

            {/* Goals list */}
            <div className="space-y-3">
              {goals.map(goal => {
                const cfg = goalCategoryConfig[goal.category];
                return (
                  <div key={goal.id} className="rounded-2xl p-4 bg-card border border-border shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: cfg.bg }}>
                          {cfg.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                          <p className="text-xs text-muted-foreground">{cfg.label} · Plazo: {goal.deadline.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {goal.status === "completed" && <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">✓ Completada</span>}
                        {goal.priority === "high" && goal.status === "active" && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Alta</span>}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-muted-foreground">{goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                        <span className="text-xs font-bold" style={{ color: cfg.color }}>{goal.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(goal.progress, 100)}%`, background: cfg.color }}></div>
                      </div>
                    </div>

                    {/* Tips */}
                    <div className="rounded-xl p-2.5" style={{ background: cfg.bg }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: cfg.color }}>💡 Consejo del Coach:</p>
                      <p className="text-xs text-foreground/70">{cfg.tips[Math.floor(Math.random() * cfg.tips.length)]}</p>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { setGoals(gs => gs.map(g => g.id === goal.id ? { ...g, progress: Math.min(100, g.progress + 10), currentValue: Math.min(g.targetValue, g.currentValue + g.targetValue * 0.1), status: g.progress + 10 >= 100 ? "completed" : "active" } : g)); toast.success("¡Progreso actualizado!"); }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
                        style={{ background: cfg.color }}
                      >
                        + Registrar progreso
                      </button>
                      <button
                        onClick={() => handleSendMessage(`Dame consejos para: ${goal.title}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:border-orange-300 hover:text-orange-600"
                      >
                        🤖 Coach
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Motivational banner */}
            <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #F97316, #FDBA74)" }}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                <div>
                  <p className="text-sm font-bold text-white">¡Vas muy bien!</p>
                  <p className="text-xs text-orange-100">Has completado {completedGoals.length} meta{completedGoals.length !== 1 ? "s" : ""} y llevas un progreso medio del {avgProgress}%. La consistencia es la clave.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: MÉTRICAS
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "metricas" && (
          <div className="space-y-4">
            {/* Period selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
              {(["7d", "14d", "30d"] as PeriodKey[]).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${period === p ? "bg-orange-500 text-white" : "bg-card border border-border text-muted-foreground hover:border-orange-300"}`}>
                  {p === "7d" ? "7 días" : p === "14d" ? "14 días" : "30 días"}
                </button>
              ))}
            </div>

            {/* Today's summary */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">Resumen de hoy</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Sueño",    value: "86/100", sub: "+4 vs ayer",  color: "#7C3AED", bg: "#F3EEFF" },
                  { label: "Recovery", value: "78%",    sub: "-5 vs ayer",  color: "#16A34A", bg: "#F0FDF4" },
                  { label: "Strain",   value: "12.5",   sub: "Moderado",    color: "#F97316", bg: "#FFF7ED" },
                  { label: "HRV",      value: "53ms",   sub: "+3 vs ayer",  color: "#0EA5E9", bg: "#F0F9FF" },
                ].map((m, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: m.bg }}>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-xl font-bold mt-0.5" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sleep chart */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">😴 Calidad del Sueño</h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={mockSleepData}>
                  <defs>
                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={2} fill="url(#sleepGrad)" dot={{ fill: "#7C3AED", r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* HRV chart */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">💖 HRV (Variabilidad cardíaca)</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={mockHrvData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 70]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                  <Line type="monotone" dataKey="value" stroke="#F97316" strokeWidth={2.5} dot={{ fill: "#F97316", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recovery chart */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-3">⚡ Recovery Score</h3>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={mockRecoveryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 12 }} />
                  <Bar dataKey="score" fill="#16A34A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Síntomas del día */}
            <div className="rounded-2xl bg-card border border-border p-4 shadow-sm">
              <h3 className="font-semibold text-foreground mb-1">🩺 ¿Cómo te encuentras hoy?</h3>
              <p className="text-xs text-muted-foreground mb-3">Selecciona síntomas para recibir sugerencias personalizadas</p>
              <div className="flex flex-wrap gap-2">
                {["Retención de líquidos", "Fatiga", "Digestión pesada", "Estrés", "Insomnio", "Inflamación", "Falta de energía", "Dolor muscular"].map(s => (
                  <button key={s} onClick={() => toast.info(`Sugerencias para ${s} próximamente`)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB: ECOSISTEMA
        ══════════════════════════════════════════════════════════════ */}
        {activeTab === "ecosistema" && (
          <div className="space-y-4">
            <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #FFF3E8, #FFF8F0)", border: "1px solid #FFE0C2" }}>
              <p className="text-sm font-bold text-orange-700 mb-1">🌐 Tu ecosistema BuddyOne</p>
              <p className="text-xs text-orange-600/80">Todos los módulos conectados a tu Health Hub. El Coach IA tiene acceso a todos ellos para darte recomendaciones integradas.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ecosystemModules.map((mod, i) => (
                <Link key={i} href={mod.href}>
                  <div className="rounded-2xl p-4 bg-card border border-border hover:border-orange-200 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${mod.color}15` }}>
                        {mod.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-orange-600 transition-colors">{mod.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{mod.desc}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #EDE9FE, #F3EEFF)", border: "1px solid #DDD6FE" }}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <p className="text-sm font-bold text-purple-800">Coach IA integrado</p>
                  <p className="text-xs text-purple-700 mt-1 leading-relaxed">El Coach Buddy analiza datos de todos estos módulos para darte recomendaciones holísticas: si comes mal y duermes poco, te lo dirá. Si tu recovery es bajo pero tu menú es bueno, ajustará las sugerencias de entrenamiento.</p>
                  <button onClick={() => setActiveTab("coach")} className="mt-2 text-xs font-semibold text-purple-600 hover:text-purple-800">
                    Hablar con el Coach →
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
                <span className="text-green-600">✓</span>
                <p className="text-sm text-green-700 font-medium">{connectedCount} dispositivo{connectedCount > 1 ? "s" : ""} conectado{connectedCount > 1 ? "s" : ""} y sincronizando datos</p>
                <button onClick={() => toast.success("Sincronizando...")} className="ml-auto text-xs font-semibold text-green-600 hover:text-green-800">Sincronizar</button>
              </div>
            )}

            <h3 className="text-sm font-semibold text-foreground">Dispositivos disponibles</h3>
            <div className="space-y-3">
              {platforms.map(p => (
                <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${p.connected ? "border-green-200 bg-green-50/50" : "border-border bg-card hover:border-orange-200"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: `${p.color}15` }}>{p.icon}</div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.connected ? "Conectado y sincronizando" : "Disponible para conectar"}</p>
                    </div>
                  </div>
                  {p.connected ? (
                    <button onClick={() => { setDisconnecting(p.id); disconnectMutation.mutate({ wearableType: p.id as "oura" | "whoop" }); }} disabled={disconnecting === p.id} className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200">
                      {disconnecting === p.id ? "..." : "Desconectar"}
                    </button>
                  ) : (
                    <button
                      onClick={() => { if (p.id === "oura") handleConnectOura(); else if (p.id === "whoop") handleConnectWhoop(); else toast.info(`${p.name} próximamente`); }}
                      disabled={p.id === "oura" ? connectingOura : p.id === "whoop" ? connectingWhoop : false}
                      className="text-xs font-medium text-white px-3 py-1.5 rounded-lg disabled:opacity-50"
                      style={{ background: p.color }}
                    >
                      {(p.id === "oura" && connectingOura) || (p.id === "whoop" && connectingWhoop) ? "..." : "Conectar"}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">Apple Health y Google Health Connect requieren la app nativa. Garmin, Fitbit, Samsung y Xiaomi próximamente.</p>
          </div>
        )}

        {/* ── FOOTER DISCLAIMER ────────────────────────────────────────── */}
        <p className="text-xs text-muted-foreground/60 text-center pb-2">
          Los datos mostrados son informativos y no constituyen consejo médico profesional. Consulta siempre con un profesional de la salud.
        </p>
      </div>
    </div>
  );
}
