import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link2, Unlink2, RefreshCw, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface WearableCardProps {
  device: 'oura' | 'whoop' | 'apple' | 'google';
  isConnected: boolean;
  lastSync?: Date;
  isSyncing?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onSync?: () => void;
}

const DEVICE_CONFIG = {
  oura: {
    name: 'Oura Ring',
    icon: '⭕',
    color: 'bg-orange-50 border-orange-200',
    badgeColor: 'bg-orange-100 text-orange-800',
    description: 'Anillo inteligente que monitorea sueño, recuperación y actividad',
    features: ['Sueño', 'Recuperación', 'Actividad', 'HRV', 'SpO2'],
  },
  whoop: {
    name: 'Whoop',
    icon: '🔵',
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800',
    description: 'Banda de fitness que mide recuperación, entrenamiento y sueño',
    features: ['Recuperación', 'Entrenamiento', 'Sueño', 'Ciclos', 'Métricas'],
  },
  apple: {
    name: 'Apple Health',
    icon: '🍎',
    color: 'bg-gray-50 border-gray-200',
    badgeColor: 'bg-gray-100 text-gray-800',
    description: 'Datos de salud desde tu iPhone y dispositivos Apple',
    features: ['Pasos', 'Calorías', 'Frecuencia Cardíaca', 'Ejercicio'],
  },
  google: {
    name: 'Google Fit',
    icon: '🔵',
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-800',
    description: 'Datos de fitness desde Google Fit',
    features: ['Pasos', 'Calorías', 'Distancia', 'Actividad'],
  },
};

export function WearableCard({
  device,
  isConnected,
  lastSync,
  isSyncing = false,
  onConnect,
  onDisconnect,
  onSync,
}: WearableCardProps) {
  const config = DEVICE_CONFIG[device];

  return (
    <Card className={`${config.color} border-2 transition-all hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <CardTitle className="text-lg">{config.name}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
            </div>
          </div>
          <Badge className={config.badgeColor}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Features */}
        <div className="flex flex-wrap gap-2">
          {config.features.map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>

        {/* Last Sync Info */}
        {isConnected && lastSync && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white/50 rounded p-2">
            <Clock className="w-4 h-4" />
            <span>
              Última sincronización: {formatDistanceToNow(lastSync, { locale: es, addSuffix: true })}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isConnected ? (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={onSync}
                disabled={isSyncing}
                className="flex-1"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={onDisconnect}
                className="flex-1"
              >
                <Unlink2 className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="default"
              onClick={onConnect}
              className="w-full"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Conectar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
