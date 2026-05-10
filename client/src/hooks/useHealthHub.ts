import { useCallback, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from '@/components/sonner-a11y-shim';

export interface HealthHubConnection {
  device: 'oura' | 'whoop' | 'apple' | 'google';
  isConnected: boolean;
  lastSync?: Date;
  userId?: string;
}

export interface HealthHubMetrics {
  date: string;
  sleep_duration?: number;
  recovery_score?: number;
  strain_score?: number;
  calories_burned?: number;
  steps?: number;
  resting_heart_rate?: number;
  [key: string]: string | number | undefined;
}

export interface HealthHubInsight {
  id: string;
  type: 'warning' | 'success' | 'info' | 'tip';
  title: string;
  description: string;
  recommendation?: string;
  metric?: {
    label: string;
    value: string | number;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
  };
}

/**
 * Hook personalizado para gestionar Health Hub
 * Proporciona acceso a conexiones, métricas e insights de dispositivos wearables
 */
export function useHealthHub() {
  const [selectedDevice, setSelectedDevice] = useState<'oura' | 'whoop' | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
    end: new Date(),
  });

  // Queries
  const { data: connections, isLoading: connectionsLoading, refetch: refetchConnections } = trpc.healthHub.getConnections.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  const { data: metrics, isLoading: metricsLoading } = trpc.healthHub.getMetrics.useQuery(
    {
      startDate: dateRange.start,
      endDate: dateRange.end,
      source: selectedDevice ? (selectedDevice as 'oura' | 'whoop') : 'all',
    },
    {
      staleTime: 10 * 60 * 1000, // 10 minutos
    }
  );

  const { data: insights, isLoading: insightsLoading } = trpc.healthHub.getInsights.useQuery(
    undefined,
    {
      staleTime: 15 * 60 * 1000, // 15 minutos
    }
  );

  const { data: syncStatus, isLoading: syncStatusLoading } = trpc.healthHub.getSyncStatus.useQuery(
    undefined,
    {
      staleTime: 1 * 60 * 1000, // 1 minuto
    }
  );

  // Mutations
  const connectOura = trpc.healthHub.connectOura.useMutation({
    onSuccess: (data) => {
      toast.success('Redirigiendo a Oura para autorización...');
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast.error(`Error al conectar con Oura: ${error.message}`);
    },
  });

  const connectWhoop = trpc.healthHub.connectWhoop.useMutation({
    onSuccess: (data) => {
      toast.success('Redirigiendo a Whoop para autorización...');
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast.error(`Error al conectar con Whoop: ${error.message}`);
    },
  });

  const disconnect = trpc.healthHub.disconnectWearable.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchConnections();
    },
    onError: (error) => {
      toast.error(`Error al desconectar: ${error.message}`);
    },
  });

  const syncNow = trpc.healthHub.syncNow.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchConnections();
    },
    onError: (error) => {
      toast.error(`Error al sincronizar: ${error.message}`);
    },
  });

  // Handlers
  const handleConnectOura = useCallback(() => {
    connectOura.mutate();
  }, [connectOura]);

  const handleConnectWhoop = useCallback(() => {
    connectWhoop.mutate();
  }, [connectWhoop]);

  const handleDisconnect = useCallback(
    (device: 'oura' | 'whoop') => {
      disconnect.mutate({ device });
    },
    [disconnect]
  );

  const handleSync = useCallback(
    (device: 'oura' | 'whoop') => {
      syncNow.mutate({ device });
    },
    [syncNow]
  );

  const handleDateRangeChange = useCallback(
    (start: Date, end: Date) => {
      setDateRange({ start, end });
    },
    []
  );

  const handleDeviceSelect = useCallback(
    (device: 'oura' | 'whoop' | null) => {
      setSelectedDevice(device);
    },
    []
  );

  // Computed values
  const isOuraConnected = connections?.some((c) => c.device === 'oura' && c.isConnected) ?? false;
  const isWhoopConnected = connections?.some((c) => c.device === 'whoop' && c.isConnected) ?? false;
  const hasAnyConnection = isOuraConnected || isWhoopConnected;

  const ouraLastSync = connections?.find((c) => c.device === 'oura')?.lastSync;
  const whoopLastSync = connections?.find((c) => c.device === 'whoop')?.lastSync;

  const isLoading = connectionsLoading || metricsLoading || insightsLoading || syncStatusLoading;
  const isSyncing = syncNow.isPending || connectOura.isPending || connectWhoop.isPending;

  return {
    // State
    connections,
    metrics,
    insights,
    syncStatus,
    selectedDevice,
    dateRange,
    isOuraConnected,
    isWhoopConnected,
    hasAnyConnection,
    ouraLastSync,
    whoopLastSync,

    // Loading states
    isLoading,
    isSyncing,
    connectionsLoading,
    metricsLoading,
    insightsLoading,
    syncStatusLoading,

    // Handlers
    handleConnectOura,
    handleConnectWhoop,
    handleDisconnect,
    handleSync,
    handleDateRangeChange,
    handleDeviceSelect,

    // Mutations
    connectOura,
    connectWhoop,
    disconnect,
    syncNow,

    // Refetch
    refetchConnections,
  };
}

/**
 * Hook para obtener solo las conexiones
 */
export function useHealthHubConnections() {
  const { data, isLoading, refetch } = trpc.healthHub.getConnections.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  return { connections: data, isLoading, refetch };
}

/**
 * Hook para obtener solo las métricas
 */
export function useHealthHubMetrics(startDate: Date, endDate: Date, source?: 'oura' | 'whoop' | 'all') {
  const { data, isLoading } = trpc.healthHub.getMetrics.useQuery(
    { startDate, endDate, source },
    { staleTime: 10 * 60 * 1000 }
  );

  return { metrics: data, isLoading };
}

/**
 * Hook para obtener solo los insights
 */
export function useHealthHubInsights() {
  const { data, isLoading } = trpc.healthHub.getInsights.useQuery(undefined, {
    staleTime: 15 * 60 * 1000,
  });

  return { insights: data, isLoading };
}

/**
 * Hook para obtener el estado de sincronización
 */
export function useHealthHubSyncStatus() {
  const { data, isLoading } = trpc.healthHub.getSyncStatus.useQuery(undefined, {
    staleTime: 1 * 60 * 1000,
  });

  return { syncStatus: data, isLoading };
}

/**
 * Hook para sincronizar datos
 */
export function useHealthHubSync() {
  const syncNow = trpc.healthHub.syncNow.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(`Error al sincronizar: ${error.message}`);
    },
  });

  const handleSync = useCallback(
    (device: 'oura' | 'whoop') => {
      syncNow.mutate({ device });
    },
    [syncNow]
  );

  return {
    syncNow: handleSync,
    isSyncing: syncNow.isPending,
  };
}
