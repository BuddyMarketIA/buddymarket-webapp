import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "@/components/sonner-a11y-shim";

// ─── Gradient palettes ────────────────────────────────────────────────────────
const GRADIENTS = [
  "from-indigo-500 via-violet-500 to-purple-600",
  "from-teal-400 via-emerald-500 to-green-600",
  "from-rose-500 via-pink-500 to-fuchsia-600",
  "from-blue-500 via-cyan-500 to-teal-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-violet-600 via-purple-600 to-indigo-700",
];

const CATEGORY_LABELS_KEYS: Record<string, string> = {
  perdida_peso: "buddyExperts.weightLoss",
  ganancia_muscular: "buddyExperts.muscleGain",
  definicion: "buddyExperts.definition",
  dieta_equilibrada: "buddyExperts.balancedDiet",
  rendimiento: "buddyExperts.performance",
  bienestar: "buddyExperts.wellness",
  vegano: "buddyExperts.vegan",
};
const CATEGORY_LABELS_DEFAULTS: Record<string, string> = {
  perdida_peso: "Weight loss",
  ganancia_muscular: "Muscle gain",
  definicion: "Definition",
  dieta_equilibrada: "Balanced diet",
  rendimiento: "Performance",
  bienestar: "Wellness",
  vegano: "Vegan",
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

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
      <span className="text-[10px] font-bold text-muted-foreground ml-0.5">{rating > 0 ? Number(rating).toFixed(1) : '—'}</span>
    </div>
  );
}

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
  const { t } = useTranslation();
  const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(CATEGORY_LABELS_KEYS).map(([k, tKey]) => [k, t(tKey, CATEGORY_LABELS_DEFAULTS[k])])
  );
  const [, navigate] = useLocation();
  const expert = row.expert;
  const expertAvatar = expert.avatarUrl || row.user?.imageUrl || null;
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const fmtCount = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n ?? 0);
  const categoryEmoji = CATEGORY_EMOJIS[expert.category] ?? "🩺";
  const monthlyPrice = expert.monthlyPrice ?? expert.planPrice ?? null;

  return (
    <div
      className="group relative bg-background rounded-[28px] overflow-hidden cursor-pointer flex flex-col"
      style={{
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)",
        transition: "box-shadow 0.35s cubic-bezier(.4,0,.2,1), transform 0.35s cubic-bezier(.4,0,.2,1)",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 20px 60px rgba(99,102,241,0.22), 0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px rgba(99,102,241,0.15)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-5px) scale(1.01)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0) scale(1)";
      }}
      onClick={() => navigate(`/app/buddy-experts/${expert.id}`)}
    >
      {/* ── Gradient header ── */}
      <div className={`relative bg-gradient-to-br ${gradient} h-[110px] overflow-visible`}>
        {/* Decorative blobs */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-background/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-black/15 blur-3xl" />
        <div className="absolute top-4 right-12 w-16 h-16 rounded-full bg-background/10 blur-2xl" />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1.5px, transparent 0)", backgroundSize: "14px 14px" }} />
        {/* Animated shine on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)" }} />
        {/* Badges */}
        <div className="relative flex justify-between items-start p-3">
          <div className="flex gap-1.5">
            {expert.verified && (
              <span className="flex items-center gap-1 bg-background/25 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/40 shadow-sm">
                <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                Verificado
              </span>
            )}
          </div>
          {expert.featured && (
            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 text-yellow-900 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg border border-yellow-300/60 tracking-wide">
              ⭐ TOP
            </span>
          )}
        </div>
        {/* Avatar */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-background/40 blur-md scale-110" />
            {expertAvatar ? (
              <img src={expertAvatar} alt={expert.displayName}
                className="relative w-[80px] h-[80px] rounded-2xl object-cover ring-[3px] ring-white shadow-2xl group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="relative w-[80px] h-[80px] rounded-2xl bg-background/30 backdrop-blur-sm flex items-center justify-center text-3xl font-black text-white ring-[3px] ring-white shadow-2xl">
                {expert.displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
            )}
            <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-background shadow-lg flex items-center justify-center text-base border border-border/50">
              {categoryEmoji}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="pt-14 px-4 pb-4 flex flex-col items-center text-center gap-1 flex-1">
        <h3 className="font-black text-foreground text-[15px] leading-tight line-clamp-1 w-full tracking-tight">
          {expert.displayName || row.user?.name || row.user?.email?.split('@')[0] || 'Nutricionista'}
        </h3>
        <p className="text-[11px] text-indigo-500 font-bold line-clamp-1 tracking-widest uppercase w-full">
          {expert.specialty ?? CATEGORY_LABELS[expert.category] ?? t("buddyExperts.nutritionist", "Nutricionista")}
        </p>

        {/* Rating stars */}
        <div className="flex items-center justify-center mt-0.5 mb-1">
          <StarRating rating={expert.rating ?? 0} />
          {expert.reviewsCount > 0 && (
            <span className="text-[10px] text-muted-foreground/70 ml-1">({fmtCount(expert.reviewsCount ?? 0)})</span>
          )}
        </div>

        {/* Bio */}
        {expert.bio && (
          <p className="text-[11px] text-muted-foreground/70 line-clamp-2 leading-relaxed mb-1 w-full">{expert.bio}</p>
        )}

        {/* Stats bar */}
        <div className="flex items-stretch w-full mt-1 mb-3 bg-muted/30/80 rounded-2xl overflow-hidden border border-border/50/80">
          <div className="flex-1 flex flex-col items-center py-2">
            <span className="font-black text-foreground text-[13px]">{fmtCount(expert.followersCount ?? 0)}</span>
            <span className="text-[9px] text-muted-foreground/70 font-semibold uppercase tracking-wider">Seguid.</span>
          </div>
          <div className="w-px bg-muted" />
          <div className="flex-1 flex flex-col items-center py-2">
            <span className="font-black text-foreground text-[13px]">{expert.plansCount ?? 0}</span>
            <span className="text-[9px] text-muted-foreground/70 font-semibold uppercase tracking-wider">Planes</span>
          </div>
          {monthlyPrice != null && (
            <>
              <div className="w-px bg-muted" />
              <div className="flex-1 flex flex-col items-center py-2">
                <span className="font-black text-indigo-600 text-[13px]">{monthlyPrice}€</span>
                <span className="text-[9px] text-muted-foreground/70 font-semibold uppercase tracking-wider">/mes</span>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 w-full mt-auto" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onFollow(expert.id)}
            className={`flex-1 py-2.5 rounded-2xl text-[12px] font-black transition-all duration-200 active:scale-95 ${
              isFollowing
                ? "bg-indigo-50 text-indigo-600 border-2 border-indigo-200"
                : "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200/60 hover:shadow-indigo-300/70"
            }`}
          >
            {isFollowing ? "✓ Siguiendo" : "+ Seguir"}
          </button>
          <button
            onClick={() => navigate(`/app/buddy-experts/${expert.id}`)}
            className="flex-1 py-2.5 rounded-2xl text-[12px] font-black bg-muted/30 text-foreground/80 hover:bg-muted/50 transition-all duration-200 border border-border active:scale-95"
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
      className="bg-background rounded-[28px] overflow-hidden animate-pulse"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
    >
      <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-100" />
      <div className="p-4 flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-2xl bg-muted -mt-10" />
        <div className="h-4 w-28 bg-muted rounded-full" />
        <div className="h-3 w-20 bg-muted/50 rounded-full" />
        <div className="h-10 w-full bg-muted/50 rounded-2xl" />
        <div className="flex gap-2 w-full">
          <div className="flex-1 h-11 bg-muted rounded-2xl" />
          <div className="flex-1 h-11 bg-muted/50 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function BuddyExperts() {
  const { t } = useTranslation();
  const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    Object.entries(CATEGORY_LABELS_KEYS).map(([k, tKey]) => [k, t(tKey, CATEGORY_LABELS_DEFAULTS[k])])
  );
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
      toast.success(data.following ? t("buddyExperts.nowFollowing", "You are now following this BuddyExpert! 🎉") : t("buddyExperts.unfollowed", "You stopped following the expert"));
    },
    onError: () => toast.error(t("buddyExperts.followError", "Error following")),
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
      toast.error(t("buddyExperts.loginToFollow", "Log in to follow experts"));
      return;
    }
    followMutation.mutate({ expertId: id });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background/80 backdrop-blur-xl border-b border-border/50/80 px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-black text-foreground tracking-tight">{t("buddyExperts.title", "BuddyExperts")}</h1>
            <p className="text-sm text-muted-foreground/70 font-medium">{t("buddyExperts.subtitle", "Certified nutritionists and dietitians")}</p>
          </div>
          <span className="bg-indigo-50 text-indigo-600 text-[13px] font-black px-3 py-1.5 rounded-full border border-indigo-100">
            {experts.length} expertos
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70"
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
            placeholder={t("buddyExperts.searchPlaceholder", "Search experts...")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-muted/50 rounded-2xl text-[13px] text-foreground placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-300 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-muted-foreground"
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
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
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
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {CATEGORY_EMOJIS[key]} {label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-2xl p-1">
          {(["experts", "testimonials"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-black transition-all duration-200 ${
                tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground/70 hover:text-muted-foreground"
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
                <h3 className="text-lg font-black text-foreground">
                  {search || selectedCategory ? t("buddyExperts.noResults", "No results") : t("buddyExperts.noExperts", "No BuddyExperts yet")}
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  {search
                    ? `No se encontraron expertos para "${search}"`
                    : selectedCategory
                    ? t("buddyExperts.noExpertsCategory", "No experts in this category yet.")
                    : t("buddyExperts.beFirst", "Be the first to join as a nutritional expert. Share your knowledge with the community.")}
                </p>
                {!search && !selectedCategory && (
                  <a
                    href="/app/buddy-application?type=expert"
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
              <h3 className="text-base font-black text-foreground">{t("buddyExperts.testimonials", "Community testimonials")}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                {t("buddyExperts.testimonialsEmpty", "Testimonials will appear here when users rate the experts' plans.")}
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
