import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import SmartInsights from "@/components/SmartInsights";
import ContextualProductWidget from "@/components/ContextualProductWidget";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

type TabKey = "coach" | "dia" | "datos" | "comparar" | "add";
type MetricKey = "hrv" | "rhr" | "sleep" | "recovery" | "steps" | "active" | "spo2";
type PeriodKey = "7d" | "14d" | "30d";
type CategoryKey = "all" | "activity" | "sleep" | "body" | "nutrition" | "devices";

const mockSleepData = [
  { date: "Lun", hours: 7.2, score: 82 },
  { date: "Mar", hours: 6.8, score: 74 },
  { date: "Mie", hours: 7.5, score: 86 },
  { date: "Jue", hours: 8.1, score: 91 },
  { date: "Vie", hours: 6.5, score: 68 },
  { date: "Sab", hours: 8.5, score: 94 },
  { date: "Dom", hours: 7.8, score: 88 },
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

const mockActivityData = [
  { date: "Lun", strain: 12.5, calories: 2100 },
  { date: "Mar", strain: 8.2, calories: 1800 },
  { date: "Mie", strain: 14.1, calories: 2400 },
  { date: "Jue", strain: 10.8, calories: 2000 },
  { date: "Vie", strain: 15.3, calories: 2600 },
  { date: "Sab", strain: 6.5, calories: 1600 },
  { date: "Dom", strain: 9.7, calories: 1900 },
];

/* ── Category definitions ── */
const categories: { key: CategoryKey; label: string; icon: string; color: string }[] = [
  { key: "all", label: "Todo", icon: "🏠", color: "#F97316" },
  { key: "activity", label: "Actividad", icon: "🏃", color: "#10B981" },
  { key: "sleep", label: "Sueño", icon: "🌙", color: "#8B5CF6" },
  { key: "body", label: "Cuerpo", icon: "💪", color: "#EF4444" },
  { key: "nutrition", label: "Nutrición", icon: "🥗", color: "#F59E0B" },
  { key: "devices", label: "Dispositivos", icon: "📱", color: "#3B82F6" },
];

/* ── Searchable items mapped to categories ── */
interface SearchableItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: CategoryKey;
  action: TabKey;
  metricKey?: MetricKey;
}

