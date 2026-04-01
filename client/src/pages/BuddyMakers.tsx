import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ─── Demo data (shown when DB is empty) ──────────────────────────────────────

const DEMO_MAKERS = [
  {
    maker: {
      id: 1, displayName: "Ana Cocina Sana", specialty: "Cocina mediterránea", bio: "Recetas saludables y deliciosas con ingredientes de temporada. Más de 500 recetas publicadas.", avatarUrl: "https://images.unsplash.com/photo-1607631568010-a87245c0daf8?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=600&q=80", instagramHandle: "anacocinasana", followersCount: 45200, recipesCount: 312, rating: 4.9, verified: true, featured: true,
    },
    user: { name: "Ana García", imageUrl: null },
  },
  {
    maker: {
      id: 2, displayName: "Fit Kitchen", specialty: "Cocina fitness", bio: "Recetas altas en proteína para deportistas y amantes del fitness. Sin sacrificar el sabor.", avatarUrl: "https://images.unsplash.com/photo-1583394293214-0b3b9e8a0c3f?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80", instagramHandle: "fitkitchenspain", followersCount: 89300, recipesCount: 187, rating: 4.8, verified: true, featured: true,
    },
    user: { name: "Carlos Fitness", imageUrl: null },
  },
  {
    maker: {
      id: 3, displayName: "Dulces sin culpa", specialty: "Repostería saludable", bio: "Postres y dulces saludables sin azúcar refinado. Porque disfrutar también es parte de una dieta equilibrada.", avatarUrl: "https://images.unsplash.com/photo-1551963831-b3b1ca40c98e?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80", instagramHandle: "dulcessinculpa", followersCount: 32100, recipesCount: 98, rating: 4.7, verified: true, featured: false,
    },
    user: { name: "Laura Dulce", imageUrl: null },
  },
  {
    maker: {
      id: 4, displayName: "Veggie Lovers", specialty: "Cocina vegana", bio: "Recetas 100% plant-based llenas de sabor y nutrientes. Demostrando que comer vegano puede ser increíble.", avatarUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&q=80", instagramHandle: "veggielovers_es", followersCount: 21800, recipesCount: 245, rating: 4.6, verified: true, featured: false,
    },
    user: { name: "Pablo Verde", imageUrl: null },
  },
  {
    maker: {
      id: 5, displayName: "Cocina Rápida Pro", specialty: "Recetas rápidas", bio: "Recetas deliciosas en menos de 20 minutos. Para los que quieren comer bien pero no tienen tiempo.", avatarUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80", instagramHandle: "cocinarapidapro", followersCount: 67500, recipesCount: 420, rating: 4.8, verified: true, featured: true,
    },
    user: { name: "Marta Rápida", imageUrl: null },
  },
  {
    maker: {
      id: 6, displayName: "Panadería Artesanal", specialty: "Pan y masas", bio: "El arte del pan casero. Fermentaciones largas, harinas integrales y el sabor de siempre.", avatarUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&q=80", coverUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80", instagramHandle: "panaderiaartesanal", followersCount: 18400, recipesCount: 76, rating: 4.9, verified: false, featured: false,
    },
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

// ─── Maker card ───────────────────────────────────────────────────────────────

function MakerCard({ row, onFollow }: { row: any; onFollow: (id: number) => void }) {
  const maker = row.maker;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 border border-orange-100 group">
      {/* Cover */}
      <div className="relative h-24 overflow-hidden">
        {maker.coverUrl ? (
          <img src={maker.coverUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-orange-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {maker.verified && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            ✓ Verificado
          </span>
        )}
        {maker.featured && (
          <span className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            ⭐ Top
          </span>
        )}
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-end gap-3 -mt-7 mb-3">
          <img
            src={maker.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(maker.displayName)}&background=F97316&color=fff&size=80`}
            alt={maker.displayName}
            className="w-14 h-14 rounded-2xl border-4 border-white shadow-md object-cover"
          />
          <div className="pb-1 flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm truncate">{maker.displayName}</h3>
            <p className="text-xs text-orange-600 font-medium">{maker.specialty}</p>
          </div>
        </div>

        {maker.bio && (
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{maker.bio}</p>
        )}

        {/* Stats */}
        <div className="flex gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>👥</span>
            <span className="font-semibold text-gray-700">
              {maker.followersCount >= 1000 ? `${(maker.followersCount / 1000).toFixed(1)}k` : maker.followersCount}
            </span>
            <span>seguidores</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>🍽️</span>
            <span className="font-semibold text-gray-700">{maker.recipesCount}</span>
            <span>recetas</span>
          </div>
          {maker.rating > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>⭐</span>
              <span className="font-semibold text-gray-700">{maker.rating?.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Instagram */}
        {maker.instagramHandle && (
          <a
            href={`https://instagram.com/${maker.instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-pink-600 font-semibold mb-3 hover:text-pink-700"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            @{maker.instagramHandle}
          </a>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onFollow(maker.id)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
          >
            Seguir
          </button>
          <button
            onClick={() => toast.info(`Ver recetas de ${maker.displayName} — próximamente`)}
            className="flex-1 border border-orange-200 text-orange-600 hover:bg-orange-50 text-xs font-semibold py-2 rounded-xl transition-colors"
          >
            Ver recetas
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
        {/* Maker info */}
        <div className="flex items-center gap-2 mb-2">
          <img src={recipe.makerAvatar} alt={recipe.makerName} className="w-6 h-6 rounded-full object-cover" />
          <p className="text-xs font-semibold text-gray-700 flex-1 truncate">{recipe.makerName}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>🔥</span>
            <span className="font-semibold text-gray-700">{recipe.calories}</span>
            <span>kcal</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span>⏱️</span>
            <span className="font-semibold text-gray-700">{recipe.time}</span>
            <span>min</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
            <span>❤️</span>
            <span className="font-semibold text-gray-700">{recipe.likes >= 1000 ? `${(recipe.likes / 1000).toFixed(1)}k` : recipe.likes}</span>
          </div>
        </div>

        <button
          onClick={() => toast.success("Receta guardada en tus favoritos")}
          className="w-full bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-semibold py-1.5 rounded-xl transition-colors border border-orange-200"
        >
          + Guardar receta
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BuddyMakers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("makers");

  const { data: makers = [], isLoading } = trpc.buddyMakers.list.useQuery(undefined, { staleTime: 60_000 });

  const followMutation = trpc.buddyMakers.follow.useMutation({
    onSuccess: (data) => toast.success(data.following ? "Siguiendo al maker" : "Has dejado de seguir al maker"),
    onError: () => toast.error("Inicia sesión para seguir a makers"),
  });

  // Use DB data if available, otherwise show demo data
  const displayMakers = makers.length > 0 ? makers : DEMO_MAKERS;

  const tabs = [
    { id: "makers" as Tab, label: "BuddyMakers", icon: "👨‍🍳", count: displayMakers.length },
    { id: "recipes" as Tab, label: "Recetas destacadas", icon: "🍽️", count: DEMO_RECIPES.length },
  ];

  return (
    <div className="min-h-screen bg-[#FFF8F0]">
      {/* Sticky header */}
      <div className="bg-white border-b border-orange-100 px-4 pt-4 pb-0 sticky top-0 z-20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">BuddyMakers</h1>
            <p className="text-xs text-gray-500">Creadores de recetas y contenido culinario</p>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white text-lg shadow-md">
            👨‍🍳
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
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.id ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Hero */}
        {activeTab === "makers" ? (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-pink-500 to-orange-500 p-4 text-white">
            <p className="text-xs font-semibold opacity-80 mb-1">🍽️ Creadores de recetas</p>
            <h2 className="text-lg font-bold mb-1">Descubre a los mejores chefs</h2>
            <p className="text-xs opacity-80 mb-3">Sigue a creadores de contenido culinario, guarda sus recetas y descubre nuevas formas de comer sano y delicioso.</p>
            <div className="flex gap-2">
              <div className="bg-white/20 rounded-xl px-3 py-1.5 text-xs font-semibold">🍽️ Recetas gratis</div>
              <div className="bg-white/20 rounded-xl px-3 py-1.5 text-xs font-semibold">📱 Estilo Instagram</div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-orange-400 to-red-500 p-4 text-white">
            <p className="text-xs font-semibold opacity-80 mb-1">⭐ Recetas más populares</p>
            <h2 className="text-lg font-bold mb-1">Lo más guardado esta semana</h2>
            <p className="text-xs opacity-80">Las recetas más guardadas y valoradas por la comunidad BuddyMarket esta semana.</p>
          </div>
        )}

        {/* Content */}
        {activeTab === "makers" ? (
          isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-orange-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {displayMakers.map((row: any, i: number) => (
                <MakerCard
                  key={i}
                  row={row}
                  onFollow={(id) => followMutation.mutate({ makerId: id })}
                />
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DEMO_RECIPES.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}

        {/* Become a maker CTA */}
        <div className="bg-gradient-to-r from-pink-50 to-orange-50 rounded-2xl p-4 border border-orange-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center text-white text-xl flex-shrink-0">
              📸
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm">¿Creas contenido de cocina?</h3>
              <p className="text-xs text-gray-500 mt-0.5">Publica tus recetas, gana seguidores y monetiza tu contenido.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { icon: "🍽️", label: "Publica recetas", desc: "Gratis siempre" },
              { icon: "👥", label: "Gana seguidores", desc: "Comunidad activa" },
              { icon: "💰", label: "80% ingresos", desc: "Recetas premium" },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl p-2 text-center">
                <div className="text-lg mb-0.5">{item.icon}</div>
                <p className="text-xs font-bold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => toast.info("Registro de BuddyMaker — próximamente")}
            className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
          >
            Convertirme en BuddyMaker →
          </button>
        </div>

        {/* Social platforms */}
        <div className="bg-white rounded-2xl p-4 border border-orange-100">
          <h3 className="font-bold text-gray-900 text-sm mb-3">Conecta tus redes sociales</h3>
          <div className="space-y-2">
            {[
              { icon: "📸", name: "Instagram", desc: "Comparte tus recetas con fotos increíbles", color: "bg-pink-50 text-pink-600 border-pink-200" },
              { icon: "🎵", name: "TikTok", desc: "Vídeos cortos de tus recetas paso a paso", color: "bg-gray-50 text-gray-700 border-gray-200" },
              { icon: "▶️", name: "YouTube", desc: "Tutoriales completos y recetas en detalle", color: "bg-red-50 text-red-600 border-red-200" },
            ].map((platform, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${platform.color}`}>
                <span className="text-xl">{platform.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold">{platform.name}</p>
                  <p className="text-xs opacity-70">{platform.desc}</p>
                </div>
                <button
                  onClick={() => toast.info(`Conectar ${platform.name} — próximamente`)}
                  className="text-xs font-semibold px-3 py-1 rounded-lg bg-white border border-current"
                >
                  Conectar
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
