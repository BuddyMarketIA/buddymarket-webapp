import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Building2, Users, TrendingUp, Activity, Award, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CorporateDashboard() {
  const { user } = useAuth();

  const { data: metrics, isLoading } = trpc.corporateDashboard.getMetrics.useQuery(undefined, {
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container max-w-lg mx-auto py-12 text-center">
        <Building2 className="w-12 h-12 mx-auto text-blue-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Dashboard Corporativo</h1>
        <p className="text-muted-foreground">Panel de bienestar para empresas</p>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Dashboard Corporativo</h1>
          <p className="text-muted-foreground text-sm">Métricas de bienestar del equipo</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <Users className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{metrics?.totalEmployees || 0}</p>
            <p className="text-xs text-muted-foreground">Empleados activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Activity className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{metrics?.engagementRate || 0}%</p>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <TrendingUp className="w-5 h-5 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{metrics?.avgWellnessScore || 0}</p>
            <p className="text-xs text-muted-foreground">Score bienestar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <Award className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold">{metrics?.challengesCompleted || 0}</p>
            <p className="text-xs text-muted-foreground">Retos completados</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Report */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Informe Mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.monthlyReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-lg font-bold text-blue-600">{metrics.monthlyReport.mealsLogged}</p>
                  <p className="text-xs text-muted-foreground">Comidas registradas</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <p className="text-lg font-bold text-green-600">{metrics.monthlyReport.avgCalories}</p>
                  <p className="text-xs text-muted-foreground">Kcal/día promedio</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                  <p className="text-lg font-bold text-purple-600">{metrics.monthlyReport.streakDays}</p>
                  <p className="text-xs text-muted-foreground">Días racha media</p>
                </div>
              </div>

              {/* Department breakdown */}
              {metrics.monthlyReport.departments && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Por departamento</h4>
                  <div className="space-y-2">
                    {metrics.monthlyReport.departments.map((dept: any) => (
                      <div key={dept.name} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{dept.name}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">{dept.employees} empleados</span>
                          <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${dept.engagement}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-8">{dept.engagement}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay datos suficientes para generar el informe. Los empleados deben usar la app al menos 7 días.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Wellness Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tendencias de Bienestar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics?.trends ? (
            <div className="space-y-3">
              {metrics.trends.map((trend: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <span className="text-xl">{trend.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{trend.title}</p>
                    <p className="text-xs text-muted-foreground">{trend.description}</p>
                  </div>
                  <span className={`text-sm font-bold ${trend.positive ? "text-green-500" : "text-red-500"}`}>
                    {trend.positive ? "↑" : "↓"} {trend.change}%
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Las tendencias se calculan con datos de al menos 30 días
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
