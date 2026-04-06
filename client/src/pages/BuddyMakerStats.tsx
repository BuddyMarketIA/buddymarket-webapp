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
  PencilSquareIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

type Tab = "overview" | "followers" | "recipes" | "payments";

export default function BuddyMakerStats() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const { data: stats, isLoading: statsLoading } = trpc.buddyMakers.getMyStats.useQuery(undefined, { enabled: !!user });
  const { data: followersData, isLoading: followersLoading } = trpc.buddyMakers.getMyFollowers.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !!user && activeTab === "followers" }
  );
  const { data: myRecipes, isLoading: recipesLoading } = trpc.buddyMakers.getMyRecipes.useQuery(undefined, {
    enabled: !!user && activeTab === "recipes",
  });
  const { data: connectStatus, refetch: refetchConnect } = trpc.stripeConnect.getConnectStatus.useQuery(
    { creatorType: "buddymaker" },
    { enabled: !!user }
  );
  const { data: myProfile } = trpc.buddyMakers.getMyProfile.useQuery(undefined, { enabled: !!user });

  const getOnboardingLink = trpc.stripeConnect.getOnboardingLink.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); toast.success("Redirigiendo a Stripe Connect..."); },
    onError: (err) => toast.error(err.message),
  });
  const getStripeDashboard = trpc.stripeConnect.getStripeDashboardLink.useMutation({
    onSuccess: (data) => { window.open(data.url, "_blank"); },
    onError: (err) => toast.error(err.message),
  });
  const deleteRecipe = trpc.buddyMakers.deleteRecipe.useMutation({
    onSuccess: () => toast.success("Receta eliminada"),
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
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
              <StarIcon className="h-10 w-10 text-[#FF6B35]" />
            </div>
          </div>
          <h1 className="mb-3 text-2xl font-bold text-gray-900">Panel de BuddyMaker</h1>
          <p className="mb-8 text-gray-500">Primero completa tu perfil de BuddyMaker para acceder a las estadísticas.</p>
          <a href="/app/buddy-maker-dashboard" className="inline-flex items-center gap-2 rounded-2xl bg-[#FF6B35] px-6 py-3 font-semibold text-white shadow-md hover:bg-orange-600 transition-colors">
            Ir a mi perfil de creador
          </a>
        </div>
      </AppLayout>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Resumen", icon: ChartBarIcon },
    { id: "followers", label: "Seguidores", icon: UsersIcon },
    { id: "recipes", label: "Recetas", icon: BookOpenIcon },
    { id: "payments", label: "Pagos", icon: CurrencyEuroIcon },
  ];

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          {myProfile?.avatarUrl ? (
            <img src={myProfile.avatarUrl} alt={myProfile.displayName} className="h-16 w-16 rounded-2xl object-cover shadow" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100">
              <UserCircleIcon className="h-9 w-9 text-[#FF6B35]" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{myProfile?.displayName ?? user?.name ?? "Mi Panel"}</h1>
              {myProfile?.verified && <CheckCircleSolid className="h-5 w-5 text-[#FF6B35]" />}
            </div>
            <p className="text-sm text-gray-500">{myProfile?.specialty ?? "BuddyMaker"}</p>
            <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              connectStatus?.onboardingCompleted ? "bg-green-100 text-green-700" : connectStatus?.connected ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
            }`}>
              {connectStatus?.onboardingCompleted ? "✓ Stripe activo" : connectStatus?.connected ? "⏳ Onboarding pendiente" : "Stripe no conectado"}
            </span>
          </div>
        </div>

        {/* Referral CTA */}
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-violet-800">Programa de Referidos</p>
            <p className="text-xs text-violet-600">Gana el 20% de cada suscripción de tus referidos</p>
          </div>
          <a href="/app/referrals" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors whitespace-nowrap">
            Ver mi código
          </a>
        </div>
        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-white text-[#FF6B35] shadow-sm" : "text-gray-500 hover:text-gray-700"
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
              <StatCard icon={UsersIcon} label="Seguidores" value={stats?.followersCount ?? 0} color="orange" />
              <StatCard icon={BookOpenIcon} label="Recetas" value={stats?.recipesCount ?? 0} color="blue" />
              <StatCard icon={CurrencyEuroIcon} label="Ganado (€)" value={(stats?.totalPaid ?? 0).toFixed(2)} color="green" />
              <StatCard icon={ClockIcon} label="Pendiente (€)" value={(stats?.totalPending ?? 0).toFixed(2)} color="yellow" />
            </div>
            <StripeConnectCard connectStatus={connectStatus} creatorType="buddymaker"
              onOnboard={() => getOnboardingLink.mutate({ creatorType: "buddymaker" })}
              onDashboard={() => getStripeDashboard.mutate({ creatorType: "buddymaker" })}
              onboardingLoading={getOnboardingLink.isPending} dashboardLoading={getStripeDashboard.isPending}
              onRefresh={() => refetchConnect()} />
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
                        <p className={`text-sm font-bold ${e.status === ("paid" as any) ? "text-green-600" : e.status === "pending" ? "text-yellow-600" : "text-red-500"}`}>+{e.commissionAmount.toFixed(2)} €</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${e.status === ("paid" as any) ? "bg-green-100 text-green-700" : e.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                          {e.status === ("paid" as any) ? "Pagado" : e.status === "pending" ? "Pendiente" : "Fallido"}
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
                Seguidores <span className="ml-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-[#FF6B35]">{followersData?.total ?? 0}</span>
              </h3>
            </div>
            {followersLoading ? (
              <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" /></div>
            ) : (followersData?.followers?.length ?? 0) === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <UsersIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">Aún no tienes seguidores.</p>
                <p className="mt-1 text-xs">Publica más recetas para ganar visibilidad.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {followersData!.followers.map((row, i) => (
                  <li key={i} className="flex items-center gap-3 px-4 py-3">
                    {row.user?.avatarUrl ? (
                      <img src={row.user.avatarUrl} alt={row.user.name ?? ""} className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-[#FF6B35]">
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

        {/* RECIPES */}
        {activeTab === "recipes" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Mis recetas ({myRecipes?.length ?? 0})</h3>
              <a href="/app/buddy-maker-dashboard" className="flex items-center gap-1.5 rounded-xl bg-[#FF6B35] px-3 py-1.5 text-sm font-semibold text-white hover:bg-orange-600">
                <PencilSquareIcon className="h-4 w-4" /> Gestionar recetas
              </a>
            </div>
            {recipesLoading ? (
              <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[#FF6B35] border-t-transparent" /></div>
            ) : (myRecipes?.length ?? 0) === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400">
                <BookOpenIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
                <p className="text-sm">Aún no has publicado recetas.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {myRecipes!.map((recipe) => (
                  <div key={recipe.id} className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    {recipe.imageUrl ? (
                      <img src={recipe.imageUrl} alt={recipe.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                        <BookOpenIcon className="h-7 w-7 text-[#FF6B35]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">{recipe.name}</p>
                      <p className="text-xs text-gray-400">{recipe.caloriesPerServing ? `${recipe.caloriesPerServing} kcal` : ""}</p>
                      <div className="mt-1.5 flex gap-1.5">
                        <a href={`/app/recipes/${recipe.id}`} className="rounded-lg bg-orange-50 px-2 py-0.5 text-xs font-medium text-[#FF6B35] hover:bg-orange-100">Ver</a>
                        <button onClick={() => { if (confirm("¿Eliminar receta?")) deleteRecipe.mutate({ recipeId: recipe.id }); }}
                          className="rounded-lg bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500 hover:bg-red-100">Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PAYMENTS */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <StripeConnectCard connectStatus={connectStatus} creatorType="buddymaker"
              onOnboard={() => getOnboardingLink.mutate({ creatorType: "buddymaker" })}
              onDashboard={() => getStripeDashboard.mutate({ creatorType: "buddymaker" })}
              onboardingLoading={getOnboardingLink.isPending} dashboardLoading={getStripeDashboard.isPending}
              onRefresh={() => refetchConnect()} />
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
                BuddyMarket aplica una comisión del {((stats?.maker?.commissionRate ?? 0.2) * 100).toFixed(0)}% sobre cada venta. Los pagos se transfieren a tu cuenta de Stripe Connect.
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
                        <p className={`text-sm font-bold ${e.status === ("paid" as any) ? "text-green-600" : e.status === "pending" ? "text-yellow-600" : "text-red-500"}`}>+{e.commissionAmount.toFixed(2)} €</p>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${e.status === ("paid" as any) ? "bg-green-100 text-green-700" : e.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                          {e.status === ("paid" as any) ? "Pagado" : e.status === "pending" ? "Pendiente" : "Fallido"}
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

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: "orange" | "blue" | "green" | "yellow" }) {
  const colors = { orange: "bg-orange-50 text-[#FF6B35]", blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", yellow: "bg-yellow-50 text-yellow-600" };
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${colors[color]}`}><Icon className="h-5 w-5" /></div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

function StripeConnectCard({ connectStatus, creatorType, onOnboard, onDashboard, onboardingLoading, dashboardLoading, onRefresh }: {
  connectStatus: { connected: boolean; onboardingCompleted: boolean; stripeAccountId: string | null } | undefined;
  creatorType: "buddyexpert" | "buddymaker";
  onOnboard: () => void; onDashboard: () => void;
  onboardingLoading: boolean; dashboardLoading: boolean; onRefresh: () => void;
}) {
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${connectStatus?.onboardingCompleted ? "border-green-200 bg-green-50" : connectStatus?.connected ? "border-yellow-200 bg-yellow-50" : "border-orange-200 bg-orange-50"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${connectStatus?.onboardingCompleted ? "bg-green-100" : "bg-orange-100"}`}>
          {connectStatus?.onboardingCompleted ? <CheckCircleIcon className="h-6 w-6 text-green-600" /> : <ExclamationCircleIcon className="h-6 w-6 text-[#FF6B35]" />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">
            {connectStatus?.onboardingCompleted ? "Stripe Connect activo" : connectStatus?.connected ? "Completa el onboarding de Stripe" : "Conecta tu cuenta de Stripe"}
          </h3>
          <p className="mt-0.5 text-sm text-gray-600">
            {connectStatus?.onboardingCompleted
              ? "Recibirás pagos automáticamente cuando los usuarios compren tu contenido."
              : connectStatus?.connected
              ? "Has iniciado el proceso. Completa el formulario de Stripe para activar los pagos."
              : "Necesitas una cuenta de Stripe Connect para recibir pagos por tu contenido."}
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
                  className="flex items-center gap-1.5 rounded-xl bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">
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