const searchableItems: SearchableItem[] = [
  // Activity
  { id: "steps", title: "Pasos diarios", subtitle: "Conteo de pasos y distancia", icon: "👟", category: "activity", action: "datos", metricKey: "steps" },
  { id: "strain", title: "Strain / Esfuerzo", subtitle: "Nivel de esfuerzo cardiovascular", icon: "🔥", category: "activity", action: "dia" },
  { id: "active-min", title: "Minutos activos", subtitle: "Tiempo de actividad fisica", icon: "⏱️", category: "activity", action: "datos", metricKey: "active" },
  { id: "calories", title: "Calorias quemadas", subtitle: "Gasto calorico total del dia", icon: "🔋", category: "activity", action: "dia" },
  { id: "workouts", title: "Entrenamientos", subtitle: "Historial de sesiones de ejercicio", icon: "🏋️", category: "activity", action: "datos" },
  // Sleep
  { id: "sleep-score", title: "Puntuacion de sueño", subtitle: "Calidad general del descanso", icon: "😴", category: "sleep", action: "dia", metricKey: "sleep" },
  { id: "sleep-hours", title: "Horas de sueño", subtitle: "Duracion total del sueño", icon: "🛏️", category: "sleep", action: "datos", metricKey: "sleep" },
  { id: "sleep-phases", title: "Fases del sueño", subtitle: "REM, profundo y ligero", icon: "🌊", category: "sleep", action: "datos" },
  { id: "sleep-latency", title: "Latencia de sueño", subtitle: "Tiempo en quedarse dormido", icon: "⏳", category: "sleep", action: "datos" },
  // Body
  { id: "hrv", title: "HRV", subtitle: "Variabilidad de la frecuencia cardiaca", icon: "💖", category: "body", action: "datos", metricKey: "hrv" },
  { id: "rhr", title: "FC en reposo", subtitle: "Frecuencia cardiaca en reposo", icon: "❤️", category: "body", action: "datos", metricKey: "rhr" },
  { id: "spo2", title: "SpO2", subtitle: "Saturacion de oxigeno en sangre", icon: "🫁", category: "body", action: "datos", metricKey: "spo2" },
  { id: "recovery", title: "Recovery Score", subtitle: "Nivel de recuperacion diaria", icon: "⚡", category: "body", action: "datos", metricKey: "recovery" },
  { id: "body-temp", title: "Temperatura corporal", subtitle: "Variacion de temperatura nocturna", icon: "🌡️", category: "body", action: "datos" },
  { id: "weight", title: "Peso corporal", subtitle: "Registro y evolucion del peso", icon: "⚖️", category: "body", action: "datos" },
  // Nutrition
  { id: "macros", title: "Macronutrientes", subtitle: "Proteinas, carbohidratos y grasas", icon: "🥩", category: "nutrition", action: "coach" },
  { id: "hydration", title: "Hidratacion", subtitle: "Consumo de agua diario", icon: "💧", category: "nutrition", action: "coach" },
  { id: "meal-log", title: "Registro de comidas", subtitle: "Historial de alimentos consumidos", icon: "📋", category: "nutrition", action: "coach" },
  { id: "calories-in", title: "Calorias ingeridas", subtitle: "Balance calorico del dia", icon: "🍽️", category: "nutrition", action: "coach" },
  // Devices
  { id: "oura", title: "Oura Ring", subtitle: "Anillo de seguimiento de salud", icon: "💍", category: "devices", action: "add" },
  { id: "whoop", title: "WHOOP", subtitle: "Pulsera de rendimiento", icon: "⌚", category: "devices", action: "add" },
  { id: "apple-health", title: "Apple Health", subtitle: "Ecosistema de salud Apple", icon: "🍎", category: "devices", action: "add" },
  { id: "garmin", title: "Garmin Connect", subtitle: "Relojes y GPS deportivos", icon: "🏔️", category: "devices", action: "add" },
  { id: "fitbit", title: "Fitbit", subtitle: "Pulseras y relojes de actividad", icon: "💚", category: "devices", action: "add" },
  { id: "samsung", title: "Samsung Health", subtitle: "Ecosistema Samsung Galaxy", icon: "📱", category: "devices", action: "add" },
];

