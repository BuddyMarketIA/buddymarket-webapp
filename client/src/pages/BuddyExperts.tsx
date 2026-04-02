import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type Category = {
  id: string;
  label: string;
  emoji: string;
  color: string;
};

const CATEGORIES: Category[] = [
  { id: "all", label: "Todos", emoji: "✨", color: "bg-orange-100 text-orange-700" },
  { id: "perdida_peso", label: "Pérdida de peso", emoji: "🔥", color: "bg-red-100 text-red-700" },
  { id: "ganancia_muscular", label: "Ganancia muscular", emoji: "💪", color: "bg-blue-100 text-blue-700" },
  { id: "definicion", label: "Definición", emoji: "⚡", color: "bg-yellow-100 text-yellow-700" },
  { id: "dieta_equilibrada", label: "Dieta equilibrada", emoji: "🥗", color: "bg-green-100 text-green-700" },
  { id: "rendimiento", label: "Rendimiento", emoji: "🏆", color: "bg-purple-100 text-purple-700" },
  { id: "bienestar", label: "Bienestar", emoji: "🌿", color: "bg-teal-100 text-teal-700" },
  { id: "vegano", label: "Vegano", emoji: "🌱", color: "bg-lime-100 text-lime-700" },
];

type Tab = "experts" | "menus" | "plans";

// ─── Stat badge ──────────────────────────────────────────────────────────────

function StatBadge({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <span>{icon}</span>
      <span className="font-semibold text-gray-700">{value}</span>
      <span>{label}</span>
    </div>
  );
}

// ─── Expert card — clean vertical layout, no overlap ─────────────────────────

