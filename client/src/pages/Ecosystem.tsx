import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  BarChart3,
  ChevronRight,
  Clock,
  Dumbbell,
  ExternalLink,
  Heart,
  Lightbulb,
  Link2,
  Loader2,
  Pill,
  RefreshCw,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Utensils,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type TabKey = "overview" | "activity" | "recommendations" | "sync" | "badges";

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; gradient: string }> = {
  buddyone: { label: "BuddyOne", color: "#10B981", icon: <Utensils className="w-4 h-4" />, gradient: "from-emerald-500 to-teal-500" },
  buddycoach: { label: "BuddyCoach", color: "#7C3AED", icon: <Dumbbell className="w-4 h-4" />, gradient: "from-violet-500 to-purple-500" },
  buddycare: { label: "BuddyCare", color: "#EC4899", icon: <Heart className="w-4 h-4" />, gradient: "from-pink-500 to-rose-500" },
  buddyshop: { label: "BuddyShop", color: "#F59E0B", icon: <ShoppingBag className="w-4 h-4" />, gradient: "from-amber-500 to-orange-500" },
  healthhub: { label: "Health Hub", color: "#4F46E5", icon: <Activity className="w-4 h-4" />, gradient: "from-indigo-500 to-blue-500" },
};

const RARITY_COLORS: Record<string, string> = {
  common: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  rare: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  epic: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  legendary: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Ecosystem() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // ── Queries ──────────────────────────────────────────────────────────────
  const scoreQ = trpc.ecosystemEnhanced.getEcosystemScore.useQuery(undefined, { enabled: !!user });
  const actionsQ = trpc.ecosystemEnhanced.getContextualActions.useQuery(undefined, { enabled: !!user });
  const timelineQ = trpc.ecosystemEnhanced.getActivityTimeline.useQuery({ limit: 15, offset: 0 }, { enabled: !!user });
  const recsQ = trpc.ecosystemEnhanced.getCrossRecommendations.useQuery(undefined, { enabled: !!user });
  const digestQ = trpc.ecosystemEnhanced.getWeeklyDigest.useQuery(undefined, { enabled: !!user });
  const badgesQ = trpc.ecosystemEnhanced.getEcosystemBadges.useQuery(undefined, { enabled: !!user });
  const syncQ = trpc.ecosystemEnhanced.getSyncFlows.useQuery(undefined, { enabled: !!user });
  const nutritionQ = trpc.ecosystemEnhanced.getTodayNutrition.useQuery(undefined, { enabled: !!user });

  const score = scoreQ.data;
  const actions = actionsQ.data;
  const timeline = timelineQ.data;
  const recs = recsQ.data;
  const digest = digestQ.data;
  const badgesData = badgesQ.data;
  const syncFlows = syncQ.data;
  const nutrition = nutritionQ.data;

  // ── Helpers ──────────────────────────────────────────────────────────────
  const timeLabel = useMemo(() => {
    const map: Record<string, string> = { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas tardes", night: "Buenas noches" };
    return map[actions?.timeOfDay ?? "morning"] ?? "Hola";
  }, [actions?.timeOfDay]);

  function trendIcon(current: number, previous: number) {
    if (current > previous) return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />;
    if (current < previous) return <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />;
    return <span className="text-zinc-500 text-xs">—</span>;
  }

  function trendPct(current: number, previous: number) {
    if (previous === 0) return current > 0 ? "+100%" : "—";
    const pct = Math.round(((current - previous) / previous) * 100);
    return pct > 0 ? `+${pct}%` : `${pct}%`;
  }

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-6 pb-28 space-y-6">

        {/* ═══ HEADER ═══ */}
        <div className="space-y-1">
          <p className="text-zinc-400 text-sm">{timeLabel}, {user?.name?.split(" ")[0] ?? "usuario"}</p>
          <h1 className="text-2xl font-bold tracking-tight">Ecosistema BuddyOne</h1>
        </div>

        {/* ═══ 1. DYNAMIC SCORE CARD ═══ */}
        <Card className="border-0 bg-gradient-to-br from-violet-600/30 via-indigo-600/20 to-purple-700/30 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_60%)]" />
          <CardContent className="p-5 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-violet-300 uppercase tracking-wider font-medium mb-1">Ecosystem Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black tabular-nums">{score?.score ?? 0}</span>
                  <span className="text-lg text-zinc-400">/100</span>
                </div>
                <Badge variant="outline" className="mt-1 border-violet-400/40 text-violet-300 text-xs">
                  {score?.label ?? "Cargando..."}
                </Badge>
              </div>
              <div className="w-20 h-20 relative">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="url(#scoreGrad)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(score?.score ?? 0) * 2.64} 264`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-violet-300" />
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            {score?.breakdown && (
              <div className="grid grid-cols-2 gap-2">
                {score.breakdown.map((b) => (
                  <div key={b.key} className="bg-white/5 rounded-lg p-2.5 flex items-center gap-2">
                    <span className="text-lg">{b.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-zinc-400 truncate">{b.label}</p>
                      <div className="flex items-center gap-1.5">
                        <Progress value={(b.score / b.max) * 100} className="h-1.5 flex-1 bg-white/10" />
                        <span className="text-xs font-semibold tabular-nums">{b.score}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {score?.tip && (
              <p className="text-xs text-violet-200/70 mt-3 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" /> {score.tip}
              </p>
            )}
          </CardContent>
        </Card>

        {/* ═══ 10. CONTEXTUAL QUICK ACTIONS ═══ */}
        {actions?.actions && (
          <div className="grid grid-cols-4 gap-2">
            {actions.actions.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  if (a.url.startsWith("http")) window.open(a.url, "_blank");
                  else window.location.href = a.url;
                }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-110"
                  style={{ background: `${a.color}20` }}
                >
                  {a.icon}
                </div>
                <span className="text-[10px] text-zinc-300 text-center leading-tight font-medium">{a.label}</span>
                <span className="text-[9px] text-zinc-500">{a.sublabel}</span>
              </button>
            ))}
          </div>
        )}

        {/* ═══ TABS ═══ */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
          <TabsList className="bg-zinc-800/60 border border-zinc-700/50 w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-200">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-200">
              Actividad
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-200">
              Para ti
            </TabsTrigger>
            <TabsTrigger value="sync" className="text-xs data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-200">
              Sincronización
            </TabsTrigger>
            <TabsTrigger value="badges" className="text-xs data-[state=active]:bg-violet-600/30 data-[state=active]:text-violet-200">
              Logros
            </TabsTrigger>
          </TabsList>

          {/* ─── TAB: OVERVIEW ─── */}
          <TabsContent value="overview" className="space-y-4 mt-4">

            {/* 8. Real nutrition data */}
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" /> Nutrición hoy
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-xl font-bold text-emerald-400">{nutrition?.calories ?? 0}</p>
                  <p className="text-[10px] text-zinc-500">kcal</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-blue-400">{nutrition?.protein ?? 0}g</p>
                  <p className="text-[10px] text-zinc-500">Proteína</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-amber-400">{nutrition?.carbs ?? 0}g</p>
                  <p className="text-[10px] text-zinc-500">Carbos</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-rose-400">{nutrition?.fats ?? 0}g</p>
                  <p className="text-[10px] text-zinc-500">Grasas</p>
                </div>
                {nutrition?.mealCount === 0 && (
                  <div className="col-span-4 text-center py-2">
                    <p className="text-xs text-zinc-500">No has registrado comidas hoy</p>
                    <Button variant="ghost" size="sm" className="text-emerald-400 text-xs mt-1" onClick={() => window.location.href = "/app/diary"}>
                      Registrar comida <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 5. Weekly digest */}
            {digest && (
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-400" /> Resumen semanal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Comidas", current: digest.thisWeek.meals, prev: digest.lastWeek.meals, icon: <Utensils className="w-3.5 h-3.5" /> },
                      { label: "Calorías", current: digest.thisWeek.calories, prev: digest.lastWeek.calories, icon: <Zap className="w-3.5 h-3.5" /> },
                      { label: "Proteína (g)", current: digest.thisWeek.protein, prev: digest.lastWeek.protein, icon: <Target className="w-3.5 h-3.5" /> },
                      { label: "Suplementos", current: digest.thisWeek.supplements, prev: digest.lastWeek.supplements, icon: <Pill className="w-3.5 h-3.5" /> },
                    ].map((item) => (
                      <div key={item.label} className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-zinc-400">{item.icon}</span>
                          <div className="flex items-center gap-1">
                            {trendIcon(item.current, item.prev)}
                            <span className={`text-[10px] font-medium ${item.current >= item.prev ? "text-emerald-400" : "text-red-400"}`}>
                              {trendPct(item.current, item.prev)}
                            </span>
                          </div>
                        </div>
                        <p className="text-lg font-bold">{item.current.toLocaleString()}</p>
                        <p className="text-[10px] text-zinc-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 4. Visual connection map */}
            <Card className="border-zinc-800 bg-zinc-900/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-violet-400" /> Mapa del ecosistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative flex flex-col items-center py-4">
                  {/* Central hub */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20 z-10 mb-4">
                    <span className="text-xl font-bold">B1</span>
                  </div>
                  {/* Spokes */}
                  <div className="grid grid-cols-2 gap-3 w-full">
                    {Object.entries(SOURCE_CONFIG).filter(([k]) => k !== "buddyone" && k !== "healthhub").map(([key, cfg]) => (
                      <div key={key} className="flex items-center gap-2 bg-white/5 rounded-lg p-3 hover:bg-white/8 transition-colors">
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{cfg.label}</p>
                          <p className="text-[10px] text-zinc-500">Conectado</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB: ACTIVITY TIMELINE ─── */}
          <TabsContent value="activity" className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-300">Actividad reciente</h3>
              <Button variant="ghost" size="sm" className="text-xs text-zinc-500" onClick={() => timelineQ.refetch()}>
                <RefreshCw className="w-3 h-3 mr-1" /> Actualizar
              </Button>
            </div>

            {timelineQ.isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            )}

            {timeline && timeline.length === 0 && (
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardContent className="py-10 text-center">
                  <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">Aún no hay actividad registrada</p>
                  <p className="text-xs text-zinc-600 mt-1">Tu actividad en el ecosistema aparecerá aquí</p>
                </CardContent>
              </Card>
            )}

            {timeline && timeline.length > 0 && (
              <div className="space-y-1">
                {timeline.map((item) => {
                  const cfg = SOURCE_CONFIG[item.source] ?? SOURCE_CONFIG.buddyone;
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] transition-colors">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.description && <p className="text-xs text-zinc-500 mt-0.5">{item.description}</p>}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500 py-0">{cfg.label}</Badge>
                          <span className="text-[10px] text-zinc-600">
                            {new Date(item.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ─── TAB: RECOMMENDATIONS ─── */}
          <TabsContent value="recommendations" className="space-y-3 mt-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Recomendaciones para ti
            </h3>

            {recsQ.isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            )}

            {recs && recs.length === 0 && (
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardContent className="py-10 text-center">
                  <Lightbulb className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">Completa tu perfil para recibir recomendaciones</p>
                  <Button variant="ghost" size="sm" className="text-violet-400 text-xs mt-2" onClick={() => window.location.href = "/app/profile"}>
                    Ir a mi perfil <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {recs && recs.map((rec) => {
              const cfg = SOURCE_CONFIG[rec.source] ?? SOURCE_CONFIG.buddyone;
              return (
                <Card key={rec.id} className="border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-lg">{rec.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{rec.title}</p>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{rec.description}</p>
                        <Button
                          variant="ghost" size="sm"
                          className="text-xs mt-2 px-0 h-auto text-violet-400 hover:text-violet-300"
                          onClick={() => {
                            if (rec.actionUrl.startsWith("http")) window.open(rec.actionUrl, "_blank");
                            else window.location.href = rec.actionUrl;
                          }}
                        >
                          {rec.actionLabel} <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ─── TAB: SYNC FLOWS ─── */}
          <TabsContent value="sync" className="space-y-4 mt-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" /> Flujo de datos entre apps
            </h3>
            <p className="text-xs text-zinc-500">Así fluyen tus datos entre las apps del ecosistema BuddyOne.</p>

            {syncFlows && syncFlows.map((flow, i) => {
              const fromCfg = SOURCE_CONFIG[flow.from] ?? SOURCE_CONFIG.buddyone;
              const toCfg = SOURCE_CONFIG[flow.to] ?? SOURCE_CONFIG.buddyone;
              return (
                <Card key={i} className="border-zinc-800 bg-zinc-900/80">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${fromCfg.gradient} flex items-center justify-center`}>
                        {fromCfg.icon}
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />
                        <ArrowRight className="w-4 h-4 text-zinc-500 mx-2" />
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-600 to-transparent" />
                      </div>
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${toCfg.gradient} flex items-center justify-center`}>
                        {toCfg.icon}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">{flow.fromLabel}</span>
                      <span className="text-[10px] text-zinc-500">&rarr;</span>
                      <span className="text-xs font-medium">{flow.toLabel}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {flow.dataTypes.map((dt) => (
                        <Badge key={dt} variant="outline" className="text-[9px] border-zinc-700 text-zinc-400 py-0">
                          {dt}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ─── TAB: BADGES / GAMIFICATION ─── */}
          <TabsContent value="badges" className="space-y-4 mt-4">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Logros del ecosistema
            </h3>

            {badgesQ.isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
              </div>
            )}

            {/* Earned badges */}
            {badgesData && badgesData.earned.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Conseguidos ({badgesData.earned.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {badgesData.earned.map((b) => (
                    <div key={b.id} className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-2xl">{b.icon}</span>
                        <Star className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="text-xs font-semibold">{b.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{b.description}</p>
                      <Badge className={`mt-2 text-[9px] ${RARITY_COLORS[b.rarity]}`}>
                        {b.rarity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available badges */}
            {badgesData && badgesData.available.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wider">Por conseguir ({badgesData.available.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {badgesData.available.map((b) => (
                    <div key={b.id} className="bg-white/[0.02] rounded-xl p-3 border border-zinc-800 opacity-60">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-2xl grayscale">{b.icon}</span>
                        <Shield className="w-3.5 h-3.5 text-zinc-600" />
                      </div>
                      <p className="text-xs font-semibold text-zinc-400">{b.name}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{b.description}</p>
                      <Badge className={`mt-2 text-[9px] ${RARITY_COLORS[b.rarity]}`}>
                        {b.rarity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {badgesData && badgesData.earned.length === 0 && badgesData.available.length === 0 && (
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardContent className="py-10 text-center">
                  <Award className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm text-zinc-400">Los logros se desbloquearán con tu actividad</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
