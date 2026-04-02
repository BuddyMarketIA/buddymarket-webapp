import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Demo data ────────────────────────────────────────────────────────────────

const DEMO_MAKERS = [
  {
    maker: { id: 1, displayName: "Ana Cocina Sana", specialty: "Cocina mediterránea", bio: "Recetas saludables y deliciosas con ingredientes de temporada. Más de 500 recetas publicadas.", avatarUrl: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80", instagramHandle: "anacocinasana", followersCount: 45200, recipesCount: 312, rating: 4.9, verified: true, featured: true },
    user: { name: "Ana García", imageUrl: null },
  },
  {
    maker: { id: 2, displayName: "Fit Kitchen", specialty: "Cocina fitness", bio: "Recetas altas en proteína para deportistas y amantes del fitness. Sin sacrificar el sabor.", avatarUrl: "https://images.unsplash.com/photo-1583394293214-0b3b9e8a0c3f?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", instagramHandle: "fitkitchenspain", followersCount: 89300, recipesCount: 187, rating: 4.8, verified: true, featured: true },
    user: { name: "Carlos Fitness", imageUrl: null },
  },
  {
    maker: { id: 3, displayName: "Dulces sin culpa", specialty: "Repostería saludable", bio: "Postres y dulces saludables sin azúcar refinado. Porque disfrutar también es parte de una dieta equilibrada.", avatarUrl: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80", instagramHandle: "dulcessinculpa", followersCount: 32100, recipesCount: 98, rating: 4.7, verified: true, featured: false },
    user: { name: "Laura Dulce", imageUrl: null },
  },
  {
    maker: { id: 4, displayName: "Veggie Lovers", specialty: "Cocina vegana", bio: "Recetas 100% plant-based llenas de sabor y nutrientes. Demostrando que comer vegano puede ser increíble.", avatarUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80", instagramHandle: "veggielovers_es", followersCount: 21800, recipesCount: 245, rating: 4.6, verified: true, featured: false },
    user: { name: "Pablo Verde", imageUrl: null },
  },
  {
    maker: { id: 5, displayName: "Cocina Rápida Pro", specialty: "Recetas rápidas", bio: "Recetas deliciosas en menos de 20 minutos. Para los que quieren comer bien pero no tienen tiempo.", avatarUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80", instagramHandle: "cocinarapidapro", followersCount: 67500, recipesCount: 420, rating: 4.8, verified: true, featured: true },
    user: { name: "Marta Rápida", imageUrl: null },
  },
  {
    maker: { id: 6, displayName: "Panadería Artesanal", specialty: "Pan y masas", bio: "El arte del pan casero. Fermentaciones largas, harinas integrales y el sabor de siempre.", avatarUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80", instagramHandle: "panaderiaartesanal", followersCount: 18400, recipesCount: 76, rating: 4.9, verified: false, featured: false },
    user: { name: "Javier Pan", imageUrl: null },
  },
];

const DEMO_RECIPES = [
  { id: 1, title: "Bowl de açaí con granola", makerId: 1, makerName: "Ana Cocina Sana", makerAvatar: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=80&q=80", image: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=400&q=80", calories: 380, time: 10, likes: 2341, category: "Desayuno" },
  { id: 2, title: "Pollo teriyaki con arroz integral", makerId: 2, makerName: "Fit Kitchen", makerAvatar: "https://images.unsplash.com/photo-1583394293214-0b3b9e8a0c3f?w=80&q=80", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80", calories: 520, time: 25, likes: 1876, category: "Comida" },
  { id: 3, title: "Brownie de boniato sin azúcar", makerId: 3, makerName: "Dulces sin culpa", makerAvatar: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=80&q=80", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80", calories: 180, time: 35, likes: 3102, category: "Postre" },
  { id: 4, title: "Buddha bowl vegano", makerId: 4, makerName: "Veggie Lovers", makerAvatar: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=80&q=80", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80", calories: 420, time: 20, likes: 987, category: "Comida" },
  { id: 5, title: "Tortilla de claras con espinacas", makerId: 2, makerName: "Fit Kitchen", makerAvatar: "https://images.unsplash.com/photo-1583394293214-0b3b9e8a0c3f?w=80&q=80", image: "https://images.unsplash.com/photo-1510693206972-df098062cb71?w=400&q=80", calories: 210, time: 8, likes: 1543, category: "Cena" },
  { id: 6, title: "Pan de masa madre integral", makerId: 6, makerName: "Panadería Artesanal", makerAvatar: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=80&q=80", image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80", calories: 120, time: 180, likes: 2876, category: "Pan" },
];

type Tab = "makers" | "recipes";

// ─── Instagram SVG ────────────────────────────────────────────────────────────
function IgIcon() {
  return (
    <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  );
}

// ─── Maker card — clean vertical layout, no overlap ───────────────────────────
function MakerCard({ row, onFollow }: { row: any; onFollow: (id: number) => void }) {
  const [, navigate] = useLocation();
  const maker = row.maker;

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md border border-gray-100 active:scale-[0.98] transition-transform duration-150">

      {/* ── Header with gradient background + avatar + badges ── */}
      <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 pt-6 pb-8 px-5">
        {/* Badges — top corners */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          {maker.verified ? (
            <span className="bg-white/95 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              ✓ Verificado
            </span>
          ) : <span />}
          {maker.featured && (
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              ⭐ Top
            </span>
          )}
        </div>

        {/* Avatar — large and centered */}
        <div className="flex justify-center mt-2">
          <div className="ring-4 ring-white/40 rounded-3xl shadow-xl overflow-hidden w-24 h-24 shrink-0">
            <img
              src={maker.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(maker.displayName)}&background=F97316&color=fff&size=96`}
              alt={maker.displayName}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col items-center px-5 pb-5 pt-4">

        {/* Name + specialty */}
        <h3 className="font-extrabold text-gray-900 text-base text-center leading-snug">
          {maker.displayName}
        </h3>
        <p className="text-xs text-orange-500 font-semibold mt-0.5 text-center">
          {maker.specialty}
        </p>

        {/* Bio */}
        {maker.bio && (
          <p className="text-xs text-gray-500 mt-2 text-center line-clamp-2 leading-relaxed">
            {maker.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-5 mt-4 w-full">
          <div className="flex flex-col items-center">
            <span className="text-sm font-extrabold text-gray-800">
              {maker.followersCount >= 1000 ? `${(maker.followersCount / 1000).toFixed(1)}k` : maker.followersCount}
            </span>
            <span className="text-[10px] text-gray-400 font-medium">seguidores</span>
          </div>
          <div className="w-px h-7 bg-gray-200" />
          <div className="flex flex-col items-center">
            <span className="text-sm font-extrabold text-gray-800">{maker.recipesCount}</span>
            <span className="text-[10px] text-gray-400 font-medium">recetas</span>
          </div>
          {maker.rating > 0 && (
            <>
              <div className="w-px h-7 bg-gray-200" />
              <div className="flex flex-col items-center">
                <span className="text-sm font-extrabold text-gray-800">⭐ {maker.rating?.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400 font-medium">valoración</span>
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
            className="flex items-center gap-1.5 mt-3 text-xs text-pink-500 font-semibold hover:text-pink-600"
            onClick={(e) => e.stopPropagation()}
          >
            <IgIcon />
            @{maker.instagramHandle}
          </a>
        )}

        {/* CTA buttons */}
        <div className="flex gap-2 mt-4 w-full">
          <button
            onClick={() => onFollow(maker.id)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold py-3 rounded-2xl transition-colors"
          >
            Seguir
          </button>
          <button
            onClick={() => navigate(`/buddy-makers/${maker.id}`)}
            className="flex-1 border-2 border-orange-200 text-orange-600 hover:bg-orange-50 active:bg-orange-100 text-sm font-bold py-3 rounded-2xl transition-colors"
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
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-orange-100 group">
      <div className="relative h-36 overflow-hidden">
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-white font-bold text-sm line-clamp-2">{recipe.title}</p>
        </div>
        <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {recipe.category}
        </span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <img src={recipe.makerAvatar} alt={recipe.makerName} className="w-6 h-6 rounded-full object-cover" />
          <p className="text-xs font-semibold text-gray-700 truncate">{recipe.makerName}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>🔥 {recipe.calories} kcal</span>
          <span>⏱ {recipe.time} min</span>
          <span>❤️ {recipe.likes.toLocaleString()}</span>
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
    onSuccess: () => toast.success("¡Ahora sigues a este BuddyMaker!"),
    onError: () => toast.error("Error al seguir"),
  });

  const makers = (makersQuery.data && makersQuery.data.length > 0) ? makersQuery.data : DEMO_MAKERS;

  const handleFollow = (id: number) => {
    if (!user) { toast.error("Inicia sesión para seguir"); return; }
    followMutation.mutate({ makerId: id });
  };

  return (
    <div className="min-h-screen bg-[#FFF8F3]">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 px-4 pt-4 pb-3 sticky top-0 z-10">
        <h1 className="text-xl font-extrabold text-gray-900 mb-3">BuddyMakers</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-orange-50 rounded-2xl p-1">
          {(["makers", "recipes"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t ? "bg-orange-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "makers" ? "👨‍🍳 Makers" : "🍽️ Recetas"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {tab === "makers" && (
          <>
            {makersQuery.isLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
                    <div className="h-36 bg-gray-200" />
                    <div className="p-4 flex flex-col items-center gap-2">
                      <div className="w-20 h-20 rounded-2xl bg-gray-200 -mt-10" />
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                      <div className="h-3 w-16 bg-gray-100 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {makers.map((row: any, i: number) => (
                  <MakerCard key={row.maker?.id ?? i} row={row} onFollow={handleFollow} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "recipes" && (
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
