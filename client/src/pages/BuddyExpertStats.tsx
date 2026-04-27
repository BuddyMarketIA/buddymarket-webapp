import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
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
  BanknotesIcon,
  ArrowPathIcon,
  ReceiptRefundIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

type Tab = "overview" | "followers" | "content" | "payments";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtAmount(cents: number, currency = "eur") {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}
function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    succeeded: { label: "Cobrado", cls: "bg-green-100 text-green-700" },
    paid:      { label: "Pagado",  cls: "bg-green-100 text-green-700" },
    pending:   { label: "Pendiente", cls: "bg-yellow-100 text-yellow-700" },
    in_transit:{ label: "En tránsito", cls: "bg-blue-100 text-blue-700" },
    failed:    { label: "Fallido", cls: "bg-red-100 text-red-600" },
    canceled:  { label: "Cancelado", cls: "bg-muted/50 text-muted-foreground" },
    refunded:  { label: "Reembolsado", cls: "bg-orange-100 text-orange-600" },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted/50 text-muted-foreground" };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>{s.label}</span>;
}

// ─── Balance card ─────────────────────────────────────────────────────────────
function BalanceCard({ available, pending }: { available: { amount: number; currency: string }[]; pending: { amount: number; currency: string }[] }) {
  const avail = available.reduce((s, b) => s + b.amount, 0);
  const pend  = pending.reduce((s, b) => s + b.amount, 0);
  const currency = available[0]?.currency ?? pending[0]?.currency ?? "eur";
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-md">
        <div className="mb-1 flex items-center gap-1.5 text-green-100">
          <BanknotesIcon className="h-4 w-4" />
          <span className="text-xs font-medium">Disponible</span>
        </div>
        <p className="text-2xl font-bold">{fmtAmount(avail, currency)}</p>
        <p className="mt-0.5 text-xs text-green-100">Listo para transferir</p>
      </div>
      <div className="rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 p-4 text-white shadow-md">
        <div className="mb-1 flex items-center gap-1.5 text-yellow-100">
          <ClockIcon className="h-4 w-4" />
          <span className="text-xs font-medium">Pendiente</span>
        </div>
        <p className="text-2xl font-bold">{fmtAmount(pend, currency)}</p>
        <p className="mt-0.5 text-xs text-yellow-100">En proceso</p>
      </div>
    </div>
  );
}

