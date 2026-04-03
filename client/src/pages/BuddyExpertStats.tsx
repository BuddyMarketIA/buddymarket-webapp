import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import AppLayout from "@/components/AppLayout";
import {
  UsersIcon,
  BookOpenIcon,
  CurrencyEuroIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowTopRightOnSquareIcon,
  UserCircleIcon,
  StarIcon,
  ClockIcon,
  CalendarDaysIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

type Tab = "overview" | "followers" | "content" | "payments";

export default function BuddyExpertStats() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: stats, isLoading: statsLoading } = trpc.buddyExperts.getMyStats.useQuery(undefined, { enabled: !!user });
  const { data: followersData, isLoading: followersLoading } = trpc.buddyExperts.getMyFollowers.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !!user && activeTab === "followers" }
  );
  const { data: connectStatus, refetch: refetchConnect } = trpc.stripeConnect.getConnectStatus.useQuery(
    { creatorType: "buddyexpert" },
    { enabled: !!user }
  );
  const { data: myProfile } = trpc.buddyExperts.getMyProfile.useQuery(undefined, { enabled: !!user });
  const { data: myPlans } = trpc.buddyExperts.getMyPlans.useQuery(undefined, { enabled: !!user && activeTab === "content" });
  const { data: myMenus } = trpc.buddyExperts.getMyMenus.useQuery(undefined, { enabled: !!user && activeTab === "content" });

  const getOnboardingLink = trpc.stripeConnect.getOnboardingLink.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); toast.success("Redirigiendo a Stripe Connect..."); },
    onError: (err) => toast.error(err.message),
  });
  const getStripeDashboard = trpc.stripeConnect.getStripeDashboardLink.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading || statsLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!myProfile) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <StarIcon className="h-10 w-10 text-blue-600" />
            </div>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-gray-900">Panel de BuddyExpert</h1>
          <p className="mb-8 text-gray-500">Primero completa tu perfil de BuddyExpert para acceder a las estadísticas.</p>
          <a href="/app/buddy-expert-dashboard" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-blue-700 transition-colors">
            Ir a mi perfil de experto
          </a>
        </div>
      </AppLayout>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Resumen", icon: ChartBarIcon },
    { id: "followers", label: "Seguidores", icon: UsersIcon },
    { id: "content", label: "Contenido", icon: BookOpenIcon },
    { id: "payments", label: "Pagos", icon: CurrencyEuroIcon },
  ];

  const CATEGORY_LABELS: Record<string, string> = {
    perdida_peso: "Pérdida de peso", ganancia_muscular: "Ganancia muscular", definicion: "Definición",
    dieta_equilibrada: "Dieta equilibrada", rendimiento: "Rendimiento", bienestar: "Bienestar", vegano: "Vegano",
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          {myProfile?.avatarUrl ? (
            <img src={myProfile.avatarUrl} alt={myProfile.displayName} className="h-16 w-16 rounded-2xl object-cover shadow" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100">
              <UserCircleIcon className="h-9 w-9 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{myProfile?.displayName ?? user?.name ?? "Mi Panel"}</h1>
              {myProfile?.verified && <CheckCircleSolid className="h-5 w-5 text-blue-600" />}
            </div>
            <p className="text-sm text-gray-500">{myProfile?.specialty ?? (myProfile?.category ? CATEGORY_LABELS[myProfile.category] : "BuddyExpert")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                connectStatus?.onboardingCompleted ? "bg-green-100 text-green-700" : connectStatus?.connected ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
              }`}>
                {connectStatus?.onboardingCompleted ? "✓ Stripe activo" : connectStatus?.connected ? "⏳ Onboarding pendiente" : "Stripe no conectado"}
              </span>
              {myProfile?.rating && myProfile.rating > 0 && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                  ★ {myProfile.rating.toFixed(1)} ({myProfile.reviewsCount} reseñas)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}>
              <tab.icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard icon={UsersIcon} label="Seguidores" value={stats?.followersCount ?? 0} color="blue" />
              <StatCard icon={BookOpenIcon} label="Planes" value={stats?.plansCount ?? 0} color="purple" />
              <StatCard icon={CalendarDaysIcon} label="Menús" value={stats?.menusCount ?? 0} color="teal" />
              <StatCard icon={CurrencyEuroIcon} label="Ganado (€)" value={(stats?.totalPaid ?? 0).toFixed(2)} color="green" />
            </div>
            <StripeConnectCard connectStatus={connectStatus}
              onOnboard={() => getOnboardingLink.mutate({ creatorType: "buddyexpert" })}
              onDashboard={() => getStripeDashboard.mutate({ creatorType: "buddyexpert" })}
              onboardingLoading={getOnboardingLink.isPending} dashboardLoading={getStripeDashboard.isPending}
              onRefresh={() => refetchConnect()} accentColor="blue" />
            {(stats?.recentEarnings?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-800">Últimas comisiones</h3>
                <div className="space-y-2">
                  {stats!.recentEarnings.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{new Date(e.createdAt).toLocaleDateString("es-ES")}</p>
                        <p className="text-xs text-gray-400">Comisión: {(e.commissionRate * 100).toFixed(0)}%</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${e.status === "paid" ? "text-green-600" : e.status === "pending" ? "text-yellow-600" : "text-red-500"}`}>+{e.commissionAmount.toFixed(2)} €</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${e.status === "paid" ? "bg-green-100 text-green-700" : e.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                          {e.status === "paid" ? "Pagado" : e.status === "pending" ? "Pendiente" : "Fallido"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FOLLOWERS */}
        {activeTab === "followers" && (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h3 className="font-semibold text-gray-800">
                Seguidores <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">{followersData?.total ?? 0}</span>
              </h3>
            </div>
            {followersLoading ? (
              <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
            ) : (followersData?.followers?.length ?? 0) === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <UsersIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">Aún no tienes seguidores.</p>
                <p className="mt-1 text-xs">Publica planes y menús para ganar visibilidad.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {followersData!.followers.map((row, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-3">
                    {row.user?.avatarUrl ? (
                      <img src={row.user.avatarUrl} alt={row.user.name ?? ""} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        {(row.user?.name ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">{row.user?.name ?? "Usuario"}</p>
                      <p className="truncate text-xs text-gray-400">{row.user?.email}</p>
                    </div>
                    <p className="shrink-0 text-xs text-gray-400">{new Date(row.followedAt).toLocaleDateString("es-ES")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CONTENT */}
        {activeTab === "content" && (
          <div className="space-y-4">
            {/* Plans */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Planes nutricionales ({myPlans?.length ?? 0})</h3>
                <a href="/app/buddy-expert-dashboard" className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
                  Gestionar planes
                </a>
              </div>
              {(myPlans?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-8 text-center text-gray-400">
                  <BookOpenIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">Aún no has publicado planes.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myPlans!.slice(0, 6).map((plan) => (
                    <div key={plan.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        {plan.coverUrl ? (
                          <img src={plan.coverUrl} alt={plan.title} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <BookOpenIcon className="h-6 w-6 text-blue-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-800">{plan.title}</p>
                          <p className="text-xs text-gray-400">{plan.durationWeeks} semanas · {(plan.price ?? 0) > 0 ? `${plan.price} €` : "Gratis"}</p>
                          <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${plan.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {plan.isPublic ? "Público" : "Privado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Menus */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Menús semanales ({myMenus?.length ?? 0})</h3>
              </div>
              {(myMenus?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-8 text-center text-gray-400">
                  <CalendarDaysIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">Aún no has publicado menús.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myMenus!.slice(0, 4).map((menu) => (
                    <div key={menu.id} className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                      <p className="text-sm font-semibold text-gray-800">{menu.title}</p>
                      <p className="text-xs text-gray-400">{(menu as any).dailyCalories ? `${(menu as any).dailyCalories} kcal/día` : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <StripeConnectCard connectStatus={connectStatus}
              onOnboard={() => getOnboardingLink.mutate({ creatorType: "buddyexpert" })}
              onDashboard={() => getStripeDashboard.mutate({ creatorType: "buddyexpert" })}
              onboardingLoading={getOnboardingLink.isPending} dashboardLoading={getStripeDashboard.isPending}
              onRefresh={() => refetchConnect()} accentColor="blue" />
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h3 className="mb-3 font-semibold text-gray-800">Resumen de ganancias</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-green-50 p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{(stats?.totalPaid ?? 0).toFixed(2)} €</p>
                  <p className="text-xs text-green-500">Total cobrado</p>
                </div>
                <div className="rounded-xl bg-yellow-50 p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{(stats?.totalPending ?? 0).toFixed(2)} €</p>
                  <p className="text-xs text-yellow-500">Pendiente de cobro</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-400">
                BuddyMarket aplica una comisión del {((stats?.expert?.commissionRate ?? 0.2) * 100).toFixed(0)}% sobre cada venta. Los pagos se transfieren a tu cuenta de Stripe Connect.
              </p>
            </div>
            {(stats?.recentEarnings?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-800">Historial de comisiones</h3>
                <div className="space-y-2">
                  {stats!.recentEarnings.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{new Date(e.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}</p>
                        <p className="text-xs text-gray-400">Importe bruto: {e.amount.toFixed(2)} € · Comisión {(e.commissionRate * 100).toFixed(0)}%</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${e.status === "paid" ? "text-green-600" : e.status === "pending" ? "text-yellow-600" : "text-red-500"}`}>+{e.commissionAmount.toFixed(2)} €</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${e.status === "paid" ? "bg-green-100 text-green-700" : e.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                          {e.status === "paid" ? "Pagado" : e.status === "pending" ? "Pendiente" : "Fallido"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: "blue" | "purple" | "teal" | "green" | "orange" | "yellow" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600", purple: "bg-purple-50 text-purple-600", teal: "bg-teal-50 text-teal-600",
    green: "bg-green-50 text-green-600", orange: "bg-orange-50 text-[#FF6B35]", yellow: "bg-yellow-50 text-yellow-600",
  };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${colors[color]}`}><Icon className="h-5 w-5" /></div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function StripeConnectCard({ connectStatus, onOnboard, onDashboard, onboardingLoading, dashboardLoading, onRefresh, accentColor = "orange" }: {
  connectStatus: { connected: boolean; onboardingCompleted: boolean; stripeAccountId: string | null } | undefined;
  onOnboard: () => void; onDashboard: () => void;
  onboardingLoading: boolean; dashboardLoading: boolean; onRefresh: () => void;
  accentColor?: "orange" | "blue";
}) {
  const btnClass = accentColor === "blue"
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-[#FF6B35] hover:bg-orange-600";
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${connectStatus?.onboardingCompleted ? "border-green-200 bg-green-50" : connectStatus?.connected ? "border-yellow-200 bg-yellow-50" : accentColor === "blue" ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${connectStatus?.onboardingCompleted ? "bg-green-100" : accentColor === "blue" ? "bg-blue-100" : "bg-orange-100"}`}>
          {connectStatus?.onboardingCompleted ? <CheckCircleIcon className="h-6 w-6 text-green-600" /> : <ExclamationCircleIcon className={`h-6 w-6 ${accentColor === "blue" ? "text-blue-600" : "text-[#FF6B35]"}`} />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">
            {connectStatus?.onboardingCompleted ? "Stripe Connect activo" : connectStatus?.connected ? "Completa el onboarding de Stripe" : "Conecta tu cuenta de Stripe"}
          </h3>
          <p className="mt-0.5 text-sm text-gray-600">
            {connectStatus?.onboardingCompleted
              ? "Recibirás pagos automáticamente cuando los usuarios compren tus planes."
              : connectStatus?.connected
              ? "Has iniciado el proceso. Completa el formulario de Stripe para activar los pagos."
              : "Necesitas una cuenta de Stripe Connect para recibir pagos por tus planes y menús."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {connectStatus?.onboardingCompleted ? (
              <button onClick={onDashboard} disabled={dashboardLoading}
                className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60">
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                {dashboardLoading ? "Abriendo..." : "Ver panel de Stripe"}
              </button>
            ) : (
              <>
                <button onClick={onOnboard} disabled={onboardingLoading}
                  className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${btnClass}`}>
                  <LinkIcon className="h-4 w-4" />
                  {onboardingLoading ? "Cargando..." : connectStatus?.connected ? "Continuar onboarding" : "Conectar Stripe"}
                </button>
                {connectStatus?.connected && (
                  <button onClick={onRefresh} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                    Verificar estado
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