function ExpertCard({ row, onFollow }: { row: any; onFollow: (id: number) => void }) {
  const [, navigate] = useLocation();
  const expert = row.expert;
  const cat = CATEGORIES.find((c) => c.id === expert.category) ?? CATEGORIES[0];

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 active:scale-[0.98] transition-transform duration-150">

      {/* ── Cover image (taller so avatar sits cleanly below) ── */}
      <div className="relative h-36 overflow-hidden">
        {expert.coverUrl ? (
          <img src={expert.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Badges — top corners, well above the avatar */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {expert.verified ? (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              ✓ Verificado
            </span>
          ) : <span />}
          {expert.featured && (
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">⭐ Top</span>
          )}
        </div>
      </div>

      {/* ── Body — avatar centred, no negative margin into cover ── */}
      <div className="flex flex-col items-center px-5 pb-5">
        {/* Avatar */}
        <div className="-mt-10 mb-3 ring-4 ring-white rounded-2xl shadow-lg overflow-hidden w-20 h-20 shrink-0">
          <img
            src={expert.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName)}&background=F97316&color=fff&size=80`}
            alt={expert.displayName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name + specialty */}
        <h3 className="font-extrabold text-gray-900 text-base text-center leading-snug">
          {expert.displayName}
        </h3>
        <p className="text-xs text-orange-500 font-semibold mt-0.5 text-center">
          {expert.specialty}
        </p>

        {/* Category chip */}
        <span className={`mt-2 text-[10px] font-bold px-2.5 py-1 rounded-full ${cat.color}`}>
          {cat.emoji} {cat.label}
        </span>

        {/* Bio */}
        {expert.bio && (
          <p className="text-xs text-gray-500 mt-2 text-center line-clamp-2 leading-relaxed">{expert.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-5 mt-4 w-full">
          <div className="flex flex-col items-center">
            <span className="text-sm font-extrabold text-gray-800">
              {expert.followersCount >= 1000 ? `${(expert.followersCount / 1000).toFixed(1)}k` : expert.followersCount}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">seguidores</span>
          </div>
          <div className="w-px h-7 bg-gray-200" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-extrabold text-gray-800">{expert.plansCount}</span>
            <span className="text-[10px] text-gray-400 font-medium">planes</span>
          </div>
          {expert.rating > 0 && (
            <>
              <div className="w-px h-7 bg-gray-200" />
              <div className="flex flex-col items-center">
                <span className="text-sm font-extrabold text-gray-800">⭐ {expert.rating?.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400 font-medium">valoración</span>
              </div>
            </>
          )}
        </div>

        {/* CTA buttons */}
        <div className="flex gap-2 mt-4 w-full">
          <button
            onClick={() => onFollow(expert.id)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold py-3 rounded-2xl transition-colors"
          >
            Seguir
          </button>
          <button
            onClick={() => navigate(`/buddy-experts/${expert.id}`)}
            className="flex-1 border-2 border-orange-200 text-orange-600 hover:bg-orange-50 active:bg-orange-100 text-sm font-bold py-3 rounded-2xl transition-colors"
          >
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Menu card ───────────────────────────────────────────────────────────────

function MenuCard({ row }: { row: any }) {
  const menu = row.menu;
  const expert = row.expert;
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES.find((c) => c.id === menu.category) ?? CATEGORIES[0];

  let menuData: any = null;
  try { menuData = menu.menuData ? JSON.parse(menu.menuData) : null; } catch { menuData = null; }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-orange-100">
      <div className="relative h-36 overflow-hidden">
        {menu.coverUrl ? (
          <img src={menu.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-300 to-orange-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-sm line-clamp-2">{menu.title}</p>
          <p className="text-white/80 text-xs mt-0.5">{menu.dailyCalories} kcal/día</p>
        </div>
        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          🎁 GRATIS
        </span>
        <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
          {cat.emoji}
        </span>
      </div>

      <div className="p-4">
        {expert && (
          <div className="flex items-center gap-2 mb-3">
            <img
              src={expert.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName ?? "")}&background=F97316&color=fff&size=40`}
              alt={expert.displayName ?? ""}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-xs font-semibold text-gray-800">{expert.displayName}</p>
              <p className="text-xs text-orange-500">{expert.specialty}</p>
            </div>
            {expert.verified && <span className="ml-auto text-orange-500 text-xs font-bold">✓</span>}
          </div>
        )}

        {menu.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{menu.description}</p>
        )}

        <div className="flex gap-3 mb-3">
          <StatBadge icon="📋" value={menu.copiesCount} label="copias" />
          <StatBadge icon="❤️" value={menu.likesCount} label="likes" />
        </div>

        {menuData?.days && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full text-xs text-orange-600 font-semibold border border-orange-200 rounded-xl py-2 hover:bg-orange-50 transition-colors mb-2"
          >
            {expanded ? "▲ Ocultar menú" : "▼ Ver menú semanal completo"}
          </button>
        )}

        {expanded && menuData?.days && (
          <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
            {menuData.days.map((day: any, i: number) => (
              <div key={i} className="bg-orange-50 rounded-xl p-2">
                <p className="text-xs font-bold text-orange-700 mb-1">{day.day}</p>
                <div className="space-y-0.5">
                  {day.meals?.map((meal: any, j: number) => (
                    <p key={j} className="text-xs text-gray-600">
                      <span className="font-medium text-gray-700">{meal.name}:</span> {meal.food}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => toast.success("Menú copiado a tu planificador")}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2 rounded-xl transition-colors mt-2"
        >
          📋 Copiar este menú
        </button>
      </div>
    </div>
  );
}

// ─── Plan card ───────────────────────────────────────────────────────────────

function PlanCard({ row, onCopy }: { row: any; onCopy: (id: number) => void }) {
  const plan = row.plan;
  const expert = row.expert;
  const cat = CATEGORIES.find((c) => c.id === plan.category) ?? CATEGORIES[0];

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-orange-100">
      <div className="relative h-32 overflow-hidden">
        {plan.coverUrl ? (
          <img src={plan.coverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-white font-bold text-sm line-clamp-1">{plan.title}</p>
        </div>
        <span className={`absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full ${cat.color}`}>
          {cat.emoji} {cat.label}
        </span>
        {plan.isFeatured && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            ⭐ Destacado
          </span>
        )}
      </div>

      <div className="p-4">
        {expert && (
          <div className="flex items-center gap-2 mb-3">
            <img
              src={expert.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.displayName ?? "")}&background=F97316&color=fff&size=40`}
              alt={expert.displayName ?? ""}
              className="w-7 h-7 rounded-full object-cover"
            />
            <p className="text-xs font-semibold text-gray-700">{expert.displayName}</p>
            {expert.verified && <span className="ml-auto text-orange-500 text-xs">✓</span>}
          </div>
        )}

        {plan.description && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{plan.description}</p>
        )}

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-orange-50 rounded-xl p-2 text-center">
            <p className="text-xs font-bold text-orange-700">{plan.durationWeeks}sem</p>
            <p className="text-xs text-gray-500">duración</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-2 text-center">
            <p className="text-xs font-bold text-orange-700">{plan.dailyCalories}</p>
            <p className="text-xs text-gray-500">kcal/día</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-2 text-center">
            <p className="text-xs font-bold text-orange-700 capitalize">{plan.level}</p>
            <p className="text-xs text-gray-500">nivel</p>
          </div>
        </div>

        <div className="flex gap-2 items-center mb-3">
          <StatBadge icon="📋" value={plan.copiesCount} label="copias" />
          <StatBadge icon="❤️" value={plan.likesCount} label="likes" />
          {plan.price > 0 ? (
            <span className="ml-auto text-sm font-bold text-orange-600">{plan.price}€</span>
          ) : (
            <span className="ml-auto text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">GRATIS</span>
          )}
        </div>

        <button
          onClick={() => onCopy(plan.id)}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
        >
          {plan.price > 0 ? `💳 Obtener por ${plan.price}€` : "📋 Copiar plan"}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BuddyExperts() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("experts");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categoryParam = selectedCategory === "all" ? undefined : selectedCategory;

  const { data: experts = [], isLoading: loadingExperts, refetch: refetchExperts } = trpc.buddyExperts.list.useQuery(
    { category: categoryParam },
    { staleTime: 60_000 }
  );

  const { data: menus = [], isLoading: loadingMenus } = trpc.buddyExperts.getMenus.useQuery(
    { category: categoryParam },
    { staleTime: 60_000 }
  );

  const { data: plans = [], isLoading: loadingPlans } = trpc.buddyExperts.getAllPlans.useQuery(
    { category: categoryParam },
    { staleTime: 60_000 }
  );

  const seedMutation = trpc.buddyExperts.seedDemoExperts.useMutation({
    onSuccess: (data) => {
      if (data.seeded) {
        toast.success("Expertos demo creados correctamente");
        refetchExperts();
      } else {
        toast.info("Los expertos demo ya existen");
      }
    },
    onError: () => toast.error("Error al crear expertos demo"),
  });

  const followMutation = trpc.buddyExperts.follow.useMutation({
    onSuccess: (data) => {
      toast.success(data.following ? "Siguiendo al experto" : "Has dejado de seguir al experto");
    },
    onError: () => toast.error("Inicia sesión para seguir a expertos"),
  });

  const copyPlanMutation = trpc.buddyExperts.copyPlan.useMutation({
    onSuccess: () => toast.success("Plan copiado a tu planificador"),
    onError: () => toast.error("Inicia sesión para copiar planes"),
  });

  const tabs: { id: Tab; label: string; icon: string; count: number }[] = [
    { id: "experts", label: "Expertos", icon: "👨‍⚕️", count: experts.length },
    { id: "menus", label: "Menús semanales", icon: "🗓️", count: menus.length },
    { id: "plans", label: "Planes premium", icon: "⭐", count: plans.length },
  ];

  const isLoading = activeTab === "experts" ? loadingExperts : activeTab === "menus" ? loadingMenus : loadingPlans;
  const isEmpty = activeTab === "experts" ? experts.length === 0 : activeTab === "menus" ? menus.length === 0 : plans.length === 0;

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Sticky header with tabs */}
      <div className="bg-white border-b border-orange-100 px-4 pt-4 pb-0 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">BuddyExperts</h1>
            <p className="text-xs text-gray-500">Nutricionistas y dietistas verificados</p>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-xl font-medium transition-colors"
              >
                {seedMutation.isPending ? "..." : "Seed demo"}
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-lg shadow-md">
              👨‍⚕️
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Hero banner per tab */}
        {activeTab === "experts" && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
            <div className="relative z-10">
              <p className="text-xs font-semibold opacity-80 mb-1">🌟 Comunidad de expertos</p>
              <h2 className="text-lg font-bold mb-1">Come como los mejores</h2>
              <p className="text-xs opacity-80 mb-3">Sigue a nutricionistas certificados y copia sus menús semanales gratuitos. Accede a sus planes premium para resultados garantizados.</p>
              <div className="flex gap-2">
                <div className="bg-white/20 rounded-xl px-3 py-1.5 text-xs font-semibold">🗓️ Menús gratis</div>
                <div className="bg-white/20 rounded-xl px-3 py-1.5 text-xs font-semibold">⭐ Planes premium</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "menus" && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-green-500 to-teal-600 p-4 text-white">
            <p className="text-xs font-semibold opacity-80 mb-1">🎁 100% gratuito</p>
            <h2 className="text-lg font-bold mb-1">Menús semanales de expertos</h2>
            <p className="text-xs opacity-80">Los BuddyExperts comparten sus menús semanales de forma gratuita para que puedas conocer su estilo de alimentación. Cópialos a tu planificador con un clic.</p>
          </div>
        )}

        {activeTab === "plans" && (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
            <p className="text-xs font-semibold opacity-80 mb-1">⭐ Planes personalizados</p>
            <h2 className="text-lg font-bold mb-1">Planes premium de nutricionistas</h2>
            <p className="text-xs opacity-80">Planes de alimentación detallados creados por expertos certificados. Incluyen seguimiento, ajustes y soporte directo del nutricionista.</p>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? "bg-orange-500 text-white shadow-md scale-105"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-orange-300"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Content grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-orange-100" />
            ))}
          </div>
        ) : isEmpty ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">
              {activeTab === "experts" ? "👨‍⚕️" : activeTab === "menus" ? "🗓️" : "⭐"}
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              {activeTab === "experts" ? "No hay expertos todavía" : activeTab === "menus" ? "No hay menús disponibles" : "No hay planes disponibles"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {activeTab === "experts"
                ? "Los BuddyExperts verificados aparecerán aquí pronto."
                : activeTab === "menus"
                ? "Los menús semanales gratuitos de los expertos aparecerán aquí."
                : "Los planes premium de los expertos aparecerán aquí."}
            </p>
            {user?.role === "admin" && (
              <button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                {seedMutation.isPending ? "Creando..." : "Crear expertos demo"}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeTab === "experts" &&
              experts.map((row: any, i: number) => (
                <ExpertCard key={i} row={row} onFollow={(id) => followMutation.mutate({ expertId: id })} />
              ))}
            {activeTab === "menus" &&
              menus.map((row: any, i: number) => <MenuCard key={i} row={row} />)}
            {activeTab === "plans" &&
              plans.map((row: any, i: number) => (
                <PlanCard key={i} row={row} onCopy={(id) => copyPlanMutation.mutate({ planId: id })} />
              ))}
          </div>
        )}

        {/* Become an expert CTA */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-4 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0">
              🚀
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm">¿Eres nutricionista o dietista?</h3>
              <p className="text-xs text-gray-500 mt-0.5">Comparte tus menús semanales, crea planes premium y gana el 80% de cada venta.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
            {[
              { icon: "🗓️", label: "Menús gratis", desc: "Para ganar seguidores" },
              { icon: "⭐", label: "Planes premium", desc: "Ingresos recurrentes" },
              { icon: "💳", label: "80% comisión", desc: "Pagos directos" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-2 text-center">
                <div className="text-lg mb-0.5">{item.icon}</div>
                <p className="text-xs font-bold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => toast.info("Solicitud de BuddyExpert — próximamente")}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            Convertirme en BuddyExpert →
          </button>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl p-4 border border-orange-100">
          <h3 className="font-bold text-gray-900 text-sm mb-3">¿Cómo funciona?</h3>
          <div className="space-y-3">
            {[
              { icon: "🗓️", title: "Menús semanales gratis", desc: "Los expertos comparten menús semanales gratuitos para que puedas conocer su estilo de alimentación y decidir si seguirles." },
              { icon: "👥", title: "Sigue a tus expertos", desc: "Sigue a los nutricionistas que más te gusten y recibe notificaciones cuando publiquen nuevos menús o planes." },
              { icon: "⭐", title: "Accede a planes premium", desc: "Compra planes de alimentación detallados con seguimiento personalizado. El experto recibe el 80% de cada venta." },
              { icon: "💳", title: "Pagos seguros con Stripe", desc: "Todos los pagos se procesan de forma segura. Los expertos cobran directamente en su cuenta bancaria." },
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center text-sm flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