// ─── Charge row ───────────────────────────────────────────────────────────────
function ChargeRow({ charge }: { charge: { id: string; amount: number; currency: string; status: string; description: string | null; created: number; receiptUrl: string | null; refunded: boolean; customerEmail: string | null } }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${charge.refunded ? "bg-orange-100" : charge.status === "succeeded" ? "bg-green-100" : "bg-muted/50"}`}>
        {charge.refunded ? (
          <ReceiptRefundIcon className="h-5 w-5 text-orange-500" />
        ) : (
          <BanknotesIcon className={`h-5 w-5 ${charge.status === "succeeded" ? "text-green-600" : "text-muted-foreground/70"}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {charge.description ?? "Pago recibido"}
        </p>
        <p className="truncate text-xs text-muted-foreground/70">
          {charge.customerEmail ?? "—"} · {fmtDate(charge.created)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className={`text-sm font-bold ${charge.refunded ? "text-orange-500 line-through" : charge.status === "succeeded" ? "text-green-600" : "text-muted-foreground/70"}`}>
          {fmtAmount(charge.amount, charge.currency)}
        </p>
        <StatusBadge status={charge.refunded ? "refunded" : charge.status} />
      </div>
      {charge.receiptUrl && !charge.refunded && (
        <a href={charge.receiptUrl} target="_blank" rel="noopener noreferrer"
          className="ml-1 shrink-0 rounded-lg p-1.5 text-muted-foreground/70 hover:bg-muted/50 hover:text-muted-foreground">
          <ArrowDownTrayIcon className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

// ─── Payout row ───────────────────────────────────────────────────────────────
function PayoutRow({ payout }: { payout: { id: string; amount: number; currency: string; status: string; arrivalDate: number; created: number; description: string | null } }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${payout.status === ("paid" as any) ? "bg-blue-100" : "bg-yellow-100"}`}>
        <ArrowDownTrayIcon className={`h-5 w-5 ${payout.status === ("paid" as any) ? "text-blue-600" : "text-yellow-600"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {payout.description ?? "Transferencia a cuenta bancaria"}
        </p>
        <p className="truncate text-xs text-muted-foreground/70">
          Llegada estimada: {fmtDate(payout.arrivalDate)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <p className="text-sm font-bold text-blue-600">{fmtAmount(payout.amount, payout.currency)}</p>
        <StatusBadge status={payout.status} />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BuddyExpertStats() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [paymentView, setPaymentView] = useState<"charges" | "payouts" | "commissions">("charges");

  const { data: stats, isLoading: statsLoading } = trpc.buddyExperts.getMyStats.useQuery(undefined, { enabled: !!user });
  const { data: followersData, isLoading: followersLoading } = trpc.buddyExperts.getMyFollowers.useQuery(
    { limit: 20, offset: 0 },
    { enabled: !!user && activeTab === "followers" }
  );
  const { data: connectStatus, refetch: refetchConnect } = trpc.stripeConnect.getConnectStatus.useQuery(
    { creatorType: "buddyexpert" },
    { enabled: !!user }
  );
  const { data: paymentHistory, isLoading: paymentsLoading, refetch: refetchPayments } = trpc.stripeConnect.getPaymentHistory.useQuery(
    { creatorType: "buddyexpert", limit: 20 },
    { enabled: !!user && activeTab === "payments" && !!connectStatus?.onboardingCompleted }
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
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
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
          <h1 className="mb-3 text-2xl font-bold text-foreground">Panel de BuddyExpert</h1>
          <p className="mb-8 text-muted-foreground">Primero completa tu perfil de BuddyExpert para acceder a las estadísticas.</p>
          <a href="/app/buddy-expert-dashboard" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-blue-700 transition-colors">
            Ir a mi perfil de experto
          </a>
        </div>
      </AppLayout>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview",   label: "Resumen",    icon: ChartBarIcon },
    { id: "followers",  label: "Seguidores", icon: UsersIcon },
    { id: "content",    label: "Contenido",  icon: BookOpenIcon },
    { id: "payments",   label: "Pagos",      icon: CurrencyEuroIcon },
  ];
  const REFERRAL_CTA = (
    <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-violet-800">Programa de Referidos</p>
        <p className="text-xs text-violet-600">Gana el 20% de cada suscripción de tus referidos</p>
      </div>
      <a href="/app/referrals" className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 transition-colors whitespace-nowrap">
        Ver mi código
      </a>
    </div>
  );

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
              <h1 className="text-xl font-bold text-foreground">{myProfile?.displayName ?? user?.name ?? "Mi Panel"}</h1>
              {myProfile?.verified && <CheckCircleSolid className="h-5 w-5 text-blue-600" />}
            </div>
            <p className="text-sm text-muted-foreground">{myProfile?.specialty ?? (myProfile?.category ? CATEGORY_LABELS[myProfile.category] : "BuddyExpert")}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                connectStatus?.onboardingCompleted ? "bg-green-100 text-green-700" : connectStatus?.connected ? "bg-yellow-100 text-yellow-700" : "bg-muted/50 text-muted-foreground"
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

        {/* Referral CTA */}
        {REFERRAL_CTA}
        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-muted/50 p-1">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? "bg-background text-blue-600 shadow-sm" : "text-muted-foreground hover:text-foreground/80"
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
              <StatCard icon={UsersIcon}        label="Seguidores" value={stats?.followersCount ?? 0} color="blue" />
              <StatCard icon={BookOpenIcon}     label="Planes"     value={stats?.plansCount ?? 0}     color="purple" />
              <StatCard icon={CalendarDaysIcon} label="Menús"      value={stats?.menusCount ?? 0}     color="teal" />
              <StatCard icon={CurrencyEuroIcon} label="Ganado (€)" value={(stats?.totalPaid ?? 0).toFixed(2)} color="green" />
            </div>
            <StripeConnectCard connectStatus={connectStatus}
              onOnboard={() => getOnboardingLink.mutate({ creatorType: "buddyexpert" })}
              onDashboard={() => getStripeDashboard.mutate({ creatorType: "buddyexpert" })}
              onboardingLoading={getOnboardingLink.isPending} dashboardLoading={getStripeDashboard.isPending}
              onRefresh={() => refetchConnect()} accentColor="blue" />
            {(stats?.recentEarnings?.length ?? 0) > 0 && (
              <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-foreground">Últimas comisiones</h3>
                <div className="space-y-2">
                  {stats!.recentEarnings.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-foreground/80">{new Date(e.createdAt).toLocaleDateString("es-ES")}</p>
                        <p className="text-xs text-muted-foreground/70">Comisión: {(e.commissionRate * 100).toFixed(0)}%</p>
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
          <div className="rounded-2xl border border-border/50 bg-background shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <h3 className="font-semibold text-foreground">
                Seguidores <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600">{followersData?.total ?? 0}</span>
              </h3>
            </div>
            {followersLoading ? (
              <div className="flex justify-center py-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
            ) : (followersData?.followers?.length ?? 0) === 0 ? (
              <div className="py-12 text-center text-muted-foreground/70">
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
                      <p className="truncate text-sm font-medium text-foreground">{row.user?.name ?? "Usuario"}</p>
                      <p className="truncate text-xs text-muted-foreground/70">{row.user?.email}</p>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground/70">{new Date(row.followedAt).toLocaleDateString("es-ES")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* CONTENT */}
        {activeTab === "content" && (
          <div className="space-y-4">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Planes nutricionales ({myPlans?.length ?? 0})</h3>
                <a href="/app/buddy-expert-dashboard" className="rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700">
                  Gestionar planes
                </a>
              </div>
              {(myPlans?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-8 text-center text-muted-foreground/70">
                  <BookOpenIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">Aún no has publicado planes.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myPlans!.slice(0, 6).map((plan) => (
                    <div key={plan.id} className="rounded-2xl border border-border/50 bg-background p-3 shadow-sm">
                      <div className="flex items-start gap-3">
                        {plan.coverUrl ? (
                          <img src={plan.coverUrl} alt={plan.title} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                            <BookOpenIcon className="h-6 w-6 text-blue-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{plan.title}</p>
                          <p className="text-xs text-muted-foreground/70">{plan.durationWeeks} semanas · {(plan.price ?? 0) > 0 ? `${plan.price} €` : "Gratis"}</p>
                          <span className={`mt-1 inline-block rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${plan.isPublic ? "bg-green-100 text-green-700" : "bg-muted/50 text-muted-foreground"}`}>
                            {plan.isPublic ? "Público" : "Privado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Menús semanales ({myMenus?.length ?? 0})</h3>
              </div>
              {(myMenus?.length ?? 0) === 0 ? (
                <div className="rounded-2xl border border-dashed border-border py-8 text-center text-muted-foreground/70">
                  <CalendarDaysIcon className="mx-auto mb-2 h-8 w-8 opacity-30" />
                  <p className="text-sm">Aún no has publicado menús.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myMenus!.slice(0, 4).map((menu) => (
                    <div key={menu.id} className="rounded-2xl border border-border/50 bg-background p-3 shadow-sm">
                      <p className="text-sm font-semibold text-foreground">{menu.title}</p>
                      <p className="text-xs text-muted-foreground/70">{(menu as any).dailyCalories ? `${(menu as any).dailyCalories} kcal/día` : ""}</p>
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
            {/* Stripe Connect status card */}
            <StripeConnectCard connectStatus={connectStatus}
              onOnboard={() => getOnboardingLink.mutate({ creatorType: "buddyexpert" })}
              onDashboard={() => getStripeDashboard.mutate({ creatorType: "buddyexpert" })}
              onboardingLoading={getOnboardingLink.isPending} dashboardLoading={getStripeDashboard.isPending}
              onRefresh={() => refetchConnect()} accentColor="blue" />

            {/* If Stripe is connected and onboarding complete, show full payment history */}
            {connectStatus?.onboardingCompleted ? (
              <>
                {/* Balance cards */}
                {paymentsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                  </div>
                ) : paymentHistory?.balance ? (
                  <BalanceCard available={paymentHistory.balance.available} pending={paymentHistory.balance.pending} />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 p-4 text-white shadow-md">
                      <div className="mb-1 flex items-center gap-1.5 text-green-100"><BanknotesIcon className="h-4 w-4" /><span className="text-xs font-medium">Disponible</span></div>
                      <p className="text-2xl font-bold">0,00 €</p>
                      <p className="mt-0.5 text-xs text-green-100">Listo para transferir</p>
                    </div>
                    <div className="rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 p-4 text-white shadow-md">
                      <div className="mb-1 flex items-center gap-1.5 text-yellow-100"><ClockIcon className="h-4 w-4" /><span className="text-xs font-medium">Pendiente</span></div>
                      <p className="text-2xl font-bold">0,00 €</p>
                      <p className="mt-0.5 text-xs text-yellow-100">En proceso</p>
                    </div>
                  </div>
                )}

                {/* Commission info */}
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xs text-blue-700">
                    <strong>Comisión de plataforma:</strong> Buddy One aplica un {((stats?.expert?.commissionRate ?? 0.2) * 100).toFixed(0)}% sobre cada venta.
                    El importe neto se transfiere automáticamente a tu cuenta de Stripe Connect.
                  </p>
                </div>

                {/* Sub-tabs: Cobros / Transferencias / Comisiones internas */}
                <div className="rounded-2xl border border-border/50 bg-background shadow-sm">
                  <div className="flex border-b border-border/50">
                    {[
                      { id: "charges" as const,     label: "Cobros",         icon: BanknotesIcon },
                      { id: "payouts" as const,      label: "Transferencias", icon: ArrowDownTrayIcon },
                      { id: "commissions" as const,  label: "Comisiones",     icon: ReceiptRefundIcon },
                    ].map((v) => (
                      <button key={v.id} onClick={() => setPaymentView(v.id)}
                        className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors ${
                          paymentView === v.id ? "border-b-2 border-blue-600 text-blue-600" : "text-muted-foreground hover:text-foreground/80"
                        }`}>
                        <v.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="hidden sm:inline">{v.label}</span>
                      </button>
                    ))}
                    <button onClick={() => { refetchPayments(); toast.success("Datos actualizados"); }}
                      className="px-3 py-3 text-muted-foreground/70 hover:text-muted-foreground">
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Cobros (charges from Stripe) */}
                  {paymentView === "charges" && (
                    paymentsLoading ? (
                      <div className="flex justify-center py-8"><div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
                    ) : (paymentHistory?.charges?.length ?? 0) === 0 ? (
                      <div className="py-12 text-center text-muted-foreground/70">
                        <BanknotesIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
                        <p className="text-sm">Aún no has recibido pagos.</p>
                        <p className="mt-1 text-xs">Los pagos de tus planes aparecerán aquí.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {paymentHistory!.charges.map((charge) => (
                          <li key={charge.id}><ChargeRow charge={charge} /></li>
                        ))}
                      </ul>
                    )
                  )}

                  {/* Transferencias (payouts to bank) */}
                  {paymentView === "payouts" && (
                    paymentsLoading ? (
                      <div className="flex justify-center py-8"><div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>
                    ) : (paymentHistory?.payouts?.length ?? 0) === 0 ? (
                      <div className="py-12 text-center text-muted-foreground/70">
                        <ArrowDownTrayIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
                        <p className="text-sm">Aún no hay transferencias a tu cuenta bancaria.</p>
                        <p className="mt-1 text-xs">Las transferencias aparecen cuando Stripe envía fondos a tu banco.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {paymentHistory!.payouts.map((payout) => (
                          <li key={payout.id}><PayoutRow payout={payout} /></li>
                        ))}
                      </ul>
                    )
                  )}

                  {/* Comisiones internas (from creatorEarnings table) */}
                  {paymentView === "commissions" && (
                    (stats?.recentEarnings?.length ?? 0) === 0 ? (
                      <div className="py-12 text-center text-muted-foreground/70">
                        <ReceiptRefundIcon className="mx-auto mb-3 h-10 w-10 opacity-30" />
                        <p className="text-sm">No hay comisiones registradas aún.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-50">
                        {stats!.recentEarnings.map((e) => (
                          <li key={e.id} className="flex items-center gap-3 px-4 py-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${e.status === ("paid" as any) ? "bg-green-100" : e.status === "pending" ? "bg-yellow-100" : "bg-red-100"}`}>
                              <ReceiptRefundIcon className={`h-5 w-5 ${e.status === ("paid" as any) ? "text-green-600" : e.status === "pending" ? "text-yellow-600" : "text-red-500"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">Comisión de venta</p>
                              <p className="text-xs text-muted-foreground/70">
                                {new Date(e.createdAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                {" · "}Bruto: {e.amount.toFixed(2)} € · Tasa: {(e.commissionRate * 100).toFixed(0)}%
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <p className={`text-sm font-bold ${e.status === ("paid" as any) ? "text-green-600" : e.status === "pending" ? "text-yellow-600" : "text-red-500"}`}>
                                +{e.commissionAmount.toFixed(2)} €
                              </p>
                              <StatusBadge status={e.status} />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )
                  )}
                </div>

                {/* Link to full Stripe dashboard */}
                <div className="flex justify-center">
                  <button
                    onClick={() => getStripeDashboard.mutate({ creatorType: "buddyexpert" })}
                    disabled={getStripeDashboard.isPending}
                    className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-background px-5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 disabled:opacity-60"
                  >
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    {getStripeDashboard.isPending ? "Abriendo..." : "Ver panel completo en Stripe"}
                  </button>
                </div>
              </>
            ) : (
              /* Stripe not yet connected — show summary from internal DB */
              <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm">
                <h3 className="mb-3 font-semibold text-foreground">Resumen de ganancias</h3>
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
                <p className="mt-3 text-xs text-muted-foreground/70">
                  Conecta tu cuenta de Stripe para ver el historial completo de pagos y transferencias.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: "blue" | "purple" | "teal" | "green" | "orange" | "yellow" }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    teal:   "bg-teal-50 text-teal-600",
    green:  "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-[#FF6B35]",
    yellow: "bg-yellow-50 text-yellow-600",
  };
  return (
    <div className="rounded-2xl border border-border/50 bg-background p-4 shadow-sm">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${colors[color]}`}><Icon className="h-5 w-5" /></div>
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground/70">{label}</p>
    </div>
  );
}

function StripeConnectCard({ connectStatus, onOnboard, onDashboard, onboardingLoading, dashboardLoading, onRefresh, accentColor = "orange" }: {
  connectStatus: { connected: boolean; onboardingCompleted: boolean; stripeAccountId: string | null } | undefined;
  onOnboard: () => void; onDashboard: () => void;
  onboardingLoading: boolean; dashboardLoading: boolean; onRefresh: () => void;
  accentColor?: "orange" | "blue";
}) {
  const btnClass = accentColor === "blue" ? "bg-blue-600 hover:bg-blue-700" : "bg-[#FF6B35] hover:bg-orange-600";
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${connectStatus?.onboardingCompleted ? "border-green-200 bg-green-50" : connectStatus?.connected ? "border-yellow-200 bg-yellow-50" : accentColor === "blue" ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${connectStatus?.onboardingCompleted ? "bg-green-100" : accentColor === "blue" ? "bg-blue-100" : "bg-orange-100"}`}>
          {connectStatus?.onboardingCompleted ? <CheckCircleIcon className="h-6 w-6 text-green-600" /> : <ExclamationCircleIcon className={`h-6 w-6 ${accentColor === "blue" ? "text-blue-600" : "text-[#FF6B35]"}`} />}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">
            {connectStatus?.onboardingCompleted ? "Stripe Connect activo" : connectStatus?.connected ? "Completa el onboarding de Stripe" : "Conecta tu cuenta de Stripe"}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
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
                  <button onClick={onRefresh} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/30">
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
