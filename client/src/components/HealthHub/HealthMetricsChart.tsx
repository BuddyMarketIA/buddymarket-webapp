import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Moon, Heart, Zap, TrendingUp } from 'lucide-react';

interface MetricData {
  date: string;
  value: number;
  [key: string]: string | number;
}

interface HealthMetricsChartProps {
  title: string;
  description?: string;
  data: MetricData[];
  metrics: Array<{
    key: string;
    label: string;
    color: string;
    unit?: string;
  }>;
  type?: 'line' | 'area' | 'bar' | 'composed';
  height?: number;
  showLegend?: boolean;
}

const METRIC_ICONS = {
  sleep: Moon,
  recovery: Heart,
  strain: Zap,
  activity: TrendingUp,
};

export function HealthMetricsChart({
  title,
  description,
  data,
  metrics,
  type = 'line',
  height = 300,
  showLegend = true,
}: HealthMetricsChartProps) {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 0, bottom: 5 },
    };

    const chartContent = (
      <>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value: number) => value.toFixed(1)}
          labelStyle={{ color: '#000' }}
        />
        {showLegend && <Legend />}
        {metrics.map((metric) => (
          <Line
            key={metric.key}
            type="monotone"
            dataKey={metric.key}
            stroke={metric.color}
            dot={false}
            strokeWidth={2}
            name={metric.label}
          />
        ))}
      </>
    );

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {chartContent}
            {metrics.map((metric) => (
              <Area
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                fill={metric.color}
                stroke={metric.color}
                fillOpacity={0.3}
                name={metric.label}
              />
            ))}
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {chartContent}
            {metrics.map((metric) => (
              <Bar
                key={metric.key}
                dataKey={metric.key}
                fill={metric.color}
                name={metric.label}
              />
            ))}
          </BarChart>
        );
      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {chartContent}
            {metrics.map((metric, index) => (
              index % 2 === 0 ? (
                <Bar
                  key={metric.key}
                  dataKey={metric.key}
                  fill={metric.color}
                  name={metric.label}
                />
              ) : (
                <Line
                  key={metric.key}
                  type="monotone"
                  dataKey={metric.key}
                  stroke={metric.color}
                  yAxisId="right"
                  name={metric.label}
                />
              )
            ))}
          </ComposedChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            {chartContent}
          </LineChart>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart()}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// Preset charts for common metrics
export function SleepChart({ data }: { data: MetricData[] }) {
  return (
    <HealthMetricsChart
      title="Duración del Sueño"
      description="Horas de sueño por noche"
      data={data}
      metrics={[
        { key: 'sleep_duration', label: 'Horas', color: '#8b5cf6', unit: 'h' },
      ]}
      type="area"
      height={250}
    />
  );
}

export function RecoveryChart({ data }: { data: MetricData[] }) {
  return (
    <HealthMetricsChart
      title="Puntuación de Recuperación"
      description="Índice de recuperación diaria (0-100)"
      data={data}
      metrics={[
        { key: 'recovery_score', label: 'Recuperación', color: '#ef4444', unit: '%' },
        { key: 'resting_heart_rate', label: 'Frecuencia Cardíaca en Reposo', color: '#3b82f6', unit: 'bpm' },
      ]}
      type="composed"
      height={300}
    />
  );
}

export function ActivityChart({ data }: { data: MetricData[] }) {
  return (
    <HealthMetricsChart
      title="Actividad Diaria"
      description="Calorías quemadas y pasos"
      data={data}
      metrics={[
        { key: 'calories_burned', label: 'Calorías', color: '#f59e0b', unit: 'kcal' },
        { key: 'steps', label: 'Pasos', color: '#10b981', unit: 'pasos' },
      ]}
      type="bar"
      height={250}
    />
  );
}

export function StrainChart({ data }: { data: MetricData[] }) {
  return (
    <HealthMetricsChart
      title="Índice de Entrenamiento"
      description="Carga de entrenamiento diaria"
      data={data}
      metrics={[
        { key: 'strain_score', label: 'Strain', color: '#dc2626', unit: '/21' },
      ]}
      type="line"
      height={250}
    />
  );
}
