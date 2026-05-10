import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface SyncStatusData {
  device: string;
  status: 'synced' | 'syncing' | 'error' | 'pending';
  lastSync?: Date;
  nextSync?: Date;
  progress?: number;
  error?: string;
}

interface SyncStatusProps {
  syncStatus: SyncStatusData[];
  onManualSync?: (device: string) => void;
  isLoading?: boolean;
}

const STATUS_CONFIG = {
  synced: {
    icon: CheckCircle2,
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-800',
    label: 'Sincronizado',
  },
  syncing: {
    icon: Loader2,
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800',
    label: 'Sincronizando...',
  },
  error: {
    icon: AlertCircle,
    color: 'bg-red-50 border-red-200',
    badgeColor: 'bg-red-100 text-red-800',
    label: 'Error',
  },
  pending: {
    icon: Clock,
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    label: 'Pendiente',
  },
};

export function SyncStatus({
  syncStatus,
  onManualSync,
  isLoading = false,
}: SyncStatusProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Sincronización</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Estado de Sincronización</span>
          <Badge variant="outline">{syncStatus.length} dispositivos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {syncStatus.map((item) => (
            <SyncStatusItem
              key={item.device}
              item={item}
              onSync={() => onManualSync?.(item.device)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SyncStatusItem({
  item,
  onSync,
}: {
  item: SyncStatusData;
  onSync?: () => void;
}) {
  const config = STATUS_CONFIG[item.status];
  const Icon = config.icon;
  const isAnimating = item.status === 'syncing';

  return (
    <div className={`border-2 rounded-lg p-3 ${config.color}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Icon
            className={`w-5 h-5 flex-shrink-0 mt-1 ${
              isAnimating ? 'animate-spin' : ''
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{item.device}</h4>
              <Badge className={config.badgeColor} variant="secondary">
                {config.label}
              </Badge>
            </div>

            {/* Sync Info */}
            <div className="space-y-1 text-xs text-gray-600">
              {item.lastSync && (
                <p>
                  Última sincronización:{' '}
                  {formatDistanceToNow(item.lastSync, {
                    locale: es,
                    addSuffix: true,
                  })}
                </p>
              )}
              {item.nextSync && (
                <p>
                  Próxima sincronización:{' '}
                  {formatDistanceToNow(item.nextSync, {
                    locale: es,
                    addSuffix: true,
                  })}
                </p>
              )}
              {item.error && (
                <p className="text-red-600 font-medium">Error: {item.error}</p>
              )}
            </div>

            {/* Progress Bar */}
            {item.status === 'syncing' && item.progress !== undefined && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        {item.status !== 'syncing' && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSync}
            className="flex-shrink-0"
            title="Sincronizar ahora"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Preset sync status items
export function createSyncStatusItem(
  device: string,
  lastSync: Date | null,
  status: 'synced' | 'syncing' | 'error' | 'pending' = 'synced'
): SyncStatusData {
  return {
    device,
    status,
    lastSync: lastSync || undefined,
    nextSync: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 horas
  };
}

export function createErrorSyncStatus(
  device: string,
  error: string
): SyncStatusData {
  return {
    device,
    status: 'error',
    error,
  };
}

export function createSyncingSyncStatus(
  device: string,
  progress: number = 0
): SyncStatusData {
  return {
    device,
    status: 'syncing',
    progress,
  };
}
