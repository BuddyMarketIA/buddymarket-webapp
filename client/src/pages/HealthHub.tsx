/**
 * Health Hub Page - Salud Conectada
 * Manage wearable connections (Oura Ring, Whoop) and view health data
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Loader2, Zap, Activity, Moon, Heart } from "lucide-react";
import { toast } from "sonner";

export default function HealthHub() {
  const [isConnecting, setIsConnecting] = useState<"oura" | "whoop" | null>(null);

  // Get wearable connections
  const { data: connections, isLoading, refetch } = trpc.healthHub.getConnections.useQuery();

  // Get Oura auth URL
  const { mutate: getOuraAuthUrl } = trpc.healthHub.getOuraAuthUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
      setIsConnecting(null);
    },
  });

  // Get Whoop auth URL
  const { mutate: getWhoopAuthUrl } = trpc.healthHub.getWhoopAuthUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
      setIsConnecting(null);
    },
  });

  // Disconnect device
  const { mutate: disconnect } = trpc.healthHub.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Dispositivo desconectado");
      refetch();
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });

  // Sync now
  const { mutate: syncNow } = trpc.healthHub.syncNow.useMutation({
    onSuccess: () => {
      toast.success("Sincronización iniciada");
    },
    onError: (error) => {
      toast.error("Error", { description: error.message });
    },
  });

  const handleConnectOura = () => {
    setIsConnecting("oura");
    const redirectUri = `${window.location.origin}/health-hub/oura/callback`;
    getOuraAuthUrl({ redirectUri });
  };

  const handleConnectWhoop = () => {
    setIsConnecting("whoop");
    const redirectUri = `${window.location.origin}/health-hub/whoop/callback`;
    getWhoopAuthUrl({ redirectUri });
  };

  const ouraConnection = connections?.find((c) => c.wearableType === "oura");
  const whoopConnection = connections?.find((c) => c.wearableType === "whoop");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Salud Conectada</h1>
          <p className="text-gray-600">
            Sincroniza tus dispositivos wearables para obtener insights personalizados sobre tu salud
          </p>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="devices" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="devices">Dispositivos</TabsTrigger>
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Oura Ring Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-orange-500" />
                          Oura Ring
                        </CardTitle>
                        <CardDescription>Anillo inteligente de salud</CardDescription>
                      </div>
                      {ouraConnection?.isConnected && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {ouraConnection?.isConnected ? (
                      <>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            Última sincronización:{" "}
                            <span className="font-semibold text-gray-900">
                              {ouraConnection.lastSyncAt
                                ? new Date(ouraConnection.lastSyncAt).toLocaleDateString("es-ES")
                                : "Nunca"}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            Datos disponibles: Sueño, Actividad, Recuperación, Frecuencia cardíaca
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncNow({ wearableType: "oura" })}
                          >
                            Sincronizar ahora
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnect({ wearableType: "oura" })}
                          >
                            Desconectar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">
                          Conecta tu Oura Ring para sincronizar datos de salud automáticamente
                        </p>
                        <Button
                          onClick={handleConnectOura}
                          disabled={isConnecting === "oura"}
                          className="w-full bg-orange-500 hover:bg-orange-600"
                        >
                          {isConnecting === "oura" ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            "Conectar Oura Ring"
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Whoop Card */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          <Heart className="w-5 h-5 text-red-500" />
                          Whoop
                        </CardTitle>
                        <CardDescription>Monitor de rendimiento</CardDescription>
                      </div>
                      {whoopConnection?.isConnected && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Conectado
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {whoopConnection?.isConnected ? (
                      <>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-600">
                            Última sincronización:{" "}
                            <span className="font-semibold text-gray-900">
                              {whoopConnection.lastSyncAt
                                ? new Date(whoopConnection.lastSyncAt).toLocaleDateString("es-ES")
                                : "Nunca"}
                            </span>
                          </p>
                          <p className="text-gray-600">
                            Datos disponibles: Ciclos, Recuperación, Sueño, Entrenamiento
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => syncNow({ wearableType: "whoop" })}
                          >
                            Sincronizar ahora
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnect({ wearableType: "whoop" })}
                          >
                            Desconectar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600">
                          Conecta tu Whoop para sincronizar datos de rendimiento automáticamente
                        </p>
                        <Button
                          onClick={handleConnectWhoop}
                          disabled={isConnecting === "whoop"}
                          className="w-full bg-red-500 hover:bg-red-600"
                        >
                          {isConnecting === "whoop" ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Conectando...
                            </>
                          ) : (
                            "Conectar Whoop"
                          )}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-blue-900">Sincronización automática</p>
                  <p className="text-blue-800">
                    Tus datos se sincronizarán automáticamente cada 6 horas. Puedes sincronizar
                    manualmente en cualquier momento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Mis Métricas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Conecta un dispositivo para ver tus métricas de salud
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5" />
                  Insights Personalizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Conecta un dispositivo para recibir insights personalizados sobre tu salud
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
