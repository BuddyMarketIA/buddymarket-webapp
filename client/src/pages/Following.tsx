import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";
import { getLoginUrl } from "@/const";

type Tab = "experts" | "makers";
type SortOrder = "popularity" | "name" | "recent";

// ─── Specialty options ────────────────────────────────────────────────────────

const EXPERT_SPECIALTIES = [
  { value: "all", label: "Todos" },
  { value: "perdida_peso", label: "Pérdida de peso" },
  { value: "ganancia_muscular", label: "Ganancia muscular" },
  { value: "definicion", label: "Definición" },
  { value: "dieta_equilibrada", label: "Dieta equilibrada" },
  { value: "rendimiento", label: "Rendimiento" },
  { value: "bienestar", label: "Bienestar" },
  { value: "vegano", label: "Vegano" },
];

const MAKER_SPECIALTIES = [
  { value: "all", label: "Todos" },
  { value: "mediterranea", label: "Mediterránea" },
  { value: "fitness", label: "Fitness" },
  { value: "reposteria", label: "Repostería" },
  { value: "vegana", label: "Vegana" },
  { value: "rapida", label: "Rápida" },
  { value: "pan", label: "Pan y masas" },
  { value: "internacional", label: "Internacional" },
];

const SORT_OPTIONS: { value: SortOrder; label: string; icon: string }[] = [
  { value: "popularity", label: "Popularidad", icon: "🔥" },
  { value: "name", label: "Nombre A-Z", icon: "🔤" },
  { value: "recent", label: "Más recientes", icon: "🕐" },
];

// ─── FollowCard ───────────────────────────────────────────────────────────────

