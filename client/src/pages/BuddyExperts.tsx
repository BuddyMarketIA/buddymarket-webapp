import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Gradient palettes ────────────────────────────────────────────────────────
const GRADIENTS = [
  "from-indigo-500 via-violet-500 to-purple-600",
  "from-teal-400 via-emerald-500 to-green-600",
  "from-rose-500 via-pink-500 to-fuchsia-600",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-violet-600 via-purple-600 to-indigo-700",
];

const CATEGORY_LABELS: Record<string, string> = {
  perdida_peso: "Pérdida de peso",
  ganancia_muscular: "Ganancia muscular",
  definicion: "Definición",
  dieta_equilibrada: "Dieta equilibrada",
  rendimiento: "Rendimiento",
  bienestar: "Bienestar",
  vegano: "Vegano",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  perdida_peso: "🔥",
  ganancia_muscular: "💪",
  definicion: "⚡",
  dieta_equilibrada: "🥗",
  rendimiento: "🏃",
  bienestar: "🌿",
  vegano: "🌱",
};

type Tab = "experts" | "testimonials";

// ─── Premium Expert Card ──────────────────────────────────────────────────────
function ExpertCard({
  row,
  onFollow,
  index,
  isFollowing,
}: {
  row: any;
  onFollow: (id: number) => void;
  index: number;
  isFollowing: boolean;
}) {
  const [, navigate] = useLocation();
  const expert = row.expert;
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const fmtCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0);

  return (
    <div
      className="group relative bg-white rounded-[28px] overflow-hidden cursor-pointer"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
      onClick={() => navigate(`/buddy-experts/${expert.id}`)}
    >
      {/* Gradient header */}
      <div className={`relative bg-gradient-to-br ${gradient} pt-5 pb-10 px-4 overflow-hidden`}>
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/10 blur-2xl" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="relative flex justify-between items-start mb-3">
          {expert.verified ? (
            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[13px] font-bold px-2.5 py-1 rounded-full border border-white/30">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Verificado
            </span>
          ) : (
            <span />
          )}
          {expert.featured && (
            <span className="bg-yellow-400 text-yellow-900 text-[13px] font-black px-2.5 py-1 rounded-full shadow-lg">
              ⭐ TOP
            </span>
          )}
        </div>
        {/* Avatar */}
        <div className="relative flex justify-center">
          {expert.avatarUrl ? (
            <img
              src={expert.avatarUrl}
              alt={expert.displayName}
              className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-white/30 backdrop-blur-sm flex items-center justify-center text-3xl border-4 border-white/30 shadow-xl">
              {expert.displayName?.[0] ?? "?"}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-3 flex flex-col items-center text-center gap-1">
        <h3 className="font-black text-gray-900 text-[14px] leading-tight line-clamp-1">
          {expert.displayName}
        </h3>
        <p className="text-[13px] text-indigo-500 font-bold">
          {expert.specialty ?? CATEGORY_LABELS[expert.category] ?? "Nutricionista"}
        </p>
        {expert.bio && (
          <p className="text-[13px] text-gray-400 leading-relaxed line-clamp-2 mt-0.5">{expert.bio}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex flex-col items-center">
            <span className="font-black text-gray-900 text-[13px]">
              {fmtCount(expert.followersCount ?? 0)}
            </span>
            <span className="text-[13px] text-gray-400 font-medium">seguidores</span>
          </div>
          <div className="w-px h-6 bg-gray-100" />
          <div className="flex flex-col items-center">
            <span className="font-black text-gray-900 text-[13px]">
              {expert.plansCount ?? 0}
            </span>
            <span className="text-[13px] text-gray-400 font-medium">planes</span>
          </div>
          {expert.rating && (
            <>
              <div className="w-px h-6 bg-gray-100" />
              <div className="flex flex-col items-center">
                <span className="font-black text-gray-900 text-[13px]">
                  {Number(expert.rating).toFixed(1)}⭐
                </span>
                <span className="text-[13px] text-gray-400 font-medium">valoración</span>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 w-full mt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFollow(expert.id);
            }}
            className={`flex-1 py-2.5 rounded-2xl text-sm font-black transition-all duration-200 ${
              isFollowing
                ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200"
            }`}
          >
            {isFollowing ? "✓ Siguiendo" : "+ Seguir"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `/buddy-experts/${expert.id}`;
            }}
            className="flex-1 py-2.5 rounded-2xl text-sm font-black bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
          >
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="bg-white rounded-[28px] overflow-hidden animate-pulse"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
    >
      <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-100" />
      <div className="p-4 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-2xl bg-gray-200 -mt-10" />
        <div className="h-4 w-28 bg-gray-200 rounded-full" />
        <div className="h-3 w-20 bg-gray-100 rounded-full" />
        <div className="h-10 w-full bg-gray-100 rounded-2xl" />
        <div className="flex gap-2 w-full">
          <div className="flex-1 h-11 bg-gray-200 rounded-2xl" />
          <div className="flex-1 h-11 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BuddyExperts() {
  const [tab, setTab] = useState<Tab>("experts");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { user } = useAuth();

  const expertsQuery = trpc.buddyExperts.list.useQuery(
    { category: selectedCategory ?? undefined },
    { staleTime: 30_000 }
  );
  const followingQuery = trpc.buddyExperts.getFollowing.useQuery(undefined, {
    enabled: !!user,
  });

  const followMutation = trpc.buddyExperts.follow.useMutation({
    onSuccess: (data) => {
      followingQuery.refetch();
      toast.success(data.following ? "¡Ahora sigues a este BuddyExpert! 🎉" : "Has dejado de seguir al experto");
    },
    onError: () => toast.error("Error al seguir"),
  });

  const followingIds = useMemo(
    () => new Set((followingQuery.data ?? []).map((r: any) => r.expert?.id).filter(Boolean)),
    [followingQuery.data]
  );

  const experts = useMemo(() => {
    const data = expertsQuery.data ?? [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (r: any) =>
        r.expert?.displayName?.toLowerCase().includes(q) ||
        r.expert?.specialty?.toLowerCase().includes(q) ||
        r.expert?.bio?.toLowerCase().includes(q)
    );
  }, [expertsQuery.data, search]);

  const handleFollow = (id: number) => {
    if (!user) {
      toast.error("Inicia sesión para seguir a expertos");
      return;
    }
    followMutation.mutate({ expertId: id });
  };

  return (
    <div className="min-h-screen bg-[#F7F3EF]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100/80 px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-black text-gray-900 tracking-tight">BuddyExperts</h1>
            <p className="text-sm text-gray-400 font-medium">Nutricionistas y dietistas certificados</p>
          </div>
          <span className="bg-indigo-50 text-indigo-600 text-[13px] font-black px-3 py-1.5 rounded-full border border-indigo-100">
            {experts.length} expertos
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Buscar expertos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-2xl text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-300 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[13px] font-black transition-all ${
              !selectedCategory
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            Todos
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] font-black transition-all ${
                selectedCategory === key
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_EMOJIS[key]} {label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {(["experts", "testimonials"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-black transition-all duration-200 ${
                tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "experts" ? "🎓 Expertos" : "💬 Testimonios"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {tab === "experts" && (
          <div>
            {expertsQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : experts.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="text-6xl">{search || selectedCategory ? "🔍" : "🎓"}</div>
                <h3 className="text-lg font-black text-gray-800">
                  {search || selectedCategory ? "Sin resultados" : "Aún no hay BuddyExperts"}
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  {search
                    ? `No se encontraron expertos para "${search}"`
                    : selectedCategory
                    ? "No hay expertos en esta categoría todavía."
                    : "Sé el primero en unirte como experto nutricional. Comparte tus conocimientos con la comunidad."}
                </p>
                {!search && !selectedCategory && (
                  <a
                    href="/buddy-application?type=expert"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200"
                  >
                    Solicitar ser BuddyExpert
                  </a>
                )}
                {(search || selectedCategory) && (
                  <button
                    onClick={() => { setSearch(""); setSelectedCategory(null); }}
                    className="inline-flex items-center gap-2 text-indigo-500 font-bold text-sm"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {experts.map((row: any, i: number) => (
                  <ExpertCard
                    key={row.expert?.id ?? i}
                    row={row}
                    onFollow={handleFollow}
                    index={i}
                    isFollowing={followingIds.has(row.expert?.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "testimonials" && (
          <div className="flex flex-col gap-3">
            {/* Testimonials are community-generated; show placeholder until real reviews exist */}
            <div className="text-center py-12 space-y-3">
              <div className="text-5xl">💬</div>
              <h3 className="text-base font-black text-gray-800">Testimonios de la comunidad</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Los testimonios aparecerán aquí cuando los usuarios valoren los planes de los expertos.
              </p>
              <button
                onClick={() => setTab("experts")}
                className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 font-bold text-sm px-5 py-2.5 rounded-2xl border border-indigo-100"
              >
                Ver expertos →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
