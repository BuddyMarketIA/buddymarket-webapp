import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Users, Gift, Zap, Target, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = ["#F97316", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

export function AnalyticsDashboard() {
  const { t } = useTranslation();

  // Fetch analytics data
  const { data: metrics } = trpc.analytics.getViralMetrics.useQuery();
  const { data: growthTrend } = trpc.analytics.getGrowthTrend.useQuery();
  const { data: topReferrers } = trpc.analytics.getTopReferrers.useQuery({ limit: 10 });
  const { data: cohortAnalysis } = trpc.analytics.getCohortAnalysis.useQuery();
  const { data: referralByPlan } = trpc.analytics.getReferralByPlanTier.useQuery();
  const { data: viralLoopEfficiency } = trpc.analytics.getViralLoopEfficiency.useQuery();

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("analytics.title", { defaultValue: "Dashboard de Analytics" })}</h1>
        <p className="text-muted-foreground">
          {t("analytics.description", {
            defaultValue: "Métricas de crecimiento viral y rendimiento del programa de referidos",
          })}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4" />
              {t("analytics.total_users", { defaultValue: "Usuarios" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analytics.active_users", { defaultValue: "usuarios activos" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="w-4 h-4" />
              {t("analytics.referral_codes", { defaultValue: "Códigos" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.usersWithCodes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analytics.users_with_codes", { defaultValue: "usuarios con código" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t("analytics.total_referrals", { defaultValue: "Referidos" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalReferrals || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analytics.total_referrals_desc", { defaultValue: "referidos totales" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t("analytics.avg_referrals", { defaultValue: "Promedio" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgReferralsPerUser || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analytics.avg_per_user", { defaultValue: "por usuario" })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              {t("analytics.conversion", { defaultValue: "Conversión" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("analytics.conversion_rate", { defaultValue: "tasa de conversión" })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Trend Chart */}
      {growthTrend && (
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.growth_trend", { defaultValue: "Tendencia de Crecimiento (30 días)" })}</CardTitle>
            <CardDescription>
              {t("analytics.growth_trend_desc", {
                defaultValue: "Nuevos usuarios y referidos por día",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthTrend.dailyNewUsers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#F97316"
                  name={t("analytics.new_users", { defaultValue: "Nuevos usuarios" })}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Referrers */}
      {topReferrers && topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.top_referrers", { defaultValue: "Top Referidores" })}</CardTitle>
            <CardDescription>
              {t("analytics.top_referrers_desc", {
                defaultValue: "Usuarios que más han invitado amigos",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topReferrers.map((referrer, index) => (
                <div key={referrer.userId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary">{index + 1}</Badge>
                    <div>
                      <p className="font-semibold">{referrer.name}</p>
                      <p className="text-sm text-muted-foreground">{referrer.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{referrer.referralCount}</p>
                    <p className="text-xs text-muted-foreground">
                      ${referrer.totalEarnings}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Distribution */}
      {referralByPlan && (
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.referral_distribution", { defaultValue: "Distribución de Referidos" })}</CardTitle>
            <CardDescription>
              {t("analytics.distribution_desc", {
                defaultValue: "Usuarios por cantidad de referidos",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    {
                      name: t("analytics.no_referrals", { defaultValue: "Sin referidos" }),
                      value: referralByPlan.noReferrals,
                    },
                    {
                      name: t("analytics.one_to_three", { defaultValue: "1-3 referidos" }),
                      value: referralByPlan.oneToThree,
                    },
                    {
                      name: t("analytics.four_to_ten", { defaultValue: "4-10 referidos" }),
                      value: referralByPlan.fourToTen,
                    },
                    {
                      name: t("analytics.more_than_ten", { defaultValue: "10+ referidos" }),
                      value: referralByPlan.moreThanTen,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2, 3].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Viral Loop Efficiency */}
      {viralLoopEfficiency && (
        <Card>
          <CardHeader>
            <CardTitle>{t("analytics.viral_loop", { defaultValue: "Eficiencia del Loop Viral" })}</CardTitle>
            <CardDescription>
              {t("analytics.viral_loop_desc", {
                defaultValue: "Tiempo promedio desde signup hasta primer referido",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  {t("analytics.users_referred", { defaultValue: "Usuarios que refirieron" })}
                </p>
                <p className="text-2xl font-bold mt-2">
                  {viralLoopEfficiency.usersWhoReferred}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  {t("analytics.avg_days", { defaultValue: "Días promedio" })}
                </p>
                <p className="text-2xl font-bold mt-2">
                  {viralLoopEfficiency.avgDaysToFirstReferral}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>{t("analytics.insights", { defaultValue: "Insights Clave" })}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Activity className="w-5 h-5 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-semibold">
                {t("analytics.insight1_title", { defaultValue: "Crecimiento Viral" })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("analytics.insight1_desc", {
                  defaultValue: "Tu programa de referidos está generando crecimiento exponencial",
                })}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Activity className="w-5 h-5 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-semibold">
                {t("analytics.insight2_title", { defaultValue: "Engagement Alto" })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("analytics.insight2_desc", {
                  defaultValue: "Los usuarios están activamente invitando amigos",
                })}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Activity className="w-5 h-5 text-primary shrink-0 mt-1" />
            <div>
              <p className="font-semibold">
                {t("analytics.insight3_title", { defaultValue: "Oportunidad de Optimización" })}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("analytics.insight3_desc", {
                  defaultValue: "Considera mejorar incentivos para usuarios que aún no refieren",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
