import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

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
    <div className="flex flex-col items-center gap-0.5 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 min-w-[72px]">
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
        className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
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
              <p className="text-gray-500 text-xs">semanas</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-orange-600 font-bold text-lg">{plan.dailyCalories ?? "—"}</p>
              <p className="text-gray-500 text-xs">kcal/día</p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-3 text-center">
              <p className="text-orange-600 font-bold text-lg">{plan.dailyMeals ?? 3}</p>
              <p className="text-gray-500 text-xs">comidas/día</p>
            </div>
          </div>

          {/* Level + price */}
          <div className="flex items-center justify-between">
            <span className="bg-gray-100 text-gray-700 text-sm font-semibold px-3 py-1 rounded-full">
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
              <h3 className="font-semibold text-gray-800 text-sm mb-1">Descripción</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{plan.description}</p>
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
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="font-semibold text-gray-800 text-sm mb-3">¿Qué incluye este plan?</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                {plan.durationWeeks} semanas de menús personalizados
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                {plan.dailyMeals ?? 3} comidas diarias estructuradas
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                Recetas con ingredientes y preparación
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600">
                <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                Lista de la compra automática
              </li>
              {isPaid && (
                <>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                    Sesión online semanal de seguimiento y ajuste
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                    Acceso directo por WhatsApp para dudas
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                    Opciones de sustitución para cada comida
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs">✓</span>
                    Adaptado a tus gustos e intolerancias
                  </li>
                </>
              )}
            </ul>
            {isPaid && (
              <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl p-3">
                <p className="text-xs text-orange-700 font-semibold">💳 Suscripción mensual · Cancela cuando quieras</p>
                <p className="text-xs text-gray-500 mt-0.5">Pago seguro con Stripe. Sin permanencia.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
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
      <div className="bg-white rounded-2xl overflow-hidden border border-orange-100 shadow-sm hover:shadow-md transition-all">
        <div className="relative h-28 overflow-hidden cursor-pointer" onClick={() => setShowPreview(true)}>
          {plan.coverUrl ? (
            <img src={plan.coverUrl} alt={plan.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {/* Preview hint */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
            <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow">👁 Ver plan</span>
          </div>
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-white font-bold text-sm line-clamp-1">{plan.title}</p>
          </div>
          {plan.isFeatured && (
            <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">⭐ Destacado</span>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-gray-500 mb-2 line-clamp-2">{plan.description}</p>
          <div className="flex gap-2 mb-3 text-xs text-gray-500">
            <span className="bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full">{plan.durationWeeks} sem</span>
            <span className="bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full">{plan.dailyCalories} kcal/día</span>
            <span className="bg-orange-50 text-orange-700 font-semibold px-2 py-0.5 rounded-full capitalize">{plan.level}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">{cat[plan.category] ?? plan.category}</span>
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
      {/* Plans */}
      {plans.length > 0 && (
        <section>
          <h3 className="font-bold text-gray-900 text-base mb-3">Planes nutricionales</h3>
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
          <h3 className="font-bold text-gray-900 text-base mb-3">Menús semanales gratuitos</h3>
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
  let menuData: any = null;
  try { menuData = menu.menuData ? JSON.parse(menu.menuData) : null; } catch { menuData = null; }

  return (
    <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          {menu.coverUrl ? (
            <img src={menu.coverUrl} alt={menu.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white text-lg">🗓️</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm truncate">{menu.title}</p>
          <p className="text-xs text-gray-500">{menu.dailyCalories} kcal/día · <span className="text-green-600 font-semibold">GRATIS</span></p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-orange-600 font-semibold border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors"
        >
          {expanded ? "▲" : "▼ Ver"}
        </button>
      </div>
      {expanded && menuData?.days && (
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
                    <p key={j} className="text-xs text-gray-600"><span className="font-semibold text-gray-700">{meal.name}:</span> {meal.food}</p>
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

// ─── Maker profile ────────────────────────────────────────────────────────────
function MakerProfile({ id }: { id: number }) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.buddyMakers.getById.useQuery({ id });
  const { data: followData } = trpc.buddyMakers.isFollowing.useQuery(
    { makerId: id },
    { enabled: !!user }
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

  const { maker, user: makerUser } = data;
  const isFollowing = followData?.following ?? false;

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
        { icon: "🍽️", value: maker.recipesCount, label: "recetas" },
        { icon: "⭐", value: maker.rating?.toFixed(1) ?? "—", label: "valoración" },
      ]}
      isFollowing={isFollowing}
      onFollow={() => followMut.mutate({ makerId: id })}
      followLoading={followMut.isPending}
      badge="BuddyMaker"
      badgeColor="from-pink-500 to-orange-500"
    >
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
            <p className="text-sm font-bold text-gray-900">@{maker.instagramHandle}</p>
            <p className="text-xs text-gray-500">Ver en Instagram</p>
          </div>
          <svg className="w-4 h-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      )}
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
          onClick={() => navigate(-1 as any)}
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
        <div className="bg-white rounded-3xl shadow-xl p-4">
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
                <h1 className="text-xl font-black text-gray-900">{name}</h1>
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
                  <span className="text-xs text-gray-500 font-medium">{rating.toFixed(1)} ({reviewsCount} reseñas)</span>
                </div>
              )}
            </div>
          </div>

          {bio && (
            <p className="text-sm text-gray-600 leading-relaxed mb-4 border-t border-gray-50 pt-3">{bio}</p>
          )}

          {/* Follow CTA */}
          <button
            onClick={onFollow}
            disabled={followLoading}
            className={`w-full py-3 rounded-2xl text-sm font-bold transition-all shadow-sm hover:shadow-md ${
              isFollowing
                ? "bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200"
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
      <div className="h-52 bg-gray-200 animate-pulse" />
      <div className="px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-4 animate-pulse">
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gray-200" />
            <div className="flex-1 space-y-2 pt-2">
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="h-12 bg-gray-200 rounded-2xl" />
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
      <h2 className="text-xl font-bold text-gray-800">No encontrado</h2>
      <p className="text-gray-500 text-center">Este {type} no existe o ya no está disponible.</p>
      <button onClick={() => navigate(-1 as any)} className="bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-xl">Volver</button>
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
