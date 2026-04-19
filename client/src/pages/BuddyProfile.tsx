import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";

// ─── Star rating ──────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 bg-background/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 min-w-[72px]">
      <span className="text-lg">{icon}</span>
      <span className="text-white font-bold text-sm leading-none">{value}</span>
      <span className="text-white/70 text-xs">{label}</span>
    </div>
  );
}

// ─── Plan preview modal ───────────────────────────────────────────────────────
function PlanPreviewModal({ plan, onClose, onCopy, onBuy, alreadyCopied, copying, buying }: {
  plan: any;
  onClose: () => void;
  onCopy: () => void;
  onBuy?: () => void;
  alreadyCopied?: boolean;
  copying?: boolean;
  buying?: boolean;
}) {
  const cat: Record<string, string> = {
    perdida_peso: "🔥 Pérdida de peso",
    ganancia_muscular: "💪 Ganancia muscular",
    definicion: "⚡ Definición",
    dieta_equilibrada: "🥗 Equilibrada",
    rendimiento: "🏆 Rendimiento",
    bienestar: "🌿 Bienestar",
    vegano: "🌱 Vegano",
  };
  const levelLabel: Record<string, string> = {
    principiante: "Principiante",
    intermedio: "Intermedio",
    avanzado: "Avanzado",
  };
  const isPaid = (plan.price ?? 0) > 0;
  let tags: string[] = [];
  try { tags = plan.tags ? JSON.parse(plan.tags) : []; } catch { tags = []; }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover image */}
        <div className="relative h-48 flex-shrink-0">
          {plan.coverUrl ? (
            <img src={plan.coverUrl} alt={plan.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {plan.isFeatured && (
            <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">⭐ Destacado</span>
          )}
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-white font-bold text-xl leading-tight">{plan.title}</h2>
            <p className="text-white/80 text-sm mt-0.5">{cat[plan.category] ?? plan.category}</p>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-orange-600 font-bold text-lg">{plan.durationWeeks}</p>
              <p className="text-muted-foreground text-xs">semanas</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-orange-600 font-bold text-lg">{plan.dailyCalories ?? "—"}</p>
              <p className="text-muted-foreground text-xs">kcal/día</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-orange-600 font-bold text-lg">{plan.dailyMeals ?? 3}</p>
              <p className="text-muted-foreground text-xs">comidas/día</p>
            </div>
          </div>

          {/* Level + price */}
          <div className="flex items-center justify-between">
            <span className="bg-muted/50 text-foreground/80 text-sm font-semibold px-3 py-1 rounded-full">
              {levelLabel[plan.level] ?? plan.level}
            </span>
            {isPaid ? (
              <span className="text-lg font-bold text-orange-600">{plan.price}€</span>
            ) : (
              <span className="text-sm font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">GRATIS</span>
            )}
          </div>

          {/* Description */}
          {plan.description && (
            <div>
              <h3 className="font-semibold text-foreground text-sm mb-1">Descripción</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{plan.description}</p>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag: string, i: number) => (
                <span key={i} className="bg-orange-50 text-orange-700 text-xs font-medium px-2.5 py-1 rounded-full border border-orange-100">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* What's included */}
          <div className="bg-muted/30 rounded-2xl p-4">
            <h3 className="font-semibold text-foreground text-sm mb-3">¿Qué incluye este plan?</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                {plan.durationWeeks} semanas de menús personalizados
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                {plan.dailyMeals ?? 3} comidas diarias estructuradas
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                Recetas con ingredientes y preparación
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                Lista de la compra automática
              </li>
              {isPaid && (
                <>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                    Sesión online semanal de seguimiento y ajuste
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                    Acceso directo por WhatsApp para dudas
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                    Opciones de sustitución para cada comida
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                    Adaptado a tus gustos e intolerancias
                  </li>
                </>
              )}
            </ul>
            {isPaid && (
              <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-3">
                <p className="text-xs text-orange-700 font-semibold">💳 Suscripción mensual · Cancela cuando quieras</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pago seguro con Stripe. Sin permanencia.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-border/50 flex-shrink-0">
          {isPaid ? (
            <button
              onClick={onBuy}
              disabled={buying}
              className="w-full text-sm font-bold py-3 rounded-2xl transition-all bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md disabled:opacity-60"
            >
              {buying ? (
                <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Procesando...</span>
              ) : (
                `💳 Suscribirme · ${plan.price}€/mes`
              )}
            </button>
          ) : (
            <button
              onClick={alreadyCopied ? undefined : onCopy}
              disabled={alreadyCopied || copying}
              className={`w-full text-sm font-bold py-3 rounded-2xl transition-all ${
                alreadyCopied
                  ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md disabled:opacity-60"
              }`}
            >
              {copying ? (
                <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Copiando...</span>
              ) : alreadyCopied ? (
                "✓ Plan ya copiado"
              ) : (
                "📋 Copiar plan al planificador"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, onCopy, onBuy, alreadyCopied, copying, buying }: {
  plan: any;
  onCopy: () => void;
  onBuy?: () => void;
  alreadyCopied?: boolean;
  copying?: boolean;
  buying?: boolean;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const cat: Record<string, string> = {
    perdida_peso: "🔥 Pérdida de peso",
    ganancia_muscular: "💪 Ganancia muscular",
    definicion: "⚡ Definición",
    dieta_equilibrada: "🥗 Equilibrada",
    rendimiento: "🏆 Rendimiento",
    bienestar: "🌿 Bienestar",
    vegano: "🌱 Vegano",
  };
  const isPaid = (plan.price ?? 0) > 0;
  return (
    <>
      {showPreview && (
        <PlanPreviewModal
          plan={plan}
          onClose={() => setShowPreview(false)}
          onCopy={() => { onCopy(); setShowPreview(false); }}
          onBuy={onBuy}
          alreadyCopied={alreadyCopied}
          copying={copying}
          buying={buying}
        />
      )}
      <div className="bg-background rounded-2xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-md transition-all">
        <div className="relative h-28 overflow-hidden cursor-pointer" onClick={() => setShowPreview(true)}>
          {plan.coverUrl ? (
            <img src={plan.coverUrl} alt={plan.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {/* Preview hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
            <span className="bg-background/90 text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow">👁 Ver plan</span>
          </div>
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-white font-bold text-sm line-clamp-1">{plan.title}</p>
          </div>
          {plan.isFeatured && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">⭐ Destacado</span>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{plan.description}</p>
          <div className="flex gap-2 mb-3 text-xs text-muted-foreground">
            <span className="bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full">{plan.durationWeeks} sem</span>
            <span className="bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full">{plan.dailyCalories} kcal/día</span>
            <span className="bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full capitalize">{plan.level}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground/70">{cat[plan.category] ?? plan.category}</span>
            {isPaid ? (
              <span className="text-sm font-bold text-orange-600">{plan.price}€</span>
            ) : (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">GRATIS</span>
            )}
          </div>
          {/* Ver plan button */}
          <button
            onClick={() => setShowPreview(true)}
            className="w-full text-xs font-semibold py-1.5 rounded-xl border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors mb-2"
          >
            👁 Ver plan
          </button>
          {isPaid ? (
            // Paid plan: open Stripe checkout
            <button
              onClick={onBuy}
              disabled={buying}
              className="w-full text-xs font-bold py-2 rounded-xl transition-all shadow-sm bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-md disabled:opacity-60"
            >
              {buying ? (
                <span className="flex items-center justify-center gap-1.5"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Procesando...</span>
              ) : (
                `💳 Suscribirme · ${plan.price}€/mes`
              )}
            </button>
          ) : (
            // Free plan: copy to planner
            <button
              onClick={alreadyCopied ? undefined : onCopy}
              disabled={alreadyCopied || copying}
              className={`w-full text-xs font-bold py-2 rounded-xl transition-all shadow-sm ${
                alreadyCopied
                  ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:shadow-md disabled:opacity-60"
              }`}
            >
              {copying ? (
                <span className="flex items-center justify-center gap-1.5"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Copiando...</span>
              ) : alreadyCopied ? (
                "✓ Plan ya copiado"
              ) : (
                "📋 Copiar plan"
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Expert profile ───────────────────────────────────────────────────────────
function ExpertProfile({ id }: { id: number }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.buddyExperts.getById.useQuery({ id });
  const { data: followData } = trpc.buddyExperts.isFollowing.useQuery(
    { expertId: id },
    { enabled: !!user }
  );

  const followMut = trpc.buddyExperts.follow.useMutation({
    onSuccess: (res) => {
      toast.success(res.following ? "¡Ahora sigues a este experto!" : "Has dejado de seguir al experto");
      utils.buddyExperts.isFollowing.invalidate({ expertId: id });
      utils.buddyExperts.getById.invalidate({ id });
    },
    onError: () => toast.error("Inicia sesión para seguir a expertos"),
  });

  const { data: copiedPlans, refetch: refetchCopied } = trpc.buddyExperts.getMyCopiedPlans.useQuery(undefined, {
    enabled: !!user,
  });
  const copiedPlanIds = new Set((copiedPlans ?? []).map((c: any) => c.copy?.planId).filter(Boolean));

  const copyPlanMut = trpc.buddyExperts.copyPlan.useMutation({
    onSuccess: () => { toast.success("Plan copiado a tu planificador ✅"); refetchCopied(); },
    onError: () => toast.error("Inicia sesión para copiar planes"),
  });

  const buyPlanMut = trpc.subscriptions.createExpertPlanCheckout.useMutation({
    onSuccess: (data: { url: string }) => {
      toast.success("Redirigiendo al pago...");
      window.open(data.url, "_blank");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Error al procesar el pago"),
  });

  // Planes de servicio (contratación)
  const { data: servicePlans } = trpc.buddyExperts.getServicePlans.useQuery({ expertId: id });
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [hireMessage, setHireMessage] = useState("");
  const [showHireModal, setShowHireModal] = useState(false);
  const [, navigate] = useLocation();

  const hireRequestMut = trpc.expertPatients.sendHireRequest.useMutation({
    onSuccess: () => {
      toast.success("¡Solicitud enviada! El nutricionista la revisará pronto.");
      setShowHireModal(false);
      setHireMessage("");
      setSelectedPlan(null);
    },
    onError: (err: { message?: string }) => toast.error(err.message || "Error al enviar la solicitud"),
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!data) return <NotFound type="experto" />;

  const { expert, user: expertUser, plans, menus } = data;
  const isFollowing = followData?.following ?? false;

  return (
    <ProfileLayout
      name={expert.displayName}
      specialty={expert.specialty}
      bio={expert.bio}
      avatarUrl={expert.avatarUrl}
      coverUrl={expert.coverUrl}
      verified={expert.verified ?? false}
      featured={expert.featured ?? false}
      rating={expert.rating ?? 0}
      reviewsCount={expert.reviewsCount ?? 0}
      stats={[
        { icon: "👥", value: expert.followersCount >= 1000 ? `${(expert.followersCount / 1000).toFixed(1)}k` : expert.followersCount, label: "seguidores" },
        { icon: "📋", value: expert.plansCount, label: "planes" },
        { icon: "⭐", value: expert.rating?.toFixed(1) ?? "—", label: "valoración" },
      ]}
      isFollowing={isFollowing}
      onFollow={() => followMut.mutate({ expertId: id })}
      followLoading={followMut.isPending}
      badge="BuddyExpert"
      badgeColor="from-orange-500 to-red-500"
    >
      {/* ── Planes de contratación de servicio ── SIEMPRE VISIBLE ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-base">Contratar servicio</h3>
          <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">Seguimiento personalizado</span>
        </div>
        {/* Si hay planes configurados, mostrarlos; si no, botón directo */}
        {servicePlans && servicePlans.length > 0 ? (
          <div className="space-y-3">
            {servicePlans.map((plan: any) => {
              let includes: string[] = [];
              try { includes = plan.includes ? JSON.parse(plan.includes) : []; } catch { includes = []; }
              const periodLabel: Record<string, string> = { monthly: "mes", quarterly: "trimestre", annual: "año", one_time: "pago único" };
              return (
                <div key={plan.id} className={`relative bg-background rounded-2xl border-2 p-4 shadow-sm ${
                  plan.isPopular ? "border-orange-400" : "border-border/50"
                }`}>
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-4 bg-orange-500 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow">⭐ Más popular</div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-foreground text-sm">{plan.name}</h4>
                      {plan.description && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{plan.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black text-orange-500">{plan.price === 0 ? "Gratis" : `${plan.price}€`}</div>
                      {plan.price > 0 && <div className="text-xs text-muted-foreground/70">/{periodLabel[plan.billingPeriod] ?? plan.billingPeriod}</div>}
                    </div>
                  </div>
                  {includes.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {includes.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {plan.maxConsultations && (
                    <p className="text-xs text-muted-foreground/70 mt-2">{plan.maxConsultations} consultas incluidas</p>
                  )}
                  <button
                    onClick={() => {
                      if (!user) { toast.error("Inicia sesión para solicitar un nutricionista"); return; }
                      setSelectedPlan(plan);
                      setShowHireModal(true);
                    }}
                    className="mt-3 w-full py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition-opacity"
                  >
                    Solicitar este plan
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <button
            onClick={() => { if (!user) { toast.error("Inicia sesión para solicitar un nutricionista"); return; } setShowHireModal(true); }}
            className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white hover:opacity-90 transition-opacity"
          >
            📞 Contactar nutricionista
          </button>
        )}
        {/* Modal de solicitud */}
        {showHireModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowHireModal(false)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-background w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground text-lg">Solicitar contratación</h3>
                  <button onClick={() => setShowHireModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/50 text-muted-foreground hover:bg-muted">×</button>
                </div>
                {selectedPlan && (
                  <div className="bg-orange-50 rounded-xl p-3 mb-4">
                    <p className="text-sm font-semibold text-orange-800">{selectedPlan.name}</p>
                    <p className="text-xs text-orange-600">{selectedPlan.price === 0 ? "Gratis" : `${selectedPlan.price}€/${selectedPlan.billingPeriod === "monthly" ? "mes" : selectedPlan.billingPeriod}`}</p>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5">Mensaje para el nutricionista <span className="text-muted-foreground/70 font-normal">(opcional)</span></label>
                  <textarea
                    value={hireMessage}
                    onChange={(e) => setHireMessage(e.target.value)}
                    placeholder="Cuéntale tus objetivos, restricciones alimentarias o cualquier información relevante..."
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-300"
                    rows={4}
                  />
                </div>
                <button
                  onClick={() => hireRequestMut.mutate({ expertId: id, servicePlanId: selectedPlan?.id, message: hireMessage || undefined })}
                  disabled={hireRequestMut.isPending}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {hireRequestMut.isPending ? "Enviando..." : "🚀 Enviar solicitud"}
                </button>
                <p className="text-xs text-muted-foreground/70 text-center mt-2">El nutricionista revisará tu solicitud y te responderá por email</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Plans */}
      {plans.length > 0 && (
        <section>
          <h3 className="font-bold text-foreground text-base mb-3">Planes nutricionales</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans.map((plan: any) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onCopy={() => copyPlanMut.mutate({ planId: plan.id })}
                onBuy={() => buyPlanMut.mutate({ planId: plan.id, origin: window.location.origin })}
                alreadyCopied={copiedPlanIds.has(plan.id)}
                copying={copyPlanMut.isPending && copyPlanMut.variables?.planId === plan.id}
                buying={buyPlanMut.isPending && buyPlanMut.variables?.planId === plan.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Menus */}
      {menus.length > 0 && (
        <section>
          <h3 className="font-bold text-foreground text-base mb-3">Menús semanales gratuitos</h3>
          <div className="space-y-3">
            {menus.map((menu: any) => (
              <MenuRow key={menu.id} menu={menu} />
            ))}
          </div>
        </section>
      )}
    </ProfileLayout>
  );
}

function MenuRow({ menu }: { menu: any }) {
  const [expanded, setExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split("T")[0]);
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const copyMenuMut = trpc.buddyExperts.copyMenu.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ Menú "${data.menuName}" copiado a Mis Menús`);
      setShowDatePicker(false);
      utils.menus.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message || "Error al copiar el menú"),
  });
  let menuData: any = null;
  try {
    if (menu.menuData) {
      // menuData can arrive as string or already-parsed object (Drizzle/superjson)
      const raw = typeof menu.menuData === "string" ? menu.menuData : JSON.stringify(menu.menuData);
      const parsed = JSON.parse(raw);
      // Handle double-encoded JSON (string inside string)
      menuData = typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    }
  } catch { menuData = null; }

  return (
    <div className="bg-background rounded-2xl border border-orange-100 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          {menu.coverUrl ? (
            <img src={menu.coverUrl} alt={menu.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-lg">🗓️</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-sm truncate">{menu.title}</p>
          <p className="text-xs text-muted-foreground">{menu.dailyCalories} kcal/día · <span className="text-green-600 font-semibold">GRATIS</span></p>
        </div>
        <div className="flex gap-1.5">
          {user && (
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              disabled={copyMenuMut.isPending}
              className="text-xs text-white font-semibold bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {copyMenuMut.isPending ? "..." : "📋 Copiar"}
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-orange-600 font-semibold border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors"
          >
            {expanded ? "▲" : "▼ Ver"}
          </button>
        </div>
      </div>
      {showDatePicker && user && (
        <div className="border-t border-orange-100 px-3 py-3 bg-orange-50">
          <p className="text-xs font-semibold text-foreground/80 mb-2">¿Cuándo quieres empezar este menú?</p>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 text-xs border border-orange-200 rounded-xl px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
            <button
              onClick={() => copyMenuMut.mutate({ menuId: menu.id, startDate })}
              disabled={copyMenuMut.isPending}
              className="text-xs text-white font-bold bg-orange-500 px-4 py-2 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {copyMenuMut.isPending ? "Copiando..." : "Confirmar"}
            </button>
            <button
              onClick={() => setShowDatePicker(false)}
              className="text-xs text-muted-foreground font-semibold px-3 py-2 rounded-xl hover:bg-muted/50 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {expanded && (
        !menuData?.days ? (
          <div className="border-t border-orange-50 px-3 pb-3 pt-2">
            <p className="text-xs text-muted-foreground/70 text-center py-2">No hay datos de menú disponibles</p>
          </div>
        ) :
        <div className="border-t border-orange-50 px-3 pb-3 pt-2 space-y-2 max-h-80 overflow-y-auto">
          {menuData.days.map((day: any, i: number) => {
            // Support both array format [{name, food}] and object format {desayuno, comida, ...}
            const mealLabels: Record<string, string> = {
              desayuno: "Desayuno",
              media_manana: "Media mañana",
              comida: "Comida",
              merienda: "Merienda",
              cena: "Cena",
            };
            const mealsArray: { name: string; food: string }[] = Array.isArray(day.meals)
              ? day.meals
              : Object.entries(day.meals || {}).map(([k, v]) => ({ name: mealLabels[k] ?? k, food: v as string }));
            return (
              <div key={i} className="bg-orange-50 rounded-xl p-2.5">
                <p className="text-xs font-bold text-orange-700 mb-1.5">{day.day}</p>
                <div className="space-y-1">
                  {mealsArray.map((meal, j) => (
                    <p key={j} className="text-xs text-muted-foreground"><span className="font-semibold text-foreground/80">{meal.name}:</span> {meal.food}</p>
                  ))}
                </div>
              </div>
            );
          })}
          {menuData.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-2.5 mt-1">
              <p className="text-xs text-amber-700">💡 {menuData.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Recipe mini card for maker profile ──────────────────────────────────────
function MakerRecipeCard({ recipe }: { recipe: any }) {
  const mealTimeLabel: Record<string, string> = {
    desayuno: "Desayuno", comida: "Comida", cena: "Cena",
    merienda: "Merienda", snack: "Merienda", cualquiera: "",
  };
  const diffLabel: Record<string, string> = { easy: "Fácil", facil: "Fácil", medium: "Media", medio: "Media", hard: "Difícil", dificil: "Difícil" };
  const totalTime = (recipe.preparationTime ?? 0) + (recipe.cookTime ?? 0);
  return (
    <div className="bg-background rounded-2xl overflow-hidden shadow-sm border border-orange-50 hover:shadow-md transition-shadow">
      <div className="relative h-32 overflow-hidden bg-gradient-to-br from-orange-100 to-pink-100">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        {recipe.mealTime && recipe.mealTime !== "cualquiera" && (
          <span className="absolute top-2 right-2 bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
            {mealTimeLabel[recipe.mealTime] ?? recipe.mealTime}
          </span>
        )}
        <p className="absolute bottom-2 left-2 right-2 text-white font-bold text-[13px] line-clamp-2 leading-tight">{recipe.name}</p>
      </div>
      <div className="p-2.5">
        <div className="flex items-center justify-between text-[12px] text-muted-foreground font-medium">
          <span className="flex items-center gap-1">
            <span>🔥</span>
            <span>{recipe.caloriesPerServing ?? "—"} kcal</span>
          </span>
          {totalTime > 0 && (
            <span className="flex items-center gap-1">
              <span>⏱</span>
              <span>{totalTime}m</span>
            </span>
          )}
          {recipe.difficulty && (
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
              recipe.difficulty === "easy" || recipe.difficulty === "facil" ? "bg-green-100 text-green-700" :
              recipe.difficulty === "hard" || recipe.difficulty === "dificil" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>{diffLabel[recipe.difficulty] ?? recipe.difficulty}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Maker profile ────────────────────────────────────────────────────────────
function MakerProfile({ id }: { id: number }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.buddyMakers.getById.useQuery({ id });
  const { data: followData } = trpc.buddyMakers.isFollowing.useQuery(
    { makerId: id },
    { enabled: !!user }
  );
  const { data: recipesData } = trpc.recipes.list.useQuery(
    { buddyMakerId: id, isPublic: true, limit: 20, excludeUserAllergens: true },
    { enabled: !!id }
  );

  const followMut = trpc.buddyMakers.follow.useMutation({
    onSuccess: (res) => {
      toast.success(res.following ? "¡Ahora sigues a este maker!" : "Has dejado de seguir al maker");
      utils.buddyMakers.isFollowing.invalidate({ makerId: id });
      utils.buddyMakers.getById.invalidate({ id });
    },
    onError: () => toast.error("Inicia sesión para seguir a makers"),
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!data) return <NotFound type="maker" />;

  const { maker } = data;
  const isFollowing = followData?.following ?? false;
  const recipes = recipesData?.recipes ?? [];

  return (
    <ProfileLayout
      name={maker.displayName}
      specialty={maker.specialty}
      bio={maker.bio}
      avatarUrl={maker.avatarUrl}
      coverUrl={maker.coverUrl}
      verified={maker.verified ?? false}
      featured={maker.featured ?? false}
      rating={maker.rating ?? 0}
      reviewsCount={0}
      stats={[
        { icon: "👥", value: maker.followersCount >= 1000 ? `${(maker.followersCount / 1000).toFixed(1)}k` : maker.followersCount, label: "seguidores" },
        { icon: "🍽️", value: recipes.length > 0 ? recipes.length : (maker.recipesCount ?? 0), label: "recetas" },
        { icon: "⭐", value: maker.rating?.toFixed(1) ?? "—", label: "valoración" },
      ]}
      isFollowing={isFollowing}
      onFollow={() => followMut.mutate({ makerId: id })}
      followLoading={followMut.isPending}
      badge="BuddyMaker"
      badgeColor="from-pink-500 to-orange-500"
    >
      {/* Instagram link */}
      {maker.instagramHandle && (
        <a
          href={`https://instagram.com/${maker.instagramHandle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 rounded-2xl p-3 hover:from-pink-100 hover:to-orange-100 transition-colors"
        >
          <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <div>
            <p className="text-sm font-bold text-foreground">@{maker.instagramHandle}</p>
            <p className="text-xs text-muted-foreground">Ver en Instagram</p>
          </div>
          <svg className="w-4 h-4 text-muted-foreground/70 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}

      {/* Recipes section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-base">Recetas publicadas</h3>
          {recipes.length > 0 && (
            <span className="text-xs text-orange-500 font-bold bg-orange-50 px-2.5 py-1 rounded-full">{recipes.length} recetas</span>
          )}
        </div>
        {recipes.length === 0 ? (
          <div className="bg-background rounded-2xl border border-dashed border-orange-200 p-6 text-center">
            <p className="text-3xl mb-2">🍳</p>
            <p className="text-sm text-muted-foreground">Este maker aún no ha publicado recetas</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((r: any) => (
              <MakerRecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </section>
    </ProfileLayout>
  );
}

// ─── Shared profile layout ────────────────────────────────────────────────────
interface ProfileLayoutProps {
  name: string;
  specialty?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  verified: boolean;
  featured: boolean;
  rating: number;
  reviewsCount: number;
  stats: { icon: string; value: string | number; label: string }[];
  isFollowing: boolean;
  onFollow: () => void;
  followLoading: boolean;
  badge: string;
  badgeColor: string;
  children?: React.ReactNode;
}

function ProfileLayout({
  name, specialty, bio, avatarUrl, coverUrl, verified, featured, rating, reviewsCount,
  stats, isFollowing, onFollow, followLoading, badge, badgeColor, children
}: ProfileLayoutProps) {
  const [, navigate] = useLocation();
  // Determine fallback route based on badge type
  const goBack = () => {
    // Use native browser history.back() for reliable back navigation
    if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate(badge === "BuddyMaker" ? "/app/buddy-makers" : "/app/buddy-experts");
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Hero cover */}
      <div className="relative h-52 overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${badgeColor}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={goBack}
          className="absolute top-4 left-4 w-9 h-9 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Badge */}
        <span className={`absolute top-4 right-4 bg-gradient-to-r ${badgeColor} text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg`}>
          {badge}
        </span>

        {/* Stats row at bottom of cover */}
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center">
          {stats.map((s, i) => <StatPill key={i} {...s} />)}
        </div>
      </div>

      {/* Avatar + identity */}
      <div className="px-4 -mt-10 mb-4 relative z-10">
        <div className="bg-background rounded-3xl shadow-xl p-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="relative flex-shrink-0">
              <img
                src={avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F97316&color=fff&size=120`}
                alt={name}
                className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover"
              />
              {featured && (
                <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-sm shadow">⭐</span>
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-xl font-black text-foreground">{name}</h1>
                {verified && (
                  <span className="flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verificado
                  </span>
                )}
              </div>
              {specialty && <p className="text-sm text-orange-600 font-semibold mb-1">{specialty}</p>}
              {rating > 0 && (
                <div className="flex items-center gap-1.5">
                  <Stars rating={rating} />
                  <span className="text-xs text-muted-foreground font-medium">{rating.toFixed(1)} ({reviewsCount} reseñas)</span>
                </div>
              )}
            </div>
          </div>

          {bio && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 border-t border-gray-50 pt-3">{bio}</p>
          )}

          {/* Follow CTA */}
          <button
            onClick={onFollow}
            disabled={followLoading}
            className={`w-full py-3 rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-md ${
              isFollowing
                ? "bg-muted/50 text-foreground/80 hover:bg-red-50 hover:text-red-600 border border-border"
                : `bg-gradient-to-r ${badgeColor} text-white hover:opacity-90`
            }`}
          >
            {followLoading ? "..." : isFollowing ? "✓ Siguiendo · Dejar de seguir" : "+ Seguir"}
          </button>
        </div>
      </div>

      {/* Content sections */}
      <div className="px-4 pb-8 space-y-5">
        {children}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      <div className="h-52 bg-muted animate-pulse" />
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-background rounded-3xl shadow-xl p-4 animate-pulse">
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-muted" />
            <div className="flex-1 space-y-2 pt-2">
              <div className="h-5 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
          <div className="h-12 bg-muted rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

function NotFound({ type }: { type: string }) {
  const [, navigate] = useLocation();
  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-6xl">🔍</div>
      <h2 className="text-xl font-bold text-foreground">No encontrado</h2>
      <p className="text-muted-foreground text-center">Este {type} no existe o ya no está disponible.</p>
      <button onClick={() => window.history.length > 2 ? window.history.back() : navigate("/app/buddy-makers")} className="bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl">Volver</button>
    </div>
  );
}

// ─── Route dispatcher ─────────────────────────────────────────────────────────
export default function BuddyProfile() {
  const [matchExpert, paramsExpert] = useRoute("/app/buddy-experts/:id");
  const [matchMaker, paramsMaker] = useRoute("/app/buddy-makers/:id");

  if (matchExpert && paramsExpert?.id) {
    const id = parseInt(paramsExpert.id);
    if (!isNaN(id)) return <ExpertProfile id={id} />;
  }
  if (matchMaker && paramsMaker?.id) {
    const id = parseInt(paramsMaker.id);
    if (!isNaN(id)) return <MakerProfile id={id} />;
  }
  return <NotFound type="perfil" />;
}
