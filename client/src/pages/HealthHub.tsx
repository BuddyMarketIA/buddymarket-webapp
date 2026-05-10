import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { WearableCard } from '@/components/HealthHub/WearableCard';
import { HealthMetricsChart, SleepChart, RecoveryChart, ActivityChart, StrainChart } from '@/components/HealthHub/HealthMetricsChart';
import { HealthInsights } from '@/components/HealthHub/HealthInsights';
import { SyncStatus } from '@/components/HealthHub/SyncStatus';
import { useHealthHub } from '@/hooks/useHealthHub';
import { Activity, Heart, Moon, Zap, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

type Tab = 'overview' | 'devices' | 'metrics' | 'insights' | 'settings';

export default function HealthHub() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const {
    connections,
    metrics,
    insights,
    syncStatus,
    isOuraConnected,
    isWhoopConnected,
    hasAnyConnection,
    isLoading,
    isSyncing,
    handleConnectOura,
    handleConnectWhoop,
    handleDisconnect,
    handleSync,
  } = useHealthHub();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-gray-600">Cargando Health Hub...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Health Hub</h1>
            <p className="text-gray-600 mt-2">
              Conecta tus dispositivos wearables para obtener insights personalizados sobre tu salud
            </p>
          </div>
          <Badge variant={hasAnyConnection ? 'default' : 'secondary'}>
            {hasAnyConnection ? '✓ Conectado' : 'Desconectado'}
          </Badge>
        </div>

        {/* Quick Stats */}
        {hasAnyConnection && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              icon={Moon}
              label="Sueño Promedio"
              value="7.5h"
              trend="↑ 15%"
              color="purple"
            />
            <StatCard
              icon={Heart}
              label="Recuperación"
              value="72%"
              trend="↑ 5%"
              color="red"
            />
            <StatCard
              icon={Zap}
              label="Entrenamiento"
              value="8.2/21"
              trend="↓ 10%"
              color="orange"
            />
            <StatCard
              icon={Activity}
              label="Actividad"
              value="8,542"
              trend="↑ 20%"
              color="green"
            />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="settings">Configuración</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {!hasAnyConnection ? (
              <EmptyState
                onConnectOura={handleConnectOura}
                onConnectWhoop={handleConnectWhoop}
              />
            ) : (
              <>
                {/* Sync Status */}
                {syncStatus && (
                  <SyncStatus
                    syncStatus={syncStatus}
                    onManualSync={handleSync}
                  />
                )}

                {/* Recent Insights */}
                {insights && insights.length > 0 && (
                  <HealthInsights insights={insights.slice(0, 3)} />
                )}

                {/* Quick Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {metrics && metrics.length > 0 && (
                    <>
                      <SleepChart data={metrics} />
                      <RecoveryChart data={metrics} />
                    </>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <WearableCard
                device="oura"
                isConnected={isOuraConnected}
                lastSync={connections?.find((c) => c.device === 'oura')?.lastSync}
                isSyncing={isSyncing}
                onConnect={handleConnectOura}
                onDisconnect={() => handleDisconnect('oura')}
                onSync={() => handleSync('oura')}
              />
              <WearableCard
                device="whoop"
                isConnected={isWhoopConnected}
                lastSync={connections?.find((c) => c.device === 'whoop')?.lastSync}
                isSyncing={isSyncing}
                onConnect={handleConnectWhoop}
                onDisconnect={() => handleDisconnect('whoop')}
                onSync={() => handleSync('whoop')}
              />
            </div>

            {/* Coming Soon */}
            <Card className="bg-gray-50 border-2 border-dashed">
              <CardHeader>
                <CardTitle className="text-lg">Próximamente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Estamos trabajando en la integración de más dispositivos
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Apple Health', 'Google Fit', 'Fitbit', 'Garmin'].map((device) => (
                    <Badge key={device} variant="outline">
                      {device}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            {!hasAnyConnection ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">
                    Conecta un dispositivo para ver tus métricas
                  </p>
                </CardContent>
              </Card>
            ) : metrics && metrics.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SleepChart data={metrics} />
                  <ActivityChart data={metrics} />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RecoveryChart data={metrics} />
                  <StrainChart data={metrics} />
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">
                    No hay datos disponibles. Sincroniza tus dispositivos para obtener métricas
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {!hasAnyConnection ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">
                    Conecta un dispositivo para obtener insights personalizados
                  </p>
                </CardContent>
              </Card>
            ) : insights && insights.length > 0 ? (
              <HealthInsights insights={insights} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">
                    No hay insights disponibles. Sincroniza tus dispositivos para obtener recomendaciones
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Health Hub</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frecuencia de Sincronización</label>
                  <select className="w-full px-3 py-2 border rounded-lg">
                    <option>Cada 1 hora</option>
                    <option selected>Cada 6 horas</option>
                    <option>Cada 24 horas</option>
                    <option>Manual</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Notificaciones</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Alertas de baja recuperación</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Recordatorios de sincronización</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">Resumen semanal</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full">
                    Guardar Cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend: string;
  color: string;
}) {
  const colorClasses = {
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
    green: 'bg-green-50 border-green-200 text-green-600',
  };

  return (
    <Card className={`border-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          </div>
          <Icon className="w-8 h-8 opacity-50" />
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  onConnectOura,
  onConnectWhoop,
}: {
  onConnectOura: () => void;
  onConnectWhoop: () => void;
}) {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="pt-12 pb-12 text-center">
        <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Comienza a Monitorear tu Salud</h3>
        <p className="text-gray-600 mb-6">
          Conecta tus dispositivos wearables para obtener insights personalizados sobre tu salud y bienestar
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={onConnectOura} size="lg">
            Conectar Oura Ring
          </Button>
          <Button onClick={onConnectWhoop} variant="outline" size="lg">
            Conectar Whoop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