export default function HealthHub() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("coach");
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>("hrv");
  const [period, setPeriod] = useState<PeriodKey>("30d");
  const [chatInput, setChatInput] = useState("");

  /* ── Search & Filter state ── */
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [showSearchResults, setShowSearchResults] = useState(false);

  const { data: wearableConnections, refetch: refetchConnections } = trpc.wearables.getConnections.useQuery();
  const { data: ouraData } = trpc.healthHub.getOuraData.useQuery({ days: period === "7d" ? 7 : period === "14d" ? 14 : 30 });
  const { data: whoopData } = trpc.healthHub.getWhoopData.useQuery({ days: period === "7d" ? 7 : period === "14d" ? 14 : 30 });

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("wearable_connected");
    const wError = params.get("wearable_error");
    if (connected) {
      toast.success(`${connected === "oura" ? "Oura Ring" : "Whoop"} conectado correctamente`);
      refetchConnections();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (wError) {
      toast.error(`Error al conectar: ${wError}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const ouraConnected = wearableConnections?.some((c: any) => c.wearableType === "oura" && c.isActive);
  const whoopConnected = wearableConnections?.some((c: any) => c.wearableType === "whoop" && c.isActive);
  const connectedCount = (ouraConnected ? 1 : 0) + (whoopConnected ? 1 : 0);
  const hasData = connectedCount > 0;

  const healthScore = useMemo(() => {
    return { score: 81, label: "Excelente", recovery: 71, hrv: 53, rhr: 59 };
  }, [ouraData, whoopData]);

  const platforms = [
    { id: "oura", name: "Oura Ring", icon: "\uD83D\uDC8D", color: "#B4B4B4", connected: ouraConnected },
    { id: "whoop", name: "WHOOP", icon: "\u231A", color: "#00C48C", connected: whoopConnected },
    { id: "apple_health", name: "Apple Health", icon: "\uD83C\uDF4E", color: "#FF3B30", connected: false },
    { id: "garmin", name: "Garmin Connect", icon: "\uD83C\uDFD4\uFE0F", color: "#007DC5", connected: false },
    { id: "fitbit", name: "Fitbit", icon: "\uD83D\uDC9A", color: "#00B0B9", connected: false },
    { id: "samsung", name: "Samsung Health", icon: "\uD83D\uDCF1", color: "#1428A0", connected: false },
    { id: "google_fit", name: "Google Health Connect", icon: "\u2764\uFE0F", color: "#4285F4", connected: false },
    { id: "xiaomi", name: "Xiaomi Mi Band", icon: "\uD83D\uDFE0", color: "#FF6900", connected: false },
  ];

  const metrics: { key: MetricKey; label: string; icon: string; multiDevice: boolean }[] = [
    { key: "hrv", label: "HRV", icon: "\uD83D\uDC96", multiDevice: true },
    { key: "rhr", label: "FC en reposo", icon: "\u2764\uFE0F", multiDevice: true },
    { key: "sleep", label: "Horas de sueño", icon: "\uD83C\uDF19", multiDevice: true },
    { key: "recovery", label: "Recovery Score", icon: "\u26A1", multiDevice: true },
    { key: "steps", label: "Pasos", icon: "\uD83D\uDC5F", multiDevice: false },
    { key: "active", label: "Minutos activos", icon: "\u23F1\uFE0F", multiDevice: false },
    { key: "spo2", label: "SpO2", icon: "\uD83E\uDEC1", multiDevice: false },
  ];

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "coach", label: "Coach", icon: "\uD83C\uDF0D" },
    { key: "dia", label: "Dia", icon: "\uD83D\uDCC5" },
    { key: "datos", label: "Datos", icon: "\uD83D\uDCCA" },
    { key: "comparar", label: "Comparar", icon: "\uD83D\uDCF1" },
    { key: "add", label: "Add", icon: "\uD83D\uDD17" },
  ];

  /* ── Search loading simulation ── */
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() || activeCategory !== "all") {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 400);
      return () => clearTimeout(timer);
    }
    setIsSearching(false);
  }, [searchQuery, activeCategory]);

  /* ── Filtered search results ── */
  const filteredItems = useMemo(() => {
    let items = searchableItems;
    if (activeCategory !== "all") {
      items = items.filter((item) => item.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [searchQuery, activeCategory]);

  const handleSearchItemClick = (item: SearchableItem) => {
    setActiveTab(item.action);
    if (item.metricKey) setSelectedMetric(item.metricKey);
    setShowSearchResults(false);
    setSearchQuery("");
  };

  const handleConnectOura = async () => {
    setConnectingOura(true);
    try {
      const origin = window.location.origin;
      const res = await fetch(`/api/trpc/wearables.getOuraAuthUrl?input=${encodeURIComponent(JSON.stringify({ origin }))}`);
      const json = await res.json();
      if (json?.result?.data?.url) {
        toast.info("Redirigiendo a Oura Ring...");
        window.location.href = json.result.data.url;
      } else {
        toast.error("Oura Ring no esta configurado.");
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
      const origin = window.location.origin;
      const res = await fetch(`/api/trpc/wearables.getWhoopAuthUrl?input=${encodeURIComponent(JSON.stringify({ origin }))}`);
      const json = await res.json();
      if (json?.result?.data?.url) {
        toast.info("Redirigiendo a Whoop...");
        window.location.href = json.result.data.url;
      } else {
        toast.error("Whoop no esta configurado.");
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

  /* ── Whether search/filter overlay is active ── */
  const isSearchActive = showSearchResults || searchQuery.trim().length > 0 || activeCategory !== "all";

  return (
    <div className="min-h-screen" style={{ background: "#FFF8F0" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header Banner */}
        <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FDBA74 100%)" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">💓</span>
                <h1 className="text-2xl font-bold text-white">Health Hub</h1>
              </div>
              <p className="text-sm text-orange-100">
                {connectedCount > 0 ? `${connectedCount} fuente${connectedCount > 1 ? "s" : ""} conectada${connectedCount > 1 ? "s" : ""}` : "Conecta tus wearables para ver todas tus métricas"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {connectedCount > 0 && (
                <button onClick={() => toast.success("Sincronizando datos...")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30 hover:bg-white/30">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                  Sincronizar
                </button>
              )}
              <span className={`flex items-center gap-1 text-xs font-medium ${hasData ? "text-white" : "text-orange-100"}`}>
                <span className={`w-2 h-2 rounded-full ${hasData ? "bg-green-300" : "bg-orange-200"}`}></span>
                {hasData ? "En vivo" : "Sin datos"}
              </span>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            SEARCH BAR
        ═══════════════════════════════════════════════════════════════ */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-card rounded-2xl border border-border shadow-sm px-4 py-3 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim()) setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Buscar metricas, dispositivos, datos de salud..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setShowSearchResults(false); setActiveCategory("all"); }} className="text-muted-foreground/70 hover:text-muted-foreground transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>

          {/* ── Category filter pills ── */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 -mx-1 px-1">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    if (cat.key !== "all") setShowSearchResults(true);
                    else if (!searchQuery.trim()) setShowSearchResults(false);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? "text-white border-transparent shadow-sm"
                      : "bg-card text-muted-foreground border-border hover:border-border/80 hover:shadow-sm"
                  }`}
                  style={isActive ? { background: cat.color, borderColor: cat.color } : {}}
                >
                  <span className="text-sm">{cat.icon}</span>
                  {cat.label}
                  {isActive && cat.key !== "all" && (
                    <span className="ml-0.5 bg-card/30 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                      {searchableItems.filter((i) => i.category === cat.key).length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Search results dropdown with animations ── */}
          <div
            className={`mt-2 bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-h-[420px] overflow-y-auto z-50 relative transition-all duration-300 ease-out origin-top ${
              showSearchResults
                ? "opacity-100 scale-y-100 translate-y-0"
                : "opacity-0 scale-y-95 -translate-y-2 pointer-events-none h-0 border-0 shadow-none mt-0"
            }`}
          >
            {/* Loading skeleton state */}
            {isSearching ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-3 w-28 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1" />
                  <div className="h-3 w-16 bg-muted/50 rounded-full animate-pulse" />
                </div>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-2" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="w-10 h-10 rounded-xl bg-muted/50 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-gray-200 rounded-full animate-pulse w-3/5" style={{ animationDelay: `${i * 80 + 40}ms` }} />
                      <div className="h-2.5 bg-muted/50 rounded-full animate-pulse w-2/5" style={{ animationDelay: `${i * 80 + 80}ms` }} />
                    </div>
                    <div className="h-5 w-16 bg-muted/50 rounded-full animate-pulse" style={{ animationDelay: `${i * 80 + 60}ms` }} />
                  </div>
                ))}
              </div>
            ) : filteredItems.length === 0 && showSearchResults ? (
              /* ── Friendly empty state ── */
              <div className="py-10 px-6 text-center">
                <div className="relative inline-block mb-4">
                  <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="animate-[bounce_2s_ease-in-out_infinite]">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card shadow-md flex items-center justify-center">
                    <span className="text-sm">🤔</span>
                  </div>
                </div>
                <p className="text-base font-semibold text-foreground mb-1">No encontramos resultados</p>
                <p className="text-sm text-muted-foreground mb-5 max-w-[260px] mx-auto leading-relaxed">
                  {searchQuery.trim()
                    ? <>No hay coincidencias para <span className="font-medium text-orange-600">"{searchQuery}"</span>. Prueba con otro termino.</>
                    : "No hay elementos en esta categoria. Prueba seleccionando otra."}
                </p>
                <div className="flex flex-col items-center gap-2">
                  {searchQuery.trim() && (
                    <button
                      onClick={() => { setSearchQuery(""); }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-95"
                      style={{ background: "#F97316" }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      Limpiar busqueda
                    </button>
                  )}
                  {activeCategory !== "all" && (
                    <button
                      onClick={() => setActiveCategory("all")}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground bg-muted/50 hover:bg-gray-200 transition-all active:scale-95"
                    >
                      <span className="text-xs">🏠</span> Ver todas las categorias
                    </button>
                  )}
                </div>
                {/* Suggested categories */}
                {searchQuery.trim() && (
                  <div className="mt-5 pt-5 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider mb-3">Categorias sugeridas</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {categories.filter(c => c.key !== "all").map((cat) => (
                        <button
                          key={cat.key}
                          onClick={() => { setSearchQuery(""); setActiveCategory(cat.key); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card border border-border text-muted-foreground hover:border-border/80 hover:shadow-sm transition-all active:scale-95"
                        >
                          <span>{cat.icon}</span> {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : showSearchResults && filteredItems.length > 0 ? (
              /* ── Results list with staggered animations ── */
              <>
                <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                    {activeCategory === "all" ? "Todos los resultados" : categories.find((c) => c.key === activeCategory)?.label}
                  </p>
                  <span className="text-xs text-muted-foreground/70">{filteredItems.length} elementos</span>
                </div>
                {filteredItems.map((item, idx) => {
                  const catDef = categories.find((c) => c.key === item.category);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSearchItemClick(item)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50/60 transition-all text-left border-b border-gray-50 last:border-0 animate-[fadeSlideIn_0.25s_ease-out_both]"
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-transform hover:scale-110"
                        style={{ background: `${catDef?.color || "#F97316"}15` }}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ background: `${catDef?.color || "#F97316"}15`, color: catDef?.color || "#F97316" }}
                        >
                          {catDef?.label}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" className="transition-transform group-hover:translate-x-0.5"><polyline points="9 18 15 12 9 6"/></svg>
                      </div>
                    </button>
                  );
                })}
              </>
            ) : null}
            {showSearchResults && !isSearching && (
              <div className="px-4 py-2.5 border-t border-border bg-muted/30/50">
                <button
                  onClick={() => { setShowSearchResults(false); setSearchQuery(""); setActiveCategory("all"); }}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground/80 transition-colors"
                >
                  Cerrar resultados
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            MAIN CONTENT (hidden when search results are showing)
        ═══════════════════════════════════════════════════════════════ */}
        {!showSearchResults && (
          <>
            {/* Health Score Card - Light/Warm */}
            <div className="rounded-2xl p-6" style={{ background: "linear-gradient(135deg, #FFF3E8 0%, #FFF8F0 100%)", border: "1px solid #FFE0C2" }}>
              <p className="text-xs font-semibold tracking-wider mb-3" style={{ color: "#F97316" }}>SCORE DE SALUD</p>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold" style={{ color: "#F97316" }}>{healthScore.score}</span>
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <p className="text-sm font-semibold mt-1" style={{ color: "#16A34A" }}>{healthScore.label}</p>
                </div>
                <div className="relative w-16 h-16">
                  <svg viewBox="0 0 64 64" className="w-full h-full">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#FFE0C2" strokeWidth="4" />
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#F97316" strokeWidth="4" strokeDasharray={`${healthScore.score * 1.76} 176`} strokeLinecap="round" transform="rotate(-90 32 32)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                </div>
              </div>
              <div className="border-t mt-4 pt-4 grid grid-cols-3 gap-4" style={{ borderColor: "#FFE0C2" }}>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#7C3AED" }}>{healthScore.recovery}%</p>
                  <p className="text-xs text-muted-foreground">Recovery</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#7C3AED" }}>{healthScore.hrv}ms</p>
                  <p className="text-xs text-muted-foreground">HRV</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold" style={{ color: "#7C3AED" }}>{healthScore.rhr}bpm</p>
                  <p className="text-xs text-muted-foreground">FC reposo</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-card shadow-sm border border-border text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}>
                  <span className="text-sm">{tab.icon}</span>
                  {tab.label}
                  {tab.key === "comparar" && connectedCount > 1 && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                </button>
              ))}
            </div>

            {/* TAB: COACH */}
            {activeTab === "coach" && (
              <div className="space-y-4">
                <div className="rounded-2xl overflow-hidden bg-card border border-border shadow-sm">
                  <div className="flex items-center gap-1 p-3 border-b border-border" style={{ background: "#FFF8F0" }}>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white" style={{ background: "#F97316" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                      Chat
                    </button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">Valorar</button>
                    <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">Historial</button>
                    <button className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground border border-border hover:border-orange-300 hover:text-orange-600">+ Nuevo</button>
                  </div>
                  <div className="p-4" style={{ background: "#FFFBF7" }}>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #F97316, #FB923C)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
                      </div>
                      <div className="rounded-2xl rounded-tl-sm p-4 max-w-[85%]" style={{ background: "#FFF3E8", border: "1px solid #FFE0C2" }}>
                        <p className="text-sm text-foreground leading-relaxed">
                          Hola! Soy tu <strong className="text-orange-600">Coach Buddy</strong>, tu asistente de salud y rendimiento personal.
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed mt-3">
                          Tengo acceso a todas tus metricas de wearables conectados: HRV, recovery score, sueño, strain, SpO2 y mucho mas.
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed mt-3">
                          En que puedo ayudarte hoy? Puedes preguntarme sobre tus metricas, si estas listo para entrenar, como mejorar tu recuperacion, o cualquier duda sobre salud y rendimiento.
                        </p>
                        <p className="text-right text-[10px] text-muted-foreground mt-2">
                          {new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 border-t border-border" style={{ background: "#FFF8F0" }}>
                    <div className="flex gap-2">
                      <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Pregunta sobre tu salud..." className="flex-1 bg-background text-foreground text-sm rounded-full px-4 py-2.5 placeholder-muted-foreground border border-border focus:border-orange-400 focus:outline-none" />
                      <button className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ background: "#F97316" }} onClick={() => { if (chatInput.trim()) { toast.info("Funcion de chat proximamente"); setChatInput(""); } }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                  <SmartInsights />
                </div>
              </div>
            )}

            {/* TAB: DIA */}
            {activeTab === "dia" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-card border border-border p-5 shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4">Resumen del dia</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
                      <p className="text-xs text-muted-foreground">Sueño</p>
                      <p className="text-xl font-bold text-purple-700">86<span className="text-xs font-normal text-muted-foreground/70">/100</span></p>
                      <p className="text-xs text-green-600 mt-1">+4 vs ayer</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-50 border border-green-100">
                      <p className="text-xs text-muted-foreground">Recovery</p>
                      <p className="text-xl font-bold text-green-700">78%</p>
                      <p className="text-xs text-amber-600 mt-1">-5 vs ayer</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                      <p className="text-xs text-muted-foreground">Strain</p>
                      <p className="text-xl font-bold text-orange-700">12.5</p>
                      <p className="text-xs text-green-600 mt-1">Moderado</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs text-muted-foreground">HRV</p>
                      <p className="text-xl font-bold text-blue-700">53ms</p>
                      <p className="text-xs text-green-600 mt-1">+3 vs ayer</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><span>😴</span> Calidad del Sueño (7 dias)</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={mockSleepData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="score" stroke="#8b5cf6" fill="#ede9fe" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Síntomas del día + BuddyCare */}
                <div className="rounded-2xl border border-border bg-card p-4">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><span>🩺</span> ¿Cómo te encuentras hoy?</h3>
                  <p className="text-xs text-muted-foreground mb-3">Selecciona si tienes algún síntoma y te sugeriremos productos BuddyCare que pueden ayudarte.</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {["Retención de líquidos", "Fatiga", "Digestión pesada", "Estrés", "Insomnio", "Inflamación", "Falta de energía", "Dolor muscular"].map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          selectedSymptoms.includes(s)
                            ? "bg-emerald-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >{s}</button>
                    ))}
                  </div>
                  {selectedSymptoms.length > 0 && (
                    <ContextualProductWidget
                      symptoms={selectedSymptoms}
                      mode="care"
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="bg-card rounded-2xl p-5 border border-border">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><span>🏃</span> Actividad (Strain)</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={mockActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="strain" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB: DATOS */}
            {activeTab === "datos" && (
              <div className="space-y-4">
                <div className="rounded-xl bg-card border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Datos historicos</h3>
                    <div className="flex items-center gap-1">
                      {(["7d", "14d", "30d"] as PeriodKey[]).map((p) => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${period === p ? "bg-orange-500 text-white" : "bg-muted/50 text-muted-foreground hover:bg-gray-200"}`}>{p}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "HRV promedio", value: "53ms", trend: "+3%", up: true },
                      { label: "FC reposo", value: "59bpm", trend: "-1bpm", up: true },
                      { label: "Horas sueño", value: "7.5h", trend: "+0.3h", up: true },
                      { label: "Recovery", value: "71%", trend: "+5%", up: true },
                      { label: "Strain diario", value: "11.2", trend: "+0.8", up: false },
                      { label: "SpO2", value: "97%", trend: "Estable", up: true },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{item.value}</span>
                          <span className={`text-xs ${item.up ? "text-green-600" : "text-amber-600"}`}>{item.trend}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
                  <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><span>💚</span> Recuperacion</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={mockRecoveryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB: COMPARAR */}
            {activeTab === "comparar" && (
              <div className="space-y-5">
                <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #F3EEFF 0%, #EDE9FE 100%)", border: "1px solid #DDD6FE" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">📱</span>
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: "#6D28D9" }}>Comparar Wearables</h3>
                      <p className="text-xs" style={{ color: "#7C3AED" }}>Metricas lado a lado de tus dispositivos</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/70" style={{ color: "#6D28D9", border: "1px solid #DDD6FE" }}>
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> WHOOP
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white/70" style={{ color: "#6D28D9", border: "1px solid #DDD6FE" }}>
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Oura Ring
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-3">SELECCIONA UNA METRICA</p>
                  <div className="flex flex-wrap gap-2">
                    {metrics.map((m) => (
                      <button key={m.key} onClick={() => setSelectedMetric(m.key)} className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${selectedMetric === m.key ? "bg-purple-100 text-purple-800 border border-purple-300" : "bg-card text-muted-foreground border border-border hover:border-border/80"}`}>
                        <span>{m.icon}</span> {m.label}
                        {m.multiDevice && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-2 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                    Metrica disponible en varios dispositivos
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Periodo:</span>
                  {(["7d", "14d", "30d"] as PeriodKey[]).map((p) => (
                    <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${period === p ? "text-white" : "text-muted-foreground hover:text-foreground/80"}`} style={period === p ? { background: "#F97316" } : {}}>{p}</button>
                  ))}
                </div>

                <div className="rounded-xl bg-card border border-border p-5 shadow-sm">
                  <div className="h-48 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground/70 mb-2">{connectedCount >= 2 ? "Grafico de comparacion" : "Conecta 2 o mas dispositivos para comparar"}</p>
                      {connectedCount < 2 && <button onClick={() => setActiveTab("add")} className="text-xs font-medium text-purple-600 hover:text-purple-700">Ir a conectar dispositivos</button>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: ADD */}
            {activeTab === "add" && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground/80">Dispositivos disponibles</h3>
                <div className="grid grid-cols-1 gap-3">
                  {platforms.map((platform) => (
                    <div key={platform.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${platform.connected ? "border-green-200 bg-green-50/50" : "border-border bg-card hover:border-border/80 hover:shadow-sm"}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: `${platform.color}15` }}>{platform.icon}</div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{platform.name}</p>
                          <p className="text-xs text-muted-foreground">{platform.connected ? "Conectado y sincronizando" : "Disponible para conectar"}</p>
                        </div>
                      </div>
                      {platform.connected ? (
                        <button onClick={() => handleDisconnect(platform.id as "oura" | "whoop")} disabled={disconnecting === platform.id} className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 border border-red-200">
                          {disconnecting === platform.id ? "..." : "Desconectar"}
                        </button>
                      ) : (
                        <button onClick={() => { if (platform.id === "oura") handleConnectOura(); else if (platform.id === "whoop") handleConnectWhoop(); else toast.info(`Conexion con ${platform.name} proximamente disponible`); }} disabled={platform.id === "oura" ? connectingOura : platform.id === "whoop" ? connectingWhoop : false} className="text-xs font-medium text-white px-3 py-1.5 rounded-lg disabled:opacity-50" style={{ background: platform.color }}>
                          {(platform.id === "oura" && connectingOura) || (platform.id === "whoop" && connectingWhoop) ? "..." : "Conectar"}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground/70 text-center mt-2">Apple Health y Google Health Connect requieren la app nativa. Garmin, Fitbit, Samsung y Xiaomi proximamente.</p>
              </div>
            )}

            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground/70">Los datos mostrados son informativos y no constituyen consejo medico profesional.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
