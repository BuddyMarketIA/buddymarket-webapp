/**
 * Dashboard Mejorado para BuddyMakers
 * Incluye: herramientas de creación, analytics, monetización, colaboraciones, capacitación
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Users,
  Download,
  Share2,
  Heart,
  Eye,
  DollarSign,
  Gift,
  Users2,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";

export default function MakerDashboardEnhanced() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");

  // Datos de ejemplo (en producción vendrían de tRPC)
  const stats = {
    totalViews: 15420,
    totalDownloads: 3240,
    totalShares: 892,
    totalSaves: 5621,
    averageRating: 4.8,
    totalEarnings: 1250.50,
    pendingEarnings: 320.75,
  };

  const chartData = [
    { date: "Lun", views: 240, downloads: 24, shares: 12 },
    { date: "Mar", views: 421, downloads: 42, shares: 21 },
    { date: "Mié", views: 221, downloads: 22, shares: 11 },
    { date: "Jue", views: 529, downloads: 53, shares: 26 },
    { date: "Vie", views: 200, downloads: 20, shares: 10 },
    { date: "Sab", views: 200, downloads: 20, shares: 10 },
    { date: "Dom", views: 300, downloads: 30, shares: 15 },
  ];

  const recipePerformance = [
    { name: "Ensalada Griega", value: 2400, rating: 4.9 },
    { name: "Pasta Integral", value: 1398, rating: 4.7 },
    { name: "Smoothie Bowl", value: 9800, rating: 4.8 },
    { name: "Salmón a la Parrilla", value: 3908, rating: 4.6 },
  ];

  const collaborationRequests = [
    {
      id: 1,
      from: "Chef María",
      role: "co-creator",
      recipe: "Receta Especial",
      status: "pending",
    },
    {
      id: 2,
      from: "Chef Juan",
      role: "contributor",
      recipe: "Postre Saludable",
      status: "pending",
    },
  ];

  const referralCodes = [
    { code: "MAKER123ABC", uses: 45, earnings: 225.50, active: true },
    { code: "MAKER456DEF", uses: 28, earnings: 140.00, active: true },
  ];

  const badges = [
    { id: 1, title: "100 Recetas", icon: "🎯", earned: true },
    { id: 2, title: "1K Seguidores", icon: "👥", earned: true },
    { id: 3, title: "Top Rated", icon: "⭐", earned: true },
    { id: 4, title: "Viral", icon: "🚀", earned: false },
  ];

  const resources = [
    { id: 1, title: "Cómo monetizar tus recetas", category: "monetization", completed: true },
    { id: 2, title: "Marketing en redes sociales", category: "marketing", completed: false },
    { id: 3, title: "Nutrición avanzada", category: "nutrition", completed: true },
  ];

  const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa"];

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t("common.myPanel")}</h1>
          <p className="text-gray-600">{t("common.manageYourRecipes")}</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
            <TabsTrigger value="overview">{t("common.overview")}</TabsTrigger>
            <TabsTrigger value="analytics">{t("common.analytics")}</TabsTrigger>
            <TabsTrigger value="monetization">{t("common.monetization")}</TabsTrigger>
            <TabsTrigger value="collaboration">{t("common.collaboration")}</TabsTrigger>
            <TabsTrigger value="learning">{t("common.learning")}</TabsTrigger>
          </TabsList>

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* OVERVIEW */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="overview" className="space-y-6">
            {/* Tarjetas de estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t("common.views")}</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <Eye className="w-12 h-12 text-blue-300" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t("common.downloads")}</p>
                    <p className="text-3xl font-bold text-green-600">{stats.totalDownloads.toLocaleString()}</p>
                  </div>
                  <Download className="w-12 h-12 text-green-300" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t("common.shares")}</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.totalShares.toLocaleString()}</p>
                  </div>
                  <Share2 className="w-12 h-12 text-purple-300" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t("common.rating")}</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.averageRating.toFixed(1)}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-orange-300" />
                </div>
              </Card>
            </div>

            {/* Gráfico de tendencia */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t("common.weeklyTrend")}</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="views" stroke="#f97316" name={t("common.views")} />
                  <Line type="monotone" dataKey="downloads" stroke="#10b981" name={t("common.downloads")} />
                  <Line type="monotone" dataKey="shares" stroke="#8b5cf6" name={t("common.shares")} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* ANALYTICS */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Rendimiento de recetas */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t("common.recipePerformance")}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={recipePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f97316" name={t("common.views")} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Distribución de recetas */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t("common.distribution")}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={recipePerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {recipePerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </div>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* MONETIZACIÓN */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="monetization" className="space-y-6">
            {/* Ganancias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t("common.totalEarnings")}</p>
                    <p className="text-3xl font-bold text-green-600">€{stats.totalEarnings.toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-300" />
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t("common.pendingEarnings")}</p>
                    <p className="text-3xl font-bold text-yellow-600">€{stats.pendingEarnings.toFixed(2)}</p>
                  </div>
                  <Clock className="w-12 h-12 text-yellow-300" />
                </div>
              </Card>
            </div>

            {/* Códigos de referencia */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t("common.referralCodes")}</h2>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white gap-2">
                  <Gift className="w-4 h-4" />
                  {t("common.generateCode")}
                </Button>
              </div>

              <div className="space-y-3">
                {referralCodes.map((code) => (
                  <div key={code.code} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-mono font-bold text-gray-900">{code.code}</p>
                      <p className="text-sm text-gray-600">{code.uses} {t("common.uses")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">€{code.earnings.toFixed(2)}</p>
                      <Badge className={code.active ? "bg-green-500" : "bg-gray-500"}>
                        {code.active ? t("common.active") : t("common.inactive")}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* COLABORACIONES */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="collaboration" className="space-y-6">
            {/* Solicitudes pendientes */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">{t("common.collaborationRequests")}</h2>
                <Badge className="bg-orange-500">{collaborationRequests.length}</Badge>
              </div>

              <div className="space-y-3">
                {collaborationRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-semibold text-gray-900">{request.from}</p>
                      <p className="text-sm text-gray-600">
                        {t("common.wantsToCollaborate")} • {request.recipe}
                      </p>
                      <Badge className="mt-2 bg-blue-100 text-blue-800">{request.role}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <AlertCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Badges */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t("common.badges")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-lg text-center ${
                      badge.earned
                        ? "bg-yellow-50 border-2 border-yellow-400"
                        : "bg-gray-100 border-2 border-gray-300 opacity-50"
                    }`}
                  >
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <p className="text-sm font-semibold text-gray-900">{badge.title}</p>
                    {badge.earned && <Badge className="mt-2 bg-green-500 text-white">✓ {t("common.earned")}</Badge>}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          {/* APRENDIZAJE */}
          {/* ═══════════════════════════════════════════════════════════════════════════ */}
          <TabsContent value="learning" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t("common.trainingResources")}</h2>
              <div className="space-y-3">
                {resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{resource.title}</p>
                        <p className="text-sm text-gray-600">{resource.category}</p>
                      </div>
                    </div>
                    {resource.completed ? (
                      <Badge className="bg-green-500 text-white">✓ {t("common.completed")}</Badge>
                    ) : (
                      <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                        {t("common.start")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
