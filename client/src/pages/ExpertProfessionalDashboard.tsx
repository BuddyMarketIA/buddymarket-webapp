import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, MessageSquare, Calendar, FileText,
  AlertTriangle, Clock, Video, MapPin, ChevronRight,
  Plus, Activity, BookOpen, Upload, Utensils,
  ArrowUpRight, Mail, Zap, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: Date | string | null | undefined) {
  if (!date) return "--:--";
  return new Date(date).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "";
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === tomorrow.toDateString()) return "Mañana";
  return d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
}

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "blue",
  alert = false,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: "blue" | "green" | "orange" | "purple" | "red";
  alert?: boolean;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    orange: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400",
    red: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
  };
  return (
    <Card className={cn("relative overflow-hidden", alert && "ring-2 ring-orange-400")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={cn("p-3 rounded-xl", colors[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {alert && (
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
        )}
      </CardContent>
    </Card>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export default function ExpertProfessionalDashboard() {
  const { user } = useAuth();
  const [apptTab, setApptTab] = useState<"today" | "week">("today");

  const { data, isLoading } = trpc.expertDashboard.getMetrics.useQuery(undefined, {
    refetchInterval: 60_000,
  });
  const { data: bizMetrics } = trpc.expertBilling.getBusinessMetrics.useQuery();

  const stats = data?.stats;
  const todayAppts = data?.todayAppointments ?? [];
  const upcomingAppts = data?.upcomingAppointments ?? [];
  const recentPatients = data?.recentPatients ?? [];
  const alerts = data?.alerts;

  const displayedAppts = apptTab === "today" ? todayAppts : upcomingAppts;

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Buenos días" :
    now.getHours() < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {user?.name?.split(" ")[0] ?? "Doctor"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {now.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/expert/appointments">
              <Calendar className="w-4 h-4 mr-2" />
              Nueva cita
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/app/expert/patients">
              <Plus className="w-4 h-4 mr-2" />
              Añadir paciente
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Pacientes activos"
            value={stats?.activePatients ?? 0}
            sub={`${stats?.newPatientsMonth ?? 0} nuevos este mes`}
            color="blue"
          />
          <StatCard
            icon={Calendar}
            label="Citas hoy"
            value={stats?.todayAppointmentsCount ?? 0}
            sub={`${upcomingAppts.length} próximos 7 días`}
            color="purple"
          />
          <StatCard
            icon={MessageSquare}
            label="Mensajes sin leer"
            value={stats?.unreadMessages ?? 0}
            sub="De tus pacientes"
            color="green"
            alert={(stats?.unreadMessages ?? 0) > 0}
          />
          <StatCard
            icon={FileText}
            label="Plantillas de menú"
            value={stats?.menuTemplatesCount ?? 0}
            sub="Disponibles para asignar"
            color="orange"
          />
        </div>
      )}

      {/* ── Alertas ── */}
      {!isLoading && alerts?.hasAlerts && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <AlertTriangle className="w-4 h-4" />
              Alertas que requieren atención
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {(stats?.unreadMessages ?? 0) > 0 && (
              <Link href="/app/expert/chat">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 cursor-pointer transition-colors">
                  <MessageSquare className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="text-sm font-medium">{stats!.unreadMessages} mensajes sin leer de pacientes</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-orange-500 shrink-0" />
                </div>
              </Link>
            )}
            {(stats?.pendingInvites ?? 0) > 0 && (
              <Link href="/app/expert/patients">
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 cursor-pointer transition-colors">
                  <Mail className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="text-sm font-medium">{stats!.pendingInvites} invitaciones pendientes de aceptar</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-orange-500 shrink-0" />
                </div>
              </Link>
            )}
            {alerts.patientsWithoutCheckin?.slice(0, 3).map((p) => (
              <Link key={p.patientUserId} href={`/app/expert/patients`}>
                <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 cursor-pointer transition-colors">
                  <Avatar className="w-7 h-7 shrink-0">
                    <AvatarImage src={p.patientImage ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(p.patientName)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{p.patientName ?? "Paciente"} — sin actividad en 7+ días</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-orange-500 shrink-0" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Agenda + acciones rápidas */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  Agenda
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={apptTab === "today" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setApptTab("today")}
                  >
                    Hoy ({todayAppts.length})
                  </Button>
                  <Button
                    variant={apptTab === "week" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setApptTab("week")}
                  >
                    7 días ({upcomingAppts.length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : displayedAppts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">
                    {apptTab === "today" ? "No tienes citas hoy" : "Sin citas en los próximos 7 días"}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" asChild>
                    <Link href="/app/expert/appointments">Crear cita</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedAppts.map((appt) => {
                    const isPast = new Date(appt.startTime) < new Date();
                    const isNow = !isPast && new Date(appt.startTime) < new Date(Date.now() + 30 * 60000);
                    return (
                      <div
                        key={appt.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-muted/50",
                          isNow && "border-purple-300 bg-purple-50/50 dark:bg-purple-950/20",
                          isPast && "opacity-60"
                        )}
                      >
                        <div className="text-center min-w-[52px]">
                          <p className="text-xs text-muted-foreground">{formatDate(appt.startTime)}</p>
                          <p className="text-sm font-bold">{formatTime(appt.startTime)}</p>
                        </div>
                        <div className="w-px h-10 bg-border" />
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarImage src={appt.patientImage ?? undefined} />
                          <AvatarFallback className="text-xs">{getInitials(appt.patientName)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{appt.patientName ?? "Paciente"}</p>
                          <p className="text-xs text-muted-foreground truncate">{appt.title}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {appt.modality === "online" ? (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Video className="w-3 h-3" /> Online
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs gap-1">
                              <MapPin className="w-3 h-3" /> Presencial
                            </Badge>
                          )}
                          {isNow && appt.meetingUrl && (
                            <Button size="sm" className="h-7 text-xs bg-purple-600 hover:bg-purple-700" asChild>
                              <a href={appt.meetingUrl} target="_blank" rel="noopener noreferrer">
                                <Video className="w-3 h-3 mr-1" /> Unirse
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 pt-3 border-t">
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/app/expert/appointments">
                    Ver agenda completa <ChevronRight className="w-3 h-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Upload, label: "Subir PDF", sub: "Convertir a menú", href: "/app/expert/menu-templates?tab=pdf", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
              { icon: Utensils, label: "Mis plantillas", sub: "Gestionar menús", href: "/app/expert/menu-templates", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950" },
              { icon: Activity, label: "Estadísticas", sub: "Ver métricas", href: "/app/buddy-expert-stats", color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950" },
              { icon: Zap, label: "BuddyIA Pro", sub: "Generar plan IA", href: "/app/buddy-ia", color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950" },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0">
                  <CardContent className="p-4 text-center">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2", action.bg, action.color)}>
                      <action.icon className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.sub}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Pacientes recientes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Pacientes activos
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link href="/app/expert/patients">Ver todos</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin pacientes activos</p>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/app/expert/patients">Invitar paciente</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentPatients.map((p) => (
                  <Link key={p.id} href="/app/expert/patients">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarImage src={p.patientImage ?? undefined} />
                        <AvatarFallback className="text-xs">{getInitials(p.patientName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{p.patientName ?? p.patientEmail ?? "Paciente"}</p>
                        {p.mainGoal && (
                          <p className="text-xs text-muted-foreground truncate">
                            <Target className="w-3 h-3 inline mr-1" />
                            {p.mainGoal}
                          </p>
                        )}
                        {p.weight && p.targetWeight && (
                          <p className="text-xs text-muted-foreground">{p.weight}kg → {p.targetWeight}kg</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Acceso rápido a secciones ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/app/expert/menu-templates">
          <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 border-dashed">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Biblioteca de menús</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.menuTemplatesCount ?? 0} plantillas · Asignar a pacientes
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/expert/patients">
          <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 border-dashed">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Gestión de pacientes</p>
                <p className="text-xs text-muted-foreground">
                  {stats?.activePatients ?? 0} activos · {stats?.pendingInvites ?? 0} invitaciones
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/app/expert/chat">
          <Card className="hover:shadow-md transition-all cursor-pointer hover:-translate-y-0.5 border-dashed">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Chat con pacientes</p>
                <p className="text-xs text-muted-foreground">
                  {(stats?.unreadMessages ?? 0) > 0
                    ? `${stats!.unreadMessages} mensajes sin leer`
                    : "Sin mensajes nuevos"}
                </p>
              </div>
              {(stats?.unreadMessages ?? 0) > 0 ? (
                <Badge className="bg-purple-600 shrink-0">{stats!.unreadMessages}</Badge>
              ) : (
                <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* ── Métricas de negocio ── */}
      {bizMetrics && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              Métricas de negocio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Ingresos totales</p>
                <p className="text-2xl font-bold text-emerald-600">{bizMetrics.totalRevenue.toFixed(0)}€</p>
                <p className="text-xs text-muted-foreground mt-1">{bizMetrics.paidInvoicesCount} facturas cobradas</p>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Pendiente de cobro</p>
                <p className="text-2xl font-bold text-orange-600">{bizMetrics.pendingAmount.toFixed(0)}€</p>
                <p className="text-xs text-muted-foreground mt-1">{bizMetrics.pendingCount} facturas enviadas</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Retención de pacientes</p>
                <p className="text-2xl font-bold text-blue-600">{bizMetrics.retentionRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">{bizMetrics.activePatientsCount} activos de {bizMetrics.totalPatientsCount}</p>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-xl text-center">
                <p className="text-xs text-muted-foreground mb-1">Valoración media</p>
                <p className="text-2xl font-bold text-purple-600">
                  {bizMetrics.avgRating ? `★ ${bizMetrics.avgRating}` : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{bizMetrics.totalAppointments} citas totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
