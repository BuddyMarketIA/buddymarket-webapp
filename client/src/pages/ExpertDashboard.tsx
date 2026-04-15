import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ExpertDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();

  const { data, isLoading } = trpc.expertPatients.getExpertDashboardStats.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 60000,
  });

  const { data: gcalStatus, refetch: refetchGcal } = trpc.expertPatients.getGoogleCalendarStatus.useQuery(undefined, {
    enabled: !!user && (user.role === "buddyexpert" || user.role === "admin"),
    staleTime: 30000,
  });

  const { data: gcalAuthData } = trpc.expertPatients.getGoogleCalendarAuthUrl.useQuery(
    { origin: typeof window !== "undefined" ? window.location.origin : "" },
    {
      enabled: !!user && (user.role === "buddyexpert" || user.role === "admin") && gcalStatus?.connected === false,
      staleTime: 60000,
    }
  );

  const disconnectGcal = trpc.expertPatients.disconnectGoogleCalendar.useMutation({
    onSuccess: () => {
      refetchGcal();
      toast.success("Google Calendar desconectado");
    },
  });

  // Handle OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("gcal_connected") === "1") {
      toast.success("✅ Google Calendar conectado correctamente");
      refetchGcal();
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("gcal_error")) {
      toast.error(`Error al conectar Google Calendar: ${params.get("gcal_error")}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [search]);

  if (!user) return null;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 20) return "Buenas tardes";
    return "Buenas noches";
  };

  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const KPI_CARDS = [
    {
      label: "Pacientes activos",
      value: data?.stats.activePatients ?? "—",
      total: data?.stats.totalPatients,
      icon: "👥",
      color: "from-orange-400 to-orange-600",
      action: () => navigate("/app/expert/patients"),
    },
    {
      label: "Mensajes sin leer",
      value: data?.stats.unreadMessages ?? "—",
      icon: "💬",
      color: data?.stats.unreadMessages && data.stats.unreadMessages > 0
        ? "from-red-400 to-red-600"
        : "from-gray-400 to-gray-600",
      action: () => navigate("/app/expert/chat"),
    },
    {
      label: "Citas hoy",
      value: data?.stats.todayAppointments ?? "—",
      sub: `${data?.stats.upcomingAppointmentsWeek ?? 0} esta semana`,
      icon: "📅",
      color: "from-blue-400 to-blue-600",
      action: () => navigate("/app/expert/patients"),
    },
    {
      label: "Menús asignados",
      value: data?.stats.menusAssignedThisMonth ?? "—",
      sub: "este mes",
      icon: "🥗",
      color: "from-green-400 to-green-600",
      action: () => navigate("/app/expert/patients"),
    },
  ];

  const QUICK_ACTIONS = [
    { label: "Mis pacientes", icon: "👥", path: "/app/expert/patients", desc: "Ver y gestionar todos tus pacientes" },
    { label: "Mensajes", icon: "💬", path: "/app/expert/chat", desc: "Conversaciones con pacientes" },
    { label: "Mis planes", icon: "📋", path: "/app/buddy-expert-dashboard", desc: "Planes y menús publicados" },
    { label: "Estadísticas", icon: "📊", path: "/app/buddy-expert-stats", desc: "Rendimiento y análisis" },
    { label: "Mi perfil experto", icon: "🏅", path: "/app/buddy-expert-dashboard", desc: "Editar perfil profesional" },
    { label: "Invitar paciente", icon: "➕", path: "/app/expert/patients", desc: "Añadir nuevo paciente" },
  ];

  const handleConnectGoogleCalendar = () => {
    if (gcalAuthData?.url) {
      window.location.href = gcalAuthData.url;
    } else {
      toast.error("No se pudo obtener la URL de autorización. Inténtalo de nuevo.");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {greeting()}, {user.name?.split(" ")[0] ?? "Experto"} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5 capitalize">{today}</p>
          </div>
          {user.imageUrl ? (
            <img src={user.imageUrl} alt={user.name ?? ""} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-lg flex-shrink-0">
              {(user.name ?? "E").charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Google Calendar Banner */}
        {gcalStatus !== undefined && (
          <div className={`rounded-2xl border p-4 flex items-center gap-3 ${gcalStatus.connected ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl ${gcalStatus.connected ? "bg-green-100" : "bg-blue-100"}`}>
              📆
            </div>
            <div className="flex-1 min-w-0">
              {gcalStatus.connected ? (
                <>
                  <p className="text-sm font-semibold text-green-800">Google Calendar conectado</p>
                  <p className="text-xs text-green-600 truncate">{gcalStatus.email ?? "Sincronización activa"} · Las citas se crean automáticamente en tu calendario</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-blue-800">Conecta Google Calendar</p>
                  <p className="text-xs text-blue-600">Sincroniza tus citas y evita conflictos de horario automáticamente</p>
                </>
              )}
            </div>
            {gcalStatus.connected ? (
              <button
                onClick={() => disconnectGcal.mutate()}
                disabled={disconnectGcal.isPending}
                className="text-xs text-red-500 hover:text-red-700 font-medium flex-shrink-0 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
              >
                {disconnectGcal.isPending ? "..." : "Desconectar"}
              </button>
            ) : (
              <button
                onClick={handleConnectGoogleCalendar}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Conectar
              </button>
            )}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {KPI_CARDS.map((kpi, i) => (
            <button
              key={i}
              onClick={kpi.action}
              className={`bg-gradient-to-br ${kpi.color} text-white rounded-2xl p-4 text-left hover:opacity-90 active:scale-95 transition-all shadow-sm`}
            >
              <div className="text-2xl mb-2">{kpi.icon}</div>
              <div className="text-3xl font-bold leading-none">
                {isLoading ? (
                  <div className="w-8 h-7 bg-white/30 rounded animate-pulse" />
                ) : (
                  kpi.value
                )}
              </div>
              <div className="text-xs mt-1 text-white/80">{kpi.label}</div>
              {kpi.total !== undefined && (
                <div className="text-xs text-white/60 mt-0.5">de {kpi.total} totales</div>
              )}
              {kpi.sub && <div className="text-xs text-white/60 mt-0.5">{kpi.sub}</div>}
            </button>
          ))}
        </div>

        {/* Contenido principal: 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Columna izquierda: Próximas citas + Progreso reciente */}
          <div className="lg:col-span-2 space-y-4">

            {/* Próximas citas */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">📅 Próximas citas</h2>
                <div className="flex items-center gap-2">
                  {gcalStatus?.connected && (
                    <span className="flex items-center gap-1 text-[10px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      Sincronizado con Google
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{data?.stats.upcomingAppointmentsWeek ?? 0} esta semana</span>
                </div>
              </div>
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !data?.upcomingAppointments?.length ? (
                <div className="p-8 text-center">
                  <div className="text-3xl mb-2">📅</div>
                  <p className="text-sm text-gray-500">No hay citas programadas esta semana</p>
                  <Button
                    size="sm"
                    onClick={() => navigate("/app/expert/patients")}
                    className="mt-3 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Ir a pacientes
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.upcomingAppointments.map((item, i) => {
                    const start = new Date(item.appt.startTime);
                    const isToday = start.toDateString() === new Date().toDateString();
                    const isOnline = item.appt.modality === "online";
                    const meetUrl = (item.appt as any).googleMeetUrl || item.appt.meetingUrl;
                    const isUpcoming = start.getTime() - Date.now() < 30 * 60 * 1000 && start.getTime() > Date.now();

                    return (
                      <div key={i} className={`flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors ${isToday ? "bg-orange-50/40" : ""}`}>
                        <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${isToday ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-600"}`}>
                          <span className="text-xs font-bold leading-none">{start.getDate()}</span>
                          <span className="text-[10px] leading-none opacity-80">
                            {start.toLocaleDateString("es-ES", { month: "short" })}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.appt.title}</p>
                          <p className="text-xs text-gray-500">
                            {item.patientUser?.name ?? "Paciente"} · {start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                            {isToday && <span className="ml-1 text-orange-500 font-medium">· Hoy</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isOnline ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                            {isOnline ? "Online" : "Presencial"}
                          </span>
                          {isOnline && meetUrl && (
                            <a
                              href={meetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${isUpcoming ? "bg-green-500 text-white hover:bg-green-600 shadow-sm animate-pulse" : "bg-blue-500 text-white hover:bg-blue-600"}`}
                              title="Unirse a la videollamada"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polygon points="23 7 16 12 23 17 23 7"/>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                              </svg>
                              Unirse
                            </a>
                          )}
                          {isOnline && !meetUrl && (
                            <span className="text-[10px] text-gray-400 italic">Sin enlace</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Progreso reciente de pacientes */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">📈 Progreso reciente</h2>
                <span className="text-xs text-gray-400">últimos 30 días</span>
              </div>
              {isLoading ? (
                <div className="p-5 space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !data?.recentProgress?.length ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-400">Sin registros de progreso recientes</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.recentProgress.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                        {(item.patientUser?.name ?? "P").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{item.patientUser?.name ?? "Paciente"}</p>
                        <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                          {item.progress.weight && <span>⚖️ {item.progress.weight} kg</span>}
                          {item.progress.bodyFat && <span>💧 {item.progress.bodyFat}% grasa</span>}
                          {item.progress.muscleMass && <span>💪 {item.progress.muscleMass} kg músculo</span>}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(item.progress.recordedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: Pacientes recientes + Accesos rápidos */}
          <div className="space-y-4">

            {/* Pacientes recientes */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">👥 Pacientes</h2>
                <button
                  onClick={() => navigate("/app/expert/patients")}
                  className="text-xs text-orange-500 hover:text-orange-600 font-medium"
                >
                  Ver todos →
                </button>
              </div>
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !data?.recentPatients?.length ? (
                <div className="p-6 text-center">
                  <div className="text-2xl mb-1">👥</div>
                  <p className="text-sm text-gray-400">Sin pacientes aún</p>
                  <Button
                    size="sm"
                    onClick={() => navigate("/app/expert/patients")}
                    className="mt-2 bg-orange-500 hover:bg-orange-600 text-white text-xs"
                  >
                    Añadir paciente
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {data.recentPatients.map((item, i) => {
                    const statusColor = {
                      active: "bg-green-100 text-green-700",
                      invited: "bg-yellow-100 text-yellow-700",
                      paused: "bg-gray-100 text-gray-600",
                      discharged: "bg-red-100 text-red-600",
                    }[item.rel.status] ?? "bg-gray-100 text-gray-600";

                    return (
                      <button
                        key={i}
                        onClick={() => navigate(`/app/expert/patients/${item.rel.id}`)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        {item.patientUser?.imageUrl ? (
                          <img src={item.patientUser.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs flex-shrink-0">
                            {(item.patientUser?.name ?? "P").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{item.patientUser?.name ?? "Paciente"}</p>
                          <p className="text-xs text-gray-400 truncate">{item.profile?.mainGoal ?? item.patientUser?.email ?? ""}</p>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${statusColor}`}>
                          {item.rel.status === "active" ? "Activo" :
                           item.rel.status === "invited" ? "Invitado" :
                           item.rel.status === "paused" ? "Pausado" : "Alta"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">⚡ Accesos rápidos</h2>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors text-center"
                  >
                    <span className="text-xl">{action.icon}</span>
                    <span className="text-xs font-medium text-gray-700 leading-tight">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Estado del perfil */}
            {data?.expertProfile && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border border-orange-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white text-lg">
                    🏅
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Perfil profesional</p>
                    <p className="text-xs text-gray-500">{data.expertProfile.specialty ?? "Nutricionista"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-lg font-bold text-orange-600">{data.stats.totalPatients}</p>
                    <p className="text-[10px] text-gray-500">Pacientes totales</p>
                  </div>
                  <div className="bg-white rounded-lg p-2">
                    <p className="text-lg font-bold text-orange-600">{data.stats.menusAssignedThisMonth}</p>
                    <p className="text-[10px] text-gray-500">Menús este mes</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate("/app/buddy-expert-dashboard")}
                  className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white text-xs"
                >
                  Gestionar perfil y planes
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
