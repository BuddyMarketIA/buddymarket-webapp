import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import {
  Users, TrendingUp, Euro, Copy, Check, ExternalLink, Star,
  ArrowUpRight, ArrowDownRight, Minus, ChefHat, Award, Clock,
  Share2, RefreshCw, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

function StatCard({
  title, value, subtitle, icon: Icon, trend, trendValue, color = "orange",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  color?: "orange" | "green" | "blue" | "purple";
}) {
  const colorMap = {
    orange: "text-orange-500 bg-orange-50",
    green: "text-green-600 bg-green-50",
    blue: "text-blue-600 bg-blue-50",
    purple: "text-purple-600 bg-purple-50",
  };
  return (
    <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground truncate">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trendValue && (
              <div className="flex items-center gap-1 mt-2">
                {trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3 text-green-600" />
                ) : trend === "down" ? (
                  <ArrowDownRight className="w-3 h-3 text-red-500" />
                ) : (
                  <Minus className="w-3 h-3 text-muted-foreground" />
                )}
                <span className={`text-xs font-medium ${trend === "up" ? "text-green-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3 ${colorMap[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferralRow({ referral, index }: { referral: any; index: number }) {
  const planLabels: Record<string, string> = {
    pro: "Pro",
    pro_max: "Pro Max",
    free: "Free",
  };
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {referral.referredName ? referral.referredName[0].toUpperCase() : "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {referral.referredName ?? `Usuario #${index + 1}`}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(referral.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {referral.plan && (
          <Badge variant="secondary" className="text-xs">
            {planLabels[referral.plan] ?? referral.plan}
          </Badge>
        )}
        <Badge
          variant={referral.isActive ? "default" : "secondary"}
          className={`text-xs ${referral.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}`}
        >
          {referral.isActive ? "Activo" : "Cancelado"}
        </Badge>
      </div>
    </div>
  );
}

