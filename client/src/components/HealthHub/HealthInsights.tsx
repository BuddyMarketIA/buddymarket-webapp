import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Lightbulb,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface Insight {
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
  actionUrl?: string;
  actionLabel?: string;
}

interface HealthInsightsProps {
  insights: Insight[];
  isLoading?: boolean;
  onAction?: (insightId: string) => void;
}

const INSIGHT_CONFIG = {
  warning: {
    icon: AlertCircle,
    color: 'bg-red-50 border-red-200',
    badgeColor: 'bg-red-100 text-red-800',
    textColor: 'text-red-900',
  },
  success: {
    icon: CheckCircle2,
    color: 'bg-green-50 border-green-200',
    badgeColor: 'bg-green-100 text-green-800',
    textColor: 'text-green-900',
  },
  info: {
    icon: Info,
    color: 'bg-blue-50 border-blue-200',
    badgeColor: 'bg-blue-100 text-blue-800',
    textColor: 'text-blue-900',
  },
  tip: {
    icon: Lightbulb,
    color: 'bg-yellow-50 border-yellow-200',
    badgeColor: 'bg-yellow-100 text-yellow-800',
    textColor: 'text-yellow-900',
  },
};

export function HealthInsights({
  insights,
  isLoading = false,
  onAction,
}: HealthInsightsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights de Salud</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Insights de Salud</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">
              No hay insights disponibles. Conecta tus dispositivos wearables para obtener recomendaciones personalizadas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Insights de Salud</span>
          <Badge variant="outline">{insights.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onAction={() => onAction?.(insight.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({
  insight,
  onAction,
}: {
  insight: Insight;
  onAction?: () => void;
}) {
  const config = INSIGHT_CONFIG[insight.type];
  const Icon = config.icon;

  return (
    <div className={`border-2 rounded-lg p-4 ${config.color}`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-1 ${config.textColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className={`font-semibold ${config.textColor}`}>{insight.title}</h4>
            <Badge className={config.badgeColor} variant="secondary">
              {insight.type}
            </Badge>
          </div>

          <p className={`text-sm ${config.textColor} opacity-90 mb-2`}>
            {insight.description}
          </p>

          {/* Metric Display */}
          {insight.metric && (
            <div className="bg-white/50 rounded p-2 mb-3 flex items-center justify-between">
              <span className="text-sm font-medium">{insight.metric.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">
                  {insight.metric.value}
                  {insight.metric.unit && <span className="text-sm ml-1">{insight.metric.unit}</span>}
                </span>
                {insight.metric.trend && (
                  <>
                    {insight.metric.trend === 'up' && (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    )}
                    {insight.metric.trend === 'down' && (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Recommendation */}
          {insight.recommendation && (
            <div className="bg-white/50 rounded p-2 mb-3">
              <p className="text-sm font-medium mb-1">💡 Recomendación:</p>
              <p className="text-sm">{insight.recommendation}</p>
            </div>
          )}

          {/* Action Button */}
          {insight.actionUrl || insight.actionLabel ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onAction}
              className="w-full"
            >
              {insight.actionLabel || 'Ver más'}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Preset insight cards
export function SleepQualityInsight({
  score,
  trend,
}: {
  score: number;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const type = score >= 80 ? 'success' : score >= 60 ? 'info' : 'warning';
  const message =
    score >= 80
      ? 'Tu calidad de sueño es excelente'
      : score >= 60
        ? 'Tu calidad de sueño es buena'
        : 'Tu calidad de sueño necesita mejorar';

  return {
    id: 'sleep-quality',
    type,
    title: 'Calidad de Sueño',
    description: message,
    recommendation:
      score < 70
        ? 'Intenta mantener una rutina de sueño consistente y evita pantallas 1 hora antes de dormir'
        : undefined,
    metric: {
      label: 'Puntuación',
      value: score,
      unit: '/100',
      trend,
    },
  };
}

export function RecoveryInsight({
  score,
  recommendation,
}: {
  score: number;
  recommendation?: string;
}) {
  const type = score >= 70 ? 'success' : score >= 40 ? 'info' : 'warning';
  const title =
    score >= 70 ? 'Recuperación Óptima' : score >= 40 ? 'Recuperación Normal' : 'Baja Recuperación';

  return {
    id: 'recovery',
    type,
    title,
    description: `Tu índice de recuperación es ${score}%`,
    recommendation:
      recommendation ||
      (score < 40
        ? 'Considera reducir la intensidad del entrenamiento y aumentar el descanso'
        : 'Continúa con tu rutina actual'),
    metric: {
      label: 'Índice de Recuperación',
      value: score,
      unit: '%',
    },
  };
}

export function ActivityInsight({
  caloriesBurned,
  dailyGoal,
}: {
  caloriesBurned: number;
  dailyGoal: number;
}) {
  const percentage = Math.round((caloriesBurned / dailyGoal) * 100);
  const type = percentage >= 100 ? 'success' : percentage >= 70 ? 'info' : 'warning';

  return {
    id: 'activity',
    type,
    title: 'Meta de Actividad',
    description: `Has quemado ${caloriesBurned} de ${dailyGoal} calorías`,
    metric: {
      label: 'Progreso',
      value: `${percentage}%`,
    },
    recommendation:
      percentage < 70
        ? 'Intenta moverte más durante el día. Camina, sube escaleras o haz ejercicio'
        : undefined,
  };
}

export function HydrationInsight({
  waterIntake,
  recommendation,
}: {
  waterIntake: number;
  recommendation?: string;
}) {
  const type = waterIntake >= 8 ? 'success' : waterIntake >= 5 ? 'info' : 'warning';

  return {
    id: 'hydration',
    type,
    title: 'Hidratación',
    description: `Has consumido ${waterIntake} vasos de agua hoy`,
    recommendation:
      recommendation ||
      (waterIntake < 5
        ? 'Intenta beber más agua. La recomendación es 8 vasos diarios'
        : 'Buen trabajo manteniendo la hidratación'),
    metric: {
      label: 'Vasos de Agua',
      value: waterIntake,
      unit: '/8',
    },
  };
}
