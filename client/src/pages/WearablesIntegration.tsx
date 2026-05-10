import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Activity, Heart, Moon, Zap, TrendingUp, Link2, Unlink2, RefreshCw, Calendar } from "lucide-react";

type Tab = "overview" | "oura" | "whoop" | "insights" | "settings";

export default function WearablesIntegration() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [dateRange, setDateRange] = useState({ start: "2024-01-01", end: "2024-01-31" });
  const [syncing, setSyncing] = useState(false);

  // Queries
  const { data: connections, refetch: refetchConnections } = trpc.wearables.getConnections.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: syncStatus } = trpc.wearables.getSyncStatus.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: ouraData } = trpc.wearables.getOuraData.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: !!user && connections?.some((c) => c.wearableType === "oura") }
  );

  const { data: whoopData } = trpc.wearables.getWhoopData.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: !!user && connections?.some((c) => c.wearableType === "whoop") }
  );

  const { data: insights } = trpc.wearables.getInsights.useQuery(
    { startDate: dateRange.start, endDate: dateRange.end },
    { enabled: !!user }
  );

  // Mutations
  const getOuraAuthUrl = trpc.wearables.getOuraAuthUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const getWhoopAuthUrl = trpc.wearables.getWhoopAuthUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const syncOura = trpc.wearables.syncOuraData.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchConnections();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const syncWhoop = trpc.wearables.syncWhoopData.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchConnections();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  const disconnect = trpc.wearables.disconnect.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchConnections();
    },
    onError: (e) => toast.error("Error: " + e.message),
  });

  if (authLoading) {
    return <AppLayout><div className="text-center py-12">Cargando...</div></AppLayout>;
  }

  if (!user) {
    return <AppLayout><div className="text-center py-12">Por favor inicia sesión</div></AppLayout>;
  }

  const ouraConnected = connections?.some((c) => c.wearableType === "oura" && c.isActive);
  const whoopConnected = connections?.some((c) => c.wearableType === "whoop" && c.isActive);

  // Calculate stats
  const ouraStats = ouraData
    ? {
        avgSleep: Math.round((ouraData.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / ouraData.length) * 10) / 10,
        avgScore: Math.round(ouraData.reduce((sum, d) => sum + (d.sleepScore || 0), 0) / ouraData.length),
        totalSteps: ouraData.reduce((sum, d) => sum + (d.steps || 0), 0),
      }
    : null;

  const whoopStats = whoopData
    ? {
        avgStrain: Math.round((whoopData.reduce((sum, d) => sum + (parseFloat(d.strain as any) || 0), 0) / whoopData.length) * 10) / 10,
        avgRecovery: Math.round(whoopData.reduce((sum, d) => sum + (parseFloat(d.recovery as any) || 0), 0) / whoopData.length),
        avgSleep: Math.round((whoopData.reduce((sum, d) => sum + (d.sleepDuration || 0), 0) / whoopData.length) * 10) / 10,
      }
    : null;

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Integración de Wearables</h1>
          <p className="text-slate-600">Conecta Oura Ring y Whoop para sincronizar tus datos de salud y fitness</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Resumen", icon: "📊" },
            { id: "oura", label: "Oura Ring", icon: "⭕" },
            { id: "whoop", label: "Whoop", icon: "🔵" },
            { id: "insights", label: "Insights", icon: "💡" },
            { id: "settings", label: "Configuración", icon: "⚙️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Connection Status */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className={ouraConnected ? "border-orange-200 bg-orange-50" : "border-slate-200"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">⭕</span> Oura Ring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-600">Estado</div>
                    <div className={`text-lg font-bold ${ouraConnected ? "text-green-600" : "text-slate-600"}`}>
                      {ouraConnected ? "✅ Conectado" : "❌ No conectado"}
                    </div>
                  </div>
                  {ouraConnected && syncStatus?.find((s) => s.wearableType === "oura") && (
                    <div>
                      <div className="text-sm text-slate-600">Última sincronización</div>
                      <div className="text-sm font-mono">
                        {new Date(syncStatus.find((s) => s.wearableType === "oura")?.lastSyncedAt!).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {!ouraConnected ? (
                    <Button
                      onClick={() => getOuraAuthUrl.mutate({ redirectUri: `${window.location.origin}/app/wearables` })}
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={getOuraAuthUrl.isPending}
                    >
                      {getOuraAuthUrl.isPending ? "Conectando..." : "Conectar Oura Ring"}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => syncOura.mutate()}
                        variant="outline"
                        className="flex-1"
                        disabled={syncOura.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
                      </Button>
                      <Button
                        onClick={() => disconnect.mutate({ wearableType: "oura" })}
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Unlink2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className={whoopConnected ? "border-blue-200 bg-blue-50" : "border-slate-200"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🔵</span> Whoop
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-600">Estado</div>
                    <div className={`text-lg font-bold ${whoopConnected ? "text-green-600" : "text-slate-600"}`}>
                      {whoopConnected ? "✅ Conectado" : "❌ No conectado"}
                    </div>
                  </div>
                  {whoopConnected && syncStatus?.find((s) => s.wearableType === "whoop") && (
                    <div>
                      <div className="text-sm text-slate-600">Última sincronización</div>
                      <div className="text-sm font-mono">
                        {new Date(syncStatus.find((s) => s.wearableType === "whoop")?.lastSyncedAt!).toLocaleString()}
                      </div>
                    </div>
                  )}
                  {!whoopConnected ? (
                    <Button
                      onClick={() => getWhoopAuthUrl.mutate({ redirectUri: `${window.location.origin}/app/wearables` })}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      disabled={getWhoopAuthUrl.isPending}
                    >
                      {getWhoopAuthUrl.isPending ? "Conectando..." : "Conectar Whoop"}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => syncWhoop.mutate()}
                        variant="outline"
                        className="flex-1"
                        disabled={syncWhoop.isPending}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
                      </Button>
                      <Button
                        onClick={() => disconnect.mutate({ wearableType: "whoop" })}
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Unlink2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            {(ouraConnected || whoopConnected) && (
              <div className="grid md:grid-cols-3 gap-4">
                {ouraStats && (
                  <>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Moon className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{ouraStats.avgSleep}h</div>
                          <div className="text-sm text-slate-600">Promedio de sueño (Oura)</div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center">
                          <Activity className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold">{ouraStats.totalSteps.toLocaleString()}</div>
                          <div className="text-sm text-slate-600">Pasos totales</div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
                {whoopStats && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <div className="text-2xl font-bold">{whoopStats.avgRecovery}%</div>
                        <div className="text-sm text-slate-600">Recuperación promedio (Whoop)</div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* OURA TAB */}
        {activeTab === "oura" && ouraConnected && ouraData && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Datos de Sueño (Últimos 30 días)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={ouraData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="sleepDuration" stroke="#3b82f6" fill="#3b82f6" name="Duración (min)" />
                    <Area type="monotone" dataKey="sleepScore" stroke="#10b981" fill="#10b981" name="Score" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{ouraStats?.avgSleep}h</div>
                    <div className="text-sm text-slate-600">Promedio de sueño</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{ouraStats?.avgScore}</div>
                    <div className="text-sm text-slate-600">Score promedio</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{ouraStats?.totalSteps.toLocaleString()}</div>
                    <div className="text-sm text-slate-600">Pasos totales</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* WHOOP TAB */}
        {activeTab === "whoop" && whoopConnected && whoopData && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Strain vs Recovery</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={whoopData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="strain" fill="#ef4444" name="Strain" />
                      <Bar dataKey="recovery" fill="#10b981" name="Recovery %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Duración del Sueño</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={whoopData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="sleepDuration" stroke="#3b82f6" name="Sueño (min)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{whoopStats?.avgStrain}</div>
                    <div className="text-sm text-slate-600">Strain promedio</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{whoopStats?.avgRecovery}%</div>
                    <div className="text-sm text-slate-600">Recovery promedio</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{whoopStats?.avgSleep}h</div>
                    <div className="text-sm text-slate-600">Sueño promedio</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && insights && (
          <div className="space-y-4">
            {insights.length > 0 ? (
              insights.map((insight, idx) => (
                <Card key={idx} className={`border-l-4 ${
                  insight.severity === "high" ? "border-l-red-500" :
                  insight.severity === "medium" ? "border-l-yellow-500" :
                  "border-l-green-500"
                }`}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold">{insight.category}</div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        insight.severity === "high" ? "bg-red-100 text-red-700" :
                        insight.severity === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {insight.severity}
                      </div>
                    </div>
                    <p className="text-slate-700">{insight.insight}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-slate-600">Sin insights disponibles</div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Sincronización</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rango de fechas</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-medium mb-4">Sincronización Manual</h3>
                  <div className="flex gap-2">
                    {ouraConnected && (
                      <Button
                        onClick={() => syncOura.mutate()}
                        disabled={syncOura.isPending}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar Oura
                      </Button>
                    )}
                    {whoopConnected && (
                      <Button
                        onClick={() => syncWhoop.mutate()}
                        disabled={syncWhoop.isPending}
                        className="flex-1 bg-blue-500 hover:bg-blue-600"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar Whoop
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Información de Privacidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>✅ Tus datos de wearables se almacenan de forma segura y encriptada</p>
                <p>✅ Solo tú puedes acceder a tus datos</p>
                <p>✅ Puedes desconectar tus dispositivos en cualquier momento</p>
                <p>✅ Los datos se sincronizan automáticamente cada 24 horas</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