function FollowCard({
  name,
  specialty,
  avatarUrl,
  followersCount,
  verified,
  badge,
  badgeColor,
  href,
  onUnfollow,
  unfollowLoading,
}: {
  name: string;
  specialty?: string | null;
  avatarUrl?: string | null;
  followersCount: number;
  verified: boolean;
  badge: string;
  badgeColor: string;
  href: string;
  onUnfollow: () => void;
  unfollowLoading: boolean;
}) {
  const [, navigate] = useLocation();

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className={`h-1.5 bg-gradient-to-r ${badgeColor}`} />
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => navigate(href)} className="relative flex-shrink-0">
          <img
            src={avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F97316&color=fff&size=80`}
            alt={name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-orange-100"
          />
          {verified && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </button>

        <button onClick={() => navigate(href)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r ${badgeColor} text-white flex-shrink-0`}>
              {badge}
            </span>
          </div>
          {specialty && <p className="text-xs text-orange-600 font-medium truncate">{specialty}</p>}
          <p className="text-xs text-gray-400 mt-0.5">
            {followersCount >= 1000 ? `${(followersCount / 1000).toFixed(1)}k` : followersCount} seguidores
          </p>
        </button>

        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(href)}
            className="text-xs font-semibold text-orange-600 border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors"
          >
            Ver perfil
          </button>
          <button
            onClick={onUnfollow}
            disabled={unfollowLoading}
            className="text-xs font-semibold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
          >
            {unfollowLoading ? "..." : "Dejar de seguir"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Following() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("experts");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("popularity");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const utils = trpc.useUtils();

  const { data: followingExperts = [], isLoading: loadingExperts } = trpc.buddyExperts.getFollowing.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: followingMakers = [], isLoading: loadingMakers } = trpc.buddyMakers.getFollowing.useQuery(undefined, {
    enabled: !!user,
  });

  const unfollowExpert = trpc.buddyExperts.follow.useMutation({
    onSuccess: () => {
      toast.success("Has dejado de seguir al experto");
      utils.buddyExperts.getFollowing.invalidate();
    },
    onError: () => toast.error("Error al dejar de seguir"),
  });

  const unfollowMaker = trpc.buddyMakers.follow.useMutation({
    onSuccess: () => {
      toast.success("Has dejado de seguir al maker");
      utils.buddyMakers.getFollowing.invalidate();
    },
    onError: () => toast.error("Error al dejar de seguir"),
  });

  // Reset specialty filter when switching tabs
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSpecialtyFilter("all");
  };

  // Filter + sort logic
  const filteredExperts = useMemo(() => {
    let list = [...followingExperts];
    if (specialtyFilter !== "all") {
      list = list.filter((row: any) =>
        row.expert?.category === specialtyFilter ||
        row.expert?.specialty?.toLowerCase().includes(specialtyFilter.replace(/_/g, " "))
      );
    }
    if (sortOrder === "popularity") list.sort((a: any, b: any) => (b.expert?.followersCount ?? 0) - (a.expert?.followersCount ?? 0));
    else if (sortOrder === "name") list.sort((a: any, b: any) => (a.expert?.displayName ?? "").localeCompare(b.expert?.displayName ?? ""));
    return list;
  }, [followingExperts, specialtyFilter, sortOrder]);

  const filteredMakers = useMemo(() => {
    let list = [...followingMakers];
    if (specialtyFilter !== "all") {
      list = list.filter((row: any) =>
        row.maker?.specialty?.toLowerCase().includes(specialtyFilter.replace(/_/g, " "))
      );
    }
    if (sortOrder === "popularity") list.sort((a: any, b: any) => (b.maker?.followersCount ?? 0) - (a.maker?.followersCount ?? 0));
    else if (sortOrder === "name") list.sort((a: any, b: any) => (a.maker?.displayName ?? "").localeCompare(b.maker?.displayName ?? ""));
    return list;
  }, [followingMakers, specialtyFilter, sortOrder]);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFF8F0] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-6xl">👥</div>
        <h2 className="text-xl font-bold text-gray-800">Inicia sesión para ver a quién sigues</h2>
        <p className="text-gray-500">Sigue a BuddyExperts y BuddyMakers para ver su contenido aquí.</p>
        <a href={getLoginUrl()} className="bg-orange-500 text-white font-bold px-6 py-3 rounded-2xl hover:bg-orange-600 transition-colors">
          Iniciar sesión
        </a>
      </div>
    );
  }

  const tabs = [
    { id: "experts" as Tab, label: "BuddyExperts", icon: "👨‍⚕️", count: followingExperts.length },
    { id: "makers" as Tab, label: "BuddyMakers", icon: "👨‍🍳", count: followingMakers.length },
  ];

  const specialties = activeTab === "experts" ? EXPERT_SPECIALTIES : MAKER_SPECIALTIES;
  const currentList = activeTab === "experts" ? filteredExperts : filteredMakers;
  const isLoading = activeTab === "experts" ? loadingExperts : loadingMakers;
  const totalFollowing = activeTab === "experts" ? followingExperts.length : followingMakers.length;
  const activeSortLabel = SORT_OPTIONS.find((s) => s.value === sortOrder)?.label ?? "Popularidad";

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-orange-100 px-4 pt-4 pb-0 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Siguiendo</h1>
            <p className="text-xs text-gray-500">
              {followingExperts.length + followingMakers.length} buddies seguidos
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white text-lg shadow-md">
            👥
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div className="bg-white border-b border-orange-50 px-4 py-3 space-y-3">
        {/* Sort selector */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ordenar por</p>
          <div className="relative">
            <button
              onClick={() => setShowSortMenu((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-bold text-orange-600 border border-orange-200 px-3 py-1.5 rounded-xl hover:bg-orange-50 transition-colors"
            >
              <span>{SORT_OPTIONS.find((s) => s.value === sortOrder)?.icon}</span>
              <span>{activeSortLabel}</span>
              <svg className={`w-3 h-3 transition-transform ${showSortMenu ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-orange-100 rounded-2xl shadow-lg z-30 overflow-hidden min-w-[160px]">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setSortOrder(opt.value); setShowSortMenu(false); }}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-left transition-colors ${
                      sortOrder === opt.value
                        ? "bg-orange-50 text-orange-600"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                    {sortOrder === opt.value && (
                      <svg className="w-4 h-4 ml-auto text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Specialty chips */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Especialidad</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {specialties.map((sp) => (
              <button
                key={sp.value}
                onClick={() => setSpecialtyFilter(sp.value)}
                className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                  specialtyFilter === sp.value
                    ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300 hover:text-orange-600"
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Results counter ── */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {isLoading ? "Cargando..." : (
            <>
              <span className="font-bold text-gray-800">{currentList.length}</span>
              {specialtyFilter !== "all" || sortOrder !== "popularity"
                ? ` de ${totalFollowing} resultados`
                : ` ${activeTab === "experts" ? "expertos" : "makers"} seguidos`}
            </>
          )}
        </p>
        {(specialtyFilter !== "all") && (
          <button
            onClick={() => setSpecialtyFilter("all")}
            className="text-xs font-semibold text-orange-500 hover:text-orange-700 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            Limpiar filtro
          </button>
        )}
      </div>

      {/* ── List ── */}
      <div className="px-4 py-3 space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-orange-100" />
            ))}
          </>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">
              {specialtyFilter !== "all" ? "🔍" : (activeTab === "experts" ? "👨‍⚕️" : "👨‍🍳")}
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              {specialtyFilter !== "all"
                ? "Sin resultados para este filtro"
                : `Aún no sigues a ningún ${activeTab === "experts" ? "experto" : "maker"}`}
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              {specialtyFilter !== "all"
                ? "Prueba con otra especialidad o elimina el filtro."
                : `Descubre ${activeTab === "experts" ? "nutricionistas y dietistas" : "creadores de recetas"} verificados y síguelos para verlos aquí.`}
            </p>
            {specialtyFilter !== "all" ? (
              <button
                onClick={() => setSpecialtyFilter("all")}
                className="inline-block bg-white border border-orange-300 text-orange-600 font-bold px-6 py-2.5 rounded-2xl hover:bg-orange-50 transition-colors"
              >
                Ver todos
              </button>
            ) : (
              <a
                href={activeTab === "experts" ? "/app/buddy-experts" : "/app/buddy-makers"}
                className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-6 py-2.5 rounded-2xl hover:opacity-90 transition-opacity"
              >
                Explorar {activeTab === "experts" ? "BuddyExperts" : "BuddyMakers"} →
              </a>
            )}
          </div>
        ) : (
          <>
            {activeTab === "experts" &&
              filteredExperts.map((row: any, i: number) => {
                const expert = row.expert;
                if (!expert) return null;
                return (
                  <FollowCard
                    key={i}
                    name={expert.displayName}
                    specialty={expert.specialty}
                    avatarUrl={expert.avatarUrl}
                    followersCount={expert.followersCount}
                    verified={expert.verified ?? false}
                    badge="Expert"
                    badgeColor="from-orange-500 to-red-500"
                    href={`/app/buddy-experts/${expert.id}`}
                    onUnfollow={() => unfollowExpert.mutate({ expertId: expert.id })}
                    unfollowLoading={unfollowExpert.isPending}
                  />
                );
              })}
            {activeTab === "makers" &&
              filteredMakers.map((row: any, i: number) => {
                const maker = row.maker;
                if (!maker) return null;
                return (
                  <FollowCard
                    key={i}
                    name={maker.displayName}
                    specialty={maker.specialty}
                    avatarUrl={maker.avatarUrl}
                    followersCount={maker.followersCount}
                    verified={maker.verified ?? false}
                    badge="Maker"
                    badgeColor="from-pink-500 to-orange-500"
                    href={`/app/buddy-makers/${maker.id}`}
                    onUnfollow={() => unfollowMaker.mutate({ makerId: maker.id })}
                    unfollowLoading={unfollowMaker.isPending}
                  />
                );
              })}
          </>
        )}
      </div>

      {/* Close sort menu on outside click */}
      {showSortMenu && (
        <div className="fixed inset-0 z-20" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
}
