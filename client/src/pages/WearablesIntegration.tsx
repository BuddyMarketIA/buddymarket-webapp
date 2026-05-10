import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Activity, Heart, Moon, Zap, TrendingUp, Link2, Unlink2, RefreshCw, Calendar, Watch, Smartphone, Cpu } from "lucide-react";

type Tab = "overview" | "all-devices" | "insights" | "settings";

// Wearable devices configuration
const WEARABLE_DEVICES = [
  { id: "oura", name: "Oura Ring", icon: "⭕", color: "orange", description: "Anillo inteligente de salud" },
  { id: "whoop", name: "Whoop", icon: "🔵", color: "blue", description: "Banda de fitness y recuperación" },
  { id: "apple-health", name: "Apple Health", icon: "🍎", color: "gray", description: "Datos de salud de iPhone" },
  { id: "fitbit", name: "Fitbit", icon: "❤️", color: "purple", description: "Reloj inteligente Fitbit" },
  { id: "garmin", name: "Garmin", icon: "🎯", color: "red", description: "Dispositivos Garmin" },
  { id: "google-fit", name: "Google Fit", icon: "🔵", color: "green", description: "Google Fit" },
  { id: "samsung-health", name: "Samsung Health", icon: "📱", color: "blue", description: "Samsung Health" },
];

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
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Dispositivos Wearables</h1>
          <p className="text-slate-600">Conecta tus dispositivos de salud y fitness para sincronizar datos en tiempo real</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Resumen", icon: "📊" },
            { id: "all-devices", label: "Todos los Dispositivos", icon: "⌚" },
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
              {/* Oura Ring */}
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

              {/* Whoop */}
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

            {/* Stats */}
            {ouraStats && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Estadísticas Oura Ring</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-slate-600">Promedio de Sueño</div>
                      <div className="text-2xl font-bold text-blue-600">{ouraStats.avgSleep}h</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-sm text-slate-600">Score Promedio</div>
                      <div className="text-2xl font-bold text-purple-600">{ouraStats.avgScore}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-slate-600">Total de Pasos</div>
                      <div className="text-2xl font-bold text-green-600">{ouraStats.totalSteps.toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {whoopStats && (
              <Card>
                <CardHeader>
                  <CardTitle>📊 Estadísticas Whoop</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-sm text-slate-600">Strain Promedio</div>
                      <div className="text-2xl font-bold text-red-600">{whoopStats.avgStrain}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-sm text-slate-600">Recovery Promedio</div>
                      <div className="text-2xl font-bold text-green-600">{whoopStats.avgRecovery}%</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-slate-600">Promedio de Sueño</div>
                      <div className="text-2xl font-bold text-blue-600">{whoopStats.avgSleep}h</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ALL DEVICES TAB */}
        {activeTab === "all-devices" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WEARABLE_DEVICES.map((device) => {
                const isConnected = connections?.some((c) => c.wearableType === device.id && c.isActive);
                return (
                  <Card key={device.id} className={isConnected ? `border-${device.color}-200 bg-${device.color}-50` : "border-slate-200"}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">{device.icon}</span> {device.name}
                      </CardTitle>
                      <p className="text-sm text-slate-600">{device.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="text-sm text-slate-600">Estado</div>
                        <div className={`text-lg font-bold ${isConnected ? "text-green-600" : "text-slate-600"}`}>
                          {isConnected ? "✅ Conectado" : "❌ No conectado"}
                        </div>
                      </div>
                      {isConnected ? (
                        <div className="flex gap-2">
                          <Button variant="outline" className="flex-1" disabled>
                            <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
                          </Button>
                          <Button
                            onClick={() => disconnect.mutate({ wearableType: device.id })}
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Unlink2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button className="w-full" disabled>
                          <Link2 className="w-4 h-4 mr-2" /> Próximamente
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === "insights" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>💡 Insights de Salud</CardTitle>
              </CardHeader>
              <CardContent>
                {insights && insights.length > 0 ? (
                  <div className="space-y-4">
                    {insights.map((insight, idx) => (
                      <div key={idx} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-slate-700">{insight}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">Conecta dispositivos para obtener insights personalizados</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>⚙️ Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Rango de Fechas</label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <h3 className="font-medium text-slate-900 mb-2">Dispositivos Conectados</h3>
                  {connections && connections.length > 0 ? (
                    <ul className="space-y-2">
                      {connections.map((conn) => (
                        <li key={conn.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                          <span className="text-sm text-slate-700">{conn.wearableType}</span>
                          <span className={`text-xs font-medium ${conn.isActive ? "text-green-600" : "text-red-600"}`}>
                            {conn.isActive ? "Activo" : "Inactivo"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-600">No hay dispositivos conectados</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