function EarningRow({ earning }: { earning: any }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/40 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white flex-shrink-0">
        <Euro className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          Comisión de {earning.referredName ?? "usuario"}
        </p>
        <p className="text-xs text-muted-foreground">
          {new Date(earning.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-bold text-green-600">
          +{(earning.commissionAmount / 100).toFixed(2)}€
        </span>
        <Badge
          variant={earning.status === "completed" ? "default" : "secondary"}
          className={`text-xs ${earning.status === "completed" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-yellow-100 text-yellow-700"}`}
        >
          {earning.status === "completed" ? "Pagado" : "Pendiente"}
        </Badge>
      </div>
    </div>
  );
}

export default function CreatorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [copied, setCopied] = useState(false);
  const generateCode = trpc.referrals.generate.useMutation({
    onSuccess: () => {
      utils.referrals.getDashboardStats.invalidate();
      toast.success("¡Código de referido generado!");
    },
    onError: (e) => toast.error(e.message),
  });
  const utils = trpc.useUtils();

  const { data, isLoading, error, refetch } = trpc.referrals.getDashboardStats.useQuery(undefined, {
    refetchInterval: 30000, // refresh every 30s for "real-time"
  });

  const handleCopyCode = () => {
    if (!data || !("code" in data) || !data.code) return;
    const referralLink = `${window.location.origin}/registro?ref=${data.code.code}`;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      toast.success("¡Enlace copiado al portapapeles!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = () => {
    if (!data || !("code" in data) || !data.code) return;
    const referralLink = `${window.location.origin}/registro?ref=${data.code.code}`;
    if (navigator.share) {
      navigator.share({
        title: "Únete a BuddyMarket",
        text: `Usa mi código ${data.code.code} y obtén un ${data.code.discountPercent}% de descuento en tu suscripción`,
        url: referralLink,
      });
    } else {
      handleCopyCode();
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Cargando tu panel...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Acceso restringido</h2>
          <p className="text-muted-foreground mb-6">Necesitas iniciar sesión para ver tu panel de creador.</p>
          <Link href="/login">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white w-full">Iniciar sesión</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // No referral code yet
  if (!data || !("hasCode" in data) || !data.hasCode) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Award className="w-10 h-10 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Panel de Creador</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Genera tu código de referido único para empezar a ganar comisiones del <strong>20%</strong> por cada suscripción que traigas a BuddyMarket.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8 text-left space-y-3">
            <h3 className="font-semibold text-orange-800">¿Cómo funciona?</h3>
            <div className="space-y-2 text-sm text-orange-700">
              <div className="flex items-start gap-2"><span className="font-bold">1.</span><span>Genera tu código personalizado</span></div>
              <div className="flex items-start gap-2"><span className="font-bold">2.</span><span>Compártelo con tu audiencia — ellos obtienen un {15}% de descuento</span></div>
              <div className="flex items-start gap-2"><span className="font-bold">3.</span><span>Tú ganas el <strong>20% de cada suscripción activa</strong> que entre con tu código</span></div>
              <div className="flex items-start gap-2"><span className="font-bold">4.</span><span>Cobras mientras el usuario siga suscrito</span></div>
            </div>
          </div>
          <Button
            onClick={() => generateCode.mutate({ creatorType: "buddymaker", discountPercent: 15 })}
            disabled={generateCode.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg rounded-xl"
          >
            {generateCode.isPending ? "Generando..." : "Generar mi código de referido"}
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            ¿Eres nutricionista o experto en salud?{" "}
            <Link href="/app/buddy-experts" className="text-orange-500 underline">Regístrate como BuddyExpert</Link>
          </p>
        </div>
      </div>
    );
  }

  const { code, creatorProfile, stats, monthlyTrend, recentEarnings, recentReferrals } = data as any;
  const referralLink = `${window.location.origin}/registro?ref=${code?.code}`;
  const monthTrend = stats.lastMonthEarned > 0
    ? stats.monthEarned >= stats.lastMonthEarned
      ? "up" : "down"
    : "neutral";
  const monthTrendValue = stats.lastMonthEarned > 0
    ? `${Math.round(Math.abs(((stats.monthEarned - stats.lastMonthEarned) / stats.lastMonthEarned) * 100))}% vs mes anterior`
    : "Primer mes";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {creatorProfile?.avatarUrl ? (
                <img src={creatorProfile.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  {creatorProfile?.type === "expert" ? <ChefHat className="w-7 h-7" /> : <Star className="w-7 h-7" />}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{creatorProfile?.displayName ?? user.name}</h1>
                  {creatorProfile?.verified && (
                    <Badge className="bg-white/20 text-white border-0 text-xs">✓ Verificado</Badge>
                  )}
                </div>
                <p className="text-orange-100 text-sm">
                  {creatorProfile?.type === "expert" ? "BuddyExpert" : "BuddyMaker"} · Panel de Control
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="border-white/30 text-white hover:bg-white/10 bg-transparent"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Actualizar
              </Button>
              <Link href="/creators">
                <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10 bg-transparent">
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ver landing
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Ganancias totales"
            value={`${stats.totalEarned.toFixed(2)}€`}
            subtitle="Comisiones acumuladas"
            icon={Euro}
            color="green"
          />
          <StatCard
            title="Este mes"
            value={`${stats.monthEarned.toFixed(2)}€`}
            subtitle={`${new Date().toLocaleString("es-ES", { month: "long" })}`}
            icon={TrendingUp}
            trend={monthTrend}
            trendValue={monthTrendValue}
            color="orange"
          />
          <StatCard
            title="Referidos activos"
            value={stats.activeReferrals}
            subtitle={`${stats.totalReferrals} total`}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Tasa de conversión"
            value={`${stats.conversionRate}%`}
            subtitle={`${stats.usageCount} usos del código`}
            icon={Award}
            color="purple"
          />
        </div>

        {/* Referral Code Card */}
        <Card className="border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-700 mb-1">Tu código de referido</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-3xl font-black text-orange-600 tracking-wider font-mono">
                    {code?.code}
                  </span>
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200">
                    {code?.discountPercent}% descuento para tus referidos
                  </Badge>
                </div>
                <p className="text-xs text-orange-600 mt-2 truncate max-w-sm">
                  {referralLink}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Share2 className="w-4 h-4 mr-1" />
                  Compartir
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopyCode}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "¡Copiado!" : "Copiar enlace"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart + Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Evolución de ganancias</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyTrend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}€`, "Ganancias"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Bar dataKey="earned" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Referrals Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Nuevos referidos</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthlyTrend} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: number) => [value, "Referidos"]}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="referrals" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Referrals & Earnings Tables */}
        <Tabs defaultValue="referrals">
          <TabsList className="mb-4">
            <TabsTrigger value="referrals">
              <Users className="w-4 h-4 mr-1.5" />
              Referidos ({stats.totalReferrals})
            </TabsTrigger>
            <TabsTrigger value="earnings">
              <Euro className="w-4 h-4 mr-1.5" />
              Comisiones ({recentEarnings?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="referrals">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tus referidos</CardTitle>
                <CardDescription>
                  {stats.activeReferrals} activos · {stats.totalReferrals - stats.activeReferrals} cancelados
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentReferrals?.length > 0 ? (
                  <div>
                    {recentReferrals.map((ref: any, i: number) => (
                      <ReferralRow key={ref.id} referral={ref} index={i} />
                    ))}
                    {stats.totalReferrals > 20 && (
                      <p className="text-xs text-muted-foreground text-center pt-3">
                        Mostrando los 20 más recientes de {stats.totalReferrals} totales
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Aún no tienes referidos</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Comparte tu código <strong>{code?.code}</strong> para empezar a ganar
                    </p>
                    <Button
                      onClick={handleShare}
                      className="mt-4 bg-orange-500 hover:bg-orange-600 text-white"
                      size="sm"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Compartir mi código
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Historial de comisiones</CardTitle>
                <CardDescription>
                  Total acumulado: <strong className="text-green-600">{stats.totalEarned.toFixed(2)}€</strong>
                  {" · "}Este mes: <strong className="text-orange-600">{stats.monthEarned.toFixed(2)}€</strong>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentEarnings?.length > 0 ? (
                  <div>
                    {recentEarnings.map((earning: any) => (
                      <EarningRow key={earning.id} earning={earning} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Euro className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">Aún no hay comisiones</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Las comisiones aparecerán cuando tus referidos se suscriban
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-800 mb-1">¿Cuándo cobro mis comisiones?</p>
                <p className="text-sm text-blue-700">
                  Las comisiones se calculan automáticamente cada vez que un usuario referido renueva su suscripción.
                  El pago se realiza mensualmente a tu cuenta de Stripe Connect. El porcentaje es del <strong>20% neto</strong> después
                  de las comisiones de plataformas (App Store 30%, Google Play 30%, Stripe ~3%).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
