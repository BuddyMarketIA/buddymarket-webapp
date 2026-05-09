import { useState } from "react"
import { useTranslation } from 'react-i18next';;
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/sonner-a11y-shim";
import {
  Heart,
  Activity,
  Moon,
  Footprints,
  Flame,
  Droplets,
  TrendingUp,
  Smartphone,
  Watch,
  RefreshCw,
  BarChart3,
  Zap,
  CheckCircle2,
  XCircle,
  Info,
  Trash2,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  Wifi,
  WifiOff,
  Settings,
  Database,
  AlertTriangle,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMinutes(min: number | null | undefined): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatNumber(n: number | null | undefined, unit = ""): string {
  if (n == null) return "—";
  return `${n.toLocaleString("es-ES")}${unit ? " " + unit : ""}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  goal,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  color: string;
  goal?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {unit && <p className="text-xs text-muted-foreground">{unit}</p>}
            {goal && <p className="text-xs text-muted-foreground mt-1">{goal}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Platform integration card with visual status
function PlatformCard({
  icon,
  name,
  description,
  deviceHint,
  enabled,
  onToggle,
  disabled,
  statusColor,
  features,
}: {
  icon: string;
  name: string;
  description: string;
  deviceHint: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  disabled: boolean;
  statusColor: string;
  features: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-xl border-2 transition-all duration-200 ${
        enabled
          ? "border-green-500/40 bg-green-500/5 shadow-sm"
          : "border-border bg-card"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Platform icon */}
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
              enabled ? "bg-background shadow-sm" : "bg-muted"
            }`}
          >
            {icon}
          </div>

          {/* Name + description */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm">{name}</span>
              {enabled ? (
                <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0 h-4 gap-0.5">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  Activo
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-0.5">
                  <XCircle className="h-2.5 w-2.5" />
                  Inactivo
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{deviceHint}</p>
          </div>

          {/* Toggle */}
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={disabled}
            className="flex-shrink-0"
          />
        </div>

        {/* Description + expand */}
        <div className="mt-3 flex items-start justify-between gap-2">
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
          <button
            onClick={() => setExpanded((p) => !p)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 flex-shrink-0 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "Menos" : "Más"}
          </button>
        </div>

        {/* Expanded features */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[11px] font-medium text-muted-foreground mb-2">Datos disponibles:</p>
            <div className="flex flex-wrap gap-1.5">
              {features.map((f) => (
                <span
                  key={f}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Data type toggle row
function DataTypeRow({
  icon,
  label,
  description,
  enabled,
  onToggle,
  disabled,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  disabled: boolean;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground leading-none">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} disabled={disabled} />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ConnectedHealth() {
  const [activeTab, setActiveTab] = useState("today");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const { data: todaySummary, isLoading: loadingToday, refetch: refetchToday } = trpc.health.getTodaySummary.useQuery();
  const { data: weeklySummary, isLoading: loadingWeekly } = trpc.health.getWeeklySummary.useQuery();
  const { data: integration, isLoading: loadingIntegration, refetch: refetchIntegration } = trpc.health.getIntegration.useQuery();

  const utils = trpc.useUtils();

  const updateIntegration = trpc.health.updateIntegration.useMutation({
    onMutate: ({ ...input }) => {
      const key = Object.keys(input)[0];
      setSavingKey(key ?? null);
    },
    onSuccess: () => {
      toast.success("Configuración guardada");
      setSavingKey(null);
      utils.health.getIntegration.invalidate();
    },
    onError: () => {
      toast.error("Error al guardar la configuración");
      setSavingKey(null);
      refetchIntegration();
    },
  });

  const handleToggle = (key: string, value: boolean) => {
    updateIntegration.mutate({ [key]: value } as any);
  };

  const anySourceEnabled =
    integration?.appleHealthEnabled ||
    integration?.googleHealthConnectEnabled ||
    integration?.garminEnabled ||
    integration?.fitbitEnabled ||
    integration?.samsungHealthEnabled;

  const connectedSources = [
    integration?.appleHealthEnabled && "Apple Health",
    integration?.googleHealthConnectEnabled && "Google Health Connect",
    integration?.garminEnabled && "Garmin",
    integration?.fitbitEnabled && "Fitbit",
    integration?.samsungHealthEnabled && "Samsung Health",
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Salud Conectada</h1>
          <p className="text-sm text-muted-foreground">Datos sincronizados desde tu app de salud</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { refetchToday(); refetchIntegration(); }}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Connection Status Banner */}
      <Card
        className={`border-2 ${
          anySourceEnabled
            ? "border-green-500/30 bg-green-500/5"
            : "border-orange-500/30 bg-orange-500/5"
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${anySourceEnabled ? "bg-green-500" : "bg-orange-400"}`}
            >
              {anySourceEnabled ? (
                <Wifi className="h-5 w-5 text-white" />
              ) : (
                <WifiOff className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm">
                {anySourceEnabled
                  ? `${connectedSources.length} fuente${connectedSources.length > 1 ? "s" : ""} conectada${connectedSources.length > 1 ? "s" : ""}`
                  : "Sin fuentes de datos conectadas"}
              </p>
              <p className="text-xs text-muted-foreground">
                {anySourceEnabled
                  ? connectedSources.join(" · ") +
                    (integration?.lastSyncAt
                      ? ` · Última sync: ${new Date(integration.lastSyncAt).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`
                      : "")
                  : "Activa una integración en la pestaña Configuración"}
              </p>
            </div>
            <Badge variant={anySourceEnabled ? "default" : "secondary"}>
              {anySourceEnabled ? t("common.active") : t("common.inactive")}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="week">Esta semana</TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            Configuración
          </TabsTrigger>
        </TabsList>

        {/* ── TODAY TAB ─────────────────────────────────────────────────────── */}
        <TabsContent value="today" className="space-y-4 mt-4">
          {loadingToday ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-24 bg-muted/30" />
                </Card>
              ))}
            </div>
          ) : todaySummary ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricCard icon={Footprints} label="Pasos" value={formatNumber(todaySummary.steps)} goal="Meta: 10.000 pasos" color="bg-blue-500" />
                <MetricCard icon={Flame} label="Calorías quemadas" value={formatNumber(todaySummary.caloriesBurned)} unit="kcal" color="bg-orange-500" />
                <MetricCard icon={Activity} label="Minutos activos" value={formatNumber(todaySummary.activeMinutes)} unit="min" color="bg-green-500" />
                <MetricCard icon={Heart} label="Frecuencia cardíaca" value={formatNumber(todaySummary.heartRateAvg)} unit="bpm" color="bg-red-500" />
                <MetricCard icon={Moon} label="Sueño" value={formatMinutes(todaySummary.sleepDurationMin)} goal={todaySummary.sleepScore ? `Puntuación: ${todaySummary.sleepScore}/100` : undefined} color="bg-purple-500" />
                <MetricCard icon={Droplets} label="Agua" value={todaySummary.waterMl ? `${(todaySummary.waterMl / 1000).toFixed(1)}` : "—"} unit="litros" color="bg-cyan-500" />
              </div>
              {(todaySummary.distanceKm || todaySummary.floorsClimbed || todaySummary.vo2Max) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {todaySummary.distanceKm != null && <MetricCard icon={TrendingUp} label="Distancia" value={todaySummary.distanceKm.toFixed(2)} unit="km" color="bg-teal-500" />}
                  {todaySummary.floorsClimbed != null && <MetricCard icon={BarChart3} label="Pisos subidos" value={formatNumber(todaySummary.floorsClimbed)} color="bg-amber-500" />}
                  {todaySummary.vo2Max != null && <MetricCard icon={Zap} label="VO2 Max" value={todaySummary.vo2Max.toFixed(1)} unit="ml/kg/min" color="bg-indigo-500" />}
                </div>
              )}
              {(todaySummary.sleepDeepMin || todaySummary.sleepRemMin) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Moon className="h-4 w-4 text-purple-500" />
                      Detalle del sueño
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-purple-600">{formatMinutes(todaySummary.sleepDeepMin)}</p>
                        <p className="text-xs text-muted-foreground">Sueño profundo</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">{formatMinutes(todaySummary.sleepRemMin)}</p>
                        <p className="text-xs text-muted-foreground">Sueño REM</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-slate-600">{formatMinutes(todaySummary.sleepLightMin)}</p>
                        <p className="text-xs text-muted-foreground">Sueño ligero</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <p className="text-xs text-muted-foreground text-center">
                Fuente: {todaySummary.source === "apple_health" ? "Apple Health" : todaySummary.source === "google_health_connect" ? "Google Health Connect" : todaySummary.source} · Sincronizado {new Date(todaySummary.syncedAt).toLocaleString("es-ES")}
              </p>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Smartphone className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Sin datos para hoy</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Abre la app Buddy One en tu móvil y activa la sincronización con Apple Health o Google Health Connect.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Badge variant="outline" className="gap-1"><span>🍎</span> Apple Health</Badge>
                  <Badge variant="outline" className="gap-1"><span>🤖</span> Google Health Connect</Badge>
                  <Badge variant="outline" className="gap-1"><Watch className="h-3 w-3" /> Garmin</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── WEEK TAB ──────────────────────────────────────────────────────── */}
        <TabsContent value="week" className="space-y-4 mt-4">
          {loadingWeekly ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4 h-24 bg-muted/30" />
                </Card>
              ))}
            </div>
          ) : weeklySummary ? (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                <span>Promedio de los últimos {weeklySummary.days} días</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricCard icon={Footprints} label="Pasos (media)" value={formatNumber(weeklySummary.avgSteps)} color="bg-blue-500" />
                <MetricCard icon={Flame} label="Calorías (media)" value={formatNumber(weeklySummary.avgCaloriesBurned)} unit="kcal" color="bg-orange-500" />
                <MetricCard icon={Activity} label="Minutos activos (media)" value={formatNumber(weeklySummary.avgActiveMinutes)} unit="min" color="bg-green-500" />
                <MetricCard icon={Heart} label="FC media" value={formatNumber(weeklySummary.avgHeartRate)} unit="bpm" color="bg-red-500" />
                <MetricCard icon={Moon} label="Sueño (media)" value={formatMinutes(weeklySummary.avgSleepMin)} goal={weeklySummary.avgSleepScore ? `Puntuación: ${weeklySummary.avgSleepScore}/100` : undefined} color="bg-purple-500" />
                <MetricCard icon={TrendingUp} label="Distancia total" value={weeklySummary.totalDistanceKm.toFixed(1)} unit="km" color="bg-teal-500" />
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Detalle diario</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {weeklySummary.records.map((record) => (
                      <div key={record.id} className="flex items-center justify-between px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {new Date(record.date + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {record.steps ? `${record.steps.toLocaleString("es-ES")} pasos` : "Sin pasos"} · {record.sleepDurationMin ? formatMinutes(record.sleepDurationMin) + " sueño" : "Sin sueño"}
                          </p>
                        </div>
                        <div className="text-right">
                          {record.caloriesBurned && <p className="text-sm font-semibold text-orange-600">{record.caloriesBurned} kcal</p>}
                          {record.heartRateAvg && <p className="text-xs text-muted-foreground">{record.heartRateAvg} bpm</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">Sin datos semanales</h3>
                <p className="text-sm text-muted-foreground">Los datos aparecerán aquí una vez que sincronices desde la app móvil.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── SETTINGS TAB ──────────────────────────────────────────────────── */}
        <TabsContent value="settings" className="space-y-5 mt-4">

          {/* ── 1. Plataformas ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Smartphone className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Plataformas de salud</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Conecta tu dispositivo o app de salud favorita
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {loadingIntegration ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <PlatformCard
                    icon="🍎"
                    name="Apple Health"
                    description="Sincroniza automáticamente pasos, sueño, frecuencia cardíaca, peso y más desde tu iPhone o Apple Watch."
                    deviceHint="iPhone · Apple Watch · iOS 14+"
                    enabled={integration?.appleHealthEnabled ?? false}
                    onToggle={(v) => handleToggle("appleHealthEnabled", v)}
                    disabled={updateIntegration.isPending}
                    statusColor="bg-red-500"
                    features={["Pasos", "Calorías", "Sueño", "FC", "VO2 Max", "HRV", "Peso", "Oxígeno", "Glucosa"]}
                  />
                  <PlatformCard
                    icon="🤖"
                    name="Google Health Connect"
                    description="Integración nativa con el ecosistema Android. Compatible con la mayoría de apps de salud y fitness en Google Play."
                    deviceHint="Android 9+ · Wear OS · Google Pixel"
                    enabled={integration?.googleHealthConnectEnabled ?? false}
                    onToggle={(v) => handleToggle("googleHealthConnectEnabled", v)}
                    disabled={updateIntegration.isPending}
                    statusColor="bg-green-500"
                    features={["Pasos", "Calorías", "Sueño", "FC", "Peso", "Oxígeno", "Glucosa", "Actividad"]}
                  />
                  <PlatformCard
                    icon="⌚"
                    name="Garmin Connect"
                    description="Datos de alta precisión desde tus relojes Garmin. Ideal para atletas y usuarios con objetivos de rendimiento."
                    deviceHint="Relojes Garmin · Garmin Connect App"
                    enabled={integration?.garminEnabled ?? false}
                    onToggle={(v) => handleToggle("garminEnabled", v)}
                    disabled={updateIntegration.isPending}
                    statusColor="bg-blue-600"
                    features={["Pasos", "Calorías", "Sueño", "FC", "VO2 Max", "Estrés", "Body Battery", "Distancia"]}
                  />
                  <PlatformCard
                    icon="💜"
                    name="Fitbit"
                    description="Sincroniza tus pulseras y relojes Fitbit. Incluye datos detallados de sueño y actividad diaria."
                    deviceHint="Fitbit Charge · Sense · Versa · Inspire"
                    enabled={integration?.fitbitEnabled ?? false}
                    onToggle={(v) => handleToggle("fitbitEnabled", v)}
                    disabled={updateIntegration.isPending}
                    statusColor="bg-purple-500"
                    features={["Pasos", "Calorías", "Sueño", "FC", "Peso", "Agua", "Actividad", "Pisos"]}
                  />
                  <PlatformCard
                    icon="📱"
                    name="Samsung Health"
                    description="Compatible con Galaxy Watch y la app Samsung Health. Datos de salud completos del ecosistema Samsung."
                    deviceHint="Galaxy Watch · Galaxy Ring · Samsung Health"
                    enabled={integration?.samsungHealthEnabled ?? false}
                    onToggle={(v) => handleToggle("samsungHealthEnabled", v)}
                    disabled={updateIntegration.isPending}
                    statusColor="bg-blue-500"
                    features={["Pasos", "Calorías", "Sueño", "FC", "Estrés", "Oxígeno", "Glucosa", "Peso"]}
                  />
                </>
              )}

              {/* Info note */}
              <div className="flex gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 mt-2">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  La activación de cada plataforma debe completarse desde la <strong>app móvil Buddy One</strong>. Aquí puedes gestionar qué integraciones están habilitadas para tu cuenta.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ── 2. Datos a sincronizar ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10">
                  <Database className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Datos a sincronizar</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Elige qué tipos de datos se importan desde tus dispositivos
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {loadingIntegration ? (
                <div className="space-y-3">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  <DataTypeRow
                    icon={<Footprints className="h-4 w-4 text-white" />}
                    label="Pasos y actividad"
                    description="Pasos diarios, distancia recorrida, pisos subidos y minutos activos"
                    enabled={integration?.syncSteps ?? true}
                    onToggle={(v) => handleToggle("syncSteps", v)}
                    disabled={updateIntegration.isPending}
                    color="bg-blue-500"
                  />
                  <DataTypeRow
                    icon={<Flame className="h-4 w-4 text-white" />}
                    label="Calorías quemadas"
                    description="Gasto calórico total diario y por actividad"
                    enabled={integration?.syncCalories ?? true}
                    onToggle={(v) => handleToggle("syncCalories", v)}
                    disabled={updateIntegration.isPending}
                    color="bg-orange-500"
                  />
                  <DataTypeRow
                    icon={<TrendingUp className="h-4 w-4 text-white" />}
                    label="Peso corporal"
                    description="Registros de peso y composición corporal"
                    enabled={integration?.syncWeight ?? true}
                    onToggle={(v) => handleToggle("syncWeight", v)}
                    disabled={updateIntegration.isPending}
                    color="bg-green-500"
                  />
                  <DataTypeRow
                    icon={<Heart className="h-4 w-4 text-white" />}
                    label="Frecuencia cardíaca"
                    description="FC media, en reposo, máxima y variabilidad (HRV)"
                    enabled={integration?.syncHeartRate ?? true}
                    onToggle={(v) => handleToggle("syncHeartRate", v)}
                    disabled={updateIntegration.isPending}
                    color="bg-red-500"
                  />
                  <DataTypeRow
                    icon={<Moon className="h-4 w-4 text-white" />}
                    label="Sueño"
                    description="Duración, fases (profundo, REM, ligero) y puntuación de sueño"
                    enabled={integration?.syncSleep ?? true}
                    onToggle={(v) => handleToggle("syncSleep", v)}
                    disabled={updateIntegration.isPending}
                    color="bg-purple-500"
                  />
                  <DataTypeRow
                    icon={<Activity className="h-4 w-4 text-white" />}
                    label="Glucosa en sangre"
                    description="Niveles de glucosa en sangre (requiere glucómetro compatible)"
                    enabled={integration?.syncBloodGlucose ?? false}
                    onToggle={(v) => handleToggle("syncBloodGlucose", v)}
                    disabled={updateIntegration.isPending}
                    color="bg-amber-500"
                  />
                  <DataTypeRow
                    icon={<Zap className="h-4 w-4 text-white" />}
                    label="Saturación de oxígeno"
                    description="SpO2 y datos de oxigenación nocturna"
                    enabled={integration?.syncOxygen ?? false}
                    onToggle={(v) => handleToggle("syncOxygen", v)}
                    disabled={updateIntegration.isPending}
                    color="bg-cyan-500"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 3. Frecuencia de sincronización ───────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-500/10">
                  <Clock className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Sincronización automática</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Cómo y cuándo se actualizan tus datos de salud
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                {
                  icon: <RefreshCw className="h-4 w-4 text-purple-600" />,
                  title: "Sincronización en segundo plano",
                  description: "La app móvil sincroniza automáticamente cada vez que se abre y en segundo plano cada hora.",
                  badge: "Automático",
                  badgeColor: "bg-purple-100 text-purple-700",
                },
                {
                  icon: <Clock className="h-4 w-4 text-blue-600" />,
                  title: "Actualización nocturna",
                  description: "Los datos del día anterior se consolidan a las 00:30 para garantizar la precisión de los registros.",
                  badge: "Diario",
                  badgeColor: "bg-blue-100 text-blue-700",
                },
                {
                  icon: <Smartphone className="h-4 w-4 text-green-600" />,
                  title: "Sincronización manual",
                  description: "Puedes forzar una sincronización inmediata desde la app móvil en Perfil → Salud Conectada → Sincronizar ahora.",
                  badge: "Manual",
                  badgeColor: "bg-green-100 text-green-700",
                },
              ].map(({ icon, title, description, badge, badgeColor }) => (
                <div key={title} className="flex gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="flex-shrink-0 mt-0.5">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                        {badge}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ── 4. Privacidad y datos ──────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/10">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">Privacidad y gestión de datos</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Tus datos de salud son privados y nunca se comparten con terceros
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* Privacy highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: "🔒", title: "Cifrado extremo a extremo", desc: "Todos los datos se transmiten y almacenan cifrados" },
                  { icon: "🚫", title: "Sin venta de datos", desc: "Tus métricas de salud nunca se venden ni comparten" },
                  { icon: "🗑️", title: "Derecho al olvido", desc: "Puedes eliminar todos tus datos en cualquier momento" },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/40 gap-1.5">
                    <span className="text-2xl">{icon}</span>
                    <p className="text-xs font-semibold text-foreground">{title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Danger zone */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  Zona de riesgo
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  Las siguientes acciones son irreversibles. Asegúrate de querer proceder antes de confirmar.
                </p>
                <div className="space-y-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar historial de datos de salud
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar historial de salud?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción eliminará permanentemente todos tus registros de salud sincronizados (pasos, sueño, frecuencia cardíaca, etc.). Esta operación no se puede deshacer.
                          <br /><br />
                          La configuración de integraciones se mantendrá activa.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => toast.info("Función disponible próximamente")}
                        >
                          Eliminar historial
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
                      >
                        <XCircle className="h-4 w-4" />
                        Desconectar todas las integraciones
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Desconectar todas las integraciones?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se desactivarán todas las fuentes de datos conectadas (Apple Health, Google Health Connect, Garmin, Fitbit y Samsung Health). Los datos ya sincronizados se conservarán.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => {
                            updateIntegration.mutate({
                              appleHealthEnabled: false,
                              googleHealthConnectEnabled: false,
                              garminEnabled: false,
                              fitbitEnabled: false,
                              samsungHealthEnabled: false,
                            });
                          }}
                        >
                          Desconectar todo
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── 5. Guía de conexión ───────────────────────────────────────── */}
          <Card className="border-dashed bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Cómo conectar tu app de salud
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* iOS */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>🍎</span> iPhone / Apple Watch
                  </p>
                  <ol className="space-y-1.5">
                    {[
                      "Descarga Buddy One desde el App Store",
                      "Inicia sesión con tu misma cuenta",
                      "Ve a Perfil → Salud Conectada",
                      "Pulsa «Conectar Apple Health»",
                      "Concede los permisos solicitados",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
                {/* Android */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>🤖</span> Android / Wear OS
                  </p>
                  <ol className="space-y-1.5">
                    {[
                      "Descarga Buddy One desde Google Play",
                      "Instala Health Connect si no lo tienes",
                      "Inicia sesión con tu misma cuenta",
                      "Ve a Perfil → Salud Conectada",
                      "Pulsa «Conectar Health Connect» y acepta",
                    ].map((step, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>
      </Tabs>
    </div>
  );
}
