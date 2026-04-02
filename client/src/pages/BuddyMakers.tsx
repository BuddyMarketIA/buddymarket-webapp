import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_MAKERS = [
  { maker: { id: 1, displayName: "Ana Cocina Sana", specialty: "Cocina mediterránea", bio: "Recetas saludables y deliciosas con ingredientes de temporada. Más de 500 recetas publicadas.", avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/ensalada_mediterranea-A94kBrNm9EPozXzzbctf5A.webp", instagramHandle: "anacocinasana", followersCount: 45200, recipesCount: 312, rating: 4.9, verified: true, featured: true }, user: { name: "Ana García", imageUrl: null } },
  { maker: { id: 2, displayName: "Fit Kitchen", specialty: "Cocina fitness", bio: "Recetas altas en proteína para deportistas y amantes del fitness. Sin sacrificar el sabor.", avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp", instagramHandle: "fitkitchenspain", followersCount: 89300, recipesCount: 187, rating: 4.8, verified: true, featured: true }, user: { name: "Carlos Fitness", imageUrl: null } },
  { maker: { id: 3, displayName: "Dulces sin culpa", specialty: "Repostería saludable", bio: "Postres y dulces saludables sin azúcar refinado. Porque disfrutar también es parte de una dieta equilibrada.", avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/brownie_boniato-DunRnq5MEnxDMMdCy7DMcV.webp", instagramHandle: "dulcessinculpa", followersCount: 32100, recipesCount: 98, rating: 4.7, verified: true, featured: false }, user: { name: "Laura Dulce", imageUrl: null } },
  { maker: { id: 4, displayName: "Veggie Lovers", specialty: "Cocina vegana", bio: "Recetas 100% plant-based llenas de sabor y nutrientes. Demostrando que comer vegano puede ser increíble.", avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp", instagramHandle: "veggielovers_es", followersCount: 21800, recipesCount: 245, rating: 4.6, verified: true, featured: false }, user: { name: "Pablo Verde", imageUrl: null } },
  { maker: { id: 5, displayName: "Cocina Rápida Pro", specialty: "Recetas rápidas", bio: "Recetas deliciosas en menos de 20 minutos. Para los que quieren comer bien pero no tienen tiempo.", avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pasta_pesto_tomates-ShvKafyUPxQbbjm5oqKBmm.webp", instagramHandle: "cocinarapidapro", followersCount: 67500, recipesCount: 420, rating: 4.8, verified: true, featured: true }, user: { name: "Marta Rápida", imageUrl: null } },
  { maker: { id: 6, displayName: "Panadería Artesanal", specialty: "Pan y masas", bio: "El arte del pan casero. Fermentaciones largas, harinas integrales y el sabor de siempre.", avatarUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp", instagramHandle: "panaderiaartesanal", followersCount: 18400, recipesCount: 76, rating: 4.9, verified: false, featured: false }, user: { name: "Javier Pan", imageUrl: null } },
];

const DEMO_RECIPES = [
  { id: 1, title: "Bowl de açaí con granola", makerId: 1, makerName: "Ana Cocina Sana", makerAvatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/acai_bowl_granola-mcBZCMgPadkRDbMhMseJwZ.webp", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/acai_bowl_granola-mcBZCMgPadkRDbMhMseJwZ.webp", calories: 380, time: 10, likes: 2341, category: "Desayuno" },
  { id: 2, title: "Pollo teriyaki con arroz integral", makerId: 2, makerName: "Fit Kitchen", makerAvatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_teriyaki_arroz-BxhouEXinEgLMtuwwTB4gh.webp", calories: 520, time: 25, likes: 1876, category: "Comida" },
  { id: 3, title: "Brownie de boniato sin azúcar", makerId: 3, makerName: "Dulces sin culpa", makerAvatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/brownie_boniato-DunRnq5MEnxDMMdCy7DMcV.webp", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/brownie_boniato-DunRnq5MEnxDMMdCy7DMcV.webp", calories: 180, time: 35, likes: 3102, category: "Postre" },
  { id: 4, title: "Buddha bowl vegano", makerId: 4, makerName: "Veggie Lovers", makerAvatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/buddha_bowl_vegano-LbSLY3naX2TfQAWVDygbXL.webp", calories: 420, time: 20, likes: 987, category: "Comida" },
  { id: 5, title: "Tortilla de claras con espinacas", makerId: 2, makerName: "Fit Kitchen", makerAvatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pollo_al_horno_verduras-7EonsjzW4cbvVFKgkiA4g3.webp", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/tortilla_espinacas-cEYtBTb5hV7xgFpTkVy3TG.webp", calories: 210, time: 8, likes: 1543, category: "Cena" },
  { id: 6, title: "Pan de masa madre integral", makerId: 6, makerName: "Panadería Artesanal", makerAvatar: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp", image: "https://d2xsxph8kpxj0f.cloudfront.net/310519663235208479/ndjzMo7PxeapbzLjBHjsKj/pan_masa_madre-VDEXokc7GYSoNjo4bvjcTU.webp", calories: 120, time: 180, likes: 2876, category: "Pan" },
];

type Tab = "makers" | "/app/recipes";

// Gradient palettes per index for visual variety
const GRADIENTS = [
  "from-orange-400 via-pink-500 to-rose-500",
  "from-violet-500 via-purple-500 to-indigo-600",
  "from-emerald-400 via-teal-500 to-cyan-600",
  "from-amber-400 via-orange-500 to-red-500",
  "from-blue-500 via-indigo-500 to-violet-600",
  "from-rose-400 via-pink-500 to-fuchsia-600",
];

// ─── Instagram icon ───────────────────────────────────────────────────────────
function IgIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

// ─── Premium Maker Card ───────────────────────────────────────────────────────
function MakerCard({ row, onFollow, index }: { row: any; onFollow: (id: number) => void; index: number }) {
  const [, navigate] = useLocation();
  const [following, setFollowing] = useState(false);
  const maker = row.maker;
  const gradient = GRADIENTS[index % GRADIENTS.length];

  const handleFollow = () => {
    setFollowing(!following);
    onFollow(maker.id);
  };

  const fmtCount = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div
      className="group relative bg-white rounded-[28px] overflow-hidden cursor-pointer"
      style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" }}
      onClick={() => navigate(`/app/buddy-makers/${maker.id}`)}
    >
      {/* ── Gradient header with decorative blobs ── */}
      <div className={`relative bg-gradient-to-br ${gradient} pt-5 pb-10 px-4 overflow-hidden`}>
        {/* Decorative blobs for depth */}
        <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/10 blur-xl" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/10 blur-2xl" />

        {/* Badges */}
        <div className="relative flex justify-between items-start mb-3">
          {maker.verified ? (
            <span className="flex items-center gap-1 bg-white/20 backdrop-blur-sm text-white text-[13px] font-bold px-2.5 py-1 rounded-full border border-white/30">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              Verificado
            </span>
          ) : <span />}
          {maker.featured && (
            <span className="bg-yellow-400 text-yellow-900 text-[13px] font-black px-2.5 py-1 rounded-full shadow-lg">
              ⭐ TOP
            </span>
          )}
        </div>

        {/* Avatar — centred, with glow ring */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-white/30 blur-md scale-110" />
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden ring-[3px] ring-white/60 shadow-2xl">
              <img
                src={maker.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(maker.displayName)}&background=F97316&color=fff&size=80`}
                alt={maker.displayName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-4 pb-4 -mt-5">
        {/* Name pill floating over gradient */}
        <div className="flex flex-col items-center mb-3">
          <h3 className="font-black text-gray-900 text-[15px] text-center leading-tight tracking-tight">
            {maker.displayName}
          </h3>
          <p className="text-[13px] text-orange-500 font-bold mt-0.5 tracking-wide uppercase">
            {maker.specialty}
          </p>
        </div>

        {/* Bio */}
        {maker.bio && (
          <p className="text-[13px] text-gray-400 text-center line-clamp-2 leading-relaxed mb-3">
            {maker.bio}
          </p>
        )}

        {/* Stats — 3 columns with dividers */}
        <div className="flex items-center justify-center gap-0 mb-4 bg-gray-50 rounded-2xl p-2.5">
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[13px] font-black text-gray-900">{fmtCount(maker.followersCount)}</span>
            <span className="text-[13px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Fans</span>
          </div>
          <div className="w-px h-7 bg-gray-200" />
          <div className="flex-1 flex flex-col items-center">
            <span className="text-[13px] font-black text-gray-900">{maker.recipesCount}</span>
            <span className="text-[13px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Recetas</span>
          </div>
          {maker.rating > 0 && (
            <>
              <div className="w-px h-7 bg-gray-200" />
              <div className="flex-1 flex flex-col items-center">
                <span className="text-[13px] font-black text-gray-900">⭐{maker.rating?.toFixed(1)}</span>
                <span className="text-[13px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Rating</span>
              </div>
            </>
          )}
        </div>

        {/* Instagram */}
        {maker.instagramHandle && (
          <a
            href={`https://instagram.com/${maker.instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 mb-3 text-[13px] text-pink-500 font-bold hover:text-pink-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <IgIcon />
            @{maker.instagramHandle}
          </a>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleFollow}
            className={`flex-1 text-[13px] font-black py-3 rounded-2xl transition-all duration-200 ${
              following
                ? "bg-gray-100 text-gray-500 border-2 border-gray-200"
                : "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-200 hover:shadow-orange-300 active:scale-95"
            }`}
          >
            {following ? "✓ Siguiendo" : "Seguir"}
          </button>
          <button
            onClick={() => navigate(`/app/buddy-makers/${maker.id}`)}
            className="flex-1 border-2 border-gray-100 text-gray-700 hover:border-orange-200 hover:text-orange-600 text-[13px] font-black py-3 rounded-2xl transition-all duration-200 active:scale-95"
          >
            Ver perfil
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Recipe card ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe }: { recipe: typeof DEMO_RECIPES[0] }) {
  return (
    <div className="bg-white rounded-[24px] overflow-hidden group cursor-pointer" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
      <div className="relative h-36 overflow-hidden">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-2.5 left-3 right-3">
          <p className="text-white font-black text-[13px] line-clamp-2 leading-tight">{recipe.title}</p>
        </div>
        <span className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-[13px] font-black px-2 py-0.5 rounded-full">
          {recipe.category}
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <img src={recipe.makerAvatar} alt={recipe.makerName} className="w-5 h-5 rounded-full object-cover ring-1 ring-orange-100" />
          <p className="text-[13px] font-bold text-gray-600 truncate">{recipe.makerName}</p>
        </div>
        <div className="flex items-center justify-between text-[13px] text-gray-400 font-semibold">
          <span>🔥 {recipe.calories} kcal</span>
          <span>⏱ {recipe.time}m</span>
          <span>❤️ {recipe.likes.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-[28px] overflow-hidden animate-pulse" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
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
export default function BuddyMakers() {
  const [tab, setTab] = useState<Tab>("makers");
  const { user } = useAuth();
  const makersQuery = trpc.buddyMakers.list.useQuery({});
  const followMutation = trpc.buddyMakers.follow.useMutation({
    onSuccess: () => toast.success("¡Ahora sigues a este BuddyMaker! 🎉"),
    onError: () => toast.error("Error al seguir"),
  });

  const makers = (makersQuery.data && makersQuery.data.length > 0) ? makersQuery.data : DEMO_MAKERS;

  const handleFollow = (id: number) => {
    if (!user) { toast.error("Inicia sesión para seguir"); return; }
    followMutation.mutate({ makerId: id });
  };

  return (
    <div className="min-h-screen bg-[#F7F3EF]">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100/80 px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[22px] font-black text-gray-900 tracking-tight">BuddyMakers</h1>
            <p className="text-sm text-gray-400 font-medium">Creadores de contenido nutricional</p>
          </div>
          <span className="bg-orange-50 text-orange-600 text-[13px] font-black px-3 py-1.5 rounded-full border border-orange-100">
            {makers.length} makers
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {(["makers", "/app/recipes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-black transition-all duration-200 ${
                tab === t
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t === "makers" ? "👨‍🍳 Makers" : "🍽️ Recetas"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {tab === "makers" && (
          <div className="grid grid-cols-2 gap-3">
            {makersQuery.isLoading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : makers.map((row: any, i: number) => (
                  <MakerCard key={row.maker?.id ?? i} row={row} onFollow={handleFollow} index={i} />
                ))
            }
          </div>
        )}

        {tab === "/app/recipes" && (
          <div className="grid grid-cols-2 gap-3">
            {DEMO_RECIPES.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
