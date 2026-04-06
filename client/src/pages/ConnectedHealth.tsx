import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
  ChevronRight,
  BarChart3,
  Zap,
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

// ── Main Component ────────────────────────────────────────────────────────────

export default function ConnectedHealth() {
  const [activeTab, setActiveTab] = useState("today");

  const { data: todaySummary, isLoading: loadingToday, refetch: refetchToday } = trpc.health.getTodaySummary.useQuery();
  const { data: weeklySummary, isLoading: loadingWeekly } = trpc.health.getWeeklySummary.useQuery();
  const { data: integration, isLoading: loadingIntegration } = trpc.health.getIntegration.useQuery();

  const updateIntegration = trpc.health.updateIntegration.useMutation({
    onSuccess: () => toast.success("Configuración guardada"),
    onError: () => toast.error("Error al guardar la configuración"),
  });

  const handleToggle = (key: string, value: boolean) => {
    updateIntegration.mutate({ [key]: value } as any);
  };

  const isConnected = integration?.appleHealthEnabled || integration?.googleHealthConnectEnabled;

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
          onClick={() => refetchToday()}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Connection Status */}
      <Card className={`border-2 ${isConnected ? "border-green-500/30 bg-green-500/5" : "border-orange-500/30 bg-orange-500/5"}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isConnected ? "bg-green-500" : "bg-orange-500"}`}>
              <Smartphone className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">
                {isConnected ? "App de salud conectada" : "Conecta tu app de salud"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isConnected
                  ? `Última sincronización: ${integration?.lastSyncAt ? new Date(integration.lastSyncAt).toLocaleString("es-ES") : "nunca"}`
                  : "Activa la integración desde la app móvil BuddyMarket"}
              </p>
            </div>
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Hoy</TabsTrigger>
          <TabsTrigger value="week">Esta semana</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* TODAY TAB */}
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
                <MetricCard
                  icon={Footprints}
                  label="Pasos"
                  value={formatNumber(todaySummary.steps)}
                  goal="Meta: 10.000 pasos"
                  color="bg-blue-500"
                />
                <MetricCard
                  icon={Flame}
                  label="Calorías quemadas"
                  value={formatNumber(todaySummary.caloriesBurned)}
                  unit="kcal"
                  color="bg-orange-500"
                />
                <MetricCard
                  icon={Activity}
                  label="Minutos activos"
                  value={formatNumber(todaySummary.activeMinutes)}
                  unit="min"
                  color="bg-green-500"
                />
                <MetricCard
                  icon={Heart}
                  label="Frecuencia cardíaca"
                  value={formatNumber(todaySummary.heartRateAvg)}
                  unit="bpm"
                  color="bg-red-500"
                />
                <MetricCard
                  icon={Moon}
                  label="Sueño"
                  value={formatMinutes(todaySummary.sleepDurationMin)}
                  goal={todaySummary.sleepScore ? `Puntuación: ${todaySummary.sleepScore}/100` : undefined}
                  color="bg-purple-500"
                />
                <MetricCard
                  icon={Droplets}
                  label="Agua"
                  value={todaySummary.waterMl ? `${(todaySummary.waterMl / 1000).toFixed(1)}` : "—"}
                  unit="litros"
                  color="bg-cyan-500"
                />
              </div>

              {/* Additional metrics */}
              {(todaySummary.distanceKm || todaySummary.floorsClimbed || todaySummary.vo2Max) && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {todaySummary.distanceKm != null && (
                    <MetricCard
                      icon={TrendingUp}
                      label="Distancia"
                      value={todaySummary.distanceKm.toFixed(2)}
                      unit="km"
                      color="bg-teal-500"
                    />
                  )}
                  {todaySummary.floorsClimbed != null && (
                    <MetricCard
                      icon={BarChart3}
                      label="Pisos subidos"
                      value={formatNumber(todaySummary.floorsClimbed)}
                      color="bg-amber-500"
                    />
                  )}
                  {todaySummary.vo2Max != null && (
                    <MetricCard
                      icon={Zap}
                      label="VO2 Max"
                      value={todaySummary.vo2Max.toFixed(1)}
                      unit="ml/kg/min"
                      color="bg-indigo-500"
                    />
                  )}
                </div>
              )}

              {/* Sleep breakdown */}
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
                  Abre la app BuddyMarket en tu móvil y activa la sincronización con Apple Health o Google Health Connect.
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <Badge variant="outline" className="gap-1">
                    <span>🍎</span> Apple Health
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <span>🤖</span> Google Health Connect
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Watch className="h-3 w-3" /> Garmin
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* WEEK TAB */}
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
                <MetricCard
                  icon={Footprints}
                  label="Pasos (media)"
                  value={formatNumber(weeklySummary.avgSteps)}
                  color="bg-blue-500"
                />
                <MetricCard
                  icon={Flame}
                  label="Calorías (media)"
                  value={formatNumber(weeklySummary.avgCaloriesBurned)}
                  unit="kcal"
                  color="bg-orange-500"
                />
                <MetricCard
                  icon={Activity}
                  label="Minutos activos (media)"
                  value={formatNumber(weeklySummary.avgActiveMinutes)}
                  unit="min"
                  color="bg-green-500"
                />
                <MetricCard
                  icon={Heart}
                  label="FC media"
                  value={formatNumber(weeklySummary.avgHeartRate)}
                  unit="bpm"
                  color="bg-red-500"
                />
                <MetricCard
                  icon={Moon}
                  label="Sueño (media)"
                  value={formatMinutes(weeklySummary.avgSleepMin)}
                  goal={weeklySummary.avgSleepScore ? `Puntuación: ${weeklySummary.avgSleepScore}/100` : undefined}
                  color="bg-purple-500"
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Distancia total"
                  value={weeklySummary.totalDistanceKm.toFixed(1)}
                  unit="km"
                  color="bg-teal-500"
                />
              </div>

              {/* Daily breakdown */}
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
                          {record.caloriesBurned && (
                            <p className="text-sm font-semibold text-orange-600">{record.caloriesBurned} kcal</p>
                          )}
                          {record.heartRateAvg && (
                            <p className="text-xs text-muted-foreground">{record.heartRateAvg} bpm</p>
                          )}
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
                <p className="text-sm text-muted-foreground">
                  Los datos aparecerán aquí una vez que sincronices desde la app móvil.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Source integrations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Fuentes de datos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "appleHealthEnabled", label: "Apple Health", icon: "🍎", description: "iPhone y Apple Watch" },
                { key: "googleHealthConnectEnabled", label: "Google Health Connect", icon: "🤖", description: "Android y Wear OS" },
                { key: "garminEnabled", label: "Garmin Connect", icon: "⌚", description: "Relojes Garmin" },
                { key: "fitbitEnabled", label: "Fitbit", icon: "💪", description: "Pulseras y relojes Fitbit" },
                { key: "samsungHealthEnabled", label: "Samsung Health", icon: "📱", description: "Galaxy Watch y Samsung" },
              ].map(({ key, label, icon, description }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <Label className="text-sm font-medium">{label}</Label>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={integration?.[key as keyof typeof integration] as boolean ?? false}
                    onCheckedChange={(v) => handleToggle(key, v)}
                    disabled={updateIntegration.isPending || loadingIntegration}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Data sync preferences */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Datos a sincronizar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "syncSteps", label: "Pasos y actividad", icon: <Footprints className="h-4 w-4 text-blue-500" /> },
                { key: "syncCalories", label: "Calorías quemadas", icon: <Flame className="h-4 w-4 text-orange-500" /> },
                { key: "syncWeight", label: "Peso corporal", icon: <TrendingUp className="h-4 w-4 text-green-500" /> },
                { key: "syncHeartRate", label: "Frecuencia cardíaca", icon: <Heart className="h-4 w-4 text-red-500" /> },
                { key: "syncSleep", label: "Sueño", icon: <Moon className="h-4 w-4 text-purple-500" /> },
                { key: "syncBloodGlucose", label: "Glucosa en sangre", icon: <Activity className="h-4 w-4 text-amber-500" /> },
                { key: "syncOxygen", label: "Saturación de oxígeno", icon: <Zap className="h-4 w-4 text-cyan-500" /> },
              ].map(({ key, label, icon }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {icon}
                    <Label className="text-sm">{label}</Label>
                  </div>
                  <Switch
                    checked={integration?.[key as keyof typeof integration] as boolean ?? true}
                    onCheckedChange={(v) => handleToggle(key, v)}
                    disabled={updateIntegration.isPending || loadingIntegration}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* How to connect */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                Cómo conectar tu app de salud
              </h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Descarga BuddyMarket en tu móvil (iOS o Android)</li>
                <li>Inicia sesión con tu misma cuenta</li>
                <li>Ve a Perfil → Salud Conectada</li>
                <li>Activa Apple Health o Google Health Connect</li>
                <li>Los datos se sincronizarán automáticamente cada día</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
